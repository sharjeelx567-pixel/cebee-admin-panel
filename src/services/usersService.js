/**
 * Users Service
 * Handles all user-related API calls. Responses normalized to canonical shape for UI (camelCase).
 */

import { apiGet, apiPost, apiPut, apiPatch } from './apiBase';

/**
 * Normalize user details so UI gets { profile, kyc, points, breakdown, activityLog }.
 * Backend may return { profile, kyc }, { user, kyc }, or snake_case.
 */
export const normalizeUserDetailsResponse = (data) => {
  if (!data || typeof data !== 'object') {
    return { profile: {}, kyc: {}, points: {}, breakdown: {}, activityLog: [] };
  }
  const profile = data.profile ?? data.user ?? data;
  const kyc = data.kyc ?? data.user?.kyc ?? profile?.kyc ?? {};
  const points = data.points ?? data.stats?.points ?? {};
  const breakdown = data.breakdown ?? data.points?.breakdown ?? {};
  const activityLog = Array.isArray(data.activityLog) ? data.activityLog : (data.activity_log ?? data.logs ?? []);
  return {
    profile: {
      _id: profile._id ?? profile.id ?? profile.userId,
      userId: profile.userId ?? profile._id ?? profile.id,
      username: profile.username ?? profile.user_name ?? 'N/A',
      email: profile.email ?? profile.email_address ?? 'N/A',
      fullName: profile.fullName ?? profile.full_name ?? profile.name ?? 'N/A',
      country: profile.country ?? null,
      isActive: profile.isActive ?? profile.is_active ?? true,
      isVerified: profile.isVerified ?? profile.is_verified ?? false,
      isBlocked: profile.isBlocked ?? profile.is_blocked ?? false,
      registrationDate: profile.registrationDate ?? profile.registration_date ?? profile.createdAt ?? profile.created_at,
      lastLogin: profile.lastLogin ?? profile.last_login ?? null,
      status: profile.status ?? null,
      fraudFlags: profile.fraudFlags ?? profile.fraud_flags ?? [],
      flagReason: profile.flagReason ?? profile.flag_reason ?? '',
      flagSource: profile.flagSource ?? profile.flag_source ?? null,
      ...profile,
    },
    kyc: {
      status: (kyc.status ?? kyc.kyc_status ?? 'not_submitted').toLowerCase(),
      submittedAt: kyc.submittedAt ?? kyc.submitted_at ?? null,
      verifiedAt: kyc.verifiedAt ?? kyc.verified_at ?? null,
      verifiedBy: kyc.verifiedBy ?? kyc.verified_by ?? null,
      riskLevel: kyc.riskLevel ?? kyc.risk_level ?? 'none',
      internalNotes: kyc.internalNotes ?? kyc.internal_notes ?? kyc.notes ?? '',
      ...kyc,
    },
    points: {
      totalSPEarned: points.totalSPEarned ?? points.total_sp_earned ?? points.totalSP ?? 0,
      currentSPBalance: points.currentSPBalance ?? points.current_sp_balance ?? points.currentSP ?? 0,
      totalCPEarned: points.totalCPEarned ?? points.total_cp_earned ?? 0,
      currentCPBalance: points.currentCPBalance ?? points.current_cp_balance ?? 0,
      totalPredictionsMade: points.totalPredictionsMade ?? points.total_predictions ?? 0,
      totalReferrals: points.totalReferrals ?? points.total_referrals ?? 0,
      predictionAccuracy: points.predictionAccuracy ?? points.prediction_accuracy ?? 0,
      totalPollsParticipated: points.totalPollsParticipated ?? points.total_polls ?? 0,
      ...points,
    },
    breakdown: { sp: breakdown.sp ?? {}, cp: breakdown.cp ?? {}, ...breakdown },
    activityLog: Array.isArray(activityLog) ? activityLog : [],
  };
};

const normalizeUsersListResponse = (data) => {
  const list = Array.isArray(data) ? data : (data?.users ?? data?.data ?? data?.list ?? []);
  return { users: Array.isArray(list) ? list : [], pagination: data?.pagination ?? data?.meta ?? {} };
};

const normalizeUserStatistics = (data) => {
  const s = data?.statistics ?? data ?? {};
  return {
    totalUsers: Number(s.totalUsers ?? s.total_users ?? 0),
    activeUsers: Number(s.activeUsers ?? s.active_users ?? 0),
    verifiedUsers: Number(s.verifiedUsers ?? s.verified_users ?? 0),
    flaggedUsers: Number(s.flaggedUsers ?? s.flagged_users ?? 0),
    blockedUsers: Number(s.blockedUsers ?? s.blocked_users ?? 0),
    deactivatedUsers: Number(s.deactivatedUsers ?? s.deactivated_users ?? 0),
  };
};

/**
 * Get all users. Returns normalized { users, pagination } for the UI.
 */
export const getUsers = async (params = {}) => {
  try {
    const response = await apiGet('/users', params);
    if (response.success) {
      return { success: true, data: normalizeUsersListResponse(response.data) };
    }
    return { success: false, error: response.error, data: { users: [], pagination: {} } };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to fetch users', data: { users: [], pagination: {} } };
  }
};

