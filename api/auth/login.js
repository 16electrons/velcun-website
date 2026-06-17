// User login endpoint
const { connectToDatabase } = require('../lib/db');
const { generateToken, verifyPassword } = require('../lib/auth');

const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

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

  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' });
    }

    const db = await connectToDatabase();
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user || !user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    await usersCollection.updateOne(
      { _id: user._id },
      { $set: { lastLogin: new Date() } }
    );

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role || 'user',
    });

    res.setHeader(
      'Set-Cookie',
      `velcun_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${TOKEN_MAX_AGE}`
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        company: user.company || null,
        role: user.role || 'user',
      },
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
}
