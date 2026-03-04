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
  Avatar,
} from '@mui/material';
import {
  Add,
  AttachMoney,
  CheckCircle,
  Schedule,
  Cancel,
  Star,
  Refresh,
  AllInclusive,
  CalendarToday,
  ViewModule,
  ArrowDropDown,
  ArrowDownward,
  MoreVert,
  EmojiEvents,
  AccountBalanceWallet,
  VerifiedUser,
  Person,
  Search as SearchIcon,
  ArrowBack,
  ChevronRight,
  Info,
  Warning,
  ContentCopy,
  Timeline,
  Check,
  Videocam,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import DataTable from '../components/common/DataTable';
import { format } from 'date-fns';
import { getRewards, getRewardStatistics } from '../services/rewardsService';

// Static rewards data




const RewardsPage = () => {
  const navigate = useNavigate();
  const [rewards, setRewards] = useState([]);
  const [filteredRewards, setFilteredRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [rankFilter, setRankFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('rankLowest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rankAnchor, setRankAnchor] = useState(null);
  const [consentAnchor, setConsentAnchor] = useState(null);
  const [monthAnchor, setMonthAnchor] = useState(null);
  const [consentFilter, setConsentFilter] = useState('all');
  const [statusAnchor, setStatusAnchor] = useState(null);
  const [actionsAnchor, setActionsAnchor] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [statistics, setStatistics] = useState({
    currentMonthWinners: 0,
    pendingPayouts: 0,
    processingCount: 0,
    totalPaid: 0,
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedMonth, statusFilter, rankFilter, consentFilter, selectedSort]);

  useEffect(() => {
    loadRewards();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, selectedMonth, statusFilter, rankFilter, consentFilter, selectedSort]);

  const loadStatistics = async () => {
    try {
      const statsParams = selectedMonth && selectedMonth !== 'all' ? { month: selectedMonth } : {};
      const statsResult = await getRewardStatistics(statsParams);
      if (statsResult.success && statsResult.data) {
        const d = statsResult.data;
        setStatistics({
          currentMonthWinners: d.currentMonthWinners ?? 0,
          pendingPayouts: d.pendingPayouts ?? 0,
          processingCount: d.processingCount ?? 0,
          totalPaid: d.totalPaid ?? 0,
        });
      }
    } catch (error) {
      console.error('Error loading reward statistics:', error);
    }
  };

  // Compute stats from current list when API returns all zeros (fallback so cards aren't stuck at 0)
  const deriveStatsFromList = (list) => {
    if (!list || list.length === 0) return null;
    const status = (r) => (r.status || r.rewardStatus || '').toLowerCase();
    const pending = list.filter((r) => status(r) === 'pending').length;
    const processing = list.filter((r) => status(r) === 'processing').length;
    const fulfilled = list.filter((r) => status(r) === 'fulfilled' || status(r) === 'paid').length;
    const totalPaidSum = list
      .filter((r) => status(r) === 'fulfilled' || status(r) === 'paid')
      .reduce((sum, r) => sum + (Number(r.usdAmount ?? r.amount ?? r.rewardAmount) || 0), 0);
    return {
      currentMonthWinners: list.length,
      pendingPayouts: pending,
      processingCount: processing,
      totalPaid: Math.round(totalPaidSum),
    };
  };

  const loadRewards = async () => {
    setLoading(true);
    try {
      const hasFilters = searchQuery || (selectedMonth && selectedMonth !== 'all') || statusFilter !== 'all' || (rankFilter && rankFilter !== 'all') || consentFilter !== 'all';
      // When no filters: fetch more so "show all" works; when filters applied: use pagination
      const limit = !hasFilters ? 100 : rowsPerPage;
      const params = {
        page: hasFilters ? page : 0,
        limit,
      };

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedMonth && selectedMonth !== 'all') {
        params.month = selectedMonth;
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (rankFilter && rankFilter !== 'all') {
        if (rankFilter === '1st-3rd') {
          params.minRank = 1;
          params.maxRank = 3;
        } else if (rankFilter === '1st') {
          params.rank = 1;
        } else if (rankFilter === '2nd') {
          params.rank = 2;
        } else if (rankFilter === '3rd') {
          params.rank = 3;
        }
      }

      if (consentFilter !== 'all') {
        params.consentOptIn = consentFilter === 'yes';
      }

      // Map sort to backend format
      const sortMap = {
        'rankLowest': 'rank_asc',
        'rankHighest': 'rank_desc',
        'spHighest': 'sp_desc',
        'spLowest': 'sp_asc',
      };
      if (selectedSort && sortMap[selectedSort]) {
        params.sort = sortMap[selectedSort];
      }

      const response = await getRewards(params);

      if (response.success) {
        // Service returns normalized { rewards, pagination }; rewards are already camelCase with id, month, etc.
        const { rewards: rewardsData = [], pagination: paginationData = {} } = response.data || {};
        const list = Array.isArray(rewardsData) ? rewardsData : [];

        // Apply client-side filters so table reflects selected filters even if backend doesn't
        const rewardMonth = (r) => (r.month || r.monthYear || r.rewardMonth || '').toString().slice(0, 7);
        const rewardStatus = (r) => (r.status || r.rewardStatus || '').toLowerCase();
        const rewardRank = (r) => (r.rank ?? r.position ?? 0);
        const rewardConsent = (r) => r.consentOptIn ?? r.consent ?? r.videoConsent;
        const rewardSearch = (r) => {
          const u = r.username || r.userName || r.user?.username || r.user?.email || '';
          const e = r.email || r.user?.email || '';
          const q = (searchQuery || '').toLowerCase();
          return !q || `${u} ${e}`.toLowerCase().includes(q);
        };
        let filtered = rewardsData;
        if (selectedMonth && selectedMonth !== 'all') {
          filtered = filtered.filter((r) => rewardMonth(r) === selectedMonth);
        }
        if (statusFilter !== 'all') {
          filtered = filtered.filter((r) => rewardStatus(r) === statusFilter);
        }
        if (rankFilter && rankFilter !== 'all') {
          if (rankFilter === '1st-3rd') {
            filtered = filtered.filter((r) => rewardRank(r) >= 1 && rewardRank(r) <= 3);
          } else if (rankFilter === '1st') filtered = filtered.filter((r) => rewardRank(r) === 1);
          else if (rankFilter === '2nd') filtered = filtered.filter((r) => rewardRank(r) === 2);
          else if (rankFilter === '3rd') filtered = filtered.filter((r) => rewardRank(r) === 3);
        }
        if (consentFilter !== 'all') {
          filtered = filtered.filter((r) =>
            consentFilter === 'yes' ? rewardConsent(r) === true : rewardConsent(r) !== true
          );
        }
        filtered = filtered.filter(rewardSearch);

        setRewards(list);
        setFilteredRewards(filtered);
        setTotalCount(paginationData.total ?? filtered.length);
        // When stats API returns all zeros, derive stats from list so cards aren't stuck at 0
        setStatistics((prev) => {
          if (prev.currentMonthWinners === 0 && prev.pendingPayouts === 0 && prev.processingCount === 0 && prev.totalPaid === 0 && list.length > 0) {
            const derived = deriveStatsFromList(list);
            return derived || prev;
          }
          return prev;
        });
      } else {
        console.error("Failed to load rewards", response.error);
        setRewards([]);
        setFilteredRewards([]);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to load rewards", error);
      setRewards([]);
      setFilteredRewards([]);
    } finally {
      setLoading(false);
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthLabel = format(new Date(), 'MMMM yyyy');

  // Use statistics from API instead of calculating from rewards array
  const currentMonthWinners = statistics.currentMonthWinners;
  const pendingPayouts = statistics.pendingPayouts;
  const processingCount = statistics.processingCount;
  const totalPaid = statistics.totalPaid;

  // Filtering and sorting is now handled by the backend API
  // filteredRewards is set directly from the API response

  const getStatusChip = (status) => {
    const statusMap = {
      pending: 'PENDING',
      processing: 'PROCESSING',
      fulfilled: 'FULFILLED',
      paid: 'FULFILLED', // Backward compatibility
      cancelled: 'CANCELLED',
      declined: 'DECLINED',
      unclaimed: 'UNCLAIMED',
    };

    const label = statusMap[status] || 'PENDING';
    const isProcessing = status === 'processing';
    const isPending = status === 'pending';
    const isFulfilled = status === 'fulfilled' || status === 'paid';
    const isCancelled = status === 'cancelled' || status === 'declined';
    const isUnclaimed = status === 'unclaimed';

    let color = '#FF9800'; // Pending
    let bg = '#FFF7ED';
    let border = '#FF9800';

    if (isProcessing) { color = '#42A5F5'; bg = '#EBF8FF'; border = '#42A5F5'; }
    if (isFulfilled) { color = '#66BB6A'; bg = '#F0FDF4'; border = '#66BB6A'; }
    if (isCancelled) { color = '#EF4444'; bg = '#FEF2F2'; border = '#EF4444'; }
    if (isUnclaimed) { color = '#9CA3AF'; bg = '#F3F4F6'; border = '#9CA3AF'; }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <Chip
          label={label}
          size="small"
          sx={{
            backgroundColor: bg,
            color: color,
            border: `1px solid ${border}`,
            fontWeight: 700,
            fontSize: 11,
            height: 24,
            borderRadius: '6px',
            mb: 0.5
          }}
        />
        {isUnclaimed && (
          <Typography variant="caption" sx={{ color: '#EF4444', fontSize: 10, lineHeight: 1 }}>
            Claim window expired
          </Typography>
        )}
      </Box>
    );
  };

  const handleActionsOpen = (event, reward) => {
    setActionsAnchor(event.currentTarget);
    setSelectedReward(reward);
  };

  const handleActionsClose = () => {
    setActionsAnchor(null);
    setSelectedReward(null);
  };

  const getRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmojiEvents sx={{ fontSize: 20, color: '#FFD700' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
            1st
          </Typography>
        </Box>
      );
    }
    if (rank === 2) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmojiEvents sx={{ fontSize: 20, color: '#C0C0C0' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
            2nd
          </Typography>
        </Box>
      );
    }
    if (rank === 3) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <EmojiEvents sx={{ fontSize: 20, color: '#CD7F32' }} />
          <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
            3rd
          </Typography>
        </Box>
      );
    }
    return (
      <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandBlack }}>
        {rank}th
      </Typography>
    );
  };

  const columns = [
    {
      id: 'rank',
      label: 'Rank',
      render: (value) => getRankBadge(value),
    },
    {
      id: 'username',
      label: 'Winner',
      render: (value, row) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, display: 'flex', alignItems: 'center', gap: 1 }}>
              {value || 'N/A'}
              {row.risk && (
                <Chip
                  icon={<Warning sx={{ fontSize: 12, color: 'white !important' }} />}
                  label="RISK FLAGGED"
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: 10,
                    fontWeight: 700,
                    bgcolor: colors.error,
                    color: 'white',
                    border: '1px solid #D32F2F',
                    '& .MuiChip-icon': {
                      marginLeft: '4px'
                    }
                  }}
                />
              )}
            </Typography>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: 11 }}>
              {row.userEmail || row.email || 'No email'}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'spTotal',
      label: 'SP Total',
      render: (value) => (
        <Chip
          label={value?.toLocaleString() || '0'}
          size="small"
          sx={{
            backgroundColor: '#FFF4E6',
            color: '#FF9800',
            fontWeight: 700,
            fontSize: 14,
            height: 32,
            borderRadius: '8px',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'usdAmount',
      label: 'Reward',
      render: (value, row) => {
        const amount = value || row.rewardAmount || 0;
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: colors.brandRed }}>
            ${amount.toFixed(0)}
          </Typography>
        );
      },
    },
    {
      id: 'rewardType',
      label: 'Reward Type',
      render: (value, row) => {
        const method = value || row.rewardType || row.payoutMethod || 'Gift Card';
        const isGiftCard = method.toLowerCase().includes('gift') || method.toLowerCase() === 'gift card';
        const isAlternative = method.toLowerCase().includes('alternative') || method.toLowerCase().includes('other');
        return (
          <Chip
            icon={
              isGiftCard ? (
                <AccountBalanceWallet sx={{ fontSize: 16, color: '#42A5F5 !important' }} />
              ) : (
                <EmojiEvents sx={{ fontSize: 16, color: '#FF9800 !important' }} />
              )
            }
            label={isGiftCard ? 'Gift Card' : isAlternative ? 'Alternative Reward' : 'Gift Card'}
            size="small"
            sx={{
              backgroundColor: isGiftCard ? '#E3F2FD' : '#FFF4E6',
              color: isGiftCard ? '#42A5F5' : '#FF9800',
              fontWeight: 600,
              fontSize: 13,
              height: 32,
              borderRadius: '20px',
              border: 'none',
              '& .MuiChip-icon': {
                marginLeft: '8px',
              },
            }}
          />
        );
      },
    },
    {
      id: 'kycStatus',
      label: 'KYC Status',
      render: (value, row) => {
        const kycStatus = row.kycStatus || (row.kycVerified ? 'verified' : 'under_review');
        const isVerified = kycStatus === 'verified';
        return (
          <Chip
            icon={isVerified ? <CheckCircle sx={{ fontSize: 16, color: '#66BB6A !important' }} /> : <VerifiedUser sx={{ fontSize: 16, color: '#FF9800 !important' }} />}
            label={isVerified ? 'Verified' : 'Under Review'}
            size="small"
            sx={{
              backgroundColor: isVerified ? '#E8F5E9' : '#FFF4E6',
              color: isVerified ? '#66BB6A' : '#FF9800',
              fontWeight: 600,
              fontSize: 13,
              height: 32,
              borderRadius: '20px',
              border: 'none',
              '& .MuiChip-icon': {
                marginLeft: '8px',
              },
            }}
          />
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => getStatusChip(row.status || row.rewardStatus),
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
            backgroundColor: '#FFE0E0',
            color: colors.brandRed,
            width: 36,
            height: 36,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#FFCCCC',
            },
          }}
        >
          <MoreVert sx={{ fontSize: 18 }} />
        </IconButton>
      ),
    },
  ];

  // Paginate filtered list for display (filters applied client-side on current response)
  const paginatedRewards = filteredRewards.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {!detailsDialogOpen ? (
        <>
          {/* Header Card */}
          <Card
            sx={{
              padding: 3,
              mb: 3,
              borderRadius: '16px',
              backgroundColor: colors.brandWhite,
              border: `1.5px solid ${colors.divider}26`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: colors.brandRed,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AttachMoney sx={{ fontSize: 32, color: colors.brandWhite }} />
              </Box>
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: colors.brandBlack,
                    fontSize: 22,
                    mb: 0.5,
                  }}
                >
                  Monthly SP Rewards
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.textSecondary,
                    fontSize: 14,
                  }}
                >
                  Manage reward claims for Top 3 Monthly SP Leaderboard winners
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Stats Cards */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Card
                sx={{
                  padding: 2.5,
                  background: '#FFF8F0',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: 'none',
                  height: '100%',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    padding: 1.25,
                    backgroundColor: '#FFF5E6',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <Star sx={{ fontSize: 24, color: '#FFA726' }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 1, fontSize: 36 }}>
                  {currentMonthWinners}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4A4A', fontSize: 14, mb: 0.5 }}>
                  {selectedMonth === 'all' ? 'All time winners' : 'Month winners'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: 12 }}>
                  {selectedMonth === 'all' ? 'All times' : `Top 3 from ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}`}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card
                sx={{
                  padding: 2.5,
                  background: '#F0F7FF',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: 'none',
                  height: '100%',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    padding: 1.25,
                    backgroundColor: '#E3F2FD',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <Schedule sx={{ fontSize: 24, color: '#42A5F5' }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 1, fontSize: 36 }}>
                  {pendingPayouts}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4A4A', fontSize: 14, mb: 0.5 }}>
                  Pending Claims
                </Typography>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: 12 }}>
                  Awaiting KYC or approval
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card
                sx={{
                  padding: 2.5,
                  background: '#F0F9F1',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: 'none',
                  height: '100%',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    padding: 1.25,
                    backgroundColor: '#E8F5E9',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <Refresh sx={{ fontSize: 24, color: '#66BB6A' }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 1, fontSize: 36 }}>
                  {processingCount}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4A4A', fontSize: 14, mb: 0.5 }}>
                  Processing
                </Typography>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: 12 }}>
                  KYC verified, ready to pay
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card
                sx={{
                  padding: 2.5,
                  background: '#FFF5F5',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: 'none',
                  height: '100%',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    padding: 1.25,
                    backgroundColor: '#FFEBEE',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 24, color: '#EF5350' }} />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 1, fontSize: 36 }}>
                  ${totalPaid.toFixed(0)}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#4A4A4A', fontSize: 14, mb: 0.5 }}>
                  Total Fulfilled (Current)
                </Typography>
                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: 12 }}>
                  Rewards fulfilled
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Filters and Search Bar */}
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
            {/* Search Bar */}
            <Box sx={{ flex: { xs: '1 1 100%', md: 1.5 }, minWidth: { xs: '100%', md: 0 }, maxWidth: '100%' }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, md: 2 },
                  padding: { xs: '12px 16px', md: '16px 24px' },
                  backgroundColor: '#F9F9F9',
                  borderRadius: { xs: '20px', md: '30px' },
                  border: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <SearchIcon sx={{ fontSize: { xs: 20, md: 22 }, color: colors.brandRed, flexShrink: 0 }} />
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
            <Button
              variant="outlined"
              startIcon={
                < Box
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
                  <ArrowDownward sx={{ fontSize: { xs: 16, md: 18 }, color: colors.brandWhite }} />
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
              onClick={(e) => setRankAnchor(e.currentTarget)}
              sx={{
                flex: { xs: '1 1 auto', md: 1 },
                minWidth: { xs: 'auto', md: 150 },
                borderColor: '#FFE0E0',
                color: colors.brandBlack,
                backgroundColor: '#FFF5F5',
                borderRadius: { xs: '20px', md: '30px' },
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 2, md: 3 },
                py: { xs: 1, md: 1.75 },
                fontSize: { xs: 13, md: 15 },
                border: '1.5px solid #FFE0E0',
                width: '100%',
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
                Rank: {rankFilter === 'all' ? 'All' :
                  rankFilter === '1st-3rd' ? '1st to 3rd' :
                    rankFilter === '1st' ? '1st' :
                      rankFilter === '2nd' ? '2nd' :
                        rankFilter === '3rd' ? '3rd' : 'All'}
              </Box>
            </Button>
            <Menu
              anchorEl={rankAnchor}
              open={Boolean(rankAnchor)}
              onClose={() => setRankAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  minWidth: 180,
                  boxShadow: `0 4px 12px ${colors.shadow}33`,
                },
              }}
            >
              <MenuItem onClick={() => { setRankFilter('all'); setRankAnchor(null); }}>
                All
              </MenuItem>
              <MenuItem onClick={() => { setRankFilter('1st-3rd'); setRankAnchor(null); }}>
                1st to 3rd
              </MenuItem>
              <MenuItem onClick={() => { setRankFilter('1st'); setRankAnchor(null); }}>
                1st
              </MenuItem>
              <MenuItem onClick={() => { setRankFilter('2nd'); setRankAnchor(null); }}>
                2nd
              </MenuItem>
              <MenuItem onClick={() => { setRankFilter('3rd'); setRankAnchor(null); }}>
                3rd
              </MenuItem>
            </Menu>

            <Button
              variant="outlined"
              startIcon={
                <Box
                  sx={{
                    width: { xs: 32, md: 36 },
                    height: { xs: 32, md: 36 },
                    borderRadius: { xs: '8px', md: '10px' },
                    backgroundColor: '#E0F2F1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ml: -0.5,
                    flexShrink: 0,
                  }}
                >
                  <Videocam sx={{ fontSize: { xs: 16, md: 18 }, color: '#009688' }} />
                </Box>
              }
              endIcon={
                <Box sx={{
                  width: { xs: 26, md: 30 },
                  height: { xs: 26, md: 30 },
                  borderRadius: { xs: '6px', md: '8px' },
                  backgroundColor: '#E0F2F1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: -0.5,
                  flexShrink: 0,
                }}>
                  <ArrowDropDown sx={{ fontSize: { xs: 18, md: 20 }, color: '#009688' }} />
                </Box>
              }
              onClick={(e) => setConsentAnchor(e.currentTarget)}
              sx={{
                flex: { xs: '1 1 auto', md: 1 },
                minWidth: { xs: 'auto', md: 140 },
                borderColor: '#E0F2F1',
                color: colors.brandBlack,
                backgroundColor: '#F3FDFD',
                borderRadius: { xs: '20px', md: '30px' },
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 2, md: 3 },
                py: { xs: 1, md: 1.75 },
                fontSize: { xs: 13, md: 15 },
                border: '1.5px solid #E0F2F1',
                width: '100%',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                '&:hover': {
                  borderColor: '#B2DFDB',
                  backgroundColor: '#E0F2F1',
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
                Consent: {consentFilter === 'yes' ? 'Yes' : consentFilter === 'no' ? 'No' : 'All'}
              </Box>
            </Button>
            <Menu
              anchorEl={consentAnchor}
              open={Boolean(consentAnchor)}
              onClose={() => setConsentAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  minWidth: 180,
                  boxShadow: `0 4px 12px ${colors.shadow}33`,
                },
              }}
            >
              <MenuItem onClick={() => { setConsentFilter('all'); setConsentAnchor(null); }}>
                All
              </MenuItem>
              <MenuItem onClick={() => { setConsentFilter('yes'); setConsentAnchor(null); }}>
                Yes (Opted In)
              </MenuItem>
              <MenuItem onClick={() => { setConsentFilter('no'); setConsentAnchor(null); }}>
                No (Opted Out)
              </MenuItem>
            </Menu>
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
                  <CalendarToday sx={{ fontSize: { xs: 16, md: 18 }, color: colors.brandWhite }} />
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
              onClick={(e) => setMonthAnchor(e.currentTarget)}
              sx={{
                borderColor: '#FFE0E0',
                color: colors.brandBlack,
                flex: { xs: '1 1 auto', md: 1 },
                minWidth: { xs: 'auto', md: 160 },
                backgroundColor: '#FFF5F5',
                borderRadius: { xs: '20px', md: '30px' },
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 2, md: 3 },
                py: { xs: 1, md: 1.75 },
                fontSize: { xs: 13, md: 15 },
                border: '1.5px solid #FFE0E0',
                width: '100%',
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
                {selectedMonth === 'all' ? 'All times' : format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
              </Box>
            </Button>
            <Menu
              anchorEl={monthAnchor}
              open={Boolean(monthAnchor)}
              onClose={() => setMonthAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '16px',
                  minWidth: 240,
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                  mt: 1,
                  p: 1,
                  border: '1px solid #F3F4F6'
                },
              }}
            >
              <MenuItem
                onClick={() => { setSelectedMonth('all'); setMonthAnchor(null); }}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  py: 1.5,
                  px: 2,
                  backgroundColor: selectedMonth === 'all' ? '#E5E7EB' : 'transparent',
                  '&:hover': { backgroundColor: selectedMonth === 'all' ? '#E5E7EB' : '#F3F4F6' },
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    backgroundColor: selectedMonth === 'all' ? '#FCA5A5' : '#F9FAFB',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: selectedMonth === 'all' ? 'none' : '1px solid #E5E7EB'
                  }}>
                    <CalendarToday sx={{ fontSize: 18, color: selectedMonth === 'all' ? '#B91C1C' : '#9CA3AF' }} />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: selectedMonth === 'all' ? 700 : 500, color: colors.brandBlack, fontSize: 14 }}>
                    All times
                  </Typography>
                </Box>
                {selectedMonth === 'all' && (
                  <Box sx={{
                    width: 20, height: 20, borderRadius: '50%', backgroundColor: '#FECACA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Check sx={{ fontSize: 14, color: '#B91C1C' }} />
                  </Box>
                )}
              </MenuItem>
              {(() => {
                // Build list of months: from current month back 24 months (covers 2026, 2025, and part of 2024)
                const now = new Date();
                const months = [];
                for (let i = 0; i < 24; i++) {
                  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                  months.push({
                    value: format(d, 'yyyy-MM'),
                    label: format(d, 'MMMM yyyy'),
                  });
                }
                return months.map(({ value: monthValue, label: monthLabel }) => {
                const isSelected = selectedMonth === monthValue;

                return (
                  <MenuItem
                    key={monthValue}
                    onClick={() => { setSelectedMonth(monthValue); setMonthAnchor(null); }}
                    sx={{
                      borderRadius: '12px',
                      mb: 0.5,
                      py: 1.5,
                      px: 2,
                      backgroundColor: isSelected ? '#E5E7EB' : 'transparent', // Grey background if selected
                      '&:hover': { backgroundColor: isSelected ? '#E5E7EB' : '#F3F4F6' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        backgroundColor: isSelected ? '#FCA5A5' : '#F9FAFB', // Red-ish if selected
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: isSelected ? 'none' : '1px solid #E5E7EB'
                      }}>
                        <CalendarToday sx={{ fontSize: 18, color: isSelected ? '#B91C1C' : '#9CA3AF' }} />
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: colors.brandBlack, fontSize: 14 }}>
                        {monthLabel}
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
              });
              })()}

            </Menu>
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
                  <ViewModule sx={{ fontSize: { xs: 16, md: 18 }, color: colors.brandWhite }} />
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
              onClick={(e) => setStatusAnchor(e.currentTarget)}
              sx={{
                borderColor: '#FFE0E0',
                color: colors.brandBlack,
                flex: { xs: '1 1 auto', md: 1 },
                minWidth: { xs: 'auto', md: 140 },
                backgroundColor: '#FFF5F5',
                borderRadius: { xs: '20px', md: '30px' },
                textTransform: 'none',
                fontWeight: 500,
                px: { xs: 2, md: 3 },
                py: { xs: 1, md: 1.75 },
                fontSize: { xs: 13, md: 15 },
                border: '1.5px solid #FFE0E0',
                width: '100%',
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
                {statusFilter === 'all' ? 'All Statuses' :
                  statusFilter === 'pending' ? 'Pending' :
                    statusFilter === 'processing' ? 'Processing' :
                      statusFilter === 'fulfilled' ? 'Fulfilled' :
                      statusFilter === 'paid' ? 'Fulfilled' : // Backward compatibility
                        statusFilter === 'cancelled' ? 'Cancelled' :
                          statusFilter === 'unclaimed' ? 'Unclaimed' : 'All Statuses'}
              </Box>
            </Button>
            <Menu
              anchorEl={statusAnchor}
              open={Boolean(statusAnchor)}
              onClose={() => setStatusAnchor(null)}
              PaperProps={{
                sx: {
                  borderRadius: '12px',
                  minWidth: 180,
                  boxShadow: `0 4px 12px ${colors.shadow}33`,
                },
              }}
            >
              <MenuItem onClick={() => { setStatusFilter('all'); setStatusAnchor(null); }}>
                All Statuses
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('pending'); setStatusAnchor(null); }}>
                Pending
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('processing'); setStatusAnchor(null); }}>
                Processing
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('fulfilled'); setStatusAnchor(null); }}>
                Fulfilled
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('cancelled'); setStatusAnchor(null); }}>
                Cancelled / Declined
              </MenuItem>
              <MenuItem onClick={() => { setStatusFilter('unclaimed'); setStatusAnchor(null); }}>
                Unclaimed (Expired)
              </MenuItem>
            </Menu>
          </Card>

          {/* Monthly Rewards Header */}
          <Card
            sx={{
              padding: 2.5,
              mb: 0,
              borderRadius: '16px 16px 0 0',
              backgroundColor: '#FFF5F5',
              border: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                <AttachMoney sx={{ fontSize: 28, color: colors.brandWhite }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 18 }}>
                  Monthly Rewards
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                  {filteredRewards.length} rewards found
                </Typography>
              </Box>
            </Box>
          </Card>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={paginatedRewards}
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
              const rewardId = row.id || row._id || row.reward_id || row.rewardId;
              if (rewardId) {
                navigate(`/rewards/details/${rewardId}`);
              } else {
                console.error('Reward ID is missing from row:', row);
                alert('Unable to open reward details: ID is missing');
              }
            }}
            emptyMessage="No rewards found"
          />

          {/* Actions Menu */}
          <Menu
            anchorEl={actionsAnchor}
            open={Boolean(actionsAnchor)}
            onClose={handleActionsClose}
            PaperProps={{
              sx: {
                borderRadius: '16px',
                minWidth: 220,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mt: 1,
                p: 1.5,
                border: 'none',
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem
              onClick={() => {
                const rewardId = selectedReward?.id || selectedReward?._id || selectedReward?.reward_id || selectedReward?.rewardId;
                if (rewardId) {
                  navigate(`/rewards/details/${rewardId}`);
                } else {
                  console.error('Reward ID is missing from selectedReward:', selectedReward);
                  alert('Unable to open reward details: ID is missing');
                }
                setActionsAnchor(null);
              }}
              sx={{
                borderRadius: '12px',
                py: 1,
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                mb: 0.5,
                '&:hover': { backgroundColor: '#F3F4F6' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  backgroundColor: '#E0F2FE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #BAE6FD'
                }}>
                  <ViewModule sx={{ fontSize: 20, color: '#0284C7' }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 15 }}>
                  View Details
                </Typography>
              </Box>
              <ChevronRight sx={{ fontSize: 20, color: '#9CA3AF' }} />
            </MenuItem>



          </Menu>
        </>
      ) : (
        selectedReward && (
          <Box>
            <Box sx={{ height: 60, display: 'flex', alignItems: 'center', mb: 2 }}>
              <Button
                startIcon={<ArrowBack />}
                onClick={() => setDetailsDialogOpen(false)}
                sx={{
                  color: colors.brandRed,
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' }
                }}
              >
                Back to Rewards
              </Button>
            </Box>

            <Box sx={{
              bgcolor: '#E3F2FD',
              p: 1.5,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              mb: 3,
              border: '1px solid #BBDEFB'
            }}>
              <Info sx={{ color: '#2196F3', fontSize: 20 }} />
              <Box>
                <Typography variant="subtitle2" sx={{ color: '#0D47A1', fontWeight: 700 }}>
                  View Only Mode
                </Typography>
                <Typography variant="caption" sx={{ color: '#1E88E5' }}>
                  Reward payment status changes are allowed. Reward details specific cannot be edited after the event starts.
                </Typography>
              </Box>
            </Box>

            {/* Red Reward Header Card */}
            <Card sx={{
              bgcolor: '#C62828',
              p: 3,
              borderRadius: '16px',
              color: 'white',
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, #B71C1C 100%)`
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {/* Avatar Box similar to 1st badge but simpler */}
                  <Box sx={{
                    position: 'relative',
                    width: 64, height: 64
                  }}>
                    <Avatar
                      src={selectedReward.userAvatar}
                      sx={{ width: 64, height: 64, border: '3px solid white', bgcolor: '#FFCA28', color: '#B71C1C', fontWeight: 900, fontSize: 24 }}
                    >
                      {getRankBadge(selectedReward.rank).props.children.props ? getRankBadge(selectedReward.rank).props.children.props.children : selectedReward.rank}
                    </Avatar>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ opacity: 0.8, fontWeight: 500, display: 'block', mb: 0.5 }}>
                      {selectedReward.id || 'RM_5098_001'}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, fontSize: 32, mb: 0.5 }}>
                      ${selectedReward.usdAmount?.toFixed(0) || '0'} USD
                    </Typography>
                    <Chip
                      label={selectedReward.rewardType || selectedReward.payoutMethod || 'Gift Card'}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontWeight: 600,
                        borderRadius: '6px',
                        height: 24
                      }}
                    />
                  </Box>
                </Box>

                <Chip
                  label={selectedReward.status?.toUpperCase() || 'PROCESSING'}
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    color: colors.brandRed,
                    fontWeight: 700,
                    borderRadius: '8px'
                  }}
                />
              </Box>

              <Box sx={{ mt: 4, display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.2)', pt: 2 }}>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, mb: 0.5, display: 'block' }}>Ticket ID</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>2850</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, mb: 0.5, display: 'block' }}>Accuracy Rate</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timeline sx={{ fontSize: 16 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>75.79%</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.7, mb: 0.5, display: 'block' }}>Reward Month</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 16 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {(() => {
                        const raw = (selectedReward?.month || selectedReward?.monthYear || '').toString().trim();
                        if (!raw) return '—';
                        const yyyyMm = raw.slice(0, 7);
                        if (!/^\d{4}-\d{2}$/.test(yyyyMm)) return raw;
                        return format(new Date(yyyyMm + '-01'), 'MMMM yyyy');
                      })()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* User Information */}
            <Card sx={{ p: 0, borderRadius: '16px', mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderBottom: `1px solid ${colors.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, bgcolor: '#FFEBEE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Person sx={{ fontSize: 16, color: colors.brandRed }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>User Information</Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Username</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReward.username}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Email</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedReward.userEmail}</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>User ID</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>USR_0028</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Country</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Nigeria</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* Payout Information */}
            <Card sx={{ p: 0, borderRadius: '16px', mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderBottom: `1px solid ${colors.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, bgcolor: '#FFEBEE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AttachMoney sx={{ fontSize: 16, color: colors.brandRed }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Payout Information</Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Payout Method</Typography>
                    <Chip label={selectedReward.rewardType || selectedReward.payoutMethod || 'Gift Card'} size="small" sx={{ bgcolor: '#E0F2F1', color: '#00695C', fontWeight: 700, borderRadius: '4px', height: 24 }} />
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Payout Reference</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>TRXVso3e6...89KMC</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Payout Status</Typography>
                    <Chip label={selectedReward.status?.toUpperCase() || 'PROCESSING'} size="small" sx={{ bgcolor: '#E3F2FD', color: '#1565C0', fontWeight: 700, borderRadius: '4px', height: 24 }} />
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Verified At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Dec 01, 2025 14:00</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Approved By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>ADMIN_001</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* KYC Verification */}
            <Card sx={{ p: 0, borderRadius: '16px', mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderBottom: `1px solid ${colors.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, bgcolor: '#FFEBEE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <VerifiedUser sx={{ fontSize: 16, color: colors.brandRed }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>KYC Verification</Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>KYC Status</Typography>
                    <Chip label="Verified" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, borderRadius: '4px', height: 24 }} />
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Submitted At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Nov 30, 2025 10:00</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Verified At</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Dec 01, 2025 14:00</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Verified By</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>ADMIN_001</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 1 }}>Risk Level</Typography>
                    <Chip label="None" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 700, borderRadius: '4px', height: 24 }} />
                  </Grid>
                </Grid>
              </Box>
            </Card>

            {/* Payout Actions */}
            <Card sx={{ p: 0, borderRadius: '16px', mb: 3, overflow: 'hidden' }}>
              <Box sx={{ p: 2, bgcolor: '#FAFAFA', borderBottom: `1px solid ${colors.divider}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, bgcolor: '#FFEBEE', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AttachMoney sx={{ fontSize: 16, color: colors.brandRed }} />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Payout Actions</Typography>
              </Box>
              <Box sx={{ p: 3 }}>
                <Typography variant="caption" sx={{ color: colors.textSecondary, display: 'block', mb: 2 }}>
                  Update the payout status for this reward.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="contained"
                    sx={{
                      bgcolor: '#4CAF50',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
                      textTransform: 'none', fontWeight: 700, borderRadius: '8px',
                      '&:hover': { bgcolor: '#388E3C' }
                    }}
                    startIcon={<CheckCircle />}
                  >
                    Mark as Fulfilled
                  </Button>
                  <Button variant="contained"
                    sx={{
                      bgcolor: '#EF5350',
                      boxShadow: '0 4px 12px rgba(239, 83, 80, 0.4)',
                      textTransform: 'none', fontWeight: 700, borderRadius: '8px',
                      '&:hover': { bgcolor: '#D32F2F' }
                    }}
                    startIcon={<Cancel />}
                  >
                    Cancel Reward
                  </Button>
                </Box>
              </Box>
            </Card>
          </Box>
        )
      )}
    </Box >
  );
};

export default RewardsPage;
