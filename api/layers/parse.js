// Unstructured Data Ingestion (Parse) API
const { connectToDatabase } = require('../lib/db');

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const documentsCollection = db.collection('documents');

    // GET - Fetch parsed documents
    if (req.method === 'GET') {
      const { fleetId, documentType, status, source, startDate, endDate } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (documentType) query.documentType = documentType;
      if (status) query.status = status;
      if (source) query.source = source;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const documents = await documentsCollection
        .find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        data: documents,
      });
    }

    // POST - Parse unstructured document
    if (req.method === 'POST') {
      const {
        fleetId,
        documentType,
        source, // email, upload, API, etc.
        rawContent,
        fileName,
        metadata,
        priority = 'normal',
      } = req.body;

      // Validate required fields
      if (!fleetId || !documentType || !rawContent) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Parse document based on type
      const parsedData = parseDocument(documentType, rawContent);

      const result = await documentsCollection.insertOne({
        fleetId,
        documentType,
        source,
        rawContent,
        fileName,
        metadata: metadata || {},
        priority,
        parsedData,
        status: 'processed',
        confidence: parsedData.confidence || 0,
        extractionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        processingLog: [
          { timestamp: new Date(), action: 'Document received', status: 'success' },
          { timestamp: new Date(), action: `Parsing ${documentType}`, status: 'success' },
        ],
      });

      // Trigger downstream processing based on document type
      await triggerDocumentProcessing(db, result.insertedId, documentType, parsedData);

      return res.status(201).json({
        success: true,
        message: 'Document parsed successfully',
        id: result.insertedId,
        parsedData,
      });
    }

    // PUT - Update document metadata
    if (req.method === 'PUT') {
      const { id, status, notes, priority, metadata } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Document ID required' });
      }

      const updateData = { updatedAt: new Date() };
      if (status) updateData.status = status;
      if (notes) updateData.notes = notes;
      if (priority) updateData.priority = priority;
      if (metadata) updateData.metadata = { $merge: metadata };

      const result = await documentsCollection.updateOne(
        { _id: id },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Document updated successfully',
      });
    }

    // DELETE - Remove document
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'Document ID required' });
      }

      const result = await documentsCollection.deleteOne({ _id: id });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'Document not found' });
      }

      return res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error in parse API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Document parsing logic
function parseDocument(documentType, rawContent) {
  const parsers = {
    invoice: parseInvoice,
    billOfLading: parseBillOfLading,
    rateConfirmation: parseRateConfirmation,
    email: parseEmail,
    loadBoardPost: parseLoadBoardPost,
    tmsExport: parseTMSExport,
    miscellaneous: parseGeneric,
  };

  const parser = parsers[documentType.toLowerCase()] || parseGeneric;
  return parser(rawContent);
}

// Invoice parsing
function parseInvoice(content) {
  const invoiceData = {
    invoiceNumber: extractInvoiceNumber(content),
    amount: extractAmount(content),
    dueDate: extractDate(content),
    shipper: extractEntity(content, ['shipper', 'from']),
    consignee: extractEntity(content, ['consignee', 'to']),
    confidence: 0.85,
    extractedFields: [],
  };

  invoiceData.extractedFields.push('invoiceNumber', 'amount', 'dueDate');

  return invoiceData;
}

// Bill of lading parsing
function parseBillOfLading(content) {
  const bolData = {
    bolNumber: extractBOLNumber(content),
    shipper: extractEntity(content, ['shipper', 'from']),
    consignee: extractEntity(content, ['consignee', 'to']),
    carrier: extractEntity(content, ['carrier', 'trucking company']),
    pickupDate: extractDate(content),
    deliveryDate: extractDate(content),
    origin: extractLocation(content, 'origin', 'pickup'),
    destination: extractLocation(content, 'destination', 'delivery'),
    confidence: 0.90,
    extractedFields: [],
  };

  bolData.extractedFields.push('bolNumber', 'shipper', 'consignee', 'carrier', 'pickupDate', 'origin', 'destination');

  return bolData;
}

