// Current user profile endpoint
const { ObjectId } = require('mongodb');
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

  try {
    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    let user = null;
    if (ObjectId.isValid(payload.userId)) {
      user = await usersCollection.findOne({ _id: new ObjectId(payload.userId) });
    }
    if (!user) {
      user = await usersCollection.findOne({ email: payload.email });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company || null,
        role: user.role || 'user',
        createdAt: user.createdAt,
        lastLogin: user.lastLogin || null,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
