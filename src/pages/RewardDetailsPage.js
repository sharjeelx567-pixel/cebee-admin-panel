import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Card,
    Grid,
    Chip,
    IconButton,
    TextField,
    Dialog,
    DialogContent,
    DialogActions,
    Divider,
    CircularProgress,
    CardContent,
    Tooltip,
} from '@mui/material';
import {
    ArrowBack,
    Person,
    CheckCircle,
    Cancel,
    Timeline,
    EmojiEvents,
    AccountBalanceWallet,
    VerifiedUser,
    Warning,
    Info,
    CalendarToday,
    AssignmentInd,
    ContentCopy,
    Email,
    LocationOn,
    Shield,
    CreditCard,
    Visibility,
    PersonOutline,
    CardGiftcard,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import { format } from 'date-fns';
import { getRewardById, updateRewardStatus, updateRewardNotes, markRewardAsFulfilled, cancelReward } from '../services/rewardsService';
import { getUserDetails } from '../services/usersService';

const RewardDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    // Initial state matching the mock data structure
    const [reward, setReward] = useState(null);
    const [loading, setLoading] = useState(true);

    const [notes, setNotes] = useState('');
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [confirmPaidDialogOpen, setConfirmPaidDialogOpen] = useState(false);
    const [fulfillGiftCardCode, setFulfillGiftCardCode] = useState('');

    useEffect(() => {
        loadReward();
    }, [id]);

    // Helper function to safely parse dates
    const parseDate = (dateString) => {
        if (!dateString) return null;
        try {
            const parsed = new Date(dateString);
            return isNaN(parsed.getTime()) ? null : parsed;
        } catch (e) {
            return null;
        }
    };

    // Helper function to safely format dates
    const safeFormat = (date, formatString, fallback = '-') => {
        if (!date) return fallback;
        try {
            const dateObj = date instanceof Date ? date : new Date(date);
            if (isNaN(dateObj.getTime())) return fallback;
            return format(dateObj, formatString);
        } catch (e) {
            return fallback;
        }
    };

    const loadReward = async () => {
        setLoading(true);
        try {
            // Get ID from params, handle different formats
            const rewardId = id || (typeof id === 'string' ? id.trim() : null);
            
            if (!rewardId || rewardId === 'undefined' || rewardId === 'null') {
                console.error('Reward ID is missing or invalid:', id);
                setReward({
                    id: null,
                    username: 'N/A',
                    userEmail: 'N/A',
                    status: 'error',
                    errorMessage: 'Reward ID is missing or invalid',
                });
                setLoading(false);
                return;
            }

            const response = await getRewardById(rewardId);
            
            // Strictly use API data - no mock fallback
            if (!response.success || !response.data) {
                console.error('API call failed:', response.error);
                setReward({
                    id: id,
                    username: 'N/A',
                    userEmail: 'N/A',
                    status: 'error',
                    errorMessage: response.error || 'Failed to load reward from API'
                });
                setLoading(false);
                return;
            }
            
            if (response.success && response.data) {
                // Backend returns { success: true, data: { reward } }
                // The service already extracts the reward, so response.data is the reward object
                const data = response.data;
                
                // Map backend API response to frontend format (all from database/API)
                // Backend may return reward with populated userId (user object); KYC can be on reward or on user
                const rawUser = data.userId || data.user;
                const user = (rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)) ? rawUser : {};
                const userKyc = user.kyc || {};
                const kycOnReward = {
                    status: data.kycStatus ?? data.kyc_status ?? user.kycStatus ?? userKyc.status ?? 'not_submitted',
                    verified: data.kycVerified ?? data.kyc_verified ?? user.kycVerified ?? userKyc.verified ?? false,
                    verifiedAt: parseDate(data.kycVerifiedAt ?? data.kyc_verified_at ?? user.kycVerifiedAt ?? userKyc.verifiedAt),
                    verifiedBy: data.kycVerifiedBy ?? data.kyc_verified_by ?? user.kycVerifiedBy ?? userKyc.verifiedBy ?? null,
                    submittedAt: parseDate(data.kycSubmittedAt ?? data.kyc_submitted_at ?? user.kycSubmittedAt ?? userKyc.submittedAt),
                };
                // Normalize kycStatus: backend may send 'verified' or true for kycVerified
                const kycStatusNormalized = (kycOnReward.verified === true || (typeof kycOnReward.status === 'string' && kycOnReward.status.toLowerCase() === 'verified'))
                    ? 'verified'
                    : (typeof kycOnReward.status === 'string' ? kycOnReward.status.toLowerCase() : 'not_submitted');

                const rewardData = {
                    // Core fields (from database)
                    id: data._id || data.id || id,
                    userId: user._id || user.id || data.userId || data.user_id || null,
                    rank: data.rank ?? data.rank_achieved ?? 0,
                    // User data from populated userId/user
                    username: user.username || data.username || 'N/A',
                    userEmail: user.email || data.userEmail || data.email || 'N/A',
                    userFullName: user.fullName || data.userFullName || null,
                    spTotal: data.spTotal ?? data.sp_total ?? 0,
                    usdAmount: data.usdAmount ?? data.usd_amount ?? 0,
                    rewardType: data.rewardType || data.payoutMethod || 'Gift Card',
                    payoutMethod: data.payoutMethod || data.rewardType || 'Gift Card',
                    status: data.status || 'unclaimed',
                    rewardMonth: (data.rewardMonth || data.month || data.month_year || data.monthYear || '').toString().trim() || '',
                    
                    // KYC fields (from reward or populated user - database)
                    kycStatus: kycStatusNormalized,
                    kycVerified: kycOnReward.verified === true || kycStatusNormalized === 'verified',
                    kycVerifiedAt: kycOnReward.verifiedAt,
                    kycVerifiedBy: kycOnReward.verifiedBy,
                    kycSubmittedAt: kycOnReward.submittedAt,
                    
                    // Risk fields
                    risk: data.risk || false,
                    riskLevel: data.riskLevel || 'none',
                    riskBadges: data.riskBadges || [],
                    riskReason: data.riskReason || null,
                    
                    // Claim fields (from API, support snake_case)
                    claimDeadline: parseDate(data.claimDeadline ?? data.claim_deadline),
                    claimSubmittedAt: parseDate(data.claimSubmittedAt ?? data.claim_submitted_at),
                    
                    // Consent fields (from API)
                    consentOptIn: data.consentOptIn ?? data.consent_opt_in ?? false,
                    consentTimestamp: parseDate(data.consentTimestamp ?? data.consent_timestamp),
                    consentSource: data.consentSource ?? data.consent_source ?? null,
                    
                    // Gift Card fields (from API)
                    giftCardPlatform: data.giftCardPlatform ?? data.gift_card_platform ?? null,
                    giftCardRegion: data.giftCardRegion ?? data.gift_card_region ?? null,
                    giftCardCode: data.giftCardCode ?? data.gift_card_code ?? null,
                    
                    // Alternative Reward fields
                    alternativeRewardType: data.alternativeRewardType || null,
                    alternativeApproved: data.alternativeApproved || false,
                    alternativeReason: data.alternativeReason || null,
                    
                    // Proof & Consent fields
                    screenshot: data.screenshot || null,
                    videoConsentStatus: data.videoConsentStatus || null,
                    
                    // Processing fields (from database)
                    processedAt: parseDate(data.processedAt ?? data.processed_at),
                    
                    // Fulfillment fields (from database)
                    fulfillmentStatus: data.fulfillmentStatus ?? data.fulfillment_status ?? (
                        (data.status === 'fulfilled' || data.status === 'paid') ? 'Fulfilled' :
                        (data.status === 'cancelled' || data.status === 'declined') ? 'Cancelled' : 'Pending'
                    ),
                    fulfilledAt: parseDate(data.fulfilledAt ?? data.fulfilled_at ?? data.processedAt ?? data.processed_at),
                    fulfilledBy: data.fulfilledBy ?? data.fulfilled_by ?? data.processedBy ?? data.processed_by ?? kycOnReward.verifiedBy ?? null,
                    
                    // User profile data (from populated userId/user)
                    userCountry: user.country || data.userCountry || null,
                    accountStatus: user.isBlocked ? 'Blocked' : (user.isActive !== false ? 'Active' : 'Inactive'),
                    registrationDate: parseDate(user.createdAt ?? user.created_at),
                    lastLoginDate: parseDate(user.lastLogin ?? user.last_login),
                    
                    // Events / Activity timeline (from API, support snake_case)
                    events: (data.events ?? data.activity_log ?? data.audit_log ?? []).map((e, i) => ({
                        id: e.id ?? e._id ?? i,
                        action: e.action ?? e.event ?? e.type ?? 'Unknown',
                        timestamp: parseDate(e.timestamp ?? e.created_at ?? e.date) || new Date(),
                        triggeredBy: e.triggeredBy ?? e.triggered_by ?? e.actor ?? e.user ?? 'System'
                    })),
                    
                    // Admin fields (from API)
                    adminNotes: data.adminNotes ?? data.admin_notes ?? '',
                    declineReason: data.declineReason ?? data.decline_reason ?? null,
                    
                    // Lock status
                    isLocked: data.isLocked || false,
                };

                // If KYC not verified from reward/populated user, fetch user details (source of truth for KYC)
                const userIdStr = typeof rewardData.userId === 'string' ? rewardData.userId : (rewardData.userId?._id || rewardData.userId?.id || null);
                if (rewardData.kycStatus !== 'verified' && userIdStr) {
                    try {
                        const userRes = await getUserDetails(userIdStr);
                        if (userRes.success && userRes.data) {
                            const d = userRes.data;
                            const kyc = d.kyc || d.profile?.kyc || d.user?.kyc || {};
                            const userKycStatus = (kyc.status || '').toLowerCase();
                            const userKycVerified = userKycStatus === 'verified' || kyc.verified === true;
                            if (userKycVerified) {
                                rewardData.kycStatus = 'verified';
                                rewardData.kycVerified = true;
                                rewardData.kycVerifiedAt = rewardData.kycVerifiedAt || parseDate(kyc.verifiedAt);
                                rewardData.kycVerifiedBy = rewardData.kycVerifiedBy || kyc.verifiedBy || null;
                                rewardData.kycSubmittedAt = rewardData.kycSubmittedAt || parseDate(kyc.submittedAt);
                            }
                        }
                    } catch (e) {
                        console.warn('Could not fetch user KYC for reward:', e);
                    }
                }

                setReward(rewardData);
                setNotes(rewardData.adminNotes || '');
            } else {
                const errorMsg = response.error || 'Unknown error';
                console.error("Failed to load reward:", errorMsg);
                
                setReward({
                    id: id,
                    username: 'N/A',
                    userEmail: 'N/A',
                    status: 'error',
                    errorMessage: errorMsg,
                });
            }
        } catch (error) {
            console.error("Failed to load reward:", error);
            // Set a minimal reward object so the page can still display
            setReward({
                id: id,
                username: 'N/A',
                userEmail: 'N/A',
                status: 'error',
                errorMessage: error.message || 'Failed to load reward details',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!declineReason || declineReason.trim() === '') {
            alert('Please provide a reason for declining the reward');
            return;
        }

        try {
            const response = await cancelReward(id, declineReason);
            
            if (response.success) {
                await loadReward();
                setDeclineDialogOpen(false);
                setDeclineReason('');
            } else {
                alert(`Failed to decline reward: ${response.error}`);
            }
        } catch (error) {
            console.error("Failed to decline reward", error);
            alert(`Failed to decline reward: ${error.message}`);
        }
    };

    const handleMarkFulfilled = async () => {
        const isGiftCard = reward?.rewardType === 'Gift Card' || reward?.payoutMethod === 'Gift Card';
        if (isGiftCard && (!fulfillGiftCardCode || !String(fulfillGiftCardCode).trim())) {
            alert('Gift Card Code is required for gift card rewards. Please enter the code.');
            return;
        }
        try {
            const response = await markRewardAsFulfilled(id, {
                ...(isGiftCard && { giftCardCode: String(fulfillGiftCardCode).trim() }),
                videoConsentStatus: reward?.videoConsentStatus ?? (reward?.consentOptIn ? 'granted' : 'not_granted'),
                consentOptIn: reward?.consentOptIn ?? false,
            });
            if (response.success) {
                await loadReward();
                setConfirmPaidDialogOpen(false);
                setFulfillGiftCardCode('');
            } else {
                setConfirmPaidDialogOpen(false);
                alert(`Failed to mark reward as fulfilled: ${response.error}`);
            }
        } catch (error) {
            setConfirmPaidDialogOpen(false);
            console.error("Failed to mark reward as fulfilled", error);
            alert(`Failed to mark reward as fulfilled: ${error.message}`);
        }
    };

    const handleSaveNotes = async () => {
        try {
            const response = await updateRewardNotes(id, notes);
            
            if (response.success) {
                // Reload reward to get updated data from backend
                await loadReward();
                alert('Notes saved successfully');
            } else {
                alert(`Failed to save notes: ${response.error}`);
            }
        } catch (error) {
            console.error("Failed to save notes", error);
            alert(`Failed to save notes: ${error.message}`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return colors.warning;
            case 'processing': return colors.info;
            case 'fulfilled': return colors.success;
            case 'paid': return colors.success; // Backward compatibility
            case 'cancelled':
            case 'declined': return colors.error;
            case 'unclaimed': return colors.textSecondary;
            default: return colors.primary;
        }
    };

    const getStatusBg = (status) => {
        switch (status) {
            case 'pending': return '#FFF7ED';
            case 'processing': return '#EBF8FF';
            case 'fulfilled': return '#F0FDF4';
            case 'paid': return '#F0FDF4'; // Backward compatibility
            case 'cancelled':
            case 'declined': return '#FEF2F2';
            case 'unclaimed': return '#F3F4F6';
            default: return '#EBF8FF';
        }
    };

    const getKycStatusChip = (status) => {
        const normalized = (status || '').toLowerCase().replace(/\s/g, '_');
        const configs = {
            'not_submitted': { label: 'Not Submitted', color: 'default' },
            'pending': { label: 'Pending', color: 'warning' },
            'under_review': { label: 'Under Review', color: 'warning' },
            'verified': { label: 'Verified', color: 'success' },
            'rejected': { label: 'Rejected', color: 'error' },
            'expired': { label: 'Expired', color: 'default' },
        };
        const config = configs[normalized] || configs[status] || configs['not_submitted'];
        return <Chip label={config.label} size="small" color={config.color} sx={{ fontWeight: 700 }} />;
    };

    const getRiskBadgeColor = (badge) => {
        const colors = {
            'Duplicate Identity': '#DC2626',
            'Suspicious Activity': '#EA580C',
            'Document Mismatch': '#CA8A04',
        };
        return colors[badge] || '#6B7280';
    };

    if (loading) {
        return <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
    }

    if (!reward || reward.status === 'error') {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ mb: 2, color: colors.error }}>
                    {reward?.status === 'error' ? 'Failed to load reward details' : 'Reward not found'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: colors.textSecondary }}>
                    {reward?.status === 'error' 
                        ? 'There was an error loading the reward details. Please try again or contact support.'
                        : `Reward with ID "${id}" was not found.`}
                </Typography>
                {reward?.errorMessage && (
                    <Typography variant="caption" sx={{ mb: 3, color: colors.textSecondary, display: 'block', fontFamily: 'monospace', fontSize: '12px' }}>
                        Error: {reward.errorMessage}
                    </Typography>
                )}
                <Typography variant="caption" sx={{ mb: 3, color: colors.textSecondary, display: 'block' }}>
                    Please check the browser console for more details.
                </Typography>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate(constants.routes.rewards)} 
                    variant="contained"
                    sx={{ 
                        mt: 2,
                        bgcolor: colors.brandRed,
                        '&:hover': { bgcolor: colors.brandDarkRed }
                    }}
                >
                    Back to Rewards
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', pb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
                <Button 
                    startIcon={<ArrowBack />} 
                    onClick={() => navigate(constants.routes.rewards)} 
                    sx={{ 
                        mb: 2, 
                        color: colors.brandRed,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                            backgroundColor: `${colors.brandRed}0A`,
                        },
                    }}
                >
                    Back to Rewards
                </Button>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                        <EmojiEvents sx={{ fontSize: 32, color: colors.brandRed }} />
                        Reward Details
                    </Typography>
                    <Typography variant="body1" sx={{ color: colors.textSecondary }}>
                        Complete information about reward #{reward.id}
                    </Typography>
                </Box>
            </Box>

            {/* Risk Warning Banner */}
            {(reward.risk || (reward.riskBadges && reward.riskBadges.length > 0)) && (
                <Box sx={{
                    mb: 3,
                    p: 3,
                    borderRadius: '16px',
                    backgroundColor: '#FEF2F2',
                    border: '2px solid #EF4444',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 2
                }}>
                    <Box sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#EF4444',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <Warning sx={{ fontSize: 28, color: 'white' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#DC2626', mb: 0.5 }}>
                            Risk Indicator - Review Required
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#7F1D1D', mb: 1.5 }}>
                            This reward has been flagged for potential risk. Please review the user's activity, KYC verification, and betting patterns before processing payment.
                        </Typography>
                        {reward.riskBadges && reward.riskBadges.length > 0 && (
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {reward.riskBadges.map((badge, idx) => (
                                    <Chip
                                        key={idx}
                                        label={badge}
                                        size="small"
                                        sx={{
                                            bgcolor: getRiskBadgeColor(badge),
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: 11
                                        }}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                </Box>
            )}

            <Grid container spacing={3}>
                {/* Left Column */}
                <Grid item xs={12} md={8}>
                    {/* 1. Reward Overview */}
                    <Card sx={{ mb: 3, borderRadius: '16px', overflow: 'hidden' }}>
                        <Box sx={{ 
                            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEvents />
                                Reward Overview
                            </Typography>
                            <Chip 
                                label="READ-ONLY" 
                                size="small" 
                                sx={{ 
                                    bgcolor: 'rgba(255,255,255,0.2)', 
                                    color: 'white',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.3)'
                                }} 
                            />
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Reward ID</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{reward.id}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Reward Month</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                                        {reward.rewardMonth
                                            ? (/^\d{4}-\d{2}$/.test(reward.rewardMonth)
                                                ? format(new Date(reward.rewardMonth + '-01'), 'MMMM yyyy')
                                                : reward.rewardMonth)
                                            : '-'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Reward Type</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>{reward.rewardType}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Rank Achieved</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Chip 
                                            label={`#${reward.rank}`}
                                            sx={{
                                                bgcolor: reward.rank === 1 ? '#FFD700' : reward.rank === 2 ? '#C0C0C0' : reward.rank === 3 ? '#CD7F32' : colors.primary + '20',
                                                color: reward.rank <= 3 ? '#000' : colors.primary,
                                                fontWeight: 700,
                                                fontSize: '16px',
                                                height: 36,
                                            }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Total Monthly SP</Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandRed, mt: 0.5 }}>{(reward.spTotal || 0).toLocaleString()}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Reward Amount (USD)</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success, mt: 0.5 }}>${reward.usdAmount || 0}</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Reward Status</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            label={(reward.status || 'pending').toUpperCase()}
                                            sx={{
                                                fontWeight: 700,
                                                backgroundColor: getStatusBg(reward.status || 'pending'),
                                                color: getStatusColor(reward.status || 'pending'),
                                                fontSize: '13px',
                                                height: 32,
                                            }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* 2. User Snapshot */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonOutline />
                                User Snapshot
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => navigate(`${constants.routes.users}/${reward.userId}`)}
                                sx={{ 
                                    borderRadius: '8px', 
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                View Full Profile
                            </Button>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Username</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                                        <Box sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Person sx={{ color: 'white', fontSize: 20 }} />
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 700 }}>{reward.username}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Email (Read-Only)</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        <Email sx={{ fontSize: 18, color: colors.textSecondary }} />
                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>{reward.userEmail}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>User ID</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{reward.userId}</Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Country</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                        <LocationOn sx={{ fontSize: 18, color: colors.textSecondary }} />
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{reward.userCountry}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Account Status</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            label={reward.accountStatus}
                                            size="small"
                                            color={reward.accountStatus === 'Active' ? 'success' : reward.accountStatus === 'Suspended' ? 'warning' : 'default'}
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Registration Date</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                        {safeFormat(reward.registrationDate, 'MMM dd, yyyy')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Last Login Date</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                                        {safeFormat(reward.lastLoginDate, 'MMM dd, yyyy')}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* 3. Claim Summary */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday />
                                Claim Summary
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Claim Status</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip
                                            label={reward.claimSubmittedAt ? 'Claimed' : (reward.claimDeadline && new Date() > reward.claimDeadline ? 'Expired' : 'Not Claimed')}
                                            size="small"
                                            color={reward.claimSubmittedAt ? 'success' : (reward.claimDeadline && new Date() > reward.claimDeadline ? 'error' : 'warning')}
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Claim Submitted At</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                        {safeFormat(reward.claimSubmittedAt, 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Claim Deadline</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, color: reward.claimDeadline && new Date() > reward.claimDeadline ? colors.error : colors.brandBlack }}>
                                        {safeFormat(reward.claimDeadline, 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Claim Window</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>7 Days</Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Claim Source</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>Reward Claim Flow</Typography>
                                </Grid>
                                {reward.claimDeadline && new Date() > reward.claimDeadline && !reward.claimSubmittedAt && (
                                    <Grid item xs={12}>
                                        <Box sx={{ 
                                            p: 2, 
                                            borderRadius: '8px', 
                                            bgcolor: '#FEF2F2',
                                            border: '1px solid #FCA5A5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5
                                        }}>
                                            <Info sx={{ color: colors.error, fontSize: 20 }} />
                                            <Typography variant="body2" sx={{ color: '#991B1B', fontWeight: 500 }}>
                                                Claim deadline expired. This reward is automatically locked.
                                            </Typography>
                                        </Box>
                                    </Grid>
                                )}
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* 4. KYC Snapshot */}
                    <Card sx={{ mb: 3, borderRadius: '16px', backgroundColor: '#F8FAFC', border: `2px solid ${reward.kycStatus === 'verified' ? colors.success : '#E5E7EB'}` }}>
                        <Box sx={{ 
                            bgcolor: reward.kycStatus === 'verified' ? colors.success + '10' : '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <VerifiedUser sx={{ color: reward.kycStatus === 'verified' ? colors.success : colors.textSecondary }} />
                                KYC Snapshot
                            </Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Visibility />}
                                onClick={() => navigate(`${constants.routes.users}/${reward.userId}`)}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                            >
                                View KYC Profile
                            </Button>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>KYC Status</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        {getKycStatusChip(reward.kycStatus)}
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Verified At</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                        {safeFormat(reward.kycVerifiedAt, 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={4}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Verified By</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{reward.kycVerifiedBy || '-'}</Typography>
                                </Grid>
                            </Grid>
                            
                            <Divider sx={{ my: 3 }} />
                            
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2, color: colors.brandBlack }}>
                                Risk Assessment
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Risk Level</Typography>
                                    <Box sx={{ mt: 0.5 }}>
                                        <Chip 
                                            label={(reward.riskLevel || 'none').toUpperCase()} 
                                            size="small" 
                                            color={(reward.riskLevel || 'none') === 'high' ? 'error' : (reward.riskLevel || 'none') === 'medium' ? 'warning' : 'success'}
                                            sx={{ fontWeight: 700 }}
                                        />
                                    </Box>
                                </Grid>
                                {reward.riskBadges && reward.riskBadges.length > 0 && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Risk Badges</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                                            {reward.riskBadges.map((badge, idx) => (
                                                <Chip
                                                    key={idx}
                                                    icon={<Warning sx={{ fontSize: 16 }} />}
                                                    label={badge}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: getRiskBadgeColor(badge) + '20',
                                                        color: getRiskBadgeColor(badge),
                                                        fontWeight: 700,
                                                        border: `1px solid ${getRiskBadgeColor(badge)}40`
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Grid>
                                )}
                                {reward.riskReason && (
                                    <Grid item xs={12}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Risk Reason</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 500 }}>{reward.riskReason}</Typography>
                                    </Grid>
                                )}
                            </Grid>
                            
                            {reward.kycStatus !== 'verified' && (
                                <Box sx={{ 
                                    mt: 3,
                                    p: 2, 
                                    borderRadius: '8px', 
                                    bgcolor: '#FEF3C7',
                                    border: '1px solid #FCD34D',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5
                                }}>
                                    <Warning sx={{ color: '#92400E', fontSize: 20 }} />
                                    <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 600 }}>
                                        Reward cannot be fulfilled unless KYC = Verified
                                    </Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>

                    {/* 5. Reward Type & Fulfillment */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EmojiEvents />
                                Reward Type & Fulfillment
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            {/* A. User-Selected Payout Method */}
                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                                        A. User-Selected Reward Type (Request)
                                    </Typography>
                                    <Chip 
                                        label="READ-ONLY" 
                                        size="small" 
                                        sx={{ 
                                            bgcolor: '#E5E7EB', 
                                            color: colors.textSecondary,
                                            fontWeight: 700,
                                            fontSize: 10,
                                            height: 20
                                        }} 
                                    />
                                </Box>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Selected Method</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                icon={<CardGiftcard sx={{ fontSize: 16 }} />}
                                                label={reward.rewardType || reward.payoutMethod || 'Gift Card'}
                                                sx={{
                                                    bgcolor: '#FCE7F3',
                                                    color: '#9F1239',
                                                    fontWeight: 700,
                                                    fontSize: '13px',
                                                    height: 32,
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Captured During</Typography>
                                        <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>Reward Claim Submission</Typography>
                                    </Grid>
                                </Grid>
                                <Box sx={{ 
                                    mt: 2,
                                    p: 1.5, 
                                    borderRadius: '8px', 
                                    bgcolor: '#F0F9FF',
                                    border: '1px solid #BAE6FD',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <Info sx={{ color: '#0369A1', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: '#0C4A6E', fontWeight: 500 }}>
                                        This method cannot be changed after claim submission
                                    </Typography>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            {/* B. Admin Fulfillment Method */}
                            <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 2 }}>
                                    B. Admin Fulfillment Method
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Fulfillment Method</Typography>
                                        <Box sx={{ mt: 0.5 }}>
                                            <Chip
                                                label={reward.fulfillmentMethod || (reward.rewardType === 'Alternative Reward' ? 'Manual Alternative Reward Fulfillment' : 'Manual Gift Card Fulfillment')}
                                                sx={{
                                                    bgcolor: '#FEF3C7',
                                                    color: '#78350F',
                                                    fontWeight: 700,
                                                    fontSize: '13px',
                                                    height: 32,
                                                }}
                                            />
                                        </Box>
                                    </Grid>
                                </Grid>
                                <Box sx={{ 
                                    mt: 2,
                                    p: 2, 
                                    borderRadius: '8px', 
                                    bgcolor: '#FEF3C7',
                                    border: '1px solid #FCD34D',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.5
                                }}>
                                    <Warning sx={{ color: '#92400E', fontSize: 20, flexShrink: 0, mt: 0.2 }} />
                                    <Box>
                                        <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 700, mb: 0.5 }}>
                                            Critical Rule (Phase 1)
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#92400E', fontWeight: 500 }}>
                                            Admin fulfillment method must match the user-selected reward type. Alternative rewards require support approval.
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 6. Reward Details */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CreditCard />
                                Reward Details
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            {reward.rewardType === 'Alternative Reward' || (reward.payoutMethod && reward.payoutMethod !== 'Gift Card' && !reward.payoutMethod.toLowerCase().includes('gift')) ? (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Alternative Reward Type</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                                            {reward.alternativeRewardType || 'Other Non-Cash Reward'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Approval Status</Typography>
                                        <Chip 
                                            label={reward.alternativeApproved ? 'Approved' : 'Pending Approval'} 
                                            size="small"
                                            sx={{ 
                                                bgcolor: reward.alternativeApproved ? '#E8F5E9' : '#FFF4E6',
                                                color: reward.alternativeApproved ? '#2E7D32' : '#FF9800',
                                                fontWeight: 700,
                                                mt: 0.5
                                            }} 
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Amount (USD Equivalent)</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success, mt: 0.5 }}>
                                            ${reward.usdAmount}
                                        </Typography>
                                    </Grid>
                                    {reward.alternativeReason && (
                                        <Grid item xs={12}>
                                            <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Reason for Alternative</Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, color: colors.textSecondary }}>
                                                {reward.alternativeReason}
                                            </Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            ) : (
                                <Grid container spacing={3}>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Gift Card Platform</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                                            {reward.giftCardPlatform || '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Region</Typography>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                                            {reward.giftCardRegion || '-'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Amount (USD Equivalent)</Typography>
                                        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.success, mt: 0.5 }}>
                                            ${reward.usdAmount}
                                        </Typography>
                                    </Grid>
                                    {reward.giftCardCode && (
                                        <Grid item xs={12}>
                                            <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600, mb: 1, display: 'block' }}>Gift Card Code</Typography>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1, 
                                                bgcolor: '#F9FAFB', 
                                                p: 2, 
                                                borderRadius: '8px', 
                                                border: '1px solid #E5E7EB' 
                                            }}>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontFamily: 'monospace', 
                                                        fontWeight: 600, 
                                                        flex: 1, 
                                                        wordBreak: 'break-all', 
                                                        color: colors.brandBlack,
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    {reward.giftCardCode}
                                                </Typography>
                                                <Tooltip title="Copy Code">
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => navigator.clipboard.writeText(reward.giftCardCode)}
                                                        sx={{ 
                                                            bgcolor: colors.brandRed + '10',
                                                            '&:hover': { bgcolor: colors.brandRed + '20' }
                                                        }}
                                                    >
                                                        <ContentCopy sx={{ fontSize: 16, color: colors.brandRed }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            )}
                            <Box sx={{ 
                                mt: 3,
                                p: 1.5, 
                                borderRadius: '8px', 
                                bgcolor: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Info sx={{ color: '#0369A1', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: '#0C4A6E', fontWeight: 500 }}>
                                    Details captured during claim • Read-only
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 7. Fulfillment Status & Actions - Combined with existing Actions section later */}
                    
                    {/* 8. Consent Tracking */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircle />
                                Consent Tracking
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Consent Status</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                        {reward.consentOptIn ? (
                                            <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
                                        ) : (
                                            <Cancel sx={{ fontSize: 20, color: colors.textSecondary }} />
                                        )}
                                        <Typography variant="h6" sx={{ fontWeight: 700, color: reward.consentOptIn ? colors.success : colors.textSecondary }}>
                                            {reward.consentOptIn ? 'Yes' : 'No'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Consent Type</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, whiteSpace: 'nowrap' }}>
                                        Video/Testimonial
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Captured At</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>
                                        {safeFormat(reward.consentTimestamp, 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Source</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5 }}>{reward.consentSource || 'Reward Claim Flow'}</Typography>
                                </Grid>
                            </Grid>
                            <Box sx={{ 
                                mt: 3,
                                p: 1.5, 
                                borderRadius: '8px', 
                                bgcolor: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Info sx={{ color: '#0369A1', fontSize: 18 }} />
                                <Typography variant="caption" sx={{ color: '#0C4A6E', fontWeight: 500 }}>
                                    Informational only • Does not affect reward approval or fulfillment
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Decline Reason (Visible if Declined) */}
                    {(reward.status === 'cancelled' || reward.status === 'declined') && (
                        <Card sx={{ p: 3, mb: 3, borderRadius: '16px', border: `1px solid ${colors.error}` }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: colors.error }}>Decline Reason</Typography>
                            <Typography variant="body1">{reward.declineReason}</Typography>
                            <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 1, display: 'block' }}>Visible to user</Typography>
                        </Card>
                    )}

                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={4}>
                    {/* 7. Fulfillment Status & Actions */}
                    <Card sx={{ mb: 3, borderRadius: '16px', border: `2px solid ${colors.brandRed}30` }}>
                        <Box sx={{ 
                            background: `linear-gradient(135deg, ${colors.brandRed}10 0%, ${colors.brandRed}05 100%)`,
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandRed, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Shield />
                                Fulfillment Status & Actions
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            {/* Fulfillment Status */}
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600, mb: 1, display: 'block' }}>
                                    Fulfillment Status
                                </Typography>
                                <Chip
                                    label={reward.fulfillmentStatus || 'Pending'}
                                    sx={{
                                        fontWeight: 700,
                                        backgroundColor: getStatusBg(reward.status),
                                        color: getStatusColor(reward.status),
                                        fontSize: '13px',
                                        height: 32,
                                    }}
                                />
                            </Box>
                            
                            {reward.fulfilledAt && (
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Fulfilled At</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                                        {safeFormat(reward.fulfilledAt, 'MMM dd, yyyy HH:mm')}
                                    </Typography>
                                </Box>
                            )}
                            
                            {reward.fulfilledBy && (
                                <Box sx={{ mb: 3 }}>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, textTransform: 'uppercase', fontWeight: 600 }}>Fulfilled By</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>{reward.fulfilledBy}</Typography>
                                </Box>
                            )}

                            <Divider sx={{ my: 2 }} />

                            {/* Actions */}
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Allowed Actions (Phase 1)</Typography>
                            
                            {reward.kycStatus !== 'verified' && (
                                <Box sx={{ 
                                    mb: 2,
                                    p: 1.5, 
                                    borderRadius: '8px', 
                                    bgcolor: '#FEF3C7',
                                    border: '1px solid #FCD34D',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}>
                                    <Warning sx={{ color: '#92400E', fontSize: 18 }} />
                                    <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 600 }}>
                                        Actions enabled only if KYC = Verified
                                    </Typography>
                                </Box>
                            )}

                            {reward.status !== 'fulfilled' && reward.status !== 'paid' && reward.status !== 'cancelled' ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        fullWidth
                                        disabled={reward.kycStatus !== 'verified'}
                                        onClick={() => setConfirmPaidDialogOpen(true)}
                                        startIcon={<CheckCircle />}
                                        sx={{ 
                                            borderRadius: '12px', 
                                            fontWeight: 700, 
                                            py: 1.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Mark as Fulfilled
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        color="error"
                                        fullWidth
                                        onClick={() => setDeclineDialogOpen(true)}
                                        startIcon={<Cancel />}
                                        sx={{ 
                                            borderRadius: '12px', 
                                            fontWeight: 700, 
                                            py: 1.5,
                                            textTransform: 'none'
                                        }}
                                    >
                                        Cancel / Decline Reward
                                    </Button>
                                </Box>
                            ) : (
                                <Box sx={{ 
                                    p: 2, 
                                    borderRadius: '8px', 
                                    bgcolor: '#F3F4F6',
                                    textAlign: 'center'
                                }}>
                                    <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                                        No actions available
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                                        Reward is {reward.status}
                                    </Typography>
                                </Box>
                            )}

                            <Box sx={{ 
                                mt: 2,
                                p: 1.5, 
                                borderRadius: '8px', 
                                bgcolor: '#F0F9FF',
                                border: '1px solid #BAE6FD',
                            }}>
                                <Typography variant="caption" sx={{ color: '#0C4A6E', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <Info sx={{ fontSize: 14 }} />
                                    All actions logged in System Logs
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* 9. Internal Admin Notes */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AssignmentInd />
                                Internal Admin Notes
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={5}
                                placeholder="Add internal notes for audit purposes..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                disabled={reward.status === 'fulfilled' || reward.status === 'paid' || reward.status === 'cancelled'}
                                sx={{ 
                                    mb: 2,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                    }
                                }}
                            />
                            <Button 
                                variant="contained" 
                                size="small" 
                                onClick={handleSaveNotes}
                                disabled={reward.status === 'fulfilled' || reward.status === 'paid' || reward.status === 'cancelled'}
                                sx={{
                                    bgcolor: colors.brandRed,
                                    '&:hover': { bgcolor: colors.brandDarkRed },
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontWeight: 600
                                }}
                            >
                                Save Notes
                            </Button>
                            {(reward.status === 'fulfilled' || reward.status === 'paid' || reward.status === 'cancelled') && (
                                <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 1 }}>
                                    Notes are locked once reward is {reward.status}
                                </Typography>
                            )}
                        </CardContent>
                    </Card>

                    {/* 10. Activity Timeline */}
                    <Card sx={{ mb: 3, borderRadius: '16px' }}>
                        <Box sx={{ 
                            bgcolor: '#F9FAFB',
                            p: 2,
                            borderBottom: `1px solid ${colors.divider}`,
                        }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Timeline />
                                Activity Timeline
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                Immutable audit trail • Chronological
                            </Typography>
                        </Box>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ position: 'relative' }}>
                                {(reward.events || []).map((event, index) => (
                                    <Box 
                                        key={index} 
                                        sx={{ 
                                            display: 'flex', 
                                            mb: 3,
                                            pb: index !== (reward.events || []).length - 1 ? 3 : 0,
                                            borderLeft: index !== (reward.events || []).length - 1 ? `2px solid ${colors.divider}` : 'none',
                                            pl: 2,
                                            ml: 1.5,
                                            position: 'relative'
                                        }}
                                    >
                                        <Box 
                                            sx={{ 
                                                position: 'absolute',
                                                left: -9,
                                                top: 0,
                                                width: 16,
                                                height: 16,
                                                borderRadius: '50%',
                                                bgcolor: colors.brandRed,
                                                border: `3px solid white`,
                                                boxShadow: `0 0 0 2px ${colors.brandRed}30`
                                            }} 
                                        />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5, color: colors.brandBlack }}>
                                                {event.action}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                                {safeFormat(event.timestamp, 'MMM dd, yyyy • HH:mm')}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mt: 0.5 }}>
                                                Triggered by: <strong>{event.triggeredBy}</strong>
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog open={declineDialogOpen} onClose={() => setDeclineDialogOpen(false)}>
                <DialogContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Decline Reward</Typography>
                    <TextField
                        fullWidth
                        label="Reason (Visible to User)"
                        multiline
                        rows={3}
                        value={declineReason}
                        onChange={(e) => setDeclineReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeclineDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" color="error" onClick={handleDecline}>Decline</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={confirmPaidDialogOpen} onClose={() => { setConfirmPaidDialogOpen(false); setFulfillGiftCardCode(''); }}>
                <DialogContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>Confirm Fulfillment</Typography>
                    <Typography sx={{ mb: 2 }}>Are you sure you want to mark this reward as FULFILLED? This action cannot be undone.</Typography>
                    {(reward?.rewardType === 'Gift Card' || reward?.payoutMethod === 'Gift Card') && (
                        <TextField
                            fullWidth
                            required
                            label="Gift Card Code"
                            placeholder="Enter the gift card code"
                            value={fulfillGiftCardCode}
                            onChange={(e) => setFulfillGiftCardCode(e.target.value)}
                            sx={{ mt: 1 }}
                            helperText="Required for gift card rewards. Enter the code you will send to the user."
                        />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => { setConfirmPaidDialogOpen(false); setFulfillGiftCardCode(''); }}>Cancel</Button>
                    <Button variant="contained" color="success" onClick={handleMarkFulfilled}>Confirm Fulfilled</Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default RewardDetailsPage;
