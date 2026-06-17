// Onboarding step 4 - TMS/ELD integration details
const { resolveIdentity, saveOnboardingStep } = require('../lib/onboarding');

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
    const record = await saveOnboardingStep(identity, 'integration', req.body || {});
    return res.status(200).json({ success: true, step: 'integration', steps: record.steps });
  } catch (error) {
    console.error('Onboarding integration error:', error);
    return res.status(500).json({ success: false, error: 'Failed to save integration details' });
  }
}
