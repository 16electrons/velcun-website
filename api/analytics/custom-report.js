// Custom analytics report builder
const { connectToDatabase } = require('../lib/db');
const { getAuthPayload } = require('../lib/auth');

// Map of supported report metrics to the collection + numeric field they summarize.
const METRIC_CONFIG = {
  settlements: { collection: 'settlements', amountField: 'amount' },
  lanes: { collection: 'lanes', amountField: 'projectedMargin' },
  documents: { collection: 'documents', amountField: null },
  drivers: { collection: 'drivers', amountField: null },
  inquiries: { collection: 'inquiries', amountField: null },
  contacts: { collection: 'contacts', amountField: null },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const payload = getAuthPayload(req);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const { metrics, fleetId, startDate, endDate } = req.body || {};

    const requested = Array.isArray(metrics) && metrics.length
      ? metrics.filter((m) => METRIC_CONFIG[m])
      : Object.keys(METRIC_CONFIG);

    if (!requested.length) {
      return res.status(400).json({ success: false, error: 'No valid metrics requested' });
    }

    const query = {};
    if (fleetId) query.fleetId = fleetId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const db = await connectToDatabase();

    const sections = await Promise.all(
      requested.map(async (metric) => {
        const { collection, amountField } = METRIC_CONFIG[metric];
        const docs = await db.collection(collection).find(query).toArray();
        const total = amountField
          ? docs.reduce((sum, d) => sum + (Number(d[amountField]) || 0), 0)
          : null;

        return {
          metric,
          count: docs.length,
          total,
          average: amountField && docs.length ? total / docs.length : null,
        };
      })
    );

    return res.status(200).json({
      success: true,
      report: {
        metrics: sections,
        filters: { fleetId: fleetId || null, startDate: startDate || null, endDate: endDate || null },
        generatedBy: payload.email,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Custom report error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
}
