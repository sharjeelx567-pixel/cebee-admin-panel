/**
 * Base API Utility
 * Common functions for all API calls including error handling, token management, and request handling
 */

// Live backend. For local dev set REACT_APP_API_URL=http://localhost:3001 in .env
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://api.cebeepredict.com/api').replace(/\/$/, '');

/**
 * Get authentication token from localStorage
 */
export const getAuthToken = () => {
  try {
    const session = localStorage.getItem('admin_session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.token || null;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
  }
  return null;
};

/**
 * Save authentication token to localStorage
 */
export const saveAuthToken = (token, user) => {
  try {
    const session = {
      token,
      user,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('admin_session', JSON.stringify(session));
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
};

/**
 * Remove authentication token from localStorage
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem('admin_session');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Get stored user session
 */
export const getStoredSession = () => {
  try {
    const session = localStorage.getItem('admin_session');
    if (session) {
      return JSON.parse(session);
    }
  } catch (error) {
    console.error('Error getting stored session:', error);
  }
  return null;
};

/**
 * Main API request function with comprehensive error handling
 * @param {string} endpoint - API endpoint (e.g., '/leagues', '/players')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<{success: boolean, data?: any, error?: string, response?: Response}>}
 */
export const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  // Add authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Handle body serialization
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    let data;
    if (isJson) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle unauthorized - clear session
    if (response.status === 401) {
      removeAuthToken();
      return {
        success: false,
        error: 'Unauthorized. Please login again.',
        status: 401,
        data: null,
      };
    }

    // Handle rate limiting (429)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? ` Please try again in ${retryAfter} seconds.` : ' Please wait a moment before trying again.';
      return {
        success: false,
        error: `Too many requests.${waitTime}`,
        status: 429,
        data: data,
      };
    }

    // Handle other errors
    if (!response.ok) {
      // Log full error details for debugging
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        endpoint: `${API_BASE_URL}${endpoint}`,
        errorData: data,
        errorDataString: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      });

      const errorMessage = data?.message ||
        data?.error?.message ||
        data?.error ||
        `Request failed with status ${response.status}`;

      return {
        success: false,
        error: errorMessage,
        status: response.status,
        data: data,
      };
    }

    // Success response
    // Handle response structure
    // Backend might return: { success: true, data: {...} }
    // OR: { data: {...} } directly
    const responseData = data && data.data ? data.data : data;

    return {
      success: true,
      data: responseData,
      message: data.message,
      status: response.status,
      response: response,
    };
  } catch (error) {
    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error. Please check your connection and ensure the backend server is running.',
        status: 0,
        data: null,
      };
    }

    // Other errors
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
      status: 0,
      data: null,
    };
  }
};

/**
 * GET request helper
 * @param {string} endpoint - API endpoint
 * @param {object} params - Query parameters
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const apiGet = async (endpoint, params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const fullEndpoint = `${endpoint}${queryString ? `?${queryString}` : ''}`;
  return await apiRequest(fullEndpoint, { method: 'GET' });
};

/**
 * POST request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const apiPost = async (endpoint, data = {}) => {
  return await apiRequest(endpoint, {
    method: 'POST',
    body: data,
  });
};

/**
 * PUT request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const apiPut = async (endpoint, data = {}) => {
  return await apiRequest(endpoint, {
    method: 'PUT',
    body: data,
  });
};

/**
 * PATCH request helper
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request body
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const apiPatch = async (endpoint, data = {}) => {
  return await apiRequest(endpoint, {
    method: 'PATCH',
    body: data,
  });
};

/**
 * DELETE request helper
 * @param {string} endpoint - API endpoint
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const apiDelete = async (endpoint) => {
  return await apiRequest(endpoint, { method: 'DELETE' });
};
