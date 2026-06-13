// File upload and storage handling
const { connectToDatabase } = require('../lib/db');

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await connectToDatabase();
    const filesCollection = db.collection('files');

    // POST - Upload file
    if (req.method === 'POST') {
      return await handleFileUpload(req, res, db, filesCollection);
    }

    // GET - List files
    if (req.method === 'GET') {
      const { fleetId, fileType, status } = req.query;
      const query = {};
      
      if (fleetId) query.fleetId = fleetId;
      if (fileType) query.fileType = fileType;
      if (status) query.status = status;

      const files = await filesCollection
        .find(query)
        .sort({ uploadedAt: -1 })
        .limit(100)
        .toArray();

      return res.status(200).json({
        success: true,
        data: files,
      });
    }

    // DELETE - Delete file
    if (req.method === 'DELETE') {
      const { id } = req.query;
      
      if (!id) {
        return res.status(400).json({ error: 'File ID required' });
      }

      const file = await filesCollection.findOne({ _id: id });
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }

      // Delete from storage (placeholder - implement based on storage provider)
      await deleteFromStorage(file.storageKey);

      // Delete from database
      await filesCollection.deleteOne({ _id: id });

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    }
  } catch (error) {
    console.error('Error in file upload API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Handle file upload
async function handleFileUpload(req, res, db, filesCollection) {
  const { fleetId, documentId, fileType, category } = req.query;

  if (!fleetId) {
    return res.status(400).json({ error: 'Fleet ID required' });
  }

  try {
    // Parse multipart form data
    const formData = await parseMultipartForm(req);
    
    if (!formData.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = formData.file;
    const fileData = await processUploadedFile(file, fleetId, documentId, fileType, category);

    // Save to storage
    const storageResult = await saveToStorage(fileData);
    
    // Save to database
    const result = await filesCollection.insertOne({
      ...fileData,
      ...storageResult,
      uploadedAt: new Date(),
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      fileId: result.insertedId,
      file: {
        id: result.insertedId,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType,
        mimeType: fileData.mimeType,
        url: storageResult.url,
      },
    });
  } catch (error) {
    console.error('File upload error:', error);
    return res.status(500).json({ error: 'File upload failed' });
  }
}

// Parse multipart form data
async function parseMultipartForm(req) {
  // Placeholder for multipart parsing
  // In production, use a library like 'multer' or 'formidable'
  
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  
  const buffer = Buffer.concat(chunks);
  
  return {
    file: {
      name: 'uploaded-file.pdf', // Extract from form data
      data: buffer,
      mimetype: 'application/pdf', // Extract from form data
    },
  };
}

// Process uploaded file
async function processUploadedFile(file, fleetId, documentId, fileType, category) {
  const fileName = file.name || `file-${Date.now()}`;
  const fileData = file.data;
  const fileSize = fileData.length;
  const mimeType = file.mimetype || 'application/octet-stream';
  
  // Generate unique storage key
  const storageKey = `${fleetId}/${documentId || 'general'}/${Date.now()}-${fileName}`;
  
  // Determine file type from extension if not provided
  const extension = fileName.split('.').pop().toLowerCase();
  const detectedFileType = detectFileType(extension, mimeType);
  
  // Calculate file hash for deduplication
  const fileHash = await calculateFileHash(fileData);
  
  return {
    fleetId,
    documentId,
    fileName,
    fileSize,
    mimeType,
    fileType: fileType || detectedFileType,
    category: category || 'general',
    storageKey,
    fileHash,
    metadata: {
      originalName: fileName,
      extension,
      uploadedBy: 'system', // Will be updated with user info
    },
  };
}

// Save to storage (placeholder - implement based on storage provider)
async function saveToStorage(fileData) {
  // Storage providers to choose from:
  // 1. AWS S3
  // 2. Google Cloud Storage
  // 3. Azure Blob Storage
  // 4. Vercel Blob (if using Vercel)
  
  // Placeholder implementation
  const url = `https://storage.velcun.com/${fileData.storageKey}`;
  
  return {
    url,
    storageProvider: 's3', // or 'gcs', 'azure', 'vercel-blob'
    storageKey: fileData.storageKey,
    uploadedAt: new Date(),
  };
}

// Delete from storage
async function deleteFromStorage(storageKey) {
  // Placeholder - implement based on storage provider
  console.log(`Deleting file: ${storageKey}`);
  return true;
}

// Detect file type
function detectFileType(extension, mimeType) {
  const typeMap = {
    'pdf': 'document',
    'doc': 'document',
    'docx': 'document',
    'xls': 'spreadsheet',
    'xlsx': 'spreadsheet',
    'csv': 'spreadsheet',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'tiff': 'image',
    'json': 'data',
    'xml': 'data',
    'edi': 'data',
    'txt': 'text',
  };

  // Check extension first
  if (typeMap[extension]) {
    return typeMap[extension];
  }

  // Fallback to MIME type
  if (mimeType) {
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'spreadsheet';
    if (mimeType.includes('json') || mimeType.includes('xml')) return 'data';
  }

  return 'other';
}

// Calculate file hash
async function calculateFileHash(buffer) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Generate presigned URL for download
async function generateDownloadUrl(fileId) {
  const db = await connectToDatabase();
  const filesCollection = db.collection('files');
  
  const file = await filesCollection.findOne({ _id: fileId });
  if (!file) {
    throw new Error('File not found');
  }

  // Generate presigned URL based on storage provider
  const presignedUrl = await generatePresignedUrl(file.storageKey, 3600); // 1 hour expiry
  
  return {
    url: presignedUrl,
    expiresAt: new Date(Date.now() + 3600 * 1000),
  };
}

// Generate presigned URL (placeholder)
async function generatePresignedUrl(storageKey, expirySeconds) {
  // Implement based on storage provider
  return `https://storage.velcun.com/${storageKey}?expires=${Date.now() + expirySeconds * 1000}`;
}

// Validate file before upload
function validateFile(file, maxSize = 10 * 1024 * 1024) { // 10MB default
  const errors = [];
  
  if (!file.data) {
    errors.push('No file data');
  }
  
  if (file.data.length > maxSize) {
    errors.push(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }
  
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
    'text/plain',
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('File type not allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Batch file upload
async function handleBatchUpload(files, fleetId, documentId) {
  const results = [];
  
  for (const file of files) {
    try {
      const result = await handleFileUpload(file, fleetId, documentId);
      results.push({ success: true, file: result });
    } catch (error) {
      results.push({ success: false, error: error.message, fileName: file.name });
    }
  }
  
  return {
    total: files.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  };
}

module.exports = {
  generateDownloadUrl,
  validateFile,
  handleBatchUpload,
};