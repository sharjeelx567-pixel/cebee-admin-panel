/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiPost, apiGet } from './apiBase';
import { saveAuthToken, removeAuthToken, getStoredSession } from './apiBase';

/**
 * Login admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const login = async (email, password) => {
  try {
    console.log('Login attempt:', { email, endpoint: '/admin/login' });
    const response = await apiPost('/admin/login', { email, password });
    
    console.log('Login response:', {
      success: response.success,
      status: response.status,
      error: response.error,
      data: response.data,
    });

    if (response.success && response.data?.user) {
      // Check if user is admin
      if (response.data.user.role !== 'admin') {
        return {
          success: false,
          error: 'Access denied. Admin privileges required.',
        };
      }

      // Save token and user data
      if (response.data.token && response.data.user) {
        saveAuthToken(response.data.token, response.data.user);
      }

      return {
        success: true,
        data: response.data,
        message: response.message || 'Login successful',
      };
    }

    // Provide more detailed error message for 500 errors
    let errorMessage = response.error || 'Login failed. Please check your credentials.';
    if (response.status === 500) {
      errorMessage = `Server error (500): ${response.error || 'Internal server error. Please check if the backend server is running and accessible.'}`;
    }

    return {
      success: false,
      error: errorMessage,
      status: response.status,
    };
  } catch (error) {
    console.error('Login exception:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred during login.',
    };
  }
};

/**
 * Get current authenticated user
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getCurrentUser = async () => {
  try {
    const response = await apiGet('/auth/me');
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Logout (clear session)
 * @returns {Promise<{success: boolean}>}
 */
export const logout = () => {
  try {
    removeAuthToken();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: true }; // Always return success to clear local state
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean}
 */
export const isAuthenticated = () => {
  const session = getStoredSession();
  return !!(session && session.token);
};

/**
 * Get stored user data
 * @returns {object|null}
 */
export const getStoredUser = () => {
  const session = getStoredSession();
  return session?.user || null;
};
