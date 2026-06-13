// Authentication middleware for API protection
const { verifyToken } = require('../lib/auth');

export function authenticateRoute(handler) {
  return async (req, res) => {
    try {
      // Extract token from Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - No token provided' 
        });
      }

      const token = authHeader.substring(7);
      const payload = verifyToken(token);

      if (!payload) {
        return res.status(401).json({ 
          success: false,
          error: 'Unauthorized - Invalid token' 
        });
      }

      // Attach user info to request
      req.user = payload;
      
      // Call the original handler
      return handler(req, res);
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(500).json({ 
        success: false,
        error: 'Authentication failed' 
      });
    }
  };
}

// Role-based authorization middleware
export function authorizeRole(...allowedRoles) {
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false,
        error: 'Forbidden - Insufficient permissions' 
      });
    }

    next();
  };
}

// Fleet-based authorization - users can only access their own fleet data
export function authorizeFleetAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }

  // If user is admin, allow access to all fleets
  if (req.user.role === 'admin') {
    return next();
  }

  // Otherwise, user can only access their own fleet
  const requestedFleetId = req.query.fleetId || req.body.fleetId;
  const userFleetId = req.user.fleetId;

  if (requestedFleetId && requestedFleetId !== userFleetId) {
    return res.status(403).json({ 
      success: false,
      error: 'Forbidden - Cannot access other fleet data' 
    });
  }

  next();
}

// Rate limiting middleware
const rateLimitMap = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 60 * 1000, // 1 minute
    max = 100, // 100 requests per window
    message = 'Too many requests, please try again later',
  } = options;

  return function(req, res, next) {
    // Get identifier (IP or user ID if authenticated)
    const identifier = req.user?.userId || req.socket.remoteAddress;
    const now = Date.now();
    
    // Get or create rate limit entry
    let rateLimitEntry = rateLimitMap.get(identifier);
    
    if (!rateLimitEntry || rateLimitEntry.resetTime < now) {
      rateLimitEntry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitMap.set(identifier, rateLimitEntry);
    }

    // Increment count
    rateLimitEntry.count++;

    // Check if limit exceeded
    if (rateLimitEntry.count > max) {
      const resetSeconds = Math.ceil((rateLimitEntry.resetTime - now) / 1000);
      
      return res.status(429).json({ 
        success: false,
        error: message,
        retryAfter: resetSeconds,
        limit: max,
        remaining: 0,
        reset: rateLimitEntry.resetTime,
      });
    }

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - rateLimitEntry.count);
    res.setHeader('X-RateLimit-Reset', rateLimitEntry.resetTime);

    next();
  };
}

// Request logging middleware
export function requestLogger(req, res, next) {
  const startTime = Date.now();
  
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`, {
    user: req.user?.userId || 'anonymous',
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent'],
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      user: req.user?.userId || 'anonymous',
    });
  });

  next();
}

// Error handling middleware
export function errorHandler(err, req, res, next) {
  console.error('Error occurred:', err);

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid JSON payload' 
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      success: false,
      error: 'Unauthorized' 
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

// Request validation middleware
export function validateRequest(schema) {
  return function(req, res, next) {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
      });
    }

    // Replace request body with validated data
    req.body = value;
    next();
  };
}

// Request ID middleware
export function requestId(req, res, next) {
  const requestId = req.headers['x-request-id'] || 
                    Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
}

module.exports = {
  authenticateRoute,
  authorizeRole,
  authorizeFleetAccess,
  rateLimit,
  requestLogger,
  errorHandler,
  validateRequest,
  requestId,
};