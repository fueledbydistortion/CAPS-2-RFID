const { bucket, admin } = require('./firebase-admin-config');
const path = require('path');

// Check if bucket is configured
let isBucketAvailable = false;
try {
  if (bucket && bucket.name) {
    isBucketAvailable = true;
    console.log('Firebase Storage bucket configured:', bucket.name);
  } else {
    console.warn('⚠️ Firebase Storage bucket not configured. Files will be stored locally.');
    console.warn('To enable Firebase Storage:');
    console.warn('1. Go to Firebase Console > Storage');
    console.warn('2. Click "Get Started"');
    console.warn('3. Choose a location and click "Done"');
  }
} catch (error) {
  console.error('⚠️ Firebase Storage initialization error:', error.message);
  console.warn('Files will be stored locally as fallback.');
}

/**
 * Upload a file to Firebase Storage
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File mimetype
 * @param {string} folder - Folder path in storage (e.g., 'attachments', 'submissions')
 * @returns {Promise<Object>} Upload result with file URL and metadata
 */
const uploadToFirebaseStorage = async (fileBuffer, originalName, mimetype, folder = 'attachments') => {
  try {
    // Check if bucket is available
    if (!bucket || !bucket.name) {
      throw new Error('Firebase Storage bucket not configured. Please enable Storage in Firebase Console.');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, ext);
    const filename = `${nameWithoutExt}-${timestamp}-${randomString}${ext}`;
    const filePath = `${folder}/${filename}`;

    // Create file reference in bucket
    const file = bucket.file(filePath);

    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimetype,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly accessible
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

    return {
      success: true,
      data: {
        filename: filename,
        originalName: originalName,
        path: filePath,
        url: publicUrl,
        mimetype: mimetype,
        size: fileBuffer.length,
        folder: folder
      }
    };
  } catch (error) {
    console.error('Error uploading to Firebase Storage:', error);
    
    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.message.includes('bucket does not exist') || error.code === 404) {
      errorMessage = 'Firebase Storage bucket not found. Please enable Storage in Firebase Console:\n' +
                    '1. Go to https://console.firebase.google.com\n' +
                    '2. Select your project (smartchild-2e350)\n' +
                    '3. Click Storage in the left menu\n' +
                    '4. Click "Get Started" and follow the setup wizard';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Delete a file from Firebase Storage
 * @param {string} filePath - Full path to file in storage
 * @returns {Promise<Object>} Deletion result
 */
const deleteFromFirebaseStorage = async (filePath) => {
  try {
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return {
        success: false,
        error: 'File not found in storage'
      };
    }

    // Delete file
    await file.delete();

    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting from Firebase Storage:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get file metadata from Firebase Storage
 * @param {string} filePath - Full path to file in storage
 * @returns {Promise<Object>} File metadata
 */
const getFileMetadata = async (filePath) => {
  try {
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return {
        success: false,
        error: 'File not found in storage'
      };
    }

    // Get metadata
    const [metadata] = await file.getMetadata();

    return {
      success: true,
      data: {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated,
        publicUrl: `https://storage.googleapis.com/${bucket.name}/${filePath}`
      }
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get signed URL for private file access
 * @param {string} filePath - Full path to file in storage
 * @param {number} expiresIn - Expiration time in milliseconds (default: 1 hour)
 * @returns {Promise<Object>} Signed URL
 */
const getSignedUrl = async (filePath, expiresIn = 3600000) => {
  try {
    const file = bucket.file(filePath);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return {
        success: false,
        error: 'File not found in storage'
      };
    }

    // Generate signed URL
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn
    });

    return {
      success: true,
      data: {
        url: signedUrl,
        expiresAt: new Date(Date.now() + expiresIn).toISOString()
      }
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Upload multiple files to Firebase Storage
 * @param {Array} files - Array of file objects with buffer, originalName, and mimetype
 * @param {string} folder - Folder path in storage
 * @returns {Promise<Array>} Array of upload results
 */
const uploadMultipleFiles = async (files, folder = 'attachments') => {
  try {
    const uploadPromises = files.map(file => 
      uploadToFirebaseStorage(file.buffer, file.originalname, file.mimetype, folder)
    );
    
    const results = await Promise.all(uploadPromises);
    
    const successfulUploads = results.filter(r => r.success).map(r => r.data);
    const failedUploads = results.filter(r => !r.success);

    return {
      success: failedUploads.length === 0,
      data: successfulUploads,
      errors: failedUploads.map(f => f.error),
      uploadedCount: successfulUploads.length,
      failedCount: failedUploads.length
    };
  } catch (error) {
    console.error('Error uploading multiple files:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      uploadedCount: 0,
      failedCount: files.length
    };
  }
};

/**
 * List files in a folder
 * @param {string} folder - Folder path in storage
 * @returns {Promise<Object>} List of files
 */
const listFiles = async (folder = 'attachments') => {
  try {
    const [files] = await bucket.getFiles({
      prefix: `${folder}/`
    });

    const fileList = files.map(file => ({
      name: file.name,
      publicUrl: `https://storage.googleapis.com/${bucket.name}/${file.name}`
    }));

    return {
      success: true,
      data: fileList,
      count: fileList.length
    };
  } catch (error) {
    console.error('Error listing files:', error);
    return {
      success: false,
      error: error.message,
      data: [],
      count: 0
    };
  }
};

module.exports = {
  uploadToFirebaseStorage,
  deleteFromFirebaseStorage,
  getFileMetadata,
  getSignedUrl,
  uploadMultipleFiles,
  listFiles,
  bucket
};

