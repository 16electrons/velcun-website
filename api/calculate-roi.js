// ROI calculator API endpoint
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get parameters from query or body
    const params = req.method === 'GET' ? req.query : req.body;
    const { fleetSize, plan } = params;

    if (!fleetSize) {
      return res.status(400).json({ error: 'Fleet size is required' });
    }

    // Parse fleet size
    const fleetSizeNum = parseInt(fleetSize, 10);
    if (isNaN(fleetSizeNum) || fleetSizeNum < 1) {
      return res.status(400).json({ error: 'Invalid fleet size' });
    }

    // Calculate ROI based on plan and fleet size
    const plans = {
      dispatch: { costPerTruck: 499, annual: 399, recoveryPerTruck: { min: 500, max: 800 } },
      ecosystem: { costPerTruck: 899, annual: 719, recoveryPerTruck: { min: 800, max: 1200 } },
      enterprise: { costPerTruck: 1199, annual: 959, recoveryPerTruck: { min: 1000, max: 1500 } },
    };

    const selectedPlan = plans[plan] || plans.dispatch;
    const isAnnual = params.billing === 'annual';

    // Calculate monthly costs and recovery
    const monthlyCost = fleetSizeNum * (isAnnual ? selectedPlan.annual : selectedPlan.costPerTruck);
    const annualCost = monthlyCost * 12;

    const avgRecoveryPerTruck = (selectedPlan.recoveryPerTruck.min + selectedPlan.recoveryPerTruck.max) / 2;
    const monthlyRecovery = fleetSizeNum * avgRecoveryPerTruck;
    const annualRecovery = monthlyRecovery * 12;

    // Net profit after VELCUN cost
    const netMonthlyProfit = monthlyRecovery - monthlyCost;
    const netAnnualProfit = annualRecovery - annualCost;
    const perTruckNetProfit = netMonthlyProfit / fleetSizeNum;

    // ROI percentage
    const roiPercent = ((netAnnualProfit / annualCost) * 100).toFixed(1);

    res.status(200).json({
      success: true,
      data: {
        fleetSize: fleetSizeNum,
        plan: plan || 'dispatch',
        billing: isAnnual ? 'annual' : 'monthly',
        monthlyCost,
        annualCost,
        monthlyRecovery,
        annualRecovery,
        netMonthlyProfit,
        netAnnualProfit,
        perTruckNetProfit,
        roiPercent,
      },
    });
  } catch (error) {
    console.error('Error calculating ROI:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}