/**
 * Get user statistics (Admin only). Returns normalized camelCase stats for the UI.
 */
export const getUserStatistics = async () => {
  const empty = { totalUsers: 0, activeUsers: 0, verifiedUsers: 0, flaggedUsers: 0, blockedUsers: 0, deactivatedUsers: 0 };
  try {
    const response = await apiGet('/users/statistics');
    if (response.success) {
      return { success: true, data: normalizeUserStatistics(response.data) };
    }
    return { success: false, error: response.error, data: empty };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to fetch user statistics', data: empty };
  }
};

/**
 * Get user details by ID. Returns normalized { profile, kyc, points, breakdown, activityLog } for the UI.
 */
export const getUserDetails = async (userId, params = {}) => {
  try {
    if (!userId) return { success: false, error: 'User ID is required' };
    const response = await apiGet(`/users/${userId}`, params);
    if (response.success) {
      return { success: true, data: normalizeUserDetailsResponse(response.data) };
    }
    return { success: false, error: response.error };
  } catch (error) {
    return { success: false, error: error.message || 'Failed to fetch user details' };
  }
};

/**
 * Block or unblock user
 * @param {string} userId - User ID
 * @param {boolean} isBlocked - Whether to block or unblock
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const blockUser = async (userId, isBlocked) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPut(`/users/${userId}/block`, { isBlocked });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || (isBlocked ? 'User blocked successfully' : 'User unblocked successfully'),
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update user block status',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating user block status',
    };
  }
};

/**
 * Suspend or unsuspend user (Admin only)
 * @param {string} userId - User ID
 * @param {boolean} isActive - false to suspend, true to unsuspend
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const suspendUser = async (userId, isActive = false) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPut(`/users/${userId}/suspend`, { isActive });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || (isActive ? 'User unsuspended successfully' : 'User suspended successfully'),
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to update user suspend status',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while updating user suspend status',
    };
  }
};

/**
 * Adjust user SP (Admin only)
 * @param {string} userId - User ID
 * @param {number} amount - SP amount
 * @param {string} type - 'add' to add amount, 'set' to set amount
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const adjustUserSP = async (userId, amount, type = 'add') => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    if (type !== 'add' && type !== 'set') {
      return {
        success: false,
        error: 'Type must be either "add" or "set"',
      };
    }

    const response = await apiPut(`/users/${userId}/sp`, { amount, type });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'SP adjusted successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to adjust user SP',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while adjusting user SP',
    };
  }
};

/**
 * Flag user (Admin only)
 * @param {string} userId - User ID
 * @param {string} flagReason - Reason for flagging
 * @param {array} fraudFlags - Array of fraud flag types (optional)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const flagUser = async (userId, flagReason, fraudFlags = []) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    if (!flagReason || flagReason.trim() === '') {
      return {
        success: false,
        error: 'Flag reason is required',
      };
    }

    const response = await apiPost(`/users/${userId}/flag`, { flagReason, fraudFlags });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'User flagged successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to flag user',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while flagging user',
    };
  }
};

/**
 * Request KYC verification for user (Admin only)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const requestKYC = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPost(`/users/${userId}/kyc/request`);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'KYC request created successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to request KYC',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while requesting KYC',
    };
  }
};

/**
 * Verify user KYC (Admin only)
 * @param {string} userId - User ID
 * @param {string} riskLevel - Risk level (none, low, medium, high)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const verifyKYC = async (userId, riskLevel = 'none') => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPut(`/users/${userId}/kyc/verify`, { riskLevel });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'KYC verified successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to verify KYC',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while verifying KYC',
    };
  }
};

/**
 * Reject user KYC (Admin only)
 * @param {string} userId - User ID
 * @param {string} reason - Reason for rejection (optional)
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const rejectKYC = async (userId, reason = '') => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPut(`/users/${userId}/kyc/reject`, { reason });
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'KYC rejected successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to reject KYC',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while rejecting KYC',
    };
  }
};

/**
 * Expire user KYC (Admin only)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const expireKYC = async (userId) => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPut(`/users/${userId}/kyc/expire`);
    
    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'KYC marked as expired successfully',
      };
    }
    
    return {
      success: false,
      error: response.error || 'Failed to expire KYC',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while expiring KYC',
    };
  }
};

/**
 * Update KYC internal notes (Admin only)
 * Backend expected: PUT or PATCH /api/users/:userId/kyc/notes with body { internalNotes: string }
 * @param {string} userId - User ID
 * @param {string} internalNotes - Admin-only internal notes
 * @returns {Promise<{success: boolean, data?: object, error?: string, message?: string}>}
 */
export const updateKycNotes = async (userId, internalNotes = '') => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required',
      };
    }

    const response = await apiPut(`/users/${userId}/kyc/notes`, { internalNotes: String(internalNotes ?? '') });

    if (response.success) {
      return {
        success: true,
        data: response.data,
        message: response.message || 'Notes saved successfully',
      };
    }

    return {
      success: false,
      error: response.error || 'Failed to save notes',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'An unexpected error occurred while saving notes',
    };
  }
};
