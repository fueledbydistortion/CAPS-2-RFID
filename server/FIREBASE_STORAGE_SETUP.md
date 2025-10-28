# Firebase Storage Integration

This document explains the Firebase Storage integration for file uploads in the SmartChildcare application.

## Overview

The application now uses **Firebase Storage** for storing all uploaded files (attachments, assignments, etc.) instead of local disk storage. This provides better scalability, reliability, and CDN-backed file delivery.

## Features

✅ **Cloud Storage**: All files are stored in Firebase Cloud Storage
✅ **Public URLs**: Files are accessible via public HTTPS URLs
✅ **Organized Structure**: Files are organized in folders (lessons, assignments, submissions, etc.)
✅ **Backward Compatibility**: Legacy local files still work
✅ **Secure**: Uses Firebase Admin SDK for server-side operations

## Configuration

### 1. Firebase Storage Bucket

The storage bucket is configured in `config/firebase-admin-config.js`:

```javascript
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://smartchild-2e350-default-rtdb.firebaseio.com",
  storageBucket: "smartchild-2e350.appspot.com"
});
```

### 2. Storage Functions

All Firebase Storage operations are in `config/firebaseStorage.js`:

- `uploadToFirebaseStorage()` - Upload a single file
- `uploadMultipleFiles()` - Upload multiple files at once
- `deleteFromFirebaseStorage()` - Delete a file
- `getFileMetadata()` - Get file information
- `getSignedUrl()` - Generate temporary signed URLs (for private files)
- `listFiles()` - List all files in a folder

## File Upload Flow

### Server-Side

1. **Multer** receives the file upload with memory storage
2. File is temporarily stored in memory as a Buffer
3. File is uploaded to Firebase Storage using the Admin SDK
4. Firebase Storage returns a public URL
5. File metadata (URL, size, type, etc.) is saved to Firebase Realtime Database

### Client-Side

1. User selects files through the UI
2. Files are sent to the server via FormData
3. Server responds with file metadata including the Firebase Storage URL
4. Client displays/downloads files using the public URL

## Folder Structure in Firebase Storage

```
smartchild-2e350.appspot.com/
├── lessons/
│   ├── {lessonId}/
│   │   ├── file1-timestamp-random.pdf
│   │   └── file2-timestamp-random.jpg
├── assignments/
│   └── {assignmentId}/
│       └── ...
├── submissions/
│   └── {submissionId}/
│       └── ...
└── general/
    └── ...
```

## File Naming Convention

Files are renamed to prevent collisions:
```
{original-name-without-extension}-{timestamp}-{random-string}.{extension}
```

Example: `assignment-1234567890-abc123def.pdf`

## API Endpoints

### Upload Files to Lesson
```
POST /files/lesson/:lessonId/upload
Content-Type: multipart/form-data

Files are uploaded via the 'files' field (multiple files supported)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lessonId": "lesson123",
    "attachments": [...],
    "newFiles": [
      {
        "name": "document.pdf",
        "filename": "document-1234567890-abc123.pdf",
        "path": "lessons/lesson123/document-1234567890-abc123.pdf",
        "url": "https://storage.googleapis.com/smartchild-2e350.appspot.com/lessons/lesson123/document-1234567890-abc123.pdf",
        "size": 1024,
        "mimetype": "application/pdf"
      }
    ],
    "uploadedCount": 1
  },
  "message": "1 file(s) uploaded successfully to Firebase Storage"
}
```

### Generic File Upload
```
POST /files/upload
Content-Type: multipart/form-data

Body:
- file: {file}
- category: "general" (optional)
```

### Delete File from Lesson
```
DELETE /files/lesson/:lessonId/:filename
```

## File Access

### Public Files (Default)

All uploaded files are made public and accessible via:
```
https://storage.googleapis.com/{bucket-name}/{file-path}
```

### Private Files (Optional)

For private file access, use signed URLs:

```javascript
const { getSignedUrl } = require('./config/firebaseStorage');

const result = await getSignedUrl('path/to/file.pdf', 3600000); // 1 hour expiry
console.log(result.data.url); // Temporary access URL
```

## Client-Side Usage

### Uploading Files

```javascript
import { uploadFile, uploadLessonFiles } from '../utils/fileService';

// Single file upload
const result = await uploadFile(file, 'submissions');

// Multiple files to a lesson
const result = await uploadLessonFiles(lessonId, filesArray);
```

### Displaying Files

```javascript
import { getFileUrlFromAttachment } from '../utils/fileService';

const url = getFileUrlFromAttachment(attachment);
// URL can be used directly in <img>, <a href>, or window.open()
```

## Migration from Local Storage

### Backward Compatibility

The system is backward compatible with files stored locally:

1. Old files still work using legacy URLs
2. New files are uploaded to Firebase Storage
3. File deletion handles both Firebase Storage and local files

### Manual Migration (Optional)

To migrate existing local files to Firebase Storage:

1. Create a migration script
2. Read files from `server/uploads/attachments/`
3. Upload each file using `uploadToFirebaseStorage()`
4. Update database records with new URLs
5. Optionally delete local files

## Security Rules (Firebase Console)

Ensure your Firebase Storage security rules allow public read and authenticated write:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow public read access
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Files Not Uploading

1. Check Firebase Storage bucket name in config
2. Verify service account has Storage Admin permissions
3. Check Firebase Storage rules allow write access
4. Verify multer is using memory storage

### Files Not Accessible

1. Ensure files are set to public: `file.makePublic()`
2. Check Firebase Storage security rules
3. Verify the bucket URL is correct

### High Costs

1. Set up lifecycle rules to delete old files
2. Use CDN caching
3. Compress images before upload
4. Set appropriate file size limits

## Benefits of Firebase Storage

✅ **Scalability**: Automatically scales with demand
✅ **CDN**: Files served from Google's CDN for fast access
✅ **Reliability**: 99.95% uptime SLA
✅ **No Server Load**: Files don't consume server disk space
✅ **Direct Access**: Clients can download directly from Firebase
✅ **Cost-Effective**: Pay only for what you use

## File Size Limits

- Maximum file size: **10MB** (configurable in multerConfig.js)
- Maximum files per request: **5** (configurable)

## Supported File Types

- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Archives: ZIP
- Text: TXT

## Environment Variables

No additional environment variables needed. The Firebase Admin SDK uses:
- `credentials.json` - Service account credentials
- Configuration in `firebase-admin-config.js`

## Cost Monitoring

Monitor Firebase Storage usage in the Firebase Console:
1. Go to Firebase Console > Storage
2. View usage metrics and costs
3. Set up billing alerts

## Next Steps

1. ✅ Test file uploads with the new system
2. ✅ Verify files are accessible from client
3. ⚠️ Consider migrating existing files
4. ⚠️ Set up automated backups
5. ⚠️ Configure lifecycle rules for old files

---

**Last Updated**: October 2025
**Version**: 1.0






