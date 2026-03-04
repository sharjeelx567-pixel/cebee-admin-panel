import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Menu,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  EmojiEvents,
  BarChart,
  Person,
  People,
  ArrowUpward,
  MoreVert,
  CheckCircle,
  List as ListIcon,
  ArrowDropDown,
  AllInclusive,
  Search,
  Check,
  Timeline,
  ArrowDownward,
  RemoveRedEye,
  ArrowForwardIos,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import { format } from 'date-fns';
import { getLeaderboard, getLeaderboardStatistics } from '../services/leaderboardService';

// Static leaderboard data (fallback)
const staticLeaderboardData = [
  {
    id: '1',
    rank: 1,
    username: 'ChiefPredictor',
    userEmail: 'chiefpredictor@example.com',
    points: 28500,
    spTotal: 28500,
    totalPredictions: 950,
    accuracyRate: 75.8,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:32:00'),
    period: 'allTime'
  },
  {
    id: '2',
    rank: 2,
    username: 'AfricanLegend',
    userEmail: 'africanilegend@example.com',
    points: 26500,
    spTotal: 26500,
    totalPredictions: 880,
    accuracyRate: 73.9,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:29:00'),
    period: 'allTime'
  },
  {
    id: '3',
    rank: 3,
    username: 'KingOfPredictions',
    userEmail: 'kingofpredictions@example.com',
    points: 24800,
    spTotal: 24800,
    totalPredictions: 820,
    accuracyRate: 74.4,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:26:00'),
    period: 'allTime'
  },
  {
    id: '4',
    rank: 4,
    username: 'PredictionMaster',
    userEmail: 'predictionmaster@example.com',
    points: 22400,
    spTotal: 22400,
    totalPredictions: 780,
    accuracyRate: 74.4,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:23:00'),
    period: 'allTime'
  },
  {
    id: '5',
    rank: 5,
    username: 'FootballWizard',
    userEmail: 'footballwizard@example.com',
    points: 20500,
    spTotal: 20500,
    totalPredictions: 720,
    accuracyRate: 73.6,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:20:00'),
    period: 'allTime'
  },
  {
    id: '6',
    rank: 6,
    username: 'ScoreKing',
    userEmail: 'scoreking@example.com',
    points: 18900,
    spTotal: 18900,
    totalPredictions: 680,
    accuracyRate: 73.5,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:17:00'),
    period: 'allTime'
  },
  {
    id: '7',
    rank: 7,
    username: 'GoalMachine',
    userEmail: 'goalmachine@example.com',
    points: 17200,
    spTotal: 17200,
    totalPredictions: 640,
    accuracyRate: 73.4,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:14:00'),
    period: 'allTime'
  },
  {
    id: '8',
    rank: 8,
    username: 'MatchGuru',
    userEmail: 'matchguru@example.com',
    points: 15800,
    spTotal: 15800,
    totalPredictions: 600,
    accuracyRate: 72.9,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:11:00'),
    period: 'allTime'
  },
  {
    id: '9',
    rank: 9,
    username: 'StrikerPro',
    userEmail: 'strikerpro@example.com',
    points: 14500,
    spTotal: 14500,
    totalPredictions: 560,
    accuracyRate: 72.3,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:08:00'),
    period: 'allTime'
  },
  {
    id: '10',
    rank: 10,
    username: 'GameChanger',
    userEmail: 'gamechanger@example.com',
    points: 13200,
    spTotal: 13200,
    totalPredictions: 520,
    accuracyRate: 71.8,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:05:00'),
    period: 'allTime'
  },
  {
    id: '11',
    rank: 11,
    username: 'TacticalGenius',
    userEmail: 'tacticalgenius@example.com',
    points: 12000,
    spTotal: 12000,
    totalPredictions: 480,
    accuracyRate: 71.2,
    isVerified: true,
    lastUpdated: new Date('2026-01-22T13:02:00'),
    period: 'allTime'
  },
  {
    id: '12',
    rank: 12,
    username: 'NetBuster',
    userEmail: 'netbuster@example.com',
    points: 10800,
    spTotal: 10800,
    totalPredictions: 440,
    accuracyRate: 70.5,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:59:00'),
    period: 'allTime'
  },
  {
    id: '13',
    rank: 13,
    username: 'PitchMaster',
    userEmail: 'pitchmaster@example.com',
    points: 9600,
    spTotal: 9600,
    totalPredictions: 400,
    accuracyRate: 69.8,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:56:00'),
    period: 'allTime'
  },
  {
    id: '14',
    rank: 14,
    username: 'BallWatcher',
    userEmail: 'ballwatcher@example.com',
    points: 8500,
    spTotal: 8500,
    totalPredictions: 360,
    accuracyRate: 69.0,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:53:00'),
    period: 'allTime'
  },
  {
    id: '15',
    rank: 15,
    username: 'FieldExpert',
    userEmail: 'fieldexpert@example.com',
    points: 7400,
    spTotal: 7400,
    totalPredictions: 320,
    accuracyRate: 68.3,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:50:00'),
    period: 'allTime'
  },
  {
    id: '16',
    rank: 16,
    username: 'TeamAnalyst',
    userEmail: 'teamanalyst@example.com',
    points: 6500,
    spTotal: 6500,
    totalPredictions: 280,
    accuracyRate: 67.5,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:47:00'),
    period: 'allTime'
  },
  {
    id: '17',
    rank: 17,
    username: 'MatchPredictor',
    userEmail: 'matchpredictor@example.com',
    points: 5600,
    spTotal: 5600,
    totalPredictions: 240,
    accuracyRate: 66.8,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:44:00'),
    period: 'allTime'
  },
  {
    id: '18',
    rank: 18,
    username: 'ScoreReader',
    userEmail: 'scorereader@example.com',
    points: 4800,
    spTotal: 4800,
    totalPredictions: 200,
    accuracyRate: 66.0,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:41:00'),
    period: 'allTime'
  },
  {
    id: '19',
    rank: 19,
    username: 'GoalSeeker',
    userEmail: 'goalseeker@example.com',
    points: 4000,
    spTotal: 4000,
    totalPredictions: 160,
    accuracyRate: 65.2,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:38:00'),
    period: 'allTime'
  },
  {
    id: '20',
    rank: 20,
    username: 'WhistleBlower',
    userEmail: 'whistleblower@example.com',
    points: 3300,
    spTotal: 3300,
    totalPredictions: 120,
    accuracyRate: 64.5,
    isVerified: false,
    lastUpdated: new Date('2026-01-22T12:35:00'),
    period: 'allTime'
  },
  // Adding more users for ranks 21-50
  ...Array.from({ length: 180 }, (_, i) => ({
    id: `${21 + i}`,
    rank: 21 + i,
    username: `Player${21 + i}`,
    userEmail: `player${21 + i}@example.com`,
    points: 3000 - Math.floor(i * 10),
    spTotal: 3000 - Math.floor(i * 10),
    totalPredictions: 100 - Math.floor(i * 0.5),
    accuracyRate: 64.0 - (i * 0.1),
    isVerified: false,
    lastUpdated: new Date(Date.now() - (i * 3 * 60 * 1000)),
    period: 'allTime'
  }))
];

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly'); // Default to Monthly
  const [selectedSort, setSelectedSort] = useState('rankAsc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [statistics, setStatistics] = useState({
    totalParticipants: 0,
    topScorer: 'N/A',
    averageAccuracy: '0.0',
    totalPoints: 0,
  });
  const [periodAnchor, setPeriodAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [paginationAnchor, setPaginationAnchor] = useState(null);
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        // Map frontend sort to backend sort parameter
        const sortMap = {
          'rankAsc': 'rankLowToHigh',
          'rankDesc': 'rankHighToLow',
          'pointsHighest': 'pointsHighestFirst',
          'pointsLowest': 'pointsLowestFirst',
          'accuracyHighest': 'accuracyHighestFirst',
          'accuracyLowest': 'accuracyLowestFirst',
          'usernameAZ': 'usernameAZ',
          'usernameZA': 'usernameZA',
        };
        
        const backendSort = sortMap[selectedSort] || 'rankHighToLow';

        // Map frontend period to backend period
        let backendPeriod = selectedPeriod;
        if (selectedPeriod === 'monthly') {
          // For monthly, backend uses cmdId or last30days
          // We'll use last30days for now (can be enhanced to get current CMd)
          backendPeriod = 'last30days';
        }

        const params = {
          period: backendPeriod,
          search: searchQuery || undefined,
          page: page + 1, // Backend uses 1-based pagination
          limit: rowsPerPage,
          sort: backendSort,
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const [leaderboardResponse, statsResponse] = await Promise.all([
          getLeaderboard(params),
          getLeaderboardStatistics(selectedPeriod),
        ]);

        if (leaderboardResponse.success) {
          const data = leaderboardResponse.data;
          // Backend returns 'leaderboard' array, not 'entries'
          const entriesList = data.leaderboard || [];
          setEntries(entriesList);
          setFilteredEntries(entriesList);
          setTotalCount(data.pagination?.total || data.totalParticipants || entriesList.length || 0);

          // Use statistics from stats endpoint if available
          if (statsResponse.success && statsResponse.data) {
            const stats = statsResponse.data;
            setStatistics({
              totalParticipants: stats.totalParticipants || 0,
              topScorer: stats.topScorer || 'N/A',
              averageAccuracy: stats.averageAccuracy?.toFixed(1) || '0.0',
              totalPoints: stats.totalPoints || 0,
            });
          } else {
            // Calculate statistics from entries as fallback
            setStatistics({
              totalParticipants: data.totalParticipants || entriesList.length || 0,
              topScorer: entriesList.length > 0
                ? (entriesList.reduce((max, entry) => {
                    const entryPoints = entry.spTotal || entry.points || 0;
                    const maxPoints = max.spTotal || max.points || 0;
                    return entryPoints > maxPoints ? entry : max;
                  }, entriesList[0])?.username || entriesList[0]?.userName || 'N/A')
                : 'N/A',
              averageAccuracy: entriesList.length > 0
                ? ((entriesList.reduce((sum, e) => sum + (e.accuracyRate || e.accuracy || 0), 0) / entriesList.length)).toFixed(1)
                : '0.0',
              totalPoints: entriesList.reduce((sum, e) => sum + (e.spTotal || e.points || 0), 0),
            });
          }
        } else {
          // Fallback to static data on error
          console.warn('Failed to fetch leaderboard:', leaderboardResponse.error);
          const monthlyData = staticLeaderboardData.map(entry => ({
            ...entry,
            id: `${entry.id}_monthly`,
            period: 'monthly',
            points: Math.floor(entry.points / 10),
            spTotal: Math.floor(entry.spTotal / 10),
            totalPredictions: Math.floor(entry.totalPredictions / 10),
          }));
          const allData = [...staticLeaderboardData, ...monthlyData];
          let filtered = allData.filter(e => e.period === selectedPeriod);
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (entry) =>
            entry.username?.toLowerCase().includes(query) ||
            entry.userEmail?.toLowerCase().includes(query) ||
            entry.id?.toLowerCase().includes(query)
        );
      }
          setEntries(filtered);
          setFilteredEntries(filtered);
          setTotalCount(filtered.length);
          
          // Calculate stats from fallback data
          setStatistics({
            totalParticipants: filtered.length,
            topScorer: filtered.length > 0
              ? filtered.reduce((max, entry) => (entry.spTotal > max.spTotal ? entry : max), filtered[0]).username
              : 'N/A',
            averageAccuracy: filtered.length > 0
              ? ((filtered.reduce((sum, e) => sum + (e.accuracyRate || 0), 0) / filtered.length)).toFixed(1)
              : '0.0',
            totalPoints: filtered.reduce((sum, e) => sum + (e.spTotal || e.points || 0), 0),
          });
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard');
        // Fallback to static data
        const monthlyData = staticLeaderboardData.map(entry => ({
          ...entry,
          id: `${entry.id}_monthly`,
          period: 'monthly',
          points: Math.floor(entry.points / 10),
          spTotal: Math.floor(entry.spTotal / 10),
          totalPredictions: Math.floor(entry.totalPredictions / 10),
        }));
        const allData = [...staticLeaderboardData, ...monthlyData];
        const filtered = allData.filter(e => e.period === selectedPeriod);
        setEntries(filtered);
      setFilteredEntries(filtered);
        setTotalCount(filtered.length);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedPeriod, searchQuery, selectedSort, page, rowsPerPage]);



  const getRankBadge = (rank) => {
    // Gold, Silver, Bronze for top 3
    let bgColor = `${colors.brandRed}1A`;
    let borderColor = `${colors.brandRed}33`;
    let textColor = colors.brandRed;
    
    if (rank === 1) {
      // Gold
      bgColor = '#FFD70020';
      borderColor = '#FFD700';
      textColor = '#B8860B'; // Dark goldenrod
    } else if (rank === 2) {
      // Silver
      bgColor = '#C0C0C020';
      borderColor = '#C0C0C0';
      textColor = '#696969'; // Dim gray
    } else if (rank === 3) {
      // Bronze
      bgColor = '#CD7F3220';
      borderColor = '#CD7F32';
      textColor = '#8B4513'; // Saddle brown
    }
    
    return (
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: `2px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: rank <= 3 ? `0 2px 8px ${borderColor}40` : 'none',
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 700, color: textColor, fontSize: 14 }}>
          #{rank}
        </Typography>
      </Box>
    );
  };

  const handleActionsOpen = (event, entry) => {
    setActionsAnchor(event.currentTarget);
    setSelectedEntry(entry);
  };

  const handleActionsClose = () => {
    setActionsAnchor(null);
    setSelectedEntry(null);
  };

  const columns = [
    {
      id: 'rank',
      label: 'Rank',
      render: (value) => getRankBadge(value),
    },
    {
      id: 'username',
      label: 'Username',
      render: (value, row) => (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person sx={{ fontSize: 18, color: colors.info }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
              {value || 'N/A'}
            </Typography>
            {row.isVerified && (
              <CheckCircle sx={{ fontSize: 16, color: colors.info }} />
            )}
          </Box>
          <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11, ml: 4 }}>
            {row.userEmail || row.email || row.user_email || 'No email'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'points',
      label: 'Points',
      render: (value, row) => (
        <Chip
          label={(value || row.spTotal || 0).toLocaleString()}
          sx={{
            backgroundColor: `${colors.warning}26`,
            color: colors.warning,
            fontWeight: 700,
            fontSize: 13,
            height: 28,
            borderRadius: '8px',
            '& .MuiChip-label': {
              px: 1.5,
            },
          }}
        />
      ),
    },
    {
      id: 'totalPredictions',
      label: 'Predictions',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {value || 0}
        </Typography>
      ),
    },
    {
      id: 'accuracyRate',
      label: 'Accuracy',
      render: (value) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: colors.success,
            backgroundColor: `${colors.success}1A`,
            display: 'inline-block',
            px: 1.5,
            py: 0.5,
            borderRadius: '6px',
          }}
        >
          {value?.toFixed(1) || '0.0'}%
        </Typography>
      ),
    },
    {
      id: 'lastUpdated',
      label: 'Last Updated',
      render: (value, row) => {
        let date;
        
        // Handle different date formats from backend
        const dateValue = value || row.lastUpdated || row.lastPredictionTime || row.updatedAt;
        
        if (!dateValue) {
          return (
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }}>
              N/A
            </Typography>
          );
        }
        
        if (dateValue?.toDate) {
          // Firestore timestamp
          date = dateValue.toDate();
        } else if (dateValue instanceof Date) {
          // Already a Date object
          date = dateValue;
        } else if (typeof dateValue === 'string') {
          // ISO string or other string format
          date = new Date(dateValue);
        } else {
          // Try to convert
          date = new Date(dateValue);
        }
        
        // Validate date before formatting
        if (!date || isNaN(date.getTime())) {
          return (
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }}>
              N/A
            </Typography>
          );
        }
        
        return (
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }}>
            {format(date, 'MMM dd, HH:mm')}
          </Typography>
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleActionsOpen(e, row);
          }}
          sx={{
            backgroundColor: `${colors.brandRed}1A`,
            color: colors.brandRed,
            width: 36,
            height: 36,
            border: `1.5px solid ${colors.brandRed}33`,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: `${colors.brandRed}33`,
            },
          }}
        >
          <MoreVert sx={{ fontSize: 20 }} />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: colors.brandBlack,
          fontSize: { xs: 24, md: 28 },
          mb: 3,
        }}
      >
        Leaderboard Control
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2.5,
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: '20px',
              boxShadow: `0 6px 18px ${colors.brandRed}40`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.brandWhite}33`,
                  borderRadius: '12px',
                }}
              >
                <People sx={{ fontSize: 24, color: colors.brandWhite }} />
              </Box>
              <Chip
                label="+12.5%"
                size="small"
                icon={<ArrowUpward sx={{ fontSize: 14 }} />}
                sx={{
                  backgroundColor: `${colors.brandRed}DD`,
                  color: colors.brandWhite,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: colors.brandWhite,
                  },
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandWhite, mb: 0.5 }}>
              {statistics.totalParticipants}
            </Typography>
            <Typography variant="body2" sx={{ color: `${colors.brandWhite}DD`, fontSize: 13 }}>
              Total Participants
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2.5,
              background: colors.brandWhite,
              border: `1.5px solid ${colors.warning}26`,
              borderRadius: '20px',
              boxShadow: `0 6px 14px ${colors.warning}1F`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.warning}1F`,
                  borderRadius: '12px',
                }}
              >
                <BarChart sx={{ fontSize: 24, color: colors.warning }} />
              </Box>
              <Chip
                label="+8.2%"
                size="small"
                icon={<ArrowUpward sx={{ fontSize: 14 }} />}
                sx={{
                  backgroundColor: `${colors.success}1A`,
                  color: colors.success,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: colors.success,
                  },
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {statistics.topScorer}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
              Top Scorer
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2.5,
              background: colors.brandWhite,
              border: `1.5px solid ${colors.success}26`,
              borderRadius: '20px',
              boxShadow: `0 6px 14px ${colors.success}1F`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.success}1F`,
                  borderRadius: '12px',
                }}
              >
                <BarChart sx={{ fontSize: 24, color: colors.success }} />
              </Box>
              <Chip
                label="+15.3%"
                size="small"
                icon={<ArrowUpward sx={{ fontSize: 14 }} />}
                sx={{
                  backgroundColor: `${colors.success}1A`,
                  color: colors.success,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: colors.success,
                  },
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {statistics.averageAccuracy}%
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
              Average Accuracy
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2.5,
              background: colors.brandWhite,
              border: `1.5px solid ${colors.info}26`,
              borderRadius: '20px',
              boxShadow: `0 6px 14px ${colors.info}1F`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.info}1F`,
                  borderRadius: '12px',
                }}
              >
                <EmojiEvents sx={{ fontSize: 24, color: colors.info }} />
              </Box>
              <Chip
                label="+5.1%"
                size="small"
                icon={<ArrowUpward sx={{ fontSize: 14 }} />}
                sx={{
                  backgroundColor: `${colors.success}1A`,
                  color: colors.success,
                  height: 24,
                  fontSize: 11,
                  fontWeight: 600,
                  '& .MuiChip-icon': {
                    color: colors.success,
                  },
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {statistics.totalPoints.toLocaleString()}
            </Typography>
            <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
              Total Points
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search Bar Strip */}
      <Card
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'stretch',
          gap: { xs: 1, sm: 1.5, md: 2 },
          mb: 3,
          p: { xs: 1, md: 1 },
          borderRadius: { xs: '16px', md: '24px' },
          backgroundColor: colors.brandWhite,
          border: `1px solid ${colors.divider}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Period Filter (Monthly SP Leaders) */}
        <Button
          variant="outlined"
          startIcon={
            <Box
              sx={{
                width: { xs: 32, md: 36 },
                height: { xs: 32, md: 36 },
                borderRadius: { xs: '8px', md: '10px' },
                backgroundColor: '#FFB4B4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ml: -0.5,
                flexShrink: 0,
              }}
            >
              <BarChart sx={{ fontSize: { xs: 16, md: 18 }, color: colors.brandWhite }} />
            </Box>
          }
          endIcon={
            <Box sx={{
              width: { xs: 26, md: 30 },
              height: { xs: 26, md: 30 },
              borderRadius: { xs: '6px', md: '8px' },
              backgroundColor: '#FFDADA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: -0.5,
              flexShrink: 0,
            }}>
              <ArrowDropDown sx={{ fontSize: { xs: 18, md: 20 }, color: colors.brandRed }} />
            </Box>
          }
          onClick={(e) => setPeriodAnchor(e.currentTarget)}
          sx={{
            flex: { xs: '1 1 auto', md: 1 },
            minWidth: { xs: 'auto', md: 220 },
            borderColor: '#FFE0E0',
            color: colors.brandBlack,
            backgroundColor: '#FFF5F5',
            borderRadius: { xs: '20px', md: '30px' },
            textTransform: 'none',
            fontWeight: 500,
            px: { xs: 1.5, md: 2 },
            py: { xs: 0.75, md: 1.0 },
            fontSize: { xs: 13, md: 15 },
            border: '1.5px solid #FFE0E0',
            justifyContent: 'space-between',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            '&:hover': {
              borderColor: '#FFCCCC',
              backgroundColor: '#FFF0F0',
            },
          }}
        >
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedPeriod === 'allTime' ? 'All Time Leaders' :
              selectedPeriod === 'monthly' ? 'Monthly SP Leaders' :
                selectedPeriod === 'weekly' ? 'Weekly SP Leaders' :
                  selectedPeriod === 'daily' ? 'Daily SP Leaders' : 'Leaders'}
          </Box>
        </Button>
        <Menu
          anchorEl={periodAnchor}
          open={Boolean(periodAnchor)}
          onClose={() => setPeriodAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '16px',
              minWidth: 260,
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
              mt: 1,
              p: 1,
              border: '1px solid #F3F4F6'
            },
          }}
        >
          {[
            { value: 'monthly', label: 'Monthly SP Leaders', icon: <BarChart sx={{ fontSize: 18 }} /> },
            { value: 'allTime', label: 'All Time Leaders', icon: <AllInclusive sx={{ fontSize: 18 }} /> },
          ].map((option) => {
            const isSelected = selectedPeriod === option.value;
            return (
              <MenuItem
                key={option.value}
                onClick={() => { setSelectedPeriod(option.value); setPeriodAnchor(null); }}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  py: 1.5,
                  px: 2,
                  backgroundColor: isSelected ? '#FFF1F2' : 'transparent',
                  '&:hover': { backgroundColor: isSelected ? '#FFF1F2' : '#F9FAFB' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#FECACA' : '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isSelected ? 'none' : '1px solid #E5E7EB'
                  }}>
                    {React.cloneElement(option.icon, { color: isSelected ? '#B91C1C' : '#9CA3AF' })}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: colors.brandBlack, fontSize: 14 }}>
                    {option.label}
                  </Typography>
                </Box>
                {isSelected && (
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%', backgroundColor: '#FECACA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check sx={{ fontSize: 14, color: '#B91C1C' }} />
                  </Box>
                )}
              </MenuItem>
            );
          })}
        </Menu>

        {/* Search Bar */}
        <Box sx={{ flex: { xs: '1 1 100%', md: 1.5 }, minWidth: { xs: '100%', md: 0 }, maxWidth: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 1.5, md: 2 },
              padding: { xs: '10px 16px', md: '12px 24px' },
              backgroundColor: '#F9F9F9',
              borderRadius: { xs: '20px', md: '30px' },
              border: 'none',
              width: '100%',
              height: { xs: 44, md: 54 },
              boxSizing: 'border-box',
            }}
          >
            <Search sx={{ fontSize: { xs: 20, md: 22 }, color: colors.brandRed, flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                flex: 1,
                fontSize: '15px',
                color: '#4A4A4A',
                backgroundColor: 'transparent',
                width: '100%',
                minWidth: 0,
              }}
            />
          </Box>
        </Box>

        {/* Rank Filter */}
        <Button
          variant="outlined"
          startIcon={
            <Box
              sx={{
                width: { xs: 32, md: 36 },
                height: { xs: 32, md: 36 },
                borderRadius: { xs: '8px', md: '10px' },
                backgroundColor: '#FFB4B4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ml: -0.5,
                flexShrink: 0,
              }}
            >
              <ArrowUpward sx={{ fontSize: { xs: 16, md: 18 }, color: colors.brandWhite }} />
            </Box>
          }
          endIcon={
            <Box sx={{
              width: { xs: 26, md: 30 },
              height: { xs: 26, md: 30 },
              borderRadius: { xs: '6px', md: '8px' },
              backgroundColor: '#FFDADA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: -0.5,
              flexShrink: 0,
            }}>
              <ArrowDropDown sx={{ fontSize: { xs: 18, md: 20 }, color: colors.brandRed }} />
            </Box>
          }
          onClick={(e) => setSortAnchor(e.currentTarget)}
          sx={{
            flex: { xs: '1 1 auto', md: 1 },
            minWidth: { xs: 'auto', md: 180 },
            borderColor: '#FFE0E0',
            color: colors.brandBlack,
            backgroundColor: '#FFF5F5',
            borderRadius: { xs: '20px', md: '30px' },
            textTransform: 'none',
            fontWeight: 500,
            px: { xs: 1.5, md: 2 },
            py: { xs: 0.75, md: 1.0 },
            fontSize: { xs: 13, md: 15 },
            border: '1.5px solid #FFE0E0',
            justifyContent: 'space-between',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: '100%',
            '&:hover': {
              borderColor: '#FFCCCC',
              backgroundColor: '#FFF0F0',
            },
          }}
        >
          <Box
            component="span"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedSort === 'rankAsc' ? 'Rank: Low to High' :
              selectedSort === 'rankDesc' ? 'Rank: High to Low' : 'Sort Items'}
          </Box>
        </Button>
        <Menu
          anchorEl={sortAnchor}
          open={Boolean(sortAnchor)}
          onClose={() => setSortAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '16px',
              minWidth: 280, // Slightly wider for sorting options
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
              mt: 1,
              p: 1,
              border: '1px solid #F3F4F6'
            },
          }}
        >
          {[
            { value: 'rankAsc', label: 'Rank: Low to High', icon: <ArrowUpward sx={{ fontSize: 18 }} /> },
            { value: 'rankDesc', label: 'Rank: High to Low', icon: <ArrowDownward sx={{ fontSize: 18 }} /> },
            { value: 'pointsHighest', label: 'Points: Highest First', icon: <ArrowUpward sx={{ fontSize: 18 }} /> },
            { value: 'pointsLowest', label: 'Points: Lowest First', icon: <ArrowDownward sx={{ fontSize: 18 }} /> },
            { value: 'accuracyHighest', label: 'Accuracy: Highest First', icon: <ArrowUpward sx={{ fontSize: 18 }} /> },
            { value: 'accuracyLowest', label: 'Accuracy: Lowest First', icon: <ArrowDownward sx={{ fontSize: 18 }} /> },
            { value: 'usernameAZ', label: 'Username: A-Z', icon: <ListIcon sx={{ fontSize: 18 }} /> },
            { value: 'usernameZA', label: 'Username: Z-A', icon: <ListIcon sx={{ fontSize: 18 }} /> },
          ].map((option) => {
            const isSelected = selectedSort === option.value;
            return (
              <MenuItem
                key={option.value}
                onClick={() => { setSelectedSort(option.value); setSortAnchor(null); }}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  py: 1.5,
                  px: 2,
                  backgroundColor: isSelected ? '#FFF1F2' : 'transparent',
                  '&:hover': { backgroundColor: isSelected ? '#FFF1F2' : '#F9FAFB' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    backgroundColor: isSelected ? '#FECACA' : '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isSelected ? 'none' : '1px solid #E5E7EB'
                  }}>
                    {React.cloneElement(option.icon, { color: isSelected ? '#B91C1C' : '#9CA3AF' })}
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: colors.brandBlack, fontSize: 14 }}>
                    {option.label}
                  </Typography>
                </Box>
                {isSelected && (
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%', backgroundColor: '#FECACA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check sx={{ fontSize: 14, color: '#B91C1C' }} />
                  </Box>
                )}
              </MenuItem>
            );
          })}
        </Menu>

      </Card>

      {/* Leaderboard Rankings Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          padding: 2,
          backgroundColor: colors.brandWhite,
          borderRadius: '12px 12px 0 0',
          border: `1.5px solid ${colors.divider}26`,
          borderBottom: 'none',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              backgroundColor: colors.brandRed,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart sx={{ fontSize: 22, color: colors.brandWhite }} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.brandBlack,
                fontSize: 17,
                mb: 0.25,
              }}
            >
              Leaderboard Rankings
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {totalCount} participants
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          endIcon={<ArrowDropDown sx={{ fontSize: 18 }} />}
          onClick={(e) => setPaginationAnchor(e.currentTarget)}
          sx={{
            borderColor: colors.brandRed,
            color: colors.brandBlack,
            backgroundColor: colors.brandWhite,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
            py: 1,
            fontSize: 13,
            '&:hover': {
              borderColor: colors.brandRed,
              backgroundColor: `${colors.brandRed}0D`,
            },
          }}
        >
          {rowsPerPage} / page
        </Button>
        <Menu
          anchorEl={paginationAnchor}
          open={Boolean(paginationAnchor)}
          onClose={() => setPaginationAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              minWidth: 150,
              boxShadow: `0 4px 12px ${colors.shadow}33`,
              mt: 0.5,
            },
          }}
        >
          <MenuItem onClick={() => { setRowsPerPage(10); setPage(0); setPaginationAnchor(null); }}>
            10 / page
          </MenuItem>
          <MenuItem onClick={() => { setRowsPerPage(25); setPage(0); setPaginationAnchor(null); }}>
            25 / page
          </MenuItem>
          <MenuItem onClick={() => { setRowsPerPage(50); setPage(0); setPaginationAnchor(null); }}>
            50 / page
          </MenuItem>
          <MenuItem onClick={() => { setRowsPerPage(100); setPage(0); setPaginationAnchor(null); }}>
            100 / page
          </MenuItem>
        </Menu>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredEntries}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onRowClick={(row) => {
          const realId = row.id?.toString().replace('_monthly', '') || row.userId || row.id;
          navigate(`/leaderboard/details/${realId}?period=${selectedPeriod}`);
        }}
        emptyMessage="No leaderboard entries found"
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={actionsAnchor}
        open={Boolean(actionsAnchor)}
        onClose={handleActionsClose}
        PaperProps={{
          sx: {
            borderRadius: '16px',
            minWidth: 200,
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
            p: 1,
            border: '1px solid #F3F4F6',
            mt: 1
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          onClick={() => {
            if (selectedEntry) {
              const realId = selectedEntry.id?.toString().replace('_monthly', '') || selectedEntry.userId || selectedEntry.id;
              navigate(`/leaderboard/details/${realId}?period=${selectedPeriod}`);
            }
            handleActionsClose();
          }}
          sx={{
            borderRadius: '12px',
            p: 1.5,
            gap: 2,
            '&:hover': {
              backgroundColor: '#F9FAFB',
            },
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              backgroundColor: '#EBF5FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RemoveRedEye sx={{ fontSize: 20, color: '#1C64F2' }} />
          </Box>
          <Typography sx={{ flex: 1, fontWeight: 500, fontSize: 14, color: '#111928' }}>
            View Details
          </Typography>
          <ArrowForwardIos sx={{ fontSize: 14, color: '#9CA3AF' }} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LeaderboardPage;
