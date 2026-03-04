import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Grid,
  Chip,
  MenuItem,
  Menu,
  IconButton,
  Dialog,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Schedule,
  Description,
  Error,
  Send,
  Visibility,
  ArrowUpward,
  ArrowDownward,
  ArrowDropDown,
  Check,
  SortByAlpha,
  Search as SearchIcon,
  MoreVert,
  Notifications,
  Close,
  Timeline,
  Person,
  EventNote,
  BarChart,
  ArrowBack,
  ChevronRight,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { colors } from '../config/theme';
import DataTable from '../components/common/DataTable';
import { format } from 'date-fns';
import { getNotifications, getNotificationStatistics } from '../services/notificationsService';

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [audienceFilter, setAudienceFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('dateNewest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rowsPerPageAnchor, setRowsPerPageAnchor] = useState(null);
  const [sortAnchor, setSortAnchor] = useState(null);
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [activeRow, setActiveRow] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [statistics, setStatistics] = useState({
    totalSent: 0,
    totalDelivered: 0,
    totalOpened: 0,
    scheduledCount: 0,
    deliveredRate: 0,
    openedRate: 0,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Load notifications from API
  useEffect(() => {
    loadNotifications();
    loadStatistics();
  }, [page, rowsPerPage, selectedStatus, typeFilter, audienceFilter, selectedSort]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: page,
        limit: rowsPerPage,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        type: typeFilter !== 'all' ? typeFilter : undefined,
        audience: audienceFilter !== 'all' ? audienceFilter : undefined,
        search: searchQuery || undefined,
        sort: selectedSort,
      };

      // Remove undefined params
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      const response = await getNotifications(params);

      if (response.success && response.data) {
        const notificationsData = response.data.notifications || [];
        setNotifications(notificationsData);
        setFilteredNotifications(notificationsData);
        
        if (response.data.pagination) {
          setPagination({
            page: (response.data.pagination.page || 1) - 1, // Convert to 0-based
            limit: response.data.pagination.limit || rowsPerPage,
            total: response.data.pagination.total || 0,
            totalPages: response.data.pagination.pages || response.data.pagination.totalPages || 0,
          });
        } else {
          // If no pagination, set defaults
          setPagination({
            page: 0,
            limit: rowsPerPage,
            total: notificationsData.length,
            totalPages: Math.ceil(notificationsData.length / rowsPerPage),
          });
        }
      } else {
        setError(response.error || response.message || 'Failed to load notifications');
        setNotifications([]);
        setFilteredNotifications([]);
        setPagination({
          page: 0,
          limit: rowsPerPage,
          total: 0,
          totalPages: 0,
        });
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading notifications');
      setNotifications([]);
      setFilteredNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await getNotificationStatistics();
      if (response.success && response.data) {
        // Backend returns statistics as objects with value and trend
        setStatistics({
          totalSent: response.data.totalSent?.value || 0,
          totalDelivered: response.data.delivered?.value || 0,
          totalOpened: response.data.opened?.value || 0,
          scheduledCount: response.data.scheduled?.value || 0,
          deliveredRate: 0, // Calculate from data if needed
          openedRate: 0, // Calculate from data if needed
        });
      }
    } catch (err) {
      console.error('Failed to load statistics:', err);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 0) {
        loadNotifications();
      } else {
        setPage(0);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRowClick = (notification) => {
    setSelectedNotification(notification);
    setDetailsDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsDialogOpen(false);
    setSelectedNotification(null);
  };

  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    setPage(0);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Calculate stats from loaded data
  const totalSent = statistics.totalSent || notifications.reduce((sum, notif) => sum + (notif.sentCount || notif.totalSent || 0), 0);
  const totalDelivered = statistics.totalDelivered || notifications.reduce((sum, notif) => sum + (notif.deliveredCount || 0), 0);
  const totalOpened = statistics.totalOpened || notifications.reduce((sum, notif) => sum + (notif.openedCount || 0), 0);
  const scheduledCount = statistics.scheduledCount || notifications.filter(n => (n.status || n.notificationStatus) === 'scheduled').length;

  const deliveredRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0.0';
  const openedRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100).toFixed(1) : '0.0';

  // Filter and sort notifications (client-side filtering for now, can be moved to backend)
  useEffect(() => {
    let filtered = [...notifications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (notif) =>
          notif.title?.toLowerCase().includes(query) ||
          notif.body?.toLowerCase().includes(query) ||
          notif.id?.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((notif) => {
        const status = notif.status || notif.notificationStatus;
        return status === selectedStatus;
      });
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((notif) => notif.type === typeFilter);
    }

    if (audienceFilter !== 'all') {
      filtered = filtered.filter((notif) => notif.audience === audienceFilter);
    }

    switch (selectedSort) {
      case 'dateNewest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateB - dateA;
        });
        break;
      case 'dateOldest':
        filtered.sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
          return dateA - dateB;
        });
        break;
      case 'titleAZ':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'titleZA':
        filtered.sort((a, b) => (b.title || '').localeCompare(a.title || ''));
        break;
      case 'openRateHighest':
        filtered.sort((a, b) => (b.openedPercentage || 0) - (a.openedPercentage || 0));
        break;
      case 'openRateLowest':
        filtered.sort((a, b) => (a.openedPercentage || 0) - (b.openedPercentage || 0));
        break;
      default:
        break;
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, selectedStatus, typeFilter, audienceFilter, selectedSort]);


  const columns = [
    {
      id: 'title',
      label: 'Title',
      render: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}>
            {value || 'N/A'}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'type',
      label: 'Type',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13, fontWeight: 500 }}>
          {value || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'audience',
      label: 'Audience',
      render: (value) => (
        <Typography variant="body2" sx={{ color: colors.brandRed, fontWeight: 600, fontSize: 13 }}>
          {value || 'All Users'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = row.status || row.notificationStatus || 'sent';
        return (
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: `${colors.success}1A`,
              color: colors.success,
              fontWeight: 700,
              fontSize: 11,
              borderRadius: '6px',
              height: 24,
            }}
          />
        );
      },
    },
    {
      id: 'sentCount',
      label: 'Sent',
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 14 }}>
          {row.sentCount?.toLocaleString() || row.totalSent?.toLocaleString() || '0'}
        </Typography>
      ),
    },
    {
      id: 'deliveredCount',
      label: 'Delivered',
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 14 }}>
          {row.deliveredCount?.toLocaleString() || '0'}
        </Typography>
      ),
    },
    {
      id: 'openedPercentage',
      label: 'Opened\u00A0%',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: colors.success, fontSize: 14 }}>
          {value?.toFixed(1) || 0}%
        </Typography>
      ),
    },
    {
      id: 'creator',
      label: 'Creator',
      render: (_, row) => (
        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: 13 }}>
          {row.creator?.username || row.creator?.fullName || row.createdBy?.username || row.createdBy?.fullName || row.createdBy || 'ADMIN_001'}
        </Typography>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created',
      render: (value) => {
        if (!value) return 'N/A';
        const date = value?.toDate ? value.toDate() : new Date(value);
        return (
          <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>
            {format(date, 'MMM dd, HH:mm')}
          </Typography>
        );
      },
    },
    {
      id: 'schedule',
      label: 'Scheduled',
      render: (_, row) => {
        const hasSchedule = row.scheduledTime || row.schedule;
        return (
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
            {hasSchedule ? format(hasSchedule?.toDate ? hasSchedule.toDate() : new Date(hasSchedule), 'MMM dd, HH:mm') : '-'}
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
            setActionAnchorEl(e.currentTarget);
            setActiveRow(row);
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

  const statusTabs = [
    {
      value: 'all',
      label: 'All',
      count: notifications.length,
    },
    {
      value: 'sent',
      label: 'Sent',
      count: notifications.filter((n) => (n.status || n.notificationStatus) === 'sent').length,
    },
    {
      value: 'scheduled',
      label: 'Scheduled',
      count: notifications.filter((n) => (n.status || n.notificationStatus) === 'scheduled').length,
    },
    {
      value: 'draft',
      label: 'Drafts',
      count: notifications.filter((n) => (n.status || n.notificationStatus) === 'draft').length,
    },
    {
      value: 'failed',
      label: 'Failed',
      count: notifications.filter((n) => (n.status || n.notificationStatus) === 'failed').length,
    },
  ];

  const paginatedNotifications = filteredNotifications.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          {error}
        </Alert>
      )}

      {/* Snackbar for success messages */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {!detailsDialogOpen ? (
        <>
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
                    <Send sx={{ fontSize: 24, color: colors.brandWhite, transform: 'rotate(-45deg)' }} />
                  </Box>
                  <Chip
                    label="+12.5%"
                    size="small"
                    icon={<ArrowUpward sx={{ fontSize: 14 }} />}
                    sx={{
                      backgroundColor: `${colors.brandWhite}26`,
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
                  {totalSent.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: `${colors.brandWhite}DD`, fontSize: 13 }}>
                  Total Sent
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
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckCircle sx={{ fontSize: 24, color: colors.success }} />
                  </Box>
                  <Chip
                    label={`+${deliveredRate}%`}
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
                  {totalDelivered.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                  Delivered
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
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Visibility sx={{ fontSize: 24, color: colors.info }} />
                  </Box>
                  <Chip
                    label={`+${openedRate}%`}
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
                  {totalOpened.toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                  Opened
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
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Schedule sx={{ fontSize: 24, color: colors.warning }} />
                  </Box>
                  <Chip
                    label="+5.2%"
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
                  {scheduledCount}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                  Scheduled
                </Typography>
              </Card>
            </Grid>
          </Grid>

          {/* Filter Strip */}
          <Card
            sx={{
              mb: 3,
              p: { xs: 0.5, sm: 1 },
              borderRadius: { xs: '16px', sm: '20px' },
              backgroundColor: colors.brandWhite,
              border: 'none',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              display: 'flex',
              gap: { xs: 0.5, sm: 1 },
              overflowX: 'auto',
              maxWidth: '100%',
              flexWrap: { xs: 'nowrap', md: 'wrap' },
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: colors.divider,
                borderRadius: '4px',
              },
            }}
          >
            {[
              { id: 'sent', label: 'Sent', icon: <CheckCircle />, color: colors.brandRed, bgColor: '#D32F2F' },
              { id: 'scheduled', label: 'Scheduled', icon: <Schedule />, color: '#3B82F6', bgColor: '#3B82F6' },
              { id: 'draft', label: 'Drafts', icon: <Description />, color: '#F59E0B', bgColor: '#F59E0B' },
              { id: 'failed', label: 'Failed', icon: <Error />, color: '#EF4444', bgColor: '#EF4444' },
            ].map((item) => {
              const isSelected = selectedStatus === item.id;
              const tabData = statusTabs.find(t => t.value === item.id);
              return (
                <Button
                  key={item.id}
                  onClick={() => handleStatusChange(item.id)}
                  disableRipple
                  sx={{
                    flex: { xs: '0 0 auto', sm: '0 0 auto', md: 1 },
                    minWidth: { xs: 'auto', sm: 110, md: 120 },
                    width: { xs: 'auto', md: 'auto' },
                    borderRadius: { xs: '12px', sm: '16px' },
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: { xs: 13, sm: 14, md: 15 },
                    py: { xs: 1, sm: 1.25, md: 1.5 },
                    px: { xs: 1.5, sm: 2, md: 2.5 },
                    backgroundColor: isSelected ? item.bgColor : 'transparent',
                    color: isSelected ? colors.brandWhite : colors.brandBlack,
                    transition: 'all 0.2s',
                    border: isSelected ? 'none' : `1.5px solid ${colors.divider}`,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    boxSizing: 'border-box',
                    '&:hover': {
                      backgroundColor: isSelected ? item.bgColor : '#F3F4F6',
                    },
                  }}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: { xs: 0.75, sm: 1, md: 1.5 },
                      overflow: 'hidden',
                      maxWidth: '100%',
                    }}
                  >
                    {React.cloneElement(item.icon, { 
                      sx: { 
                        fontSize: { xs: 16, sm: 17, md: 18 }, 
                        color: isSelected ? colors.brandWhite : item.color,
                        flexShrink: 0,
                      } 
                    })}
                    <Box
                      component="span"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.label}
                      {tabData && tabData.count > 0 && (
                        <Chip
                          label={tabData.count}
                          size="small"
                          sx={{
                            ml: 1,
                            height: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
                            color: isSelected ? colors.brandWhite : colors.brandBlack,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Button>
              );
            })}
          </Card>

          {/* Search and Action Bar */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search Bar */}
            <Box sx={{ flex: 1, minWidth: 300 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  padding: '14px 20px',
                  backgroundColor: colors.brandWhite,
                  borderRadius: '25px',
                  border: `1.5px solid ${colors.divider}40`,
                }}
              >
                <SearchIcon sx={{ fontSize: 22, color: colors.brandRed }} />
                <input
                  type="text"
                  placeholder="Search by title, message or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    flex: 1,
                    fontSize: 14,
                    fontFamily: 'inherit',
                    color: colors.brandBlack,
                    backgroundColor: 'transparent',
                  }}
                />
              </Box>
            </Box>

            {/* Date Sort Button */}
            <Button
              variant="outlined"
              startIcon={<ArrowDownward sx={{ fontSize: 18, color: colors.brandRed }} />}
              endIcon={<ArrowDropDown sx={{ fontSize: 18 }} />}
              onClick={(e) => setSortAnchor(e.currentTarget)}
              sx={{
                borderColor: `${colors.brandRed}26`,
                color: colors.brandBlack,
                backgroundColor: `${colors.brandRed}0D`,
                borderRadius: '25px',
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1.5,
                minWidth: 200,
                justifyContent: 'space-between',
                '&:hover': {
                  borderColor: `${colors.brandRed}40`,
                  backgroundColor: `${colors.brandRed}1A`,
                },
              }}
            >
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Date: {selectedSort.startsWith('date') ? (selectedSort === 'dateNewest' ? 'Newest First' : 'Oldest First') : selectedSort.startsWith('title') ? (selectedSort === 'titleAZ' ? 'A-Z' : 'Z-A') : (selectedSort === 'openRateHighest' ? 'Highest' : 'Lowest')}
              </Box>
            </Button>
            <Menu
              anchorEl={sortAnchor}
              open={Boolean(sortAnchor)}
              onClose={() => setSortAnchor(null)}
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
              {[
                { id: 'dateNewest', label: 'Date: Newest First', icon: <ArrowDownward /> },
                { id: 'dateOldest', label: 'Date: Oldest First', icon: <ArrowUpward /> },
                { id: 'titleAZ', label: 'Title: A-Z', icon: <SortByAlpha /> },
                { id: 'titleZA', label: 'Title: Z-A', icon: <SortByAlpha sx={{ transform: 'scaleY(-1)' }} /> },
                { id: 'openRateHighest', label: 'Open Rate: Highest', icon: <ArrowUpward /> },
                { id: 'openRateLowest', label: 'Open Rate: Lowest', icon: <ArrowDownward /> },
              ].map((option) => {
                const isSelected = selectedSort === option.id;
                return (
                  <MenuItem
                    key={option.id}
                    onClick={() => { setSelectedSort(option.id); setSortAnchor(null); }}
                    sx={{
                      borderRadius: '12px',
                      mb: 0.5,
                      py: 1.5,
                      px: 2,
                      backgroundColor: isSelected ? '#F2E9E9' : 'transparent',
                      '&:hover': { backgroundColor: isSelected ? '#F2E9E9' : '#F3F4F6' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        color: isSelected ? colors.brandRed : '#9CA3AF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#FECACA' : '#F9FAFB',
                        border: isSelected ? `1px solid ${colors.brandRed}` : '1px solid #E5E7EB'
                      }}>
                        {React.cloneElement(option.icon, { sx: { fontSize: 16 } })}
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, color: colors.brandBlack }}>
                        {option.label}
                      </Typography>
                    </Box>
                    {isSelected && <Check sx={{ fontSize: 16, color: colors.brandRed }} />}
                  </MenuItem>
                );
              })}
            </Menu>

            {/* Create Notification Button */}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/notifications/create')}
              sx={{
                background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                borderRadius: '25px',
                textTransform: 'none',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                fontSize: 15,
                boxShadow: `0 4px 12px ${colors.brandRed}40`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
                  boxShadow: `0 6px 16px ${colors.brandRed}50`,
                },
              }}
            >
              Create Notification
            </Button>
          </Box>

          {/* Notifications List Header */}
          <Card
            sx={{
              padding: 2.5,
              mb: 0,
              borderRadius: '16px 16px 0 0',
              backgroundColor: colors.brandWhite,
              border: `1.5px solid ${colors.divider}26`,
              borderBottom: 'none',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  <Notifications sx={{ fontSize: 24, color: colors.brandWhite }} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.25, fontSize: 17 }}>
                    Notifications List
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                    {filteredNotifications.length} notifications found
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="outlined"
                endIcon={<ArrowDropDown sx={{ fontSize: 18 }} />}
                onClick={(e) => setRowsPerPageAnchor(e.currentTarget)}
                sx={{
                  borderColor: colors.divider,
                  color: colors.brandBlack,
                  backgroundColor: colors.brandWhite,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 2.5,
                  py: 1,
                  fontSize: 14,
                  '&:hover': {
                    borderColor: colors.brandRed,
                    backgroundColor: `${colors.brandRed}0D`,
                  },
                }}
              >
                {rowsPerPage} / page
              </Button>
              <Menu
                anchorEl={rowsPerPageAnchor}
                open={Boolean(rowsPerPageAnchor)}
                onClose={() => setRowsPerPageAnchor(null)}
                PaperProps={{
                  sx: {
                    borderRadius: '12px',
                    minWidth: 120,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    mt: 1,
                    border: '1px solid #F3F4F6'
                  },
                }}
              >
                {[10, 25, 50].map((count) => (
                  <MenuItem
                    key={count}
                    onClick={() => {
                      setRowsPerPage(count);
                      setPage(0);
                      setRowsPerPageAnchor(null);
                    }}
                    sx={{
                      fontSize: 14,
                      fontWeight: rowsPerPage === count ? 600 : 400,
                      backgroundColor: rowsPerPage === count ? '#F2E9E9' : 'transparent',
                      '&:hover': { backgroundColor: rowsPerPage === count ? '#F2E9E9' : '#F3F4F6' },
                      py: 1,
                    }}
                  >
                    {count} / page
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Card>

          {/* Data Table */}
          {loading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
              <CircularProgress sx={{ color: colors.brandRed }} />
            </Box>
          ) : (
          <DataTable
            columns={columns}
            data={paginatedNotifications}
            loading={loading}
            page={page}
            rowsPerPage={rowsPerPage}
              totalCount={pagination.total || filteredNotifications.length}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
                const newRowsPerPage = parseInt(e.target.value, 10);
                setRowsPerPage(newRowsPerPage);
              setPage(0);
            }}
            onRowClick={handleRowClick}
            emptyMessage="No notifications found"
          />
          )}
          <Menu
            anchorEl={actionAnchorEl}
            open={Boolean(actionAnchorEl)}
            onClose={() => { setActionAnchorEl(null); setActiveRow(null); }}
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
                if (activeRow) handleRowClick(activeRow);
                setActionAnchorEl(null);
                setActiveRow(null);
              }}
              sx={{
                borderRadius: '12px',
                py: 1,
                px: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                '&:hover': { backgroundColor: '#F3F4F6' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '12px',
                  backgroundColor: '#E0F2FE', // Light blue background for icon
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #BAE6FD'
                }}>
                  <Visibility sx={{ fontSize: 20, color: '#0284C7' }} />
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
        selectedNotification && (
          <Box sx={{ backgroundColor: '#F9FAFB', minHeight: '100%', pb: 4, borderRadius: '12px' }}>
            {/* Header Bar */}
            <Box sx={{
              px: 4, py: 2, backgroundColor: colors.brandWhite,
              borderBottom: `1px solid ${colors.divider}`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              position: 'sticky', top: 0, zIndex: 10
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton onClick={handleCloseDetails} size="small">
                  <ArrowBack />
                </IconButton>
                <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack }}>
                  Notification Details
                </Typography>
              </Box>
              <Chip
                icon={<Visibility sx={{ fontSize: 14 }} />}
                label="Read Only"
                size="small"
                sx={{
                  backgroundColor: '#DBEAFE',
                  color: '#1E40AF',
                  fontWeight: 600,
                  borderRadius: '6px',
                  '& .MuiChip-icon': { color: '#1E40AF' }
                }}
              />
            </Box>

            {/* Main Content Area */}
            <Box sx={{ maxWidth: '1200px', mx: 'auto', mt: 4, px: 3 }}>

              {/* Immutability Clarification */}
              <Box sx={{
                mb: 4,
                p: 2,
                borderRadius: '12px',
                backgroundColor: '#FFF7ED',
                border: '1px solid #FFEDD5',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}>
                <WarningIcon sx={{ color: '#F97316', fontSize: 20 }} />
                <Typography variant="body2" sx={{ color: '#9A3412', fontWeight: 500, fontSize: 13 }}>
                  Title, message, audience, type, and deep link cannot be edited after send.
                </Typography>
              </Box>

              {/* Top Summary Card */}
              <Card sx={{
                borderRadius: '24px',
                backgroundColor: '#FEF2F2', // Light red bg
                border: 'none',
                mb: 4,
                overflow: 'hidden'
              }}>
                <Box sx={{ p: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip label={selectedNotification.id || 'NOTIF_001'} size="small" sx={{ backgroundColor: '#FECACA', color: colors.brandRed, fontWeight: 700, borderRadius: '4px', height: 20, fontSize: 10, mb: 2 }} />
                    <Chip
                      label={(selectedNotification.status || selectedNotification.notificationStatus || 'sent').toUpperCase()}
                      size="small"
                      sx={{
                        backgroundColor: (selectedNotification.status === 'failed' || selectedNotification.notificationStatus === 'failed') ? '#FEE2E2' : '#DCFCE7',
                        color: (selectedNotification.status === 'failed' || selectedNotification.notificationStatus === 'failed') ? '#DC2626' : '#166534',
                        fontWeight: 700,
                        borderRadius: '4px',
                        height: 20,
                        fontSize: 10
                      }}
                    />
                  </Box>

                  <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 1.5 }}>
                    {selectedNotification.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#4B5563', mb: 3 }}>
                    {selectedNotification.body}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    <Chip
                      icon={<Notifications sx={{ fontSize: 14 }} />}
                      label={selectedNotification.type}
                      size="small"
                      sx={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 600, borderRadius: '6px', '& .MuiChip-icon': { color: '#0369A1' } }}
                    />
                    <Chip
                      icon={<Person sx={{ fontSize: 14 }} />}
                      label={selectedNotification.audience}
                      size="small"
                      sx={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 600, borderRadius: '6px', '& .MuiChip-icon': { color: '#B45309' } }}
                    />
                  </Box>

                  {/* Failure Reason Display */}
                  {(selectedNotification.status === 'failed' || selectedNotification.notificationStatus === 'failed') && (
                    <Box sx={{ mt: 3, p: 2, backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
                      <Typography variant="subtitle2" sx={{ color: '#DC2626', fontWeight: 700, mb: 0.5, fontSize: 13 }}>
                        Failure Reason (Read-Only)
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#B91C1C', fontSize: 13 }}>
                        {selectedNotification.failureReason || 'Delivery failed due to network timeout or invalid token.'}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Card>

              {/* Stats Grid */}
              <Grid container spacing={3} sx={{ mb: 6 }}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 4, borderRadius: '20px', height: '100%', boxShadow: 'none', backgroundColor: colors.brandWhite }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 13 }}>
                      <Send sx={{ color: colors.brandRed, transform: 'rotate(-45deg)', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {selectedNotification.sentCount?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>Sent</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 4, borderRadius: '20px', height: '100%', boxShadow: 'none', backgroundColor: colors.brandWhite }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 13 }}>
                      <CheckCircle sx={{ color: '#10B981', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {selectedNotification.deliveredCount?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>Delivered</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 4, borderRadius: '20px', height: '100%', boxShadow: 'none', backgroundColor: colors.brandWhite }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 13 }}>
                      <Visibility sx={{ color: '#3B82F6', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {selectedNotification.openedCount?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>Opened</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ p: 4, borderRadius: '20px', height: '100%', boxShadow: 'none', backgroundColor: colors.brandWhite }}>
                    <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 13 }}>
                      <BarChart sx={{ color: '#F59E0B', fontSize: 24 }} />
                    </Box>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {selectedNotification.openedPercentage || 0}%
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.textSecondary }}>Open Rate</Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Details Section */}
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Details</Typography>
              <Card sx={{ p: 4, borderRadius: '20px', boxShadow: 'none', backgroundColor: colors.brandWhite, mb: 4 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Person sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, display: 'block', mb: 0.5 }}>Created By</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedNotification.creator?.username || selectedNotification.creator?.fullName || selectedNotification.createdBy?.username || selectedNotification.createdBy?.fullName || selectedNotification.createdBy || 'ADMIN_001'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <EventNote sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.5 }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, display: 'block', mb: 0.5 }}>Created At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedNotification.createdAt ? format(selectedNotification.createdAt?.toDate ? selectedNotification.createdAt.toDate() : new Date(selectedNotification.createdAt), 'MMM dd, yyyy - hh:mm a') : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Send sx={{ color: '#9CA3AF', fontSize: 20, mt: 0.5, transform: 'rotate(-45deg)' }} />
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 600, display: 'block', mb: 0.5 }}>Sent At</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {selectedNotification.createdAt ? format(selectedNotification.createdAt?.toDate ? selectedNotification.createdAt.toDate() : new Date(selectedNotification.createdAt), 'MMM dd, yyyy - hh:mm a') : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>

            </Box>
          </Box>
        )
      )}
    </Box>
  );
};

export default NotificationsPage;
