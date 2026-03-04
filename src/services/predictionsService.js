/**
 * Predictions Service
 * Handles all prediction-related API calls
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './apiBase';

/**
 * Get all predictions with filtering, search, sorting, and pagination
 * @param {object} params - Query parameters (page, limit, search, status, cmd, sort)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictions = async (params = {}) => {
  try {
    const response = await apiGet('/predictions/admin/list', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: { predictions: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch predictions',
      data: { predictions: [], pagination: {} },
    };
  }
};

/**
 * Get prediction by ID
 * @param {string} predictionId - Prediction ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictionById = async (predictionId) => {
  try {
    if (!predictionId) {
      return {
        success: false,
        error: 'Prediction ID is required',
      };
    }

    const response = await apiGet(`/predictions/admin/${predictionId}`);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch prediction',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch prediction',
    };
  }
};

/**
 * Get predictions by user ID
 * @param {string} userId - User ID
 * @param {object} params - Query parameters (page, limit, status, sort)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictionsByUser = async (userId, params = {}) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiGet('/predictions/admin/list', { ...params, userId });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch user predictions',
      data: { predictions: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch user predictions',
      data: { predictions: [], pagination: {} },
    };
  }
};

/**
 * Get predictions by fixture ID
 * @param {string} fixtureId - Fixture ID
 * @param {object} params - Query parameters (page, limit, sort)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictionsByFixture = async (fixtureId, params = {}) => {
  try {
    if (!fixtureId) {
      return {
        success: false,
        error: 'Fixture ID is required',
      };
    }

    const response = await apiGet('/predictions/admin/list', { ...params, fixtureId });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch fixture predictions',
      data: { predictions: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch fixture predictions',
      data: { predictions: [], pagination: {} },
    };
  }
};

/**
 * Get predictions by CMd ID
 * @param {string} cmdId - CMd ID
 * @param {object} params - Query parameters (page, limit, status, sort)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictionsByCmd = async (cmdId, params = {}) => {
  try {
    if (!cmdId) {
      return {
        success: false,
        error: 'CMd ID is required',
      };
    }

    const response = await apiGet('/predictions/admin/list', { ...params, cmd: cmdId });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch CMd predictions',
      data: { predictions: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch CMd predictions',
      data: { predictions: [], pagination: {} },
    };
  }
};

/**
 * Get prediction statistics
 * @param {object} params - Query parameters (cmdId, fixtureId, userId)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictionStatistics = async (params = {}) => {
  try {
    const response = await apiGet('/predictions/statistics', params);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch prediction statistics',
      data: {},
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch prediction statistics',
      data: {},
    };
  }
};

/**
 * Get predictions grouped by user and fixture
 * Uses the admin list endpoint
 * @param {object} params - Query parameters (cmd, status, search, page, limit, sort)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getGroupedPredictions = async (params = {}) => {
  try {
    return await getPredictions(params);
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch predictions',
      data: { predictions: [], pagination: {} },
    };
  }
};

/**
 * Get prediction details for a specific user-fixture combination
 * @param {string} userId - User ID
 * @param {string} fixtureId - Fixture ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getPredictionGroup = async (userId, fixtureId) => {
  try {
    if (!userId || !fixtureId) {
      return {
        success: false,
        error: 'User ID and Fixture ID are required',
      };
    }

    // Backend doesn't support userId/fixtureId as direct query params
    // Fetch predictions with high limit and filter client-side
    // Note: This is a workaround - ideally backend should support userId/fixtureId filters
    const response = await apiGet('/predictions/admin/list', { 
      limit: 1000,
      page: 1,
      sort: 'newest'
    });
    
    if (response.success && response.data) {
      const allPredictions = response.data.predictions || [];
      
      // Filter predictions by userId and fixtureId
      // Handle both cases: userId might be ObjectId string or the actual user._id
      const filteredPredictions = allPredictions.filter(pred => {
        const predUserId = pred.user?._id || pred.userId;
        const predFixtureId = pred.fixture?._id || pred.fixtureId;
        
        // Convert to strings for comparison
        const userIdStr = String(userId);
        const fixtureIdStr = String(fixtureId);
        const predUserIdStr = predUserId ? String(predUserId) : '';
        const predFixtureIdStr = predFixtureId ? String(predFixtureId) : '';
        
        return predUserIdStr === userIdStr && predFixtureIdStr === fixtureIdStr;
      });
      
      return {
        success: true,
        data: {
          predictions: filteredPredictions,
          pagination: {
            page: 1,
            limit: filteredPredictions.length,
            total: filteredPredictions.length,
            pages: 1
          }
        },
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to fetch prediction group',
      data: { predictions: [] },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch prediction group',
      data: { predictions: [] },
    };
  }
};

/**
 * Format prediction data from backend to frontend format
 * @param {object} prediction - Raw prediction data from backend
 * @returns {object} Formatted prediction data
 */
