import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Person,
  CheckCircle,
  Cancel,
  MoreVert,
  Edit,
  ArrowBack,
  SportsSoccer,
  Groups,
  Info,
  Block,
  Restore,
  CalendarToday,
} from '@mui/icons-material';
import { colors } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import { format } from 'date-fns';
import { 
  getPlayersByTeam, 
  createPlayer, 
  updatePlayer, 
  deactivatePlayerTemporary, 
  deactivatePlayerPermanent, 
  reactivatePlayer 
} from '../services/playersService';
import { getTeam } from '../services/teamsService';

const PlayersPage = () => {
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [playersTotalCount, setPlayersTotalCount] = useState(0);
  const [playersActiveTotal, setPlayersActiveTotal] = useState(0);
  const [playersInactiveTempTotal, setPlayersInactiveTempTotal] = useState(0);
  const [playersInactivePermTotal, setPlayersInactivePermTotal] = useState(0);
  const [playersFromFootballApi, setPlayersFromFootballApi] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [error, setError] = useState('');

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    player_id: '', // Store player ID for operations
    player_name: '',
    position: '',
    shirt_number: '',
    status: 'active',
    inactive_reason: '',
    inactive_note: '',
    inactive_from: '',
    inactive_until: '',
  });

  const loadTeamAndPlayers = useCallback(async () => {
    if (!teamId) {
      setError('Team ID is required');
      setTeam(null);
      setPlayers([]);
      setFilteredPlayers([]);
      setLoading(false);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...(searchQuery.trim() && { search: searchQuery.trim() }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };
      const [teamResult, playersResult] = await Promise.all([
        getTeam(teamId),
        getPlayersByTeam(teamId, params),
      ]);
      const fromApi = playersResult.data?.source === 'football_api';
      setPlayersFromFootballApi(!!fromApi);
      if (fromApi && playersResult.data?.team) {
        const t = playersResult.data.team;
        setTeam({
          team_id: t.team_id || teamId,
          team_name: t.team_name || `Team ${teamId}`,
          league_id: null,
          league_name: '—',
          status: t.status || 'Active',
          season_tag: '—',
        });
      } else if (teamResult.success && teamResult.data?.team) {
        const teamData = teamResult.data.team;
        setTeam({
          team_id: teamData.team_id || teamData._id,
          team_name: teamData.team_name,
          league_id: teamData.league_id?._id || teamData.league_id,
          league_name: teamData.league_id?.league_name || teamData.leagueName || 'Unknown League',
          status: teamData.status,
          season_tag: teamData.season_tag || '2025-26',
        });
      } else {
        setTeam({
          team_id: teamId,
          team_name: 'Unknown',
          league_id: null,
          league_name: '—',
          status: '—',
          season_tag: '—',
        });
      }
      if (playersResult.success && playersResult.data?.players) {
        const formattedPlayers = playersResult.data.players.map((player) => ({
          player_id: player.player_id || player._id,
          team_id: player.team_id?._id || player.team_id,
          player_name: player.player_name,
          position: player.position,
          shirt_number: player.shirt_number,
          status: player.status || 'active',
          inactive_reason: player.inactive_reason,
          inactive_note: player.inactive_note,
          inactive_from: player.inactive_from ? new Date(player.inactive_from) : null,
          inactive_until: player.inactive_until ? new Date(player.inactive_until) : null,
          created_by_admin: player.created_by_admin?._id || player.created_by_admin,
          created_at: player.created_at ? new Date(player.created_at) : new Date(),
          updated_at: player.updated_at ? new Date(player.updated_at) : new Date(),
          apiPlayerId: player.apiPlayerId,
        }));
        setPlayers(formattedPlayers);
        setFilteredPlayers(formattedPlayers);
        const pag = playersResult.data.pagination || {};
        setPlayersTotalCount(pag.total ?? formattedPlayers.length);
        setPlayersActiveTotal(pag.total_active ?? 0);
        setPlayersInactiveTempTotal(pag.total_inactive_temporary ?? 0);
        setPlayersInactivePermTotal(pag.total_inactive_permanent ?? 0);
      } else {
        setPlayers([]);
        setFilteredPlayers([]);
        setPlayersTotalCount(0);
        setPlayersActiveTotal(0);
        setPlayersInactiveTempTotal(0);
        setPlayersInactivePermTotal(0);
        setPlayersFromFootballApi(false);
        if (playersResult.error) console.warn('Error loading players:', playersResult.error);
      }
    } catch (err) {
      console.error('Error loading team and players:', err);
      setError('Failed to load team and players. Please try again.');
      setTeam(null);
      setPlayers([]);
      setFilteredPlayers([]);
      setPlayersTotalCount(0);
      setPlayersActiveTotal(0);
      setPlayersInactiveTempTotal(0);
      setPlayersInactivePermTotal(0);
      setPlayersFromFootballApi(false);
    } finally {
      setLoading(false);
    }
  }, [teamId, page, rowsPerPage, searchQuery, statusFilter]);

  useEffect(() => {
    if (teamId) loadTeamAndPlayers();
  }, [teamId, loadTeamAndPlayers]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  const handleMenuOpen = (event, player) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlayer(player);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPlayer(null);
  };

  const handleAddPlayer = async () => {
    if (!formData.player_name || !formData.position || !formData.shirt_number) {
      setError('Please fill in all required fields: Player Name, Position, and Shirt Number');
      return;
    }

    if (!teamId) {
      setError('Team ID is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Validate shirt_number is a valid number
      const shirtNumber = parseInt(formData.shirt_number);
      if (isNaN(shirtNumber) || shirtNumber < 1 || shirtNumber > 99) {
        setError('Shirt number must be between 1 and 99');
        setSaving(false);
        return;
      }

      const playerData = {
        team_id: teamId,
        player_name: formData.player_name.trim(),
        position: formData.position,
        shirt_number: shirtNumber, // Send as number
      };

      // Debug log to see what's being sent
      console.log('Creating player with data:', playerData);

      const result = await createPlayer(playerData);

      if (result.success && result.data) {
        // Close dialog and reset form
        setAddDialogOpen(false);
        resetForm();
        setError(''); // Clear any previous errors
        
        // Show success message
        alert(result.message || 'Player added successfully!');
        
        // Reload players list to get the updated data from backend
        await loadTeamAndPlayers();
      } else {
        // Show detailed error message from backend
        const errorMsg = result.error || result.data?.error?.message || result.data?.message || 'Failed to add player. Please try again.';
        console.error('Player creation failed - Full error details:', {
          result,
          playerData,
          error: result.error,
          data: result.data
        });
        setError(errorMsg);
      }
    } catch (error) {
      console.error('Error adding player:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPlayer = async () => {
    if (!formData.player_name || !formData.position || !formData.shirt_number) {
      setError('Please fill in all required fields');
      return;
    }

    if (!formData.player_id) {
      setError('Player ID is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const playerData = {
        player_name: formData.player_name.trim(),
        position: formData.position,
        shirt_number: parseInt(formData.shirt_number),
      };

      const result = await updatePlayer(formData.player_id, playerData);

      if (result.success && result.data) {
        // Close dialog and reset form
        setEditDialogOpen(false);
        resetForm();
        handleMenuClose();
        setError(''); // Clear any previous errors
        
        // Show success message
        alert(result.message || 'Player updated successfully!');
        
        // Reload players list to get the updated data from backend
        await loadTeamAndPlayers();
      } else {
        setError(result.error || 'Failed to update player. Please try again.');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivatePlayer = async () => {
    if (!formData.inactive_reason) {
      setError('Please provide a reason for deactivation');
      return;
    }

    if (!formData.player_id) {
      setError('Player ID is required');
      return;
    }

    const deactivationType = formData.status === 'inactive_permanent' ? 'permanent' : 'temporary';
    
    if (deactivationType === 'permanent') {
      if (!window.confirm('Are you sure you want to permanently deactivate this player? This action cannot be undone.')) {
        return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const deactivationData = {
        inactive_reason: formData.inactive_reason.trim(),
        inactive_note: formData.inactive_note?.trim() || undefined,
        inactive_from: formData.inactive_from || undefined,
        inactive_until: formData.inactive_until || undefined,
      };

      // Add confirmation for permanent deactivation
      if (deactivationType === 'permanent') {
        deactivationData.confirm = true;
      }

      let result;
      if (deactivationType === 'permanent') {
        result = await deactivatePlayerPermanent(formData.player_id, deactivationData);
      } else {
        result = await deactivatePlayerTemporary(formData.player_id, deactivationData);
      }

      if (result.success && result.data) {
        // Close dialog and reset form
        setDeactivateDialogOpen(false);
        resetForm();
        handleMenuClose();
        setError(''); // Clear any previous errors
        
        // Show success message
        alert(result.message || `Player ${deactivationType === 'permanent' ? 'permanently' : 'temporarily'} deactivated successfully!`);
        
        // Reload players list to get the updated data from backend
        await loadTeamAndPlayers();
      } else {
        setError(result.error || `Failed to ${deactivationType === 'permanent' ? 'permanently' : 'temporarily'} deactivate player. Please try again.`);
      }
    } catch (error) {
      console.error('Error deactivating player:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReactivatePlayer = async () => {
    // Use player_id from formData since selectedPlayer is cleared when menu closes
    const playerId = formData.player_id || selectedPlayer?.player_id;
    
    if (!playerId) {
      setError('Player ID is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await reactivatePlayer(playerId);

      if (result.success && result.data) {
        // Close dialog
        setReactivateDialogOpen(false);
        handleMenuClose();
        setError(''); // Clear any previous errors
        
        // Show success message
        alert(result.message || 'Player reactivated successfully!');
        
        // Reload players list to get the updated data from backend
        await loadTeamAndPlayers();
      } else {
        setError(result.error || 'Failed to reactivate player. Please try again.');
      }
    } catch (error) {
      console.error('Error reactivating player:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      player_id: '',
      player_name: '',
      position: '',
      shirt_number: '',
      status: 'active',
      inactive_reason: '',
      inactive_note: '',
      inactive_from: '',
      inactive_until: '',
    });
  };

  const openEditDialog = () => {
    setFormData({
      player_id: selectedPlayer.player_id,
      player_name: selectedPlayer.player_name,
      position: selectedPlayer.position,
      shirt_number: selectedPlayer.shirt_number.toString(),
      status: selectedPlayer.status,
      inactive_reason: selectedPlayer.inactive_reason || '',
      inactive_note: selectedPlayer.inactive_note || '',
      inactive_from: selectedPlayer.inactive_from ? format(new Date(selectedPlayer.inactive_from), 'yyyy-MM-dd') : '',
      inactive_until: selectedPlayer.inactive_until ? format(new Date(selectedPlayer.inactive_until), 'yyyy-MM-dd') : '',
    });
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const openDeactivateDialog = () => {
    setFormData({
      player_id: selectedPlayer.player_id, // Store player ID before closing menu
      player_name: selectedPlayer.player_name,
      position: selectedPlayer.position,
      shirt_number: selectedPlayer.shirt_number.toString(),
      status: 'inactive_temporary',
      inactive_reason: '',
      inactive_note: '',
      inactive_from: format(new Date(), 'yyyy-MM-dd'),
      inactive_until: '',
    });
    setDeactivateDialogOpen(true);
    handleMenuClose();
  };

  const getStatusChip = (status) => {
    const config = {
      active: { label: 'ACTIVE', bgColor: '#10B981', textColor: colors.brandWhite },
      inactive_temporary: { label: 'INACTIVE (TEMP)', bgColor: '#F59E0B', textColor: colors.brandWhite },
      inactive_permanent: { label: 'INACTIVE (PERM)', bgColor: '#6B7280', textColor: colors.brandWhite },
    };

    const statusConfig = config[status] || config.active;

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

  const getPositionChip = (position) => {
    const positionColors = {
      Goalkeeper: '#3B82F6',
      Defender: '#10B981',
      Midfielder: '#F59E0B',
      Forward: '#EF4444',
    };

    const color = positionColors[position] || '#6B7280';

    return (
      <Chip
        label={position}
        size="small"
        sx={{
          backgroundColor: `${color}20`,
          color: color,
          fontWeight: 600,
          fontSize: 11,
          height: 24,
          borderRadius: '6px',
          border: `1px solid ${color}40`,
        }}
      />
    );
  };

  const columns = [
    {
      id: 'player_id',
      label: 'Player ID',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandRed, fontSize: 13 }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'player_name',
      label: 'Player Name',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'position',
      label: 'Position',
      render: (_, row) => getPositionChip(row.position),
    },
    {
      id: 'shirt_number',
      label: 'Shirt #',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13, fontWeight: 600 }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => getStatusChip(row.status),
    },
    {
      id: 'inactive_reason',
      label: 'Inactive Reason',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 12 }}>
          {value || '-'}
        </Typography>
      ),
    },
    {
      id: 'inactive_until',
      label: 'Return Date',
      render: (value) => {
        if (!value) return '-';
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

  const paginatedPlayers = filteredPlayers;

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
              width: 48,
              height: 48,
              backgroundColor: colors.brandRed,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Person sx={{ fontSize: 24, color: colors.brandWhite }} />
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
              Player Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: 13,
              }}
            >
              Manage players for {team.team_name} • {team.league_name}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Team Header Card */}
      <Card
        sx={{
          padding: 3,
          mb: 3,
          borderRadius: '20px',
          backgroundColor: colors.brandWhite,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '16px',
                  backgroundColor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SportsSoccer sx={{ fontSize: 32, color: colors.brandRed }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                  {team.team_name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  {team.league_name && team.league_name !== '—' && (
                    <Chip
                      label={team.league_name}
                      size="small"
                      sx={{
                        backgroundColor: '#FEE2E2',
                        color: colors.brandRed,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  )}
                  {team.season_tag && team.season_tag !== '—' && (
                    <Chip
                      label={team.season_tag}
                      size="small"
                      sx={{
                        backgroundColor: '#DBEAFE',
                        color: '#3B82F6',
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  )}
                  {!playersFromFootballApi && team.status && (
                    <Chip
                      label={team.status}
                      size="small"
                      sx={{
                        backgroundColor: '#10B981',
                        color: colors.brandWhite,
                        fontWeight: 600,
                        fontSize: 11,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>
          {!playersFromFootballApi && (
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1.5 }}>
                <Button
                  variant="outlined"
                  startIcon={<Groups />}
                  onClick={() => navigate(`/teams/history/${team.team_id}`)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '12px',
                  }}
                >
                  View History
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Card>

      {/* Stats Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
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
            <Person sx={{ fontSize: 28, color: '#10B981', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {playersTotalCount}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Total Players
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
              {playersActiveTotal}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Active Players
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              padding: 3,
              borderRadius: '20px',
              backgroundColor: '#FEF3C7',
              border: 'none',
              boxShadow: 'none',
              textAlign: 'center',
            }}
          >
            <CalendarToday sx={{ fontSize: 28, color: '#F59E0B', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {playersInactiveTempTotal}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Temp Inactive
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
            <Block sx={{ fontSize: 28, color: '#6B7280', mb: 1 }} />
            <Typography variant="h3" sx={{ fontWeight: 500, color: colors.brandBlack, mb: 0.5, fontSize: 32 }}>
              {playersInactivePermTotal}
            </Typography>
            <Typography variant="body2" sx={{ color: '#6B7280', fontSize: 15 }}>
              Perm Inactive
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Card
        sx={{
          padding: 3,
          mb: 3,
          borderRadius: '24px',
          backgroundColor: colors.brandWhite,
          border: 'none',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          display: 'flex',
          gap: 2.5,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search players by name, position, or shirt number..."
          />
        </Box>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Status Filter</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Status Filter"
            sx={{
              borderRadius: '12px',
            }}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive_temporary">Temporary Inactive</MenuItem>
            <MenuItem value="inactive_permanent">Permanent Inactive</MenuItem>
          </Select>
        </FormControl>
        {!playersFromFootballApi && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              resetForm();
              setAddDialogOpen(true);
            }}
            sx={{
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
              py: 1.25,
            }}
          >
            Add Player
          </Button>
        )}
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
          All Players
        </Button>
        <Button
          variant={statusFilter === 'active' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('active')}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: statusFilter === 'active' ? '#10B981' : 'transparent',
            color: statusFilter === 'active' ? colors.brandWhite : colors.brandBlack,
            borderColor: statusFilter === 'active' ? '#10B981' : '#D1FAE5',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            py: 1.5,
            borderWidth: statusFilter === 'active' ? 0 : 1,
            '&:hover': {
              backgroundColor: statusFilter === 'active' ? '#059669' : '#D1FAE5',
              borderColor: statusFilter === 'active' ? '#059669' : '#10B981',
            },
          }}
        >
          Active
        </Button>
        <Button
          variant={statusFilter === 'inactive_temporary' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('inactive_temporary')}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: statusFilter === 'inactive_temporary' ? '#F59E0B' : 'transparent',
            color: statusFilter === 'inactive_temporary' ? colors.brandWhite : colors.brandBlack,
            borderColor: statusFilter === 'inactive_temporary' ? '#F59E0B' : '#FEF3C7',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            py: 1.5,
            borderWidth: statusFilter === 'inactive_temporary' ? 0 : 1,
            '&:hover': {
              backgroundColor: statusFilter === 'inactive_temporary' ? '#D97706' : '#FEF3C7',
              borderColor: statusFilter === 'inactive_temporary' ? '#D97706' : '#F59E0B',
            },
          }}
        >
          Temp Inactive
        </Button>
        <Button
          variant={statusFilter === 'inactive_permanent' ? 'contained' : 'outlined'}
          onClick={() => setStatusFilter('inactive_permanent')}
          sx={{
            flex: '1 1 0',
            minWidth: 0,
            backgroundColor: statusFilter === 'inactive_permanent' ? '#6B7280' : 'transparent',
            color: statusFilter === 'inactive_permanent' ? colors.brandWhite : colors.brandBlack,
            borderColor: statusFilter === 'inactive_permanent' ? '#6B7280' : '#F3F4F6',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            py: 1.5,
            borderWidth: statusFilter === 'inactive_permanent' ? 0 : 1,
            '&:hover': {
              backgroundColor: statusFilter === 'inactive_permanent' ? '#4B5563' : '#F3F4F6',
              borderColor: statusFilter === 'inactive_permanent' ? '#4B5563' : '#6B7280',
            },
          }}
        >
          Perm Inactive
        </Button>
      </Box>

      {/* Players List Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            padding: 0.75,
            backgroundColor: colors.brandRed,
            borderRadius: '8px',
          }}
        >
          <Person sx={{ fontSize: 18, color: colors.brandWhite }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colors.brandBlack,
            fontSize: 18,
          }}
        >
          Players List
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: 13,
            ml: 1,
          }}
        >
          {playersTotalCount > 0 ? `${playersTotalCount.toLocaleString()} players found` : 'No players found'}
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
        data={paginatedPlayers}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={playersTotalCount}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        emptyMessage="No players found"
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
        {playersFromFootballApi && (
          <MenuItem disabled sx={{ py: 1.5, opacity: 0.9 }}>
            <Info sx={{ fontSize: 18, color: colors.textSecondary, mr: 1.5 }} />
            <Typography variant="body2" color="textSecondary">Players from Football API (read-only)</Typography>
          </MenuItem>
        )}
        {!playersFromFootballApi && selectedPlayer?.status === 'active' && (
          <>
            <MenuItem
              onClick={openEditDialog}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#DBEAFE',
                },
              }}
            >
              <Edit sx={{ fontSize: 18, color: '#3B82F6', mr: 1.5 }} />
              <Typography sx={{ fontWeight: 600 }}>Edit Player</Typography>
            </MenuItem>
            <MenuItem
              onClick={openDeactivateDialog}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#FEE2E2',
                },
              }}
            >
              <Block sx={{ fontSize: 18, color: colors.brandRed, mr: 1.5 }} />
              <Typography sx={{ fontWeight: 600 }}>Deactivate Player</Typography>
            </MenuItem>
          </>
        )}
        {!playersFromFootballApi && (selectedPlayer?.status === 'inactive_temporary' || selectedPlayer?.status === 'inactive_permanent') && (
          <>
            <MenuItem
              onClick={openEditDialog}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '8px',
                '&:hover': {
                  backgroundColor: '#DBEAFE',
                },
              }}
            >
              <Edit sx={{ fontSize: 18, color: '#3B82F6', mr: 1.5 }} />
              <Typography sx={{ fontWeight: 600 }}>Edit Player</Typography>
            </MenuItem>
            {selectedPlayer?.status === 'inactive_temporary' && (
              <MenuItem
                onClick={() => {
                  // Store player ID in formData before closing menu
                  setFormData(prev => ({
                    ...prev,
                    player_id: selectedPlayer.player_id,
                    player_name: selectedPlayer.player_name,
                  }));
                  setReactivateDialogOpen(true);
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
                <Restore sx={{ fontSize: 18, color: '#10B981', mr: 1.5 }} />
                <Typography sx={{ fontWeight: 600 }}>Reactivate Player</Typography>
              </MenuItem>
            )}
          </>
        )}
      </Menu>

      {/* Add Player Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          resetForm();
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
                Add New Player
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: 13, mt: 0.25 }}>
                Add a player to {team.team_name}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              if (!saving) {
                setAddDialogOpen(false);
                resetForm();
                setError('');
              }
            }}
            size="small"
            disabled={saving}
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
          <Box sx={{ px: 3, pt: 3 }}>
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
              Players must belong to an active team. Only active players appear in predictions.
            </Alert>
          </Box>

          <Box sx={{ px: 3, pb: 2 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Player Name"
                  value={formData.player_name}
                  onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                  placeholder="e.g., Marcus Rashford"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                  }}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    label="Position"
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    }}
                  >
                    <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                    <MenuItem value="Defender">Defender</MenuItem>
                    <MenuItem value="Midfielder">Midfielder</MenuItem>
                    <MenuItem value="Forward">Forward</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shirt Number"
                  type="number"
                  value={formData.shirt_number}
                  onChange={(e) => setFormData({ ...formData, shirt_number: e.target.value })}
                  placeholder="e.g., 10"
                  required
                  inputProps={{ min: 1, max: 99 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

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
              if (!saving) {
                setAddDialogOpen(false);
                resetForm();
                setError('');
              }
            }}
            disabled={saving}
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
            onClick={handleAddPlayer}
            variant="contained"
            disabled={saving || !formData.player_name.trim() || !formData.position || !formData.shirt_number}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: colors.brandWhite }} /> : <Add />}
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
            {saving ? 'Adding Player...' : 'Add Player'}
          </Button>
        </Box>
      </Dialog>

      {/* Edit Player Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          resetForm();
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
        <Box
          sx={{
            background: `linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)`,
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
              <Edit sx={{ fontSize: 28, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 20, mb: 0, lineHeight: 1.3 }}>
                Edit Player
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: 13, mt: 0.25 }}>
                Update player information
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              if (!saving) {
                setEditDialogOpen(false);
                resetForm();
                setError('');
              }
            }}
            size="small"
            disabled={saving}
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
          <Box sx={{ px: 3, pt: 3 }}>
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
          </Box>
          <Box sx={{ px: 3, pb: 2 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Player Name"
                  value={formData.player_name}
                  onChange={(e) => setFormData({ ...formData, player_name: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    label="Position"
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    }}
                  >
                    <MenuItem value="Goalkeeper">Goalkeeper</MenuItem>
                    <MenuItem value="Defender">Defender</MenuItem>
                    <MenuItem value="Midfielder">Midfielder</MenuItem>
                    <MenuItem value="Forward">Forward</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Shirt Number"
                  type="number"
                  value={formData.shirt_number}
                  onChange={(e) => setFormData({ ...formData, shirt_number: e.target.value })}
                  required
                  inputProps={{ min: 1, max: 99 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

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
              if (!saving) {
                setEditDialogOpen(false);
                resetForm();
                setError('');
              }
            }}
            disabled={saving}
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
            onClick={handleEditPlayer}
            variant="contained"
            disabled={saving || !formData.player_name.trim() || !formData.position || !formData.shirt_number}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: colors.brandWhite }} /> : <Edit />}
            sx={{
              background: `linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)`,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: '12px',
              boxShadow: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)`,
                boxShadow: `0 4px 12px #3B82F640`,
              },
              '&:disabled': {
                backgroundColor: '#9CA3AF',
                color: colors.brandWhite,
              },
            }}
          >
            {saving ? 'Updating Player...' : 'Update Player'}
          </Button>
        </Box>
      </Dialog>

      {/* Deactivate Player Dialog */}
      <Dialog
        open={deactivateDialogOpen}
        onClose={() => {
          setDeactivateDialogOpen(false);
          resetForm();
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
              <Block sx={{ fontSize: 28, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 20, mb: 0, lineHeight: 1.3 }}>
                Deactivate Player
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: 13, mt: 0.25 }}>
                {formData.player_name || selectedPlayer?.player_name}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              if (!saving) {
                setDeactivateDialogOpen(false);
                resetForm();
                setError('');
              }
            }}
            size="small"
            disabled={saving}
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
          <Box sx={{ px: 3, pt: 3 }}>
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
            <Alert
              severity="warning"
              sx={{
                mb: 3,
                borderRadius: '12px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                '& .MuiAlert-icon': {
                  color: '#F59E0B',
                },
                '& .MuiAlert-message': {
                  color: '#92400E',
                  fontWeight: 500,
                },
              }}
            >
              Inactive players will be hidden from predictions. Permanent deactivation cannot be undone.
            </Alert>
          </Box>

          <Box sx={{ px: 3, pb: 2 }}>
            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Deactivation Type</InputLabel>
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    label="Deactivation Type"
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    }}
                  >
                    <MenuItem value="inactive_temporary">Temporary (Injury, Suspension, etc.)</MenuItem>
                    <MenuItem value="inactive_permanent">Permanent (Transfer, Retirement, etc.)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Reason"
                  value={formData.inactive_reason}
                  onChange={(e) => setFormData({ ...formData, inactive_reason: e.target.value })}
                  placeholder="e.g., Knee injury, Transferred to another club"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Additional Notes"
                  value={formData.inactive_note}
                  onChange={(e) => setFormData({ ...formData, inactive_note: e.target.value })}
                  placeholder="Optional: Additional details"
                  multiline
                  rows={3}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: colors.brandWhite,
                    },
                  }}
                />
              </Grid>
              {formData.status === 'inactive_temporary' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Inactive From"
                      type="date"
                      value={formData.inactive_from}
                      onChange={(e) => setFormData({ ...formData, inactive_from: e.target.value })}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: colors.brandWhite,
                        },
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expected Return Date"
                      type="date"
                      value={formData.inactive_until}
                      onChange={(e) => setFormData({ ...formData, inactive_until: e.target.value })}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: colors.brandWhite,
                        },
                      }}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        </DialogContent>

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
              if (!saving) {
                setDeactivateDialogOpen(false);
                resetForm();
                setError('');
              }
            }}
            disabled={saving}
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
            onClick={handleDeactivatePlayer}
            variant="contained"
            disabled={saving || !formData.inactive_reason.trim()}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: colors.brandWhite }} /> : <Block />}
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
            {saving 
              ? (formData.status === 'inactive_permanent' ? 'Deactivating...' : 'Deactivating...')
              : (formData.status === 'inactive_permanent' ? 'Permanently Deactivate' : 'Temporarily Deactivate')
            }
          </Button>
        </Box>
      </Dialog>

      {/* Reactivate Player Dialog */}
      <Dialog
        open={reactivateDialogOpen}
        onClose={() => setReactivateDialogOpen(false)}
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
        <Box
          sx={{
            background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
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
              <Restore sx={{ fontSize: 28, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 20, mb: 0, lineHeight: 1.3 }}>
                Reactivate Player
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: 13, mt: 0.25 }}>
                {selectedPlayer?.player_name}
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => {
              if (!saving) {
                setReactivateDialogOpen(false);
                setError('');
              }
            }}
            size="small"
            disabled={saving}
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
          <Box sx={{ px: 3, pt: 3 }}>
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
          </Box>
          <Box sx={{ px: 3, pb: 2 }}>
            <Alert
              severity="info"
              sx={{
                mb: 2,
                borderRadius: '12px',
                backgroundColor: '#D1FAE5',
                border: '1px solid #86EFAC',
                '& .MuiAlert-icon': {
                  color: '#10B981',
                },
                '& .MuiAlert-message': {
                  color: '#065F46',
                  fontWeight: 500,
                },
              }}
            >
              This player will become active and will appear in predictions again.
            </Alert>
            <Typography variant="body2" sx={{ color: colors.textSecondary }}>
              Are you sure you want to reactivate <strong>{selectedPlayer?.player_name}</strong>?
            </Typography>
          </Box>
        </DialogContent>

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
              if (!saving) {
                setReactivateDialogOpen(false);
                setError('');
              }
            }}
            disabled={saving}
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
            onClick={handleReactivatePlayer}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} sx={{ color: colors.brandWhite }} /> : <Restore />}
            sx={{
              background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.25,
              borderRadius: '12px',
              boxShadow: 'none',
              '&:hover': {
                background: `linear-gradient(135deg, #059669 0%, #10B981 100%)`,
                boxShadow: `0 4px 12px #10B98140`,
              },
              '&:disabled': {
                backgroundColor: '#9CA3AF',
                color: colors.brandWhite,
              },
            }}
          >
            {saving ? 'Reactivating Player...' : 'Reactivate Player'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
};

export default PlayersPage;
