
const USE_VERCEL = true;

// API Base URLs
const LOCAL_API_URL = "http://localhost:3001/api";
const VERCEL_API_URL = "https://smart-child-care-z13s.vercel.app/api";


const LOCAL_UPLOAD_URL = "http://localhost:3001/uploads/attachments";
const VERCEL_UPLOAD_URL =
  "https://smart-child-care-z13s.vercel.app/uploads/attachments";


export const API_BASE_URL = USE_VERCEL ? VERCEL_API_URL : LOCAL_API_URL;
export const UPLOAD_BASE_URL = USE_VERCEL
  ? VERCEL_UPLOAD_URL
  : LOCAL_UPLOAD_URL;


export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

// Helper to get full upload URL
export const getUploadUrl = (filename) => {
  return `${UPLOAD_BASE_URL}/${filename}`;
};

// Log current configuration (useful for debugging)
console.log(
  `🌐 API Configuration: Using ${
    USE_VERCEL ? "VERCEL (Production)" : "LOCALHOST (Development)"
  }`
);
console.log(`📍 API Base URL: ${API_BASE_URL}`);
