/**
 * System Logs Service
 * Handles all system logs API calls
 */

import { apiGet, apiPut } from './apiBase';

/**
 * Get system logs with advanced filtering
 * @param {object} params - Query parameters
 * @param {string} params.category - Filter by category (security, critical, system, admin)
 * @param {string} params.type - Filter by type (info, warning, error, critical)
 * @param {string} params.severity - Filter by severity (LOW, MEDIUM, HIGH, CRITICAL)
 * @param {boolean} params.resolved - Filter by resolved status
 * @param {string} params.search - Search by action or description
 * @param {string} params.dateRange - Predefined range (today, last7days, last30days, all, alltime)
 * @param {string} params.dateFrom - Custom start date (ISO format)
 * @param {string} params.dateTo - Custom end date (ISO format)
 * @param {string} params.adminUser - Filter by admin (all, auto-detection, super-admin, support-admin, or admin ID)
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sort - Sort order (newest, oldest, severity)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSystemLogs = async (params = {}) => {
  try {
    // Build query parameters
    const queryParams = {};
    
    if (params.category) queryParams.category = params.category;
    if (params.type) queryParams.type = params.type;
    if (params.severity) queryParams.severity = params.severity;
    if (params.resolved !== undefined) queryParams.resolved = params.resolved;
    if (params.search) queryParams.search = params.search;
    if (params.dateRange) queryParams.dateRange = params.dateRange;
    if (params.dateFrom) queryParams.dateFrom = params.dateFrom;
    if (params.dateTo) queryParams.dateTo = params.dateTo;
    if (params.adminUser) queryParams.adminUser = params.adminUser;
    if (params.page) queryParams.page = params.page;
    if (params.limit) queryParams.limit = params.limit;
    if (params.sort) queryParams.sort = params.sort;

    const response = await apiGet('/system-logs', queryParams);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch system logs',
      data: { logs: [], pagination: {}, stats: {} }
    };
  }
};

/**
 * Get list of admins for filtering
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSystemLogAdmins = async () => {
  try {
    const response = await apiGet('/system-logs/admins');
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch admin list',
      data: { admins: [] }
    };
  }
};

/**
 * Get system log statistics
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSystemLogStats = async () => {
  try {
    const response = await apiGet('/system-logs/stats');
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch statistics',
      data: { stats: {} }
    };
  }
};

/**
 * Get single system log by ID
 * @param {string} logId - System log ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getSystemLog = async (logId) => {
  try {
    const response = await apiGet(`/system-logs/${logId}`);
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch system log'
    };
  }
};

/**
 * Resolve a system log
 * @param {string} logId - System log ID to resolve
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const resolveSystemLog = async (logId) => {
  try {
    const response = await apiPut(`/system-logs/${logId}/resolve`, {});
    return response;
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to resolve system log'
    };
  }
};
