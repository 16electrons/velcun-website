# VELCUN Advanced Backend Features Documentation

## Overview
Complete backend infrastructure with production-ready features including authentication, webhooks, analytics, file handling, TMS integrations, and automated task scheduling.

---

## 1. Authentication & Authorization Middleware

### File: `api/lib/middleware.js`

### Features
- **JWT Authentication**: Token-based authentication for API protection
- **Role-Based Authorization**: Role-based access control (admin, user)
- **Fleet-Based Authorization**: Fleet data isolation and access control
- **Rate Limiting**: Configurable rate limiting to prevent abuse
- **Request Logging**: Comprehensive request/response logging
- **Error Handling**: Centralized error handling middleware
- **Request Validation**: Input validation middleware
- **Request ID Tracking**: Unique request identifiers for debugging

### Usage
```javascript
import { authenticateRoute, authorizeRole, rateLimit } from '../lib/middleware';

// Protect route with authentication
export default authenticateRoute(async (req, res) => {
  // Protected handler logic
  res.json({ user: req.user });
});

// Role-based authorization
export default authenticateRoute(
  authorizeRole('admin')(async (req, res) => {
    // Admin-only logic
  })
);

// Rate limiting
export default rateLimit({ max: 100, windowMs: 60000 })(handler);
```

### Rate Limiting Configuration
```javascript
const options = {
  windowMs: 60 * 1000,  // 1 minute
  max: 100,             // 100 requests per minute
  message: 'Too many requests',
};
```

### Response Headers
- `X-RateLimit-Limit`: Maximum requests per window
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time timestamp
- `X-Request-ID`: Unique request identifier

---

## 2. Webhook System

### File: `api/webhooks.js`

### Features
- **Webhook Registration**: Create and manage webhook subscriptions
- **Event-Based Triggers**: Automatically trigger on specific events
- **Retry Logic**: Configurable retry attempts and delays
- **Signature Verification**: HMAC signature verification
- **Delivery Tracking**: Webhook delivery status and logs
- **Statistics**: Success/failure tracking per webhook

### Supported Events
```javascript
WEBHOOK_EVENT_TYPES = {
  SETTLEMENT: 'settlement.paid',
  SETTLEMENT_FAILED: 'settlement.failed',
  LANE_OPTIMIZED: 'lane.optimized',
  DOCUMENT_PARSED: 'document.parsed',
  DOCUMENT_FAILED: 'document.failed',
  DRIVER_RISK_HIGH: 'driver.risk_high',
  BORDER_APPROVED: 'border.approved',
  BORDER_REJECTED: 'border.rejected',
  AUDIT_COMPLETED: 'audit.completed',
  USER_REGISTERED: 'user.registered',
  PILOT_SUBMITTED: 'pilot.submitted',
}
```

### Webhook Registration
```javascript
POST /api/webhooks
{
  "fleetId": "fleet-123",
  "name": "Payment Notifications",
  "eventType": "settlement.paid",
  "targetUrl": "https://your-domain.com/webhook",
  "secret": "your-webhook-secret",
  "isActive": true,
  "retryConfig": {
    "maxRetries": 3,
    "retryDelay": 5000
  }
}
```

### Webhook Payload
```javascript
{
  "timestamp": 1234567890,
  "eventType": "settlement.paid",
  "data": {
    "settlementId": "...",
    "amount": 2500.00,
    "invoiceNumber": "INV-001"
  }
}
```

### Signature Verification
```javascript
const crypto = require('crypto');
const message = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', secret)
  .update(message)
  .digest('hex');
```

---

## 3. Analytics & Monitoring

### File: `api/analytics.js`

### Features
- **Multi-Layer Analytics**: Metrics across all 5 automation layers
- **Real-Time Monitoring**: Current system health and performance
- **Trend Analysis**: Historical trends and patterns
- **Performance Metrics**: Response times, success rates, efficiency
- **Custom Reports**: Specific metric queries
- **System Health**: Database and API health checks

### Analytics Endpoints
```javascript
// Comprehensive analytics
GET /api/analytics?fleetId=fleet-123&dateRange={"startDate":"2024-01-01","endDate":"2024-01-31"}

// Specific metric
GET /api/analytics?metric=revenue&fleetId=fleet-123
GET /api/analytics?metric=cost&fleetId=fleet-123
GET /api/analytics?metric=efficiency&fleetId=fleet-123
GET /api/analytics?metric=retention&fleetId=fleet-123
GET /api/analytics?metric=performance&fleetId=fleet-123

// Layer-specific
GET /api/analytics?layer=settlement&fleetId=fleet-123
```

### Available Metrics
- **Revenue**: Total settlement amounts and trends
- **Cost**: Processing costs and savings
- **Efficiency**: Processing efficiency across layers
- **Retention**: Driver retention metrics
- **Performance**: Performance metrics and KPIs

