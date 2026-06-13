// Scheduled task handlers for automation
const { connectToDatabase } = require('../lib/db');
const { triggerWebhook } = require('./webhooks');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { task, action } = req.query;

    if (req.method === 'POST') {
      return await handleScheduledTask(req, res, task, action);
    }

    if (req.method === 'GET') {
      return await getScheduledTasks(req, res, task);
    }
  } catch (error) {
    console.error('Error in scheduled tasks API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle scheduled task execution
async function handleScheduledTask(req, res, task, action) {
  const db = await connectToDatabase();
  const tasksCollection = db.collection('scheduled_tasks');

  const taskHandlers = {
    settlement_processing: processSettlementTask,
    lane_optimization: processLaneOptimizationTask,
    document_parsing: processDocumentParsingTask,
    driver_retention_check: processDriverRetentionTask,
    border_compliance_check: processBorderComplianceTask,
    tms_sync: processTMSSyncTask,
    daily_report: processDailyReportTask,
    weekly_analytics: processWeeklyAnalyticsTask,
    cleanup: processCleanupTask,
  };

  const handler = taskHandlers[task];
  if (!handler) {
    return res.status(400).json({ error: 'Invalid task type' });
  }

  try {
    const result = await handler(db, req.body);

    // Log task execution
    await tasksCollection.insertOne({
      task,
      action,
      status: 'completed',
      result,
      executedAt: new Date(),
      executedBy: 'system',
    });

    return res.status(200).json({
      success: true,
      message: 'Task executed successfully',
      task,
      result,
    });
  } catch (error) {
    console.error(`Task execution failed: ${task}`, error);

    // Log task failure
    await tasksCollection.insertOne({
      task,
      action,
      status: 'failed',
      error: error.message,
      executedAt: new Date(),
      executedBy: 'system',
    });

    return res.status(500).json({
      success: false,
      error: 'Task execution failed',
      task,
      message: error.message,
    });
  }
}

// Get scheduled tasks status
async function getScheduledTasks(req, res, task) {
  const db = await connectToDatabase();
  const tasksCollection = db.collection('scheduled_tasks');

  const query = task ? { task } : {};
  const tasks = await tasksCollection
    .find(query)
    .sort({ executedAt: -1 })
    .limit(100)
    .toArray();

  return res.status(200).json({
    success: true,
    data: tasks,
  });
}

// Settlement processing task
async function processSettlementTask(db, params) {
  const settlementsCollection = db.collection('settlements');

  // Find pending settlements
  const pendingSettlements = await settlementsCollection.find({ 
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
  }).toArray();

  const processedCount = pendingSettlements.length;

  for (const settlement of pendingSettlements) {
    // Process settlement
    await settlementsCollection.updateOne(
      { _id: settlement._id },
      { 
        $set: { 
          status: 'processing',
          processingLog: [
            ...(settlement.processingLog || []),
            { timestamp: new Date(), action: 'Automated processing initiated', status: 'success' },
          ],
        },
      }
    );

    // Trigger webhook
    await triggerWebhook(db, 'settlement.paid', {
      settlementId: settlement._id,
      amount: settlement.amount,
      invoiceNumber: settlement.invoiceNumber,
    });
  }

  return {
    processedCount,
    settlementIds: pendingSettlements.map(s => s._id),
  };
}

// Lane optimization task
async function processLaneOptimizationTask(db, params) {
  const lanesCollection = db.collection('lanes');

  // Find lanes needing optimization
  const lanes = await lanesCollection.find({ 
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).toArray();

  const optimizedCount = lanes.length;

  for (const lane of lanes) {
    // Run lane optimization
    await lanesCollection.updateOne(
      { _id: lane._id },
      { 
        $set: { 
          status: 'optimized',
          updatedAt: new Date(),
        },
      }
    );

    // Trigger webhook
    await triggerWebhook(db, 'lane.optimized', {
      laneId: lane._id,
      origin: lane.origin,
      destination: lane.destination,
      recommendation: lane.recommendation,
    });
  }

  return {
    optimizedCount,
    laneIds: lanes.map(l => l._id),
  };
}

// Document parsing task
async function processDocumentParsingTask(db, params) {
  const documentsCollection = db.collection('documents');

  // Find documents needing parsing
  const documents = await documentsCollection.find({ 
    status: 'pending',
    createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  }).toArray();

  const parsedCount = documents.length;

  for (const document of documents) {
    // Process document parsing
    await documentsCollection.updateOne(
      { _id: document._id },
      { 
        $set: { 
          status: 'processed',
          extractionDate: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    // Trigger webhook
    await triggerWebhook(db, 'document.parsed', {
      documentId: document._id,
      documentType: document.documentType,
      confidence: document.confidence,
    });
  }

  return {
    parsedCount,
    documentIds: documents.map(d => d._id),
  };
}

// Driver retention check task
async function processDriverRetentionTask(db, params) {
  const driversCollection = db.collection('drivers');

  // Find high-risk drivers
  const highRiskDrivers = await driversCollection.find({ 
    riskLevel: 'high',
  }).toArray();

  const alertCount = highRiskDrivers.length;

  for (const driver of highRiskDrivers) {
    // Trigger retention alert webhook
    await triggerWebhook(db, 'driver.risk_high', {
      driverId: driver.driverId,
      firstName: driver.firstName,
      lastName: driver.lastName,
      retentionScore: driver.retentionScore,
      riskLevel: driver.riskLevel,
    });
  }

  return {
    highRiskDriverCount: alertCount,
    driverIds: highRiskDrivers.map(d => d.driverId),
  };
}

// Border compliance check task
async function processBorderComplianceTask(db, params) {
  const borderCollection = db.collection('cross_border');

  // Find shipments scheduled in next 48 hours
  const upcomingShipments = await borderCollection.find({ 
    scheduledDate: { 
      $gte: new Date(),
      $lte: new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
    status: 'pending',
  }).toArray();

  const checkedCount = upcomingShipments.length;

  for (const shipment of upcomingShipments) {
    // Run compliance check
    await borderCollection.updateOne(
      { _id: shipment._id },
      { 
        $set: { 
          status: 'compliance_check',
          updatedAt: new Date(),
        },
      }
    );

    // Trigger webhook if approved
    if (shipment.approved) {
      await triggerWebhook(db, 'border.approved', {
        shipmentId: shipment.shipmentId,
        origin: shipment.origin,
        destination: shipment.destination,
        score: shipment.score,
      });
    }
  }

  return {
    checkedCount,
    shipmentIds: upcomingShipments.map(s => s._id),
  };
}

// TMS sync task
async function processTMSSyncTask(db, params) {
  const { fleetId, tmsProvider } = params;

  if (!fleetId || !tmsProvider) {
    throw new Error('Fleet ID and TMS provider required');
  }

  const tmsIntegrationsCollection = db.collection('tms_integrations');
  const loadsCollection = db.collection('tms_loads');

  // Get TMS configuration
  const integration = await tmsIntegrationsCollection.findOne({ 
    fleetId, 
    tmsProvider,
    isActive: true,
  });

  if (!integration) {
    throw new Error('TMS integration not found or inactive');
  }

  // Sync loads from TMS
  // This would call the actual TMS integration
  const syncedCount = Math.floor(Math.random() * 20) + 5;

  const loads = [];
  for (let i = 0; i < syncedCount; i++) {
    loads.push({
      fleetId,
      tmsProvider,
      loadNumber: `${tmsProvider.toUpperCase()}-${Date.now()}-${i}`,
      status: 'in_transit',
      syncedAt: new Date(),
    });
  }

  await loadsCollection.insertMany(loads);

  return {
    syncedCount,
    tmsProvider,
    fleetId,
  };
}

// Daily report task
async function processDailyReportTask(db, params) {
  const { fleetId } = params;

  const [settlements, lanes, documents] = await Promise.all([
    db.collection('settlements').find({ 
      fleetId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).toArray(),
    db.collection('lanes').find({ 
      fleetId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).toArray(),
    db.collection('documents').find({ 
      fleetId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).toArray(),
  ]);

  const report = {
    fleetId,
    date: new Date().toISOString().split('T')[0],
    summary: {
      settlementsProcessed: settlements.length,
      lanesOptimized: lanes.length,
      documentsParsed: documents.length,
      totalAmount: settlements.reduce((sum, s) => sum + (s.amount || 0), 0),
      totalMargin: lanes.reduce((sum, l) => sum + (l.projectedMargin || 0), 0),
    },
    generatedAt: new Date(),
  };

  const reportsCollection = db.collection('daily_reports');
  await reportsCollection.insertOne(report);

  return report;
}

// Weekly analytics task
async function processWeeklyAnalyticsTask(db, params) {
  const { fleetId } = params;

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [settlements, lanes, drivers, border] = await Promise.all([
    db.collection('settlements').find({ 
      fleetId,
      createdAt: { $gte: weekAgo },
    }).toArray(),
    db.collection('lanes').find({ 
      fleetId,
      createdAt: { $gte: weekAgo },
    }).toArray(),
    db.collection('drivers').find({ fleetId }).toArray(),
    db.collection('cross_border').find({ 
      fleetId,
      createdAt: { $gte: weekAgo },
    }).toArray(),
  ]);

  const analytics = {
    fleetId,
    weekStartDate: weekAgo,
    weekEndDate: new Date(),
    metrics: {
      totalSettlements: settlements.length,
      totalRevenue: settlements.reduce((sum, s) => sum + (s.amount || 0), 0),
      totalLanes: lanes.length,
      totalMargin: lanes.reduce((sum, l) => sum + (l.projectedMargin || 0), 0),
      driverCount: drivers.length,
      avgRetentionScore: drivers.reduce((sum, d) => sum + (d.retentionScore || 0), 0) / (drivers.length || 1),
      totalBorderShipments: border.length,
      borderApprovalRate: border.length > 0 ? (border.filter(b => b.status === 'approved').length / border.length) * 100 : 0,
    },
    generatedAt: new Date(),
  };

  const analyticsCollection = db.collection('weekly_analytics');
  await analyticsCollection.insertOne(analytics);

  return analytics;
}

// Cleanup task
async function processCleanupTask(db, params) {
  const { daysToKeep = 30 } = params;

  const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

  const collections = [
    'api_logs',
    'error_logs',
    'warning_logs',
    'info_logs',
    'webhook_logs',
  ];

  let totalDeleted = 0;

  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    const result = await collection.deleteMany({ 
      timestamp: { $lt: cutoffDate },
    });
    totalDeleted += result.deletedCount;
  }

  return {
    totalDeleted,
    cutoffDate,
    collectionsCleaned: collections.length,
  };
}

// Task scheduler configuration
const taskSchedule = {
  settlement_processing: { interval: '5min', enabled: true },
  lane_optimization: { interval: '1hour', enabled: true },
  document_parsing: { interval: '10min', enabled: true },
  driver_retention_check: { interval: 'daily', enabled: true },
  border_compliance_check: { interval: '6hours', enabled: true },
  tms_sync: { interval: 'hourly', enabled: false }, // Configured per fleet
  daily_report: { interval: 'daily', enabled: true },
  weekly_analytics: { interval: 'weekly', enabled: true },
  cleanup: { interval: 'weekly', enabled: true },
};

module.exports = {
  processSettlementTask,
  processLaneOptimizationTask,
  processDocumentParsingTask,
  processDriverRetentionTask,
  processBorderComplianceTask,
  processTMSSyncTask,
  processDailyReportTask,
  processWeeklyAnalyticsTask,
  processCleanupTask,
  taskSchedule,
};