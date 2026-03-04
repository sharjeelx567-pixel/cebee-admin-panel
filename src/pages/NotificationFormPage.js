import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Grid,
  CircularProgress,
  IconButton,
  Chip,
  Checkbox,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  ArrowBack,
  Announcement,
  EmojiEvents,
  People,
  Person,
  Link as LinkIcon,
  Schedule,
  CheckCircle,
  Smartphone,
  Send,
  Warning,
  Help,
  Description,
  PlayArrow,
  Star,
  StarBorder,
  ThumbUp,
  Assignment,
  CalendarToday,
  Lock,
  Campaign,
  EventAvailable,
  NotificationsActive,
  TrendingUp,
  Assessment,
  AttachMoney,
  Cancel,
  Refresh,
  AutoAwesome,
  Public,
  Flag,
  SportsSoccer,
  Favorite,
  Info as InfoIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { colors, constants } from '../config/theme';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  createNotification, 
  updateNotification, 
  getNotificationById,
  saveNotificationAsDraft 
} from '../services/notificationsService';

const NOTIFICATION_LIMITS = {
  titleMaxLength: 100,
  bodyMaxLength: 250,
};

const NOTIFICATION_TYPES = [
  { id: 'welcome', label: 'Welcome Message', icon: Campaign },
  { id: 'account-setup-completed', label: 'Account Setup Completed', icon: CheckCircle },
  { id: 'account-setup-incomplete', label: 'Account Setup Incomplete', icon: Warning },
  { id: 'account-status-change', label: 'Account Status Change', icon: Person },
  { id: 'important-announcement', label: 'Important Announcement', icon: Announcement },
  { id: 'maintenance-alert', label: 'Maintenance Alert', icon: Warning },
  { id: 'kyc-reminder', label: 'KYC Reminder', icon: Description },
  { id: 'support-required', label: 'Support Required', icon: Help },
  { id: 'results-available', label: 'Results Available', icon: Assignment },
  { id: 'leaderboard-update', label: 'Leaderboard Update', icon: TrendingUp },
  { id: 'reward-eligibility', label: 'Reward Eligibility', icon: EmojiEvents },
  { id: 'reward-approved', label: 'Reward Approved', icon: CheckCircle },
  { id: 'reward-processed', label: 'Reward Processed', icon: AttachMoney },
  { id: 'reward-declined', label: 'Reward Request Declined', icon: Cancel },
  { id: 'user-re-engagement', label: 'User Re-engagement', icon: Refresh },
  { id: 'first-prediction-reminder', label: 'First Prediction Reminder', icon: AutoAwesome },
  { id: 'new-matchday', label: 'New Matchday Available', icon: CalendarToday },
  { id: 'prediction-locked', label: 'Prediction Locked', icon: Lock },
  { id: 'match-ended', label: 'Match Ended', icon: EventAvailable },
  { id: 'new-poll', label: 'New Poll Available', icon: Assessment },
  { id: 'poll-results', label: 'Poll Results Announced', icon: Schedule },
  { id: 'prediction-reminder', label: 'Prediction Reminder', icon: NotificationsActive },
  { id: 'match-started', label: 'Match Started', icon: PlayArrow },
  { id: 'first-prediction', label: 'First Prediction Made', icon: StarBorder },
  { id: 'poll-ending-soon', label: 'Poll Ending Soon', icon: Schedule },
  { id: 'first-poll-vote', label: 'First Poll Vote Cast', icon: ThumbUp },
];

const AUDIENCE_OPTIONS = [
  { id: 'all', label: 'All Users', icon: People, description: 'All registered users' },
  { id: 'active-30', label: 'Active Users (30 days)', icon: People, description: 'Users active in last 30 days' },
  { id: 'inactive', label: 'Inactive Users', icon: Person, description: 'Inactive users' },
  { id: 'winners', label: 'Winners', icon: Star, description: 'Users who have won rewards' },
  { id: 'flagged', label: 'Flagged Users', icon: Flag, description: 'Users flagged for review' },
  { id: 'by-country', label: 'By Country', icon: Public, description: 'Filter by country' },
  { id: 'by-league', label: 'By League Preference', icon: SportsSoccer, description: 'Filter by league preference' },
  { id: 'by-club', label: 'By Club Preference', icon: Favorite, description: 'Filter by club preference' },
];

const NotificationFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'important-announcement',
    audience: 'all',
    scheduleForLater: false,
    scheduledAt: null,
    deepLink: '',
  });

  useEffect(() => {
    const loadNotificationData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (isEditMode && id) {
          const response = await getNotificationById(id);
          
          if (response.success && response.data) {
            const notification = response.data;
            setFormData({
              title: notification.title || '',
              body: notification.body || '',
              type: notification.type || 'important-announcement',
              audience: notification.audience || 'all',
              scheduleForLater: notification.status === 'scheduled' && !!notification.scheduledAt,
              scheduledAt: notification.scheduledAt ? new Date(notification.scheduledAt) : null,
              deepLink: notification.deepLink || '',
            });
          } else {
            setError(response.error || 'Failed to load notification');
          }
        }
      } catch (error) {
        console.error('Error loading notification:', error);
        setError(error.message || 'An error occurred while loading notification');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      loadNotificationData();
    } else {
      setLoading(false);
    }
  }, [id, isEditMode]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveAsDraft = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await saveNotificationAsDraft(formData);

      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || 'Notification saved as draft successfully',
          severity: 'success',
        });
        setTimeout(() => {
          navigate(constants.routes.notifications);
        }, 1500);
      } else {
        setError(response.error || 'Failed to save notification as draft');
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSendOrSchedule = async () => {
    if (!formData.title || !formData.body) {
      setError('Title and message are required');
      return;
    }

    if (formData.scheduleForLater && !formData.scheduledAt) {
      setError('Please select a schedule date and time');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let response;
      if (isEditMode && id) {
        // Update existing notification
        response = await updateNotification(id, {
          ...formData,
          status: formData.scheduleForLater ? 'scheduled' : 'sent',
        });
      } else {
        // Create new notification
        response = await createNotification({
          ...formData,
          status: formData.scheduleForLater ? 'scheduled' : 'sent',
        });
      }

      if (response.success) {
        setSnackbar({
          open: true,
          message: response.message || (formData.scheduleForLater 
            ? 'Notification scheduled successfully' 
            : 'Notification sent successfully'),
          severity: 'success',
        });
        setTimeout(() => {
          navigate(constants.routes.notifications);
        }, 1500);
      } else {
        setError(response.error || 'Failed to send/schedule notification');
      }
    } catch (error) {
      console.error('Error saving notification:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  const selectedType = NOTIFICATION_TYPES.find((t) => t.id === formData.type) || NOTIFICATION_TYPES[4];
  const selectedAudience = AUDIENCE_OPTIONS.find((a) => a.id === formData.audience) || AUDIENCE_OPTIONS[0];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        {/* Error Alert */}
        {error && (
          <Alert 
            severity="error" 
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: '12px' }}
          >
            {error}
          </Alert>
        )}

        {/* Snackbar for success messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate(constants.routes.notifications)}
            sx={{
              backgroundColor: colors.brandRed,
              color: colors.brandWhite,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2,
              py: 1,
              mb: 2,
              '&:hover': {
                backgroundColor: colors.brandDarkRed,
              },
            }}
          >
            Back to Notifications
          </Button>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.brandBlack,
              fontSize: { xs: 24, md: 32 },
              mb: 0.5,
            }}
          >
            {isEditMode ? 'Edit Notification' : 'Create New Notification'}
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>
            Compose and send push notification
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Form Section */}
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                padding: 3,
                borderRadius: '20px',
                border: `1.5px solid ${colors.divider}33`,
                boxShadow: `0 8px 20px ${colors.shadow}14`,
              }}
            >
              {/* Section Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: colors.brandRed,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Description sx={{ fontSize: 24, color: colors.brandWhite }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Notification Details
                </Typography>
              </Box>

              {/* Admin Info Banner */}
              <Box sx={{
                mb: 4,
                p: 2,
                borderRadius: '12px',
                backgroundColor: `${colors.info}1A`,
                border: `1px solid ${colors.info}33`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <InfoIcon sx={{ color: colors.info, fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: colors.info, fontWeight: 500, fontSize: 13 }}>
                  Notifications are one-way system announcements. Users cannot reply in Phase 1.
                </Typography>
              </Box>

              {/* Notification Type Selector */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>
                  Notification Type <span style={{ color: colors.error }}>*</span>
                </Typography>
                <Grid container spacing={1.5}>
                  {NOTIFICATION_TYPES.map((type) => {
                    const isSelected = formData.type === type.id;
                    const Icon = type.icon;
                    return (
                      <Grid item xs={6} sm={4} md={3} key={type.id}>
                        <Box
                          onClick={() => handleChange('type', type.id)}
                          sx={{
                            padding: 2,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? colors.brandRed : colors.divider}66`,
                            backgroundColor: isSelected ? colors.brandRed : `${colors.divider}1A`,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: colors.brandRed,
                              backgroundColor: isSelected ? colors.brandRed : `${colors.divider}26`,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <Icon
                              sx={{
                                fontSize: 24,
                                color: isSelected ? colors.brandWhite : colors.textSecondary,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isSelected ? 700 : 600,
                                color: isSelected ? colors.brandWhite : colors.textSecondary,
                                fontSize: 12,
                                textAlign: 'center',
                              }}
                            >
                              {type.label}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Title Field with Character Counter */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Title <span style={{ color: colors.error }}>*</span>
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    placeholder={`Enter notification title (max ${NOTIFICATION_LIMITS.titleMaxLength} chars)`}
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                    inputProps={{ maxLength: NOTIFICATION_LIMITS.titleMaxLength }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, color: colors.brandRed }}>
                          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Aa</Typography>
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: colors.brandWhite,
                        '& fieldset': {
                          borderColor: `${colors.divider}66`,
                        },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 12,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: colors.textSecondary,
                      }}
                    >
                      {formData.title.length}/{NOTIFICATION_LIMITS.titleMaxLength}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Message Field with Character Counter */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Message <span style={{ color: colors.error }}>*</span>
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    placeholder={`Enter notification message (max ${NOTIFICATION_LIMITS.bodyMaxLength} chars)`}
                    value={formData.body}
                    onChange={(e) => handleChange('body', e.target.value)}
                    required
                    inputProps={{ maxLength: NOTIFICATION_LIMITS.bodyMaxLength }}
                    InputProps={{
                      startAdornment: (
                        <Box sx={{ mr: 1, mt: 1, color: colors.brandRed }}>
                          <Typography sx={{ fontSize: 16 }}>☰</Typography>
                        </Box>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: colors.brandWhite,
                        '& fieldset': {
                          borderColor: `${colors.divider}66`,
                        },
                      },
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 12,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: colors.textSecondary,
                      }}
                    >
                      {formData.body.length}/{NOTIFICATION_LIMITS.bodyMaxLength}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Deep Link Field */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                  Deep Link
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Optional. Used to link users to a specific app screen (e.g. Match, Poll, Rewards)"
                  value={formData.deepLink}
                  onChange={(e) => handleChange('deepLink', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, color: colors.brandRed }}>
                        <LinkIcon sx={{ fontSize: 18 }} />
                      </Box>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: colors.brandWhite,
                      '& fieldset': {
                        borderColor: `${colors.divider}66`,
                      },
                    },
                  }}
                />
              </Box>

              {/* Target Audience Selector */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: 14 }}>
                  Target Audience
                </Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1.5, display: 'block', fontSize: 12 }}>
                  Some audience filters are reserved for future targeting logic (Phase 2).
                </Typography>
                <Grid container spacing={1.5}>
                  {AUDIENCE_OPTIONS.map((audience) => {
                    const isSelected = formData.audience === audience.id;
                    const Icon = audience.icon;
                    return (
                      <Grid item xs={6} sm={4} md={3} key={audience.id}>
                        <Box
                          onClick={() => handleChange('audience', audience.id)}
                          sx={{
                            padding: 2,
                            borderRadius: '12px',
                            cursor: 'pointer',
                            border: `1.5px solid ${isSelected ? colors.brandRed : colors.divider}66`,
                            backgroundColor: isSelected ? colors.brandRed : colors.brandWhite,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: colors.brandRed,
                            },
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <Icon
                              sx={{
                                fontSize: 24,
                                color: isSelected ? colors.brandWhite : colors.textSecondary,
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isSelected ? 700 : 600,
                                color: isSelected ? colors.brandWhite : colors.textSecondary,
                                fontSize: 12,
                                textAlign: 'center',
                              }}
                            >
                              {audience.label}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>

              {/* Delivery Schedule */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, fontSize: 14 }}>
                  Delivery Schedule
                </Typography>
                <Box
                  sx={{
                    padding: 2,
                    borderRadius: '14px',
                    backgroundColor: colors.brandWhite,
                    border: `1.5px solid ${colors.divider}33`,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.scheduleForLater}
                        onChange={(e) => handleChange('scheduleForLater', e.target.checked)}
                        sx={{
                          color: colors.brandRed,
                          '&.Mui-checked': {
                            color: colors.brandRed,
                          },
                        }}
                      />
                    }
                    label="Schedule for later"
                  />
                  {formData.scheduleForLater && (
                    <Box sx={{ mt: 2 }}>
                      <DateTimePicker
                        label="Schedule Date & Time"
                        value={formData.scheduledAt || new Date()}
                        onChange={(date) => handleChange('scheduledAt', date)}
                        minDateTime={new Date()}
                        disabled={false}
                        slotProps={{
                          textField: {
                            sx: { borderRadius: '12px' },
                            helperText: "Scheduled time is based on system timezone."
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button
                  variant="outlined"
                  startIcon={<Description />}
                  onClick={handleSaveAsDraft}
                  disabled={!!saving}
                  sx={{
                    flex: 1,
                    borderColor: colors.brandRed,
                    borderWidth: 2,
                    color: colors.brandRed,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '20px',
                    py: 1.5,
                    backgroundColor: colors.brandWhite,
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: colors.brandRed,
                      backgroundColor: `${colors.brandRed}0D`,
                    },
                  }}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={handleSendOrSchedule}
                  disabled={!!saving || !formData.title || !formData.body}
                  sx={{
                    flex: 1,
                    background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '20px',
                    py: 1.5,
                    '&:disabled': {
                      backgroundColor: colors.backgroundLight,
                    },
                  }}
                >
                  Send Now
                </Button>
              </Box>
            </Card>
          </Grid>

          {/* Preview Section */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                padding: 3,
                borderRadius: '20px',
                border: `1.5px solid ${colors.divider}33`,
                position: 'sticky',
                top: 24,
                boxShadow: `0 8px 20px ${colors.shadow}14`,
              }}
            >
              {/* Preview Header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: colors.info,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Smartphone sx={{ fontSize: 24, color: colors.brandWhite }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Preview
                </Typography>
              </Box>

              {/* Mobile Preview */}
              <Box
                sx={{
                  padding: 2.5,
                  borderRadius: '16px',
                  backgroundColor: `${colors.backgroundLight}80`,
                  border: `1px solid ${colors.divider}33`,
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '8px',
                      background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        backgroundColor: colors.brandWhite,
                        borderRadius: '4px',
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 14 }}>
                      CeeBee Predict
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                      now
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: formData.title ? colors.brandBlack : colors.textSecondary,
                    mb: 1,
                  }}
                >
                  {formData.title || 'Notification Title'}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 13,
                    color: formData.body ? colors.textSecondary : colors.textSecondary,
                    mb: 2,
                  }}
                >
                  {formData.body || 'Your notification message will appear here...'}
                </Typography>
                <Box sx={{ pt: 2, borderTop: `1px solid ${colors.divider}33` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                      Type
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 12 }}>
                      {selectedType.label}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                      Audience
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: 12 }}>
                      {selectedAudience.label}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default NotificationFormPage;
