/**
 * Notifications Service
 * Handles all notification-related API calls
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiBase';

/**
 * Get all notifications with filtering, search, sorting, and pagination
 * @param {object} params - Query parameters (page, limit, search, status, type, audience, sort)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getNotifications = async (params = {}) => {
  try {
    // Map frontend parameters to backend format if needed
    const backendParams = { ...params };
    
    // Convert page from 0-based (frontend) to 1-based (backend) if needed
    if (backendParams.page !== undefined) {
      backendParams.page = backendParams.page + 1;
    }
    
    // Map frontend sort values to backend sort values
    if (backendParams.sort) {
      const sortMap = {
        'dateNewest': 'newest',
        'dateOldest': 'oldest',
        'titleAZ': 'title_asc',
        'titleZA': 'title_desc',
        'openRateHighest': 'open_rate_high',
        'openRateLowest': 'open_rate_low',
      };
      backendParams.sort = sortMap[backendParams.sort] || backendParams.sort;
    }
    
    const response = await apiGet('/notifications/admin/list', backendParams);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || response.message || 'Failed to fetch notifications',
      data: { notifications: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch notifications',
      data: { notifications: [], pagination: {} },
    };
  }
};

/**
 * Get notification by ID
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getNotificationById = async (notificationId) => {
  try {
    if (!notificationId) {
      return {
        success: false,
        error: 'Notification ID is required',
      };
    }

    const response = await apiGet(`/notifications/admin/${notificationId}`);
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data,
      };
    }
    
    return {
      success: false,
      error: response.error || response.message || 'Failed to fetch notification details',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch notification details',
    };
  }
};

/**
 * Create a new notification
 * @param {object} notificationData - Notification data
 * @param {string} notificationData.title - Notification title
 * @param {string} notificationData.body - Notification body/message
 * @param {string} notificationData.type - Notification type
 * @param {string} notificationData.audience - Target audience
 * @param {string} notificationData.deepLink - Optional deep link
 * @param {boolean} notificationData.scheduleForLater - Whether to schedule for later
 * @param {Date} notificationData.scheduledAt - Scheduled date/time (if scheduling)
 * @param {string} notificationData.status - Status (draft, scheduled, sent)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createNotification = async (notificationData) => {
  try {
    if (!notificationData.title || !notificationData.body) {
      return {
        success: false,
        error: 'Title and body are required',
      };
    }

    // Prepare the request body according to backend API
    const requestBody = {
      notificationType: notificationData.type || 'important_announcement',
      title: notificationData.title,
      message: notificationData.body, // Backend uses 'message' not 'body'
      deepLink: notificationData.deepLink || null,
      targetAudience: notificationData.audience === 'all' ? 'all_users' : 
                      notificationData.audience === 'active-30' ? 'active_users_30_days' :
                      notificationData.audience === 'inactive' ? 'inactive_users' :
                      notificationData.audience === 'winners' ? 'winners' :
                      notificationData.audience === 'flagged' ? 'flagged_users' :
                      notificationData.audience === 'by-country' ? 'by_country' :
                      notificationData.audience === 'by-league' ? 'by_league_preference' :
                      notificationData.audience === 'by-club' ? 'by_club_preference' : 'all_users',
      audienceFilters: notificationData.audienceFilters || {},
    };

    // Add scheduled time if scheduling for later
    if (notificationData.scheduleForLater && notificationData.scheduledAt) {
      requestBody.scheduledFor = notificationData.scheduledAt.toISOString();
    } else if (!notificationData.scheduleForLater && notificationData.status !== 'draft') {
      // If not scheduling and not draft, send now
      requestBody.sendNow = true;
    }

    const response = await apiPost('/notifications', requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || (notificationData.scheduleForLater ? 'Notification scheduled successfully' : 'Notification sent successfully'),
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create notification',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating notification',
    };
  }
};

/**
 * Update notification (only for draft or scheduled notifications)
 * @param {string} notificationId - Notification ID
 * @param {object} notificationData - Updated notification data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateNotification = async (notificationId, notificationData) => {
  try {
    if (!notificationId) {
      return {
        success: false,
        error: 'Notification ID is required',
      };
    }

    const requestBody = {};
    
    if (notificationData.title !== undefined) requestBody.title = notificationData.title;
    if (notificationData.body !== undefined) requestBody.message = notificationData.body; // Backend uses 'message'
    if (notificationData.type !== undefined) requestBody.type = notificationData.type;
    if (notificationData.deepLink !== undefined) requestBody.deepLink = notificationData.deepLink;
    
    // Handle audience mapping
    if (notificationData.audience !== undefined) {
      requestBody.targetAudience = notificationData.audience === 'all' ? 'all_users' : 
                                    notificationData.audience === 'active-30' ? 'active_users_30_days' :
                                    notificationData.audience === 'inactive' ? 'inactive_users' :
                                    notificationData.audience === 'winners' ? 'winners' :
                                    notificationData.audience === 'flagged' ? 'flagged_users' :
                                    notificationData.audience === 'by-country' ? 'by_country' :
                                    notificationData.audience === 'by-league' ? 'by_league_preference' :
                                    notificationData.audience === 'by-club' ? 'by_club_preference' : 'all_users';
    }
    
    if (notificationData.audienceFilters !== undefined) {
      requestBody.audienceFilters = notificationData.audienceFilters;
    }
    
    // Handle scheduling - use schedule endpoint if scheduling
    if (notificationData.scheduledAt !== undefined || notificationData.scheduleForLater !== undefined) {
      if (notificationData.scheduledAt) {
        requestBody.scheduledFor = notificationData.scheduledAt.toISOString();
      } else if (notificationData.scheduledAt === null) {
        requestBody.scheduledFor = null;
      }
      
      // Use schedule endpoint for scheduling updates
      const response = await apiPut(`/notifications/${notificationId}/schedule`, requestBody);
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          message: response.message || 'Notification updated successfully',
        };
      }
      
      return {
        success: false,
        error: response.error || 'Failed to update notification',
      };
    }

    const response = await apiPut(`/notifications/${notificationId}`, requestBody);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Notification updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update notification',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating notification',
    };
  }
};

/**
 * Save notification as draft
 * @param {object} notificationData - Notification data
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const saveNotificationAsDraft = async (notificationData) => {
  // For draft, don't set sendNow and don't set scheduledFor
  return await createNotification({
    ...notificationData,
    scheduleForLater: false,
    scheduledAt: null,
    status: 'draft',
  });
};

/**
 * Send notification immediately
 * @param {string} notificationId - Notification ID (for scheduled/draft notifications)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const sendNotification = async (notificationId) => {
  try {
    if (!notificationId) {
      return {
        success: false,
        error: 'Notification ID is required',
      };
    }

    const response = await apiPost(`/notifications/${notificationId}/send`, {});
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Notification sent successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to send notification',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while sending notification',
    };
  }
};

/**
 * Cancel scheduled notification
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const cancelScheduledNotification = async (notificationId) => {
  try {
    if (!notificationId) {
      return {
        success: false,
        error: 'Notification ID is required',
      };
    }

    // Cancel scheduled notification by setting scheduledFor to null
    const response = await apiPut(`/notifications/${notificationId}/schedule`, {
      scheduledFor: null
    });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Scheduled notification cancelled successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to cancel notification',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while cancelling notification',
    };
  }
};

/**
 * Delete notification (only for draft or failed notifications)
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string, message?: string}>}
 */
export const deleteNotification = async (notificationId) => {
  try {
    if (!notificationId) {
      return {
        success: false,
        error: 'Notification ID is required',
      };
    }

    const response = await apiDelete(`/notifications/${notificationId}`);
    
    if (response.success) {
      return {
        success: true,
        message: response.message || 'Notification deleted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to delete notification',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while deleting notification',
    };
  }
};

/**
 * Get notification statistics
 * @param {object} params - Query parameters (dateFrom, dateTo, status)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getNotificationStatistics = async (params = {}) => {
  try {
    const response = await apiGet('/notifications/admin/statistics', params);
    
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
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        scheduledCount: 0,
        deliveredRate: 0,
        openedRate: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch notification statistics',
      data: {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        scheduledCount: 0,
        deliveredRate: 0,
        openedRate: 0,
      },
    };
  }
};
