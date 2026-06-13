// Autonomous Settlement (Settle) API
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const settlementCollection = db.collection('settlements');

    // GET - Fetch settlements
    if (req.method === 'GET') {
      const { fleetId, status, startDate, endDate } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const settlements = await settlementCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray();

      return res.status(200).json({
        success: true,
        data: settlements,
      });
    }

    // POST - Create settlement record
    if (req.method === 'POST') {
      const {
        fleetId,
        loadId,
        invoiceNumber,
        carrier,
        shipper,
        amount,
        dueDate,
        invoiceDate,
        status = 'pending',
        documents = [],
        ediData,
        notes,
      } = req.body;

      // Validate required fields
      if (!fleetId || !loadId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await settlementCollection.insertOne({
        fleetId,
        loadId,
        invoiceNumber,
        carrier,
        shipper,
        amount: parseFloat(amount),
        dueDate: dueDate ? new Date(dueDate) : null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        status,
        documents: documents || [],
        ediData,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        processingLog: [],
      });

      // Trigger automated settlement processing
      await processSettlement(db, result.insertedId);

      return res.status(201).json({
        success: true,
        message: 'Settlement created and processing initiated',
        id: result.insertedId,
      });
    }

    // PUT - Update settlement
    if (req.method === 'PUT') {
      const { id, status, documents, notes, paymentDate, paymentMethod } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Settlement ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (documents) updateData.documents = documents;
      if (notes) updateData.notes = notes;
      if (paymentDate) {
        updateData.paymentDate = new Date(paymentDate);
        updateData.paymentMethod = paymentMethod;
      }

      const result = await settlementCollection.updateOne(
        { _id: id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Settlement not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Settlement updated successfully',
      });
    }

    // DELETE - Remove settlement
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Settlement ID required' });
      }

      const result = await settlementCollection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Settlement not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Settlement deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error in settlement API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Autonomous settlement processing
async function processSettlement(db, settlementId) {
  try {
    const settlementCollection = db.collection('settlements');
    
    // Simulate automated settlement workflow
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updateData = {
      $set: {
        status: 'processing',
        processingLog: [
          { timestamp: new Date(), action: 'Invoice received', status: 'success' },
          { timestamp: new Date(), action: 'EDI parsing initiated', status: 'pending' },
        ],
        updatedAt: new Date(),
      },
    };

    await settlementCollection.updateOne({ _id: settlementId }, updateData);

    // Simulate EDI parsing
    await new Promise(resolve => setTimeout(resolve, 2000));

    await settlementCollection.updateOne(
      { _id: settlementId },
      {
        $push: {
          processingLog: {
            timestamp: new Date(),
            action: 'EDI parsing completed',
            status: 'success',
          },
        },
        $set: { status: 'validated' },
      }
    );

    // Simulate payment initiation
    await new Promise(resolve => setTimeout(resolve, 1500));

    await settlementCollection.updateOne(
      { _id: settlementId },
      {
        $push: {
          processingLog: {
            timestamp: new Date(),
            action: 'Payment initiation',
            status: 'success',
          },
        },
        $set: { status: 'paid' },
      }
    );

    return true;
  } catch (error) {
    console.error('Error processing settlement:', error);
    return false;
  }
}

module.exports = { processSettlement };