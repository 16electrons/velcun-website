// Shared helpers for onboarding step endpoints
const { connectToDatabase } = require('./db');
const { getAuthPayload } = require('./auth');

// Resolve the identity for an onboarding request, from the auth token or the
// email provided in the request body. Returns null if neither is available.
function resolveIdentity(req) {
  const payload = getAuthPayload(req);
  if (payload && payload.userId) {
    return { userId: payload.userId, email: payload.email || null };
  }

  const body = req.body || {};
  const email = body.email || (body.account && body.account.email) || null;
  if (email) {
    return { userId: null, email: String(email).toLowerCase() };
  }

  return null;
}

function identityFilter(identity) {
  return identity.userId ? { userId: identity.userId } : { email: identity.email };
}

// Upsert a single onboarding step's data for the given identity.
async function saveOnboardingStep(identity, step, data) {
  const db = await connectToDatabase();
  const collection = db.collection('onboarding');

  await collection.updateOne(
    identityFilter(identity),
    {
      $set: {
        [`steps.${step}`]: data,
        userId: identity.userId,
        email: identity.email,
        updatedAt: new Date(),
      },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true }
  );

  return collection.findOne(identityFilter(identity));
}

module.exports = { resolveIdentity, identityFilter, saveOnboardingStep };
