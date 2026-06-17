// Logout endpoint - clears the auth cookie
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

  // Expire the auth cookie immediately
  res.setHeader(
    'Set-Cookie',
    'velcun_token=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'
  );

  return res.status(200).json({ success: true, message: 'Logged out successfully' });
}