// Rate confirmation parsing
function parseRateConfirmation(content) {
  const rateData = {
    rate: extractAmount(content),
    origin: extractLocation(content, 'origin', 'from'),
    destination: extractLocation(content, 'destination', 'to'),
    pickupDate: extractDate(content),
    notes: extractNotes(content),
    confidence: 0.95,
    extractedFields: [],
  };

  rateData.extractedFields.push('rate', 'origin', 'destination', 'pickupDate');

  return rateData;
}

// Email parsing
function parseEmail(content) {
  const emailData = {
    sender: extractEmail(content, 'from'),
    recipient: extractEmail(content, 'to'),
    subject: extractSubject(content),
    body: content,
    extractedUrls: extractUrls(content),
    attachments: extractAttachments(content),
    confidence: 0.80,
    extractedFields: [],
  };

  emailData.extractedFields.push('sender', 'subject', 'extractedUrls');

  return emailData;
}

// Load board post parsing
function parseLoadBoardPost(content) {
  const postData = {
    origin: extractLocation(content, 'origin', 'from', 'pickup'),
    destination: extractLocation(content, 'destination', 'to', 'delivery'),
    rate: extractAmount(content),
    equipment: extractEquipment(content),
    weight: extractWeight(content),
    pickupDate: extractDate(content),
    notes: extractNotes(content),
    source: extractPlatform(content),
    confidence: 0.75,
    extractedFields: [],
  };

  postData.extractedFields.push('origin', 'destination', 'rate', 'equipment', 'pickupDate');

  return postData;
}

// TMS export parsing
function parseTMSExport(content) {
  const tmsData = {
    format: detectTMSFormat(content),
    records: parseTMSRecords(content),
    confidence: 0.95,
    extractedFields: [],
  };

  tmsData.extractedFields.push('format', 'record count');

  return tmsData;
}

// Generic parsing fallback
function parseGeneric(content) {
  const genericData = {
    content: content,
    extractedText: extractText(content),
    extractedNumbers: extractNumbers(content),
    confidence: 0.50,
    extractedFields: [],
  };

  genericData.extractedFields.push('text', 'numbers');

  return genericData;
}

