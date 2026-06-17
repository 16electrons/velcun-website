// Health check endpoint - reports API and database status
const { connectToDatabase } = require('./lib/db');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const checks = { api: 'ok', database: 'unknown' };

  try {
    const db = await connectToDatabase();
    await db.command({ ping: 1 });
    checks.database = 'ok';
  } catch (error) {
    console.error('Health check DB error:', error);
    checks.database = 'error';
  }

  const healthy = checks.database === 'ok';

  return res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 'healthy' : 'degraded',
    checks,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
}
