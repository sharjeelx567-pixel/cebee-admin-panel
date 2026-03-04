/**
 * Polls Service
 * Handles all poll-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch } from './apiBase';

/**
 * Get all polls with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (status, leagueId, search, page, limit, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPolls = async (params = {}) => {
  try {
    const response = await apiGet('/polls', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { polls: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch polls',
      data: { polls: [], pagination: {} },
    };
  }
};

/**
 * Get poll by ID
 * @param {string} pollId - Poll ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPoll = async (pollId) => {
  try {
    const response = await apiGet(`/polls/${pollId}`);
    
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
      error: error.message || 'Failed to fetch poll',
    };
  }
};

/**
 * Create new poll
 * @param {object} pollData - Poll data (leagueId, startTime, closeTime, fixtures)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createPoll = async (pollData) => {
  try {
    // Validate required fields
    if (!pollData.leagueId || !pollData.leagueId.trim()) {
      console.error('Poll creation failed: leagueId is missing or empty', pollData);
      return {
        success: false,
        error: 'League ID is required',
      };
    }

    if (!pollData.startTime || !pollData.closeTime) {
      return {
        success: false,
        error: 'Start time and close time are required',
      };
    }

    if (!pollData.fixtures || !Array.isArray(pollData.fixtures) || pollData.fixtures.length === 0) {
      return {
        success: false,
        error: 'At least one fixture is required',
      };
    }

    // Format the request body to match backend expectations
    // Backend expects camelCase: leagueId, startTime, closeTime, fixtures
    // Backend no longer requires title, description, or community_voting
    const requestBody = {
      leagueId: pollData.leagueId,
      startTime: pollData.startTime instanceof Date 
        ? pollData.startTime.toISOString() 
        : pollData.startTime,
      closeTime: pollData.closeTime instanceof Date 
        ? pollData.closeTime.toISOString() 
        : pollData.closeTime,
      fixtures: pollData.fixtures.map(fixture => ({
        matchNum: fixture.matchNum,
        teamAId: fixture.teamAId,
        teamBId: fixture.teamBId,
      })),
    };

    console.log('Creating poll - pollData received:', pollData);
    console.log('Creating poll - requestBody being sent:', requestBody);
    
    // Validate leagueId is present
    if (!requestBody.leagueId) {
      console.error('ERROR: leagueId is missing in requestBody!', requestBody);
      return {
        success: false,
        error: 'League ID is required',
      };
    }
    const response = await apiPost('/polls', requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Poll created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create poll',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating poll',
    };
  }
};

/**
 * Update poll
 * @param {string} pollId - Poll ID
 * @param {object} pollData - Updated poll data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updatePoll = async (pollId, pollData) => {
  try {
    if (!pollId) {
      return {
        success: false,
        error: 'Poll ID is required',
      };
    }

    // Format the request body to match backend expectations
    // Backend expects camelCase: leagueId, startTime, closeTime, fixtures
    // Backend no longer requires title, description, or community_voting
    const requestBody = {};
    
    if (pollData.leagueId) {
      requestBody.leagueId = pollData.leagueId;
    }
    
    if (pollData.startTime) {
      requestBody.startTime = pollData.startTime instanceof Date 
        ? pollData.startTime.toISOString() 
        : pollData.startTime;
    }
    
    if (pollData.closeTime) {
      requestBody.closeTime = pollData.closeTime instanceof Date 
        ? pollData.closeTime.toISOString() 
        : pollData.closeTime;
    }
    
    if (pollData.fixtures && Array.isArray(pollData.fixtures)) {
      requestBody.fixtures = pollData.fixtures.map(fixture => ({
        matchNum: fixture.matchNum,
        teamAId: fixture.teamAId,
        teamBId: fixture.teamBId,
      }));
    }

    console.log('Updating poll - pollData received:', pollData);
    console.log('Updating poll - requestBody being sent:', requestBody);
    const response = await apiPut(`/polls/${pollId}`, requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Poll updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update poll',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating poll',
    };
  }
};

/**
 * Get upcoming fixtures from Football API for a league/season (for poll creation). Supports pagination.
 * @param {string} leagueId - League ID (CeBee DB _id or Football API league id)
 * @param {number|string} season - Season year (e.g. 2025)
 * @param {object} options - Optional { page: 1, limit: 20 }
 * @returns {Promise<{success: boolean, data?: { fixtures: Array, pagination?: object }, error?: string}>}
 */
export const getUpcomingFixtures = async (leagueId, season, options = {}) => {
  try {
    if (!leagueId || season == null) {
      return {
        success: false,
        error: 'League and season are required',
        data: { fixtures: [], pagination: {} },
      };
    }
    const params = {
      leagueId,
      season: String(season),
      ...(options.page != null && { page: options.page }),
      ...(options.limit != null && { limit: options.limit }),
    };
    const response = await apiGet('/polls/upcoming-fixtures', params);
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          fixtures: response.data.fixtures || [],
          pagination: response.data.pagination || {},
        },
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to load upcoming fixtures',
      data: { fixtures: response.data?.fixtures || [], pagination: response.data?.pagination || {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch upcoming fixtures',
      data: { fixtures: [], pagination: {} },
    };
  }
};

/**
 * Create poll from 5 Football API fixture IDs (new flow: league → select 5 fixtures → create).
 * @param {object} params - { leagueId, season, apiFixtureIds: number[], startTime, closeTime, status? }
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createPollFromApi = async (params) => {
  try {
    const { leagueId, season, apiFixtureIds, startTime, closeTime, status } = params;
    if (!leagueId || season == null || !Array.isArray(apiFixtureIds) || apiFixtureIds.length !== 5) {
      return {
        success: false,
        error: 'leagueId, season, and exactly 5 apiFixtureIds are required',
      };
    }
    const body = {
      leagueId,
      season: typeof season === 'number' ? season : parseInt(String(season), 10),
      apiFixtureIds: apiFixtureIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n)),
      startTime: startTime instanceof Date ? startTime.toISOString() : startTime,
      closeTime: closeTime instanceof Date ? closeTime.toISOString() : closeTime,
    };
    if (status) body.status = status;
    const response = await apiPost('/polls/from-api', body);
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Poll created from API fixtures',
      };
    }
    return {
      success: false,
      error: response.error || response.message || 'Failed to create poll from API',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred',
    };
  }
};

/**
 * Close poll manually
 * @param {string} pollId - Poll ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const closePoll = async (pollId) => {
  try {
    if (!pollId) {
      return {
        success: false,
        error: 'Poll ID is required',
      };
    }

    const response = await apiPatch(`/polls/${pollId}/close`, {});
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Poll closed successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to close poll',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while closing poll',
    };
  }
};
