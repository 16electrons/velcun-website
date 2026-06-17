// Admin overview - aggregate platform stats (admin only)
const { connectToDatabase } = require('../lib/db');
const { getAuthPayload } = require('../lib/auth');

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

  const payload = getAuthPayload(req);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Forbidden - admin access required' });
  }

  try {
    const db = await connectToDatabase();

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const count = (name, query = {}) => db.collection(name).countDocuments(query);

    const [
      users,
      contacts,
      audits,
      pilots,
      inquiries,
      settlements,
      lanes,
      documents,
      onboardingCompleted,
      newUsers30d,
      newInquiries30d,
    ] = await Promise.all([
      count('users'),
      count('contacts'),
      count('audits'),
      count('pilots'),
      count('inquiries'),
      count('settlements'),
      count('lanes'),
      count('documents'),
      count('onboarding', { completed: true }),
      count('users', { createdAt: { $gte: since } }),
      count('inquiries', { submittedAt: { $gte: since } }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        users,
        contacts,
        audits,
        pilots,
        inquiries,
        settlements,
        lanes,
        documents,
        onboardingCompleted,
      },
      last30Days: {
        newUsers: newUsers30d,
        newInquiries: newInquiries30d,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load overview' });
  }
}
