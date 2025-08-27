import axios from 'axios';

// Primary backend URL from environment
const PRIMARY_BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
// Fallback URLs for different environments
const FALLBACK_URLS = [
  'http://localhost:8001',
  'https://travelagent.emergent.host',
  window.location.origin.replace(':3000', ':8001')
];

let CURRENT_BACKEND_URL = PRIMARY_BACKEND_URL;
let API_BASE = `${PRIMARY_BACKEND_URL}/api`;

// Test if an URL is reachable
const testConnection = async (url) => {
  try {
    const response = await axios.get(`${url}/api/auth/me`, {
      timeout: 3000,
      headers: {
        'Authorization': axios.defaults.headers.common['Authorization'] || ''
      }
    });
    return true;
  } catch (error) {
    // 401/403 means the server is reachable but auth failed (expected)
    if (error.response && [401, 403].includes(error.response.status)) {
      return true;
    }
    return false;
  }
};

// Find working backend URL
const findWorkingBackend = async () => {
  // Try primary URL first
  if (await testConnection(PRIMARY_BACKEND_URL)) {
    CURRENT_BACKEND_URL = PRIMARY_BACKEND_URL;
    API_BASE = `${PRIMARY_BACKEND_URL}/api`;
    return;
  }

  // Try fallback URLs
  for (const url of FALLBACK_URLS) {
    if (await testConnection(url)) {
      CURRENT_BACKEND_URL = url;
      API_BASE = `${url}/api`;
      console.log(`✅ Backend connection established: ${url}`);
      return;
    }
  }

  console.error('❌ No working backend URL found');
  // Keep using primary URL as last resort
};

// Initialize connection check (non-blocking)
findWorkingBackend().catch(console.error);

// Create axios instance with interceptor for URL switching
const apiClient = axios.create();

apiClient.interceptors.request.use((config) => {
  // Replace the base URL if it's using the primary URL
  if (config.url && config.url.startsWith(`${PRIMARY_BACKEND_URL}/api`)) {
    config.url = config.url.replace(`${PRIMARY_BACKEND_URL}/api`, API_BASE);
  } else if (config.url && config.url.startsWith('/api')) {
    config.url = `${API_BASE}${config.url.slice(4)}`;
  } else if (!config.url.startsWith('http')) {
    config.url = `${API_BASE}/${config.url}`;
  }
  
  return config;
});

// Add response interceptor to handle failures and retry with different URL
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      // Try to find working backend again
      await findWorkingBackend();
      // Don't retry automatically to avoid infinite loops
    }
    return Promise.reject(error);
  }
);

export { apiClient, API_BASE };
export const getBackendUrl = () => CURRENT_BACKEND_URL;
export const getApiBase = () => API_BASE;