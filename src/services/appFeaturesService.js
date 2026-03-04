/**
 * App Features Service
 * Handles all app features (How It Works) related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiBase';

// Base endpoint for app features operations
const APP_FEATURES_ENDPOINT = '/app-features';

/**
 * Get all app features with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (status, search, page, limit)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAppFeatures = async (params = {}) => {
  try {
    const response = await apiGet(APP_FEATURES_ENDPOINT, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { appFeatures: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch app features',
      data: { appFeatures: [], pagination: {} },
    };
  }
};

/**
 * Get app feature by ID
 * @param {string} appFeatureId - App Feature ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getAppFeatureById = async (appFeatureId) => {
  try {
    if (!appFeatureId) {
      return {
        success: false,
        error: 'App Feature ID is required',
      };
    }

    const response = await apiGet(`${APP_FEATURES_ENDPOINT}/${appFeatureId}`);
    
    if (response.success) {
      // Backend returns { success: true, data: { appFeature: {...} } }
      const appFeature = response.data?.appFeature || response.data;
      
      return {
        success: true,
        data: {
          title: appFeature.title || '',
          content: appFeature.content || '',
          version: appFeature.version || '1.0',
          status: appFeature.status ? appFeature.status.toLowerCase() : 'draft',
          _id: appFeature._id || appFeatureId,
          updatedAt: appFeature.updatedAt,
          createdAt: appFeature.createdAt,
        },
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch app feature',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch app feature details',
    };
  }
};

/**
 * Get published app features (for public display)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPublishedAppFeatures = async () => {
  return await getAppFeatures({ status: 'published', limit: 1 });
};

/**
 * Create new app features
 * @param {object} appFeatureData - App features data (title, content, version, status)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createAppFeatures = async (appFeatureData) => {
  try {
    if (!appFeatureData.title || !appFeatureData.content) {
      return {
        success: false,
        error: 'Title and content are required',
      };
    }

    const response = await apiPost(APP_FEATURES_ENDPOINT, appFeatureData);
    
    if (response.success) {
      // Backend returns { success: true, data: { appFeature: {...} } }
      const appFeature = response.data?.appFeature || response.data;
      return {
        success: true,
        data: appFeature,
        message: response.message || 'App features created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create app features',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating app features',
    };
  }
};

/**
 * Update app features
 * @param {string} appFeatureId - App Feature ID
 * @param {object} appFeatureData - Updated app features data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateAppFeatures = async (appFeatureId, appFeatureData) => {
  try {
    if (!appFeatureId) {
      return {
        success: false,
        error: 'App Feature ID is required',
      };
    }

    const response = await apiPut(`${APP_FEATURES_ENDPOINT}/${appFeatureId}`, appFeatureData);
    
    if (response.success) {
      // Backend returns { success: true, data: { appFeature: {...} } }
      const appFeature = response.data?.appFeature || response.data;
      return {
        success: true,
        data: appFeature,
        message: response.message || 'App features updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update app features',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating app features',
    };
  }
};

/**
 * Delete app features
 * @param {string} appFeatureId - App Feature ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteAppFeatures = async (appFeatureId) => {
  try {
    if (!appFeatureId) {
      return {
        success: false,
        error: 'App Feature ID is required',
      };
    }

    const response = await apiDelete(`${APP_FEATURES_ENDPOINT}/${appFeatureId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'App features deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete app features',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting app features',
    };
  }
};
