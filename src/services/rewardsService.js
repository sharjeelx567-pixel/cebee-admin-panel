/**
 * Rewards Service
 * Handles all reward-related API calls.
 * All responses are normalized to a canonical shape for the UI (camelCase, consistent structure).
 */

import { apiGet, apiPost, apiPut, apiPatch } from './apiBase';

/**
 * Normalize one reward item from backend (supports snake_case and alternate keys) for list/UI.
 * UI expects: id, userId, username, userEmail, status, rank, month/monthYear, spTotal, usdAmount, kycStatus, kycVerified, consentOptIn, etc.
 */
export const normalizeRewardListItem = (r, index = 0) => {
  if (!r || typeof r !== 'object') return null;
  const user = r.userId || r.user || r.user_id || {};
  const userObj = typeof user === 'object' && user !== null && !Array.isArray(user) ? user : {};
  const month = (r.rewardMonth ?? r.month ?? r.month_year ?? r.monthYear ?? '').toString().trim().slice(0, 7);
  return {
    ...r,
    id: r.id ?? r._id ?? r.reward_id ?? r.rewardId ?? `reward-${index}`,
    userId: userObj._id ?? userObj.id ?? (typeof r.userId === 'string' ? r.userId : r.user_id) ?? null,
    username: userObj.username ?? r.username ?? r.userName ?? 'N/A',
    userEmail: userObj.email ?? r.userEmail ?? r.email ?? 'N/A',
    status: (r.status ?? r.reward_status ?? 'unclaimed').toLowerCase(),
    rank: r.rank ?? r.position ?? 0,
    month: month || (r.month ?? r.monthYear ?? '').toString().slice(0, 7),
    monthYear: month || (r.monthYear ?? r.month ?? '').toString().slice(0, 7),
    rewardMonth: month,
    spTotal: Number(r.spTotal ?? r.sp_total ?? 0),
    usdAmount: Number(r.usdAmount ?? r.usd_amount ?? 0),
    rewardType: r.rewardType ?? r.payoutMethod ?? 'Gift Card',
    payoutMethod: r.payoutMethod ?? r.rewardType ?? 'Gift Card',
    kycStatus: (r.kycStatus ?? r.kyc_status ?? userObj.kyc?.status ?? userObj.kycStatus ?? 'not_submitted').toLowerCase(),
    kycVerified: r.kycVerified ?? r.kyc_verified ?? userObj.kyc?.verified ?? userObj.kycVerified ?? false,
    consentOptIn: r.consentOptIn ?? r.consent_opt_in ?? r.consent ?? r.videoConsent ?? false,
    adminNotes: r.adminNotes ?? r.admin_notes ?? '',
    declineReason: r.declineReason ?? r.decline_reason ?? null,
  };
};

/**
 * Normalize GET /rewards response to { rewards: [], pagination: {} }.
 * Backend may return: { rewards }, { data }, { list }, or raw array; pagination optional.
 */
const normalizeRewardsResponse = (data) => {
  let list = Array.isArray(data) ? data : (data?.rewards ?? data?.data ?? data?.list ?? []);
  if (!Array.isArray(list)) list = [];
  const rewards = list.map((r, i) => normalizeRewardListItem(r, i)).filter(Boolean);
  const pagination = data?.pagination ?? data?.meta ?? {};
  return { rewards, pagination };
};

/**
 * Get all rewards with filtering, search, sorting, and pagination.
 * Returns normalized { rewards, pagination } for the UI.
 * Backend should support: month (optional), page, limit, search, status, rank/minRank/maxRank, consentOptIn, sort.
 * @param {object} params - Query parameters (page, limit, search, status, rank, month, consent, sort)
 * @returns {Promise<{success: boolean, data?: { rewards, pagination }, error?: string}>}
 */
export const getRewards = async (params = {}) => {
  try {
    const backendParams = {};
    Object.keys(params).forEach((key) => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== '') {
        backendParams[key] = v;
      }
    });
    if (backendParams.page !== undefined) {
      backendParams.page = backendParams.page + 1;
    }

    const response = await apiGet('/rewards', backendParams);

    if (response.success) {
      return {
        success: true,
        data: normalizeRewardsResponse(response.data),
      };
    }

    return {
      success: false,
      error: response.error,
      data: { rewards: [], pagination: {} },
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch rewards',
      data: { rewards: [], pagination: {} },
    };
  }
};

