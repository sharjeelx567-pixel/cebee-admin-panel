/**
 * Fixtures Service
 * Handles all fixture-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './apiBase';

/**
 * Get all fixtures with filtering, search, pagination, and sorting
 * @param {object} params - Query parameters (status, cmdId, cmdStatus, search, page, limit, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixtures = async (params = {}) => {
  try {
    const response = await apiGet('/fixtures', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { fixtures: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixtures',
      data: { fixtures: [], pagination: {} },
    };
  }
};

/**
 * Get fixture by ID
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixture = async (fixtureId) => {
  try {
    const response = await apiGet(`/fixtures/${fixtureId}`);
    
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
      error: error.message || 'Failed to fetch fixture',
    };
  }
};

/**
 * Create new fixture
 * @param {object} fixtureData - Fixture data
 *   For CeBe/Regular: { home_team_id, away_team_id, leagueId, kickoffTime, publishDateTime, venue, isCeBeFeatured, cmdId }
 *   For Community Featured: { selected_team_id, leagueId, kickoffTime, publishDateTime, venue, matchday, isCommunityFeatured, cmdId }
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createFixture = async (fixtureData) => {
  try {
    // Validate required fields based on fixture type
    if (!fixtureData.leagueId) {
      return {
        success: false,
        error: 'League ID is required',
      };
    }

    if (!fixtureData.kickoffTime) {
      return {
        success: false,
        error: 'Kickoff time is required',
      };
    }

    if (!fixtureData.publishDateTime) {
      return {
        success: false,
        error: 'Publish date time is required',
      };
    }

    if (!fixtureData.venue) {
      return {
        success: false,
        error: 'Venue is required',
      };
    }

    // Format the request body to match backend expectations
    const requestBody = {
      leagueId: fixtureData.leagueId,
      kickoffTime: fixtureData.kickoffTime instanceof Date 
        ? fixtureData.kickoffTime.toISOString() 
        : fixtureData.kickoffTime,
      publishDateTime: fixtureData.publishDateTime instanceof Date 
        ? fixtureData.publishDateTime.toISOString() 
        : fixtureData.publishDateTime,
      venue: fixtureData.venue,
    };

    // Handle Community Featured fixtures
    if (fixtureData.isCommunityFeatured) {
      if (!fixtureData.selected_team_id) {
        return {
          success: false,
          error: 'Selected team ID is required for Community Featured fixtures',
        };
      }
      if (!fixtureData.matchday) {
        return {
          success: false,
          error: 'Matchday is required for Community Featured fixtures',
        };
      }
      requestBody.isCommunityFeatured = true;
      requestBody.selected_team_id = fixtureData.selected_team_id;
      requestBody.matchday = fixtureData.matchday;
    } 
    // Handle CeBe Featured or Regular fixtures
    else {
      if (!fixtureData.home_team_id || !fixtureData.away_team_id) {
        return {
          success: false,
          error: 'Home team ID and away team ID are required',
        };
      }
      requestBody.home_team_id = fixtureData.home_team_id;
      requestBody.away_team_id = fixtureData.away_team_id;
      
      if (fixtureData.isCeBeFeatured) {
        requestBody.isCeBeFeatured = true;
      }
    }

    // Optional fields
    if (fixtureData.cmdId) {
      requestBody.cmdId = fixtureData.cmdId;
    }

    if (fixtureData.status) {
      requestBody.status = fixtureData.status;
    }

    
    const response = await apiPost('/fixtures', requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Fixture created successfully',
      };
    }
    
    // Provide detailed error message
    let errorMessage = response.error || 'Failed to create fixture';
    if (response.status === 500) {
      // Try to extract more details from the error response
      const errorData = response.data || {};
      const backendError = errorData.error || errorData.message || errorData.errorName;
      
      if (backendError) {
        // Show the actual backend error message
        errorMessage = `Backend Error: ${backendError}`;
        
        // Add error name if available
        if (errorData.errorName) {
          errorMessage += ` (${errorData.errorName})`;
        }
        
        // Add stack trace info if in development
        if (process.env.NODE_ENV === 'development' && errorData.stack) {
          console.error('Backend Error Stack:', errorData.stack);
        }
      } else {
        errorMessage = 'Server error (500): Internal server error. Please check backend logs for details.';
      }
    }
    
    return {
      success: false,
      error: errorMessage,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating fixture',
    };
  }
};

/**
 * Get upcoming fixtures from Football API for a league/season (for CeBee Featured – select fixture then auto-fill).
 * @param {string} leagueId - League ID (Football API id or CeBee league _id)
 * @param {number|string} season - Season year (e.g. 2026)
 * @returns {Promise<{success: boolean, data?: { fixtures: array }, error?: string}>}
 */
