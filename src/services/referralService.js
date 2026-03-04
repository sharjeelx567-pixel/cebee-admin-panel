/**
 * Referral Service
 * Handles all referral-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch } from './apiBase';

/**
 * Get all referrals with filtering, search, sorting, and pagination
 * @param {object} params - Query parameters (page, limit, search, status, country, sort, month)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getReferrals = async (params = {}) => {
  try {
    // Map frontend parameters to backend format if needed
    const backendParams = { ...params };
    
    // Convert page from 0-based (frontend) to 1-based (backend) if needed
    if (backendParams.page !== undefined) {
      backendParams.page = backendParams.page + 1;
    }
    
    const response = await apiGet('/referrals/admin/list', backendParams);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { referrals: [], pagination: {} },
    };
  } catch (error) {
    console.error('Error fetching referrals:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch referrals',
      data: { referrals: [], pagination: {} },
    };
  }
};

/**
 * Get referral by ID
 * @param {string} referralId - Referral ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getReferralById = async (referralId) => {
  try {
    if (!referralId) {
      return {
        success: false,
        error: 'Referral ID is required',
      };
    }

    const response = await apiGet(`/referrals/${referralId}`);
    
    if (response.success) {
      // Backend returns { success: true, data: { referral } }
      // Extract the referral object from the nested structure
      const referralData = response.data?.referral || response.data;
      return {
        success: true,
        data: referralData,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  } catch (error) {
    console.error('Error fetching referral details:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch referral details',
    };
  }
};

/**
 * Get referral statistics
 * @param {object} params - Query parameters (month, timePeriod)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getReferralStatistics = async (params = {}) => {
  try {
    const response = await apiGet('/referrals/statistics', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: {
        totalReferrals: 0,
        validReferrals: 0,
        totalCPIssued: 0,
        uniqueReferrers: 0,
      },
    };
  } catch (error) {
    console.error('Error fetching referral statistics:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch referral statistics',
      data: {
        totalReferrals: 0,
        validReferrals: 0,
        totalCPIssued: 0,
        uniqueReferrers: 0,
      },
    };
  }
};

/**
 * Update referral status
 * @param {string} referralId - Referral ID
 * @param {string} status - New status (valid, flagged, invalid)
 * @param {string} reason - Optional reason for status change
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateReferralStatus = async (referralId, status, reason = null) => {
  try {
    if (!referralId) {
      return {
        success: false,
        error: 'Referral ID is required',
      };
    }

    if (!status) {
      return {
        success: false,
        error: 'Status is required',
      };
    }

    const updateData = { status };
    if (reason) {
      updateData.reason = reason;
    }

    const response = await apiPatch(`/referrals/${referralId}/status`, updateData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Referral status updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update referral status',
    };
  } catch (error) {
    console.error('Error updating referral status:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating referral status',
    };
  }
};