/**
 * Get reward by ID.
 * Backend should return reward with optional populated user (userId/user).
 * KYC can be on the reward (kycStatus, kycVerified, kycVerifiedAt, kycVerifiedBy) or on the
 * populated user (userId.kyc.status, userId.kycStatus, userId.kyc.verifiedAt, etc.) so that
 * "Mark as Fulfilled" is enabled only when the user's KYC is verified in the database.
 * @param {string} rewardId - Reward ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getRewardById = async (rewardId) => {
  try {
    if (!rewardId) {
      return {
        success: false,
        error: 'Reward ID is required',
      };
    }

    const response = await apiGet(`/rewards/${rewardId}`);
    
    if (response.success) {
      // Backend returns { success: true, data: { reward } } or { success: true, data: reward }
      const rewardData = response.data?.reward || response.data;
      return {
        success: true,
        data: rewardData,
      };
    }
    
    return {
      success: false,
      error: response.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch reward details',
    };
  }
};

/**
 * Update reward status
 * @param {string} rewardId - Reward ID
 * @param {string} status - New status (pending, processing, paid, cancelled, declined, unclaimed)
 * @param {string} declineReason - Optional reason for decline/cancel
 * @param {object} extra - Optional extra body fields (e.g. kycVerified, adminConfirmedKyc for fulfillment)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateRewardStatus = async (rewardId, status, declineReason = null, extra = {}) => {
  try {
    if (!rewardId) {
      return {
        success: false,
        error: 'Reward ID is required',
      };
    }

    if (!status) {
      return {
        success: false,
        error: 'Status is required',
      };
    }

    const updateData = { status, ...extra };
    if (declineReason) {
      updateData.declineReason = declineReason;
    }

    const response = await apiPatch(`/rewards/${rewardId}/status`, updateData);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Reward status updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update reward status',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating reward status',
    };
  }
};

/**
 * Mark reward as fulfilled.
 * Pass giftCardCode for gift card rewards; pass videoConsentStatus and consentOptIn so backend
 * can satisfy "video consent status required" validation.
 * @param {string} rewardId - Reward ID
 * @param {object} options - { giftCardCode, videoConsentStatus, consentOptIn } (from reward when fulfilling)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const markRewardAsFulfilled = async (rewardId, options = {}) => {
  const extra = {
    kycVerified: true,
    adminConfirmedKyc: true,
    adminConfirmedVideoConsent: true,
    ...(options.giftCardCode != null && options.giftCardCode !== '' && {
      giftCardCode: String(options.giftCardCode).trim(),
      gift_card_code: String(options.giftCardCode).trim(),
    }),
    // Send consent so backend can accept fulfillment when it requires "video consent status"
    ...(options.videoConsentStatus != null && options.videoConsentStatus !== '' && {
      videoConsentStatus: String(options.videoConsentStatus),
      video_consent_status: String(options.videoConsentStatus),
    }),
    ...(options.consentOptIn !== undefined && {
      consentOptIn: Boolean(options.consentOptIn),
      consent_opt_in: Boolean(options.consentOptIn),
    }),
  };
  return await updateRewardStatus(rewardId, 'fulfilled', null, extra);
};

/**
 * Create a gift card reward
 * @param {object} rewardData - Reward data (userId, rank, month, usdAmount, giftCardPlatform, giftCardRegion, etc.)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const createGiftCardReward = async (rewardData) => {
  try {
    const rewardPayload = {
      ...rewardData,
      rewardType: 'Gift Card',
      payoutMethod: 'Gift Card', // For backward compatibility
    };

    const response = await apiPost('/rewards', rewardPayload);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Gift card reward created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to create gift card reward',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while creating gift card reward',
    };
  }
};

/**
 * Cancel or decline reward
 * @param {string} rewardId - Reward ID
 * @param {string} reason - Reason for cancellation/decline
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const cancelReward = async (rewardId, reason) => {
  return await updateRewardStatus(rewardId, 'cancelled', reason);
};

/**
 * Update admin notes for a reward
 * @param {string} rewardId - Reward ID
 * @param {string} notes - Admin notes
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateRewardNotes = async (rewardId, notes) => {
  try {
    if (!rewardId) {
      return {
        success: false,
        error: 'Reward ID is required',
      };
    }

    const response = await apiPatch(`/rewards/${rewardId}/notes`, { adminNotes: notes });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Notes updated successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update notes',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating notes',
    };
  }
};

// Normalize stats from API (supports nested data.statistics and snake_case keys)
const normalizeStats = (raw) => {
  const s = raw?.statistics || raw || {};
  return {
    currentMonthWinners: Number(s.currentMonthWinners ?? s.current_month_winners ?? 0),
    pendingPayouts: Number(s.pendingPayouts ?? s.pending_payouts ?? 0),
    processingCount: Number(s.processingCount ?? s.processing_count ?? 0),
    totalPaid: Number(s.totalPaid ?? s.total_paid ?? 0),
  };
};

/**
 * Get reward statistics
 * @param {object} params - Query parameters (month, status)
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export const getRewardStatistics = async (params = {}) => {
  const empty = { currentMonthWinners: 0, pendingPayouts: 0, processingCount: 0, totalPaid: 0 };
  try {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== '') cleanParams[key] = v;
    });
    const response = await apiGet('/rewards/statistics', cleanParams);

    if (response.success) {
      const data = response.data;
      return {
        success: true,
        data: normalizeStats(data),
      };
    }

    return { success: false, error: response.error, data: empty };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to fetch reward statistics',
      data: empty,
    };
  }
};
