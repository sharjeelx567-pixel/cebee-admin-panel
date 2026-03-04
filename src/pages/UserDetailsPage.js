import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  CheckCircle,
  Cancel,
  Flag,
  TrendingUp,
  BarChart,
  EmojiEvents,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import SearchBar from '../components/common/SearchBar';


import { format } from 'date-fns';
import { VerifiedUser, Security, Edit, Gavel, TimerOff, AssignmentInd } from '@mui/icons-material';
import { getUserDetails, requestKYC, verifyKYC, rejectKYC, expireKYC, flagUser, updateKycNotes } from '../services/usersService';

const UserDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [kycData, setKycData] = useState({
    status: 'not_submitted', // not_submitted, pending, verified, rejected, expired
    submittedAt: null,
    verifiedAt: null,
    verifiedBy: null,
    riskLevel: 'none',
    notes: ''
  });

  // KYC Notes State
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [noteTemp, setNoteTemp] = useState('');
  
  // Flag User State
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');

  useEffect(() => {
    if (kycData.notes) setNoteTemp(kycData.notes);
  }, [kycData.notes]);

  const handleSaveNotes = () => {
    handleKycUpdate({ notes: noteTemp });
    setIsEditingNotes(false);
  };

  useEffect(() => {
    loadUserData();
  }, [id]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      if (!id) {
        console.error('User ID is missing');
        setUser(null);
        return;
      }

      const result = await getUserDetails(id, { activityLimit: 50 });
      
      if (result.success && result.data) {
        const data = result.data;
        
        // Map backend response to frontend format
        const profile = data.profile || {};
        const kyc = data.kyc || {};
        const points = data.points || {};
        const breakdown = data.breakdown || {};
        const activityLog = data.activityLog || [];

        // Helper function to safely parse dates
        const parseDate = (dateString) => {
          if (!dateString) return null;
          try {
            const parsed = new Date(dateString);
            return isNaN(parsed.getTime()) ? null : parsed;
          } catch (e) {
            console.warn('Failed to parse date:', dateString, e);
            return null;
          }
        };

        // Set user data
        setUser({
          id: profile._id || profile.userId || id,
          userId: profile.userId || profile._id || id,
          username: profile.username || 'N/A',
          email: profile.email || 'N/A',
          fullName: profile.fullName || 'N/A',
          country: profile.country || null,
          isActive: profile.isActive ?? true,
          isVerified: profile.isVerified ?? false,
          isBlocked: profile.isBlocked ?? false,
          isFlagged: profile.status === 'Flagged' || (profile.fraudFlags && profile.fraudFlags.length > 0) || !!profile.flagReason,
          flagReason: profile.flagReason || '',
          flagSource: profile.flagSource || null,
          fraudFlags: profile.fraudFlags || [],
          spTotal: points.totalSPEarned || 0,
          spCurrent: points.currentSPBalance || 0,
          cpTotal: points.totalCPEarned || 0,
          cpCurrent: points.currentCPBalance || 0,
          totalPredictions: points.totalPredictionsMade || 0,
          totalReferrals: points.totalReferrals || 0,
          predictionAccuracy: points.predictionAccuracy || 0,
          totalPolls: points.totalPollsParticipated || 0,
          createdAt: parseDate(profile.registrationDate) || new Date(),
          lastLogin: parseDate(profile.lastLogin),
          spFromPredictions: breakdown.sp?.fromPredictions || 0,
          spFromDailyLogin: breakdown.sp?.fromDailyLoginBonus || 0,
          cpFromReferrals: breakdown.cp?.fromReferrals || 0,
          cpFromEngagement: breakdown.cp?.fromEngagement || 0,
          adminNotes: '', // Not available in backend response
        });

        // Set KYC data
        setKycData({
          status: kyc.status || 'not_submitted',
          submittedAt: parseDate(kyc.submittedAt),
          verifiedAt: parseDate(kyc.verifiedAt),
          verifiedBy: kyc.verifiedBy || null,
          riskLevel: kyc.riskLevel || 'none',
          notes: kyc.internalNotes || '',
        });

        // Map activity logs
        const mappedActivities = (activityLog || []).map((log, index) => {
          try {
            return {
              id: index + 1,
              type: log.activity || 'UNKNOWN',
              description: log.details || '',
              timestamp: parseDate(log.timestamp) ? parseDate(log.timestamp).toISOString() : new Date().toISOString(),
              icon: log.type || 'info',
            };
          } catch (e) {
            console.warn('Error mapping activity log:', log, e);
            return {
              id: index + 1,
              type: 'UNKNOWN',
              description: 'Activity log entry',
              timestamp: new Date().toISOString(),
              icon: 'info',
            };
          }
        });
        setActivities(mappedActivities);
      } else {
        console.error('Failed to load user:', result.error);
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKycUpdate = async (updates) => {
    try {
      let result;

      if (updates.notes !== undefined) {
        result = await updateKycNotes(id, updates.notes);
      } else if (updates.status === 'pending' || updates.status === 'under_review') {
        result = await requestKYC(id);
      } else if (updates.status === 'verified') {
        result = await verifyKYC(id, updates.riskLevel || 'none');
      } else if (updates.status === 'rejected') {
        result = await rejectKYC(id, updates.reason || '');
      } else if (updates.status === 'expired' || updates.status === 'not_submitted') {
        result = await expireKYC(id);
      }

      if (result && result.success) {
        setKycData((prev) => ({
          ...prev,
          ...updates,
          ...(result.data?.kyc || {}),
          ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
        }));
        await loadUserData();
      } else if (result) {
        console.error('Failed to update KYC:', result.error);
        alert(result.error || 'Failed to update KYC');
      }
    } catch (error) {
      console.error('Failed to update KYC data:', error);
      alert('An error occurred while updating KYC');
    }
  };

  const getAccountStatusChip = (user) => {
    if (!user) return null;
    if (user.isBlocked) {
      return <Chip label="Blocked" color="error" size="small" sx={{ fontWeight: 700 }} />;
    }
    if (user.isFlagged) {
      return <Chip label="Flagged" color="warning" size="small" sx={{ fontWeight: 700 }} />;
    }
    if (!user.isActive) {
      return <Chip label="Inactive" color="default" size="small" sx={{ fontWeight: 700 }} />;
    }
    return <Chip label="Active" color="success" size="small" sx={{ fontWeight: 700 }} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(constants.routes.users)}
          sx={{
            mb: 3,
            color: colors.brandRed,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: `${colors.brandRed}0D`,
            },
          }}
        >
          Back to Users
        </Button>
        <Alert severity="error" sx={{ borderRadius: '12px' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            User Not Found
          </Typography>
          <Typography variant="body2">
            The user you're looking for doesn't exist or couldn't be loaded.
          </Typography>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(constants.routes.users)}
        sx={{
          mb: 3,
          color: colors.brandRed,
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: `${colors.brandRed}0D`,
          },
        }}
      >
        Back to Users
      </Button>

      {/* Flagged Banner - Enhanced with flag source */}
      {user && user.isFlagged && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: '12px', border: `2px solid ${colors.error}` }}
          icon={<Flag fontSize="inherit" />}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 16 }}>
              Account Flagged
            </Typography>
            <Chip 
              label={user.flagSource || (user.fraudFlags && user.fraudFlags.length > 0 ? 'System Flagged' : 'Admin Flagged')}
              size="small"
              sx={{
                bgcolor: colors.error,
                color: colors.brandWhite,
                fontWeight: 700,
                fontSize: 11
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Reason: {user.flagReason || 'Suspicious Activity detected.'}
          </Typography>
          {user.fraudFlags && user.fraudFlags.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              {user.fraudFlags.map((flag, index) => (
                <Chip
                  key={index}
                  label={flag}
                  size="small"
                  sx={{
                    bgcolor: `${colors.error}20`,
                    color: colors.error,
                    fontWeight: 600,
                    fontSize: 11,
                    height: 24
                  }}
                />
              ))}
            </Box>
          )}
        </Alert>
      )}

      {/* User Info Card - New Layout */}
      {user && (
      <Card sx={{ p: 4, mb: 3, borderRadius: '16px' }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${colors.brandRed}4D`,
                mb: 2
              }}
            >
              <Person sx={{ fontSize: 60, color: colors.brandWhite }} />
            </Box>
            {getAccountStatusChip(user)}
            <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 1 }}>ID: {user.id}</Typography>
          </Grid>
          <Grid item xs={12} md={9}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, borderBottom: `1px solid ${colors.divider}`, pb: 1 }}>
              Profile Details
            </Typography>
            <Grid container spacing={2.5}>
              {/* Full Name */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Full Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack }}>{user.fullName || 'N/A'}</Typography>
                </Box>
              </Grid>
              {/* Username */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Username</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack }}>@{user.username || 'N/A'}</Typography>
                </Box>
              </Grid>
              {/* Email */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Email Address</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack }}>{user.email || 'N/A'}</Typography>
                </Box>
              </Grid>
              {/* Country */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Country</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack }}>{user.country || 'N/A'}</Typography>
                </Box>
              </Grid>
              {/* Registration Date */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Registration Date</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                    {user.createdAt ? format(user.createdAt, 'MMM dd, yyyy') : 'N/A'}
                  </Typography>
                </Box>
              </Grid>
              {/* Last Login */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Last Login</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                    {user.lastLogin ? format(user.lastLogin, 'MMM dd, yyyy HH:mm') : 'Never'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Card>
      )}

      {/* Admin Notes */}
      {user && (
      <Card sx={{ p: 3, mb: 3, borderRadius: '16px', bgcolor: '#FFF8F6', border: `1px solid ${colors.brandRed}20` }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
          <AssignmentInd sx={{ color: colors.brandRed }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.brandRed }}>General Admin Notes</Typography>
        </Box>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: colors.brandBlack }}>
          {user.adminNotes || 'No verification notes specific to this user.'}
        </Typography>
      </Card>
      )}

      {/* KYC Verification Section */}
      <Card sx={{ padding: 3, mb: 3, borderRadius: '16px', border: `1px solid ${colors.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <VerifiedUser sx={{ color: colors.brandRed, fontSize: 24 }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>KYC Verification</Typography>
            </Box>
          </Box>
          <Chip
            label={kycData.status.replace('_', ' ').toUpperCase()}
            color={kycData.status === 'verified' ? 'success' : kycData.status === 'rejected' ? 'error' : 'default'}
            sx={{ fontWeight: 700 }}
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Requested Date</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{kycData.submittedAt ? format(kycData.submittedAt, 'MMM dd, yyyy') : '-'}</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Submitted At</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{kycData.submittedAt ? format(kycData.submittedAt, 'MMM dd, yyyy HH:mm') : '-'}</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Verified / Rejected At</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{kycData.verifiedAt ? format(kycData.verifiedAt, 'MMM dd, yyyy HH:mm') : '-'}</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Verified By</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{kycData.verifiedBy || '-'}</Typography>
              </Grid>
              <Grid item xs={6} md={4}>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>Risk Level</Typography>
                <Chip label={kycData.riskLevel.toUpperCase()} size="small" color={kycData.riskLevel === 'high' ? 'error' : 'default'} sx={{ height: 24, fontSize: 11, fontWeight: 700 }} />
              </Grid>
            </Grid>
            {/* Notes section kept same */}
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Internal Notes (Admin Only)</Typography>
                {!isEditingNotes ? (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setIsEditingNotes(true)}
                    startIcon={<Edit sx={{ fontSize: 14 }} />}
                    sx={{ height: 28, minWidth: 'auto', px: 2 }}
                  >
                    Edit
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => {
                        setNoteTemp(kycData.notes);
                        setIsEditingNotes(false);
                      }}
                      sx={{ height: 28, color: colors.textSecondary }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSaveNotes}
                      sx={{ height: 28 }}
                    >
                      Save
                    </Button>
                  </Box>
                )}
              </Box>

              {isEditingNotes ? (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={noteTemp}
                  onChange={(e) => setNoteTemp(e.target.value)}
                  placeholder="Enter internal notes, rejection reasons, or manual check details..."
                  sx={{
                    bgcolor: '#FFF',
                    '& .MuiOutlinedInput-root': {
                      fontSize: 14,
                    }
                  }}
                />
              ) : (
                <Typography variant="body2" sx={{
                  p: 1.5,
                  bgcolor: '#F9FAFB',
                  borderRadius: '8px',
                  border: '1px solid #E5E7EB',
                  minHeight: '60px',
                  color: kycData.notes ? colors.brandBlack : colors.textSecondary,
                  fontStyle: kycData.notes ? 'normal' : 'italic'
                }}>
                  {kycData.notes || 'No notes added.'}
                </Typography>
              )}
            </Box>
          </Grid>
          {/* Actions kept same */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Admin Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" startIcon={<AssignmentInd />} size="small" onClick={() => handleKycUpdate({ status: 'pending' })}>
                Request KYC
              </Button>
              <Button variant="contained" color="success" startIcon={<CheckCircle />} size="small" onClick={() => handleKycUpdate({ status: 'verified', riskLevel: 'none' })}>
                Mark as Verified
              </Button>
              <Button variant="outlined" color="error" startIcon={<Gavel />} size="small" onClick={() => handleKycUpdate({ status: 'rejected', reason: '' })}>
                Mark as Rejected
              </Button>
              <Button variant="text" color="warning" startIcon={<TimerOff />} size="small" onClick={() => handleKycUpdate({ status: 'expired' })}>
                Mark as Expired
              </Button>
              {!user.isFlagged && (
                <Button 
                  variant="outlined" 
                  color="warning" 
                  startIcon={<Flag />} 
                  size="small" 
                  onClick={() => {
                    setFlagReason('');
                    setFlagDialogOpen(true);
                  }}
                >
                  Flag User
                </Button>
              )}
              {user.isFlagged && (
                <Button 
                  variant="outlined" 
                  color="success" 
                  startIcon={<CheckCircle />} 
                  size="small" 
                  onClick={async () => {
                    // Note: Backend doesn't have an unflag endpoint, 
                    // but we can clear flags by updating the user
                    // For now, we'll just reload the data
                    await loadUserData();
                    alert('User status refreshed');
                  }}
                >
                  Refresh Status
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Card>

      {/* Points & Performance */}
      {user && (
      <>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Points & Performance
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.brandRed}1A 0%, ${colors.brandRed}0D 100%)`,
              border: `1.5px solid ${colors.brandRed}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <TrendingUp sx={{ fontSize: 24, color: colors.brandRed }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Total SP Earned
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandRed }}>
              {(user.spTotal || 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.brandRed}1A 0%, ${colors.brandRed}0D 100%)`,
              border: `1.5px solid ${colors.brandRed}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <TrendingUp sx={{ fontSize: 24, color: colors.brandRed }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Current SP Balance
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandRed }}>
              {(user.spCurrent || 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.info}1A 0%, ${colors.info}0D 100%)`,
              border: `1.5px solid ${colors.info}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <BarChart sx={{ fontSize: 24, color: colors.info }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Total CP Earned
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>
              {(user.cpTotal || 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.info}1A 0%, ${colors.info}0D 100%)`,
              border: `1.5px solid ${colors.info}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <BarChart sx={{ fontSize: 24, color: colors.info }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Current CP Balance
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.info }}>
              {(user.cpCurrent || 0).toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.success}1A 0%, ${colors.success}0D 100%)`,
              border: `1.5px solid ${colors.success}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <BarChart sx={{ fontSize: 24, color: colors.success }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Total Predictions Made
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>
              {user.totalPredictions || 0}
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.success}1A 0%, ${colors.success}0D 100%)`,
              border: `1.5px solid ${colors.success}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <CheckCircle sx={{ fontSize: 24, color: colors.success }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Prediction Accuracy %
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>
              {(user.predictionAccuracy || 0).toFixed(1)}%
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.warning}1A 0%, ${colors.warning}0D 100%)`,
              border: `1.5px solid ${colors.warning}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <EmojiEvents sx={{ fontSize: 24, color: colors.warning }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Total Polls Participated
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.warning }}>
              {user.totalPolls || 0}
            </Typography>
          </Card>
        </Grid>
        {/* Total Referrals - Moved to last position */}
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2,
              background: `linear-gradient(135deg, ${colors.brandRed}1A 0%, ${colors.brandRed}0D 100%)`,
              border: `1.5px solid ${colors.brandRed}33`,
              borderRadius: '16px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <AssignmentInd sx={{ fontSize: 24, color: colors.brandRed }} />
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
                Total Referrals
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandRed }}>
              {user.totalReferrals || 0}
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* SP / CP Breakdown */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        SP / CP Breakdown
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '16px',
              background: colors.brandWhite,
              border: `1.5px solid ${colors.brandRed}26`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: colors.brandRed }}>
              SP Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                  SP from Predictions
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                  {(user.spFromPredictions || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                  SP from Daily Login Bonus
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                  {(user.spFromDailyLogin || 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '16px',
              background: colors.brandWhite,
              border: `1.5px solid ${colors.info}26`,
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: colors.info }}>
              CP Breakdown
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                  CP from Referrals
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                  {(user.cpFromReferrals || 0).toLocaleString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                  CP from Engagement
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                  {(user.cpFromEngagement || 0).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
      </>
      )}

      {/* Activity Log */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Activity Log
      </Typography>
      <Card sx={{ padding: 3, borderRadius: '16px' }}>
        <SearchBar
          value=""
          onChange={() => { }}
          placeholder="Search activities..."
          sx={{ mb: 2 }}
        />
        {activities.length === 0 ? (
          <Box sx={{ textAlign: 'center', padding: 4 }}>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              No activity logs available
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Activity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activities.map((activity) => {
                  let formattedDate = 'N/A';
                  try {
                    if (activity.timestamp) {
                      const date = new Date(activity.timestamp);
                      if (!isNaN(date.getTime())) {
                        formattedDate = format(date, 'MMM dd, yyyy • HH:mm');
                      }
                    }
                  } catch (e) {
                    console.warn('Error formatting activity timestamp:', activity.timestamp, e);
                  }
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>{activity.type || 'N/A'}</TableCell>
                      <TableCell>{activity.description || 'N/A'}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Flag User Dialog */}
      <Dialog
        open={flagDialogOpen}
        onClose={() => {
          setFlagDialogOpen(false);
          setFlagReason('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: colors.warning }}>
          Flag User
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              You are about to flag this user:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • User: {user && user.username ? user.username : 'N/A'}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • User ID: {user && user.id ? user.id : 'N/A'}
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
            Reason for Flagging <span style={{ color: colors.error }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={flagReason}
            onChange={(e) => setFlagReason(e.target.value)}
            placeholder="Enter the reason why this user is being flagged (e.g., Suspicious activity, Multiple accounts, etc.)"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
              }
            }}
          />
          <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 1, display: 'block' }}>
            This action will be logged and the user will be marked as flagged in the system.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => {
              setFlagDialogOpen(false);
              setFlagReason('');
            }}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={async () => {
              if (!flagReason.trim()) {
                alert('Please enter a reason for flagging this user');
                return;
              }
              
              const result = await flagUser(id, flagReason.trim(), []);
              
              if (result.success) {
              setFlagDialogOpen(false);
              setFlagReason('');
                alert('User flagged successfully');
                // Reload user data to get updated flag status
                await loadUserData();
              } else {
                alert(result.error || 'Failed to flag user');
              }
            }}
            variant="contained"
            startIcon={<Flag />}
            sx={{ 
              bgcolor: colors.warning,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#D97706' }
            }}
          >
            Flag User
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default UserDetailsPage;
