// Driver-First Retention (Driver Yield) API
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const driversCollection = db.collection('drivers');

    // GET - Fetch driver data
    if (req.method === 'GET') {
      const { fleetId, driverId, status, riskLevel, startDate, endDate } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (driverId) query.driverId = driverId;
      if (status) query.status = status;
      if (riskLevel) query.riskLevel = riskLevel;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const drivers = await driversCollection
        .find(query)
        .sort({ retentionScore: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        data: drivers,
      });
    }

    // POST - Create or update driver profile
    if (req.method === 'POST') {
      const {
        fleetId,
        driverId,
        firstName,
        lastName,
        phone,
        email,
        hireDate,
        equipment,
        currentRoute,
        status = 'active',
        performanceMetrics,
        availability,
        preferences,
      } = req.body;

      // Validate required fields
      if (!driverId || !fleetId || !firstName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Calculate retention score and risk assessment
      const driverAnalysis = calculateDriverYieldMetrics({
        hireDate,
        performanceMetrics,
        status,
        preferences,
      });

      const result = await driversCollection.updateOne(
        { driverId },
        {
          $set: {
            fleetId,
            firstName,
            lastName,
            phone,
            email,
            hireDate: hireDate ? new Date(hireDate) : null,
            equipment,
            currentRoute,
            status,
            performanceMetrics: performanceMetrics || {},
            availability: availability || {},
            preferences: preferences || {},
            ...driverAnalysis,
            updatedAt: new Date(),
          },
        },
        { upsert: true }
      );

      return res.status(201).json({
        success: true,
        message: 'Driver profile updated',
        driverId,
        metrics: driverAnalysis,
      });
    }

    // PUT - Update driver information
    if (req.method === 'PUT') {
      const { driverId, status, performanceMetrics, availability, preferences, notes } = req.body;

      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (status) {
        updateData.status = status;
        // Recalculate retention score when status changes
        updateData.retentionScore = calculateRetentionScore(status);
      }
      if (performanceMetrics) updateData.performanceMetrics = performanceMetrics;
      if (availability) updateData.availability = availability;
      if (preferences) updateData.preferences = preferences;
      if (notes) updateData.notes = notes;

      const result = await driversCollection.updateOne(
        { driverId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Driver information updated successfully',
      });
    }

    // DELETE - Remove driver profile
    if (req.method === 'DELETE') {
      const { driverId } = req.query;
      
      if (!driverId) {
        return res.status(400).json({ error: 'Driver ID required' });
      }

      const result = await driversCollection.deleteOne({ driverId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Driver not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Driver profile removed successfully',
      });
    }
  } catch (error) {
    console.error('Error in driver yield API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Driver yield metrics calculation
function calculateDriverYieldMetrics({ hireDate, performanceMetrics, status, preferences }) {
  const retentionScore = calculateRetentionScore(status);
  const turnoverRisk = assessTurnoverRisk({ hireDate, performanceMetrics, preferences });
  const productivityScore = calculateProductivityScore(performanceMetrics);
  const satisfactionScore = calculateSatisfactionScore(performanceMetrics, preferences);
  
  return {
    retentionScore,
    riskLevel: getRiskLevel(turnoverRisk),
    productivityScore,
    satisfactionScore,
    overallDriverYield: (retentionScore + productivityScore + satisfactionScore) / 3,
    recommendations: generateDriverRecommendations({ status, performanceMetrics, preferences, turnoverRisk }),
  };
}

function calculateRetentionScore(status) {
  const statusScores = {
    active: 100,
    warning: 60,
    probation: 30,
    inactive: 10,
    terminated: 0,
  };

  return statusScores[status] || 70;
}

function assessTurnoverRisk({ hireDate, performanceMetrics, preferences }) {
  let riskScore = 30; // Base risk

  // Tenure impact (longer tenure = lower risk)
  if (hireDate) {
    const tenureMonths = (new Date() - new Date(hireDate)) / (30 * 24 * 60 * 60 * 1000);
    if (tenureMonths > 24) riskScore -= 20;
    else if (tenureMonths > 12) riskScore -= 10;
    else if (tenureMonths < 3) riskScore += 15;
  }

  // Performance impact
  if (performanceMetrics) {
    if (performanceMetrics.onTimeDeliveryPercent < 90) riskScore += 15;
    if (performanceMetrics.safetyScore < 4) riskScore += 10;
    if (performanceMetrics.customerSatisfaction < 3) riskScore += 10;
  }

  // Preferences impact
  if (preferences) {
    if (preferences.homeTimePreference === 'strict') riskScore += 5;
    if (preferences.routePreferences && preferences.routePreferences.includes('long-haul')) riskScore -= 5;
  }

  return Math.max(0, Math.min(100, riskScore));
}

function getRiskLevel(riskScore) {
  if (riskScore >= 70) return 'high';
  if (riskScore >= 40) return 'medium';
  return 'low';
}

function calculateProductivityScore(performanceMetrics) {
  if (!performanceMetrics) return 50;

  let score = 50;
  score += performanceMetrics.onTimeDeliveryPercent ? (performanceMetrics.onTimeDeliveryPercent - 50) * 0.5 : 0;
  score += (performanceMetrics.safetyScore || 4) * 10;
  score += (performanceMetrics.loadCount || 0) * 2;
  score += (performanceMetrics.customerSatisfaction || 3) * 5;

  return Math.max(0, Math.min(100, score));
}

function calculateSatisfactionScore(performanceMetrics, preferences) {
  let score = 50;

  if (performanceMetrics) {
    score += (performanceMetrics.customerSatisfaction || 3) * 12;
    score += (performanceMetrics.safetyScore || 4) * 8;
    score += (performanceMetrics.homeTimeSatisfaction || 3) * 8;
  }

  if (preferences) {
    if (preferences.routePreferences) {
      if (preferences.routePreferences.length > 2) score += 5;
    }
    if (preferences.homeTimePreference === 'flexible') score += 5;
  }

  return Math.max(0, Math.min(100, score));
}

function generateDriverRecommendations({ status, performanceMetrics, preferences, turnoverRisk }) {
  const recommendations = [];

  if (status === 'warning') {
    recommendations.push({
      type: 'retention',
      priority: 'high',
      message: 'Consider reaching out to driver to address concerns',
    });
  }

  if (performanceMetrics && performanceMetrics.onTimeDeliveryPercent < 85) {
    recommendations.push({
      type: 'productivity',
      routeOptimization: true,
      priority: 'medium',
      message: 'Consider optimizing routes to improve on-time delivery',
    });
  }

  if (performanceMetrics && performanceMetrics.safetyScore < 3) {
    recommendations.push({
      type: 'safety',
      priority: 'high',
      message: 'Safety concerns detected - schedule driver coaching session',
    });
  }

  if (turnoverRisk >= 70) {
    recommendations.push({
      type: 'retention',
      priority: 'high',
      message: 'High turnover risk - proactively engage with driver',
    });
  }

  if (preferences && preferences.homeTimePreference === 'strict' && performanceMetrics) {
    const avgHomeTime = performanceMetrics.avgHomeTime || 10;
    if (avgHomeTime < 10) {
      recommendations.push({
        type: 'scheduling',
        priority: 'medium',
        message: 'Consider adjusting schedule to meet home time preferences',
      });
    }
  }

  return recommendations;
}

module.exports = { calculateDriverYieldMetrics, assessTurnoverRisk, generateDriverRecommendations };