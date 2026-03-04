import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Menu,
  ListItemText,
  Alert,
} from '@mui/material';
import {
  Add,
  SportsSoccer,
  CheckCircle,
  Stadium,
  AccessTime,
  List as ListIcon,
  Lock,
  MoreVert,
  ArrowDropDown,
  ArrowUpward,
  ArrowDownward,
  Edit,
  Delete,
  KeyboardArrowRight,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
import { format } from 'date-fns';
import { 
  getLeagues, 
  updateLeague, 
  deactivateLeague 
} from '../services/leaguesService';

const LeaguesPage = () => {
  const navigate = useNavigate();
  const [leagues, setLeagues] = useState([]);
  const [filteredLeagues, setFilteredLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState(''); // No sort initially
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalLeaguesCount, setTotalLeaguesCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [dateFilterAnchor, setDateFilterAnchor] = useState(null);
  const [typeFilterAnchor, setTypeFilterAnchor] = useState(null);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    maxActive: 5,
    activeDisplay: 'Active: 0/5'
  });

  const loadLeagues = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Map frontend filters to backend API parameters (no sort/filter sent when none)
      const apiParams = {
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
        search: searchQuery || undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        ...(selectedSort && { sort: mapSortToBackend(selectedSort) }),
        includeInactive: true, // League Management: show all leagues so admin can activate/deactivate
      };

      // Remove undefined values
      Object.keys(apiParams).forEach(key =>
        apiParams[key] === undefined && delete apiParams[key]
      );

      const result = await getLeagues(apiParams);

      if (result.success && result.data) {
        // Map full API response to table shape
        const formattedLeagues = result.data.leagues?.map(league => ({
          id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          league_id: league.apiLeagueId != null ? String(league.apiLeagueId) : (league._id || league.league_id),
          name: league.league_name || league.name,
          league_name: league.league_name || league.name,
          type: league.type || league.leagueType || 'League',
          leagueType: league.leagueType || league.type,
          isActive: league.status === 'Active',
          status: league.status,
          logo: league.logo,
          country: league.country,
          priority: league.priority ?? 0,
          league_code: league.league_code,
          apiLeagueId: league.apiLeagueId,
          createdAt: league.createdAt ? new Date(league.createdAt) : null,
          createdDateFormatted: league.createdDateFormatted,
          updatedAt: league.updatedAt,
          ...league,
        })) || [];

        setLeagues(formattedLeagues);
        setFilteredLeagues(formattedLeagues);

        const pagination = result.data.pagination || result.data;
        const total = pagination.total ?? result.data.total ?? formattedLeagues.length;
        setTotalLeaguesCount(typeof total === 'number' ? total : formattedLeagues.length);

        if (result.data.statistics) {
          setStatistics(result.data.statistics);
        }
      } else {
        setError(result.error || 'Failed to load leagues');
        // Fallback to empty array
        setLeagues([]);
        setFilteredLeagues([]);
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
      setError('An unexpected error occurred while loading leagues');
      setLeagues([]);
      setFilteredLeagues([]);
    } finally {
      setLoading(false);
    }
  };

  // Map frontend sort to backend sort parameter (backend uses name-asc, name-desc, type-asc, type-desc)
  const mapSortToBackend = (frontendSort) => {
    const sortMap = {
      'nameAZ': 'name-asc',
      'nameZA': 'name-desc',
      'typeAZ': 'type-asc',
      'typeZA': 'type-desc',
      'dateNewest': 'name-desc',
      'dateOldest': 'name-asc',
    };
    return sortMap[frontendSort] || 'name-asc';
  };

  // Leagues from Football API have numeric id (e.g. "39"); Edit/Deactivate require DB and are not supported for API leagues
  const isLeagueFromApi = (league) => {
    const id = String(league?.id ?? league?.league_id ?? '');
    return /^\d+$/.test(id);
  };

  useEffect(() => {
    loadLeagues();
  }, [page, rowsPerPage, searchQuery, typeFilter, selectedSort]);

  // Filtering and sorting is now handled by backend API
  // We just set filteredLeagues to leagues since backend does the filtering
  useEffect(() => {
    setFilteredLeagues(leagues);
  }, [leagues]);




  const toggleLeagueStatus = async (league) => {
    // Store original values for potential revert (before any updates)
    const originalIsActive = league.isActive;
    const originalStatus = league.status;
    
    try {
      // Calculate current active count from leagues array BEFORE any changes
      const currentActiveCount = leagues.filter((l) => l.isActive).length;
      
      // Check if we're trying to activate and already have max active leagues
      if (!league.isActive && currentActiveCount >= statistics.maxActive) {
        alert(`Maximum ${statistics.maxActive} active leagues allowed`);
        return;
      }

      const newStatus = league.isActive ? 'Inactive' : 'Active';
      const newIsActive = !league.isActive;
      
      // Optimistically update the UI immediately using functional updates
      setLeagues(prevLeagues => {
        const updated = prevLeagues.map(l => 
          l.id === league.id 
            ? { ...l, isActive: newIsActive, status: newStatus }
            : l
        );
        // Calculate new active count from updated array
        const newActiveCount = updated.filter(l => l.isActive).length;
        // Update statistics based on the new count
        setStatistics(prevStats => ({
          ...prevStats,
          active: newActiveCount,
          activeDisplay: `Active: ${newActiveCount}/${prevStats.maxActive}`
        }));
        return updated;
      });
      
      setFilteredLeagues(prevFiltered => 
        prevFiltered.map(l => 
          l.id === league.id 
            ? { ...l, isActive: newIsActive, status: newStatus }
            : l
        )
      );
      
      const result = await updateLeague(league.id, { status: newStatus });

      if (!result.success) {
        console.error('Failed to update league status:', result.error);
        
        // Revert optimistic update on error using functional updates
        setLeagues(prevLeagues => {
          const reverted = prevLeagues.map(l => 
            l.id === league.id 
              ? { ...l, isActive: originalIsActive, status: originalStatus }
              : l
          );
          const revertedCount = reverted.filter(l => l.isActive).length;
          setStatistics(prevStats => ({
            ...prevStats,
            active: revertedCount,
            activeDisplay: `Active: ${revertedCount}/${prevStats.maxActive}`
          }));
          return reverted;
        });
        
        setFilteredLeagues(prevFiltered => 
          prevFiltered.map(l => 
            l.id === league.id 
              ? { ...l, isActive: originalIsActive, status: originalStatus }
              : l
          )
        );
        
        alert(result.error || 'Failed to update league status');
      } else {
        // If successful, optimistic update remains - no need to do anything
      }
    } catch (error) {
      console.error('Error toggling league status:', error);
      
      // Revert optimistic update on error using functional updates
      setLeagues(prevLeagues => {
        const reverted = prevLeagues.map(l => 
          l.id === league.id 
            ? { ...l, isActive: originalIsActive, status: originalStatus }
            : l
        );
        const revertedCount = reverted.filter(l => l.isActive).length;
        setStatistics(prevStats => ({
          ...prevStats,
          active: revertedCount,
          activeDisplay: `Active: ${revertedCount}/${prevStats.maxActive}`
        }));
        return reverted;
      });
      
      setFilteredLeagues(prevFiltered => 
        prevFiltered.map(l => 
          l.id === league.id 
            ? { ...l, isActive: originalIsActive, status: originalStatus }
            : l
        )
      );
      
      alert('An unexpected error occurred');
    }
  };

  const handleMenuOpen = (event, league) => {
    setAnchorEl(event.currentTarget);
    setSelectedLeague(league);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedLeague(null);
  };

  const activeCount = leagues.filter((l) => l.isActive).length;

  const columns = [
    {
      id: 'logo',
      label: 'Logo',
      minWidth: 72,
      render: (_, row) => (
        <Box
          sx={{
            width: 48,
            height: 48,
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
              alt={row.name || row.league_name || 'League'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <SportsSoccer sx={{ fontSize: 24, color: colors.textSecondary }} />
          )}
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      minWidth: 120,
      render: (value, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {row.name || row.league_name || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'league_id',
      label: 'ID',
      minWidth: 56,
      render: (_, row) => (
        <Typography variant="caption" sx={{ color: colors.textSecondary, fontFamily: 'monospace' }}>
          {row.league_id || row._id || '—'}
        </Typography>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 90,
      render: (value, row) => (
        <Chip
          label={row.type || row.leagueType || 'N/A'}
          size="small"
          sx={{
            backgroundColor: '#ed6c02',
            color: colors.brandWhite,
            fontWeight: 600,
            fontSize: 11,
            height: 24,
          }}
        />
      ),
    },
    {
      id: 'country',
      label: 'Country',
      minWidth: 90,
      render: (_, row) => (
        <Typography variant="body2" sx={{ color: colors.brandBlack }}>
          {row.country || '—'}
        </Typography>
      ),
    },
    {
      id: 'league_code',
      label: 'Code',
      minWidth: 56,
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: colors.textSecondary }}>
          {row.league_code || '—'}
        </Typography>
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      minWidth: 72,
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {row.priority ?? '—'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      render: (_, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Switch
            checked={row.isActive || false}
            onChange={() => toggleLeagueStatus(row)}
            size="small"
            disabled={activeCount >= statistics.maxActive && !row.isActive}
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.success,
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: colors.success,
              },
            }}
          />
          <Lock sx={{ fontSize: 16, color: colors.textSecondary }} />
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created Date',
      minWidth: 110,
      render: (value, row) => {
        const raw = row.createdDateFormatted || value;
        if (raw && typeof raw === 'string') return raw;
        if (!value) return '—';
        const date = value?.toDate ? value.toDate() : new Date(value);
        return format(date, 'MMM dd, yyyy');
      },
    },
    {
      id: 'updatedAt',
      label: 'Updated Date',
      minWidth: 110,
      render: (value, row) => {
        const raw = row.updatedAt;
        if (!raw) return '—';
        const date = raw?.toDate ? raw.toDate() : new Date(raw);
        return format(date, 'MMM dd, yyyy');
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 72,
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

  // Backend handles pagination, so we use filteredLeagues directly
  const paginatedLeagues = filteredLeagues;

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
            <Stadium sx={{ fontSize: 24, color: colors.brandWhite }} />
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
              League Management
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: 13,
              }}
            >
              Manage football leagues and competitions (Max 5 active)
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search and Add Button */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Box sx={{ flex: 1, minWidth: { xs: '100%', md: '300px' } }}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search leagues..."
          />
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/leagues/add')}
          sx={{
            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2.5,
            py: 1.25,
          }}
        >
          Add League
        </Button>
      </Box>

      {/* Filter Chips */}
      <Box sx={{ display: 'flex', gap: 0, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<AccessTime sx={{ fontSize: 18 }} />}
          endIcon={<ArrowDropDown sx={{ fontSize: 18 }} />}
          onClick={(e) => setDateFilterAnchor(e.currentTarget)}
          sx={{
            flex: 1,
            borderColor: '#FFE5E5',
            color: colors.brandBlack,
            backgroundColor: '#FFF5F5',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 1,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: '#FFE5E5',
              borderColor: '#FFE5E5',
            },
          }}
        >
          {selectedSort === 'nameAZ' ? 'Name: A-Z' :
            selectedSort === 'nameZA' ? 'Name: Z-A' :
              selectedSort === 'typeAZ' ? 'Type: A-Z' :
                selectedSort === 'typeZA' ? 'Type: Z-A' :
                  selectedSort === 'dateNewest' ? 'Date: Newest' :
                    selectedSort === 'dateOldest' ? 'Date: Oldest' : 'Sort'}
        </Button>
        <Menu
          anchorEl={dateFilterAnchor}
          open={Boolean(dateFilterAnchor)}
          onClose={() => setDateFilterAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              minWidth: 200,
              boxShadow: `0 4px 12px ${colors.shadow}33`,
              mt: 1,
            },
          }}
        >
          <MenuItem
            onClick={() => { setSelectedSort(''); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: !selectedSort ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Typography sx={{ flex: 1, fontWeight: !selectedSort ? 600 : 500 }}>
                No sort
              </Typography>
              {!selectedSort && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('nameAZ'); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: selectedSort === 'nameAZ' ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowDownward sx={{ fontSize: 16, color: colors.textSecondary }} />
                <ListIcon sx={{ fontSize: 16, color: colors.textSecondary }} />
              </Box>
              <Typography sx={{ flex: 1, fontWeight: selectedSort === 'nameAZ' ? 600 : 500 }}>
                Name: A-Z
              </Typography>
              {selectedSort === 'nameAZ' && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('nameZA'); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: selectedSort === 'nameZA' ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.textSecondary }} />
                <ListIcon sx={{ fontSize: 16, color: colors.textSecondary }} />
              </Box>
              <Typography sx={{ flex: 1, fontWeight: selectedSort === 'nameZA' ? 600 : 500 }}>
                Name: Z-A
              </Typography>
              {selectedSort === 'nameZA' && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('typeAZ'); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: selectedSort === 'typeAZ' ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <ArrowDownward sx={{ fontSize: 16, color: colors.textSecondary }} />
              <Typography sx={{ flex: 1, fontWeight: selectedSort === 'typeAZ' ? 600 : 500 }}>
                Type: A-Z
              </Typography>
              {selectedSort === 'typeAZ' && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('typeZA'); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: selectedSort === 'typeZA' ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <ArrowUpward sx={{ fontSize: 16, color: colors.textSecondary }} />
              <Typography sx={{ flex: 1, fontWeight: selectedSort === 'typeZA' ? 600 : 500 }}>
                Type: Z-A
              </Typography>
              {selectedSort === 'typeZA' && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('dateNewest'); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: selectedSort === 'dateNewest' ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 16, color: colors.textSecondary }} />
                <ArrowDownward sx={{ fontSize: 16, color: colors.textSecondary }} />
              </Box>
              <Typography sx={{ flex: 1, fontWeight: selectedSort === 'dateNewest' ? 600 : 500 }}>
                Date: Newest
              </Typography>
              {selectedSort === 'dateNewest' && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('dateOldest'); setDateFilterAnchor(null); }}
            sx={{
              backgroundColor: selectedSort === 'dateOldest' ? `${colors.brandRed}14` : 'transparent',
              '&:hover': { backgroundColor: `${colors.brandRed}08` },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 16, color: colors.textSecondary }} />
                <ArrowUpward sx={{ fontSize: 16, color: colors.textSecondary }} />
              </Box>
              <Typography sx={{ flex: 1, fontWeight: selectedSort === 'dateOldest' ? 600 : 500 }}>
                Date: Oldest
              </Typography>
              {selectedSort === 'dateOldest' && (
                <CheckCircle sx={{ fontSize: 18, color: colors.brandRed }} />
              )}
            </Box>
          </MenuItem>
        </Menu>
        <Button
          variant="outlined"
          startIcon={<ListIcon sx={{ fontSize: 18 }} />}
          endIcon={<ArrowDropDown sx={{ fontSize: 18 }} />}
          onClick={(e) => setTypeFilterAnchor(e.currentTarget)}
          sx={{
            flex: 1,
            borderColor: '#FFE5E5',
            color: colors.brandBlack,
            backgroundColor: '#FFF5F5',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 1,
            minWidth: 'auto',
            '&:hover': {
              backgroundColor: '#FFE5E5',
              borderColor: '#FFE5E5',
            },
          }}
        >
          {typeFilter === 'all' ? 'All Types' : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)}
        </Button>
        <Menu
          anchorEl={typeFilterAnchor}
          open={Boolean(typeFilterAnchor)}
          onClose={() => setTypeFilterAnchor(null)}
        >
          <MenuItem onClick={() => { setTypeFilter('all'); setTypeFilterAnchor(null); }}>
            All Types
          </MenuItem>
          <MenuItem onClick={() => { setTypeFilter('domestic'); setTypeFilterAnchor(null); }}>
            Domestic
          </MenuItem>
          <MenuItem onClick={() => { setTypeFilter('international'); setTypeFilterAnchor(null); }}>
            International
          </MenuItem>
          <MenuItem onClick={() => { setTypeFilter('cup'); setTypeFilterAnchor(null); }}>
            Cup
          </MenuItem>
        </Menu>
        <Chip
          icon={
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: colors.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle sx={{ fontSize: 14, color: colors.brandWhite }} />
            </Box>
          }
          label={statistics.activeDisplay || `Active: ${activeCount}/${statistics.maxActive}`}
          sx={{
            flex: 1,
            backgroundColor: '#FFF5F5',
            borderColor: '#FFE5E5',
            border: '1px solid',
            color: colors.brandBlack,
            fontWeight: 600,
            fontSize: 13,
            height: 36,
            borderRadius: '20px',
            minWidth: 'auto',
            justifyContent: 'flex-start',
            '& .MuiChip-icon': {
              marginLeft: 1,
              marginRight: 0.5,
            },
            '& .MuiChip-label': {
              paddingLeft: 0.5,
              paddingRight: 1.5,
            },
          }}
        />
      </Box>

      {/* Leagues List Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            padding: 0.75,
            backgroundColor: colors.brandRed,
            borderRadius: '8px',
          }}
        >
          <ListIcon sx={{ fontSize: 18, color: colors.brandWhite }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colors.brandBlack,
            fontSize: 18,
          }}
        >
          Leagues List
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: 13,
            ml: 1,
          }}
        >
          {totalLeaguesCount > 0 ? totalLeaguesCount : filteredLeagues.length} leagues found
        </Typography>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedLeagues}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={totalLeaguesCount || filteredLeagues.length}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        emptyMessage="No leagues found"
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
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem
          disabled={selectedLeague && isLeagueFromApi(selectedLeague)}
          onClick={() => {
            if (selectedLeague && !isLeagueFromApi(selectedLeague)) {
              navigate(`/leagues/edit/${selectedLeague.id}`);
            }
            handleMenuClose();
          }}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: `${colors.warning}0D`,
            },
          }}
          title={selectedLeague && isLeagueFromApi(selectedLeague) ? 'Read-only (Football API)' : ''}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: '#FFF3E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
            }}
          >
            <Edit sx={{ fontSize: 18, color: '#FF9800' }} />
          </Box>
          <Typography sx={{ flex: 1, fontWeight: 600, color: colors.brandBlack }}>
            Edit League {selectedLeague && isLeagueFromApi(selectedLeague) ? '(read-only)' : ''}
          </Typography>
          <KeyboardArrowRight sx={{ fontSize: 18, color: colors.textSecondary }} />
        </MenuItem>
        <MenuItem
          disabled={selectedLeague && isLeagueFromApi(selectedLeague)}
          onClick={async () => {
            handleMenuClose();
            if (selectedLeague && isLeagueFromApi(selectedLeague)) return;
            if (window.confirm(`Are you sure you want to deactivate "${selectedLeague?.name}"? This will also deactivate all teams in this league.`)) {
              try {
                const result = await deactivateLeague(selectedLeague?.id);
                if (result.success) {
                  alert(result.message || 'League deactivated successfully');
                  await loadLeagues(); // Reload leagues
                } else {
                  alert(result.error || 'Failed to deactivate league');
                }
              } catch (error) {
                console.error('Error deactivating league:', error);
                alert('An unexpected error occurred');
              }
            }
          }}
          sx={{
            px: 2,
            py: 1.5,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              backgroundColor: `${colors.error}0D`,
            },
          }}
          title={selectedLeague && isLeagueFromApi(selectedLeague) ? 'Read-only (Football API)' : ''}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '8px',
              backgroundColor: '#FFEBEE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1.5,
            }}
          >
            <Delete sx={{ fontSize: 18, color: colors.error }} />
          </Box>
          <Typography sx={{ flex: 1, fontWeight: 600, color: colors.brandBlack }}>Delete League</Typography>
          <KeyboardArrowRight sx={{ fontSize: 18, color: colors.textSecondary }} />
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default LeaguesPage;