### System Health Check
```javascript
GET /api/analytics (includes systemHealth)

Response:
{
  "overall": "healthy",
  "database": {
    "status": "healthy",
    "responseTime": 45
  },
  "api": {
    "status": "healthy",
    "recentRequests": 150,
    "successRate": 99.2
  }
}
```

---

## 4. File Upload & Storage

### File: `api/upload.js`

### Features
- **Multipart File Upload**: Handle file uploads
- **File Validation**: Size, type, and content validation
- **Storage Integration**: Support for multiple storage providers
- **Deduplication**: File hash-based deduplication
- **Download URLs**: Presigned URL generation
- **Batch Upload**: Multiple file uploads
- **File Metadata**: Comprehensive file metadata tracking

### Upload Endpoint
```javascript
POST /api/upload?fleetId=fleet-123&documentId=doc-456&fileType=document&category=invoice
Content-Type: multipart/form-data

// Response
{
  "success": true,
  "fileId": "file-789",
  "file": {
    "fileName": "invoice.pdf",
    "fileSize": 1024000,
    "fileType": "document",
    "mimeType": "application/pdf",
    "url": "https://storage.velcun.com/..."
  }
}
```

### File List
```javascript
GET /api/upload?fleetId=fleet-123&fileType=document&status=active
```

### File Delete
```javascript
DELETE /api/upload?id=file-789
```

### Supported Storage Providers
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- Vercel Blob

### File Validation
- Maximum file size: 10MB (configurable)
- Allowed types: PDF, images, spreadsheets, JSON, text
- MIME type verification
- File hash calculation

---

## 5. Enhanced Error Handling & Logging

### File: `api/lib/error-handler.js`

### Features
- **Custom Error Types**: Specific error classes for different scenarios
- **Error Logging**: Database-backed error logging
- **Request Logging**: Comprehensive API request/response logging
- **Error Monitoring**: Error threshold monitoring and alerts
- **Health Checks**: System health monitoring
- **Async Error Wrappers**: Safe async error handling

### Custom Error Types
```javascript
APIError                    // Generic API error
ValidationError             // Validation errors
AuthenticationError         // Authentication failures
AuthorizationError          // Authorization failures
NotFoundError               // Resource not found
RateLimitError              // Rate limit exceeded
```

### Error Handling
```javascript
import { asyncHandler, ValidationError } from '../lib/error-handler';

export default asyncHandler(async (req, res) => {
  if (!req.body.email) {
    throw new ValidationError('Email is required');
  }
  // Handler logic
});
```

### Error Response Format
```javascript
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "field": "email",
      "message": "Email is required"
    }
  }
}
```

### Error Monitoring
```javascript
import { errorMonitor } from '../lib/error-handler';

// Check error thresholds
errorMonitor.checkThreshold('AUTHENTICATION_ERROR');

// Get error statistics
const stats = errorMonitor.getErrorStats();
```

### Health Check Endpoint
```javascript
GET /api/health

Response:
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00Z",
  "checks": {
    "database": { "status": "healthy", "responseTime": 45 },
    "memory": { "status": "healthy", "heapUsed": "256MB" },
    "cpu": { "status": "healthy", "user": 1200, "system": 800 }
  }
}
```

---

## 6. TMS Integration System

### File: `api/tms-integration.js`

### Supported TMS Providers
- **McLeod LoadMaster**
- **Trimble TMW**
- **MercuryGate**
- **Aljex**
- **ProTransport**
- **Tailwind**
- **FreightPOP**

### Integration Features
- **Connection Testing**: Test TMS API connections
- **Data Synchronization**: Load and data sync from TMS
- **Data Push**: Push settlements and updates to TMS
- **Configuration Management**: Per-fleet TMS configurations
- **Error Handling**: TMS-specific error handling

### TMS Integration Endpoints
```javascript
POST /api/tms-integration?tmsProvider=mcleod
{
  "action": "test_connection",
  "fleetId": "fleet-123",
  "config": {
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret",
    "environment": "production"
  }
}

// Sync loads
POST /api/tms-integration?tmsProvider=mcleod
{
  "action": "sync_loads",
  "fleetId": "fleet-123",
  "config": { ... }
}

// Push settlement
POST /api/tms-integration?tmsProvider=mcleod
{
  "action": "push_settlement",
  "fleetId": "fleet-123",
  "data": {
    "settlementId": "settle-456",
    "amount": 2500,
    "status": "paid"
  },
  "config": { ... }
}
```

### Integration Configuration
```javascript
{
  "tmsProvider": "mcleod",
  "fleetId": "fleet-123",
  "config": {
    "apiKey": "your-api-key",
    "apiSecret": "your-api-secret",
    "environment": "production",
    "apiEndpoint": "https://api.mcleod.com",
    "webhookUrl": "https://velcun.com/api/webhooks/tms"
  },
  "isActive": true,
  "syncInterval": "hourly"
}
```