// Helper extraction functions
function extractInvoiceNumber(text) {
  const patterns = [
    /invoice[:\s]*#?\s*(\d+)/i,
    /inv\s*#?\s*(\d+)/i,
    /(?:no\s*|#)\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

function extractAmount(text) {
  const patterns = [
    /\$\s*[\d,]+\.?\d*/,
    /\$[\d,]+\.?\d*/,
    /(?:amount|rate|price|cost)[:\s]*\$?\s*[\d,]+\.?\d*/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[0].replace(/[$,]/g, '');
      return parseFloat(amount);
    }
  }
  return null;
}

function extractDate(text) {
  const patterns = [
    /\d{1,2}\/\d{1,2}\/\d{2,4}/,  // MM/DD/YYYY
    /\d{4}-\d{2}-\d{2}/,         // YYYY-MM-DD
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return new Date(match[0]);
  }
  return null;
}

function extractEntity(text, keywords) {
  for (const keyword of keywords) {
    const pattern = new RegExp(`${keyword}[:\\s]*[:\\s]*([^\\n\\r,;]+)`, 'i');
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractLocation(text, keywords, contextKeywords) {
  const locations = [];
  
  // Try to find locations with cities
  const cityPattern = /(?:from|to|origin|destination|pickup|delivery)[:\s]*\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)(?:\s*,|\s|$)/gi;
  let match;
  while ((match = cityPattern.exec(text)) !== null) {
    locations.push(match[1]);
  }

  return locations;
}

function extractEmail(text, type) {
  const patterns = {
    from: /from:\s*([^<>\s,]+@[^\s>]+)/i,
    to: /(?:to|recipient)\s*[:<]\s*([^<>\s,]+@[^\s>]+)/i,
  };

  const pattern = patterns[type];
  if (pattern) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractSubject(text) {
  const pattern = /subject:\s*([^\n\r]+)/i;
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function extractUrls(text) {
  const urlPattern = /https?:\/\/[^\s<>]+/g;
  return text.match(urlPattern) || [];
}

function extractAttachments(text) {
  const attachmentPattern = /attachment[:\s]*([^\\n\r]+)/gi;
  const matches = text.match(attachmentPattern);
  return matches || [];
}

function extractNotes(text) {
  const patterns = [
    /notes?\s*[:]\s*([^\n\r]+)/gi,
    /(?:instructions|comments)\s*[:]\s*([^\n\r]+)/gi,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function extractEquipment(text) {
  const equipmentTypes = [
    'dry van', 'dryvan', 'van',
    'reefer', 'refrigerated',
    'flatbed', 'flat bed',
    'tanker', 'tank',
    'container', 'intermodal',
    'step deck', 'stepdeck',
    'lowboy',
  ];

  for (const type of equipmentTypes) {
    if (text.toLowerCase().includes(type)) {
      return type;
    }
  }

  return null;
}

function extractWeight(text) {
  const pattern = /(\d+)\s*(?:lbs?|pounds?|kgs?|kilograms?)?/;
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : null;
}

function extractPlatform(text) {
  const platforms = ['DAT', 'Truckstop', 'Loadsmart', 'Getloaded', 'FreightWaves'];
  
  for (const platform of platforms) {
    if (text.toLowerCase().includes(platform.toLowerCase())) {
      return platform;
    }
  }
  
  return null;
}

function extractText(text) {
  return text.replace(/<[^>]*>/g, '').trim();
}

function extractNumbers(text) {
  const numbers = text.match(/\d+\.?\d*/g);
  return numbers ? numbers.map(n => parseFloat(n)) : [];
}

function detectTMSFormat(text) {
  if (text.includes('McLeod')) return 'mcleod';
  if (text.includes('Trimble')) return 'trimble';
  if (text.includes('MercuryGate')) return 'mercurygate';
  if (text.includes('Aljex')) return 'aljex';
  if (text.includes('ProTransport')) return 'protransport';
  if (text.includes('Tailwind')) return 'tailwind';
  if (text.includes('FreightPOP')) return 'freightpop';
  return 'unknown';
}

function parseTMSRecords(text) {
  // Simulated TMS record parsing
  return {
    count: Math.floor(Math.random() * 10) + 1,
    fields: ['load_id', 'customer', 'rate', 'origin', 'destination', 'equipment', 'weight'],
  };
}

// Trigger downstream processing based on document type
async function triggerDocumentProcessing(db, documentId, documentType, parsedData) {
  try {
    const documentsCollection = db.collection('documents');

    switch (documentType) {
      case 'invoice':
        // Create settlement record from parsed invoice
        await createSettlementFromInvoice(db, parsedData);
        break;
      case 'bill_of_lading':
        // Create load record
        await createLoadFromBOL(db, parsedData);
        break;
      case 'rate_confirmation':
        // Update lane intelligence
        await updateLaneFromRateConfirm(db, parsedData);
        break;
      case 'email':
        // Check for actionable items
        await processEmail(db, parsedData);
        break;
    }

    await documentsCollection.updateOne(
      { _id: documentId },
      {
        $push: {
          processingLog: {
            timestamp: new Date(),
            action: 'Downstream processing triggered',
            status: 'success',
          },
        },
      }
    );
  } catch (error) {
    console.error('Error in document processing:', error);
  }
}

async function createSettlementFromInvoice(db, invoiceData) {
  // Placeholder for creating settlement from invoice
  // This would interact with the settlement API
}

async function createLoadFromBOL(db, bolData) {
  // Placeholder for creating load from BOL
}

async function updateLaneFromRateConfirm(db, rateData) {
  // Placeholder for updating lane intelligence from rate confirmation
  const lanesCollection = db.collection('lanes');
  // Update lane with rate information
}

async function processEmail(db, emailData) {
  // Placeholder for email processing
}

module.exports = { parseDocument, extractInvoiceNumber, extractAmount };