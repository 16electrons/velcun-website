// Pilot application submission endpoint
const { connectToDatabase } = require('./lib/db');
const { sendPilotApplicationNotification } = require('./lib/email');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      name,
      email,
      phone,
      company,
      fleetSize,
      truckTypes,
      currentTMS,
      currentELD,
      painPoints,
    } = req.body;

    // Validate required fields
    if (!name || !email || !company || !fleetSize) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate fleet size
    if (!parseInt(fleetSize) || parseInt(fleetSize) < 1) {
      return res.status(400).json({ error: 'Invalid fleet size' });
    }

    // Connect to database
    const db = await connectToDatabase();
    const collection = db.collection('pilots');

    // Insert pilot application
    const result = await collection.insertOne({
      name,
      email,
      phone,
      company,
      fleetSize: parseInt(fleetSize),
      truckTypes: truckTypes || [],
      currentTMS,
      currentELD,
      painPoints: painPoints || [],
      submittedAt: new Date(),
      status: 'pending',
    });

    // Send email notification
    await sendPilotApplicationNotification({
      name,
      email,
      phone,
      company,
      fleetSize,
      truckTypes,
      currentTMS,
      currentELD,
      painPoints,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Pilot application submitted successfully',
      id: result.insertedId,
      estimatedReviewTime: '2-3 business days',
    });
  } catch (error) {
    console.error('Error submitting pilot application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}