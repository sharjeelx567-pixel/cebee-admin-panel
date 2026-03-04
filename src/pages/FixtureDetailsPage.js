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
  Stepper,
  Step,
  StepLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  TextField,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ArrowBack,
  Schedule,
  Lock,
  PlayCircle,
  CheckCircle,
  SportsSoccer,
  AccessTime,
  HourglassEmpty,
  LocationOn,
  CalendarToday,
  People,
  ArrowUpward,
  Person,
  StopCircle,
  Save,
  Visibility,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { colors, constants } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import { getFixture, getFixturePredictions, updateFixtureStatus, endMatch, updateFixtureResults } from '../services/fixturesService';

const FixtureDetailsPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [fixture, setFixture] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [filteredPredictions, setFilteredPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [endMatchDialogOpen, setEndMatchDialogOpen] = useState(false);
  const [scoreForm, setScoreForm] = useState({
    homeScore: '',
    awayScore: '',
    firstGoalScorer: '',
    firstGoalMinute: '',
    markCompleted: true,
  });
  const [selectedFlowStatus, setSelectedFlowStatus] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Helper function to reload fixture data from API
  const reloadFixtureData = async () => {
    if (!id) return;
    try {
      const fixtureResult = await getFixture(id);
      if (fixtureResult.success && fixtureResult.data) {
        const fixtureData = fixtureResult.data.fixture || fixtureResult.data;
        
        if (!fixtureData || typeof fixtureData !== 'object' || Array.isArray(fixtureData)) {
          return;
        }
        
        // Format fixture data to match expected structure
        const formattedFixture = {
          id: fixtureData._id || fixtureData.id,
          matchId: fixtureData.matchId || fixtureData.match_id || fixtureData._id || fixtureData.id,
          homeTeam: fixtureData.homeTeam || fixtureData.home_team || '',
          awayTeam: fixtureData.awayTeam || fixtureData.away_team || '',
          league: fixtureData.league || fixtureData.leagueName || fixtureData.league_name || (fixtureData.leagueId?.league_name) || '',
          leagueId: fixtureData.leagueId?._id || fixtureData.leagueId || '',
          kickoffTime: (() => {
            const kickoff = fixtureData.kickoffTime || fixtureData.kickoff_time;
            if (!kickoff) return null;
            const date = new Date(kickoff);
            return isNaN(date.getTime()) ? null : date;
          })(),
          status: fixtureData.status || fixtureData.matchStatus || 'scheduled',
          matchStatus: fixtureData.matchStatus || fixtureData.status || 'scheduled',
          predictions: fixtureData.totalPredictions || fixtureData.predictionCount || fixtureData.prediction_count || 0,
          hot: fixtureData.isFeatured || fixtureData.isCeBeFeatured || false,
          cmdId: fixtureData.cmdId?._id || fixtureData.cmdId || (typeof fixtureData.cmdId === 'string' ? fixtureData.cmdId : ''),
          cmdName: fixtureData.cmdId?.name || fixtureData.cmdName || fixtureData.cmd_name || '',
          venue: fixtureData.venue || '',
          homeScore: fixtureData.homeScore || fixtureData.home_score || null,
          awayScore: fixtureData.awayScore || fixtureData.away_score || null,
          homeTeamLogo: fixtureData.homeTeamLogo || fixtureData.home_team_logo || null,
          awayTeamLogo: fixtureData.awayTeamLogo || fixtureData.away_team_logo || null,
          publishDateTime: (() => {
            const publish = fixtureData.publishDateTime || fixtureData.publish_date_time;
            if (!publish) return null;
            const date = new Date(publish);
            return isNaN(date.getTime()) ? null : date;
          })(),
          isCeBeFeatured: fixtureData.isCeBeFeatured || false,
          isCommunityFeatured: fixtureData.isCommunityFeatured || false,
          matchday: fixtureData.matchday || '',
          currentState: fixtureData.currentState || null,
          ...fixtureData,
        };
        
        setFixture(formattedFixture);
        
        // Update selected flow status from backend
        const backendMatchFlowStatus = formattedFixture.currentState || formattedFixture.matchStatus || null;
        if (backendMatchFlowStatus) {
          setSelectedFlowStatus(backendMatchFlowStatus);
        } else {
          const status = formattedFixture.status || 'scheduled';
          const statusMap = {
            'scheduled': 'predictionOpen',
            'published': 'predictionOpen',
            'predictionOpen': 'predictionOpen',
            'predictionLock': 'predictionLock',
            'predictionLocked': 'predictionLock',
            'live': 'live',
            'resultsProcessing': 'resultPending',
            'pending': 'resultPending',
            'resultPending': 'resultPending',
            'completed': 'completed',
          };
          setSelectedFlowStatus(statusMap[status] || 'predictionOpen');
        }
      }
    } catch (error) {
      console.error('Error reloading fixture data:', error);
    }
  };

  useEffect(() => {
    const loadFixtureData = async () => {
      try {
        setLoading(true);
        
        if (!id) {
          console.error('Fixture ID is missing');
          setLoading(false);
          return;
        }

        // Fetch fixture from API
        const fixtureResult = await getFixture(id);
        
        if (fixtureResult.success && fixtureResult.data) {
          // Backend returns { success: true, data: { fixture: {...} } }
          // The fixture object is nested in data.fixture
          const fixtureData = fixtureResult.data.fixture || fixtureResult.data;
          
          // Check if fixtureData is actually an object
          if (!fixtureData || typeof fixtureData !== 'object' || Array.isArray(fixtureData)) {
            console.error('Invalid fixture data structure:', fixtureData);
            setLoading(false);
            setFixture(null);
            return;
          }
          
          
          // Format fixture data to match expected structure
          let formattedFixture;
          try {
            formattedFixture = {
              id: fixtureData._id || fixtureData.id,
              matchId: fixtureData.matchId || fixtureData.match_id || fixtureData._id || fixtureData.id,
              homeTeam: fixtureData.homeTeam || fixtureData.home_team || '',
              awayTeam: fixtureData.awayTeam || fixtureData.away_team || '',
              league: fixtureData.league || fixtureData.leagueName || fixtureData.league_name || (fixtureData.leagueId?.league_name) || '',
              leagueId: fixtureData.leagueId?._id || fixtureData.leagueId || '',
              kickoffTime: (() => {
                const kickoff = fixtureData.kickoffTime || fixtureData.kickoff_time;
                if (!kickoff) return null;
                const date = new Date(kickoff);
                return isNaN(date.getTime()) ? null : date;
              })(),
              status: fixtureData.status || fixtureData.matchStatus || 'scheduled',
              matchStatus: fixtureData.matchStatus || fixtureData.status || 'scheduled',
              predictions: fixtureData.totalPredictions || fixtureData.predictionCount || fixtureData.prediction_count || 0,
              hot: fixtureData.isFeatured || fixtureData.isCeBeFeatured || false,
              cmdId: fixtureData.cmdId?._id || fixtureData.cmdId || (typeof fixtureData.cmdId === 'string' ? fixtureData.cmdId : ''),
              cmdName: fixtureData.cmdId?.name || fixtureData.cmdName || fixtureData.cmd_name || '',
              venue: fixtureData.venue || '',
              homeScore: fixtureData.homeScore || fixtureData.home_score || null,
              awayScore: fixtureData.awayScore || fixtureData.away_score || null,
              homeTeamLogo: fixtureData.homeTeamLogo || fixtureData.home_team_logo || null,
              awayTeamLogo: fixtureData.awayTeamLogo || fixtureData.away_team_logo || null,
              publishDateTime: (() => {
                const publish = fixtureData.publishDateTime || fixtureData.publish_date_time;
                if (!publish) return null;
                const date = new Date(publish);
                return isNaN(date.getTime()) ? null : date;
              })(),
              isCeBeFeatured: fixtureData.isCeBeFeatured || false,
              isCommunityFeatured: fixtureData.isCommunityFeatured || false,
              matchday: fixtureData.matchday || '',
              // Match flow status from backend
              currentState: fixtureData.currentState || null,
              // Include all other fields
              ...fixtureData,
            };
            
            console.log('Setting fixture state with formatted data:', formattedFixture);
            setFixture(formattedFixture);
            console.log('Fixture state set successfully');
            
            // Set loading to false IMMEDIATELY after fixture is set
            // Don't wait for predictions to load
            setLoading(false);
            console.log('Loading set to false');
            
            // Use match flow status from backend (currentState or matchStatus)
            // Backend provides currentState which represents the match flow status
            const backendMatchFlowStatus = formattedFixture.currentState || formattedFixture.matchStatus || null;
            
            // Map backend match flow status to frontend flow status
            // Backend values: predictionOpen, predictionLock, live, resultPending, completed
            // Frontend values: predictionOpen, predictionLock, live, resultPending, completed
            if (backendMatchFlowStatus) {
              // Direct mapping since backend and frontend use same values
              setSelectedFlowStatus(backendMatchFlowStatus);
            } else {
              // Fallback: if backend doesn't provide match flow status, use fixture status
              const status = formattedFixture.status || 'scheduled';
              const statusMap = {
                'scheduled': 'predictionOpen',
                'published': 'predictionOpen',
                'predictionOpen': 'predictionOpen',
                'predictionLock': 'predictionLock',
                'predictionLocked': 'predictionLock',
                'live': 'live',
                'resultsProcessing': 'resultPending',
                'pending': 'resultPending',
                'resultPending': 'resultPending',
                'completed': 'completed',
              };
              setSelectedFlowStatus(statusMap[status] || 'predictionOpen');
            }

            // Fetch predictions from API (async, don't block UI)
            getFixturePredictions(id, { limit: 1000 })
              .then(predictionsResult => {
                if (predictionsResult.success && predictionsResult.data) {
                  const predictionsArray = predictionsResult.data.predictions || predictionsResult.data || [];
                  const formattedPredictions = predictionsArray.map(pred => {
                    const user = pred.user || {};
                    const userId = user._id || pred.userId || pred.user_id || '';
                    const username = user.username || user.fullName || pred.username || pred.userName || 'Unknown User';
                    const userEmail = user.email || pred.userEmail || pred.user_email || '';
                    const homeGoals = pred.homeGoals ?? pred.predictedHomeScore ?? pred.homeScore;
                    const awayGoals = pred.awayGoals ?? pred.predictedAwayScore ?? pred.awayScore;
                    const parts = [];
                    if (homeGoals != null && awayGoals != null) {
                      parts.push(`${homeGoals}-${awayGoals}`);
                    }
                    if (pred.firstPlayer) {
                      parts.push(`1st: ${pred.firstPlayer}`);
                    }
                    if (pred.firstGoalMinutes != null && pred.firstGoalMinutes !== '') {
                      parts.push(`${pred.firstGoalMinutes}'`);
                    }
                    if (pred.goalRange) {
                      parts.push(`Range: ${pred.goalRange}`);
                    }
                    const predictionStr = parts.length > 0 ? parts.join(' • ') : '—';
                    return {
                      id: pred._id || pred.id,
                      userId: userId,
                      username,
                      userEmail,
                      userCountry: pred.userCountry || pred.user_country || '',
                      fixtureId: pred.fixture?._id || pred.fixtureId || pred.fixture_id || id,
                      homeTeam: pred.fixture?.homeTeam || pred.homeTeam || pred.home_team || formattedFixture.homeTeam,
                      awayTeam: pred.fixture?.awayTeam || pred.awayTeam || pred.away_team || formattedFixture.awayTeam,
                      predictedHomeScore: homeGoals ?? 0,
                      predictedAwayScore: awayGoals ?? 0,
                      firstGoalScorer: pred.firstPlayer || pred.firstGoalScorer || pred.first_goal_scorer || '',
                      firstGoalMinute: pred.firstGoalMinutes ?? pred.firstGoalMinute ?? pred.first_goal_minute ?? null,
                      createdAt: pred.predictedAt ? new Date(pred.predictedAt) : (pred.createdAt ? new Date(pred.createdAt) : pred.created_at ? new Date(pred.created_at) : new Date()),
                      points: pred.spAwarded ?? pred.points ?? 0,
                      isCorrect: pred.status === 'correct' || pred.isCorrect || pred.is_correct || false,
                      prediction: predictionStr,
                      status: pred.status || 'ongoing',
                    };
                  });
                  setPredictions(formattedPredictions);
                  setFilteredPredictions(formattedPredictions);
                } else {
                  setPredictions([]);
                  setFilteredPredictions([]);
                }
              })
              .catch(predError => {
                console.error('Error loading predictions:', predError);
                setPredictions([]);
                setFilteredPredictions([]);
              });
          } catch (formatError) {
            console.error('Error formatting fixture data:', formatError);
            setLoading(false);
            setFixture(null);
            return;
          }
        } else {
          console.error('Failed to load fixture:', fixtureResult);
          console.error('Error details:', fixtureResult.error);
          // Set loading to false even on error so UI doesn't hang
          setLoading(false);
          // Set empty fixture to show error state
          setFixture(null);
        }
      } catch (error) {
        console.error('Error loading fixture:', error);
      } finally {
        setLoading(false);
      }
    };
    loadFixtureData();
  }, [id]);

  // Update selected flow status when fixture status changes
  // Use backend match flow status (currentState or matchStatus) if available
  useEffect(() => {
    if (fixture) {
      // Use match flow status from backend (currentState or matchStatus)
      const backendMatchFlowStatus = fixture.currentState || fixture.matchStatus || null;
      
      if (backendMatchFlowStatus) {
        // Direct mapping since backend and frontend use same values
        setSelectedFlowStatus(backendMatchFlowStatus);
      } else {
        // Fallback: if backend doesn't provide match flow status, use fixture status
        const status = fixture.status || 'scheduled';
        const statusMap = {
          'scheduled': 'predictionOpen',
          'published': 'predictionOpen',
          'predictionOpen': 'predictionOpen',
          'predictionLock': 'predictionLock',
          'live': 'live',
          'resultsProcessing': 'resultPending',
          'pending': 'resultPending',
          'completed': 'completed',
        };
        setSelectedFlowStatus(statusMap[status] || 'predictionOpen');
      }
    }
  }, [fixture?.currentState, fixture?.matchStatus, fixture?.status]);

  useEffect(() => {
    const filterPredictions = () => {
      if (!searchQuery) {
        setFilteredPredictions(predictions);
        return;
      }
      const query = searchQuery.toLowerCase();
      const filtered = predictions.filter(
        (pred) =>
          pred.username?.toLowerCase().includes(query) ||
          pred.userId?.toLowerCase().includes(query) ||
          pred.email?.toLowerCase().includes(query) ||
          pred.fullName?.toLowerCase().includes(query)
      );
      setFilteredPredictions(filtered);
    };
    filterPredictions();
  }, [predictions, searchQuery]);

  const getSampleFixtures = () => {
    const now = new Date();
    return [
      // Match fixtures from FixturesPage - using same IDs
      {
        id: 'MATCH_001',
        matchId: 'MATCH_123',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        kickoffTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 1543,
        hot: true,
      },
      {
        id: 'MATCH_002',
        matchId: 'MATCH_124',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        league: 'La Liga',
        kickoffTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 2891,
        hot: true,
      },
      {
        id: 'MATCH_003',
        matchId: 'MATCH_125',
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        kickoffTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 1876,
        hot: false,
      },
      {
        id: 'MATCH_004',
        matchId: 'MATCH_126',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Dortmund',
        league: 'Bundesliga',
        kickoffTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
        matchStatus: 'resultsProcessing',
        status: 'resultsProcessing',
        homeScore: 3,
        awayScore: 1,
        firstGoalScorer: 'Kane',
        firstGoalMinute: '12',
        predictions: 1245,
        hot: false,
      },
      // Additional sample fixtures for variety
      {
        id: 'MATCH_001',
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-22T20:15:00'),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 0,
      },
      {
        id: 'MATCH_006',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        league: 'La Liga',
        kickoffTime: new Date('2026-01-25T20:15:00'),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 0,
      },
      {
        id: 'MATCH_007',
        homeTeam: 'Bayern Munich',
        awayTeam: 'Borussia Dortmund',
        league: 'Bundesliga',
        kickoffTime: new Date('2026-01-27T20:15:00'),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 0,
      },
      {
        id: 'MATCH_012',
        homeTeam: 'PSG',
        awayTeam: 'Marseille',
        league: 'Ligue 1',
        kickoffTime: new Date('2026-01-23T21:00:00'),
        matchStatus: 'scheduled',
        status: 'scheduled',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 0,
      },
      // Published fixtures
      {
        id: 'MATCH_014',
        homeTeam: 'Manchester City',
        awayTeam: 'Tottenham',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-21T15:00:00'),
        matchStatus: 'published',
        status: 'published',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 25,
      },
      {
        id: 'MATCH_015',
        homeTeam: 'AC Milan',
        awayTeam: 'Inter Milan',
        league: 'Serie A',
        kickoffTime: new Date('2026-01-21T20:00:00'),
        matchStatus: 'published',
        status: 'published',
        homeScore: undefined,
        awayScore: undefined,
        predictions: 18,
      },
      // Live fixtures
      {
        id: 'MATCH_003',
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        league: 'Premier League',
        kickoffTime: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        matchStatus: 'live',
        status: 'live',
        homeScore: 1,
        awayScore: 1,
        predictions: 52,
      },
      {
        id: 'MATCH_016',
        homeTeam: 'Leicester City',
        awayTeam: 'Southampton',
        league: 'Premier League',
        kickoffTime: new Date(now.getTime() - 0.5 * 60 * 60 * 1000),
        matchStatus: 'live',
        status: 'live',
        homeScore: 2,
        awayScore: 0,
        predictions: 31,
      },
      // Result Pending fixtures
      {
        id: 'MATCH_009',
        homeTeam: 'Everton',
        awayTeam: 'Fulham',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-20T18:15:00'),
        matchStatus: 'resultsProcessing',
        status: 'resultsProcessing',
        homeScore: 1,
        awayScore: 2,
        firstGoalScorer: '',
        firstGoalMinute: '',
        predictions: 45,
      },
      {
        id: 'MATCH_010',
        homeTeam: 'Tottenham',
        awayTeam: 'Newcastle',
        league: 'Premier League',
        kickoffTime: new Date(now.getTime() - 3 * 60 * 60 * 1000),
        matchStatus: 'resultsProcessing',
        status: 'resultsProcessing',
        homeScore: 2,
        awayScore: 1,
        firstGoalScorer: '',
        firstGoalMinute: '',
        predictions: 38,
      },
      {
        id: 'MATCH_011',
        homeTeam: 'Brighton',
        awayTeam: 'Crystal Palace',
        league: 'Premier League',
        kickoffTime: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        matchStatus: 'pending',
        status: 'pending',
        homeScore: 0,
        awayScore: 1,
        firstGoalScorer: '',
        firstGoalMinute: '',
        predictions: 22,
      },
      // Completed fixtures
      {
        id: 'MATCH_004',
        homeTeam: 'Newcastle',
        awayTeam: 'Brighton',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-19T20:15:00'),
        matchStatus: 'completed',
        status: 'completed',
        homeScore: 2,
        awayScore: 1,
        firstGoalScorer: 'Wilson',
        firstGoalMinute: 23,
        predictions: 48,
      },
      {
        id: 'MATCH_005',
        homeTeam: 'West Ham',
        awayTeam: 'Aston Villa',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-18T20:15:00'),
        matchStatus: 'completed',
        status: 'completed',
        homeScore: 1,
        awayScore: 1,
        firstGoalScorer: 'Watkins',
        firstGoalMinute: 15,
        predictions: 42,
      },
      {
        id: 'MATCH_008',
        homeTeam: 'Wolves',
        awayTeam: 'Crystal Palace',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-17T20:15:00'),
        matchStatus: 'completed',
        status: 'completed',
        homeScore: 3,
        awayScore: 0,
        firstGoalScorer: 'Neto',
        firstGoalMinute: 8,
        predictions: 35,
      },
      {
        id: 'MATCH_017',
        homeTeam: 'Burnley',
        awayTeam: 'Sheffield United',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-16T15:00:00'),
        matchStatus: 'completed',
        status: 'completed',
        homeScore: 2,
        awayScore: 2,
        firstGoalScorer: 'Brownhill',
        firstGoalMinute: 12,
        predictions: 28,
      },
      {
        id: 'MATCH_018',
        homeTeam: 'Brentford',
        awayTeam: 'Nottingham Forest',
        league: 'Premier League',
        kickoffTime: new Date('2026-01-15T17:30:00'),
        matchStatus: 'completed',
        status: 'completed',
        homeScore: 1,
        awayScore: 0,
        firstGoalScorer: 'Toney',
        firstGoalMinute: 34,
        predictions: 39,
      },
    ];
  };

  const getSamplePredictions = (fixtureId) => {
    // Sample predictions data matching the design
    return [
      {
        id: 'PRED_001',
        userId: 'USER001',
        username: 'john_doe',
        email: 'john@example.com',
        fullName: 'John Doe',
        prediction: 'Newcastle Win',
        predictionTime: new Date('2026-01-18T20:17:00'),
        status: 'won',
      },
      {
        id: 'PRED_002',
        userId: 'USER006',
        username: 'emma_davis',
        email: 'emma@example.com',
        fullName: 'Emma Davis',
        prediction: 'Brighton Win',
        predictionTime: new Date('2026-01-18T20:17:00'),
        status: 'lost',
      },
      {
        id: 'PRED_003',
        userId: 'USER007',
        username: 'alex_miller',
        email: 'alex@example.com',
        fullName: 'Alex Miller',
        prediction: 'Newcastle Win',
        predictionTime: new Date('2026-01-18T20:17:00'),
        status: 'won',
      },
    ];
  };

  const handleApproveMatch = () => {
    setApproveDialogOpen(true);
  };

  const confirmApproval = async () => {
    if (!id) return;
    
    try {
      setUpdating(true);
      // Approve means moving from scheduled to published/predictionOpen
      const result = await updateFixtureStatus(id, 'predictionOpen');
      
      if (result.success) {
        setIsApproved(true);
        setApproveDialogOpen(false);
        // Reload fixture data to get updated status from backend
        await reloadFixtureData();
        alert('Match details approved successfully!');
      } else {
        alert(result.error || 'Failed to approve match details');
      }
    } catch (error) {
      console.error('Error approving match:', error);
      alert('An error occurred while approving match details');
    } finally {
      setUpdating(false);
    }
  };

  const handleEndMatch = () => {
    setEndMatchDialogOpen(true);
  };

  const confirmEndMatch = async () => {
    if (!id) return;
    
    try {
      setUpdating(true);
      const result = await endMatch(id);
      
      if (result.success) {
        setEndMatchDialogOpen(false);
        // Reload fixture data to get updated status from backend
        await reloadFixtureData();
        alert('Match ended successfully. Match is now in Result Pending state. You can upload the score later.');
      } else {
        alert(result.error || 'Failed to end match');
      }
    } catch (error) {
      console.error('Error ending match:', error);
      alert('An error occurred while ending the match');
    } finally {
      setUpdating(false);
    }
  };

  const handleOpenScoreDialog = () => {
    setScoreForm({
      homeScore: fixture.homeScore || '',
      awayScore: fixture.awayScore || '',
      firstGoalScorer: fixture.firstGoalScorer || '',
      firstGoalMinute: fixture.firstGoalMinute || '',
      markCompleted: true,
    });
    setScoreDialogOpen(true);
  };

  const handleSaveScore = async () => {
    if (!id) return;
    
    // Validate scores - all required: home score, away score, first goal scorer, and first goal minute
    if (scoreForm.homeScore === '' || scoreForm.awayScore === '' || !scoreForm.firstGoalScorer || !scoreForm.firstGoalMinute) {
      alert('Please enter all required fields: home score, away score, first goal scorer, and first goal minute');
      return;
    }

    try {
      setUpdating(true);
      
      // Prepare results data
      const resultsData = {
        homeScore: parseInt(scoreForm.homeScore, 10),
        awayScore: parseInt(scoreForm.awayScore, 10),
        firstGoalScorer: scoreForm.firstGoalScorer.trim(),
        firstGoalMinute: parseInt(scoreForm.firstGoalMinute, 10),
      };
      
      // Update fixture results via API (backend automatically sets status to 'completed')
      const result = await updateFixtureResults(id, resultsData);
      
      if (result.success) {
        setScoreDialogOpen(false);
        // Reload fixture data to get updated status and scores from backend
        await reloadFixtureData();
        alert('Score saved and match completed! Match is now in Completed state.');
      } else {
        alert(result.error || 'Failed to save score');
      }
    } catch (error) {
      console.error('Error saving score:', error);
      alert('An error occurred while saving the score');
    } finally {
      setUpdating(false);
    }
  };

  const getFlowProgress = () => {
    const status = fixture?.status || 'scheduled';
    if (status === 'scheduled' || status === 'published') return 0;
    if (status === 'predictionLocked' || status === 'locked') return 25;
    if (status === 'live') return 50;
    if (status === 'resultsProcessing' || status === 'pending') return 75;
    if (status === 'completed') return 100;
    return 0;
  };

  const getFlowStatus = () => {
    const status = fixture?.status || 'scheduled';
    if (status === 'scheduled' || status === 'published') return 'Prediction Open';
    if (status === 'predictionLocked' || status === 'locked') return 'Prediction Locked';
    if (status === 'live') return 'Match Live';
    if (status === 'resultsProcessing' || status === 'pending') return 'Results Processing';
    if (status === 'completed') return 'Completed';
    return 'Unknown';
  };

  const getFlowColor = () => {
    const progress = getFlowProgress();
    if (progress === 0) return '#EBF5FF';
    if (progress === 25) return '#FFF4E6';
    if (progress === 50) return '#FEF3C7';
    if (progress === 75) return '#FFF7ED';
    if (progress === 100) return '#ECFDF5';
    return '#F3F4F6';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  if (!fixture) {
    return (
      <Box sx={{ p: 3 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(constants.routes.fixtures)}
          sx={{
            mb: 3,
            color: colors.brandRed,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Back to Fixtures
        </Button>
        <Alert severity="error" sx={{ mb: 2 }}>
          Fixture not found or failed to load. Please try again.
        </Alert>
      </Box>
    );
  }

  if (!fixture) {
    return (
      <Box sx={{ textAlign: 'center', padding: 6 }}>
        <Typography variant="h6" sx={{ color: colors.error, mb: 2 }}>
          Fixture not found
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(constants.routes.fixtures)}
          sx={{
            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Back to Fixtures
        </Button>
      </Box>
    );
  }

  const getStatusChip = (status, matchStatus = null) => {
    // Show actual backend status values directly
    // Use matchStatus if available, otherwise use status
    const displayStatus = matchStatus || status;
    
    // Map to display labels (keeping backend status names but formatting for display)
    const statusConfig = {
      scheduled: {
        label: 'Scheduled',
        color: '#9E9E9E',
        icon: Schedule
      },
      published: {
        label: 'Published',
        color: '#1976D2',
        icon: Visibility
      },
      predictionOpen: {
        label: 'Prediction Open',
        color: colors.info,
        icon: AccessTime
      },
      predictionLock: {
        label: 'Prediction Lock',
        color: colors.warning,
        icon: Lock
      },
      predictionLocked: {
        label: 'Prediction Locked',
        color: colors.warning,
        icon: Lock
      },
      locked: {
        label: 'Locked',
        color: colors.warning,
        icon: Lock
      },
      live: {
        label: 'Live',
        color: colors.error,
        icon: PlayCircle
      },
      resultPending: {
        label: 'Result Pending',
        color: colors.warning,
        icon: HourglassEmpty
      },
      resultsProcessing: {
        label: 'Results Processing',
        color: colors.warning,
        icon: HourglassEmpty
      },
      pending: {
        label: 'Pending',
        color: colors.warning,
        icon: HourglassEmpty
      },
      completed: {
        label: 'Completed',
        color: colors.success,
        icon: CheckCircle
      },
    };

    // Use actual backend status, fallback to formatted status if not in config
    const config = statusConfig[displayStatus] || {
      label: (displayStatus || 'Unknown').replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim(),
      color: '#9E9E9E',
      icon: Schedule
    };
    
    const Icon = config.icon;

    return (
      <Chip
        icon={<Icon />}
        label={config.label}
        sx={{
          backgroundColor: `${config.color}1A`,
          color: config.color,
          fontWeight: 600,
        }}
      />
    );
  };

  const steps = [
    'Prediction Open',
    'Prediction Locked',
    'Live',
    'Full Time (Results Processing)',
    'Full Time (Completed)'
  ];

  const getActiveStep = () => {
    const status = fixture.matchStatus || fixture.status;

    // Map old statuses to new match flow states
    const statusMap = {
      scheduled: 'predictionOpen',
      published: 'predictionOpen',
      predictionOpen: 'predictionOpen',
      predictionLocked: 'predictionLocked',
      locked: 'predictionLocked',
      live: 'live',
      fullTime: 'fullTimeProcessing',
      resultsProcessing: 'fullTimeProcessing',
      fullTimeProcessing: 'fullTimeProcessing',
      completed: 'fullTimeCompleted',
      fullTimeCompleted: 'fullTimeCompleted',
    };

    const mappedStatus = statusMap[status] || 'predictionOpen';

    // Return step index based on match flow state
    if (mappedStatus === 'predictionOpen') return 0;
    if (mappedStatus === 'predictionLocked') return 1;
    if (mappedStatus === 'live') return 2;
    if (mappedStatus === 'fullTimeProcessing') return 3;
    if (mappedStatus === 'fullTimeCompleted') return 4;

    return 0;
  };

  const columns = [
    {
      id: 'userId',
      label: 'User ID',
      render: (_, row) => (
        <Chip
          label={row.userId || 'N/A'}
          sx={{
            backgroundColor: '#FFE5E5',
            color: colors.brandRed,
            fontWeight: 600,
            fontSize: 11,
            height: 28,
            borderRadius: '20px',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'username',
      label: 'Username',
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: colors.brandRed,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Person sx={{ fontSize: 18, color: colors.brandWhite }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
              {row.username || row.fullName || 'N/A'}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
              {row.email || ''}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'prediction',
      label: 'Prediction',
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {row.prediction || row.selectedTeam || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'predictionTime',
      label: 'Prediction Time',
      render: (_, row) => {
        if (!row.predictionTime) return <Typography variant="body2" sx={{ color: colors.brandBlack }}>N/A</Typography>;
        const time = row.predictionTime?.toDate ? row.predictionTime.toDate() : new Date(row.predictionTime);
        const isValidDate = time instanceof Date && !isNaN(time.getTime());
        return (
          <Typography variant="body2" sx={{ color: colors.brandBlack }}>
            {isValidDate ? format(time, 'MMM dd, yyyy HH:mm') : 'N/A'}
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = row.status || row.predictionStatus;
        const statusConfig = {
          won: { label: 'WON', color: colors.success },
          lost: { label: 'LOST', color: colors.error },
          correct: { label: 'WON', color: colors.success },
          incorrect: { label: 'LOST', color: colors.error },
          ongoing: { label: 'Ongoing', color: colors.info },
          pending: { label: 'Pending', color: colors.warning },
        };
        const config = statusConfig[status] || statusConfig.ongoing;
        return (
          <Chip
            label={config.label}
            size="small"
            sx={{
              backgroundColor: `${config.color}1A`,
              color: config.color,
              fontWeight: 700,
              fontSize: 11,
              height: 28,
              borderRadius: '20px',
            }}
          />
        );
      },
    },
  ];

  const paginatedPredictions = filteredPredictions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const getStatusInfo = () => {
    const status = fixture.matchStatus || fixture.status;
    const statusMap = {
      scheduled: 'predictionOpen',
      published: 'predictionOpen',
      predictionOpen: 'predictionOpen',
      predictionLocked: 'predictionLocked',
      locked: 'predictionLocked',
      live: 'live',
      fullTime: 'fullTimeProcessing',
      resultsProcessing: 'fullTimeProcessing',
      fullTimeProcessing: 'fullTimeProcessing',
      completed: 'fullTimeCompleted',
      fullTimeCompleted: 'fullTimeCompleted',
    };
    return statusMap[status] || 'predictionOpen';
  };

  const getStatusCardConfig = () => {
    const status = getStatusInfo();
    const configs = {
      predictionOpen: {
        title: 'Prediction Open',
        subtitle: 'Users can predict',
        icon: AccessTime,
        color: colors.info,
        isPrimary: false,
      },
      predictionLocked: {
        title: 'Prediction Locked',
        subtitle: 'Predictions closed',
        icon: Lock,
        color: colors.warning,
        isPrimary: false,
      },
      live: {
        title: 'Live Match',
        subtitle: 'Match in progress',
        icon: PlayCircle,
        color: colors.brandRed,
        isPrimary: true,
      },
      fullTimeProcessing: {
        title: 'Full Time',
        subtitle: 'Results Processing',
        icon: HourglassEmpty,
        color: colors.warning,
        isPrimary: false,
      },
      fullTimeCompleted: {
        title: 'Full Time',
        subtitle: 'Match Completed',
        icon: CheckCircle,
        color: colors.success,
        isPrimary: false,
      },
    };
    return configs[status];
  };

  const statusConfig = getStatusCardConfig();
  const StatusIcon = statusConfig.icon;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', pb: 4 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(constants.routes.fixtures)}
        sx={{
          mb: 3,
          color: colors.brandRed,
          textTransform: 'none',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: `${colors.brandRed}0A`,
          },
        }}
      >
        Back to Fixtures
      </Button>

      {/* Scorecard Header */}
      <Card
        sx={{
          mb: 3,
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
          boxShadow: `0 8px 32px ${colors.brandRed}40`,
          position: 'relative',
          overflow: 'hidden',
          color: colors.brandWhite
        }}
      >
        <Box sx={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 20%), radial-gradient(circle at 90% 80%, rgba(255,255,255,0.4) 0%, transparent 20%)'
        }} />

        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
            <Chip icon={<CalendarToday sx={{ fontSize: 14, color: '#fff !important' }} />} label={fixture.kickoffTime && !isNaN(new Date(fixture.kickoffTime).getTime()) ? format(new Date(fixture.kickoffTime), 'EEE, MMM dd • HH:mm') : 'TBD'} sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: 600 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {(fixture.hot || fixture.isCommunityFeatured || fixture.isCeBeFeatured) && (
                <Chip label="Featured Fixture" size="small" sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)' }} />
              )}
              <Chip label={(fixture.status || 'scheduled').toUpperCase()} sx={{ fontWeight: 700, bgcolor: fixture.status === 'live' ? colors.brandBlack : 'rgba(255,255,255,0.2)', color: '#fff' }} />
              {fixture.matchStatus && fixture.matchStatus !== fixture.status && (
                <Chip label={`Match: ${(fixture.matchStatus || '').toUpperCase()}`} sx={{ fontWeight: 700, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }} />
              )}
            </Box>
          </Box>

          <Grid container alignItems="center" justifyContent="center" spacing={2}>
            {/* Home Team (Team A = Featured Team when Community Featured) */}
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <SportsSoccer sx={{ fontSize: 40, color: colors.brandBlack }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{fixture.homeTeam}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Home</Typography>
                {fixture.isCommunityFeatured && (
                  <Chip label="Featured Team" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff', border: '1px solid rgba(255,255,255,0.4)', fontWeight: 600, height: 18, fontSize: 10 }} />
                )}
              </Box>
            </Grid>

            {/* Score */}
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ bgcolor: 'rgba(0,0,0,0.2)', borderRadius: '16px', px: 4, py: 2, display: 'inline-block' }}>
                <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1 }}>
                  {fixture.homeScore !== undefined ? fixture.homeScore : '-'} : {fixture.awayScore !== undefined ? fixture.awayScore : '-'}
                </Typography>
                {(fixture.status === 'live' || fixture.status === 'fullTime') && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {fixture.status === 'live' ? 'Live' : 'Full Time'}
                  </Typography>
                )}
              </Box>
            </Grid>

            {/* Away Team (Team B when Community Featured) */}
            <Grid item xs={4} sx={{ textAlign: 'center' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                <SportsSoccer sx={{ fontSize: 40, color: colors.brandBlack }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{fixture.awayTeam}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Away</Typography>
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3, opacity: 0.9 }}>
            <LocationOn sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {fixture?.homeTeam === 'Arsenal' ? 'Emirates Stadium' : 
               fixture?.homeTeam === 'Manchester United' ? 'Old Trafford' :
               fixture?.homeTeam === 'Liverpool' ? 'Anfield' :
               fixture?.homeTeam === 'Newcastle' ? 'St James\' Park' :
               'Stadium TBD'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>•</Typography>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {fixture?.league || 'Premier League'}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Interactive Match State Flow - Full Width */}
      <Card sx={{ borderRadius: '20px', p: 3, mb: 3, bgcolor: '#FFFFFF', border: `1px solid ${colors.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.brandBlack }}>
            Match State Flow
          </Typography>
        </Box>
        
        <Box sx={{ position: 'relative', mb: 2 }}>
          {/* Flow Steps */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', mb: 3 }}>
            {/* Connecting Line */}
            <Box
              sx={{
                position: 'absolute',
                top: '20px',
                left: '8%',
                right: '8%',
                height: '3px',
                bgcolor: '#E5E7EB',
                zIndex: 0,
              }}
            />
            {/* Progress Line */}
            <Box
              sx={{
                position: 'absolute',
                top: '20px',
                left: '8%',
                width: (() => {
                  const statusOrder = {
                    'predictionOpen': 0,
                    'predictionLock': 1,
                    'live': 2,
                    'resultPending': 3,
                    'resultsProcessing': 3,
                    'pending': 3,
                    'completed': 4,
                  };
                  const selectedOrder = statusOrder[selectedFlowStatus] ?? 0;
                  const totalSteps = 4;
                  const progressPercent = (selectedOrder / totalSteps) * 84; // 84% is the width between 8% and 92%
                  return `${progressPercent}%`;
                })(),
                height: '3px',
                bgcolor: colors.brandRed,
                zIndex: 1,
                transition: 'width 0.3s ease',
              }}
            />
            
            {/* Status Steps */}
            {[
              { key: 'predictionOpen', label: 'Prediction Open', order: 0 },
              { key: 'predictionLock', label: 'Prediction Lock', order: 1 },
              { key: 'live', label: 'Live', order: 2 },
              { key: 'resultPending', label: 'Result Pending', order: 3 },
              { key: 'completed', label: 'Completed', order: 4 },
            ].map((step, index) => {
              // Map selected status to order
              const statusOrder = {
                'predictionOpen': 0,
                'predictionLock': 1,
                'live': 2,
                'resultPending': 3,
                'resultsProcessing': 3,
                'pending': 3,
                'completed': 4,
              };
              
              const selectedOrder = statusOrder[selectedFlowStatus] ?? 0;
              const isActive = step.order <= selectedOrder;
              
              // Status steps are display-only - they show the current status from API
              // Status changes should be done through specific action buttons (Approve, End Match, etc.)
              const isClickable = false;
              
              return (
                <Box
                  key={step.key}
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'default',
                    flex: 1,
                    transition: 'transform 0.2s',
                  }}
                >
                  {/* Status Circle */}
                  <Box
                    sx={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      bgcolor: isActive ? colors.brandRed : '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 1,
                      border: `3px solid ${isActive ? colors.brandRed : '#E5E7EB'}`,
                      transition: 'all 0.3s ease',
                      boxShadow: isActive ? `0 4px 12px ${colors.brandRed}40` : 'none',
                    }}
                  >
                    {isActive && (
                      <Box
                        sx={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          bgcolor: colors.brandWhite,
                        }}
                      />
                    )}
                  </Box>
                  {/* Status Label */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? colors.brandRed : colors.textSecondary,
                      fontSize: '11px',
                      textAlign: 'center',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {step.label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>
        
        {/* Current Status Display */}
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          borderRadius: '12px', 
          bgcolor: selectedFlowStatus === 'predictionOpen' ? '#E3F2FD' :
                   selectedFlowStatus === 'predictionLock' ? '#FFF4E6' :
                   selectedFlowStatus === 'live' ? '#FFE5E5' :
                   selectedFlowStatus === 'resultPending' || selectedFlowStatus === 'resultsProcessing' || selectedFlowStatus === 'pending' ? '#FFF4E6' :
                   selectedFlowStatus === 'completed' ? '#ECFDF5' : '#F3F4F6',
          textAlign: 'center',
        }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
            Status: <span style={{ color: colors.brandRed, textTransform: 'uppercase' }}>
              {fixture?.status || 'N/A'}
            </span>
            {fixture?.matchStatus && fixture.matchStatus !== fixture?.status && (
              <>
                <br />
                Match Flow: <span style={{ color: colors.brandRed, textTransform: 'uppercase' }}>
                  {fixture.matchStatus}
                </span>
              </>
            )}
          </Typography>
        </Box>
      </Card>

      <Grid container spacing={3}>
        {/* Match Stats */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: '20px', mb: 3, p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Match Statistics</Typography>

            {(fixture?.status === 'live' || fixture?.status === 'completed') ? (
              fixture?.matchStats && typeof fixture.matchStats === 'object' && (
                (() => {
                  const s = fixture.matchStats;
                  const items = [];
                  if (s.possessionHome != null && s.possessionAway != null) {
                    const home = Number(s.possessionHome); const away = Number(s.possessionAway);
                    items.push({ stat: 'Possession', home: `${home}%`, away: `${away}%`, homeVal: home / 100 });
                  }
                  if (s.shotsOnTargetHome != null && s.shotsOnTargetAway != null) {
                    const home = Number(s.shotsOnTargetHome); const away = Number(s.shotsOnTargetAway);
                    items.push({ stat: 'Shots on Target', home: String(home), away: String(away), homeVal: away === 0 ? 1 : home / (home + away) });
                  }
                  if (s.cornersHome != null && s.cornersAway != null) {
                    const home = Number(s.cornersHome); const away = Number(s.cornersAway);
                    items.push({ stat: 'Corners', home: String(home), away: String(away), homeVal: away === 0 ? 1 : home / (home + away) });
                  }
                  if (s.foulsHome != null && s.foulsAway != null) {
                    const home = Number(s.foulsHome); const away = Number(s.foulsAway);
                    items.push({ stat: 'Fouls', home: String(home), away: String(away), homeVal: away === 0 ? 1 : home / (home + away) });
                  }
                  if (s.offsidesHome != null && s.offsidesAway != null) {
                    const home = Number(s.offsidesHome); const away = Number(s.offsidesAway);
                    items.push({ stat: 'Offsides', home: String(home), away: String(away), homeVal: away === 0 ? 1 : home / (home + away) });
                  }
                  if (items.length === 0) {
                    return (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                          Match statistics not recorded for this match
                        </Typography>
                      </Box>
                    );
                  }
                  return (
                    <>
                      {items.map((item) => (
                        <Box key={item.stat} sx={{ mb: 3 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" fontWeight={700} sx={{ color: colors.brandRed }}>{item.home}</Typography>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>{item.stat}</Typography>
                            <Typography variant="body2" fontWeight={700} sx={{ color: colors.brandBlack }}>{item.away}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, height: 8, borderRadius: 4, overflow: 'hidden' }}>
                            <Box sx={{ flex: item.homeVal, bgcolor: colors.brandRed, borderRadius: '4px 0 0 4px' }} />
                            <Box sx={{ flex: 1 - item.homeVal, bgcolor: '#E5E7EB', borderRadius: '0 4px 4px 0' }} />
                          </Box>
                        </Box>
                      ))}
                    </>
                  );
                })()
              )
            ) : null}
            {(fixture?.status === 'live' || fixture?.status === 'completed') && (!fixture?.matchStats || typeof fixture.matchStats !== 'object') && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Match statistics not recorded for this match
                </Typography>
              </Box>
            )}
            {fixture?.status !== 'live' && fixture?.status !== 'completed' && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Schedule sx={{ fontSize: 48, color: colors.textSecondary, mb: 2 }} />
                <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                  Match statistics will be available once the match starts
                </Typography>
              </Box>
            )}
          </Card>

          {/* Predictions List */}
          <Card sx={{ borderRadius: '20px', p: 0 }}>
            <Box sx={{ p: 3, borderBottom: `1px solid ${colors.divider}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>User Predictions</Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                  {filteredPredictions.length} predictions made for this fixture
                </Typography>
              </Box>
              <Chip 
                label={`${predictions.length} Total`}
                sx={{ 
                  bgcolor: `${colors.brandRed}20`,
                  color: colors.brandRed,
                  fontWeight: 700
                }}
              />
            </Box>
            <DataTable
              columns={[
                {
                  id: 'username',
                  label: 'User',
                  render: (_, row) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Person sx={{ fontSize: 16, color: '#9CA3AF' }} /></Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{row.username}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {row.userId != null ? String(row.userId) : '—'}</Typography>
                      </Box>
                    </Box>
                  )
                },
                {
                  id: 'prediction',
                  label: 'Prediction',
                  render: (_, row) => <Typography variant="body2" fontWeight={600}>{row.prediction}</Typography>
                },
                {
                  id: 'status',
                  label: 'Fixture Flow Status',
                  render: (_, row) => {
                    const pStatus = row.status || 'ongoing';
                    let label = 'Unknown';
                    let color = 'default';
                    let icon = AccessTime;

                    if (pStatus === 'won') { label = 'WON'; color = 'success'; icon = CheckCircle; }
                    else if (pStatus === 'lost') { label = 'LOST'; color = 'error'; icon = CheckCircle; }
                    else {
                      const fStatus = fixture.status || 'scheduled';
                      if (fStatus === 'scheduled') { label = 'Open'; color = 'info'; }
                      else if (fStatus === 'live') { label = 'Locked / Live'; color = 'warning'; icon = Lock; }
                      else if (fStatus === 'completed' || fStatus === 'resultsProcessing') { label = 'Awaiting Settlement'; color = 'warning'; icon = HourglassEmpty; }
                      else { label = 'Open'; color = 'info'; }
                    }

                    return (
                      <Chip
                        icon={<Box component={icon} sx={{ fontSize: '14px !important' }} />}
                        label={label}
                        size="small"
                        color={color === 'default' ? 'default' : color}
                        variant={color === 'default' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 700, height: 24, fontSize: 11 }}
                      />
                    );
                  }
                }
              ]}
              data={filteredPredictions}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={filteredPredictions.length}
              onPageChange={(e, p) => setPage(p)}
              onRowsPerPageChange={(e) => setRowsPerPage(e.target.value)}
              emptyMessage="No predictions found"
            />
          </Card>
        </Grid>

        {/* Right Sidebar: Timeline & Actions */}
        <Grid item xs={12} md={4}>
          {/* Admin Actions */}
          <Card sx={{ borderRadius: '20px', p: 3, mb: 3, bgcolor: '#FFF8F6', border: `1px solid ${colors.brandRed}20` }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: colors.brandRed }}>Admin Actions</Typography>
            
            {isApproved && (
              <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                  Match Details Approved
                </Typography>
              </Alert>
            )}

            <Button 
              fullWidth 
              variant="contained" 
              disabled={isApproved}
              startIcon={<CheckCircle />}
              onClick={handleApproveMatch}
              sx={{ 
                mb: 1, 
                bgcolor: colors.brandRed, 
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { bgcolor: colors.brandDarkRed },
                '&.Mui-disabled': {
                  bgcolor: colors.divider,
                  color: colors.textSecondary,
                }
              }}
            >
              {isApproved ? 'Match Details Approved' : 'Approve Match Details'}
            </Button>

            {/* End Match Button (only show when match is live - backend requirement) */}
            {fixture?.status === 'live' && (
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<StopCircle />}
                onClick={handleEndMatch}
                sx={{
                  mb: 1,
                  borderColor: colors.warning,
                  color: colors.warning,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    borderColor: colors.warning,
                    bgcolor: `${colors.warning}14`,
                  }
                }}
              >
                End Match
              </Button>
            )}

            {/* Update Score Button (only show when match is ended - resultsProcessing or completed) */}
            {(fixture?.status === 'resultsProcessing' || fixture?.status === 'completed' || fixture?.status === 'resultPending') && (
              <Button 
                fullWidth 
                variant="outlined" 
                color="error"
                startIcon={<Save />}
                onClick={handleOpenScoreDialog}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Update Score
              </Button>
            )}
          </Card>

          {/* Key Events Timeline */}
          <Card sx={{ borderRadius: '20px', p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Match Timeline</Typography>
            <Box sx={{ position: 'relative', pl: 2, borderLeft: `2px solid ${colors.divider}` }}>
              {((() => {
                const homeTeamName = typeof fixture?.homeTeam === 'string' ? fixture.homeTeam : (fixture?.homeTeam?.team_name || fixture?.homeTeam?.name || 'Home Team');
                const awayTeamName = typeof fixture?.awayTeam === 'string' ? fixture.awayTeam : (fixture?.awayTeam?.team_name || fixture?.awayTeam?.name || 'Away Team');
                if (fixture?.timeline && Array.isArray(fixture.timeline) && fixture.timeline.length > 0) {
                  const mapped = fixture.timeline.map(ev => ({
                    min: String(ev.minute ?? ev.min ?? ''),
                    event: String(ev.event ?? ''),
                    detail: String(ev.detail ?? ''),
                    color: ev.type === 'goal' ? colors.info : ev.type === 'card' ? colors.warning : ev.type === 'fulltime' ? colors.success : colors.brandRed
                  }));
                  mapped.sort((a, b) => (parseInt(a.min, 10) || 0) - (parseInt(b.min, 10) || 0));
                  return mapped;
                }
                if (fixture?.status === 'live' || fixture?.status === 'completed') {
                  return [
                    { min: '0', event: 'Kickoff', detail: '', color: colors.brandRed },
                    { min: '90', event: 'Full Time', detail: fixture?.status === 'completed' && fixture?.homeScore != null && fixture?.awayScore != null ? `${fixture.homeScore}-${fixture.awayScore}` : '', color: colors.success },
                  ];
                }
                const timelineEvents = [
                  { min: '', event: 'Match Scheduled', detail: fixture?.kickoffTime && !isNaN(new Date(fixture.kickoffTime).getTime()) ? format(new Date(fixture.kickoffTime), 'MMM dd, yyyy HH:mm') : '', color: colors.info },
                ];
                const fixtureStatus = fixture?.status || fixture?.matchStatus || '';
                if (fixtureStatus === 'published' || fixtureStatus === 'predictionOpen') {
                  timelineEvents.push({ min: '', event: 'Predictions Open', detail: `${predictions.length || 0} predictions made`, color: colors.success });
                }
                return timelineEvents;
              })()).map((ev, i) => (
                <Box key={i} sx={{ mb: 3, position: 'relative' }}>
                  <Box sx={{ position: 'absolute', left: -21, top: 0, width: 10, height: 10, borderRadius: '50%', bgcolor: ev.color }} />
                  {ev.min && <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 700 }}>{String(ev.min)}'</Typography>}
                  <Typography variant="body2" fontWeight={600} sx={{ color: colors.brandBlack }}>{String(ev.event)}</Typography>
                  {ev.detail && <Typography variant="caption" sx={{ color: colors.textSecondary }}>{String(ev.detail)}</Typography>}
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Approve Match Details Dialog */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => setApproveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: colors.brandRed }}>
          Approve Match Details
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              You are about to approve:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • Match: {fixture?.homeTeam} vs {fixture?.awayTeam}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • Match ID: {id}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • Status: {fixture?.status}
            </Typography>
          </Alert>
          <Typography variant="body2">
            This action confirms the match details are accurate and ready for predictions. This action will be logged.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setApproveDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmApproval}
            variant="contained"
            startIcon={updating ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <CheckCircle />}
            disabled={updating}
            sx={{ 
              bgcolor: colors.success,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#059669' },
              '&.Mui-disabled': {
                bgcolor: colors.divider,
                color: colors.textSecondary,
              }
            }}
          >
            {updating ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* End Match Dialog */}
      <Dialog 
        open={endMatchDialogOpen} 
        onClose={() => setEndMatchDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: colors.warning }}>
          End Match
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              You are about to end the match:
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • Match: {fixture?.homeTeam} vs {fixture?.awayTeam}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • Match ID: {id}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: 13 }}>
              • Status: {fixture?.status || 'N/A'}
              {fixture?.matchStatus && fixture.matchStatus !== fixture?.status && (
                <> • Match Flow: {fixture.matchStatus}</>
              )}
            </Typography>
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This will change the match status to <strong>"Full Time (Results Processing)"</strong> without uploading the final score yet.
          </Typography>
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            The match will move to the "Result Pending" state in the flow. You can return later to upload the final score and complete the match.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setEndMatchDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={confirmEndMatch}
            variant="contained"
            startIcon={updating ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <StopCircle />}
            disabled={updating}
            sx={{ 
              bgcolor: colors.warning,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#D97706' },
              '&.Mui-disabled': {
                bgcolor: colors.divider,
                color: colors.textSecondary,
              }
            }}
          >
            {updating ? 'Ending Match...' : 'End Match'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Score Upload Dialog */}
      <Dialog 
        open={scoreDialogOpen} 
        onClose={() => setScoreDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: '16px' }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: colors.brandRed }}>
          Enter Match Results
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {fixture?.homeTeam} vs {fixture?.awayTeam}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary }}>
              Match ID: {id}
            </Typography>
          </Alert>

          <Alert severity="info" sx={{ mb: 3, bgcolor: '#E3F2FD', border: '1px solid #1976D2' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
              All 4 prediction outcomes require results - Correct Scoreline - Total Goal Range - First Player to Score - First Goal Minute
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: colors.brandBlack }}>
              1. Final Score
            </Typography>
            <Grid container spacing={2} alignItems="flex-end">
              <Grid item xs={5}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: colors.brandBlack }}>
                  {fixture?.homeTeam}
                </Typography>
              <TextField
                fullWidth
                type="number"
                value={scoreForm.homeScore}
                onChange={(e) => setScoreForm({ ...scoreForm, homeScore: e.target.value })}
                  required
                InputProps={{
                  inputProps: { min: 0 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />
              </Grid>
              <Grid item xs={2} sx={{ textAlign: 'center', pb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                  -
              </Typography>
            </Grid>
              <Grid item xs={5}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: colors.brandBlack }}>
                  {fixture?.awayTeam}
                </Typography>
              <TextField
                fullWidth
                type="number"
                value={scoreForm.awayScore}
                onChange={(e) => setScoreForm({ ...scoreForm, awayScore: e.target.value })}
                  required
                InputProps={{
                  inputProps: { min: 0 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />
            </Grid>
            </Grid>
            <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 1, display: 'block' }}>
              This also determines total Goal Range outcome
            </Typography>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: colors.brandBlack }}>
                2. First Goal Scorer (Featured Team)
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter player name..."
                value={scoreForm.firstGoalScorer}
                onChange={(e) => setScoreForm({ ...scoreForm, firstGoalScorer: e.target.value })}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: colors.brandBlack }}>
                3. First Goal Minute
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter minute (1-120)..."
                type="number"
                value={scoreForm.firstGoalMinute}
                onChange={(e) => setScoreForm({ ...scoreForm, firstGoalMinute: e.target.value })}
                required
                InputProps={{
                  inputProps: { min: 1, max: 120 }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                  }
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={scoreForm.markCompleted}
                    onChange={(e) => setScoreForm({ ...scoreForm, markCompleted: e.target.checked })}
                    sx={{
                      color: colors.brandRed,
                      '&.Mui-checked': {
                        color: colors.brandRed,
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Mark as Completed
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                      {scoreForm.markCompleted 
                        ? 'Match will move to "Completed" state and trigger prediction settlement'
                        : 'Match will move to "Full Time (Results Processing)" state. Check to complete the match.'}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button 
            onClick={() => setScoreDialogOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveScore}
            variant="contained"
            startIcon={updating ? <CircularProgress size={20} sx={{ color: 'white' }} /> : <Save />}
            disabled={updating || !scoreForm.homeScore || !scoreForm.awayScore || !scoreForm.firstGoalScorer || !scoreForm.firstGoalMinute}
            sx={{ 
              bgcolor: colors.success,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#059669' },
              '&.Mui-disabled': {
                bgcolor: colors.divider,
                color: colors.textSecondary,
              }
            }}
          >
            {updating ? 'Saving...' : 'Save Score'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FixtureDetailsPage;
