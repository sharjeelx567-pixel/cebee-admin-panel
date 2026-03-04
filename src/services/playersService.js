/**
 * Players Service
 * Handles all player-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch } from './apiBase';

/**
 * Get all players with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (team_id, status, search, page, limit, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPlayers = async (params = {}) => {
  try {
    const response = await apiGet('/players', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { players: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch players',
      data: { players: [], pagination: {} },
    };
  }
};

/**
 * Get players by team
 * @param {string} teamId - Team ID
 * @param {object} params - Additional query parameters
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPlayersByTeam = async (teamId, params = {}) => {
  try {
    if (!teamId) {
      return {
        success: false,
        error: 'Team ID is required',
        data: { players: [], team: null },
      };
    }

    const response = await apiGet(`/players/team/${teamId}`, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { players: [], team: null },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch players',
      data: { players: [], team: null },
    };
  }
};

/**
 * Get player by ID
 * @param {string} playerId - Player ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPlayer = async (playerId) => {
  try {
    if (!playerId) {
      return {
        success: false,
        error: 'Player ID is required',
      };
    }

    const response = await apiGet(`/players/${playerId}`);
    
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
      error: error.message || 'Failed to fetch player',
    };
  }
};

/**
 * Create new player
 * @param {object} playerData - Player data (team_id, player_name, position, shirt_number)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createPlayer = async (playerData) => {
  try {
    // Validate required fields
    if (!playerData.team_id || !playerData.player_name || !playerData.position || !playerData.shirt_number) {
      return {
        success: false,
        error: 'Team ID, player name, position, and shirt number are required',
      };
    }

    const response = await apiPost('/players', playerData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Player created successfully',
      };
    }
    
    // Extract error message from various possible response formats
    let errorMessage = 'Failed to create player';
    if (response.error) {
      errorMessage = response.error;
    } else if (response.data?.error?.message) {
      errorMessage = response.data.error.message;
    } else if (response.data?.error) {
      errorMessage = typeof response.data.error === 'string' 
        ? response.data.error 
        : JSON.stringify(response.data.error);
    } else if (response.data?.message) {
      errorMessage = response.data.message;
    }
    
    console.error('Player creation API error:', {
      response,
      errorMessage,
      playerData
    });
    
    return {
      success: false,
      error: errorMessage,
      data: response.data, // Include full response for debugging
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating player',
    };
  }
};

/**
 * Update player
 * @param {string} playerId - Player ID
 * @param {object} playerData - Updated player data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updatePlayer = async (playerId, playerData) => {
  try {
    if (!playerId) {
      return {
        success: false,
        error: 'Player ID is required',
      };
    }

    const response = await apiPut(`/players/${playerId}`, playerData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Player updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update player',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating player',
    };
  }
};

/**
 * Temporarily deactivate player
 * @param {string} playerId - Player ID
 * @param {object} deactivationData - {inactive_reason, inactive_note?, inactive_until?}
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const deactivatePlayerTemporary = async (playerId, deactivationData) => {
  try {
    if (!playerId) {
      return {
        success: false,
        error: 'Player ID is required',
      };
    }

    if (!deactivationData.inactive_reason) {
      return {
        success: false,
        error: 'Inactive reason is required',
      };
    }

    const response = await apiPatch(`/players/${playerId}/deactivate-temporary`, deactivationData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Player temporarily deactivated',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to deactivate player',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deactivating player',
    };
  }
};

/**
 * Permanently deactivate player
 * @param {string} playerId - Player ID
 * @param {object} deactivationData - {inactive_reason, inactive_note?, confirm: true}
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const deactivatePlayerPermanent = async (playerId, deactivationData) => {
  try {
    if (!playerId) {
      return {
        success: false,
        error: 'Player ID is required',
      };
    }

    if (!deactivationData.inactive_reason) {
      return {
        success: false,
        error: 'Inactive reason is required',
      };
    }

    if (deactivationData.confirm !== true) {
      return {
        success: false,
        error: 'Confirmation is required for permanent deactivation',
      };
    }

    const response = await apiPatch(`/players/${playerId}/deactivate-permanent`, deactivationData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Player permanently deactivated',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to deactivate player',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deactivating player',
    };
  }
};

/**
 * Reactivate player
 * @param {string} playerId - Player ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const reactivatePlayer = async (playerId) => {
  try {
    if (!playerId) {
      return {
        success: false,
        error: 'Player ID is required',
      };
    }

    const response = await apiPatch(`/players/${playerId}/reactivate`);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Player reactivated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to reactivate player',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while reactivating player',
    };
  }
};
