// Environment configuration for API endpoints
const BASE_API_URL = process.env.REACT_APP_BASE_API_URL || 'http://127.0.0.1:5000';

export const API_CONFIG = {
  BASE_URL: BASE_API_URL,
};

// Helper function to construct full API URLs
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${BASE_API_URL}/${cleanEndpoint}`;
};

export default BASE_API_URL;