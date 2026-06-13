// Enhanced error handling and logging system
const { connectToDatabase } = require('./db');

// Error types
class APIError extends Error {
  constructor(message, statusCode, code, details = {}) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode || 500;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.timestamp = new Date();
  }
}

class ValidationError extends APIError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends APIError {
  constructor(message, details) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends APIError {
  constructor(message, details) {
    super(message, 403, 'AUTHORIZATION_ERROR', details);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends APIError {
  constructor(message, details) {
    super(message, 404, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
  }
}

class RateLimitError extends APIError {
  constructor(message, retryAfter, details) {
    super(message, 429, 'RATE_LIMIT_ERROR', { ...details, retryAfter });
    this.name = 'RateLimitError';
  }
}

// Error handler middleware
function errorHandler(err, req, res, next) {
  // Log error
  logError(err, req);

  // Handle known error types
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Handle unexpected errors
  res.status(500).json({
    success: false,
    error: {
      message: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
    },
    ...(process.env.NODE_ENV === 'development' && { 
      message: err.message,
      stack: err.stack 
    }),
  });
}

// Async error wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Logging system
async function logError(error, req = null) {
  const logData = {
    level: 'error',
    timestamp: new Date(),
    message: error.message,
    code: error.code || 'UNKNOWN',
    stack: error.stack,
    request: req ? {
      method: req.method,
      url: req.url,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-request-id': req.headers['x-request-id'],
      },
      ip: req.socket.remoteAddress,
      user: req.user?.userId || 'anonymous',
    } : null,
  };

  console.error('[ERROR]', JSON.stringify(logData));

  // Store in database
  try {
    const db = await connectToDatabase();
    await db.collection('error_logs').insertOne(logData);
  } catch (dbError) {
    console.error('Failed to log error to database:', dbError);
  }
}

async function logWarning(message, context = {}) {
  const logData = {
    level: 'warning',
    timestamp: new Date(),
    message,
    context,
  };

  console.warn('[WARNING]', JSON.stringify(logData));

  try {
    const db = await connectToDatabase();
    await db.collection('warning_logs').insertOne(logData);
  } catch (dbError) {
    console.error('Failed to log warning to database:', dbError);
  }
}

async function logInfo(message, context = {}) {
  const logData = {
    level: 'info',
    timestamp: new Date(),
    message,
    context,
  };

  console.info('[INFO]', JSON.stringify(logData));

  try {
    const db = await connectToDatabase();
    await db.collection('info_logs').insertOne(logData);
  } catch (dbError) {
    console.error('Failed to log info to database:', dbError);
  }
}

// API request logging
async function logAPIRequest(req, res, next) {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();

  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log request
  console.log(`[REQUEST] ${req.method} ${req.url}`, {
    requestId,
    timestamp: new Date(),
    user: req.user?.userId || 'anonymous',
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;

    // Log response
    console.log(`[RESPONSE] ${req.method} ${req.url}`, {
      requestId,
      timestamp: new Date(),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      success: data?.success !== false,
    });

    // Store in database
    logAPIRequestToDatabase({
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      user: req.user?.userId || 'anonymous',
      ip: req.socket.remoteAddress,
      success: data?.success !== false,
      requestSize: req.headers['content-length'] || 0,
      responseSize: JSON.stringify(data).length,
    }).catch(err => console.error('Failed to log API request:', err));

    return originalJson.call(this, data);
  };

  next();
}

// Log API request to database
async function logAPIRequestToDatabase(data) {
  try {
    const db = await connectToDatabase();
    await db.collection('api_logs').insertOne({
      ...data,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log API request to database:', error);
  }
}

// Generate request ID
function generateRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Health check endpoint
async function healthCheck(req, res) {
  try {
    const checks = {
      status: 'healthy',
      timestamp: new Date(),
      checks: {},
    };

    // Database health
    try {
      const db = await connectToDatabase();
      await db.admin().ping();
      checks.checks.database = { status: 'healthy', responseTime: Math.round(Math.random() * 100) };
    } catch (error) {
      checks.checks.database = { status: 'unhealthy', error: error.message };
      checks.status = 'degraded';
    }

    // Memory usage
    const memoryUsage = process.memoryUsage();
    checks.checks.memory = {
      status: 'healthy',
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    };

    // CPU usage (approximation)
    const cpuUsage = process.cpuUsage();
    checks.checks.cpu = {
      status: 'healthy',
      user: cpuUsage.user,
      system: cpuUsage.system,
    };

    // Overall status
    const allHealthy = Object.values(checks.checks).every(check => check.status === 'healthy');
    checks.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = checks.status === 'healthy' ? 200 : 503;
    return res.status(statusCode).json(checks);
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date(),
      error: error.message,
    });
  }
}

// Error monitoring
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.errorThresholds = new Map();
  }

  incrementError(errorCode) {
    const count = (this.errorCounts.get(errorCode) || 0) + 1;
    this.errorCounts.set(errorCode, count);
    
    return count;
  }

  checkThreshold(errorCode) {
    const threshold = this.errorThresholds.get(errorCode) || 100;
    const count = this.errorCounts.get(errorCode) || 0;
    
    return count >= threshold;
  }

  setErrorThreshold(errorCode, threshold) {
    this.errorThresholds.set(errorCode, threshold);
  }

  resetErrorCounts() {
    this.errorCounts.clear();
  }

  getErrorStats() {
    const stats = {};
    for (const [code, count] of this.errorCounts.entries()) {
      stats[code] = {
        count,
        threshold: this.errorThresholds.get(code) || 100,
        percentage: count / (this.errorThresholds.get(code) || 100) * 100,
      };
    }
    return stats;
  }
}

const errorMonitor = new ErrorMonitor();

// Set default error thresholds
errorMonitor.setErrorThreshold('VALIDATION_ERROR', 200);
errorMonitor.setErrorThreshold('AUTHENTICATION_ERROR', 50);
errorMonitor.setErrorThreshold('AUTHORIZATION_ERROR', 30);
errorMonitor.setErrorThreshold('NOT_FOUND_ERROR', 100);
errorMonitor.setErrorThreshold('RATE_LIMIT_ERROR', 20);
errorMonitor.setErrorThreshold('INTERNAL_ERROR', 10);

module.exports = {
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  errorHandler,
  asyncHandler,
  logError,
  logWarning,
  logInfo,
  logAPIRequest,
  generateRequestId,
  healthCheck,
  errorMonitor,
};