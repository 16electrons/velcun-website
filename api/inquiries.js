// Vercel serverless function for handling inquiries
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/inquiries.json');

// Ensure data directory exists
const dataDir = path.dirname(DATA_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, company, email, fleet, plan, message } = req.body;

    // Validate required fields
    if (!name || !company || !email || !fleet || !plan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create inquiry object
    const inquiry = {
      id: Date.now().toString(),
      name,
      company,
      email,
      fleet,
      plan,
      message: message || '',
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    // Read existing inquiries
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const inquiries = JSON.parse(data);

    // Add new inquiry
    inquiries.push(inquiry);

    // Write back to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(inquiries, null, 2));

    // Return success
    res.status(200).json({ 
      success: true, 
      inquiry: { 
        id: inquiry.id, 
        createdAt: inquiry.createdAt 
      } 
    });
  } catch (error) {
    console.error('Error saving inquiry:', error);
    res.status(500).json({ error: 'Failed to save inquiry' });
  }
}
