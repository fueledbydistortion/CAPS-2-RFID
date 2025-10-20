const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists (for backward compatibility)
const uploadsDir = path.join(__dirname, '../uploads');
const attachmentsDir = path.join(uploadsDir, 'attachments');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Use memory storage for Firebase Storage uploads
// Files will be stored in memory as Buffer objects
const storage = multer.memoryStorage();

// Legacy disk storage (kept for backward compatibility)
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, attachmentsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow common file types
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'), false);
  }
};

// Configure multer with memory storage (for Firebase Storage)
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Configure multer with disk storage (legacy/backup)
const uploadToDisk = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per request
  }
});

// Helper function to delete file from disk
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

// Helper function to get file URL (legacy)
const getFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/attachments/${filename}`;
};

module.exports = {
  upload,
  uploadToDisk,
  deleteFile,
  getFileUrl,
  attachmentsDir
};
