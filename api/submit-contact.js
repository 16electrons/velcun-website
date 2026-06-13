// Contact form submission endpoint
const { connectToDatabase } = require('./lib/db');
const { sendContactNotification } = require('./lib/email');

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, company, fleetSize, plan, notes } = req.body;

    // Validate required fields
    if (!name || !email || !company) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Connect to database
    const db = await connectToDatabase();
    const collection = db.collection('contacts');

    // Insert contact form submission
    const result = await collection.insertOne({
      name,
      email,
      phone,
      company,
      fleetSize,
      plan,
      notes,
      submittedAt: new Date(),
      status: 'new',
    });

    // Send email notification
    await sendContactNotification({
      name,
      email,
      phone,
      company,
      fleetSize,
      plan,
      notes,
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Contact form submitted successfully',
      id: result.insertedId,
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}