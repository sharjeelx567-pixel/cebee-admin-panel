import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Chip,
  Divider,
  Autocomplete,
  TextField,
} from '@mui/material';
import {
  ArrowBack,
  Add,
  Close,
  BarChart,
  Stadium,
  CalendarToday,
  Schedule,
  Info,
  CheckCircle,
  RadioButtonUnchecked,
  SportsSoccer,
  ExpandMore,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import { getPolls, getPoll, createPoll, updatePoll, getUpcomingFixtures, createPollFromApi } from '../services/pollsService';
import { getLeagues } from '../services/leaguesService';
import { getTeams } from '../services/teamsService';

const PollFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [leagues, setLeagues] = useState([]);
  const [leaguesPage, setLeaguesPage] = useState(1);
  const [leaguesTotal, setLeaguesTotal] = useState(0);
  const [leaguesTotalPages, setLeaguesTotalPages] = useState(0);
  const [leaguesLoadingMore, setLeaguesLoadingMore] = useState(false);
  const [leagueFixtures, setLeagueFixtures] = useState([]);
  const [fixturesPage, setFixturesPage] = useState(1);
  const [fixturesTotal, setFixturesTotal] = useState(0);
  const [fixturesTotalPages, setFixturesTotalPages] = useState(0);
  const [fixturesLoadingMore, setFixturesLoadingMore] = useState(false);
  const [polls, setPolls] = useState([]);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState('');
  const [loadingFixtures, setLoadingFixtures] = useState(false);
  const [fixturesError, setFixturesError] = useState('');
  const [selectedApiFixtureIds, setSelectedApiFixtureIds] = useState([null, null, null, null, null]); // exactly 5 slots for new create flow
  const [selectedFixtures, setSelectedFixtures] = useState([
    { matchNum: 1, teamA: '', teamB: '' },
    { matchNum: 2, teamA: '', teamB: '' },
    { matchNum: 3, teamA: '', teamB: '' },
    { matchNum: 4, teamA: '', teamB: '' },
    { matchNum: 5, teamA: '', teamB: '' },
  ]);

  const [formData, setFormData] = useState({
    leagueId: '',
    season: new Date().getFullYear(),
    startTime: new Date(),
    closeTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days default
  });

  const LEAGUES_PAGE_SIZE = 50;

  const loadLeagues = async () => {
    try {
      const result = await getLeagues({ page: 1, limit: LEAGUES_PAGE_SIZE });
      if (result.success && result.data) {
        const formattedLeagues = (result.data.leagues || []).map(league => ({
          // Prefer Football API league id so backend receives API id (resolveLeague accepts it)
          id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id ?? league.league_id),
          name: league.league_name ?? league.name,
          country: league.country ?? null,
            isActive: league.status === 'Active',
          }));
          setLeagues(formattedLeagues);
        const pag = result.data.pagination || {};
        setLeaguesTotal(pag.total ?? formattedLeagues.length);
        setLeaguesPage(1);
        setLeaguesTotalPages(pag.pages ?? 1);
      } else {
        setLeagues([]);
        setLeaguesTotal(0);
        setLeaguesTotalPages(0);
      }
    } catch (err) {
      console.error('Error loading leagues:', err);
      setLeagues([]);
      setLeaguesTotal(0);
      setLeaguesTotalPages(0);
    }
  };

  const loadMoreLeagues = async () => {
    if (leaguesLoadingMore || leaguesPage >= leaguesTotalPages) return;
    setLeaguesLoadingMore(true);
    try {
      const nextPage = leaguesPage + 1;
      const result = await getLeagues({ page: nextPage, limit: LEAGUES_PAGE_SIZE });
      if (result.success && result.data?.leagues?.length) {
        const formatted = (result.data.leagues || []).map(league => ({
          id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id ?? league.league_id),
          name: league.league_name ?? league.name,
          country: league.country ?? null,
          isActive: league.status === 'Active',
        }));
        setLeagues(prev => [...prev, ...formatted]);
        setLeaguesPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more leagues:', err);
    } finally {
      setLeaguesLoadingMore(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        await loadLeagues();

        // Fetch all polls to check rules
        const pollsResult = await getPolls();
        if (pollsResult.success && pollsResult.data?.polls) {
          setPolls(pollsResult.data.polls);
        }

        // If editing, fetch the poll data
        if (isEditMode && id) {
          const pollResult = await getPoll(id);
          if (pollResult.success && pollResult.data) {
            const poll = pollResult.data;
            setFormData({
              leagueId: poll.league_id || poll.leagueId,
              startTime: poll.start_time ? new Date(poll.start_time) : new Date(),
              closeTime: poll.close_time ? new Date(poll.close_time) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            });

            // Load fixtures if they exist
            if (poll.fixtures && Array.isArray(poll.fixtures)) {
              const fixtures = poll.fixtures.map((f, index) => ({
                matchNum: f.match_num || f.matchNum || index + 1,
                teamA: f.team_a_id || f.teamAId || '',
                teamB: f.team_b_id || f.teamBId || '',
              }));
              // Ensure we have exactly 5 fixtures
              while (fixtures.length < 5) {
                fixtures.push({ matchNum: fixtures.length + 1, teamA: '', teamB: '' });
              }
              setSelectedFixtures(fixtures.slice(0, 5));
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode]);

  useEffect(() => {
    const loadLeagueTeams = async (leagueId) => {
      if (!leagueId) {
        setAvailableTeams([]);
        setLeagueFixtures([]);
        setLoadingTeams(false);
        setTeamsError('');
        return;
      }
      
      setLoadingTeams(true);
      setTeamsError('');
      setAvailableTeams([]);
      
      try {
        // Fetch teams for the selected league using teamsService (same pattern as TeamsPage)
        const teamsResult = await getTeams({ 
          league_id: leagueId, 
          status: 'Active' 
        });
        
        if (teamsResult.success && teamsResult.data?.teams) {
          const formattedTeams = teamsResult.data.teams.map(team => ({
            id: team._id || team.team_id,
            name: team.team_name || team.name,
            leagueId: team.league_id || leagueId,
          }));
          setAvailableTeams(formattedTeams);
          setTeamsError('');
        } else {
          setAvailableTeams([]);
          setTeamsError(teamsResult.error || 'No teams found for this league');
        }
        
        // Clear fixtures as they're not needed for team selection
        setLeagueFixtures([]);
      } catch (error) {
        console.error('Error loading teams:', error);
        setAvailableTeams([]);
        setTeamsError(error.message || 'Failed to load teams');
      } finally {
        setLoadingTeams(false);
      }
    };

    if (formData.leagueId) {
      loadLeagueTeams(formData.leagueId);
    } else {
      setAvailableTeams([]);
      setLeagueFixtures([]);
      setLoadingTeams(false);
      setTeamsError('');
    }
  }, [formData.leagueId]);

  const FIXTURES_PAGE_SIZE = 20;

  // Create flow: load first page of upcoming fixtures from Football API when league + season selected
  useEffect(() => {
    if (isEditMode || !formData.leagueId || !formData.season) {
      setLeagueFixtures([]);
      setFixturesError('');
      setFixturesPage(1);
      setFixturesTotal(0);
      setFixturesTotalPages(0);
      setLoadingFixtures(false);
      return;
    }
    let cancelled = false;
    setFixturesError('');
    setLoadingFixtures(true);
    setLeagueFixtures([]);
    setSelectedApiFixtureIds([null, null, null, null, null]);
    setFixturesPage(1);
    setFixturesTotal(0);
    setFixturesTotalPages(0);
    getUpcomingFixtures(formData.leagueId, formData.season, { page: 1, limit: FIXTURES_PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setLoadingFixtures(false);
        if (res.success && res.data) {
          setLeagueFixtures(res.data.fixtures || []);
          const pag = res.data.pagination || {};
          setFixturesTotal(pag.total ?? 0);
          setFixturesPage(1);
          setFixturesTotalPages(pag.total_pages ?? 1);
          if (!(res.data.fixtures || []).length) setFixturesError('No upcoming fixtures for this league/season.');
        } else {
          setFixturesError(res.error || 'Failed to load upcoming fixtures.');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadingFixtures(false);
          setFixturesError(err.message || 'Failed to load upcoming fixtures.');
        }
      });
    return () => { cancelled = true; };
  }, [formData.leagueId, formData.season, isEditMode]);

  const loadMoreFixtures = async () => {
    if (fixturesLoadingMore || fixturesPage >= fixturesTotalPages) return;
    setFixturesLoadingMore(true);
    try {
      const nextPage = fixturesPage + 1;
      const res = await getUpcomingFixtures(formData.leagueId, formData.season, {
        page: nextPage,
        limit: FIXTURES_PAGE_SIZE,
      });
      if (res.success && res.data?.fixtures?.length) {
        setLeagueFixtures((prev) => [...prev, ...(res.data.fixtures || [])]);
        setFixturesPage(nextPage);
      }
    } catch (err) {
      console.error('Error loading more fixtures:', err);
    } finally {
      setFixturesLoadingMore(false);
    }
  };

  const handleChange = (field, value) => {
    console.log('handleChange called:', { field, value, currentFormData: formData });
    
    // Ensure closeTime is always after startTime
    if (field === 'startTime' && value) {
      const newStartTime = value instanceof Date ? value : new Date(value);
      const currentCloseTime = formData.closeTime instanceof Date ? formData.closeTime : new Date(formData.closeTime);
      
      // If new start time is after or equal to close time, adjust close time to be 24 hours after start
      if (newStartTime >= currentCloseTime) {
        const newCloseTime = new Date(newStartTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
        setFormData({ ...formData, startTime: newStartTime, closeTime: newCloseTime });
        return;
      }
    }
    
    if (field === 'closeTime' && value) {
      const newCloseTime = value instanceof Date ? value : new Date(value);
      const currentStartTime = formData.startTime instanceof Date ? formData.startTime : new Date(formData.startTime);
      
      // Ensure close time is at least 1 hour after start time
      if (newCloseTime <= currentStartTime) {
        alert('Close time must be after start time. Please select a later date/time.');
        return;
      }
    }
    
    setFormData({ ...formData, [field]: value });
  };

  const handleTeamSelect = (matchNum, teamType, teamId) => {
    setSelectedFixtures(prev => 
      prev.map(fixture => 
        fixture.matchNum === matchNum 
          ? { ...fixture, [teamType]: teamId }
          : fixture
      )
    );
  };

  const handleApiFixtureSelect = (slotIndex, apiFixtureId) => {
    setSelectedApiFixtureIds((prev) => {
      const next = [...prev];
      next[slotIndex] = apiFixtureId === '' ? null : Number(apiFixtureId);
      return next;
    });
  };

  // Get all teams that are already selected across all fixtures
  const getSelectedTeamIds = (currentMatchNum) => {
    const selectedIds = new Set();
    selectedFixtures.forEach(fixture => {
      if (fixture.matchNum !== currentMatchNum) {
        if (fixture.teamA) selectedIds.add(fixture.teamA);
        if (fixture.teamB) selectedIds.add(fixture.teamB);
      }
    });
    return selectedIds;
  };

  // Check if a team is available for selection in a specific fixture
  const isTeamAvailable = (teamId, fixture, teamType) => {
    if (!teamId) return true; // Empty selection is always allowed
    
    // Can't select the same team as the opposite team in the same match
    if (teamType === 'teamA' && fixture.teamB === teamId) return false;
    if (teamType === 'teamB' && fixture.teamA === teamId) return false;
    
    // Can't select a team that's already selected in another fixture
    const selectedInOtherFixtures = getSelectedTeamIds(fixture.matchNum);
    if (selectedInOtherFixtures.has(teamId)) return false;
    
    return true;
  };

  const validateFixtures = () => {
    // Check all matches have both teams
    const allMatchesComplete = selectedFixtures.every(f => f.teamA && f.teamB);
    
    // Check no team plays itself in the same match
    const noSelfMatchups = selectedFixtures.every(f => f.teamA !== f.teamB);
    
    // Check no team is used more than once across all fixtures
    const allSelectedTeams = [];
    selectedFixtures.forEach(f => {
      if (f.teamA) allSelectedTeams.push(f.teamA);
      if (f.teamB) allSelectedTeams.push(f.teamB);
    });
    const uniqueTeams = new Set(allSelectedTeams);
    const noDuplicateTeams = allSelectedTeams.length === uniqueTeams.size;
    
    // Check exactly 5 matches
    const exactlyFive = selectedFixtures.length === 5;
    
    return allMatchesComplete && noSelfMatchups && noDuplicateTeams && exactlyFive;
  };

  const handleSave = async () => {
    if (!formData.leagueId || !formData.leagueId.trim()) {
      alert('Please select a league before saving.');
      return;
    }

      const startTime = formData.startTime instanceof Date ? formData.startTime : new Date(formData.startTime);
      let closeTime = formData.closeTime instanceof Date ? formData.closeTime : new Date(formData.closeTime);
      if (closeTime <= startTime) {
        alert('Close time must be after start time. Please adjust the dates.');
        return;
      }
      const minCloseTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
      if (closeTime < minCloseTime) {
        alert('Poll duration must be at least 24 hours. Close time will be adjusted to 24 hours after start time.');
        closeTime = minCloseTime;
      }

    if (isEditMode) {
      if (!validateFixtures()) {
        alert('Please select both teams for all 5 matches before saving.');
        return;
      }
      try {
        setSaving(true);
      const pollData = {
        leagueId: formData.leagueId,
          startTime,
          closeTime,
          fixtures: selectedFixtures.map((f) => ({
          matchNum: f.matchNum,
          teamAId: f.teamA,
            teamAName: availableTeams.find((t) => t.id === f.teamA)?.name,
          teamBId: f.teamB,
            teamBName: availableTeams.find((t) => t.id === f.teamB)?.name,
          })),
        };
        const result = await updatePoll(id, pollData);
        if (result.success) {
          alert(result.message || 'Poll updated successfully!');
          navigate(constants.routes.polls);
      } else {
          alert(result.error || result.data?.error?.message || 'Failed to update poll');
        }
      } catch (error) {
        console.error('Error updating poll:', error);
        alert('Failed to save poll: ' + (error.message || 'Unknown error'));
      } finally {
        setSaving(false);
      }
      return;
    }

    // Create flow: require 5 API fixtures selected
    const apiIds = selectedApiFixtureIds.filter((id) => id != null && !Number.isNaN(id));
    if (apiIds.length !== 5) {
      alert('Please select exactly 5 fixtures from the upcoming fixtures list.');
      return;
    }
    const uniqueIds = [...new Set(apiIds)];
    if (uniqueIds.length !== 5) {
      alert('Each fixture can only be selected once. Please choose 5 different fixtures.');
      return;
    }

    try {
      setSaving(true);
      const result = await createPollFromApi({
        leagueId: formData.leagueId,
        season: formData.season,
        apiFixtureIds: selectedApiFixtureIds,
        startTime,
        closeTime,
      });
      if (result.success) {
        alert(result.message || 'Poll created successfully!');
        navigate(constants.routes.polls);
      } else {
        alert(result.error || 'Failed to create poll');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      alert('Failed to create poll: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  const checkPollRules = () => {
    const selectedLeague = leagues.find((l) => l.id === formData.leagueId);
    // Exclude current poll when in edit mode
    const activePolls = polls.filter(
      (p) => (p.status || p.pollStatus) === 'active' && (!isEditMode || p.id !== id)
    );
    const leaguePolls = activePolls.filter((p) => p.leagueId === formData.leagueId);
    const activePollsCount = activePolls.length;
    const durationHours = differenceInHours(formData.closeTime, formData.startTime);
    const durationDays = differenceInDays(formData.closeTime, formData.startTime);

    return {
      onePollPerLeague: !selectedLeague || leaguePolls.length === 0,
      maxFiveActive: activePollsCount < 5,
      closeAfterStart: formData.closeTime > formData.startTime,
      durationValid: durationHours >= 24 && durationHours <= 30 * 24,
      durationHours,
      durationDays,
    };
  };

  const rules = checkPollRules();

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ width: '100%', maxWidth: '100%' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <IconButton
              onClick={() => navigate(constants.routes.polls)}
              sx={{
                backgroundColor: colors.brandRed,
                color: colors.brandWhite,
                width: 40,
                height: 40,
                '&:hover': {
                  backgroundColor: colors.brandDarkRed,
                },
              }}
            >
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart sx={{ fontSize: 28, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: colors.brandBlack,
                  fontSize: { xs: 24, md: 28 },
                  mb: 0.5,
                }}
              >
                {isEditMode ? 'Edit Poll' : 'Create New Poll'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.textSecondary,
                  fontSize: 14,
                }}
              >
                One poll per league • Max 5 active • 24h-30d duration
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Poll Details Section */}
        <Card
          sx={{
            padding: 3,
            borderRadius: '20px',
            boxShadow: `0 4px 12px ${colors.shadow}14`,
            mb: 3,
            backgroundColor: colors.brandWhite,
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.brandBlack,
                fontSize: 18,
                mb: 0.5,
              }}
            >
              Poll Details
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: 14,
              }}
            >
              Configure the poll settings below
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {/* Select League */}
            <Grid item xs={12}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Stadium sx={{ fontSize: 18, color: colors.brandRed }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.brandBlack,
                      fontSize: 14,
                    }}
                  >
                    Select League
                    <Typography
                      component="span"
                      sx={{
                        color: colors.brandRed,
                        ml: 0.5,
                      }}
                    >
                      *
                    </Typography>
                  </Typography>
                </Box>
                <Autocomplete
                  fullWidth
                  options={leagues}
                  getOptionLabel={(opt) => (opt.country ? `${opt.name} (${opt.country})` : opt.name || '')}
                  value={leagues.find((l) => String(l.id) === String(formData.leagueId)) || null}
                  onChange={(_, newValue) => handleChange('leagueId', newValue?.id ?? '')}
                  isOptionEqualToValue={(opt, val) => opt && val && String(opt.id) === String(val.id)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select League"
                      placeholder="Search leagues..."
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '14px',
                      backgroundColor: `${colors.backgroundLight}80`,
                          '& fieldset': { borderColor: `${colors.divider}66` },
                          '&:hover fieldset': { borderColor: colors.brandRed },
                          '&.Mui-focused fieldset': { borderColor: colors.brandRed },
                        },
                      }}
                    />
                  )}
                />
                {leaguesTotal > 0 && (
                  <Box
                    sx={{
                      mt: 2,
                      pt: 2,
                      borderTop: '1px solid rgba(0,0,0,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          borderRadius: '10px',
                          backgroundColor: '#F5F5F5',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
                          {leagues.length.toLocaleString()} / {leaguesTotal.toLocaleString()} leagues
                        </Typography>
                      </Box>
                      {leaguesTotal > 0 && (
                        <Box
                          sx={{
                            width: 80,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: '#E5E7EB',
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              width: `${Math.min(100, (leagues.length / leaguesTotal) * 100)}%`,
                              height: '100%',
                              borderRadius: 3,
                              background: `linear-gradient(90deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                              transition: 'width 0.25s ease',
                            }}
                          />
                        </Box>
                      )}
                    </Box>
                    {leaguesPage < leaguesTotalPages && (
                      <Button
                        size="small"
                        variant="text"
                        endIcon={leaguesLoadingMore ? null : <ExpandMore />}
                        onClick={loadMoreLeagues}
                        disabled={leaguesLoadingMore}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: colors.brandRed,
                          '&:hover': {
                            backgroundColor: `${colors.brandRed}0C`,
                          },
                        }}
                      >
                        {leaguesLoadingMore ? 'Loading…' : 'Load more leagues'}
                      </Button>
                    )}
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Season (create flow: required for loading API fixtures) */}
            {!isEditMode && (
              <Grid item xs={12} sm={6}>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday sx={{ fontSize: 18, color: colors.brandRed }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}>
                      Season (year)
                    </Typography>
                    <Typography component="span" sx={{ color: colors.brandRed, ml: 0.5 }}>*</Typography>
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    value={formData.season ?? ''}
                    onChange={(e) => {
                      const v = e.target.value ? parseInt(e.target.value, 10) : new Date().getFullYear();
                      handleChange('season', Number.isNaN(v) ? new Date().getFullYear() : v);
                    }}
                    inputProps={{ min: 2020, max: 2030 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '14px',
                        backgroundColor: `${colors.backgroundLight}80`,
                        '& fieldset': { borderColor: `${colors.divider}66` },
                      },
                    }}
                  />
                </Box>
              </Grid>
            )}

            {/* Create flow: Upcoming fixtures from API + select 5 */}
            {!isEditMode && formData.leagueId && formData.season && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    padding: 2,
                    borderRadius: '12px',
                    backgroundColor: `${colors.info}0D`,
                    border: `1px solid ${colors.info}26`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <SportsSoccer sx={{ fontSize: 18, color: colors.info }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
                      Upcoming fixtures (Football API) – select exactly 5
                    </Typography>
                  </Box>
                  {loadingFixtures ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                      <CircularProgress size={28} sx={{ color: colors.brandRed }} />
                      <Typography variant="body2" color="textSecondary">Loading upcoming fixtures...</Typography>
                    </Box>
                  ) : fixturesError ? (
                    <Alert severity="warning">
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                        {fixturesError}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: 12 }}>
                        Ensure the league is linked to the Football API (apiLeagueId set in Leagues).
                      </Typography>
                    </Alert>
                  ) : leagueFixtures.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="caption" color="textSecondary" sx={{ mb: 0.5 }}>
                        Choose one fixture per slot. No duplicate fixtures.
                      </Typography>
                      <Typography variant="caption" sx={{ mb: 0.5, color: colors.textSecondary, fontStyle: 'italic' }}>
                        {leagueFixtures.length} fixtures loaded in each dropdown — scroll inside the list to see all. Use &quot;Load more fixtures&quot; below to load more (e.g. 100+).
                      </Typography>
                      {[0, 1, 2, 3, 4].map((slotIndex) => (
                        <FormControl
                          key={slotIndex}
                          fullWidth
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: `${colors.backgroundLight}80` },
                          }}
                        >
                          <InputLabel>Fixture {slotIndex + 1}</InputLabel>
                  <Select
                            value={selectedApiFixtureIds[slotIndex] ?? ''}
                            onChange={(e) => handleApiFixtureSelect(slotIndex, e.target.value)}
                            label={`Fixture ${slotIndex + 1}`}
                            MenuProps={{
                              disableScrollLock: true,
                              PaperProps: {
                                sx: {
                                  maxHeight: 440,
                                  overflow: 'hidden',
                                },
                                onWheel: (e) => e.stopPropagation(),
                              },
                              MenuListProps: {
                                sx: {
                                  maxHeight: 400,
                                  overflowY: 'auto',
                                  overflowX: 'hidden',
                                  display: 'block',
                                  WebkitOverflowScrolling: 'touch',
                                  // Force scrollbar to show so list is clearly scrollable
                                  '&::-webkit-scrollbar': { width: 8 },
                                  '&::-webkit-scrollbar-track': { background: '#f0f0f0', borderRadius: 4 },
                                  '&::-webkit-scrollbar-thumb': { background: '#bbb', borderRadius: 4 },
                                },
                              },
                              onClose: () => {
                                document.body.style.overflow = '';
                                const main = document.getElementById('main-content-scroll');
                                if (main) main.style.overflowY = 'auto';
                              },
                              onEntered: () => {
                                document.body.style.overflow = 'hidden';
                                const main = document.getElementById('main-content-scroll');
                                if (main) main.style.overflowY = 'hidden';
                              },
                              onExited: () => {
                                document.body.style.overflow = '';
                                const main = document.getElementById('main-content-scroll');
                                if (main) main.style.overflowY = 'auto';
                              },
                            }}
                          >
                            <MenuItem value="">
                              <em>Select a match</em>
                      </MenuItem>
                            {leagueFixtures.map((f) => {
                              const alreadyUsed =
                                selectedApiFixtureIds.some((id, i) => i !== slotIndex && id === f.apiFixtureId);
                              const label = `${f.homeTeamName} vs ${f.awayTeamName}${f.kickoff ? ' – ' + format(new Date(f.kickoff), 'PPp') : ''}`;
                              return (
                                <MenuItem key={f.apiFixtureId} value={f.apiFixtureId} disabled={alreadyUsed}>
                                  {label}
                                  {alreadyUsed && <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>(selected)</Typography>}
                                </MenuItem>
                              );
                            })}
                  </Select>
                </FormControl>
                      ))}
                      {fixturesTotal > 0 && (
                        <Box
                          sx={{
                            mt: 2,
                            pt: 2,
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ px: 1.5, py: 0.5, borderRadius: '10px', backgroundColor: '#F5F5F5' }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
                                {leagueFixtures.length.toLocaleString()} / {fixturesTotal.toLocaleString()} fixtures
                              </Typography>
                            </Box>
                            {fixturesTotal > 0 && (
                              <Box sx={{ width: 80, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB', overflow: 'hidden' }}>
                                <Box
                                  sx={{
                                    width: `${Math.min(100, (leagueFixtures.length / fixturesTotal) * 100)}%`,
                                    height: '100%',
                                    borderRadius: 3,
                                    background: `linear-gradient(90deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                                    transition: 'width 0.25s ease',
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                          {fixturesPage < fixturesTotalPages && (
                            <Button
                              size="small"
                              variant="text"
                              endIcon={fixturesLoadingMore ? null : <ExpandMore />}
                              onClick={loadMoreFixtures}
                              disabled={fixturesLoadingMore}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                color: colors.brandRed,
                                '&:hover': { backgroundColor: `${colors.brandRed}0C` },
                              }}
                            >
                              {fixturesLoadingMore ? 'Loading…' : 'Load more fixtures'}
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  ) : null}
              </Box>
            </Grid>
            )}

            {/* Teams/Matches Display (edit mode only) */}
            {isEditMode && formData.leagueId && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    padding: 2,
                    borderRadius: '12px',
                    backgroundColor: `${colors.info}0D`,
                    border: `1px solid ${colors.info}26`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <SportsSoccer sx={{ fontSize: 18, color: colors.info }} />
                    <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
                      Teams / Matches in this Poll
                    </Typography>
                  </Box>
                  {loadingTeams ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                      <CircularProgress size={32} sx={{ color: colors.brandRed }} />
                      <Typography variant="body2" sx={{ ml: 2, color: colors.textSecondary }}>
                        Loading teams...
                      </Typography>
                    </Box>
                  ) : teamsError ? (
                    <Alert severity="warning" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                        {teamsError}
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: 12 }}>
                        Please ensure the league has active teams assigned.
                      </Typography>
                    </Alert>
                  ) : availableTeams.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Alert severity="info" sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                          Matches per poll: Minimum 5, Maximum 5
                        </Typography>
                        <Typography variant="caption" sx={{ fontSize: 12 }}>
                          (Only Super Admin can override this limit if required)
                        </Typography>
                      </Alert>

                      {/* Selectable Team Matchups */}
                      {selectedFixtures.map((fixture, index) => (
                        <Card
                          key={fixture.matchNum}
                          elevation={0}
                          sx={{
                            padding: 2,
                            borderRadius: '12px',
                            backgroundColor: colors.brandWhite,
                            border: `1px solid ${colors.divider}`,
                            '&:hover': {
                              borderColor: colors.brandRed,
                              boxShadow: `0 2px 8px ${colors.brandRed}20`,
                            }
                          }}
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 2 }}>
                            Match {fixture.matchNum}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
                            <Chip label="Featured Fixture" size="small" sx={{ backgroundColor: `${colors.brandRed}15`, color: colors.brandRed, fontWeight: 600, fontSize: 9, height: 18 }} />
                            <Chip label="Featured Team" size="small" sx={{ backgroundColor: `${colors.brandRed}22`, color: colors.brandRed, fontWeight: 700, fontSize: 9, height: 18 }} />
                          </Box>

                          {/* Team A (Home) – Featured Team Selection */}
                          <FormControl 
                            fullWidth 
                            sx={{ 
                              mb: 1.5,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                bgcolor: `${colors.backgroundLight}80`,
                              }
                            }}
                          >
                            <InputLabel>Team A (Home) – Featured Team</InputLabel>
                            <Select
                              value={fixture.teamA}
                              onChange={(e) => handleTeamSelect(fixture.matchNum, 'teamA', e.target.value)}
                              label="Team A (Home) – Featured Team"
                            >
                              <MenuItem value="">
                                <em>Select Team A</em>
                              </MenuItem>
                              {availableTeams.map((team) => {
                                const isDisabled = !isTeamAvailable(team.id, fixture, 'teamA');
                                return (
                                  <MenuItem 
                                    key={team.id} 
                                    value={team.id}
                                    disabled={isDisabled}
                                  >
                                    {team.name}
                                    {isDisabled && team.id !== fixture.teamA && (
                                      <Typography component="span" variant="caption" sx={{ ml: 1, color: colors.textSecondary, fontStyle: 'italic' }}>
                                        (Already selected)
                                      </Typography>
                                    )}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>

                          {/* VS Divider */}
                          <Divider sx={{ my: 1 }}>
                            <Chip 
                              label="VS" 
                              size="small" 
                              sx={{ 
                                fontWeight: 700, 
                                bgcolor: colors.brandRed, 
                                color: colors.brandWhite,
                                fontSize: 11,
                              }} 
                            />
                          </Divider>

                          {/* Team B (Away) Selection */}
                          <FormControl 
                            fullWidth 
                            sx={{ 
                              mt: 1.5,
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '10px',
                                bgcolor: `${colors.backgroundLight}80`,
                              }
                            }}
                          >
                            <InputLabel>Team B (Away)</InputLabel>
                            <Select
                              value={fixture.teamB}
                              onChange={(e) => handleTeamSelect(fixture.matchNum, 'teamB', e.target.value)}
                              label="Team B (Away)"
                            >
                              <MenuItem value="">
                                <em>Select Team B</em>
                              </MenuItem>
                              {availableTeams.map((team) => {
                                const isDisabled = !isTeamAvailable(team.id, fixture, 'teamB');
                                return (
                                  <MenuItem 
                                    key={team.id} 
                                    value={team.id}
                                    disabled={isDisabled}
                                  >
                                    {team.name}
                                    {isDisabled && team.id !== fixture.teamB && (
                                      <Typography component="span" variant="caption" sx={{ ml: 1, color: colors.textSecondary, fontStyle: 'italic' }}>
                                        (Already selected)
                                      </Typography>
                                    )}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>

                          {/* Selected Teams Preview */}
                          {fixture.teamA && fixture.teamB && (
                            <Box sx={{ mt: 2, p: 1.5, borderRadius: '8px', bgcolor: `${colors.success}0D`, border: `1px solid ${colors.success}40` }}>
                              <Typography variant="caption" sx={{ color: colors.success, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CheckCircle sx={{ fontSize: 14 }} />
                                Match {fixture.matchNum} Ready
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, mt: 0.5 }}>
                                {availableTeams.find(t => t.id === fixture.teamA)?.name}
                                <Chip label="Featured Team" size="small" sx={{ ml: 0.5, verticalAlign: 'middle', backgroundColor: `${colors.brandRed}22`, color: colors.brandRed, fontWeight: 700, fontSize: 9, height: 16 }} />
                                {' vs '}
                                {availableTeams.find(t => t.id === fixture.teamB)?.name}
                              </Typography>
                            </Box>
                          )}
                        </Card>
                      ))}

                      {/* Validation Summary */}
                      {validateFixtures() && (
                        <Alert severity="success" sx={{ mt: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                            ✓ All 5 matches configured correctly
                          </Typography>
                        </Alert>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>
                        No teams available
                      </Typography>
                      <Typography variant="caption" sx={{ fontSize: 12 }}>
                        Select a league above to load teams for the poll.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              </Grid>
            )}

            {/* Start Date & Time */}
            <Grid item xs={12}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarToday sx={{ fontSize: 18, color: colors.brandRed }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.brandBlack,
                      fontSize: 14,
                    }}
                  >
                    Start Date & Time
                    <Typography
                      component="span"
                      sx={{
                        color: colors.brandRed,
                        ml: 0.5,
                      }}
                    >
                      *
                    </Typography>
                  </Typography>
                </Box>
                <DateTimePicker
                  value={formData.startTime}
                  onChange={(date) => handleChange('startTime', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: 'Select start date and time',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          backgroundColor: `${colors.backgroundLight}80`,
                          '& fieldset': {
                            borderColor: `${colors.divider}66`,
                          },
                          '&:hover fieldset': {
                            borderColor: colors.brandRed,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colors.brandRed,
                          },
                        },
                      },
                      InputProps: {
                        startAdornment: (
                          <Box sx={{ mr: 1, color: colors.brandRed }}>
                            <Schedule sx={{ fontSize: 18 }} />
                          </Box>
                        ),
                      },
                    },
                  }}
                  format="EEEE, MMM d, yyyy • HH:mm"
                />
              </Box>
            </Grid>

            {/* Close Date & Time */}
            <Grid item xs={12}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CalendarToday sx={{ fontSize: 18, color: colors.brandRed }} />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.brandBlack,
                      fontSize: 14,
                    }}
                  >
                    Close Date & Time
                    <Typography
                      component="span"
                      sx={{
                        color: colors.brandRed,
                        ml: 0.5,
                      }}
                    >
                      *
                    </Typography>
                  </Typography>
                </Box>
                <DateTimePicker
                  value={formData.closeTime}
                  onChange={(date) => handleChange('closeTime', date)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      placeholder: 'Select close date and time',
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '14px',
                          backgroundColor: `${colors.backgroundLight}80`,
                          '& fieldset': {
                            borderColor: `${colors.divider}66`,
                          },
                          '&:hover fieldset': {
                            borderColor: colors.brandRed,
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: colors.brandRed,
                          },
                        },
                      },
                      InputProps: {
                        startAdornment: (
                          <Box sx={{ mr: 1, color: colors.brandRed }}>
                            <Schedule sx={{ fontSize: 18 }} />
                          </Box>
                        ),
                      },
                    },
                  }}
                  format="EEEE, MMM d, yyyy • HH:mm"
                />
              </Box>
            </Grid>
          </Grid>
        </Card>

        {/* Poll Rules & Requirements Card */}
        <Card
          sx={{
            padding: 3,
            borderRadius: '20px',
            boxShadow: `0 4px 12px ${colors.shadow}14`,
            mb: 3,
            backgroundColor: `${colors.info}0D`,
            border: `1px solid ${colors.info}33`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: colors.info,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Info sx={{ fontSize: 18, color: colors.brandWhite }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: colors.info,
                fontSize: 16,
              }}
            >
              Poll Rules & Requirements
            </Typography>
          </Box>

          <List sx={{ py: 0 }}>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {rules.onePollPerLeague ? (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 20, color: colors.textSecondary }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Only one active poll per league"
                primaryTypographyProps={{
                  fontSize: 14,
                  color: colors.brandBlack,
                  fontWeight: 500,
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {rules.maxFiveActive ? (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 20, color: colors.textSecondary }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Maximum of 5 active polls across all leagues"
                primaryTypographyProps={{
                  fontSize: 14,
                  color: colors.brandBlack,
                  fontWeight: 500,
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <RadioButtonUnchecked sx={{ fontSize: 20, color: colors.textSecondary }} />
              </ListItemIcon>
              <ListItemText
                primary="Manchester United matches are excluded"
                primaryTypographyProps={{
                  fontSize: 14,
                  color: colors.brandBlack,
                  fontWeight: 500,
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {rules.closeAfterStart ? (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 20, color: colors.textSecondary }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Close time must be after start time"
                primaryTypographyProps={{
                  fontSize: 14,
                  color: colors.brandBlack,
                  fontWeight: 500,
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {rules.durationValid ? (
                  <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
                ) : (
                  <RadioButtonUnchecked sx={{ fontSize: 20, color: colors.textSecondary }} />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Poll duration: 24 hours - 30 days"
                primaryTypographyProps={{
                  fontSize: 14,
                  color: colors.brandBlack,
                  fontWeight: 500,
                }}
              />
            </ListItem>
            <ListItem sx={{ px: 0, py: 1 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle sx={{ fontSize: 20, color: colors.success }} />
              </ListItemIcon>
              <ListItemText
                primary="Poll must close before match setup begins"
                primaryTypographyProps={{
                  fontSize: 14,
                  color: colors.brandBlack,
                  fontWeight: 500,
                }}
              />
            </ListItem>
          </List>

          {/* Duration Display */}
          {formData.startTime && formData.closeTime && (
            <Alert
              severity={rules.durationValid ? 'info' : 'error'}
              icon={<Schedule />}
              sx={{
                mt: 2,
                borderRadius: '12px',
                backgroundColor: rules.durationValid ? `${colors.info}1A` : `${colors.error}1A`,
                color: rules.durationValid ? colors.info : colors.error,
                '& .MuiAlert-icon': {
                  color: rules.durationValid ? colors.info : colors.error,
                },
                '& .MuiAlert-message': {
                  fontWeight: 600,
                  fontSize: 14,
                },
              }}
            >
              Duration: {rules.durationHours} hours ({rules.durationDays} day{rules.durationDays !== 1 ? 's' : ''})
            </Alert>
          )}
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Close />}
            onClick={() => navigate(constants.routes.polls)}
            sx={{
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              color: colors.textSecondary,
              borderColor: colors.divider,
              '&:hover': {
                backgroundColor: `${colors.divider}0D`,
                borderColor: colors.divider,
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleSave}
            disabled={
              saving ||
              !formData.leagueId ||
              !rules.onePollPerLeague ||
              !rules.maxFiveActive ||
              !rules.closeAfterStart ||
              !rules.durationValid ||
              (isEditMode ? !validateFixtures() : selectedApiFixtureIds.filter((id) => id != null).length !== 5)
            }
            sx={{
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
              },
              '&.Mui-disabled': {
                background: `${colors.divider}66`,
                color: colors.textSecondary,
              },
            }}
          >
            {saving ? 'Creating...' : isEditMode ? 'Update Poll' : 'Create Poll'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default PollFormPage;
