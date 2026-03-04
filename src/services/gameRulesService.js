/**
 * Game Rules Service
 * Handles all game rules-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiBase';

// Base endpoint for game rules operations
const GAME_RULES_ENDPOINT = '/game-rules';

/**
 * Get all game rules with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (status, search, page, limit)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getGameRules = async (params = {}) => {
  try {
    const response = await apiGet(GAME_RULES_ENDPOINT, params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { gameRules: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch game rules',
      data: { gameRules: [], pagination: {} },
    };
  }
};

/**
 * Get game rules by ID
 * @param {string} gameRuleId - Game Rule ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getGameRuleById = async (gameRuleId) => {
  try {
    if (!gameRuleId) {
      return {
        success: false,
        error: 'Game Rule ID is required',
      };
    }

    const response = await apiGet(`${GAME_RULES_ENDPOINT}/${gameRuleId}`);
    
    if (response.success) {
      // Backend returns { success: true, data: { gameRule: {...} } }
      const gameRule = response.data?.gameRule || response.data;
      
      return {
        success: true,
        data: {
          title: gameRule.title || '',
          content: gameRule.content || '',
          version: gameRule.version || '1.0',
          status: gameRule.status ? gameRule.status.toLowerCase() : 'draft',
          _id: gameRule._id || gameRuleId,
          updatedAt: gameRule.updatedAt,
          createdAt: gameRule.createdAt,
        },
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch game rule',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch game rule details',
    };
  }
};

/**
 * Get published game rules (for public display)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPublishedGameRules = async () => {
  return await getGameRules({ status: 'published', limit: 1 });
};

/**
 * Create new game rules
 * @param {object} gameRuleData - Game rules data (title, content, version, status)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createGameRules = async (gameRuleData) => {
  try {
    if (!gameRuleData.title || !gameRuleData.content) {
      return {
        success: false,
        error: 'Title and content are required',
      };
    }

    const response = await apiPost(GAME_RULES_ENDPOINT, gameRuleData);
    
    if (response.success) {
      // Backend returns { success: true, data: { gameRule: {...} } }
      const gameRule = response.data?.gameRule || response.data;
      return {
        success: true,
        data: gameRule,
        message: response.message || 'Game rules created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create game rules',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating game rules',
    };
  }
};

/**
 * Update game rules
 * @param {string} gameRuleId - Game Rule ID
 * @param {object} gameRuleData - Updated game rules data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateGameRules = async (gameRuleId, gameRuleData) => {
  try {
    if (!gameRuleId) {
      return {
        success: false,
        error: 'Game Rule ID is required',
      };
    }

    const response = await apiPut(`${GAME_RULES_ENDPOINT}/${gameRuleId}`, gameRuleData);
    
    if (response.success) {
      // Backend returns { success: true, data: { gameRule: {...} } }
      const gameRule = response.data?.gameRule || response.data;
      return {
        success: true,
        data: gameRule,
        message: response.message || 'Game rules updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update game rules',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating game rules',
    };
  }
};

/**
 * Delete game rules
 * @param {string} gameRuleId - Game Rule ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteGameRules = async (gameRuleId) => {
  try {
    if (!gameRuleId) {
      return {
        success: false,
        error: 'Game Rule ID is required',
      };
    }

    const response = await apiDelete(`${GAME_RULES_ENDPOINT}/${gameRuleId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Game rules deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete game rules',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting game rules',
    };
  }
};
