import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  Person,
  SportsSoccer,
  AccessTime,
  CheckCircle,
  Cancel,
  Star,
  CalendarToday,
  Shield,
  Diamond,
  EmojiEvents,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import { format } from 'date-fns';
import { getPredictionGroup, formatPredictions, getPredictionById } from '../services/predictionsService';

const PredictionDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);
  const [predictions, setPredictions] = useState([]);


  useEffect(() => {
    const loadPredictionDetails = async () => {
      try {
        setLoading(true);
        
        const decodedId = decodeURIComponent(id);
        
        if (!decodedId) {
          console.error('Invalid prediction ID');
          setLoading(false);
          return;
        }

        // Fetch prediction details from API using /api/predictions/admin/{id}
        const result = await getPredictionById(decodedId);

        if (result.success && result.data) {
          const apiData = result.data;
          const prediction = apiData.prediction || {};
          const fixture = apiData.fixture || {};
          const user = apiData.user || {};
          const matchSummary = apiData.matchSummary || {};
          
          // Get actual result from fixture
          let actualResult = null;
          if (fixture.homeScore !== null && fixture.homeScore !== undefined && 
              fixture.awayScore !== null && fixture.awayScore !== undefined) {
            actualResult = `${fixture.homeScore}-${fixture.awayScore}`;
          }
          
          // Format prediction data for display
          const formattedPrediction = {
            id: prediction._id || decodedId,
            predictionId: prediction.predictionId || prediction._id,
            predictionType: prediction.predictionType || 'match_result',
            prediction: prediction.predictionValue || `${prediction.homeGoals || 0}-${prediction.awayGoals || 0}`,
            predictedHomeScore: prediction.homeGoals || null,
            predictedAwayScore: prediction.awayGoals || null,
            firstGoalScorer: prediction.firstPlayer || '',
            firstGoalMinute: prediction.firstGoalMinutes || null,
            goalRange: prediction.goalRange || '',
            predictionTime: prediction.predictedAt ? new Date(prediction.predictedAt) : new Date(),
            status: prediction.status || 'ongoing',
            predictionStatus: prediction.status || 'ongoing',
            actualResult: actualResult,
            matchStatus: fixture.status || 'ongoing',
            spStatus: prediction.spStatus === 'AWARDED' ? 'awarded' : 
                      prediction.spStatus === 'NOT AWARDED' ? 'not_awarded' : 'pending',
            spAwarded: prediction.spAwarded || 0,
            points: prediction.spAwarded || 0,
            isCorrect: prediction.status === 'correct',
            correctness: prediction.correctnessStatus === 'CORRECT' ? 'won' : 
                        prediction.correctnessStatus === 'INCORRECT' ? 'lost' : 'pending',
            scorelineCorrect: prediction.scorelineCorrect || false,
            firstPlayerCorrect: prediction.firstPlayerCorrect || false,
            goalRangeCorrect: prediction.goalRangeCorrect || false,
            firstGoalMinutesCorrect: prediction.firstGoalMinutesCorrect || false,
            evaluatedAt: prediction.evaluatedAt ? new Date(prediction.evaluatedAt) : null,
          };
          
          setGroupData({
            userId: user._id || '',
            username: user.username || user.fullName || 'Unknown User',
            userEmail: user.email || '',
            userCountry: user.country || '',
            userTotalPredictions: matchSummary.totalPredictions || 0,
            userAccuracy: matchSummary.correctPredictions && matchSummary.totalPredictions 
              ? ((matchSummary.correctPredictions / matchSummary.totalPredictions) * 100).toFixed(1) 
              : 0,
            matchId: fixture.matchId || fixture._id || '',
            matchName: fixture.matchName || `${fixture.homeTeam || 'TBD'} vs ${fixture.awayTeam || 'TBD'}`,
            homeTeam: fixture.homeTeam || 'TBD',
            awayTeam: fixture.awayTeam || 'TBD',
            fixtureId: fixture._id || '',
            matchStatus: fixture.status || 'ongoing',
            actualResult: actualResult,
            totalPredictions: matchSummary.totalPredictions || 0,
            totalSPWon: matchSummary.totalSPWon || 0,
            isCommunityFeatured: fixture.isCommunityFeatured || false,
            hot: fixture.isFeatured || fixture.isCeBeFeatured || fixture.isCommunityFeatured || false,
          });
          
          // Set as single prediction array for display
          setPredictions([formattedPrediction]);
        } else {
          // API call failed - show error state
          console.error('Failed to load prediction details from API:', result.error);
          setGroupData(null);
          setPredictions([]);
        }
      } catch (error) {
        console.error('Error loading prediction details:', error);
        setGroupData(null);
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadPredictionDetails();
    }
  }, [id]);

  const getTypeChip = (type) => {
    const typeMap = {
      'correct_score': { label: 'Correct Score', color: colors.brandRed },
      'goal_range': { label: 'Goal Range', color: colors.warning },
      'match_result': { label: 'Match Result', color: colors.info },
      'both_teams_score': { label: 'Both Teams Score', color: colors.success },
    };

    const config = typeMap[type] || typeMap['correct_score'];

    return (
      <Chip
        icon={<Diamond sx={{ fontSize: 14 }} />}
        label={config.label}
        sx={{
          backgroundColor: `${config.color}20`,
          color: config.color,
          border: `1.5px solid ${config.color}40`,
          fontWeight: 700,
          fontSize: 12,
          height: 28,
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

  if (!groupData || predictions.length === 0) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(constants.routes.predictions)}
          sx={{
            mb: 3,
            color: colors.brandRed,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Back to Predictions
        </Button>
        <Typography variant="h6" sx={{ color: colors.textSecondary }}>
          Prediction not found
        </Typography>
      </Box>
    );
  }

  // Calculate total SP won across all predictions
  const totalSP = predictions.reduce((sum, pred) => sum + (pred.spAwarded || 0), 0);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(constants.routes.predictions)}
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
        Back to Predictions
      </Button>

      {/* 1. Match Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: '20px',
          background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
          boxShadow: `0 6px 18px ${colors.brandRed}40`,
          overflow: 'hidden',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems="center">
            {/* Match Info */}
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={`Match ID: ${groupData.fixtureId || groupData.matchId}`}
                  sx={{
                    backgroundColor: colors.brandWhite,
                    color: colors.brandRed,
                    fontWeight: 700,
                    fontSize: 11,
                    height: 28,
                    borderRadius: '8px',
                  }}
                />
                {(groupData.hot || groupData.isCommunityFeatured) && (
                  <>
                    {groupData.isCommunityFeatured && (
                      <Chip label="Featured Team" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.3)', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', fontWeight: 700, height: 24 }} />
                    )}
                    {groupData.hot && (
                      <Chip label="Featured Fixture" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 600, height: 24 }} />
                    )}
                  </>
                )}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: colors.brandWhite, mb: 2, fontSize: { xs: 28, md: 36 } }}>
                {groupData.matchName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Chip
                  icon={<SportsSoccer sx={{ fontSize: 16 }} />}
                  label={`${groupData.totalPredictions || predictions.length} Predictions Made`}
                  sx={{
                    backgroundColor: `${colors.brandWhite}20`,
                    color: colors.brandWhite,
                    fontWeight: 600,
                    border: `1px solid ${colors.brandWhite}40`,
                  }}
                />
                {groupData.actualResult && (
                  <Chip
                    label={`Final Score: ${groupData.actualResult}`}
                    sx={{
                      backgroundColor: colors.brandWhite,
                      color: colors.brandRed,
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>
            </Grid>
            {/* Match Status */}
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Chip
                label={groupData.matchStatus?.toUpperCase() || 'ONGOING'}
                sx={{
                  backgroundColor: groupData.matchStatus === 'completed' ? colors.success : colors.warning,
                  color: colors.brandWhite,
                  fontWeight: 700,
                  fontSize: 13,
                  height: 32,
                  px: 2,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 2. User Basic Profile */}
      <Card sx={{ mb: 3, borderRadius: '16px' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 12px ${colors.brandRed}40`,
              }}
            >
              <Person sx={{ fontSize: 32, color: colors.brandWhite }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                {groupData.username}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                {groupData.userEmail}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={groupData.userCountry}
                  size="small"
                  sx={{ bgcolor: `${colors.info}20`, color: colors.info, fontWeight: 600 }}
                />
                <Chip
                  label={`${groupData.userTotalPredictions} Total Predictions`}
                  size="small"
                  sx={{ bgcolor: `${colors.brandRed}20`, color: colors.brandRed, fontWeight: 600 }}
                />
                <Chip
                  label={`${groupData.userAccuracy}% Accuracy`}
                  size="small"
                  sx={{ bgcolor: `${colors.success}20`, color: colors.success, fontWeight: 600 }}
                />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 3. Each Match Details for Each Prediction */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: colors.brandBlack }}>
        Prediction Breakdown
      </Typography>

      {predictions.map((pred, index) => (
        <Card key={pred.id} sx={{ mb: 2, borderRadius: '16px', border: `2px solid ${colors.divider}` }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                Prediction #{index + 1}
              </Typography>
                <Chip
                  label={`ID: ${pred.id || 'N/A'}`}
                  size="small"
                  sx={{
                    backgroundColor: '#FFE5E5',
                    color: colors.brandRed,
                    fontWeight: 600,
                    fontSize: 10,
                    height: 24,
                    borderRadius: '6px',
                  }}
                />
              </Box>
              {getTypeChip(pred.predictionType)}
            </Box>
            <Grid container spacing={2.5}>
              {/* Match */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Match</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack, textAlign: 'right' }}>{pred.matchName}</Typography>
                </Box>
              </Grid>
              {/* Match ID */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Match ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>{pred.fixtureId || pred.matchId}</Typography>
                </Box>
              </Grid>
              {/* Prediction ID */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Prediction ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>{pred.id || 'N/A'}</Typography>
                </Box>
              </Grid>
              {/* Prediction Type */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Prediction Type</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                    {pred.predictionType.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </Typography>
                </Box>
              </Grid>
              {/* Prediction */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Prediction</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandRed }}>{pred.prediction}</Typography>
                </Box>
              </Grid>
              {/* Prediction Time */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Prediction Time</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                    {format(pred.predictionTime, 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Box>
              </Grid>
              {/* Actual Result */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Actual Result</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                    {pred.actualResult || 'Pending'}
                  </Typography>
                </Box>
              </Grid>
              {/* SP Status */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>SP Status</Typography>
                  <Chip
                    label={pred.spStatus === 'awarded' ? 'AWARDED' : pred.spStatus === 'not_awarded' ? 'NOT AWARDED' : 'PENDING'}
                    size="small"
                    color={pred.spStatus === 'awarded' ? 'success' : pred.spStatus === 'not_awarded' ? 'error' : 'default'}
                    sx={{ fontWeight: 700, height: 24 }}
                  />
                </Box>
              </Grid>
              {/* Correctness */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: `1px solid ${colors.divider}` }}>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>Correctness</Typography>
                  {pred.correctness === 'won' ? (
                    <Chip
                      icon={<CheckCircle sx={{ fontSize: 14 }} />}
                      label="WON"
                      size="small"
                      sx={{ bgcolor: colors.success, color: colors.brandWhite, fontWeight: 700, height: 24 }}
                    />
                  ) : pred.correctness === 'lost' ? (
                    <Chip
                      icon={<Cancel sx={{ fontSize: 14 }} />}
                      label="LOST"
                      size="small"
                      sx={{ bgcolor: colors.error, color: colors.brandWhite, fontWeight: 700, height: 24 }}
                    />
                  ) : (
                    <Chip label="PENDING" size="small" sx={{ bgcolor: colors.warning, color: colors.brandWhite, fontWeight: 700, height: 24 }} />
                  )}
                </Box>
              </Grid>
              {/* SP Value */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.5, bgcolor: `${colors.brandRed}10`, px: 2, borderRadius: '8px', mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Star sx={{ fontSize: 20, color: colors.brandRed }} />
                    <Typography variant="body1" sx={{ color: colors.brandRed, fontWeight: 700 }}>SP Value</Typography>
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandRed }}>
                    {pred.spAwarded || 0} SP
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      {/* 4. Overall Match Total for SP */}
      <Card sx={{ mb: 3, borderRadius: '16px', background: `linear-gradient(135deg, ${colors.success}20 0%, ${colors.success}10 100%)`, border: `2px solid ${colors.success}` }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <EmojiEvents sx={{ fontSize: 32, color: colors.success }} />
                <Box>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                    Total SP Won for This Match
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: colors.success }}>
                    {totalSP} SP
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 0.5 }}>
                From {predictions.length} Predictions
              </Typography>
              <Chip
                icon={<Star sx={{ fontSize: 16 }} />}
                label={`${predictions.filter(p => p.correctness === 'won').length} Correct`}
                sx={{
                  bgcolor: colors.success,
                  color: colors.brandWhite,
                  fontWeight: 700,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Immutable Record Notice */}
      <Alert
        icon={<Shield sx={{ fontSize: 20 }} />}
        sx={{
          borderRadius: '12px',
          backgroundColor: `${colors.info}20`,
          border: `1.5px solid ${colors.info}40`,
          '& .MuiAlert-icon': {
            color: colors.info,
          },
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, color: colors.info, fontSize: 14, mb: 0.5 }}>
          Immutable Record
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
          All predictions are permanent audit records and cannot be modified or deleted.
        </Typography>
      </Alert>
    </Box>
  );
};

export default PredictionDetailsPage;
