import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    Button,
    Card,
    Grid,
    CircularProgress,
} from '@mui/material';
import {
    ArrowBack,
    Person,
    CheckCircle,
    BarChart,
    LocationOn,
    Verified,
    AccessTime,
    CalendarToday,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { colors, constants } from '../config/theme';
import { getLeaderboardEntry } from '../services/leaderboardService';

const LeaderboardDetailsPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const period = queryParams.get('period') || 'allTime';

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadUserData();
    }, [id, period]);

    const generateDummyUserData = (userId, selectedPeriod) => {
        const isMonthly = selectedPeriod === 'monthly';
        // Base stats (All Time)
        const baseStats = {
            spTotal: 22400,
            spCurrent: 1200,
            cpTotal: 350,
            cpCurrent: 150,
            totalPredictions: 780,
            correctPredictions: 580,
            predictionAccuracy: 74.4,
        };

        // Adjust for monthly view
        const stats = isMonthly ? {
            spTotal: Math.floor(baseStats.spTotal / 12),
            spCurrent: baseStats.spCurrent, // Current usually implies relevant now
            cpTotal: Math.floor(baseStats.cpTotal / 12),
            cpCurrent: baseStats.cpCurrent,
            totalPredictions: Math.floor(baseStats.totalPredictions / 12),
            correctPredictions: Math.floor(baseStats.correctPredictions / 12),
            predictionAccuracy: baseStats.predictionAccuracy - 2.1, // Slight variation
        } : baseStats;

        const countries = ['United States', 'United Kingdom', 'Kenya', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Brazil', 'India', 'Nigeria', 'South Africa', 'Ghana'];
        return {
            id: userId,
            rank: isMonthly ? 12 : 4, // Rank differs per period
            username: 'PredictionMaster',
            email: 'predictionmaster@example.com',
            fullName: 'Prediction Master',
            country: 'Kenya',
            isActive: true,
            isVerified: true,
            isBlocked: false,
            isDeleted: false,
            isDeactivated: false,
            fraudFlags: [],
            ...stats,
            totalPolls: 12,
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            spFromPredictions: isMonthly ? 150 : 1800,
            spFromDailyLogin: isMonthly ? 50 : 650,
            cpFromReferrals: 200,
            cpFromEngagement: 150,
        };
    };

    const loadUserData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await getLeaderboardEntry(id, { period });
            
            if (response.success && response.data) {
                // Map API response to component format
                const userData = response.data;
                setUser({
                    id: userData.id || userData.userId || id,
                    rank: userData.rank || 0,
                    username: userData.username || userData.userName || 'N/A',
                    email: userData.email || userData.userEmail || 'N/A',
                    fullName: userData.fullName || userData.name || userData.username || 'N/A',
                    country: userData.country || 'N/A',
                    isActive: userData.isActive !== false,
                    isVerified: userData.isVerified || false,
                    isBlocked: userData.isBlocked || false,
                    isDeleted: userData.isDeleted || false,
                    isDeactivated: userData.isDeactivated || false,
                    fraudFlags: userData.fraudFlags || [],
                    spTotal: userData.spTotal || userData.points || 0,
                    spCurrent: userData.spCurrent || userData.spTotal || 0,
                    cpTotal: userData.cpTotal || 0,
                    cpCurrent: userData.cpCurrent || 0,
                    totalPredictions: userData.totalPredictions || 0,
                    correctPredictions: userData.correctPredictions || 0,
                    predictionAccuracy: userData.predictionAccuracy || userData.accuracyRate || userData.accuracy || 0,
                    totalPolls: userData.totalPolls || 0,
                    createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
                    lastLogin: userData.lastLogin ? new Date(userData.lastLogin) : (userData.lastUpdated ? new Date(userData.lastUpdated) : new Date()),
                    lastUpdated: userData.lastUpdated || userData.lastPredictionTime ? new Date(userData.lastUpdated || userData.lastPredictionTime) : new Date(),
                    spFromPredictions: userData.spFromPredictions || 0,
                    spFromDailyLogin: userData.spFromDailyLogin || 0,
                    cpFromReferrals: userData.cpFromReferrals || 0,
                    cpFromEngagement: userData.cpFromEngagement || 0,
                });
            } else {
                // Fallback to dummy data on error
                console.warn('Failed to fetch leaderboard entry:', response.error);
                const dummyData = generateDummyUserData(id, period);
                setUser(dummyData);
            }
        } catch (err) {
            console.error('Error loading user:', err);
            setError(err.message || 'Failed to load leaderboard entry');
            // Fallback to dummy data
            const dummyData = generateDummyUserData(id, period);
            setUser(dummyData);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: colors.brandRed }} />
            </Box>
        );
    }

    if (error && !user) {
        return (
            <Box sx={{ textAlign: 'center', padding: 6 }}>
                <Typography variant="h6" sx={{ color: colors.error, mb: 2 }}>
                    {error}
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate(constants.routes.leaderboard)}
                    sx={{
                        background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Back to Leaderboard
                </Button>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ textAlign: 'center', padding: 6 }}>
                <Typography variant="h6" sx={{ color: colors.error, mb: 2 }}>
                    User not found
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => navigate(constants.routes.leaderboard)}
                    sx={{
                        background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    Back to Leaderboard
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', maxWidth: '100%' }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate(constants.routes.leaderboard)}
                sx={{
                    mb: 3,
                    color: colors.brandRed,
                    textTransform: 'none',
                    fontWeight: 600,
                    backgroundColor: colors.brandWhite,
                    border: `1px solid ${colors.divider}`,
                    borderRadius: '10px',
                    px: 2,
                    py: 1,
                    '&:hover': {
                        backgroundColor: `${colors.brandRed}0D`,
                        borderColor: colors.brandRed,
                    },
                }}
            >
                Back to Leaderboard
            </Button>

            {/* Leaderboard Details Header Card */}
            <Card
                sx={{
                    background: `linear-gradient(135deg, ${colors.brandRed} 0%, #D32F2F 100%)`,
                    borderRadius: '24px',
                    padding: { xs: 3, md: 4 },
                    color: colors.brandWhite,
                    mb: 4,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(220, 38, 38, 0.25)'
                }}
            >
                {/* Top Left Tag (LBAT_4) */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 24,
                        left: 24,
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '4px 12px'
                    }}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: 13, color: colors.brandWhite }}>
                        {period === 'monthly' ? `LBMO_${user.rank}` : `LBAT_${user.rank}`}
                    </Typography>
                </Box>

                {/* Top Right Rank Badge */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 24,
                        right: 24,
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.8)' }}>
                        #{user.rank}
                    </Typography>
                </Box>

                {/* User Info Section */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', gap: 3, mb: 4, mt: 4 }}>
                    {/* Avatar */}
                    <Box
                        sx={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        <Person sx={{ fontSize: 40, color: colors.brandWhite }} />
                    </Box>

                    {/* Details */}
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandWhite }}>
                                {user.username || 'N/A'}
                            </Typography>
                            {user.isVerified && <Verified sx={{ color: colors.brandWhite, fontSize: 24 }} />}
                        </Box>
                        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 1 }}>
                            {user.email || 'N/A'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 16, color: 'rgba(255,255,255,0.8)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                {user.country || 'N/A'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Divider Line */}
                <Box sx={{ width: '100%', height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', mb: 3 }} />

                {/* Footer Info (Last Updated) */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <AccessTime sx={{ fontSize: 20, color: 'rgba(255,255,255,0.8)' }} />
                    <Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', lineHeight: 1 }}>
                            Last Updated
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: colors.brandWhite }}>
                            {user.lastUpdated ? format(new Date(user.lastUpdated), 'MMM dd, HH:mm') : format(new Date(), 'MMM dd, HH:mm')}
                        </Typography>
                    </Box>
                </Box>
            </Card>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={3}>
                    <Card
                        sx={{
                            padding: 3,
                            borderRadius: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: '#FFF7ED',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}
                        >
                            <BarChart sx={{ color: '#F97316' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                                {(user.spTotal || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                {period === 'monthly' ? 'Monthly Points' : 'Total Points (All Time)'}
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card
                        sx={{
                            padding: 3,
                            borderRadius: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: '#EBF8FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}
                        >
                            <BarChart sx={{ color: '#3182CE' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                                {user.totalPredictions || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                Total Predictions
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card
                        sx={{
                            padding: 3,
                            borderRadius: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: '#F0FDF4',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}
                        >
                            <CheckCircle sx={{ color: '#22C55E' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                                {user.correctPredictions || 0}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                Correct Predictions
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card
                        sx={{
                            padding: 3,
                            borderRadius: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: '#FEF2F2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}
                        >
                            <Typography sx={{ fontWeight: 700, color: '#EF4444' }}>%</Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                                {(user.predictionAccuracy || 0).toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                Accuracy Rate
                            </Typography>
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={3}>
                    <Card
                        sx={{
                            padding: 3,
                            borderRadius: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: '#E1F5FE',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}
                        >
                            <Typography sx={{ fontWeight: 700, color: '#03A9F4', fontSize: 20 }}>#</Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                                {user.rank || '-'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                Current Rank
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                    <Card
                        sx={{
                            padding: 3,
                            borderRadius: '16px',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <Box
                            sx={{
                                width: 40,
                                height: 40,
                                borderRadius: '12px',
                                backgroundColor: '#FFF8E1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 3
                            }}
                        >
                            <CalendarToday sx={{ color: '#FFA000', fontSize: 20 }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                                {period === 'monthly' ? 'Monthly' : period === 'weekly' ? 'Weekly' : 'All Time'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                                Selected Period
                            </Typography>
                        </Box>
                    </Card>
                </Grid>
            </Grid>
        </Box >
    );
};

export default LeaderboardDetailsPage;
