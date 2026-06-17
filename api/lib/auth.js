// Authentication utilities
const crypto = require('crypto');

// Simple JWT-like token (for MVP)
// For production, use jsonwebtoken package
function generateToken(payload) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64url');
    
    if (signature !== parts[2]) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

// Password hashing (for production, use bcrypt)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hash) {
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  return passwordHash === hash;
}

// Middleware for protecting routes
function authenticateRequest(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  req.user = payload;
  next();
}

// Extract a bearer/cookie token from a request and return its verified payload (or null)
function getAuthPayload(req) {
  const authHeader = req.headers && req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && req.cookies.velcun_token) {
    token = req.cookies.velcun_token;
  }

  if (!token) return null;
  return verifyToken(token);
}

module.exports = {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  authenticateRequest,
  getAuthPayload,
};