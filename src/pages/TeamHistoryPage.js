import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ArrowBack,
  History,
  CheckCircle,
  Cancel,
  ArrowUpward,
  ArrowDownward,
  Add,
  Person,
  CalendarToday,
  SportsSoccer,
  Groups,
  Info,
} from '@mui/icons-material';
import { colors } from '../config/theme';
import { format } from 'date-fns';

const TeamHistoryPage = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadTeamHistory();
  }, [teamId]);

  const loadTeamHistory = async () => {
    setLoading(true);
    try {
      // Mock data - Replace with actual API call
      const mockTeam = {
        team_id: teamId || 'TEAM_001',
        team_name: 'Manchester United',
        league_id: 'LEAGUE_001',
        league_name: 'Premier League',
        status: 'Active',
        season_tag: '2025-26',
        entry_type: 'Original',
        status_reason: null,
        status_changed_at: null,
        created_at: new Date('2025-01-15T00:00:00'),
        created_by: 'admin_001',
        created_by_name: 'Super Admin',
      };

      const mockHistory = [
        {
          history_id: 'HIST_001',
          action_type: 'Created',
          old_status: null,
          new_status: 'Active',
          reason: null,
          performed_by: 'admin_001',
          performed_by_name: 'Super Admin',
          performed_at: new Date('2025-01-15T10:00:00'),
          metadata: {
            season_tag: '2025-26',
            entry_type: 'Original',
          },
        },
        {
          history_id: 'HIST_002',
          action_type: 'Inactivated',
          old_status: 'Active',
          new_status: 'Inactive',
          reason: 'Relegated to Championship after finishing 18th in Premier League',
          performed_by: 'admin_002',
          performed_by_name: 'Support Admin',
          performed_at: new Date('2025-05-20T14:30:00'),
          metadata: {
            relegation_date: '2025-05-20',
            final_position: 18,
          },
        },
        {
          history_id: 'HIST_003',
          action_type: 'Activated',
          old_status: 'Inactive',
          new_status: 'Active',
          reason: 'Promoted back to Premier League after winning Championship',
          performed_by: 'admin_001',
          performed_by_name: 'Super Admin',
          performed_at: new Date('2025-06-15T09:15:00'),
          metadata: {
            promotion_date: '2025-06-15',
            season_tag: '2025-26',
          },
        },
        {
          history_id: 'HIST_004',
          action_type: 'Promoted',
          old_status: 'Active',
          new_status: 'Active',
          reason: 'Officially marked as promoted team for 2025-26 season',
          performed_by: 'admin_001',
          performed_by_name: 'Super Admin',
          performed_at: new Date('2025-06-20T11:00:00'),
          metadata: {
            promotion_date: '2025-06-20',
            season_tag: '2025-26',
          },
        },
      ];

      setTeam(mockTeam);
      setHistory(mockHistory);
    } catch (error) {
      console.error('Error loading team history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType) => {
    switch (actionType) {
      case 'Created':
        return <Add sx={{ fontSize: 20 }} />;
      case 'Activated':
        return <CheckCircle sx={{ fontSize: 20 }} />;
      case 'Inactivated':
        return <Cancel sx={{ fontSize: 20 }} />;
      case 'Promoted':
        return <ArrowUpward sx={{ fontSize: 20 }} />;
      case 'Relegated':
        return <ArrowDownward sx={{ fontSize: 20 }} />;
      default:
        return <History sx={{ fontSize: 20 }} />;
    }
  };

  const getActionColor = (actionType) => {
    switch (actionType) {
      case 'Created':
        return '#3B82F6';
      case 'Activated':
        return '#10B981';
      case 'Inactivated':
        return '#EF4444';
      case 'Promoted':
        return '#10B981';
      case 'Relegated':
        return '#EF4444';
      default:
        return colors.brandRed;
    }
  };

  const getStatusChip = (status) => {
    const config = {
      Active: { label: 'ACTIVE', bgColor: '#10B981', textColor: colors.brandWhite },
      Inactive: { label: 'INACTIVE', bgColor: '#6B7280', textColor: colors.brandWhite },
    };

    const statusConfig = config[status] || config.Active;

    return (
      <Chip
        label={statusConfig.label}
        size="small"
        sx={{
          backgroundColor: statusConfig.bgColor,
          color: statusConfig.textColor,
          fontWeight: 600,
          fontSize: 11,
          height: 24,
          borderRadius: '6px',
        }}
      />
    );
  };

  const getEntryTypeChip = (entryType) => {
    const config = {
      Original: { label: 'ORIGINAL', bgColor: '#3B82F6', textColor: colors.brandWhite },
      Promoted: { label: 'PROMOTED', bgColor: '#10B981', textColor: colors.brandWhite },
    };

    const typeConfig = config[entryType] || config.Original;

    return (
      <Chip
        label={typeConfig.label}
        size="small"
        sx={{
          backgroundColor: typeConfig.bgColor,
          color: typeConfig.textColor,
          fontWeight: 600,
          fontSize: 11,
          height: 24,
          borderRadius: '6px',
        }}
      />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  if (!team) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Team not found
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teams')}
          sx={{ textTransform: 'none' }}
        >
          Back to Teams
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/teams')}
          sx={{
            mb: 2,
            textTransform: 'none',
            color: colors.brandRed,
            '&:hover': {
              backgroundColor: '#FEE2E2',
            },
          }}
        >
          Back to Teams
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              backgroundColor: colors.brandRed,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <History sx={{ fontSize: 28, color: colors.brandWhite }} />
          </Box>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: colors.brandBlack,
                fontSize: { xs: 24, md: 28 },
                mb: 0.25,
              }}
            >
              Team History
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: 13,
              }}
            >
              Complete audit trail for {team.team_name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Team Information Card */}
      <Card
        sx={{
          padding: 3,
          mb: 3,
          borderRadius: '20px',
          backgroundColor: colors.brandWhite,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.brandBlack }}>
          Team Information
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SportsSoccer sx={{ fontSize: 22, color: colors.brandRed }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.25 }}>
                  Team ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 16 }}>
                  {team.team_id}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Groups sx={{ fontSize: 22, color: colors.brandRed }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.25 }}>
                  Team Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 16 }}>
                  {team.team_name}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SportsSoccer sx={{ fontSize: 22, color: colors.brandRed }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.25 }}>
                  League
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 16 }}>
                  {team.league_name}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Info sx={{ fontSize: 22, color: colors.brandRed }} />
              </Box>
              <Box>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.25 }}>
                  Current Status
                </Typography>
                <Box>{getStatusChip(team.status)}</Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.5 }}>
              Season Tag
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: colors.brandBlack }}>
              {team.season_tag}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.5 }}>
              Entry Type
            </Typography>
            <Box>{getEntryTypeChip(team.entry_type)}</Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.5 }}>
              Created At
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: colors.brandBlack }}>
              {format(team.created_at, 'MMM dd, yyyy')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.5 }}>
              Created By
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, color: colors.brandBlack }}>
              {team.created_by_name}
            </Typography>
          </Grid>
        </Grid>
      </Card>

      {/* History Timeline */}
      <Card
        sx={{
          padding: 3,
          borderRadius: '20px',
          backgroundColor: colors.brandWhite,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <History sx={{ fontSize: 24, color: colors.brandRed }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
            Activity History
          </Typography>
          <Chip
            label={`${history.length} events`}
            size="small"
            sx={{
              backgroundColor: '#FEE2E2',
              color: colors.brandRed,
              fontWeight: 600,
              fontSize: 12,
            }}
          />
        </Box>

        {history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <History sx={{ fontSize: 48, color: colors.textSecondary, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1" sx={{ color: colors.textSecondary }}>
              No history available for this team
            </Typography>
          </Box>
        ) : (
          <Timeline sx={{ p: 0 }}>
            {history.map((item, index) => (
              <TimelineItem key={item.history_id}>
                <TimelineOppositeContent
                  sx={{
                    flex: 0.3,
                    px: 2,
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                    {format(item.performed_at, 'MMM dd, yyyy')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11, display: 'block' }}>
                    {format(item.performed_at, 'HH:mm')}
                  </Typography>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineDot
                    sx={{
                      backgroundColor: getActionColor(item.action_type),
                      color: colors.brandWhite,
                      width: 40,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 8px ${getActionColor(item.action_type)}40`,
                    }}
                  >
                    {getActionIcon(item.action_type)}
                  </TimelineDot>
                  {index < history.length - 1 && (
                    <TimelineConnector
                      sx={{
                        backgroundColor: '#E5E7EB',
                        width: 2,
                      }}
                    />
                  )}
                </TimelineSeparator>
                <TimelineContent sx={{ px: 2, pb: 3 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: '12px',
                      border: `1px solid ${getActionColor(item.action_type)}20`,
                      backgroundColor: `${getActionColor(item.action_type)}08`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: colors.brandBlack,
                            mb: 0.5,
                          }}
                        >
                          {item.action_type}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          {item.old_status && (
                            <>
                              <Chip
                                label={item.old_status}
                                size="small"
                                sx={{
                                  backgroundColor: '#6B7280',
                                  color: colors.brandWhite,
                                  fontSize: 10,
                                  height: 20,
                                }}
                              />
                              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                                →
                              </Typography>
                              <Chip
                                label={item.new_status}
                                size="small"
                                sx={{
                                  backgroundColor: item.new_status === 'Active' ? '#10B981' : '#6B7280',
                                  color: colors.brandWhite,
                                  fontSize: 10,
                                  height: 20,
                                }}
                              />
                            </>
                          )}
                          {!item.old_status && (
                            <Chip
                              label={item.new_status}
                              size="small"
                              sx={{
                                backgroundColor: item.new_status === 'Active' ? '#10B981' : '#6B7280',
                                color: colors.brandWhite,
                                fontSize: 10,
                                height: 20,
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.textSecondary,
                          fontSize: 11,
                          display: { xs: 'block', md: 'none' },
                        }}
                      >
                        {format(item.performed_at, 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Box>

                    {item.reason && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          borderRadius: '8px',
                          backgroundColor: colors.brandWhite,
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 0.5 }}>
                          Reason:
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.brandBlack, fontWeight: 500 }}>
                          {item.reason}
                        </Typography>
                      </Box>
                    )}

                    {item.metadata && Object.keys(item.metadata).length > 0 && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12, mb: 1 }}>
                          Additional Details:
                        </Typography>
                        <Grid container spacing={1}>
                          {Object.entries(item.metadata).map(([key, value]) => (
                            <Grid item xs={6} sm={4} key={key}>
                              <Box
                                sx={{
                                  p: 1,
                                  borderRadius: '8px',
                                  backgroundColor: colors.brandWhite,
                                  border: '1px solid #E5E7EB',
                                }}
                              >
                                <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 10 }}>
                                  {key.replace(/_/g, ' ').toUpperCase()}
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 12 }}>
                                  {String(value)}
                                </Typography>
                              </Box>
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Person sx={{ fontSize: 16, color: colors.textSecondary }} />
                      <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                        Performed by: <strong>{item.performed_by_name}</strong>
                      </Typography>
                    </Box>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Card>
    </Box>
  );
};

export default TeamHistoryPage;
