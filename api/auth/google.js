// Google OAuth Authentication API
const { connectToDatabase } = require('./lib/db');

// Google OAuth configuration (get from environment variables)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.VERCEL_URL}/api/auth/google/callback`;

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple JWT implementation for demo (use proper JWT library in production)
function generateJWT(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = Buffer.from(`${encodedHeader}.${encodedPayload}`).toString('base64');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, code, state } = req.query;

  // Initiate Google OAuth flow
  if (action === 'login') {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `state=${state || 'velcun-auth'}`;

    return res.status(200).json({
      success: true,
      authUrl: googleAuthUrl,
      message: 'Redirect to Google for authentication'
    });
  }

  // Handle Google OAuth callback
  if (action === 'callback') {
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }

    try {
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        return res.status(400).json({ error: 'Failed to exchange authorization code' });
      }

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      const userInfo = await userInfoResponse.json();

      // Connect to database
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');

      // Check if user exists
      let user = await usersCollection.findOne({ email: userInfo.email });

      // Create user if doesn't exist
      if (!user) {
        const newUser = {
          email: userInfo.email,
          name: userInfo.name,
          googleId: userInfo.id,
          picture: userInfo.picture,
          givenName: userInfo.given_name,
          familyName: userInfo.family_name,
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
          { 
            $set: { 
              lastLogin: new Date(),
              picture: userInfo.picture,
              name: userInfo.name
            } 
          }
        );
      }

      // Generate JWT token
      const token = generateJWT({
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
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
          picture: user.picture,
          role: user.role,
        },
        message: 'Authentication successful'
      });

    } catch (error) {
      console.error('Google OAuth error:', error);
      return res.status(500).json({ error: 'Authentication failed' });
    }
  }

  // Get current user info (verify token)
  if (action === 'me') {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    try {
      // Verify token (simplified - use proper JWT library in production)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      
      const db = await connectToDatabase();
      const usersCollection = db.collection('users');
      
      const user = await usersCollection.findOne({ _id: payload.userId });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.status(200).json({
        success: true,
        user: {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
        }
      });

    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Logout
  if (action === 'logout') {
    res.setHeader('Set-Cookie', 'velcun_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  return res.status(400).json({ error: 'Invalid action' });
}