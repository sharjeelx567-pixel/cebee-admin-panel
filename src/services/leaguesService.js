/**
 * Leagues Service
 * Handles all league-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './apiBase';

/**
 * Get all leagues with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (status, search, page, limit, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getLeagues = async (params = {}) => {
  try {
    const response = await apiGet('/leagues', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { leagues: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch leagues',
      data: { leagues: [], pagination: {} },
    };
  }
};

/**
 * Get league by ID
 * @param {string} leagueId - League ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getLeague = async (leagueId) => {
  try {
    const response = await apiGet(`/leagues/${leagueId}`);
    
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
      error: error.message || 'Failed to fetch league',
    };
  }
};

/**
 * Create new league
 * @param {object} leagueData - League data (name, type, logoUrl, isActive, priority, country, etc.)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createLeague = async (leagueData) => {
  try {
    // Validate required fields (check for league_name and leagueType as sent from frontend)
    if (!leagueData.league_name || !leagueData.league_name.trim()) {
      return {
        success: false,
        error: 'League name is required',
      };
    }

    // leagueType is optional in backend, but we validate if provided
    // The backend will handle validation and normalization

    const response = await apiPost('/leagues', leagueData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'League created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create league',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating league',
    };
  }
};

/**
 * Update league
 * @param {string} leagueId - League ID
 * @param {object} leagueData - Updated league data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateLeague = async (leagueId, leagueData) => {
  try {
    if (!leagueId) {
      return {
        success: false,
        error: 'League ID is required',
      };
    }

    console.log('updateLeague service call:', {
      leagueId,
      leagueData,
      endpoint: `/leagues/${leagueId}`
    });

    const response = await apiPut(`/leagues/${leagueId}`, leagueData);
    
    console.log('updateLeague API response:', response);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'League updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update league',
    };
  } catch (error) {
    console.error('updateLeague error:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating league',
    };
  }
};

/**
 * Delete league
 * @param {string} leagueId - League ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteLeague = async (leagueId) => {
  try {
    if (!leagueId) {
      return {
        success: false,
        error: 'League ID is required',
      };
    }

    const response = await apiDelete(`/leagues/${leagueId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'League deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete league',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting league',
    };
  }
};

/**
 * Deactivate league (soft delete - sets status to Inactive)
 * @param {string} leagueId - League ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deactivateLeague = async (leagueId) => {
  try {
    if (!leagueId) {
      return {
        success: false,
        error: 'League ID is required',
      };
    }

    const response = await apiDelete(`/leagues/${leagueId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'League deactivated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to deactivate league',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deactivating league',
    };
  }
};

/**
 * Get teams by league ID
 * @param {string} leagueId - League ID
 * @param {object} params - Query parameters (status, active_only)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getTeamsByLeague = async (leagueId, params = {}) => {
  try {
    if (!leagueId) {
      return {
        success: false,
        error: 'League ID is required',
        data: { teams: [], league: null },
      };
    }

    const response = await apiGet(`/leagues/${leagueId}/teams`, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { teams: [], league: null },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch teams',
      data: { teams: [], league: null },
    };
  }
};
