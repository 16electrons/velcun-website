// Token verification endpoint
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
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }

  return res.status(200).json({
    success: true,
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'user',
    },
  });
}