export const formatPrediction = (prediction) => {
  // Check if this is from admin endpoint (has user and fixture objects)
  if (prediction.user && prediction.fixture) {
    // Extract all available fields from the prediction object
    // Backend may not populate all fields, so we check for them
    const homeGoals = prediction.homeGoals !== undefined ? prediction.homeGoals : 
                      prediction.predictedHomeScore !== undefined ? prediction.predictedHomeScore : null;
    const awayGoals = prediction.awayGoals !== undefined ? prediction.awayGoals : 
                      prediction.predictedAwayScore !== undefined ? prediction.predictedAwayScore : null;
    
    // Determine prediction type from available data
    let predictionType = prediction.predictionType || 'match_result';
    if (homeGoals !== null && awayGoals !== null) {
      predictionType = 'correct_score';
    } else if (prediction.firstPlayer) {
      predictionType = 'first_goal_scorer';
    }
    
    // Format prediction string
    let predictionStr = 'N/A';
    if (homeGoals !== null && awayGoals !== null) {
      predictionStr = `${homeGoals}-${awayGoals}`;
    } else if (prediction.prediction) {
      predictionStr = prediction.prediction;
    }
    
    // Get actual result from fixture
    let actualResult = null;
    if (prediction.fixture.homeScore !== null && prediction.fixture.homeScore !== undefined &&
        prediction.fixture.awayScore !== null && prediction.fixture.awayScore !== undefined) {
      actualResult = `${prediction.fixture.homeScore}-${prediction.fixture.awayScore}`;
    } else if (prediction.fixture.score) {
      actualResult = prediction.fixture.score;
    }
    
    return {
      id: prediction._id || prediction.id,
      userId: prediction.user._id || '',
      username: prediction.user.username || prediction.user.fullName || 'Unknown User',
      userEmail: prediction.user.email || '',
      userCountry: prediction.user.country || '',
      fixtureId: prediction.fixture._id || '',
      matchId: prediction.fixture.matchId || '',
      matchName: prediction.fixture.matchName || `${prediction.fixture.homeTeam || ''} vs ${prediction.fixture.awayTeam || ''}`,
      homeTeam: prediction.fixture.homeTeam || '',
      awayTeam: prediction.fixture.awayTeam || '',
      predictionType: predictionType,
      prediction: predictionStr,
      predictedHomeScore: homeGoals,
      predictedAwayScore: awayGoals,
      firstGoalScorer: prediction.firstPlayer || prediction.firstGoalScorer || '',
      firstGoalMinute: prediction.firstGoalMinutes || prediction.firstGoalMinute || null,
      predictionTime: prediction.predictedAt ? new Date(prediction.predictedAt) : new Date(),
      status: prediction.status || 'ongoing',
      predictionStatus: prediction.status || 'ongoing',
      actualResult: actualResult,
      matchStatus: prediction.fixture.status || 'ongoing',
      spStatus: prediction.status === 'correct' || prediction.status === 'partial' ? 'awarded' : 
                prediction.status === 'incorrect' ? 'not_awarded' : 'pending',
      spValue: prediction.spAwarded || 0,
      spAwarded: prediction.spAwarded || 0,
      points: prediction.spAwarded || 0,
      isCorrect: prediction.status === 'correct',
      correctness: prediction.status === 'correct' ? 'won' : 
                   prediction.status === 'incorrect' ? 'lost' : 'pending',
      cmdId: prediction.fixture.cmdId?._id || prediction.fixture.cmdId || '',
      cmdName: prediction.fixture.cmdId?.name || '',
      isCommunityFeatured: prediction.fixture?.isCommunityFeatured || false,
      hot: prediction.fixture?.isFeatured || prediction.fixture?.isCeBeFeatured || prediction.fixture?.isCommunityFeatured || false,
      createdAt: prediction.predictedAt ? new Date(prediction.predictedAt) : new Date(),
      updatedAt: prediction.evaluatedAt ? new Date(prediction.evaluatedAt) : new Date(),
      totalPredictions: prediction.totalPredictions || 0,
    };
  }

  // Fallback for other formats
  return {
    id: prediction._id || prediction.id,
    userId: prediction.userId || '',
    username: prediction.username || 'Unknown User',
    userEmail: prediction.userEmail || '',
    userCountry: prediction.userCountry || '',
    fixtureId: prediction.fixtureId || '',
    matchId: prediction.matchId || '',
    matchName: prediction.matchName || '',
    homeTeam: prediction.homeTeam || '',
    awayTeam: prediction.awayTeam || '',
    isCommunityFeatured: prediction.isCommunityFeatured || false,
    hot: prediction.hot || prediction.isFeatured || false,
    predictionType: prediction.predictionType || 'match_result',
    prediction: prediction.prediction || '',
    predictedHomeScore: prediction.predictedHomeScore || 0,
    predictedAwayScore: prediction.predictedAwayScore || 0,
    firstGoalScorer: prediction.firstGoalScorer || '',
    firstGoalMinute: prediction.firstGoalMinute || null,
    predictionTime: prediction.predictionTime ? new Date(prediction.predictionTime) : new Date(),
    status: prediction.status || 'ongoing',
    predictionStatus: prediction.status || 'ongoing',
    actualResult: prediction.actualResult || '',
    matchStatus: prediction.matchStatus || 'ongoing',
    spStatus: prediction.spStatus || 'pending',
    spValue: prediction.spValue || 0,
    spAwarded: prediction.spAwarded || 0,
    points: prediction.points || 0,
    isCorrect: prediction.isCorrect || false,
    correctness: prediction.correctness || 'pending',
    cmdId: prediction.cmdId || '',
    cmdName: prediction.cmdName || '',
    createdAt: prediction.createdAt ? new Date(prediction.createdAt) : new Date(),
    updatedAt: prediction.updatedAt ? new Date(prediction.updatedAt) : new Date(),
    totalPredictions: prediction.totalPredictions || 0,
  };
};

/**
 * Format multiple predictions from backend to frontend format
 * @param {array} predictions - Array of raw prediction data from backend
 * @returns {array} Array of formatted prediction data
 */
export const formatPredictions = (predictions) => {
  if (!Array.isArray(predictions)) {
    return [];
  }
  
  return predictions.map(formatPrediction);
};
