/**
 * Terms & Conditions Service
 * Handles all terms & conditions related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiBase';

// Base endpoint for terms operations
const TERMS_ENDPOINT = '/terms';

/**
 * Get all terms with filtering, search, pagination
 * @param {object} params - Query parameters (status, search, page, limit)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getTerms = async (params = {}) => {
  try {
    const response = await apiGet(TERMS_ENDPOINT, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { terms: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch terms',
      data: { terms: [], pagination: {} },
    };
  }
};

/**
 * Get published terms (for public display)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPublishedTerms = async () => {
  return await getTerms({ status: 'published', limit: 1 });
};

/**
 * Create new terms
 * @param {object} termsData - Terms data (content, version, isActive)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createTerms = async (termsData) => {
  try {
    if (!termsData.content) {
      return {
        success: false,
        error: 'Content is required',
      };
    }

    const response = await apiPost(TERMS_ENDPOINT, termsData);
    
    if (response.success) {
      // Backend returns { success: true, data: { terms: {...} } }
      const terms = response.data?.terms || response.data;
      return {
        success: true,
        data: terms,
        message: response.message || 'Terms & Conditions created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create terms',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating terms',
    };
  }
};

/**
 * Update terms
 * @param {string} termsId - Terms ID
 * @param {object} termsData - Updated terms data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateTerms = async (termsId, termsData) => {
  try {
    if (!termsId) {
      return {
        success: false,
        error: 'Terms ID is required',
      };
    }

    const response = await apiPut(`${TERMS_ENDPOINT}/${termsId}`, termsData);
    
    if (response.success) {
      // Backend returns { success: true, data: { terms: {...} } }
      const terms = response.data?.terms || response.data;
      return {
        success: true,
        data: terms,
        message: response.message || 'Terms & Conditions updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update terms',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating terms',
    };
  }
};

/**
 * Delete terms
 * @param {string} termsId - Terms ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteTerms = async (termsId) => {
  try {
    if (!termsId) {
      return {
        success: false,
        error: 'Terms ID is required',
      };
    }

    const response = await apiDelete(`${TERMS_ENDPOINT}/${termsId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Terms & Conditions deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete terms',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting terms',
    };
  }
};
