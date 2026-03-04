import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
  Autocomplete,
} from '@mui/material';
import {
  Add,
  SportsSoccer,
  CheckCircle,
  Cancel,
  Groups,
  History,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  Edit,
  Visibility,
  CalendarToday,
  Person,
  Info,
  People,
  ExpandMore,
} from '@mui/icons-material';
import { colors } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import { format } from 'date-fns';
import { 
  getTeams, 
  createTeam, 
  updateTeam,
  activateTeam,
  inactivateTeam,
  promoteTeam,
  relegateTeam
} from '../services/teamsService';
import { getLeagues } from '../services/leaguesService';

const TeamsPage = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState('all');
  const [leaguesPage, setLeaguesPage] = useState(1);
  const [leaguesTotal, setLeaguesTotal] = useState(0);
  const [leaguesTotalPages, setLeaguesTotalPages] = useState(0);
  const [leaguesLoadingMore, setLeaguesLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [teamsTotalCount, setTeamsTotalCount] = useState(0); // total from API for pagination
  const [teamsActiveTotal, setTeamsActiveTotal] = useState(0); // total active (selected league, no pagination)
  const [teamsInactiveTotal, setTeamsInactiveTotal] = useState(0); // total inactive (selected league, no pagination)
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [dialogTeam, setDialogTeam] = useState(null); // Store team for dialog operations
  const [error, setError] = useState('');
  const [teamsFromFootballApi, setTeamsFromFootballApi] = useState(false); // When true, team_id is API id; Edit/Activate etc. require DB

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [inactivateDialogOpen, setInactivateDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);
  const [relegateDialogOpen, setRelegateDialogOpen] = useState(false);
  
  // Form states
  const [newTeamName, setNewTeamName] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [seasonTag, setSeasonTag] = useState('');
  const [promotionDate, setPromotionDate] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamCountry, setTeamCountry] = useState('');
  const [teamEntryType, setTeamEntryType] = useState('Original');

  const LEAGUES_PAGE_SIZE = 50;

  const loadLeagues = async () => {
    try {
      const result = await getLeagues({ page: 1, limit: LEAGUES_PAGE_SIZE });
      if (result.success && result.data) {
        const formattedLeagues = result.data.leagues?.map(league => ({
          id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          league_id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          name: league.league_name || league.name,
          country: league.country || null,
        })) || [];
        setLeagues(formattedLeagues);
        const pag = result.data.pagination || {};
        setLeaguesTotal(pag.total ?? formattedLeagues.length);
        setLeaguesPage(1);
        setLeaguesTotalPages(pag.pages ?? 1);
      } else {
        setError(result.error || 'Failed to load leagues');
        setLeagues([]);
        setLeaguesTotal(0);
        setLeaguesTotalPages(0);
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
      setError('An unexpected error occurred while loading leagues');
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
        const formatted = result.data.leagues.map(league => ({
          id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          league_id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          name: league.league_name || league.name,
          country: league.country || null,
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

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      // Map frontend filters to backend API parameters
      const apiParams = {
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
        search: searchQuery?.trim() || undefined, // Trim whitespace and only send if not empty
        league_id: selectedLeague !== 'all' ? selectedLeague : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };

      // Remove undefined values
      Object.keys(apiParams).forEach(key => 
        apiParams[key] === undefined && delete apiParams[key]
      );

      console.log('Loading teams with params:', apiParams); // Debug log

      const result = await getTeams(apiParams);

      if (result.success && result.data) {
        const fromApi = result.data.source === 'football_api';
        setTeamsFromFootballApi(!!fromApi);
        // Format teams to match existing structure
        const formattedTeams = result.data.teams?.map(team => ({
          team_id: team._id || team.team_id,
          id: team._id || team.team_id,
          team_name: team.team_name || team.name,
          league_id: team.league_id,
          league_name: team.league_name || team.league?.league_name,
          status: team.status,
          season_tag: team.season_tag,
          entry_type: team.entry_type,
          logo: team.logo,
          country: team.country,
          status_reason: team.status_reason,
          status_changed_at: team.status_changed_at ? new Date(team.status_changed_at) : null,
          created_at: team.created_at ? new Date(team.created_at) : new Date(),
          apiTeamId: team.apiTeamId ?? null,
        })) || [];

        setTeams(formattedTeams);
        setFilteredTeams(formattedTeams);
        const pag = result.data.pagination || {};
        const total = pag.total ?? formattedTeams.length;
        setTeamsTotalCount(total);
        if (result.data.source === 'football_api') {
          setTeamsActiveTotal(total);
          setTeamsInactiveTotal(0);
        } else {
          setTeamsActiveTotal(pag.total_active ?? 0);
          setTeamsInactiveTotal(pag.total_inactive ?? 0);
        }
      } else {
        setTeamsFromFootballApi(false);
        setError(result.error || 'Failed to load teams');
        setTeams([]);
        setFilteredTeams([]);
        setTeamsTotalCount(0);
        setTeamsActiveTotal(0);
        setTeamsInactiveTotal(0);
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      setTeamsFromFootballApi(false);
      setError('An unexpected error occurred while loading teams');
      setTeams([]);
      setFilteredTeams([]);
      setTeamsTotalCount(0);
      setTeamsActiveTotal(0);
      setTeamsInactiveTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, selectedLeague, searchQuery, statusFilter]);

  useEffect(() => {
    loadLeagues();
  }, []);

  // Reset page to 0 when search query changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedLeague, statusFilter]);

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      loadTeams();
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [loadTeams]);

  // Filtering is handled by backend, but we keep this for any additional client-side filtering if needed
  useEffect(() => {
    setFilteredTeams(teams);
  }, [teams]);

  const filterTeams = () => {
    let filtered = [...teams];

    // League filter
    if (selectedLeague !== 'all') {
      filtered = filtered.filter((team) => team.league_id === selectedLeague);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (team) =>
          team.team_name?.toLowerCase().includes(query) ||
          team.team_id?.toLowerCase().includes(query) ||
          team.league_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((team) => team.status === statusFilter);
    }

    setFilteredTeams(filtered);
  };

  const handleMenuOpen = (event, team) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeam(team);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleAddTeam = async () => {
    if (!newTeamName || !selectedLeague || selectedLeague === 'all' || !seasonTag || !teamCountry) {
      alert('Please fill in all required fields: Team Name, League, Season Tag, and Country');
      return;
    }

    try {
      const teamData = {
        team_name: newTeamName.trim(),
      league_id: selectedLeague,
        season_tag: seasonTag.trim(),
      entry_type: teamEntryType,
        logo: teamLogo.trim() || undefined,
        country: teamCountry.trim(),
      };

      const result = await createTeam(teamData);

      if (result.success) {
        alert(result.message || 'Team added successfully!');
    setAddDialogOpen(false);
    setNewTeamName('');
    setSeasonTag('');
    setTeamLogo('');
    setTeamCountry('');
    setTeamEntryType('Original');
        await loadTeams(); // Reload teams
      } else {
        alert(result.error || 'Failed to add team');
      }
    } catch (error) {
      console.error('Error adding team:', error);
      alert('An unexpected error occurred while adding team');
    }
  };

  const handleActivateTeam = async () => {
    if (!statusReason.trim()) {
      alert('Please provide a reason for activation');
      return;
    }

    if (!dialogTeam) {
      alert('Team information is missing. Please try again.');
      return;
    }

    try {
      const result = await activateTeam(dialogTeam.team_id || dialogTeam.id, {
        reason: statusReason.trim(),
      });

      if (result.success) {
        alert(result.message || 'Team activated successfully!');
    setActivateDialogOpen(false);
    setStatusReason('');
        setDialogTeam(null);
    handleMenuClose();
        await loadTeams(); // Reload teams
      } else {
        alert(result.error || 'Failed to activate team');
      }
    } catch (error) {
      console.error('Error activating team:', error);
      alert('An unexpected error occurred while activating team');
    }
  };

  const handleInactivateTeam = async () => {
    if (!statusReason.trim()) {
      alert('Please provide a reason for inactivation');
      return;
    }

    if (!dialogTeam) {
      alert('Team information is missing. Please try again.');
      return;
    }

    try {
      const result = await inactivateTeam(dialogTeam.team_id || dialogTeam.id, {
        reason: statusReason.trim(),
      });

      if (result.success) {
        let message = result.message || 'Team inactivated successfully!';
        if (result.warnings && result.warnings.length > 0) {
          message += '\n\nWarnings:\n' + result.warnings.join('\n');
        }
        alert(message);
    setInactivateDialogOpen(false);
    setStatusReason('');
        setDialogTeam(null);
    handleMenuClose();
        await loadTeams(); // Reload teams
      } else {
        alert(result.error || 'Failed to inactivate team');
      }
    } catch (error) {
      console.error('Error inactivating team:', error);
      alert('An unexpected error occurred while inactivating team');
    }
  };

  const handlePromoteTeam = async () => {
    if (!seasonTag.trim() || !promotionDate) {
      alert('Please provide season tag and promotion date');
      return;
    }

    if (!dialogTeam) {
      alert('Team information is missing. Please try again.');
      return;
    }

    try {
      const result = await promoteTeam(dialogTeam.team_id || dialogTeam.id, {
        season_tag: seasonTag.trim(),
        promotion_date: promotionDate,
        reason: `Promoted on ${format(new Date(promotionDate), 'MMM dd, yyyy')}`,
      });

      if (result.success) {
        alert(result.message || 'Team promoted successfully!');
    setPromoteDialogOpen(false);
    setSeasonTag('');
    setPromotionDate('');
        setDialogTeam(null);
    handleMenuClose();
        await loadTeams(); // Reload teams
      } else {
        alert(result.error || 'Failed to promote team');
      }
    } catch (error) {
      console.error('Error promoting team:', error);
      alert('An unexpected error occurred while promoting team');
    }
  };

  const handleRelegateTeam = async () => {
    if (!statusReason.trim()) {
      alert('Please provide a reason for relegation');
      return;
    }

    if (!dialogTeam) {
      alert('Team information is missing. Please try again.');
      return;
    }

    try {
      const result = await relegateTeam(dialogTeam.team_id || dialogTeam.id, {
        reason: statusReason.trim(),
      });

      if (result.success) {
        alert(result.message || 'Team relegated successfully!');
    setRelegateDialogOpen(false);
    setStatusReason('');
        setDialogTeam(null);
    handleMenuClose();
        await loadTeams(); // Reload teams
      } else {
        alert(result.error || 'Failed to relegate team');
      }
    } catch (error) {
      console.error('Error relegating team:', error);
      alert('An unexpected error occurred while relegating team');
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

  const columns = [
    {
      id: 'logo',
      label: 'Logo',
      minWidth: 72,
      render: (_, row) => (
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            backgroundColor: colors.backgroundLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {row.logo ? (
            <img
              src={row.logo}
              alt={row.team_name || 'Team'}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <SportsSoccer sx={{ fontSize: 22, color: colors.textSecondary }} />
          )}
        </Box>
      ),
    },
    {
      id: 'team_id',
      label: 'Team ID',
      render: (value, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandRed, fontSize: 13 }}>
          {row.team_id || row.id || 'N/A'}
          {row.apiTeamId != null && (
            <Typography component="span" variant="caption" sx={{ display: 'block', color: colors.textSecondary, fontWeight: 400 }}>
              API: {row.apiTeamId}
            </Typography>
          )}
        </Typography>
      ),
    },
    {
      id: 'team_name',
      label: 'Team Name',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'league_name',
      label: 'League',
      render: (value, row) => (
        <Box>
          <Chip
            label={value || '—'}
            size="small"
            sx={{
              backgroundColor: '#FEE2E2',
              color: colors.brandRed,
              fontWeight: 600,
              fontSize: 11,
              height: 24,
            }}
          />
          {row.league_id != null && (
            <Typography variant="caption" sx={{ display: 'block', color: colors.textSecondary, mt: 0.25 }}>
              ID: {row.league_id}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => getStatusChip(row.status),
    },
    {
      id: 'season_tag',
      label: 'Season',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
          {value ?? '—'}
        </Typography>
      ),
    },
    {
      id: 'entry_type',
      label: 'Entry Type',
      render: (_, row) => getEntryTypeChip(row.entry_type),
    },
    {
      id: 'country',
      label: 'Country',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
          {value ?? '—'}
        </Typography>
      ),
    },
    {
      id: 'created_at',
      label: 'Created',
      render: (value) => {
        if (!value) return '—';
        const date = value?.toDate ? value.toDate() : new Date(value);
        return format(date, 'MMM dd, yyyy');
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
            handleMenuOpen(e, row);
          }}
          sx={{
            backgroundColor: colors.brandRed,
            color: colors.brandWhite,
            width: 32,
            height: 32,
            '&:hover': {
              backgroundColor: colors.brandDarkRed,
            },
          }}
        >
          <MoreVert sx={{ fontSize: 18 }} />
        </IconButton>
      ),
    },
  ];

  // Backend handles pagination, so we use filteredTeams directly
  const paginatedTeams = filteredTeams;


  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: '12px',
          }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              backgroundColor: colors.brandRed,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Groups sx={{ fontSize: 24, color: colors.brandWhite }} />
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
              Team Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: 13,
              }}
            >
              Manage football teams by league • Single source of truth
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '20px',
              backgroundColor: '#DBEAFE',
              border: 'none',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <Groups sx={{ fontSize: 28, color: '#3B82F6', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {teamsTotalCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Total Teams
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '20px',
              backgroundColor: '#D1FAE5',
              border: 'none',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <CheckCircle sx={{ fontSize: 28, color: '#10B981', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {teamsActiveTotal}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Active Teams
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '20px',
              backgroundColor: '#F3F4F6',
              border: 'none',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <Cancel sx={{ fontSize: 28, color: '#6B7280', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {teamsInactiveTotal}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Inactive Teams
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '20px',
              backgroundColor: '#FEE2E2',
              border: 'none',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <SportsSoccer sx={{ fontSize: 28, color: colors.brandRed, mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {leagues.length}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Leagues
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* League Selector and Search */}
      <Card
        sx={{
          padding: 0,
          mb: 3,
          borderRadius: '20px',
          backgroundColor: colors.brandWhite,
          border: '1px solid rgba(0,0,0,0.06)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* League dropdown */}
            <Box
              sx={{
                flex: '1 1 260px',
                minWidth: 260,
                maxWidth: 320,
              }}
            >
              <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                League
              </Typography>
              <Autocomplete
                size="small"
                options={[{ id: 'all', name: 'All Leagues', country: null }, ...leagues]}
                getOptionLabel={(opt) => (opt.id === 'all' ? 'All Leagues' : opt.country ? `${opt.name} (${opt.country})` : opt.name || '')}
                value={selectedLeague === 'all' ? { id: 'all', name: 'All Leagues', country: null } : leagues.find((l) => l.id === selectedLeague) || null}
                onChange={(_, newValue) => setSelectedLeague(newValue?.id ?? 'all')}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search or select league..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: '#FAFAFA',
                        '&:hover': { backgroundColor: '#F5F5F5' },
                        '&.Mui-focused': { backgroundColor: colors.brandWhite },
                      },
                    }}
                  />
                )}
              />
            </Box>
            {/* Search teams */}
            <Box sx={{ flex: '2 1 280px', minWidth: 280 }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, mb: 0.5, display: 'block' }}>
                Search teams
              </Typography>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search teams by name or ID..."
              />
            </Box>
            {/* Add Team button */}
            <Box sx={{ alignSelf: 'flex-end' }}>
              <Button
                variant="contained"
                size="medium"
                startIcon={<Add />}
                onClick={() => setAddDialogOpen(true)}
                disabled={selectedLeague === 'all'}
                sx={{
                  background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  py: 1.25,
                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
                  },
                  '&:disabled': {
                    backgroundColor: '#9CA3AF',
                    color: colors.brandWhite,
                    boxShadow: 'none',
                  },
                }}
              >
                Add Team
              </Button>
            </Box>
          </Box>

          {/* Leagues pagination strip */}
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
      </Card>

      {/* Filter Chips */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '100%', maxWidth: '100%' }}>
        <Button
          variant={statusFilter === 'all' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('all')}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: statusFilter === 'all' ? colors.brandRed : 'transparent',
            color: statusFilter === 'all' ? colors.brandWhite : colors.brandBlack,
            borderColor: statusFilter === 'all' ? colors.brandRed : '#FFE5E5',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            py: 1.5,
            borderWidth: statusFilter === 'all' ? 0 : 1,
            '&:hover': {
              backgroundColor: statusFilter === 'all' ? colors.brandDarkRed : '#FFE5E5',
              borderColor: statusFilter === 'all' ? colors.brandDarkRed : colors.brandRed,
            },
          }}
        >
          All Teams
        </Button>
        <Button
          variant={statusFilter === 'Active' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('Active')}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: statusFilter === 'Active' ? '#10B981' : 'transparent',
            color: statusFilter === 'Active' ? colors.brandWhite : colors.brandBlack,
            borderColor: statusFilter === 'Active' ? '#10B981' : '#D1FAE5',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            py: 1.5,
            borderWidth: statusFilter === 'Active' ? 0 : 1,
            '&:hover': {
              backgroundColor: statusFilter === 'Active' ? '#059669' : '#D1FAE5',
              borderColor: statusFilter === 'Active' ? '#059669' : '#10B981',
            },
          }}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'Inactive' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('Inactive')}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: statusFilter === 'Inactive' ? '#6B7280' : 'transparent',
            color: statusFilter === 'Inactive' ? colors.brandWhite : colors.brandBlack,
            borderColor: statusFilter === 'Inactive' ? '#6B7280' : '#F3F4F6',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            py: 1.5,
            borderWidth: statusFilter === 'Inactive' ? 0 : 1,
            '&:hover': {
              backgroundColor: statusFilter === 'Inactive' ? '#4B5563' : '#F3F4F6',
              borderColor: statusFilter === 'Inactive' ? '#4B5563' : '#6B7280',
            },
          }}
        >
          Inactive
        </Button>
      </Box>

      {/* Teams List Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            padding: 0.75,
            backgroundColor: colors.brandRed,
            borderRadius: '8px',
          }}
        >
          <Groups sx={{ fontSize: 18, color: colors.brandWhite }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colors.brandBlack,
            fontSize: 18,
          }}
        >
          Teams List
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: 13,
            ml: 1,
          }}
        >
          {teamsTotalCount > 0 ? `${teamsTotalCount.toLocaleString()} teams found` : 'No teams found'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ml: 'auto' }}>
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
            Rows per page
          </Typography>
          <Select
            size="small"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(0);
            }}
            sx={{
              minWidth: 72,
              height: 36,
              borderRadius: '8px',
              fontSize: 13,
              '& .MuiSelect-select': { py: 0.75 },
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedTeams}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={teamsTotalCount}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        emptyMessage="No teams found"
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 220,
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
            padding: 0.5,
          },
        }}
      >
        {teamsFromFootballApi && (
          <MenuItem disabled sx={{ py: 1.5, opacity: 0.9 }}>
            <Info sx={{ fontSize: 18, color: colors.textSecondary, mr: 1.5 }} />
            <Typography variant="body2" color="textSecondary">Teams from Football API (read-only)</Typography>
          </MenuItem>
        )}
        {!teamsFromFootballApi && selectedTeam?.status === 'Inactive' && (
          <MenuItem
            onClick={() => {
              setDialogTeam(selectedTeam);
              setActivateDialogOpen(true);
              handleMenuClose();
            }}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#D1FAE5',
              },
            }}
          >
            <CheckCircle sx={{ fontSize: 18, color: '#10B981', mr: 1.5 }} />
            <Typography sx={{ fontWeight: 600 }}>Activate Team</Typography>
          </MenuItem>
        )}
        {!teamsFromFootballApi && selectedTeam?.status === 'Active' && (
          <MenuItem
            onClick={() => {
              setDialogTeam(selectedTeam);
              setInactivateDialogOpen(true);
              handleMenuClose();
            }}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#FEE2E2',
              },
            }}
          >
            <Cancel sx={{ fontSize: 18, color: colors.brandRed, mr: 1.5 }} />
            <Typography sx={{ fontWeight: 600 }}>Inactivate Team</Typography>
          </MenuItem>
        )}
        {!teamsFromFootballApi && selectedTeam?.entry_type === 'Original' && selectedTeam?.status === 'Active' && (
          <MenuItem
            onClick={() => {
              setDialogTeam(selectedTeam);
              setPromoteDialogOpen(true);
              handleMenuClose();
            }}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#D1FAE5',
              },
            }}
          >
            <ArrowUpward sx={{ fontSize: 18, color: '#10B981', mr: 1.5 }} />
            <Typography sx={{ fontWeight: 600 }}>Mark as Promoted</Typography>
          </MenuItem>
        )}
        {!teamsFromFootballApi && selectedTeam?.status === 'Active' && (
          <MenuItem
            onClick={() => {
              setDialogTeam(selectedTeam);
              setRelegateDialogOpen(true);
              handleMenuClose();
            }}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#FEE2E2',
              },
            }}
          >
            <ArrowDownward sx={{ fontSize: 18, color: colors.brandRed, mr: 1.5 }} />
            <Typography sx={{ fontWeight: 600 }}>Relegate Team</Typography>
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            navigate(`/teams/${selectedTeam.team_id || selectedTeam.id}/players`);
            handleMenuClose();
          }}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#DBEAFE',
            },
          }}
        >
          <People sx={{ fontSize: 18, color: '#3B82F6', mr: 1.5 }} />
          <Typography sx={{ fontWeight: 600 }}>View Players</Typography>
        </MenuItem>
        {!teamsFromFootballApi && (
          <MenuItem
            onClick={() => {
              navigate(`/teams/history/${selectedTeam.team_id || selectedTeam.id}`);
              handleMenuClose();
            }}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            <History sx={{ fontSize: 18, color: colors.textSecondary, mr: 1.5 }} />
            <Typography sx={{ fontWeight: 600 }}>View History</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Add Team Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setNewTeamName('');
          setSeasonTag('');
          setTeamLogo('');
          setTeamCountry('');
          setTeamEntryType('Original');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
            color: colors.brandWhite,
            px: 3,
            py: 2.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Add sx={{ fontSize: 28, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 20, mb: 0, lineHeight: 1.3 }}>
                Add New Team
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: 13, mt: 0.25 }}>
                Create a new team for the selected league
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              setAddDialogOpen(false);
              setNewTeamName('');
              setSeasonTag('');
              setTeamLogo('');
              setTeamCountry('');
              setTeamEntryType('Original');
            }}
            size="small"
            sx={{
              color: colors.brandWhite,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Cancel sx={{ fontSize: 24 }} />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0, backgroundColor: colors.brandWhite }}>
          {/* Info Alert */}
          <Box sx={{ px: 3, pt: 3 }}>
            <Alert 
              severity="info" 
              icon={<Info sx={{ fontSize: 20 }} />}
              sx={{ 
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                '& .MuiAlert-icon': {
                  color: '#3B82F6',
                },
                '& .MuiAlert-message': {
                  color: '#1E40AF',
                  fontWeight: 500,
                },
              }}
            >
              Teams must belong to a league and cannot be deleted once created.
            </Alert>
          </Box>

          {/* Form Fields */}
          <Box sx={{ px: 3, pb: 2 }}>
            {/* League Selection Card */}
            <Card
              sx={{
                p: 2.5,
                mb: 2.5,
                borderRadius: '16px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                boxShadow: 'none',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
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
                    Selected League
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 16 }}>
                    {(() => {
                      const L = leagues.find((l) => l.id === selectedLeague);
                      return L ? (L.country ? `${L.name} (${L.country})` : L.name) : 'No league selected';
                    })()}
                  </Typography>
                </Box>
              </Box>
              <Autocomplete
                fullWidth
                options={leagues}
                getOptionLabel={(opt) => (opt.country ? `${opt.name} (${opt.country})` : opt.name || '')}
                value={leagues.find((l) => l.id === selectedLeague) || null}
                onChange={(_, newValue) => newValue && setSelectedLeague(newValue.id)}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Change League (Optional)"
                    placeholder="Search leagues..."
                    sx={{
                      borderRadius: '12px',
                      '& .MuiOutlinedInput-root': { borderRadius: '12px' },
                    }}
                  />
                )}
              />
            </Card>

            {/* Team Name Input */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
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
                    Team Information
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 16 }}>
                    Enter Team Name
                  </Typography>
                </Box>
              </Box>
              <TextField
                fullWidth
                label="Team Name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Manchester United, Real Madrid"
                required
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: colors.brandWhite,
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.brandRed,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.brandRed,
                      borderWidth: 2,
                    },
                  },
                  '& .MuiInputLabel-root.Mui-focused': {
                    color: colors.brandRed,
                  },
                }}
                autoFocus
              />
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Season Tag"
                    value={seasonTag}
                    onChange={(e) => setSeasonTag(e.target.value)}
                    placeholder="e.g., 2025-26"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: colors.brandWhite,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.brandRed,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ fontSize: 14 }}>Entry Type</InputLabel>
                    <Select
                      value={teamEntryType}
                      onChange={(e) => setTeamEntryType(e.target.value)}
                      label="Entry Type"
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: colors.brandWhite,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                        },
                      }}
                    >
                      <MenuItem value="Original">Original</MenuItem>
                      <MenuItem value="Promoted">Promoted</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    value={teamCountry}
                    onChange={(e) => setTeamCountry(e.target.value)}
                    placeholder="e.g., England, Spain, Germany"
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: colors.brandWhite,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.brandRed,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Logo URL"
                    value={teamLogo}
                    onChange={(e) => setTeamLogo(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: colors.brandWhite,
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.brandRed,
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: colors.brandRed,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>
        </DialogContent>

        {/* Actions */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            backgroundColor: '#F9FAFB',
            borderTop: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1.5,
          }}
        >
          <Button
            onClick={() => {
              setAddDialogOpen(false);
              setNewTeamName('');
              setSeasonTag('');
              setTeamLogo('');
              setTeamCountry('');
              setTeamEntryType('Original');
            }}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: '12px',
              color: colors.textSecondary,
              '&:hover': {
                backgroundColor: '#F3F4F6',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTeam}
            variant="contained"
            disabled={!newTeamName.trim() || selectedLeague === 'all' || !seasonTag.trim() || !teamCountry.trim()}
            startIcon={<Add />}
            sx={{
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: '12px',
              boxShadow: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
                boxShadow: `0 4px 12px ${colors.brandRed}40`,
              },
              '&:disabled': {
                backgroundColor: '#9CA3AF',
                color: colors.brandWhite,
              },
            }}
          >
            Add Team
          </Button>
        </Box>
      </Dialog>

      {/* Activate Team Dialog */}
      <Dialog
        open={activateDialogOpen}
        onClose={() => {
          setActivateDialogOpen(false);
          setStatusReason('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#10B981', color: colors.brandWhite }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircle sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Activate Team
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Team: {dialogTeam?.team_name || selectedTeam?.team_name}
          </Typography>
          <TextField
            fullWidth
            label="Reason for Activation"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Enter reason (e.g., Promoted from lower division)"
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setActivateDialogOpen(false);
              setStatusReason('');
              setDialogTeam(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleActivateTeam}
            variant="contained"
            sx={{
              backgroundColor: '#10B981',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#059669',
              },
            }}
          >
            Activate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inactivate Team Dialog */}
      <Dialog
        open={inactivateDialogOpen}
        onClose={() => {
          setInactivateDialogOpen(false);
          setStatusReason('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: colors.brandRed, color: colors.brandWhite }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Cancel sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Inactivate Team
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Team: {dialogTeam?.team_name || selectedTeam?.team_name}
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Inactive teams will be hidden from polls and fixtures but remain in history.
          </Alert>
          <TextField
            fullWidth
            label="Reason for Inactivation"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Enter reason (e.g., Relegated, Disbanded)"
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setInactivateDialogOpen(false);
              setStatusReason('');
              setDialogTeam(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInactivateTeam}
            variant="contained"
            sx={{
              backgroundColor: colors.brandRed,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: colors.brandDarkRed,
              },
            }}
          >
            Inactivate
          </Button>
        </DialogActions>
      </Dialog>

      {/* Promote Team Dialog */}
      <Dialog
        open={promoteDialogOpen}
        onClose={() => {
          setPromoteDialogOpen(false);
          setSeasonTag('');
          setPromotionDate('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: '#10B981', color: colors.brandWhite }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ArrowUpward sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Mark Team as Promoted
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Team: {dialogTeam?.team_name || selectedTeam?.team_name}
          </Typography>
          <TextField
            fullWidth
            label="Season Tag"
            value={seasonTag}
            onChange={(e) => setSeasonTag(e.target.value)}
            placeholder="e.g., 2025-26"
            sx={{ mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Promotion Date"
            type="date"
            value={promotionDate}
            onChange={(e) => setPromotionDate(e.target.value)}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setPromoteDialogOpen(false);
              setSeasonTag('');
              setPromotionDate('');
              setDialogTeam(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePromoteTeam}
            variant="contained"
            sx={{
              backgroundColor: '#10B981',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#059669',
              },
            }}
          >
            Mark as Promoted
          </Button>
        </DialogActions>
      </Dialog>

      {/* Relegate Team Dialog */}
      <Dialog
        open={relegateDialogOpen}
        onClose={() => {
          setRelegateDialogOpen(false);
          setStatusReason('');
        }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle sx={{ backgroundColor: colors.brandRed, color: colors.brandWhite }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ArrowDownward sx={{ fontSize: 24 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Relegate Team
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
            Team: {dialogTeam?.team_name || selectedTeam?.team_name}
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Relegated teams will be marked as inactive and hidden from polls and fixtures.
          </Alert>
          <TextField
            fullWidth
            label="Reason for Relegation"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
            placeholder="Enter reason (e.g., Finished bottom of table)"
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => {
              setRelegateDialogOpen(false);
              setStatusReason('');
              setDialogTeam(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRelegateTeam}
            variant="contained"
            sx={{
              backgroundColor: colors.brandRed,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: colors.brandDarkRed,
              },
            }}
          >
            Relegate
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default TeamsPage;
