# VELCUN JavaScript SDK

Official JavaScript SDK for integrating with the VELCUN API.

## Installation

### NPM
```bash
npm install @velcun/sdk
```

### CDN
```html
<script src="https://cdn.velcun.com/sdk/velcun-sdk.js"></script>
```

### Direct Download
```html
<script src="/sdk/velcun-sdk.js"></script>
```

## Quick Start

### Initialize SDK
```javascript
// With API Key
const velcun = new VelcunSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://velcun.com/api'
});

// With credentials (auto-authenticate)
const velcun = new VelcunSDK({
  email: 'your@email.com',
  password: 'your-password',
  baseURL: 'https://velcun.com/api'
});

// With existing token
const velcun = new VelcunSDK({
  token: 'your-jwt-token',
  baseURL: 'https://velcun.com/api'
});
```

### Authentication
```javascript
// Authenticate with email and password
try {
  const result = await velcun.authenticate('your@email.com', 'your-password');
  console.log('Authentication successful:', result);
} catch (error) {
  console.error('Authentication failed:', error);
}

// Register new user
try {
  const result = await velcun.register({
    email: 'new@user.com',
    password: 'securePassword123',
    name: 'John Doe',
    company: 'Acme Trucking'
  });
  console.log('Registration successful:', result);
} catch (error) {
  console.error('Registration failed:', error);
}
```

## API Methods

### Settlement (Autonomous Settlement)
```javascript
// Create new settlement
const settlement = await velcun.settlement.create({
  fleetId: 'your-fleet-id',
  loadId: 'LOAD-1234',
  invoiceNumber: 'INV-2024-1234',
  carrier: 'Acme Trucking',
  amount: 2500.00,
  dueDate: '2024-02-01'
});

// Get all settlements
const settlements = await velcun.settlement.get({
  fleetId: 'your-fleet-id',
  status: 'pending'
});

// Get specific settlement
const settlement = await velcun.settlement.getById('settlement-id');

// Update settlement
const updated = await velcun.settlement.update('settlement-id', {
  status: 'paid'
});

// Delete settlement
await velcun.settlement.delete('settlement-id');
```

### Lane Optimization (Predictive Lane IQ)
```javascript
// Analyze lane profitability
const analysis = await velcun.lanes.analyze({
  fleetId: 'your-fleet-id',
  origin: 'Dallas, TX',
  destination: 'Chicago, IL',
  currentRate: 1800,
  equipment: 'dry-van',
  weight: 40000
});

// Get lane analyses
const lanes = await velcun.lanes.get({
  fleetId: 'your-fleet-id'
});

// Get specific analysis
const lane = await velcun.lanes.getById('lane-id');
```

### Document Parsing (Unstructured Data Ingestion)
```javascript
// Parse document
const parsed = await velcun.documents.parse({
  fleetId: 'your-fleet-id',
  documentType: 'invoice',
  source: 'email',
  rawContent: 'document content here',
  fileName: 'invoice.pdf',
  priority: 'normal'
});

// Get parsed documents
const documents = await velcun.documents.get({
  fleetId: 'your-fleet-id',
  documentType: 'invoice'
});

// Get specific document
const document = await velcun.documents.getById('document-id');
```

### Driver Management (Driver-First Retention)
```javascript
// Create/update driver profile
const driver = await velcun.drivers.create({
  fleetId: 'your-fleet-id',
  driverId: 'DRV-1234',
  firstName: 'John',
  lastName: 'Smith',
  equipment: 'dry-van',
  status: 'active',
  performanceMetrics: {
    onTimeDeliveryPercent: 95,
    safetyScore: 4.5,
    customerSatisfaction: 4.8,
    loadCount: 150,
    avgHomeTime: 48
  }
});

// Get drivers
const drivers = await velcun.drivers.get({
  fleetId: 'your-fleet-id',
  status: 'active'
});

// Get specific driver
const driver = await velcun.drivers.getById('driver-id');

// Update driver
const updated = await velcun.drivers.update('driver-id', {
  status: 'warning'
});
```

### Border Compliance
```javascript
// Check border compliance
const compliance = await velcun.border.check({
  fleetId: 'your-fleet-id',
  shipmentId: 'SHP-1234',
  origin: 'Los Angeles, CA',
  destination: 'Toronto, ON',
  originCountry: 'US',
  destinationCountry: 'CA',
  equipment: 'dry-van',
  cargoType: 'general',
  hazmat: false,
  temperatureControl: false
});

// Get compliance checks
const checks = await velcun.border.get({
  fleetId: 'your-fleet-id'
});

// Get specific check
const check = await velcun.border.getById('check-id');
```

### Dashboard
```javascript
// Get comprehensive dashboard data
const dashboard = await velcun.dashboard.get({
  fleetId: 'your-fleet-id',
  dateRange: JSON.stringify({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }),
  detailed: true
});
```

