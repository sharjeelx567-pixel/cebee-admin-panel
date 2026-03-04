import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardContent, Typography, Chip, Button, IconButton, CircularProgress, Alert } from '@mui/material';
import {
  People,
  CheckCircle,
  Star,
  AttachMoney,
  SportsSoccer,
  TrendingUp,
  Description,
  AccessTime,
  ArrowUpward,
  ErrorOutline,
  PersonAdd,
  Lock,
  ArrowForward,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { colors } from '../config/theme';
import { getDashboardData } from '../services/dashboardService';
import { useNavigate } from 'react-router-dom';
import { constants } from '../config/theme';
import { format, formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, subtitle, icon: Icon, color, isPrimary = false, delay = 0 }) => {
  return (
    <Card
      sx={{
        padding: { xs: 1.5, md: 2 },
        borderRadius: '16px',
        background: isPrimary
          ? `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`
          : colors.brandWhite,
        border: isPrimary
          ? 'none'
          : `1.5px solid ${color}26`,
        boxShadow: isPrimary
          ? `0 4px 12px ${colors.brandRed}40`
          : `0 4px 10px ${color}1F`,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        animation: `fadeInUp 0.6s ease-out ${delay}ms both`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: isPrimary
            ? `0 6px 16px ${colors.brandRed}50`
            : `0 6px 14px ${color}2F`,
        },
        '@keyframes fadeInUp': {
          from: {
            opacity: 0,
            transform: 'translateY(20px)',
          },
          to: {
            opacity: 1,
            transform: 'translateY(0)',
          },
        },
      }}
    >
      <CardContent sx={{ padding: 0, '&:last-child': { paddingBottom: 0 } }}>
        <Box
          sx={{
            padding: { xs: 1, md: 1.25 },
            width: 'fit-content',
            background: isPrimary
              ? `${colors.brandWhite}33`
              : `${color}1F`,
            borderRadius: '12px',
            boxShadow: isPrimary
              ? '0 2px 6px rgba(0, 0, 0, 0.12)'
              : 'none',
            mb: 1.5,
          }}
        >
          <Icon
            sx={{
              fontSize: { xs: 20, md: 24 },
              color: isPrimary ? colors.brandWhite : color,
            }}
          />
        </Box>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: isPrimary ? colors.brandWhite : colors.brandBlack,
              letterSpacing: -0.8,
              fontSize: { xs: 20, md: 26 },
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: isPrimary ? `${colors.brandWhite}F0` : colors.brandBlack,
              fontSize: { xs: 12, md: 13 },
              mb: 0.25,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 500,
                color: isPrimary ? `${colors.brandWhite}B3` : colors.success,
                fontSize: { xs: 10, md: 11 },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </Typography>
            <ArrowUpward
              sx={{
                fontSize: 11,
                color: isPrimary ? `${colors.brandWhite}B3` : colors.success,
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
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
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDashboardData();
      
      if (response.success) {
        setDashboardData(response.data);
        setLastUpdated(new Date());
      } else {
        setError(response.error || 'Failed to load dashboard data');
        // Set default values on error
        setDashboardData({
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
        });
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = [
    {
      title: 'Total Users',
      value: dashboardData.stats.totalUsers.toLocaleString(),
      subtitle: 'All registered users',
      icon: People,
      color: colors.brandRed,
      isPrimary: true,
    },
    {
      title: 'Active Users',
      value: dashboardData.stats.activeUsers.toLocaleString(),
      subtitle: 'Logged in last 30 days',
      icon: CheckCircle,
      color: colors.success,
      isPrimary: false,
    },
    {
      title: 'Total SP Issued',
      value: dashboardData.stats.totalSPIssued.toLocaleString(),
      subtitle: 'Prediction-based SP only',
      icon: Star,
      color: '#FF9800', // Orange
      isPrimary: false,
    },
    {
      title: 'Estimated Rewards Value',
      value: `$${dashboardData.stats.estimatedRewardsValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
      subtitle: 'USD value of fulfilled rewards',
      icon: AttachMoney,
      color: '#2196F3', // Blue
      isPrimary: false,
    },
  ];

  // State for countdown timer
  const [countdown, setCountdown] = useState('00:00:00');

  // Format time remaining for next fixture with real-time updates
  useEffect(() => {
    if (!dashboardData.nextFixture?.kickoffTime) {
      setCountdown('00:00:00');
      return;
    }

    const updateCountdown = () => {
      try {
        const kickoff = new Date(dashboardData.nextFixture.kickoffTime);
        const now = new Date();
        const diff = kickoff - now;
        
        if (diff <= 0) {
          setCountdown('00:00:00');
          return;
        }
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      } catch (e) {
        setCountdown('00:00:00');
      }
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [dashboardData.nextFixture?.kickoffTime]);

  // Format alert time
  const formatAlertTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return 'Unknown time';
    }
  };

  // Show loading only on initial load
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', flexDirection: 'column', gap: 2 }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2.5, md: 3 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.brandBlack,
            fontSize: { xs: 26, md: 30 },
            letterSpacing: -0.8,
            mb: 1,
          }}
        >
          Dashboard
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            icon={<TrendingUp sx={{ fontSize: 14 }} />}
            label="Auto-refresh: 10 min"
            size="small"
            sx={{
              backgroundColor: `${colors.brandRed}1A`,
              color: colors.brandRed,
              fontWeight: 600,
              fontSize: 12,
              border: `1px solid ${colors.brandRed}33`,
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: colors.textSecondary,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            Last updated: {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Just now'}
          </Typography>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ mb: { xs: 2, md: 2.5 } }}>
        <Grid item xs={6} md={3}>
          <StatCard {...stats[0]} delay={0} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard {...stats[1]} delay={100} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard {...stats[2]} delay={200} />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard {...stats[3]} delay={300} />
        </Grid>
      </Grid>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2, borderRadius: '12px' }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Today Status Strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: { xs: 2, md: 2.5 },
          padding: 1.5,
          backgroundColor: colors.brandWhite,
          borderRadius: '12px',
        }}
      >
        <SportsSoccer sx={{ fontSize: 16, color: colors.textSecondary }} />
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: { xs: 12, md: 13 },
            fontWeight: 500,
          }}
        >
          Today: {dashboardData.todaySummary.totalMatches} matches · {dashboardData.todaySummary.completedMatches} completed · {dashboardData.todaySummary.liveMatches} live · {dashboardData.todaySummary.pendingResults} pending results
        </Typography>
      </Box>

      {/* Next Fixture Banner */}
      {dashboardData.nextFixture ? (
        <Card
          sx={{
            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
            borderRadius: '24px',
            boxShadow: `0 8px 20px ${colors.brandRed}59`,
            mb: { xs: 2.5, md: 3 },
            padding: { xs: 2.25, md: 3 },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.brandWhite}33`,
                  borderRadius: '12px',
                }}
              >
                <SportsSoccer sx={{ fontSize: 22, color: colors.brandWhite }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.brandWhite,
                  fontSize: { xs: 18, md: 20 },
                }}
              >
                Next Fixture
              </Typography>
            </Box>
            {dashboardData.nextFixture.status === 'live' && (
              <Chip
                label="LIVE"
                size="small"
                sx={{
                  backgroundColor: `${colors.brandWhite}33`,
                  color: colors.brandWhite,
                  fontWeight: 700,
                  fontSize: 12,
                  border: `1px solid ${colors.brandWhite}4D`,
                }}
                icon={<TrendingUp sx={{ fontSize: 14, color: colors.brandWhite }} />}
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: { xs: 56, md: 70 },
                  height: { xs: 56, md: 70 },
                  margin: '0 auto',
                  backgroundColor: `${colors.brandWhite}26`,
                  borderRadius: '14px',
                  border: `2px solid ${colors.brandWhite}4D`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.25,
                }}
              >
                <SportsSoccer sx={{ fontSize: { xs: 30, md: 36 }, color: colors.brandWhite }} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: colors.brandWhite,
                  fontSize: { xs: 13, md: 15 },
                }}
              >
                {dashboardData.nextFixture.homeTeam || 'TBD'}
              </Typography>
            </Box>

            <Box sx={{ padding: '0 12px', textAlign: 'center' }}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 900,
                  color: `${colors.brandWhite}B3`,
                  fontSize: { xs: 14, md: 18 },
                  letterSpacing: 2,
                  mb: 0.75,
                }}
              >
                VS
              </Typography>
              <Box
                sx={{
                  padding: '8px 14px',
                  backgroundColor: `${colors.brandWhite}33`,
                  borderRadius: '12px',
                  border: `1px solid ${colors.brandWhite}4D`,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.brandWhite,
                    fontSize: { xs: 18, md: 22 },
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {countdown}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: `${colors.brandWhite}CC`,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {dashboardData.nextFixture.kickoffTime ? format(new Date(dashboardData.nextFixture.kickoffTime), 'MMM dd, HH:mm') : 'TBD'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ flex: 1, textAlign: 'center' }}>
              <Box
                sx={{
                  width: { xs: 56, md: 70 },
                  height: { xs: 56, md: 70 },
                  margin: '0 auto',
                  backgroundColor: `${colors.brandWhite}26`,
                  borderRadius: '14px',
                  border: `2px solid ${colors.brandWhite}4D`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 1.25,
                }}
              >
                <SportsSoccer sx={{ fontSize: { xs: 30, md: 36 }, color: colors.brandWhite }} />
              </Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: colors.brandWhite,
                  fontSize: { xs: 13, md: 15 },
                }}
              >
                {dashboardData.nextFixture.awayTeam || 'TBD'}
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              padding: 1.5,
              backgroundColor: `${colors.brandWhite}26`,
              borderRadius: '12px',
              border: `1px solid ${colors.brandWhite}33`,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: colors.brandWhite,
                fontSize: { xs: 12, md: 14 },
              }}
            >
              {dashboardData.nextFixture.venue || 'TBD'} • {dashboardData.nextFixture.leagueName || 'TBD'}
            </Typography>
          </Box>
        </Card>
      ) : (
        <Card
          sx={{
            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
            borderRadius: '24px',
            mb: { xs: 2.5, md: 3 },
            padding: { xs: 2.25, md: 3 },
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" sx={{ color: colors.brandWhite, fontWeight: 600 }}>
            No upcoming fixtures
          </Typography>
        </Card>
      )}

      {/* High-Risk Admin Action Alerts */}
      <Card
        sx={{
          mb: { xs: 2.5, md: 3 },
          borderRadius: '16px',
          backgroundColor: colors.brandWhite,
          boxShadow: `0 4px 12px ${colors.shadow}1F`,
        }}
      >
        <Box sx={{ p: 2.5 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: colors.brandRed,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ErrorOutline sx={{ fontSize: 24, color: colors.brandWhite }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: colors.brandBlack,
                    fontSize: { xs: 16, md: 18 },
                    mb: 0.25,
                  }}
                >
                  High-Risk Admin Action Alerts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.textSecondary,
                    fontSize: 12,
                  }}
                >
                  {dashboardData.alerts?.length || 0} critical events require attention
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
              onClick={() => navigate(constants.routes.logs || '/logs')}
              sx={{
                background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: 13,
                px: 2,
                py: 1,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
                },
              }}
            >
              View All Logs
            </Button>
          </Box>

          {/* Alert Cards */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {dashboardData.alerts && dashboardData.alerts.length > 0 ? (
              dashboardData.alerts.map((alert, index) => {
                const isCritical = alert.severity === 'critical' || alert.severity === 'CRITICAL';
                const alertColor = isCritical ? colors.error : colors.warning;
                const alertIcon = alert.actionType === 'SP_ADJUSTMENT' || alert.actionType === 'sp_adjustment' 
                  ? TrendingUp 
                  : alert.actionType === 'ROLE_CHANGE' || alert.actionType === 'role_change'
                  ? PersonAdd
                  : Lock;

                return (
                  <Card
                    key={alert.id || index}
                    sx={{
                      backgroundColor: `${alertColor}0D`,
                      border: `1.5px solid ${alertColor}26`,
                      borderRadius: '12px',
                      padding: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: `${alertColor}1A`,
                        transform: 'translateX(4px)',
                      },
                    }}
                    onClick={() => {
                      if (alert.logId) {
                        navigate(`${constants.routes.logs || '/logs'}?logId=${alert.logId}`);
                      }
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        backgroundColor: `${alertColor}26`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {React.createElement(alertIcon, { sx: { fontSize: 20, color: alertColor } })}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Chip
                          label={isCritical ? 'CRITICAL' : 'WARNING'}
                          size="small"
                          sx={{
                            backgroundColor: alertColor,
                            color: colors.brandWhite,
                            fontWeight: 700,
                            fontSize: 10,
                            height: 20,
                            px: 0.5,
                          }}
                        />
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: colors.brandBlack,
                          fontSize: 13,
                          mb: 0.25,
                        }}
                      >
                        {alert.title || alert.actionType || 'Admin Action'}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.textSecondary,
                          fontSize: 12,
                          mb: 0.5,
                        }}
                      >
                        {alert.description || alert.message || 'No description available'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTime sx={{ fontSize: 12, color: colors.textSecondary }} />
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.textSecondary,
                            fontSize: 11,
                          }}
                        >
                          {formatAlertTime(alert.timestamp || alert.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: alertColor,
                        color: colors.brandWhite,
                        flexShrink: 0,
                        '&:hover': {
                          backgroundColor: isCritical ? colors.brandDarkRed : '#F57C00',
                        },
                      }}
                    >
                      <KeyboardArrowRight sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Card>
                );
              })
            ) : (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  No high-risk alerts at this time
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Card>

      {/* Quick Actions */}
      <Card
        sx={{
          padding: { xs: 2.25, md: 3 },
          borderRadius: '20px',
          border: `1.5px solid ${colors.brandRed}1A`,
          boxShadow: `0 6px 18px ${colors.brandRed}14`,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colors.brandBlack,
            fontSize: { xs: 18, md: 20 },
            mb: 2.25,
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          {[
            { title: 'User Management', icon: People, color: colors.brandRed, route: constants.routes.users || '/users' },
            { title: 'Predictions', icon: TrendingUp, color: colors.info, route: constants.routes.predictions || '/predictions' },
            { title: 'Rewards', icon: Star, color: colors.success, route: constants.routes.rewards || '/rewards' },
            { title: 'System Logs', icon: Description, color: colors.warning, route: constants.routes.logs || '/logs' },
          ].map((action, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card
                onClick={() => navigate(action.route)}
                sx={{
                  padding: { xs: 1.75, md: 2 },
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${action.color}1A 0%, ${action.color}0D 100%)`,
                  border: `1.5px solid ${action.color}33`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${action.color}33`,
                  },
                }}
              >
                <Box
                  sx={{
                    padding: 1.625,
                    width: 'fit-content',
                    margin: '0 auto',
                    backgroundColor: `${action.color}26`,
                    borderRadius: '16px',
                    mb: 1.5,
                  }}
                >
                  {React.createElement(action.icon, {
                    sx: { fontSize: { xs: 26, md: 30 }, color: action.color },
                  })}
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: colors.brandBlack,
                    fontSize: { xs: 12.5, md: 13.5 },
                  }}
                >
                  {action.title}
                </Typography>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Card>
    </Box>
  );
};

export default DashboardPage;
