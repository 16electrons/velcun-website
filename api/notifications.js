// Real-time notifications API
const { connectToDatabase } = require('./lib/db');
const { triggerWebhook, WEBHOOK_EVENT_TYPES } = require('./webhooks');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const notificationsCollection = db.collection('notifications');

    // GET - Fetch notifications
    if (req.method === 'GET') {
      const { userId, fleetId, type, status, limit = 20, offset = 0 } = req.query;
      const query = {};
      
      if (userId) query.userId = userId;
      if (fleetId) query.fleetId = fleetId;
      if (type) query.type = type;
      if (status) query.status = status;

      const notifications = await notificationsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(parseInt(offset))
        .limit(parseInt(limit))
        .toArray();

      // Mark as read
      if (notifications.length > 0 && status === 'unread') {
        await notificationsCollection.updateMany(
          query,
          { $set: { read: true, readAt: new Date() } }
        );
      }

      return res.status(200).json({
        success: true,
        data: notifications,
        unreadCount: await notificationsCollection.countDocuments({ ...query, read: false }),
      });
    }

    // POST - Create notification
    if (req.method === 'POST') {
      const {
        userId,
        fleetId,
        type,
        title,
        message,
        priority = 'normal',
        data = {},
        expiry,
      } = req.body;

      // Validate required fields
      if (!type || !title || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await notificationsCollection.insertOne({
        userId,
        fleetId,
        type,
        title,
        message,
        priority,
        data,
        read: false,
        createdAt: new Date(),
        readAt: null,
        expiry: expiry ? new Date(expiry) : null,
      });

      // Send real-time notification via WebSocket if available
      await sendRealtimeNotification({
        id: result.insertedId,
        userId,
        fleetId,
        type,
        title,
        message,
        priority,
        data,
      });

      // Trigger webhook for notification
      await triggerWebhook(db, type === 'alert' ? WEBHOOK_EVENT_TYPES.DRIVER_RISK_HIGH : 'notification.created', {
        notificationId: result.insertedId,
        type,
        title,
        message,
      });

      return res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        id: result.insertedId,
      });
    }

    // PUT - Update notification
    if (req.method === 'PUT') {
      const { id, read, status } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (read !== undefined) {
        updateData.read = read;
        updateData.readAt = read ? new Date() : null;
      }
      if (status) updateData.status = status;

      const result = await notificationsCollection.updateOne(
        { _id: id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification updated successfully',
      });
    }

    // DELETE - Delete notification
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Notification ID required' });
      }

      const result = await notificationsCollection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error in notifications API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Send real-time notification via WebSocket
async function sendRealtimeNotification(notification) {
  // This would integrate with WebSocket server
  // For now, log the notification
  console.log('Real-time notification:', notification);

  // In production with WebSocket server:
  // if (webSocketServer) {
  //   webSocketServer.clients.forEach(client => {
  //     if (client.userId === notification.userId || 
  //         client.fleetId === notification.fleetId) {
  //       client.send(JSON.stringify({
  //         type: 'notification',
  //         data: notification
  //       }));
  //     }
  //   });
  // }
}

// Batch notification creator
async function createBulkNotifications(notifications) {
  const db = await connectToDatabase();
  const notificationsCollection = db.collection('notifications');

  const result = await notificationsCollection.insertMany(notifications.map(n => ({
    ...n,
    read: false,
    createdAt: new Date(),
    readAt: null,
  })));

  return {
    success: true,
    insertedCount: result.insertedCount,
    notificationIds: result.insertedIds,
  };
}

// Notification types
const NOTIFICATION_TYPES = {
  ALERT: 'alert',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  SETTLEMENT: 'settlement',
  LANE_OPTIMIZATION: 'lane_optimization',
  DOCUMENT_PARSED: 'document_parsed',
  DRIVER_RETENTION: 'driver_retention',
  BORDER_COMPLIANCE: 'border_compliance',
  SYSTEM: 'system',
};

// Notification templates
const notificationTemplates = {
  settlement_paid: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Settlement Completed',
    message: 'Invoice {invoiceNumber} has been processed and paid successfully.',
    data: { invoiceNumber, amount, carrier },
  },
  lane_optimized: {
    type: NOTIFICATION_TYPES.INFO,
    title: 'Lane Optimized',
    message: 'Lane {origin} → {destination} has been optimized with {efficiency}% efficiency gain.',
    data: { origin, destination, efficiency, projectedMargin },
  },
  document_parsed: {
    type: NOTIFICATION_TYPES.INFO,
    title: 'Document Parsed',
    message: 'Document {documentType} has been parsed with {confidence}% confidence.',
    data: { documentType, confidence, fileName },
  },
  driver_risk: {
    type: NOTIFICATION_TYPES.ALERT,
    title: 'Driver Retention Risk',
    message: 'Driver {driverName} is showing increased turnover risk. Retention score: {score}',
    data: { driverId, driverName, score, riskLevel },
  },
  border_approved: {
    type: NOTIFICATION_TYPES.SUCCESS,
    title: 'Border Approval',
    message: 'Shipment {shipmentId} approved for {route} crossing.',
    data: { shipmentId, route, score },
  },
  system_alert: {
    type: NOTIFICATION_TYPES.ERROR,
    title: 'System Alert',
    message: '{message}',
    data: { message, component },
  },
};

// Create notification from template
function createNotificationFromTemplate(templateKey, data) {
  const template = notificationTemplates[templateKey];
  if (!template) {
    return null;
  }

  const message = template.message.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);

  return {
    ...template,
    message,
    data: { ...data },
  };
}

module.exports = {
  createBulkNotifications,
  NOTIFICATION_TYPES,
  notificationTemplates,
  createNotificationFromTemplate,
};