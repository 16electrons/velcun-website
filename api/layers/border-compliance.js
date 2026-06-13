// Border Compliance (Border) API
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const borderCollection = db.collection('cross_border');

    // GET - Fetch border crossing data
    if (req.method === 'GET') {
      const { fleetId, shipmentId, status, checkpoint, startDate, endDate } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (shipmentId) query.shipmentId = shipmentId;
      if (status) query.status = status;
      if (checkpoint) query.checkpoint = checkpoint;
      
      if (startDate || endDate) {
        query.scheduledDate = {};
        if (startDate) query.scheduledDate.$gte = new Date(startDate);
        if (endDate) query.scheduledDate.$lte = new Date(endDate);
      }

      const shipments = await borderCollection
        .find(query)
        .sort({ scheduledDate: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        data: shipments,
      });
    }

    // POST - Create or update border shipment record
    if (req.method === 'POST') {
      const {
        fleetId,
        shipmentId,
        origin,
        destination,
        originCountry,
        destinationCountry,
        equipment,
        cargoType,
        carrier,
        scheduledDate,
        status = 'pending',
        documents = [],
        complianceChecklist,
        customsValue,
        hazmat,
        temperatureControl,
        weight,
        notes,
      } = req.body;

      // Validate required fields
      if (!origin || !destination || !originCountry || !destinationCountry) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Perform automated compliance check
      const complianceCheck = performComplianceCheck({
        originCountry,
        destinationCountry,
        equipment,
        cargoType,
        hazmat,
        temperatureControl,
        customsValue,
        documents,
      });

      const result = await borderCollection.updateOne(
        { shipmentId },
        {
          $set: {
            fleetId,
            origin,
            destination,
            originCountry,
            destinationCountry,
            equipment,
            cargoType,
            carrier,
            scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
            status: complianceCheck.approved ? 'approved' : 'pending',
            documents: documents || [],
            complianceChecklist: complianceChecklist || {},
            customsValue: customsValue ? parseFloat(customsValue) : null,
            hazmat: hazmat || false,
            temperatureControl: temperatureControl || false,
            weight: weight ? parseFloat(weight) : null,
            notes,
            ...complianceCheck,
            createdAt: new Date(),
            updatedAt: new Date(),
            complianceLog: [
              { timestamp: new Date(), action: 'Automated compliance check', status: 'completed' },
              { timestamp: new Date(), action: `Compliance score: ${complianceCheck.score}/100`, status: 'completed' },
            ],
          },
        },
        { upsert: true }
      );

      // If not approved, trigger document request
      if (!complianceCheck.approved) {
        await requestMissingDocuments(db, result.upsertedId, complianceCheck.missingDocuments);
      }

      const finalStatus = result.upserted ? 'updated' : 'created';

      return res.status(201).json({
        success: true,
        message: `Shipment ${finalStatus} successfully`,
        shipmentId,
        complianceCheck,
      });
    }

    // PUT - Update shipment status or compliance
    if (req.method === 'PUT') {
      const { shipmentId, status, documents, notes, actualBorderCrossingTime, checkpoint } = req.body;

      if (!shipmentId) {
        return res.status(400).json({ error: 'Shipment ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (documents) updateData.documents = documents;
      if (notes) updateData.notes = notes;
      if (actualBorderCrossingTime) {
        updateData.actualBorderCrossingTime = new Date(actualBorderCrossingTime);
      }
      if (checkpoint) updateData.checkpoint = checkpoint;

      // Update compliance log
      if (status) {
        await borderCollection.updateOne(
          { shipmentId },
          {
            $push: {
              timestamp: new Date(),
              action: `Status changed to ${status}`,
              status: 'completed',
            },
          },
        );
      }

      const result = await borderCollection.updateOne(
        { shipmentId },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Shipment updated successfully',
      });
    }

    // DELETE - Remove shipment
    if (req.method === 'DELETE') {
      const { shipmentId } = req.query;
      
      if (!shipmentId) {
        return res.status(400).json({ error: 'shipment ID required' });
      }

      const result = await borderCollection.deleteOne({ shipmentId });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Shipment not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Shipment removed successfully',
      });
    }
  } catch (error) {
    console.error('Error in border compliance API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Automated compliance check
function performComplianceCheck({ originCountry, destinationCountry, equipment, cargoType, hazmat, temperatureControl, customsValue, documents }) {
  const complianceChecklist = {
    requiredDocuments: [],
    missingDocuments: [],
    flaggedIssues: [],
    score: 100,
    approved: true,
  };

  // NAFTA/USMCA requirements
  const usCanadaCrossing = (originCountry === 'US' && destinationCountry === 'CA') || 
                          (originCountry === 'CA' && destinationCountry === 'US');

  const usMexicoCrossing = (originCountry === 'US' && destinationCountry === 'MX') || 
                        (originCountry === 'MX' && destinationCountry === 'US');

  // Determine required documents based on route and cargo
  if (usCanadaCrossing) {
    complianceChecklist.requiredDocuments.push('Bill of Lading');
    complianceChecklist.requiredDocuments.push('Commercial Invoice');
    complianceChecklist.requiredDocuments.push('Certificate of Origin');
    complianceChecklist.requiredDocuments.push('NAFTA Certificate of Origin');
    
    if (equipment.includes('flatbed')) {
      complianceChecklist.requiredDocuments.push('Dimensions & Weight Certificate');
    }
  }

  if (usMexicoCrossing) {
    complianceChecklist.requiredDocuments.push('Bill of Lading');
    complianceChecklist.requiredDocuments.push('Commercial Invoice');
    complianceChecklist.requiredDocuments.push('Packing List');
    complianceChecklist.requiredDocuments.push('Certificate of Origin');
    complianceChecklist.requiredDocuments.push('Pedimento');
    complianceChecklist.requiredDocuments.push('APEX/SLD (if processed food)');
  }

  // Equipment-specific requirements
  const specializedEquipment = ['reefer', 'refrigerated', 'tanker', 'flatbed', 'hazardous'];
  if (specializedEquipment.some(eq => equipment.toLowerCase().includes(eq))) {
    complianceChecklist.requiredDocuments.push('Special Permit');
    complianceChecklist.requiredDocuments.push('Equipment Registration');
  }

  // Hazmat requirements
  if (hazmat) {
    complianceChecklist.requiredDocuments.push('Hazardous Materials Declaration');
    complianceChecklist.requiredDocuments.push('Material Safety Data Sheet (MSDS)');
    complianceChecklist.requiredDocuments.push('Dangerous Goods Declaration');
    complianceChecklist.requiredDocuments.push('Emergency Response Plan');
    complianceChecklist.flaggedIssues.push('Hazardous cargo requires additional compliance');
    complianceChecklist.score -= 10;
  }

  // Temperature control
  if (temperatureControl) {
    complianceChecklist.requiredDocuments.push('Temperature Monitoring Certificate');
    complianceChecklist.requiredDocuments.push('Reefer Certification (for reefer)');
  }

  // Value thresholds requiring additional checks
  if (customsValue && parseFloat(customsValue) > 2500) {
    complianceChecklist.flaggedIssues.push('High-value shipment requires additional scrutiny');
    complianceChecklist.score -= 5;
  }

  // Check if required documents are present
  if (documents && documents.length > 0) {
    const docNames = documents.map(d => d.type);
    complianceChecklist.requiredDocuments.forEach(doc => {
      if (!docNames.includes(doc)) {
        complianceChecklist.missingDocuments.push(doc);
        complianceChecklist.score -= 10;
      }
    });
  } else {
    complianceChecklist.missingDocuments = [...complianceChecklist.requiredDocuments];
    complianceChecklist.score -= (complianceChecklist.requiredDocuments.length * 15);
  }

  // Final approval determination
  if (complianceChecklist.missingDocuments.length > 0) {
    complianceChecklist.approved = false;
  }

  if (complianceChecklist.flaggedIssues.length > 0) {
    complianceChecklist.approved = false;
  }

  if (complianceChecklist.score < 80) {
    complianceChecklist.approved = false;
  }

  return complianceChecklist;
}

// Request missing documents
async function requestMissingDocuments(db, shipmentId, missingDocuments) {
  const borderCollection = db.collection('cross_border');
  
  await borderCollection.updateOne(
    { _id: shipmentId },
    {
      $set: {
        status: 'awaiting_documents',
        documentsRequested: missingDocuments,
      },
      }
  );

  // In a real implementation, this would:
  // 1. Send email to carrier requesting documents
  // 2. Create document upload task
  // 3. Set reminder follow-up schedule
}

// Document validation
function validateDocument(document, documentType) {
  const validations = {
    'bill_of_lading': validateBOL,
    'commercial_invoice': validateInvoice,
    'certificate_of_origin': validateCertificateOfOrigin,
    'packing_list': validatePackingList,
  };

  const validator = validations[documentType.toLowerCase()];
  if (validator) {
    return validator(document);
  }

  return { valid: true };
}

function validateBOL(document) {
  // BOL validation logic
  const errors = [];
  
  if (!document.shipper) errors.push('Missing shipper information');
  if (!document.consignee) errors.push('Missing consignee information');
  if (!document.origin) errors.push('Missing origin');
  if (!document.destination) errors.push('missing destination');
  
  if (!document.weight || document.weight <= 0) errors.push('Invalid weight');
  if (!document.equipment) errors.push('Missing equipment type');

  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateInvoice(document) {
  // Invoice validation logic
  const errors = [];
  
  if (!document.invoiceNumber) errors.push('Missing invoice number');
  if (!document.amount || document.amount <= 0) errors.push('Invalid amount');
  if (!document.shipper) errors.push('Missing shipper');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function validateCertificateOfOrigin(document) {
  // Certificate of Origin validation
  const errors = [];
  
  if (!document.originCountry) errors.push('Missing origin country');
  if (!document.destinationCountry || document.destinationCountry !== 'US') errors.push('Destination must be US for NAFTA');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

function validatePackingList(document) {
  // Packing list validation
  const errors = [];
  
  if (!document.packingDetails || document.packingList.length === 0) {
    errors.push('Packing list is empty');
  }
  
  if (!document.totalWeight || document.totalWeight <= 0) {
    errors.push('Invalid total weight');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { performComplianceCheck, validateDocument, validateBOL };