### Notifications
```javascript
// Create notification
const notification = await velcun.notifications.create({
  userId: 'user-id',
  fleetId: 'your-fleet-id',
  type: 'alert',
  title: 'Driver Retention Risk',
  message: 'Driver John Smith is showing increased turnover risk',
  priority: 'high',
  data: { driverId: 'DRV-1234', score: 65 }
});

// Get notifications
const notifications = await velcun.notifications.get({
  userId: 'user-id',
  status: 'unread'
});

// Mark as read
await velcun.notifications.update('notification-id', {
  read: true
});

// Delete notification
await velcun.notifications.delete('notification-id');
```

### Webhooks
```javascript
// Create webhook
const webhook = await velcun.webhooks.create({
  fleetId: 'your-fleet-id',
  name: 'Settlement Notifications',
  eventType: 'settlement.paid',
  targetUrl: 'https://your-server.com/webhook',
  secret: 'your-webhook-secret',
  isActive: true
});

// Get webhooks
const webhooks = await velcun.webhooks.get({
  fleetId: 'your-fleet-id'
});

// Update webhook
await velcun.webhooks.update('webhook-id', {
  isActive: false
});

// Delete webhook
await velcun.webhooks.delete('webhook-id');

// Trigger webhook manually
await velcun.webhooks.trigger('settlement.paid', {
  settlementId: 'SET-1234',
  amount: 2500.00
});
```

### TMS Integration
```javascript
// Test TMS connection
const result = await velcun.tms.testConnection('mcleod', {
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret',
  environment: 'production'
});

// Sync loads from TMS
const sync = await velcun.tms.syncLoads('mcleod', {
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
});

// Push settlement to TMS
const push = await velcun.tms.pushSettlement('mcleod', {
  settlementId: 'SET-1234',
  amount: 2500.00,
  carrier: 'Acme Trucking'
});
```

### Analytics
```javascript
// Get analytics data
const analytics = await velcun.analytics.get({
  fleetId: 'your-fleet-id',
  dateRange: JSON.stringify({
    startDate: '2024-01-01',
    endDate: '2024-01-31'
  }),
  layer: 'settlement'
});

// Generate custom report
const report = await velcun.analytics.customReport({
  fleetId: 'your-fleet-id',
  reportType: 'summary',
  dateRange: '30d',
  layers: ['settlement', 'lanes', 'drivers'],
  metrics: ['revenue', 'efficiency', 'performance'],
  format: 'pdf'
});
```

### File Upload
```javascript
// Upload file
const upload = await velcun.files.upload(file, {
  metadata: {
    documentType: 'invoice',
    fleetId: 'your-fleet-id'
  }
});

// Get files
const files = await velcun.files.get({
  fleetId: 'your-fleet-id'
});

// Delete file
await velcun.files.delete('file-id');
```

## Error Handling

All SDK methods throw errors on failure. Use try-catch blocks:

```javascript
try {
  const settlement = await velcun.settlement.create(data);
  console.log('Success:', settlement);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

## Configuration Options

```javascript
const velcun = new VelcunSDK({
  apiKey: 'your-api-key',           // API key for authentication
  apiSecret: 'your-api-secret',       // API secret (optional)
  baseURL: 'https://velcun.com/api',  // API base URL
  timeout: 30000,                     // Request timeout in ms
  token: 'your-jwt-token',           // Existing JWT token
  email: 'your@email.com',           // Email for auto-authentication
  password: 'your-password'          // Password for auto-authentication
});
```

## Browser Usage

```html
<!DOCTYPE html>
<html>
<head>
  <script src="/sdk/velcun-sdk.js"></script>
</head>
<body>
  <script>
    const velcun = new VelcunSDK({
      apiKey: 'your-api-key'
    });

    velcun.dashboard.get({ fleetId: 'your-fleet-id' })
      .then(data => console.log(data))
      .catch(error => console.error(error));
  </script>
</body>
</html>
```

## Node.js Usage

```javascript
const VelcunSDK = require('./velcun-sdk.js');

const velcun = new VelcunSDK({
  apiKey: 'your-api-key'
});

async function main() {
  try {
    const dashboard = await velcun.dashboard.get({
      fleetId: 'your-fleet-id'
    });
    console.log(dashboard);
  } catch (error) {
    console.error(error);
  }
}

main();
```

## Rate Limits

The SDK automatically handles rate limiting. Configure timeout if needed:

```javascript
const velcun = new VelcunSDK({
  apiKey: 'your-api-key',
  timeout: 45000  // 45 seconds
});
```

## Webhook Signature Verification

When receiving webhooks, verify the signature:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## Support

- Documentation: https://velcun.com/docs
- API Reference: https://velcun.com/docs/api
- Support: support@velcun.com

## License

MIT License - see LICENSE file for details