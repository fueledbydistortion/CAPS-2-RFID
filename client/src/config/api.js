/**
 * API Configuration
 *
 * Toggle between local development and production (Vercel) API endpoints
 */

// Set to true to use Vercel (production), false to use localhost (development)
const USE_VERCEL = false;

// API Base URLs
const LOCAL_API_URL = "http://localhost:3001/api";
const VERCEL_API_URL = "https://smart-childcare-server.vercel.app/api";

// File upload base URLs (LEGACY - only used for old local files)
// Note: New files use Firebase Storage with direct public URLs
// These URLs are only for backward compatibility with old attachments
const LOCAL_UPLOAD_URL = "http://localhost:3001/uploads/attachments";
const VERCEL_UPLOAD_URL =
  "https://smart-childcare-server.vercel.app/uploads/attachments";

// Export the active configuration based on USE_VERCEL flag
export const API_BASE_URL = USE_VERCEL ? VERCEL_API_URL : LOCAL_API_URL;
export const UPLOAD_BASE_URL = USE_VERCEL
  ? VERCEL_UPLOAD_URL
  : LOCAL_UPLOAD_URL;

// Helper to get full API endpoint URL
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
