import React, { useState, useEffect, useRef } from 'react';
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
  Badge,
  Paper,
} from '@mui/material';
import {
  Person,
  People,
  CheckCircle,
  Cancel,
  Flag,
  VerifiedUser,
  BarChart,
  ArrowUpward,
  ArrowDownward,
  FilterList,
  ArrowDropDown,
  MoreVert,
  Check,
  Sort,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';
// Firebase imports removed

import { format } from 'date-fns';
import { getUsers, getUserStatistics, suspendUser } from '../services/usersService';

const UsersPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [selectedSort, setSelectedSort] = useState('spHigh');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [spFilterAnchor, setSpFilterAnchor] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [leaguePreference, setLeaguePreference] = useState('all');
  const [clubPreference, setClubPreference] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [accuracyRange, setAccuracyRange] = useState('all');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [statistics, setStatistics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    flaggedUsers: 0,
    blockedUsers: 0,
    deactivatedUsers: 0,
  });

  const searchBoxRef = useRef(null);

  // Click outside handler for search suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Map frontend sort values to backend sort values
  const mapSortToBackend = (sort) => {
    const sortMap = {
      'spHigh': 'spHigh',
      'spLow': 'spLow',
      'predictionsHigh': 'predictionsMost',
      'predictionsLow': 'predictionsLeast',
      'dateNewest': 'joinDateNewest',
      'dateOldest': 'joinDateOldest',
      'nameAZ': 'nameAZ',
      'nameZA': 'nameZA',
    };
    return sortMap[sort] || 'spHigh';
  };

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const params = {
          page: page + 1, // Backend uses 1-based pagination
          limit: rowsPerPage,
          search: searchQuery || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          sort: mapSortToBackend(selectedSort),
        };

        // Remove undefined values
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

        const result = await getUsers(params);
        
        if (result.success && result.data) {
          // Map backend user format to frontend format
          const mappedUsers = result.data.users?.map(user => ({
            id: user._id || user.userId,
            userId: user.userId || user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            spTotal: user.totalSP || 0,
            rank: user.rank,
            createdAt: user.joinDate ? new Date(user.joinDate) : new Date(),
            totalPredictions: user.totalPredictions || 0,
            isActive: user.status === 'Active',
            isBlocked: user.status === 'Blocked',
            isFlagged: user.status === 'Flagged',
            fraudFlags: [],
          })) || [];

          setUsers(mappedUsers);
          setFilteredUsers(mappedUsers);
          setPagination(result.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        } else {
          console.error('Failed to load users:', result.error);
          setUsers([]);
          setFilteredUsers([]);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [page, rowsPerPage, searchQuery, selectedStatus, selectedSort]);

  // Load statistics
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        const result = await getUserStatistics();
        if (result.success && result.data) {
          setStatistics(result.data);
        }
      } catch (error) {
        console.error('Error loading statistics:', error);
      }
    };
    loadStatistics();
  }, []);

  // Note: Filtering and sorting is now handled by the backend API
  // Advanced filters (accuracy, league, club, country) would need backend support
  // For now, we'll keep the frontend filtering for these advanced filters
  useEffect(() => {
    const filterUsers = () => {
      let filtered = [...users];

      // Accuracy filter (from advanced filters) - Frontend only for now
      if (accuracyRange !== 'all') {
        // This would need backend support or we'd need to fetch all users
        // For now, we'll skip this filter if backend doesn't support it
      }

      // League Preference filter - Frontend only for now
      if (leaguePreference !== 'all') {
        // This would need backend support
      }

      // Club Preference filter - Frontend only for now
      if (clubPreference !== 'all') {
        // This would need backend support
      }

      // Country filter - Frontend only for now
      if (countryFilter !== 'all') {
        // This would need backend support
      }

      setFilteredUsers(filtered);
    };
    filterUsers();
  }, [users, accuracyRange, leaguePreference, clubPreference, countryFilter]);




  const getStatusChip = (user) => {
    if (user.fraudFlags && user.fraudFlags.length > 0) {
      return (
        <Chip
          icon={<Flag />}
          label="Flagged"
          size="small"
          sx={{
            backgroundColor: `${colors.error}1A`,
            color: colors.error,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      );
    }
    if (user.status === 'suspended') {
      return (
        <Chip
          icon={<Cancel />}
          label="Suspended"
          size="small"
          sx={{
            backgroundColor: `${colors.warning}1A`,
            color: colors.warning,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      );
    }
    if (user.isActive) {
      return (
        <Chip
          icon={<CheckCircle />}
          label="Active"
          size="small"
          sx={{
            backgroundColor: `${colors.success}1A`,
            color: colors.success,
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      );
    }
    return (
      <Chip
        icon={<Cancel />}
        label="Inactive"
        size="small"
        sx={{
          backgroundColor: `${colors.textSecondary}1A`,
          color: colors.textSecondary,
          fontWeight: 600,
          fontSize: 11,
        }}
      />
    );
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) {
      handleMenuClose();
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to suspend user "${selectedUser.username}"? This will deactivate their account.`
    );

    if (!confirmed) {
      handleMenuClose();
      return;
    }

    try {
      const result = await suspendUser(selectedUser.id, false);
      
      if (result.success) {
        alert(result.message || 'User suspended successfully');
        // Reload users to reflect the change
        const params = {
          page: page + 1,
          limit: rowsPerPage,
          search: searchQuery || undefined,
          status: selectedStatus !== 'all' ? selectedStatus : undefined,
          sort: mapSortToBackend(selectedSort),
        };
        Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
        
        const usersResult = await getUsers(params);
        if (usersResult.success && usersResult.data) {
          const mappedUsers = usersResult.data.users?.map(user => ({
            id: user._id || user.userId,
            userId: user.userId || user._id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            status: user.status,
            spTotal: user.totalSP || 0,
            rank: user.rank,
            createdAt: user.joinDate ? new Date(user.joinDate) : new Date(),
            totalPredictions: user.totalPredictions || 0,
            isActive: user.status === 'Active',
            isBlocked: user.status === 'Blocked',
            isFlagged: user.status === 'Flagged',
            fraudFlags: [],
          })) || [];
          setUsers(mappedUsers);
          setFilteredUsers(mappedUsers);
          setPagination(usersResult.data.pagination || { page: 1, limit: 10, total: 0, pages: 0 });
        }
      } else {
        alert(result.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('An error occurred while suspending the user');
    } finally {
      handleMenuClose();
    }
  };

  // Use statistics from backend
  const activeCount = statistics.activeUsers || 0;
  const verifiedCount = statistics.verifiedUsers || 0;
  const flaggedCount = statistics.flaggedUsers || 0;
  const blockedCount = statistics.blockedUsers || 0;
  const deactivatedCount = statistics.deactivatedUsers || 0;

  const columns = [
    {
      id: 'username',
      label: 'USERNAME',
      render: (value, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {row.username || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'id',
      label: 'USER ID',
      render: (_, row) => (
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
          {row.id || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'email',
      label: 'EMAIL',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.brandBlack, fontSize: 13 }}>
          {value || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'STATUS',
      render: (_, row) => getStatusChip(row),
    },
    {
      id: 'spTotal',
      label: 'TOTAL SP',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack }}>
          {value?.toLocaleString() || '0'}
        </Typography>
      ),
    },
    {
      id: 'rank',
      label: 'RANK',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.brandBlack }}>
          {value || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'JOIN DATE',
      render: (value) => {
        if (!value) return 'N/A';
        const date = value?.toDate ? value.toDate() : new Date(value);
        return format(date, 'MMM dd, yyyy');
      },
    },
    {
      id: 'actions',
      label: 'ACTI',
      render: (_, row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e, row);
          }}
        >
          <MoreVert sx={{ fontSize: 18, color: colors.textSecondary }} />
        </IconButton>
      ),
    },
  ];

  // Users are already paginated from backend
  const paginatedUsers = filteredUsers;





  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: colors.brandBlack,
          fontSize: { xs: 24, md: 28 },
          mb: 3,
        }}
      >
        User Management
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
              animation: 'fadeInUp 0.6s ease-out 0ms both',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 24px ${colors.brandRed}50`,
              },
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.success }} />
                <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>
                  +12.5%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandWhite, mb: 0.5 }}>
              {statistics.totalUsers || 0} Total Users
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
                <CheckCircle sx={{ fontSize: 24, color: colors.success }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.success }} />
                <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>
                  +8.2%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {activeCount} Active Users
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
                <VerifiedUser sx={{ fontSize: 24, color: colors.info }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.success }} />
                <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>
                  +15.3%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {verifiedCount} Verified Users
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
              animation: 'fadeInUp 0.6s ease-out 200ms both',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 20px ${colors.warning}2F`,
              },
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.success }} />
                <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>
                  +5.1%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {flaggedCount} Flagged Users
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2.5,
              background: colors.brandWhite,
              border: `1.5px solid ${colors.error}26`,
              borderRadius: '20px',
              boxShadow: `0 6px 14px ${colors.error}1F`,
              animation: 'fadeInUp 0.6s ease-out 300ms both',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 20px ${colors.error}2F`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.error}1F`,
                  borderRadius: '12px',
                }}
              >
                <Cancel sx={{ fontSize: 24, color: colors.error }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.success }} />
                <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>
                  +2.3%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {blockedCount} Blocked Users
            </Typography>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card
            sx={{
              padding: 2.5,
              background: colors.brandWhite,
              border: `1.5px solid ${colors.textSecondary}26`,
              borderRadius: '20px',
              boxShadow: `0 6px 14px ${colors.textSecondary}1F`,
              animation: 'fadeInUp 0.6s ease-out 400ms both',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: `0 8px 20px ${colors.textSecondary}2F`,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Box
                sx={{
                  padding: 1.25,
                  backgroundColor: `${colors.textSecondary}1F`,
                  borderRadius: '12px',
                }}
              >
                <Person sx={{ fontSize: 24, color: colors.textSecondary }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ArrowUpward sx={{ fontSize: 16, color: colors.success }} />
                <Typography variant="caption" sx={{ color: colors.success, fontWeight: 600, fontSize: 12 }}>
                  +1.1%
                </Typography>
              </Box>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
              {deactivatedCount} Deactivated Users
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* User Status Tabs */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1.5 }}>
        <Button
          variant={selectedStatus === 'active' ? 'contained' : 'outlined'}
          onClick={() => setSelectedStatus('active')}
          startIcon={
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: selectedStatus === 'active' ? colors.brandWhite : colors.success,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle
                sx={{
                  fontSize: 14,
                  color: selectedStatus === 'active' ? colors.success : colors.brandWhite
                }}
              />
            </Box>
          }
          sx={{
            flex: 1,
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            backgroundColor: selectedStatus === 'active' ? colors.success : colors.brandWhite,
            color: selectedStatus === 'active' ? colors.brandWhite : colors.brandBlack,
            border: `1.5px solid ${selectedStatus === 'active' ? colors.success : colors.divider}66`,
            '&:hover': {
              backgroundColor: selectedStatus === 'active' ? colors.success : colors.brandWhite,
              borderColor: selectedStatus === 'active' ? colors.success : colors.divider,
            },
          }}
        >
          Active Users
        </Button>
        <Button
          variant={selectedStatus === 'inactive' ? 'contained' : 'outlined'}
          onClick={() => setSelectedStatus('inactive')}
          startIcon={
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: selectedStatus === 'inactive' ? colors.brandWhite : colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Cancel
                sx={{
                  fontSize: 14,
                  color: selectedStatus === 'inactive' ? colors.error : colors.brandWhite
                }}
              />
            </Box>
          }
          sx={{
            flex: 1,
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            backgroundColor: selectedStatus === 'inactive' ? colors.success : colors.brandWhite,
            color: selectedStatus === 'inactive' ? colors.brandWhite : colors.brandBlack,
            border: `1.5px solid ${selectedStatus === 'inactive' ? colors.success : colors.divider}66`,
            '&:hover': {
              backgroundColor: selectedStatus === 'inactive' ? colors.success : colors.brandWhite,
              borderColor: selectedStatus === 'inactive' ? colors.success : colors.divider,
            },
          }}
        >
          Inactive Users
        </Button>
      </Box>

      {/* Search and Filter Bar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, alignItems: 'center' }}>
        <Box ref={searchBoxRef} sx={{ flex: 2, minWidth: 0, position: 'relative' }}>
          <SearchBar
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
            }}
            onFocus={() => {
              if (searchSuggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search by username, email, user ID or full name..."
          />
          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <Paper
              sx={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                mt: 1,
                borderRadius: '12px',
                boxShadow: `0 4px 12px ${colors.shadow}33`,
                maxHeight: 300,
                overflow: 'auto',
                border: `1.5px solid ${colors.brandRed}26`,
              }}
            >
              {searchSuggestions.map((user) => (
                <Box
                  key={user.id}
                  onClick={() => {
                    setSearchQuery(user.username || user.email || user.id || '');
                    setShowSuggestions(false);
                  }}
                  sx={{
                    padding: 2,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${colors.divider}26`,
                    '&:hover': {
                      backgroundColor: `${colors.brandRed}0D`,
                    },
                    '&:last-child': {
                      borderBottom: 'none',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Person sx={{ fontSize: 20, color: colors.brandWhite }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                        {user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'N/A'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                        @{user.username || 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ ml: 7.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                      {user.email || 'No email'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
                      {user.id || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={
            <Box
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                backgroundColor: colors.brandRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedSort === 'spHigh' ? (
                <ArrowUpward sx={{ fontSize: 12, color: colors.brandWhite }} />
              ) : selectedSort === 'spLow' ? (
                <ArrowDownward sx={{ fontSize: 12, color: colors.brandWhite }} />
              ) : selectedSort === 'predictionsHigh' || selectedSort === 'predictionsLow' ? (
                <BarChart sx={{ fontSize: 12, color: colors.brandWhite }} />
              ) : selectedSort === 'dateNewest' ? (
                <ArrowDownward sx={{ fontSize: 12, color: colors.brandWhite }} />
              ) : selectedSort === 'dateOldest' ? (
                <ArrowUpward sx={{ fontSize: 12, color: colors.brandWhite }} />
              ) : selectedSort === 'nameAZ' || selectedSort === 'nameZA' ? (
                <Sort sx={{ fontSize: 12, color: colors.brandWhite }} />
              ) : (
                <ArrowUpward sx={{ fontSize: 12, color: colors.brandWhite }} />
              )}
            </Box>
          }
          endIcon={<ArrowDropDown sx={{ color: colors.brandRed, fontSize: 20 }} />}
          onClick={(e) => setSpFilterAnchor(e.currentTarget)}
          sx={{
            flex: 1,
            borderColor: `${colors.brandRed}26`,
            color: colors.brandBlack,
            backgroundColor: colors.brandWhite,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 1.5,
            boxShadow: `0 2px 8px ${colors.shadow}14`,
            '&:hover': {
              borderColor: colors.brandRed,
              backgroundColor: colors.brandWhite,
            },
          }}
        >
          {selectedSort === 'spHigh' ? 'SP: High' :
            selectedSort === 'spLow' ? 'SP: Low' :
              selectedSort === 'predictionsHigh' ? 'Predictions: Most' :
                selectedSort === 'predictionsLow' ? 'Predictions: Least' :
                  selectedSort === 'dateNewest' ? 'Join Date: Newest' :
                    selectedSort === 'dateOldest' ? 'Join Date: Oldest' :
                      selectedSort === 'nameAZ' ? 'Name: A-Z' :
                        selectedSort === 'nameZA' ? 'Name: Z-A' : 'SP: High'}
        </Button>
        <Menu
          anchorEl={spFilterAnchor}
          open={Boolean(spFilterAnchor)}
          onClose={() => setSpFilterAnchor(null)}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              minWidth: 220,
              boxShadow: `0 4px 12px ${colors.shadow}33`,
              padding: '8px 0',
            },
          }}
        >
          <MenuItem
            onClick={() => { setSelectedSort('spHigh'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'spHigh'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'spHigh' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: colors.brandRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpward sx={{ fontSize: 14, color: colors.brandWhite }} />
            </Box>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'spHigh' ? 700 : 500 }}>
              SP: High
            </Typography>
            {selectedSort === 'spHigh' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('spLow'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'spLow'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'spLow' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownward sx={{ fontSize: 14, color: colors.brandWhite }} />
            </Box>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'spLow' ? 700 : 500 }}>
              SP: Low
            </Typography>
            {selectedSort === 'spLow' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('predictionsHigh'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'predictionsHigh'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'predictionsHigh' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: selectedSort === 'predictionsHigh' ? colors.brandRed : colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart sx={{ fontSize: 14, color: colors.brandWhite }} />
            </Box>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'predictionsHigh' ? 700 : 500 }}>
              Predictions: Most
            </Typography>
            {selectedSort === 'predictionsHigh' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('predictionsLow'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'predictionsLow'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'predictionsLow' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: colors.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart sx={{ fontSize: 14, color: colors.brandWhite }} />
            </Box>
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'predictionsLow' ? 700 : 500 }}>
              Predictions: Least
            </Typography>
            {selectedSort === 'predictionsLow' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('dateNewest'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'dateNewest'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'dateNewest' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <ArrowDownward sx={{ fontSize: 18, color: colors.textSecondary }} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'dateNewest' ? 700 : 500 }}>
              Join Date: Newest
            </Typography>
            {selectedSort === 'dateNewest' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('dateOldest'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'dateOldest'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'dateOldest' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <ArrowUpward sx={{ fontSize: 18, color: colors.textSecondary }} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'dateOldest' ? 700 : 500 }}>
              Join Date: Oldest
            </Typography>
            {selectedSort === 'dateOldest' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('nameAZ'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'nameAZ'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'nameAZ' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <Sort sx={{ fontSize: 18, color: colors.textSecondary }} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'nameAZ' ? 700 : 500 }}>
              Name: A-Z
            </Typography>
            {selectedSort === 'nameAZ' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
          <MenuItem
            onClick={() => { setSelectedSort('nameZA'); setSpFilterAnchor(null); }}
            selected={selectedSort === 'nameZA'}
            sx={{
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              backgroundColor: selectedSort === 'nameZA' ? `${colors.brandRed}0D` : 'transparent',
              '&:hover': {
                backgroundColor: `${colors.brandRed}0D`,
              },
              '&.Mui-selected': {
                backgroundColor: `${colors.brandRed}0D`,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}1A`,
                },
              },
            }}
          >
            <Sort sx={{ fontSize: 18, color: colors.textSecondary, transform: 'rotate(180deg)' }} />
            <Typography variant="body2" sx={{ flex: 1, fontWeight: selectedSort === 'nameZA' ? 700 : 500 }}>
              Name: Z-A
            </Typography>
            {selectedSort === 'nameZA' && (
              <Check sx={{ fontSize: 18, color: colors.brandRed }} />
            )}
          </MenuItem>
        </Menu>
        <Button
          variant="outlined"
          startIcon={<FilterList sx={{ color: colors.textSecondary }} />}
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          sx={{
            flex: 1,
            borderColor: colors.brandWhite,
            color: colors.brandBlack,
            backgroundColor: colors.brandWhite,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
            px: 2,
            py: 1.5,
            boxShadow: `0 2px 8px ${colors.shadow}14`,
            '&:hover': {
              backgroundColor: colors.brandWhite,
            },
            position: 'relative',
          }}
        >
          Filters
          {(leaguePreference !== 'all' || clubPreference !== 'all' || countryFilter !== 'all' || accuracyRange !== 'all') && (
            <Badge
              badgeContent={
                [leaguePreference, clubPreference, countryFilter, accuracyRange].filter(f => f !== 'all').length
              }
              color="error"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                '& .MuiBadge-badge': {
                  backgroundColor: colors.brandRed,
                  color: colors.brandWhite,
                  fontSize: 10,
                  minWidth: 18,
                  height: 18,
                },
              }}
            />
          )}
        </Button>
      </Box>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <Card
          sx={{
            padding: 3,
            mb: 3,
            borderRadius: '16px',
            backgroundColor: colors.brandWhite,
            boxShadow: `0 2px 8px ${colors.shadow}14`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FilterList sx={{ color: colors.brandRed, fontSize: 20 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                Advanced Filters
              </Typography>
            </Box>
            <Button
              onClick={() => {
                setLeaguePreference('all');
                setClubPreference('all');
                setCountryFilter('all');
                setAccuracyRange('all');
              }}
              sx={{
                color: colors.brandRed,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: `${colors.brandRed}0D`,
                },
              }}
            >
              Clear All
            </Button>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.textSecondary }}>League Preference</InputLabel>
                <Select
                  value={leaguePreference}
                  onChange={(e) => setLeaguePreference(e.target.value)}
                  label="League Preference"
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colors.brandRed}26`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.brandRed,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.brandRed,
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Premier League">Premier League</MenuItem>
                  <MenuItem value="La Liga">La Liga</MenuItem>
                  <MenuItem value="Serie A">Serie A</MenuItem>
                  <MenuItem value="Bundesliga">Bundesliga</MenuItem>
                  <MenuItem value="Ligue 1">Ligue 1</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.textSecondary }}>Club Preference</InputLabel>
                <Select
                  value={clubPreference}
                  onChange={(e) => setClubPreference(e.target.value)}
                  label="Club Preference"
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colors.brandRed}26`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.brandRed,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.brandRed,
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="Manchester United">Manchester United</MenuItem>
                  <MenuItem value="Liverpool">Liverpool</MenuItem>
                  <MenuItem value="Arsenal">Arsenal</MenuItem>
                  <MenuItem value="Chelsea">Chelsea</MenuItem>
                  <MenuItem value="Barcelona">Barcelona</MenuItem>
                  <MenuItem value="Real Madrid">Real Madrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.textSecondary }}>Country</InputLabel>
                <Select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  label="Country"
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colors.brandRed}26`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.brandRed,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.brandRed,
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="United States">United States</MenuItem>
                  <MenuItem value="United Kingdom">United Kingdom</MenuItem>
                  <MenuItem value="Canada">Canada</MenuItem>
                  <MenuItem value="Australia">Australia</MenuItem>
                  <MenuItem value="Germany">Germany</MenuItem>
                  <MenuItem value="France">France</MenuItem>
                  <MenuItem value="Spain">Spain</MenuItem>
                  <MenuItem value="Italy">Italy</MenuItem>
                  <MenuItem value="Brazil">Brazil</MenuItem>
                  <MenuItem value="India">India</MenuItem>
                  <MenuItem value="Nigeria">Nigeria</MenuItem>
                  <MenuItem value="South Africa">South Africa</MenuItem>
                  <MenuItem value="Kenya">Kenya</MenuItem>
                  <MenuItem value="Ghana">Ghana</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: colors.textSecondary }}>Accuracy Range</InputLabel>
                <Select
                  value={accuracyRange}
                  onChange={(e) => setAccuracyRange(e.target.value)}
                  label="Accuracy Range"
                  sx={{
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: `${colors.brandRed}26`,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.brandRed,
                    },
                    '& .MuiSvgIcon-root': {
                      color: colors.brandRed,
                    },
                  }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="0-25">0-25%</MenuItem>
                  <MenuItem value="26-50">26-50%</MenuItem>
                  <MenuItem value="51-75">51-75%</MenuItem>
                  <MenuItem value="76-100">76-100%</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Card>
      )}

      {/* Users List Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              padding: 0.75,
              backgroundColor: colors.brandRed,
              borderRadius: '8px',
            }}
          >
            <People sx={{ fontSize: 18, color: colors.brandWhite }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: colors.brandBlack,
              fontSize: 18,
            }}
          >
            Users List
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.textSecondary,
              fontSize: 13,
              ml: 1,
            }}
          >
            {pagination.total || 0} users found
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderRadius: '8px',
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.divider,
              },
            }}
          >
            <MenuItem value={10}>10 per page</MenuItem>
            <MenuItem value={25}>25 per page</MenuItem>
            <MenuItem value={50}>50 per page</MenuItem>
            <MenuItem value={100}>100 per page</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={paginatedUsers}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={pagination.total || 0}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onRowClick={(row) => navigate(`${constants.routes.users}/details/${row.id}`)}
        emptyMessage="No users found"
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 180,
            boxShadow: `0 4px 12px ${colors.shadow}33`,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            if (selectedUser) {
              navigate(`${constants.routes.users}/details/${selectedUser.id}`);
            }
            handleMenuClose();
          }}
        >
          View Details
        </MenuItem>
        {/* Edit User - Only available for Super Admin 
        <MenuItem
          onClick={() => {
            handleMenuClose();
          }}
        >
          Edit User
        </MenuItem>
        */}
        <MenuItem
          onClick={handleSuspendUser}
          sx={{ color: colors.error }}
        >
          Suspend User
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UsersPage;
