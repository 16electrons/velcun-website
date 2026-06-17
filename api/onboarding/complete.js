// Onboarding completion - marks onboarding finished and stores the full payload
const { connectToDatabase } = require('../lib/db');
const { resolveIdentity, identityFilter } = require('../lib/onboarding');

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

  const identity = resolveIdentity(req);
  if (!identity) {
    return res.status(401).json({ success: false, error: 'Authentication or email required' });
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('onboarding');

    await collection.updateOne(
      identityFilter(identity),
      {
        $set: {
          steps: req.body || {},
          userId: identity.userId,
          email: identity.email,
          completed: true,
          completedAt: new Date(),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      completed: true,
      message: 'Onboarding completed successfully',
    });
  } catch (error) {
    console.error('Onboarding complete error:', error);
    return res.status(500).json({ success: false, error: 'Failed to complete onboarding' });
  }
}
