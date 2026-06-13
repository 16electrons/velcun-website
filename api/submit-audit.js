// Fleet audit form processing endpoint
const { connectToDatabase } = require('./lib/db');
const { sendAuditNotification } = require('./lib/email');

// ROI calculation based on fleet size and operational factors
function calculateROI(fleetSize) {
  // Parse fleet size range
  const sizeMap = {
    '5-10': { min: 5, max: 10 },
    '11-25': { min: 11, max: 25 },
    '26-50': { min: 26, max: 50 },
    '51-100': { min: 51, max: 100 },
    '100+': { min: 100, max: 200 },
  };

  const size = sizeMap[fleetSize] || { min: 10, max: 25 };
  const avgFleetSize = (size.min + size.max) / 2;

  // Base recovery per truck: $500-$1,500 per month
  const perTruckRecovery = {
    min: 500,
    max: 1500,
  };

  // Calculate monthly and annual recovery
  const monthlyRecovery = avgFleetSize * ((perTruckRecovery.min + perTruckRecovery.max) / 2);
  const annualRecovery = monthlyRecovery * 12;

  // VELCUN cost per truck: $499-$899 per month depending on tier
  const perTruckCost = 650;
  const monthlyVELCUNCost = avgFleetSize * perTruckCost;
  const annualVELCUNCost = monthlyVELCUNCost * 12;

  // Net profit after VELCUN cost
  const netMonthlyProfit = monthlyRecovery - monthlyVELCUNCost;
  const netAnnualProfit = annualRecovery - annualVELCUNCost;

  return {
    fleetSize: fleetSize,
    avgFleetSize,
    monthlyRecovery,
    annualRecovery,
    monthlyVELCUNCost,
    annualVELCUNCost,
    netMonthlyProfit,
    netAnnualProfit,
    perTruckNetProfit: netMonthlyProfit / avgFleetSize,
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fleetSize, email } = req.body;

    // Validate required fields
    if (!fleetSize || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Calculate ROI
    const roi = calculateROI(fleetSize);

    // Connect to database
    const db = await connectToDatabase();
    const collection = db.collection('audits');

    // Insert audit request
    const result = await collection.insertOne({
      fleetSize,
      email,
      calculatedSavings: roi.netMonthlyProfit,
      annualRecovery: roi.netAnnualProfit,
      submittedAt: new Date(),
      status: 'pending',
      roiDetails: roi,
    });

    // Send email notification
    await sendAuditNotification({
      fleetSize,
      email,
      calculatedSavings: roi.netMonthlyProfit,
      annualRecovery: roi.netAnnualProfit,
    });

    // Return success response with ROI data
    res.status(200).json({
      success: true,
      message: 'Audit submitted successfully',
      id: result.insertedId,
      roi,
    });
  } catch (error) {
    console.error('Error submitting audit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}