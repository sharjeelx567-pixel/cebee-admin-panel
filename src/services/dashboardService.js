/**
 * Dashboard Service
 * Handles all dashboard-related API calls. Responses normalized for UI (camelCase).
 */

import { apiGet } from './apiBase';

const normalizeDashboardStats = (data) => {
  const d = data?.stats ?? data ?? {};
  return {
    totalUsers: Number(d.totalUsers ?? d.total_users ?? 0),
    activeUsers: Number(d.activeUsers ?? d.active_users ?? 0),
    totalSPIssued: Number(d.totalSPIssued ?? d.total_sp_issued ?? 0),
    estimatedRewardsValue: Number(d.estimatedRewardsValue ?? d.estimated_rewards_value ?? 0),
  };
};

/**
 * Get dashboard statistics. Returns normalized camelCase stats for the UI.
 */
export const getDashboardStats = async () => {
  const empty = { totalUsers: 0, activeUsers: 0, totalSPIssued: 0, estimatedRewardsValue: 0 };
  try {
    const response = await apiGet('/admin/dashboard/stats');
    if (response.success) {
      return { success: true, data: normalizeDashboardStats(response.data) };
    }
    return { success: false, error: response.error, data: empty };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to fetch dashboard statistics', data: empty };
  }
};

/**
 * Get today's fixture summary
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getTodayFixtureSummary = async () => {
  try {
    const response = await apiGet('/admin/dashboard/fixtures/today');
    
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
        totalMatches: 0,
        completedMatches: 0,
        liveMatches: 0,
        pendingResults: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch today\'s fixture summary',
      data: {
        totalMatches: 0,
        completedMatches: 0,
        liveMatches: 0,
        pendingResults: 0,
      },
    };
  }
};

/**
 * Get next upcoming fixture
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getNextFixture = async () => {
  try {
    const response = await apiGet('/admin/dashboard/fixtures/next');
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error,
      data: null,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch next fixture',
      data: null,
    };
  }
};

/**
 * Get high-risk admin action alerts
 * @param {object} params - Query parameters (limit, severity)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getHighRiskAlerts = async (params = {}) => {
  try {
    const defaultParams = {
      limit: 5,
      severity: 'critical',
      ...params,
    };
    
    const response = await apiGet('/admin/dashboard/alerts', defaultParams);
    
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
        alerts: [],
        total: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch high-risk alerts',
      data: {
        alerts: [],
        total: 0,
      },
    };
  }
};

/**
 * Get comprehensive dashboard data (all in one call)
 * Backend returns main data in /admin/dashboard, alerts in /admin/dashboard/alerts
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getDashboardData = async () => {
  try {
    // Fetch dashboard data and alerts in parallel
    const [dashboardResponse, alertsResponse] = await Promise.all([
      apiGet('/admin/dashboard'),
      getHighRiskAlerts({ limit: 3 }),
    ]);
    
    if (dashboardResponse.success && dashboardResponse.data) {
      const backendData = dashboardResponse.data;
      
      // Map backend response to frontend format (support camelCase and snake_case)
      const stats = backendData.stats || backendData.statistics || {};
      const todayMatches = stats.todayMatches || stats.today_matches || {};
      const todaySummary = backendData.todaySummary || backendData.today_summary || {};
      const nextFixture = backendData.nextFixture ?? backendData.next_fixture ?? null;

      let alerts = [];
      if (alertsResponse.success) {
        const ad = alertsResponse.data;
        if (Array.isArray(ad)) alerts = ad;
        else if (Array.isArray(ad?.alerts)) alerts = ad.alerts;
        else if (Array.isArray(ad?.data)) alerts = ad.data;
      } else if (Array.isArray(backendData.alerts)) {
        alerts = backendData.alerts;
      }

      const mappedData = {
        stats: {
          totalUsers: Number(stats.totalUsers ?? stats.total_users ?? 0),
          activeUsers: Number(stats.activeUsers ?? stats.active_users ?? 0),
          totalSPIssued: Number(stats.totalSPIssued ?? stats.total_sp_issued ?? 0),
          estimatedRewardsValue: Number(stats.estimatedRewardsValue ?? stats.estimated_rewards_value ?? 0),
        },
        todaySummary: {
          totalMatches: Number(todaySummary.totalMatches ?? todaySummary.total_matches ?? todayMatches.total ?? 0),
          completedMatches: Number(todaySummary.completedMatches ?? todaySummary.completed_matches ?? todayMatches.completed ?? 0),
          liveMatches: Number(todaySummary.liveMatches ?? todaySummary.live_matches ?? todayMatches.live ?? 0),
          pendingResults: Number(todaySummary.pendingResults ?? todaySummary.pending_results ?? todayMatches.pendingResults ?? todayMatches.pending_results ?? 0),
        },
        nextFixture: nextFixture && typeof nextFixture === 'object' ? {
          ...nextFixture,
          kickoffTime: nextFixture.kickoffTime ?? nextFixture.kickoff_time ?? nextFixture.kickoff,
          homeTeam: nextFixture.homeTeam ?? nextFixture.home_team,
          awayTeam: nextFixture.awayTeam ?? nextFixture.away_team,
          leagueName: nextFixture.leagueName ?? nextFixture.league_name,
        } : null,
        alerts: Array.isArray(alerts) ? alerts : [],
      };
      
      return {
        success: true,
        data: mappedData,
      };
    }
    
    // If response failed, return defaults
    return {
      success: false,
      error: dashboardResponse.error || 'Failed to fetch dashboard data',
      data: {
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalSPIssued: 0,
          estimatedRewardsValue: 0,
        },
        todaySummary: {
          totalMatches: 0,
          completedMatches: 0,
          liveMatches: 0,
          pendingResults: 0,
        },
        nextFixture: null,
        alerts: [],
      },
    };
  } catch (error) {
    console.error('Dashboard service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard data',
      data: {
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          totalSPIssued: 0,
          estimatedRewardsValue: 0,
        },
        todaySummary: {
          totalMatches: 0,
          completedMatches: 0,
          liveMatches: 0,
          pendingResults: 0,
        },
        nextFixture: null,
        alerts: [],
      },
    };
  }
};
