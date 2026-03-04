/**
 * Teams Service
 * Handles all team-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './apiBase';

/**
 * Get all teams with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (league_id, status, search, page, limit, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getTeams = async (params = {}) => {
  try {
    const response = await apiGet('/teams', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { teams: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch teams',
      data: { teams: [], pagination: {} },
    };
  }
};

/**
 * Get team by ID
 * @param {string} teamId - Team ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getTeam = async (teamId) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
      };
    }

    const response = await apiGet(`/teams/${teamId}`);
    
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
      error: error.message || 'Failed to fetch team',
    };
  }
};

/**
 * Create new team
 * @param {object} teamData - Team data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createTeam = async (teamData) => {
  try {
    if (!teamData.team_name || !teamData.league_id) {
      return {
        success: false,
        error: 'Team name and league ID are required',
      };
    }

    const response = await apiPost('/teams', teamData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Team created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create team',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating team',
    };
  }
};

/**
 * Update team
 * @param {string} teamId - Team ID
 * @param {object} teamData - Updated team data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateTeam = async (teamId, teamData) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
      };
    }

    const response = await apiPut(`/teams/${teamId}`, teamData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Team updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update team',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating team',
    };
  }
};

/**
 * Activate team
 * @param {string} teamId - Team ID
 * @param {object} activationData - Activation data (reason)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const activateTeam = async (teamId, activationData) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
      };
    }

    if (!activationData?.reason) {
      return {
        success: false,
        error: 'Reason is required for activation',
      };
    }

    const response = await apiPatch(`/teams/${teamId}/activate`, activationData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Team activated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to activate team',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while activating team',
    };
  }
};

/**
 * Inactivate team
 * @param {string} teamId - Team ID
 * @param {object} inactivationData - Inactivation data (reason)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const inactivateTeam = async (teamId, inactivationData) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
      };
    }

    if (!inactivationData?.reason) {
      return {
        success: false,
        error: 'Reason is required for inactivation',
      };
    }

    const response = await apiPatch(`/teams/${teamId}/inactivate`, inactivationData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Team inactivated successfully',
        warnings: response.warnings,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to inactivate team',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while inactivating team',
    };
  }
};

/**
 * Promote team
 * @param {string} teamId - Team ID
 * @param {object} promotionData - Promotion data (season_tag, promotion_date, reason)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const promoteTeam = async (teamId, promotionData) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
      };
    }

    if (!promotionData?.season_tag || !promotionData?.promotion_date) {
      return {
        success: false,
        error: 'Season tag and promotion date are required',
      };
    }

    const response = await apiPatch(`/teams/${teamId}/promote`, promotionData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Team promoted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to promote team',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while promoting team',
    };
  }
};

/**
 * Relegate team
 * @param {string} teamId - Team ID
 * @param {object} relegationData - Relegation data (reason)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const relegateTeam = async (teamId, relegationData) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
      };
    }

    if (!relegationData?.reason) {
      return {
        success: false,
        error: 'Reason is required for relegation',
      };
    }

    const response = await apiPatch(`/teams/${teamId}/relegate`, relegationData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Team relegated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to relegate team',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while relegating team',
    };
  }
};
