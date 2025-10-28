import { API_BASE_URL, UPLOAD_BASE_URL } from '../config/api';

// File upload constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_FILE_TYPES = [
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

export const ALLOWED_FILE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif',
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.txt',
  '.zip'
];

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Generic file upload function
export const uploadFile = async (file, category = 'general') => {
  try {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Upload files to a lesson
export const uploadLessonFiles = async (lessonId, files) => {
  try {
    const formData = new FormData();
    
    // Add files to FormData
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const response = await fetch(`${API_BASE_URL}/files/lesson/${lessonId}/upload`, {
      method: 'POST',
      body: formData
    });

    // Check content type before parsing
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      // Response is not JSON, likely an HTML error page
      const text = await response.text();
      console.error('Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned non-JSON response. Status: ${response.status}. This usually means the API endpoint is not found or there's a server error.`);
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return {
      success: true,
      data: data.data
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Delete a file from a lesson
export const deleteLessonFile = async (lessonId, filename) => {
  try {
    const response = await apiRequest(`/files/lesson/${lessonId}/${filename}`, {
      method: 'DELETE'
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file info
export const getFileInfo = async (lessonId, filename) => {
  try {
    const response = await apiRequest(`/files/lesson/${lessonId}/${filename}/info`);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Download file
export const downloadFile = async (lessonId, filename, originalName) => {
  try {
    const response = await fetch(`${API_BASE_URL}/files/lesson/${lessonId}/${filename}/download`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    // Create blob from response
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return {
      success: true,
      message: 'File downloaded successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Get file URL for viewing
export const getFileUrl = (lessonId, filename) => {
  return `${API_BASE_URL}/files/lesson/${lessonId}/${filename}/download`;
};

// Get file URL for static serving (legacy local files)
export const getStaticFileUrl = (filename) => {
  return `${UPLOAD_BASE_URL}/${filename}`;
};

// Get file URL - supports both Firebase Storage URLs and legacy local URLs
export const getFileUrlFromAttachment = (attachment) => {
  // Priority 1: Firebase Storage URL (complete public URL)
  if (attachment.url && (
    attachment.url.startsWith('https://storage.googleapis.com') || 
    attachment.url.startsWith('https://firebasestorage.googleapis.com')
  )) {
    return attachment.url;
  }
  
  // Priority 2: Any complete URL (including legacy server URLs)
  if (attachment.url && (
    attachment.url.startsWith('http://') || 
    attachment.url.startsWith('https://')
  )) {
    return attachment.url;
  }
  
  // Priority 3: Legacy local files - construct URL from filename
  if (attachment.filename) {
    const legacyUrl = getStaticFileUrl(attachment.filename);
    return legacyUrl;
  }
  
  console.warn('No valid URL found for attachment:', attachment);
  return null;
};

// Validate file before upload
export const validateFile = (file) => {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB. Your file is ${formatFileSize(file.size)}.`
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    const fileName = file.name;
    const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    return {
      valid: false,
      error: `File type "${fileExtension}" is not allowed. Allowed types: Images (JPG, PNG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT), and Archives (ZIP).`
    };
  }

  return {
    valid: true
  };
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'picture_as_pdf';
  if (mimetype.includes('word')) return 'description';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'table_chart';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'slideshow';
  if (mimetype.includes('zip') || mimetype.includes('compressed')) return 'archive';
  return 'attach_file';
};

// Check if attachment has valid file data
export const hasValidFile = (attachment) => {
  const hasServerFile = attachment.filename && attachment.url;
  const hasBlobFile = attachment.blob && attachment.blob instanceof Blob;
  return hasServerFile || hasBlobFile;
};

// Check if attachment is a legacy file
export const isLegacyFile = (attachment) => {
  return attachment.name && !hasValidFile(attachment) && (attachment.size || attachment.type);
};

// Get file type description
export const getFileTypeDescription = (attachment) => {
  if (attachment.filename && attachment.url) {
    return 'Server file (ready to download)';
  } else if (attachment.blob && attachment.blob instanceof Blob) {
    return 'Local file (ready to download)';
  } else if (isLegacyFile(attachment)) {
    return 'Legacy file (re-upload needed)';
  } else {
    return 'File data not available';
  }
};
