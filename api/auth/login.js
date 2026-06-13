// Authentication API with Email Login and Session Management
const { connectToDatabase } = require('./lib/db');

// JWT secret - in production use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple JWT implementation
function generateJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const tokenPayload = {
    ...payload,
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + (60 * 60 * 24 * 7), // 7 days
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(tokenPayload)).toString('base64url');
  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = Buffer.from(signatureInput).toString('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Verify JWT token
function verifyJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

// Generate simple ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  // Login with email and password (simplified for demo)
  if (req.method === 'POST' && action === 'login') {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Check if user exists
      let user = await usersCollection.findOne({ email: email.toLowerCase() });

      // Create user if doesn't exist (for demo)
      if (!user) {
        const newUser = {
          id: generateId(),
          email: email.toLowerCase(),
          name: email.split('@')[0],
          role: 'user',
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      } else {
        // Update last login
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        );
      }

      // Generate JWT token
      const token = generateJWT({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      });

      // Set HTTP-only cookie
      res.setHeader('Set-Cookie', `velcun_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`);

      return res.status(200).json({
        success: true,
        token: token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, error: 'Login failed' });
    }
  }

  // Get current user info
  if (req.method === 'GET' && action === 'me') {
    const authHeader = req.headers.authorization || req.cookies.velcun_token;
    const token = authHeader?.replace('Bearer ', '') || req.cookies.velcun_token;

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
      const payload = verifyJWT(token);
      
      if (!payload) {
        return res.status(401).json({ success: false, error: 'Invalid token' });
      }

      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      
      const user = await usersCollection.findOne({ _id: payload.userId });

      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
          lastLogin: user.lastLogin,
        }
      });

    } catch (error) {
      console.error('User info error:', error);
      return res.status(500).json({ success: false, error: 'Failed to get user info' });
    }
  }

  // Logout
  if (req.method === 'POST' && action === 'logout') {
    res.setHeader('Set-Cookie', 'velcun_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  // Demo login (for testing without credentials)
  if (req.method === 'GET' && action === 'demo-login') {
    try {
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Create or get demo user
      let user = await usersCollection.findOne({ email: 'demo@velcun.com' });

      if (!user) {
        const newUser = {
          id: generateId(),
          email: 'demo@velcun.com',
          name: 'Demo User',
          role: 'admin',
          createdAt: new Date(),
          lastLogin: new Date(),
        };

        const result = await usersCollection.insertOne(newUser);
        user = { ...newUser, _id: result.insertedId };
      } else {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { lastLogin: new Date() } }
        );
      }

      const token = generateJWT({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      });

      res.setHeader('Set-Cookie', `velcun_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 7}`);

      return res.status(200).json({
        success: true,
        token: token,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        },
        message: 'Demo login successful'
      });

    } catch (error) {
      console.error('Demo login error:', error);
      return res.status(500).json({ success: false, error: 'Demo login failed' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}