### Database Collections
- `tms_integrations` - TMS integration configurations
- `tms_loads` - Synced loads from TMS
- `tms_errors` - TMS integration errors

---

## 7. Scheduled Task System

### File: `api/scheduled-tasks.js`

### Available Tasks
- **settlement_processing**: Process pending settlements
- **lane_optimization**: Optimize pending lanes
- **document_parsing**: Parse pending documents
- **driver_retention_check**: Check driver retention risks
- **border_compliance_check**: Check border compliance
- **tms_sync**: Sync data from TMS systems
- **daily_report**: Generate daily reports
- **weekly_analytics**: Generate weekly analytics
- **cleanup**: Clean up old logs and data

### Task Execution
```javascript
POST /api/scheduled-tasks?task=settlement_processing&action=execute
{
  "fleetId": "fleet-123",
  "params": { ... }
}
```

### Task Status
```javascript
GET /api/scheduled-tasks?task=settlement_processing
```

### Task Schedule Configuration
```javascript
const taskSchedule = {
  settlement_processing: { interval: '5min', enabled: true },
  lane_optimization: { interval: '1hour', enabled: true },
  document_parsing: { interval: '10min', enabled: true },
  driver_retention_check: { interval: 'daily', enabled: true },
  border_compliance_check: { interval: '6hours', enabled: true },
  tms_sync: { interval: 'hourly', enabled: false },
  daily_report: { interval: 'daily', enabled: true },
  weekly_analytics: { interval: 'weekly', enabled: true },
  cleanup: { interval: 'weekly', enabled: true },
};
```

### Task Response Format
```javascript
{
  "success": true,
  "message": "Task executed successfully",
  "task": "settlement_processing",
  "result": {
    "processedCount": 15,
    "settlementIds": [...]
  }
}
```

---

## Database Collections

### Core Collections
- `contacts` - Contact form submissions
- `audits` - Fleet audit requests
- `users` - User accounts
- `pilots` - Pilot applications

### Automation Layer Collections
- `settlements` - Autonomous Settlement data
- `lanes` - Lane Optimization data
- `documents` - Parsed documents
- `drivers` - Driver profiles
- `cross_border` - Border compliance data

### Advanced Features Collections
- `webhooks` - Webhook configurations
- `webhook_logs` - Webhook delivery logs
- `files` - File uploads
- `tms_integrations` - TMS configurations
- `tms_loads` - Synced TMS loads
- `scheduled_tasks` - Task execution logs
- `api_logs` - API request logs
- `error_logs` - Error logs
- `warning_logs` - Warning logs
- `info_logs` - Info logs
- `daily_reports` - Daily reports
- `weekly_analytics` - Weekly analytics

---

## Environment Variables

### Required
```env
MONGODB_URI=mongodb+srv://...
MONGODB_DB=velcun
JWT_SECRET=your-secret-key
```

### Optional (Advanced Features)
```env
# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=velcun-uploads

# Email
SENDGRID_API_KEY=your-sendgrid-key
EMAIL_FROM=hello@velcun.com
EMAIL_TO=hello@velcun.com

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000

# Monitoring
SENTRY_DSN=your-sentry-dsn
NODE_ENV=production
```

---

## Security Best Practices

### Authentication
- Always use JWT tokens for API access
- Implement proper token expiration
- Use secure token storage (httpOnly cookies)
- Rotate JWT secrets regularly

### Authorization
- Implement role-based access control
- Validate fleet-based data access
- Use least privilege principle
- Regular audit of user permissions

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement input validation
- Sanitize user inputs
- Use parameterized queries (MongoDB sanitization)

### Monitoring
- Log all API requests and responses
- Monitor error rates and thresholds
- Set up alerts for critical failures
- Regular security audits

---

## Performance Optimization

### Database
- Use connection pooling
- Implement proper indexing
- Optimize query performance
- Cache frequently accessed data

### API
- Implement rate limiting
- Use compression
- Optimize response payloads
- Implement pagination

### File Storage
- Use CDN for static files
- Implement caching headers
- Optimize image sizes
- Use lazy loading

---

## Troubleshooting

### Common Issues

**Authentication Failures**
- Check JWT token validity
- Verify token expiration
- Ensure secret key matches

**Rate Limiting**
- Implement backoff strategy
- Use exponential backoff
- Check rate limit headers

**Webhook Failures**
- Verify target URL accessibility
- Check webhook secret
- Review retry configuration

**TMS Integration Issues**
- Test TMS connection
- Verify API credentials
- Check TMS API status

---

## Support

For implementation support:
- Review documentation in each API file
- Check AUTOMATION_LAYERS_API.md
- Refer to DEPLOYMENT_GUIDE.md
- Contact hello@velcun.com
