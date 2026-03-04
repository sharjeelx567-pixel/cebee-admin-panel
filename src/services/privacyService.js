/**
 * Privacy Policy Service
 * Handles all privacy policy related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiBase';

// Base endpoint for privacy operations
const PRIVACY_ENDPOINT = '/privacy';

/**
 * Get all privacy policies with filtering, search, pagination
 * @param {object} params - Query parameters (status, search, page, limit)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPrivacyPolicies = async (params = {}) => {
  try {
    const response = await apiGet(PRIVACY_ENDPOINT, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { privacy: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch privacy policies',
      data: { privacy: [], pagination: {} },
    };
  }
};

/**
 * Get published privacy policy (for public display)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPublishedPrivacy = async () => {
  return await getPrivacyPolicies({ status: 'published', limit: 1 });
};

/**
 * Create new privacy policy
 * @param {object} privacyData - Privacy data (content, version, isActive)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createPrivacy = async (privacyData) => {
  try {
    if (!privacyData.content) {
      return {
        success: false,
        error: 'Content is required',
      };
    }

    const response = await apiPost(PRIVACY_ENDPOINT, privacyData);
    
    if (response.success) {
      // Backend returns { success: true, data: { privacy: {...} } }
      const privacy = response.data?.privacy || response.data;
      return {
        success: true,
        data: privacy,
        message: response.message || 'Privacy Policy created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create privacy policy',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating privacy policy',
    };
  }
};

/**
 * Update privacy policy
 * @param {string} privacyId - Privacy Policy ID
 * @param {object} privacyData - Updated privacy data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updatePrivacy = async (privacyId, privacyData) => {
  try {
    if (!privacyId) {
      return {
        success: false,
        error: 'Privacy Policy ID is required',
      };
    }

    const response = await apiPut(`${PRIVACY_ENDPOINT}/${privacyId}`, privacyData);
    
    if (response.success) {
      // Backend returns { success: true, data: { privacy: {...} } }
      const privacy = response.data?.privacy || response.data;
      return {
        success: true,
        data: privacy,
        message: response.message || 'Privacy Policy updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update privacy policy',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating privacy policy',
    };
  }
};

/**
 * Delete privacy policy
 * @param {string} privacyId - Privacy Policy ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deletePrivacy = async (privacyId) => {
  try {
    if (!privacyId) {
      return {
        success: false,
        error: 'Privacy Policy ID is required',
      };
    }

    const response = await apiDelete(`${PRIVACY_ENDPOINT}/${privacyId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Privacy Policy deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete privacy policy',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting privacy policy',
    };
  }
};
