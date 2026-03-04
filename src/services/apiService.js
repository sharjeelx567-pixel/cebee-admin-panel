/**
 * Centralized API Service for CeBee Admin Panel
 * Handles all backend API calls with proper error handling and state management
 * Uses apiBase.js for core API utilities
 */

import { 
  apiRequest, 
  saveAuthToken, 
  removeAuthToken, 
  getStoredSession 
} from './apiBase';

/**
 * API Service Object with all endpoints
 */
const apiService = {
  // ============================================
  // Authentication Endpoints
  // ============================================
  
  /**
   * Login admin user
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  login: async (email, password) => {
    try {
      const response = await apiRequest('/admin/login', {
        method: 'POST',
        body: { email, password },
      });

      // Check if user is admin
      if (response.data?.user?.role !== 'admin') {
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
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed. Please check your credentials.',
      };
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getCurrentUser: async () => {
    const response = await apiRequest('/auth/me');
    return response;
  },

  /**
   * Logout (clear session)
   */
  logout: () => {
    removeAuthToken();
    return { success: true };
  },

  // ============================================
  // Player Management Endpoints
  // ============================================

  /**
   * Get all players with filtering
   * @param {object} params - Query parameters (team_id, status, search, page, limit)
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getPlayers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/players${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(endpoint);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { players: [], pagination: {} },
      };
    }
  },

  /**
   * Get players by team
   * @param {string} teamId - Team ID
   * @param {object} params - Additional query parameters
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getPlayersByTeam: async (teamId, params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/players/team/${teamId}${queryString ? `?${queryString}` : ''}`;
      const response = await apiRequest(endpoint);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: { players: [], team: null },
      };
    }
  },

  /**
   * Get player by ID
   * @param {string} playerId - Player ID
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getPlayer: async (playerId) => {
    return await apiRequest(`/players/${playerId}`);
  },

  /**
   * Create new player
   * @param {object} playerData - Player data (team_id, player_name, position, shirt_number)
   * @returns {Promise<{success: boolean, data: object}>}
   */
  createPlayer: async (playerData) => {
    const response = await apiRequest('/players', {
      method: 'POST',
      body: playerData,
    });
    return {
      ...response,
      message: response.message || 'Player created successfully',
    };
  },

  /**
   * Update player
   * @param {string} playerId - Player ID
   * @param {object} playerData - Updated player data
   * @returns {Promise<{success: boolean, data: object}>}
   */
  updatePlayer: async (playerId, playerData) => {
    const response = await apiRequest(`/players/${playerId}`, {
      method: 'PUT',
      body: playerData,
    });
    return {
      ...response,
      message: response.message || 'Player updated successfully',
    };
  },

  /**
   * Temporarily deactivate player
   * @param {string} playerId - Player ID
   * @param {object} deactivationData - {inactive_reason, inactive_note?, inactive_until?}
   * @returns {Promise<{success: boolean, data: object}>}
   */
  deactivatePlayerTemporary: async (playerId, deactivationData) => {
    const response = await apiRequest(`/players/${playerId}/deactivate-temporary`, {
      method: 'PATCH',
      body: deactivationData,
    });
    return {
      ...response,
      message: response.message || 'Player temporarily deactivated',
    };
  },

  /**
   * Permanently deactivate player
   * @param {string} playerId - Player ID
   * @param {object} deactivationData - {inactive_reason, inactive_note?, confirm: true}
   * @returns {Promise<{success: boolean, data: object}>}
   */
  deactivatePlayerPermanent: async (playerId, deactivationData) => {
    const response = await apiRequest(`/players/${playerId}/deactivate-permanent`, {
      method: 'PATCH',
      body: deactivationData,
    });
    return {
      ...response,
      message: response.message || 'Player permanently deactivated',
    };
  },

  /**
   * Reactivate player
   * @param {string} playerId - Player ID
   * @returns {Promise<{success: boolean, data: object}>}
   */
  reactivatePlayer: async (playerId) => {
    const response = await apiRequest(`/players/${playerId}/reactivate`, {
      method: 'PATCH',
    });
    return {
      ...response,
      message: response.message || 'Player reactivated successfully',
    };
  },

  // ============================================
  // Team Management Endpoints
  // ============================================

  /**
   * Get team by ID
   * @param {string} teamId - Team ID
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getTeam: async (teamId) => {
    return await apiRequest(`/teams/${teamId}`);
  },

  // ============================================
  // Settings Management Endpoints
  // ============================================

  /**
   * Get all platform settings
   * @returns {Promise<{success: boolean, data: object}>}
   */
  getSettings: async () => {
    const response = await apiRequest('/admin/settings');
    if (response.success) {
      return {
        ...response,
        data: response.data?.settings || response.data,
      };
    }
    return response;
  },

  /**
   * Update platform status
   * @param {string} platformStatus - 'online' or 'maintenance'
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  updatePlatformStatus: async (platformStatus) => {
    const response = await apiRequest('/admin/settings/platform-status', {
      method: 'PUT',
      body: { platformStatus },
    });
    return {
      ...response,
      data: response.data?.settings || response.data,
      message: response.message || 'Platform status updated successfully',
    };
  },

  /**
   * Update maintenance message
   * @param {object} maintenanceMessage - { title: string, body: string }
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  updateMaintenanceMessage: async (maintenanceMessage) => {
    const response = await apiRequest('/admin/settings/maintenance-message', {
      method: 'PUT',
      body: maintenanceMessage,
    });
    return {
      ...response,
      data: response.data?.settings || response.data,
      message: response.message || 'Maintenance message updated successfully',
    };
  },

  /**
   * Update general settings
   * @param {object} generalSettings - { appName?: string, dateFormat?: string, timeFormat?: string }
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  updateGeneralSettings: async (generalSettings) => {
    const response = await apiRequest('/admin/settings/general', {
      method: 'PUT',
      body: generalSettings,
    });
    return {
      ...response,
      data: response.data?.settings || response.data,
      message: response.message || 'General settings updated successfully',
    };
  },

  /**
   * Update timezone setting
   * @param {string} timezone - Timezone string (e.g., 'Asia/Karachi', 'UTC')
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  updateTimezone: async (timezone) => {
    const response = await apiRequest('/admin/settings/timezone', {
      method: 'PUT',
      body: { timezone },
    });
    return {
      ...response,
      data: response.data?.settings || response.data,
      message: response.message || 'Timezone updated successfully',
    };
  },

  /**
   * Update app versions
   * @param {object} appVersions - { ios?: string, android?: string }
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  updateAppVersions: async (appVersions) => {
    const response = await apiRequest('/admin/settings/app-versions', {
      method: 'PUT',
      body: appVersions,
    });
    return {
      ...response,
      data: response.data?.settings || response.data,
      message: response.message || 'App versions updated successfully',
    };
  },

  /**
   * Update release notes
   * @param {string} releaseNotes - Release notes content (markdown supported)
   * @returns {Promise<{success: boolean, data: object, message: string}>}
   */
  updateReleaseNotes: async (releaseNotes) => {
    const response = await apiRequest('/admin/settings/release-notes', {
      method: 'PUT',
      body: { releaseNotes },
    });
    return {
      ...response,
      data: response.data?.settings || response.data,
      message: response.message || 'Release notes updated successfully',
    };
  },

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated: () => {
    const session = getStoredSession();
    return !!(session && session.token);
  },

  /**
   * Get stored user data
   * @returns {object|null}
   */
  getStoredUser: () => {
    const session = getStoredSession();
    return session?.user || null;
  },

  /**
   * Get auth token
   * @returns {string|null}
   */
  getToken: () => {
    const session = getStoredSession();
    return session?.token || null;
  },
};

export default apiService;
