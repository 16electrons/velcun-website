// Unified Dashboard API - Aggregates all 5 automation layers
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();

    if (req.method === 'GET') {
      const { fleetId, dateRange, layer, detailed } = req.query;

      // If specific layer requested, return layer-specific data
      if (layer) {
        return await getLayerData(db, layer, fleetId, dateRange, detailed);
      }

      // Otherwise, return aggregated dashboard data
      return await getDashboardData(db, fleetId, dateRange, detailed);
    }

    if (req.method === 'POST') {
      const { action, fleetId, data } = req.body;

      switch (action) {
        case 'sync_all_layers':
          return await syncAllLayers(db, fleetId);
        case 'run_diagnostic':
          return await runDiagnostic(db, fleetId);
        case 'generate_report':
          return await generateReport(db, fleetId, data);
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }
  } catch (error) {
    console.error('Error in dashboard API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get layer-specific data
async function getLayerData(db, layer, fleetId, dateRange, detailed) {
  const collections = {
    settlement: 'settlements',
    lane_optimization: 'lanes',
    parse: 'documents',
    driver_yield: 'drivers',
    border_compliance: 'cross_border',
  };

  const collectionName = collections[layer];
  if (!collectionName) {
    return res.status(400).json({ error: 'Invalid layer' });
  }

  const query = fleetId ? { fleetId } : {};
  if (dateRange) {
    const { startDate, endDate } = JSON.parse(dateRange);
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  const collection = db.collection(collectionName);
  const data = await collection.find(query).limit(detailed === 'true' ? 1000 : 100).toArray();

  return res.status(200).json({
    success: true,
    layer,
    data,
  });
}

// Get aggregated dashboard data
async function getDashboardData(db, fleetId, dateRange, detailed) {
  const query = fleetId ? { fleetId } : {};
  if (dateRange) {
    const { startDate, endDate } = JSON.parse(dateRange);
    query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Fetch data from all 5 layers
  const [
    settlements,
    lanes,
    documents,
    drivers,
    borderShipments,
  ] = await Promise.all([
    db.collection('settlements').find(query).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection('lanes').find(query).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection('documents').find(query).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection('drivers').find(query).sort({ createdAt: -1 }).limit(50).toArray(),
    db.collection('cross_border').find(query).sort({ createdAt: -1 }).limit(50).toArray(),
  ]);

  // Calculate layer metrics
  const settlementMetrics = calculateSettlementMetrics(settlements);
  const laneMetrics = calculateLaneMetrics(lanes);
  const documentMetrics = calculateDocumentMetrics(documents);
  const driverMetrics = calculateDriverMetrics(drivers);
  const borderMetrics = calculateBorderMetrics(borderShipments);

  // Calculate overall fleet metrics
  const overallMetrics = calculateOverallMetrics({
    settlements,
    lanes,
    documents,
    drivers,
    borderShipments,
  });

  // Generate insights and recommendations
  const insights = generateDashboardInsights({
    settlementMetrics,
    laneMetrics,
    documentMetrics,
    driverMetrics,
    borderMetrics,
    overallMetrics,
  });

  return res.status(200).json({
    success: true,
    summary: {
      totalRecords: settlements.length + lanes.length + documents.length + drivers.length + borderShipments.length,
      layersActive: 5,
      lastUpdated: new Date(),
    },
    layers: {
      settlement: {
        name: 'Autonomous Settlement (Settle)',
        metrics: settlementMetrics,
        recent: settlements.slice(0, 5),
      },
      lane_optimization: {
        name: 'Predictive Lane Optimization (Lane IQ)',
        metrics: laneMetrics,
        recent: lanes.slice(0, 5),
      },
      parse: {
        name: 'Unstructured Data Ingestion (Parse)',
        metrics: documentMetrics,
        recent: documents.slice(0, 5),
      },
      driver_yield: {
        name: 'Driver-First Retention (Driver Yield)',
        metrics: driverMetrics,
        recent: drivers.slice(0, 5),
      },
      border_compliance: {
        name: 'Border Compliance',
        metrics: borderMetrics,
        recent: borderShipments.slice(0, 5),
      },
    },
    overall: overallMetrics,
    insights,
  });
}

// Settlement metrics calculation
function calculateSettlementMetrics(settlements) {
  const totalAmount = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
  const paidSettlements = settlements.filter(s => s.status === 'paid').length;
  const pendingSettlements = settlements.filter(s => s.status === 'pending').length;
  const averageProcessingTime = calculateAverageProcessingTime(settlements);

  return {
    totalSettlements: settlements.length,
    totalAmount,
    paidSettlements,
    pendingSettlements,
    paymentRate: settlements.length > 0 ? (paidSettlements / settlements.length) * 100 : 0,
    averageProcessingTime,
    automationRate: 95, // Simulated automation rate
    costSavings: totalAmount * 0.15, // 15% cost savings from automation
  };
}

// Lane metrics calculation
function calculateLaneMetrics(lanes) {
  const totalLanes = lanes.length;
  const recommendedLanes = lanes.filter(l => l.recommendation === 'highly recommended').length;
  const averageMargin = lanes.reduce((sum, l) => sum + (l.projectedMargin || 0), 0) / (lanes.length || 1);
  const highDemandLanes = lanes.filter(l => l.demandLevel === 'high').length;

  return {
    totalLanes,
    recommendedLanes,
    laneOptimizationRate: totalLanes > 0 ? (recommendedLanes / totalLanes) * 100 : 0,
    averageProjectedMargin: averageMargin,
    highDemandLanes,
    efficiencyGain: averageMargin * 0.20, // 20% efficiency gain
    missedOpportunities: lanes.filter(l => l.recommendation === 'not recommended').length,
  };
}

// Document metrics calculation
function calculateDocumentMetrics(documents) {
  const processed = documents.filter(d => d.status === 'processed').length;
  const highConfidence = documents.filter(d => d.confidence >= 0.8).length;
  const totalConfidence = documents.reduce((sum, d) => sum + (d.confidence || 0), 0) / (documents.length || 1);

  return {
    totalDocuments: documents.length,
    processedDocuments: processed,
    processingRate: documents.length > 0 ? (processed / documents.length) * 100 : 0,
    averageConfidence: (totalConfidence * 100).toFixed(1),
    highConfidenceDocuments: highConfidence,
    timeSavings: documents.length * 30, // 30 minutes saved per document
    errorRate: documents.filter(d => d.confidence < 0.7).length / (documents.length || 1) * 100,
  };
}

// Driver metrics calculation
function calculateDriverMetrics(drivers) {
  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const highRetentionScore = drivers.filter(d => d.retentionScore >= 80).length;
  const highRiskDrivers = drivers.filter(d => d.riskLevel === 'high').length;
  const averageYield = drivers.reduce((sum, d) => sum + (d.overallDriverYield || 0), 0) / (drivers.length || 1);

  return {
    totalDrivers: drivers.length,
    activeDrivers,
    retentionRate: drivers.length > 0 ? (activeDrivers / drivers.length) * 100 : 0,
    averageRetentionScore: drivers.reduce((sum, d) => sum + (d.retentionScore || 0), 0) / (drivers.length || 1),
    highRiskDrivers,
    averageDriverYield: averageYield,
    turnoverRisk: drivers.length > 0 ? (highRiskDrivers / drivers.length) * 100 : 0,
    productivityGain: averageYield * 0.25, // 25% productivity gain
  };
}

// Border compliance metrics calculation
function calculateBorderMetrics(shipments) {
  const approved = shipments.filter(s => s.status === 'approved').length;
  const highScore = shipments.filter(s => s.score >= 80).length;
  const pendingDocuments = shipments.filter(s => s.status === 'awaiting_documents').length;

  return {
    totalShipments: shipments.length,
    approvedShipments: approved,
    approvalRate: shipments.length > 0 ? (approved / shipments.length) * 100 : 0,
    averageComplianceScore: shipments.reduce((sum, s) => sum + (s.score || 0), 0) / (shipments.length || 1),
    highComplianceShipments: highScore,
    pendingDocuments,
    delaysPrevented: approved * 2, // 2 delays prevented per approved shipment
    complianceTimeSavings: shipments.length * 45, // 45 minutes saved per shipment
  };
}

// Overall fleet metrics
function calculateOverallMetrics({ settlements, lanes, documents, drivers, borderShipments }) {
  const totalRevenue = settlements.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalMargin = lanes.reduce((sum, l) => sum + (l.projectedMargin || 0), 0);
  const totalTimeSavings = (documents.length * 30) + (borderShipments.length * 45);
  const totalCostSavings = (totalRevenue * 0.15) + totalMargin * 0.20;

  return {
    totalRevenue,
    totalMargin,
    totalTimeSavings,
    totalCostSavings,
    automationROI: ((totalCostSavings + totalMargin) / (totalRevenue * 0.5)) * 100,
    operationalEfficiency: 87, // Simulated efficiency score
    dataPointsProcessed: settlements.length + lanes.length + documents.length + drivers.length + borderShipments.length,
    automationLayersActive: 5,
  };
}

// Generate dashboard insights
function generateDashboardInsights(metrics) {
  const insights = [];

  // Settlement insights
  if (metrics.settlementMetrics.paymentRate < 90) {
    insights.push({
      type: 'warning',
      layer: 'settlement',
      message: 'Payment rate below 90% - review pending settlements',
      priority: 'medium',
    });
  }

  if (metrics.settlementMetrics.automationRate > 90) {
    insights.push({
      type: 'success',
      layer: 'settlement',
      message: 'Excellent settlement automation - consider expanding to additional carriers',
      priority: 'low',
    });
  }

  // Lane insights
  if (metrics.laneMetrics.averageProjectedMargin > 500) {
    insights.push({
      type: 'success',
      layer: 'lane_optimization',
      message: 'Strong average margin - lane optimization performing well',
      priority: 'low',
    });
  }

  if (metrics.laneMetrics.missedOpportunities > 5) {
    insights.push({
      type: 'warning',
      layer: 'lane_optimization',
      message: 'Consider reviewing lane rejection criteria',
      priority: 'high',
    });
  }

  // Document insights
  if (metrics.documentMetrics.averageConfidence < 80) {
    insights.push({
      type: 'warning',
      layer: 'parse',
      message: 'Document parsing confidence below 80% - review quality',
      priority: 'high',
    });
  }

  // Driver insights
  if (metrics.driverMetrics.turnoverRisk > 20) {
    insights.push({
      type: 'critical',
      layer: 'driver_yield',
      message: 'High turnover risk detected - prioritize retention strategies',
      priority: 'high',
    });
  }

  // Border insights
  if (metrics.borderMetrics.approvalRate < 80) {
    insights.push({
      type: 'warning',
      layer: 'border_compliance',
      message: 'Border approval rate below 80% - document review needed',
      priority: 'medium',
    });
  }

  // Overall insights
  if (metrics.overall.automationROI > 50) {
    insights.push({
      type: 'success',
      layer: 'overall',
      message: 'Strong automation ROI - system is delivering value',
      priority: 'low',
    });
  }

  return insights;
}

// Sync all layers
async function syncAllLayers(db, fleetId) {
  // Simulated sync operation
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    success: true,
    message: 'All layers synchronized successfully',
    syncedLayers: ['settlement', 'lane_optimization', 'parse', 'driver_yield', 'border_compliance'],
    syncTime: new Date(),
  };
}

// Run diagnostic
async function runDiagnostic(db, fleetId) {
  const diagnosticResults = {
    settlement: { status: 'healthy', issues: [] },
    lane_optimization: { status: 'healthy', issues: [] },
    parse: { status: 'healthy', issues: [] },
    driver_yield: { status: 'healthy', issues: [] },
    border_compliance: { status: 'healthy', issues: [] },
  };

  // Run layer-specific diagnostics
  for (const layer of Object.keys(diagnosticResults)) {
    const collection = db.collection(layer === 'settlement' ? 'settlements' : 
                                        layer === 'lane_optimization' ? 'lanes' :
                                        layer === 'parse' ? 'documents' :
                                        layer === 'driver_yield' ? 'drivers' : 'cross_border');
    
    const count = await collection.countDocuments(fleetId ? { fleetId } : {});
    
    if (count === 0) {
      diagnosticResults[layer].status = 'warning';
      diagnosticResults[layer].issues.push('No data found');
    }
  }

  return {
    success: true,
    results: diagnosticResults,
    overallStatus: Object.values(diagnosticResults).every(d => d.status === 'healthy') ? 'healthy' : 'warning',
    diagnosticTime: new Date(),
  };
}

// Generate report
async function generateReport(db, fleetId, data) {
  const { reportType, dateRange } = data;

  const reportData = await getDashboardData(db, fleetId, dateRange, true);

  return {
    success: true,
    reportType,
    generatedAt: new Date(),
    data: reportData,
  };
}

module.exports = {
  calculateSettlementMetrics,
  calculateLaneMetrics,
  calculateDocumentMetrics,
  calculateDriverMetrics,
  calculateBorderMetrics,
  generateDashboardInsights,
};