export const getUpcomingFixturesByLeague = async (leagueId, season) => {
  try {
    if (!leagueId || season == null) {
      return { success: false, error: 'leagueId and season are required', data: { fixtures: [] } };
    }
    const response = await apiGet('/fixtures/upcoming-by-league', { leagueId, season });
    if (response.success && response.data) {
      return {
        success: true,
        data: { fixtures: response.data.fixtures || [] },
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch upcoming fixtures',
      data: { fixtures: [] },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch upcoming fixtures',
      data: { fixtures: [] },
    };
  }
};

/**
 * Create CeBee Featured fixture from one Football API fixture (teams, kickoff, venue from API).
 * @param {object} params - { apiFixtureId, leagueId, publishDateTime, venue? }
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createFixtureFromApi = async (params) => {
  try {
    const { apiFixtureId, leagueId, publishDateTime } = params;
    if (!apiFixtureId || !leagueId) {
      return { success: false, error: 'apiFixtureId and leagueId are required' };
    }
    const body = {
      apiFixtureId: Number(apiFixtureId),
      leagueId,
    };
    if (params.venue && String(params.venue).trim()) {
      body.venue = String(params.venue).trim();
    }
    if (publishDateTime) {
      body.publishDateTime = publishDateTime instanceof Date
        ? publishDateTime.toISOString()
        : publishDateTime;
    }
    const response = await apiPost('/fixtures/from-api', body);
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'CeBee Featured fixture created from API',
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to create fixture from API',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to create fixture from API',
    };
  }
};

/**
 * Update fixture
 * @param {string} fixtureId - Fixture ID
 * @param {object} fixtureData - Updated fixture data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateFixture = async (fixtureId, fixtureData) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Format the request body to match backend expectations
    const requestBody = {};
    
    if (fixtureData.homeTeam) {
      requestBody.homeTeam = fixtureData.homeTeam.trim();
    }
    
    if (fixtureData.awayTeam) {
      requestBody.awayTeam = fixtureData.awayTeam.trim();
    }
    
    if (fixtureData.leagueId) {
      requestBody.leagueId = fixtureData.leagueId;
    }
    
    if (fixtureData.kickoffTime) {
      requestBody.kickoffTime = fixtureData.kickoffTime instanceof Date 
        ? fixtureData.kickoffTime.toISOString() 
        : fixtureData.kickoffTime;
    }

    if (fixtureData.venue !== undefined) {
      requestBody.venue = fixtureData.venue;
    }

    if (fixtureData.cmdId) {
      requestBody.cmdId = fixtureData.cmdId;
    }

    if (fixtureData.matchStatus) {
      requestBody.matchStatus = fixtureData.matchStatus;
    }

    const response = await apiPut(`/fixtures/${fixtureId}`, requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Fixture updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update fixture',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating fixture',
    };
  }
};

/**
 * Update fixture status
 * @param {string} fixtureId - Fixture ID
 * @param {string} status - New status (scheduled, published, predictionOpen, predictionLock, live, resultPending, completed)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateFixtureStatus = async (fixtureId, status) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    if (!status) {
      return {
        success: false,
        error: 'Status is required',
      };
    }

    // Backend uses PUT /fixtures/:id with status field in body
    const response = await apiPut(`/fixtures/${fixtureId}`, { status, matchStatus: status });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Fixture status updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update fixture status',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating fixture status',
    };
  }
};

/**
 * Update fixture results
 * @param {string} fixtureId - Fixture ID
 * @param {object} resultsData - Results data (homeScore, awayScore, firstGoalScorer, firstGoalMinute)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateFixtureResults = async (fixtureId, resultsData) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Validate required fields
    if (resultsData.homeScore === undefined || resultsData.homeScore === null || resultsData.homeScore === '') {
      return {
        success: false,
        error: 'Home score is required',
      };
    }

    if (resultsData.awayScore === undefined || resultsData.awayScore === null || resultsData.awayScore === '') {
      return {
        success: false,
        error: 'Away score is required',
      };
    }

    // Format the request body - backend expects homeScore, awayScore, firstGoalScorer, firstGoalMinute
    const requestBody = {
      homeScore: parseInt(resultsData.homeScore, 10),
      awayScore: parseInt(resultsData.awayScore, 10),
    };

    if (resultsData.firstGoalScorer) {
      requestBody.firstGoalScorer = resultsData.firstGoalScorer.trim();
    }

    if (resultsData.firstGoalMinute !== undefined && resultsData.firstGoalMinute !== null && resultsData.firstGoalMinute !== '') {
      requestBody.firstGoalMinute = parseInt(resultsData.firstGoalMinute, 10);
    }

    // Backend uses PUT /fixtures/:id/results
    const response = await apiPut(`/fixtures/${fixtureId}/results`, requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Fixture results updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update fixture results',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating fixture results',
    };
  }
};

/**
 * Delete fixture
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const deleteFixture = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    const response = await apiDelete(`/fixtures/${fixtureId}`);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Fixture deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete fixture',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting fixture',
    };
  }
};

/**
 * Get fixtures by CMd
 * @param {string} cmdId - CMd ID
 * @param {object} params - Additional query parameters
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixturesByCmd = async (cmdId, params = {}) => {
  try {
    const queryParams = { ...params, cmdId };
    const response = await apiGet('/fixtures', queryParams);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { fixtures: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixtures by CMd',
      data: { fixtures: [], pagination: {} },
    };
  }
};

/**
 * Get fixtures by status
 * @param {string} status - Fixture status
 * @param {object} params - Additional query parameters
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixturesByStatus = async (status, params = {}) => {
  try {
    const queryParams = { ...params, status };
    const response = await apiGet('/fixtures', queryParams);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { fixtures: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixtures by status',
      data: { fixtures: [], pagination: {} },
    };
  }
};

/**
 * Approve match details (sets status to published/predictionOpen)
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const approveFixture = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend doesn't have separate approve endpoint - use status update
    // Approving typically means moving from scheduled to published/predictionOpen
    const response = await apiPut(`/fixtures/${fixtureId}`, { 
      status: 'predictionOpen',
      matchStatus: 'predictionOpen'
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Match details approved successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to approve match details',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while approving match details',
    };
  }
};

/**
 * Publish fixture (move from scheduled to published/predictionOpen)
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const publishFixture = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend doesn't have separate publish endpoint - use status update
    // Publishing means moving to predictionOpen status
    const response = await apiPut(`/fixtures/${fixtureId}`, { 
      status: 'predictionOpen',
      matchStatus: 'predictionOpen'
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Fixture published successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to publish fixture',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while publishing fixture',
    };
  }
};

/**
 * Lock predictions for fixture (move to predictionLock status)
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const lockFixturePredictions = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend doesn't have separate lock endpoint - use status update
    // Locking means moving to predictionLock status
    const response = await apiPut(`/fixtures/${fixtureId}`, { 
      status: 'predictionLock',
      matchStatus: 'predictionLock'
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Predictions locked successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to lock predictions',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while locking predictions',
    };
  }
};

/**
 * Start live match (move to live status)
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const startLiveMatch = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend doesn't have separate start-live endpoint - use status update
    // Starting live means moving to live status
    const response = await apiPut(`/fixtures/${fixtureId}`, { 
      status: 'live',
      matchStatus: 'live'
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Match started successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to start live match',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while starting live match',
    };
  }
};

/**
 * End match (move to resultPending status)
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const endMatch = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend uses PUT /fixtures/:id/end-match
    const response = await apiPut(`/fixtures/${fixtureId}/end-match`, {});
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Match ended successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to end match',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while ending match',
    };
  }
};

/**
 * Get predictions for a fixture
 * Uses the predictionsService for consistency
 * @param {string} fixtureId - Fixture ID
 * @param {object} params - Query parameters (page, limit, search, sort_by, sort_order)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixturePredictions = async (fixtureId, params = {}) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Import predictionsService dynamically to avoid circular dependencies
    const { getPredictionsByFixture } = await import('./predictionsService');
    return await getPredictionsByFixture(fixtureId, params);
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixture predictions',
      data: { predictions: [], pagination: {} },
    };
  }
};

/**
 * Get fixture statistics (status counts) for dashboard
 * Backend: GET /api/fixtures/statistics?cmdId=...
 * @param {object} params - Optional { cmdId } to restrict counts to a matchday
 * @returns {Promise<{success: boolean, data?: { statistics: object }, error?: string}>}
 */
export const getFixtureStatistics = async (params = {}) => {
  try {
    const response = await apiGet('/fixtures/statistics', params);
    if (response.success && response.data?.statistics) {
      return {
        success: true,
        data: { statistics: response.data.statistics },
      };
    }
    return {
      success: false,
      error: response.error || 'Failed to fetch fixture statistics',
      data: { statistics: null },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixture statistics',
      data: { statistics: null },
    };
  }
};

/**
 * Get fixture statistics (single fixture - details)
 * NOTE: This gets fixture details; for dashboard status counts use getFixtureStatistics()
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixtureStats = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    const response = await apiGet(`/fixtures/${fixtureId}`);
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
      error: error.message || 'Failed to fetch fixture statistics',
    };
  }
};

/**
 * Get fixture timeline/events
 * NOTE: This endpoint may not exist in backend
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixtureTimeline = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend endpoint may not exist - return empty for now
    return {
      success: false,
      error: 'Timeline endpoint not available',
      data: { events: [] },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixture timeline',
      data: { events: [] },
    };
  }
};

/**
 * Bulk update fixture statuses
 * NOTE: This endpoint does not exist in backend - update fixtures individually
 * @param {Array<string>} fixtureIds - Array of fixture IDs
 * @param {string} status - New status
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const bulkUpdateFixtureStatus = async (fixtureIds, status) => {
  try {
    if (!fixtureIds || !Array.isArray(fixtureIds) || fixtureIds.length === 0) {
      return {
        success: false,
        error: 'Fixture IDs array is required',
      };
    }

    if (!status) {
      return {
        success: false,
        error: 'Status is required',
      };
    }

    // Backend doesn't have bulk endpoint - update each fixture individually
    const results = await Promise.allSettled(
      fixtureIds.map(fixtureId => 
        apiPut(`/fixtures/${fixtureId}`, { status, matchStatus: status })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    if (successful > 0) {
      return {
        success: true,
        data: { updated: successful, failed },
        message: `Updated ${successful} fixture(s)${failed > 0 ? `, ${failed} failed` : ''}`,
      };
    }
    
    return {
      success: false,
      error: 'Failed to update any fixtures',
      data: { updated: 0, failed },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating fixture statuses',
    };
  }
};

/**
 * Get fixture summary/overview
 * NOTE: This endpoint may not exist in backend - use getFixture instead
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFixtureSummary = async (fixtureId) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    // Backend endpoint may not exist - use getFixture instead
    const response = await apiGet(`/fixtures/${fixtureId}`);
    
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
      error: error.message || 'Failed to fetch fixture summary',
    };
  }
};

/**
 * Get available matchdays from existing fixtures
 * @param {string} leagueId - Optional league ID to filter matchdays
 * @returns {Promise<{success: boolean, data?: string[], error?: string}>}
 */
export const getMatchdays = async (leagueId = null) => {
  try {
    // Fetch fixtures to get unique matchdays
    const params = {
      isCommunityFeatured: true,
      limit: 1000, // Get enough fixtures to extract matchdays
    };
    
    if (leagueId) {
      params.leagueId = leagueId;
    }
    
    const response = await apiGet('/fixtures', params);
    
    if (response.success) {
      const fixtures = response.data?.fixtures || response.data || [];
      // Extract unique matchdays from fixtures
      const matchdays = [...new Set(
        fixtures
          .map(f => f.matchday)
          .filter(m => m && m.trim() !== '')
      )].sort();
      
      return {
        success: true,
        data: matchdays,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch matchdays',
      data: [],
    };
  }
};

/**
 * Get featured fixtures for a league (Community Featured)
 * @param {string} leagueId - League ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getFeaturedFixtures = async (leagueId) => {
  try {
    if (!leagueId) {
      return {
        success: false,
        error: 'League ID is required',
      };
    }

    // Backend endpoint: GET /api/fixtures/featured-fixture/:leagueId
    const response = await apiGet(`/fixtures/featured-fixture/${leagueId}`);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { featuredFixture: null },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch featured fixtures',
      data: { featuredFixture: null },
    };
  }
};
