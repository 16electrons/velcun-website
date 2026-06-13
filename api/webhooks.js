// Webhook system for external integrations
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const webhooksCollection = db.collection('webhooks');

    // GET - Fetch webhooks
    if (req.method === 'GET') {
      const { fleetId, eventType, status, isActive } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (eventType) query.eventType = eventType;
      if (status) query.status = status;
      if (isActive !== undefined) query.isActive = isActive === 'true';

      const webhooks = await webhooksCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        data: webhooks,
      });
    }

    // POST - Create new webhook
    if (req.method === 'POST') {
      const {
        fleetId,
        name,
        eventType, // settlement.paid, lane.optimized, document.parsed, etc.
        targetUrl,
        secret, // webhook secret for signature verification
        headers,
        isActive = true,
        retryConfig = {
          maxRetries: 3,
          retryDelay: 5000,
        },
      } = req.body;

      // Validate required fields
      if (!fleetId || !name || !eventType || !targetUrl) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Validate URL format
      try {
        new URL(targetUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid target URL' });
      }

      const webhookSecret = secret || generateWebhookSecret();

      const result = await webhooksCollection.insertOne({
        fleetId,
        name,
        eventType,
        targetUrl,
        secret: webhookSecret,
        headers: headers || {},
        isActive,
        retryConfig,
        status: 'active',
        statistics: {
          totalTriggers: 0,
          successfulDeliveries: 0,
          failedDeliveries: 0,
          lastTriggeredAt: null,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Webhook created successfully',
        id: result.insertedId,
        secret: webhookSecret,
      });
    }

    // PUT - Update webhook
    if (req.method === 'PUT') {
      const { id, name, targetUrl, isActive, retryConfig, headers } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Webhook ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (name) updateData.name = name;
      if (targetUrl) {
        try {
          new URL(targetUrl);
          updateData.targetUrl = targetUrl;
        } catch {
          return res.status(400).json({ error: 'Invalid target URL' });
        }
      }
      if (isActive !== undefined) updateData.isActive = isActive;
      if (retryConfig) updateData.retryConfig = retryConfig;
      if (headers) updateData.headers = headers;

      const result = await webhooksCollection.updateOne(
        { _id: id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Webhook updated successfully',
      });
    }

    // DELETE - Remove webhook
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Webhook ID required' });
      }

      const result = await webhooksCollection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Webhook not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Webhook deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error in webhook API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Generate webhook secret
function generateWebhookSecret() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

// Trigger webhook
async function triggerWebhook(db, eventType, payload) {
  try {
    const webhooksCollection = db.collection('webhooks');
    const webhookLogsCollection = db.collection('webhook_logs');

    // Find active webhooks for this event type
    const webhooks = await webhooksCollection.find({
      eventType,
      isActive: true,
      status: 'active',
    }).toArray();

    for (const webhook of webhooks) {
      const logId = await createWebhookLog(db, webhook, payload);

      // Attempt delivery
      const deliveryResult = await deliverWebhook(webhook, payload);

      // Update log
      await updateWebhookLog(db, logId, deliveryResult);

      // Update webhook statistics
      await updateWebhookStatistics(db, webhook._id, deliveryResult.success);
    }

    return { success: true, triggeredCount: webhooks.length };
  } catch (error) {
    console.error('Error triggering webhooks:', error);
    return { success: false, error: error.message };
  }
}

// Create webhook log entry
async function createWebhookLog(db, webhook, payload) {
  const webhookLogsCollection = db.collection('webhook_logs');

  const result = await webhookLogsCollection.insertOne({
    webhookId: webhook._id,
    eventType: webhook.eventType,
    targetUrl: webhook.targetUrl,
    payload,
    status: 'pending',
    attempts: 0,
    createdAt: new Date(),
  });

  return result.insertedId;
}

// Deliver webhook
async function deliverWebhook(webhook, payload, attemptNumber = 1) {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(webhook.secret, JSON.stringify(payload), timestamp);

    const response = await fetch(webhook.targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Event': webhook.eventType,
        ...webhook.headers,
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        responseBody: await response.text(),
      };
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    // Retry logic
    if (attemptNumber < webhook.retryConfig.maxRetries) {
      await new Promise(resolve => setTimeout(resolve, webhook.retryConfig.retryDelay));
      return deliverWebhook(webhook, payload, attemptNumber + 1);
    }

    return {
      success: false,
      error: error.message,
      attempts: attemptNumber,
    };
  }
}

// Generate webhook signature
function generateSignature(secret, payload, timestamp) {
  const crypto = require('crypto');
  const message = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

// Update webhook log
async function updateWebhookLog(db, logId, deliveryResult) {
  const webhookLogsCollection = db.collection('webhook_logs');

  await webhookLogsCollection.updateOne(
    { _id: logId },
    {
      $set: {
        status: deliveryResult.success ? 'delivered' : 'failed',
        statusCode: deliveryResult.statusCode,
        responseBody: deliveryResult.responseBody,
        error: deliveryResult.error,
        updatedAt: new Date(),
      },
      $inc: { attempts: 1 },
    }
  );
}

// Update webhook statistics
async function updateWebhookStatistics(db, webhookId, success) {
  const webhooksCollection = db.collection('webhooks');

  await webhooksCollection.updateOne(
    { _id: webhookId },
    {
      $inc: {
        'statistics.totalTriggers': 1,
        'statistics.successfulDeliveries': success ? 1 : 0,
        'statistics.failedDeliveries': success ? 0 : 1,
      },
      $set: {
        'statistics.lastTriggeredAt': new Date(),
      },
    }
  );
}

// Webhook event types
const WEBHOOK_EVENT_TYPES = {
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
};

module.exports = {
  triggerWebhook,
  generateWebhookSecret,
  generateSignature,
  WEBHOOK_EVENT_TYPES,
};