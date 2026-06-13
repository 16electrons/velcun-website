// Predictive Lane Optimization (Lane IQ) API
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const lanesCollection = db.collection('lanes');

    // GET - Fetch lane intelligence
    if (req.method === 'GET') {
      const { fleetId, origin, destination, status, radius, dateRange } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (origin) query.origin = origin;
      if (destination) query.destination = destination;
      if (status) query.status = status;
      
      if (dateRange) {
        const { startDate, endDate } = JSON.parse(dateRange);
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      const lanes = await lanesCollection
        .find(query)
        .sort({ projectedMargin: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        data: lanes,
      });
    }

    // POST - Create lane intelligence record or request prediction
    if (req.method === 'POST') {
      const {
        fleetId,
        origin,
        destination,
        weight,
        equipment,
        loadType,
        currentRate,
        proposedRate,
        distance,
        estimatedDeadhead,
        status = 'pending',
        notes,
      } = req.body;

      // Validate required fields
      if (!origin || !destination || !currentRate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Calculate lane intelligence metrics
      const laneMetrics = calculateLaneIntelligence({
        currentRate,
        proposedRate,
        distance,
        estimatedDeadhead,
        weight,
        equipment,
      });

      const result = await lanesCollection.insertOne({
        fleetId,
        origin,
        destination,
        weight,
        equipment,
        loadType,
        currentRate: parseFloat(currentRate),
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        distance: distance ? parseFloat(distance) : null,
        estimatedDeadhead: estimatedDeadhead ? parseFloat(estimatedDeadhead) : null,
        ...laneMetrics,
        status,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: 'Lane intelligence created',
        id: result.insertedId,
        metrics: laneMetrics,
      });
    }

    // PUT - Update lane intelligence
    if (req.method === 'PUT') {
      const { id, status, proposedRate, notes, actualMargin } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Lane ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (proposedRate) updateData.proposedRate = parseFloat(proposedRate);
      if (notes) updateData.notes = notes;
      if (actualMargin) updateData.actualMargin = parseFloat(actualMargin);

      const result = await lanesCollection.updateOne(
        { _id: id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Lane not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Lane intelligence updated successfully',
      });
    }

    // DELETE - Remove lane intelligence
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Lane ID required' });
      }

      const result = await lanesCollection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Lane not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Lane intelligence deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error in lane IQ API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Lane intelligence calculation algorithm
function calculateLaneIntelligence(data) {
  const { currentRate, proposedRate, distance, estimatedDeadhead, weight, equipment } = data;

  const ratePerMile = distance ? currentRate / distance : 0;
  const profitMargin = proposedRate ? proposedRate - currentRate : 0;
  const profitMarginPercent = proposedRate ? ((proposedRate - currentRate) / currentRate) * 100 : 0;

  // Estimated fuel costs
  const fuelCostPerMile = 0.50; // Average fuel cost
  const estimatedFuelCost = distance ? distance * fuelCostPerMile : 0;

  // Calculate projected margin after fuel and deadhead
  const projectedMargin = currentRate - estimatedFuelCost - (estimatedDeadhead || 0);

  // Lane attractiveness score (0-100)
  const attractivenessScore = calculateLaneAttractiveness({
    profitMarginPercent,
    ratePerMile,
    distance,
    equipment,
  });

  // Market demand indicator
  const demandLevel = predictMarketDemand(origin, destination, equipment);

  return {
    ratePerMile,
    profitMargin,
    profitMarginPercent,
    projectedMargin,
    estimatedFuelCost,
    attractivenessScore,
    demandLevel,
    recommendation: getLaneRecommendation(attracttractivenessScore, demandLevel),
  };
}

// Lane attractiveness scoring
function calculateLaneAttractiveness({ profitMarginPercent, ratePerMile, distance, equipment }) {
  let score = 50; // Base score

  // Profit margin impact
  score += profitMarginPercent * 0.3;

  // Rate per mile impact
  if (ratePerMile > 3) score += 10;
  else if (ratePerMile < 1.5) score -= 10;

  // Distance impact (shorter is generally better)
  if (distance && distance < 500) score += 5;
  else if (distance && distance > 2000) score -= 5;

  // Equipment bonus
  const premiumEquipment = ['reefer', 'flatbed', 'tanker'];
  if (premiumEquipment.includes(equipment)) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

// Market demand prediction
function predictMarketDemand(origin, destination, equipment) {
  // Simulated demand prediction
  const highDemandDestinations = ['Dallas', 'Chicago', 'Los Angeles', 'Atlanta', 'Houston'];
  const mediumDemand = ['Phoenix', 'Denver', 'Seattle', 'Miami'];
  
  if (highDemandDestinations.includes(destination) || highDemandDestinations.includes(origin)) {
    return 'high';
  } else if (mediumDemand.includes(destination) || mediumDemand.includes(origin)) {
    return 'medium';
  }
  return 'low';
}

// Lane recommendation
function getLaneRecommendation(attracttractivenessScore, demandLevel) {
  if (attractivenessScore >= 80 && demandLevel === 'high') {
    return 'highly recommended';
  } else if (attractivenessScore >= 60 && demandLevel !== 'low') {
    return 'recommended';
  } else if (attractivenessScore >= 40) {
    return 'consider';
  } else {
    return 'not recommended';
  }
}

module.exports = { calculateLaneIntelligence, predictMarketDemand };