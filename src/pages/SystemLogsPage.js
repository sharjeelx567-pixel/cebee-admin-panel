import React, { useState, useEffect, useCallback } from 'react';
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
  IconButton,
  Tooltip,
  Menu,
  Alert,
  CircularProgress,
} from '@mui/material';


import {
  Shield,
  Description,
  CheckCircle,
  Warning,
  Error,
  Info,
  Visibility,
  Lock,
  Settings,
  Person,
  List,
  FilterList,
  ArrowDropDown,
  CalendarToday,
  FileDownload,
  RemoveRedEye,
  AccessTime,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import SearchBar from '../components/common/SearchBar';
import DataTable from '../components/common/DataTable';

import { format } from 'date-fns';
import ResolveLogModal from '../components/logs/ResolveLogModal';
import {
  getSystemLogs,
  getSystemLogAdmins,
  getSystemLogStats,
  resolveSystemLog,
} from '../services/systemLogsService';

const SystemLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [adminFilter, setAdminFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('dateNewest');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [stats, setStats] = useState({ total: 0, critical: 0, security: 0, unresolved: 0 });
  const [admins, setAdmins] = useState([]);
  const [dateMenuAnchor, setDateMenuAnchor] = useState(null);
  const [adminMenuAnchor, setAdminMenuAnchor] = useState(null);
  const [sortMenuAnchor, setSortMenuAnchor] = useState(null);
  const [selectedLogForResolution, setSelectedLogForResolution] = useState(null);

  // Load admins list on mount
  useEffect(() => {
    loadAdmins();
  }, []);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load logs when filters change
  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, searchQuery, typeFilter, adminFilter, dateRangeFilter, selectedSort]);

  // Map backend log format to frontend format
  const mapBackendToFrontend = useCallback((backendLog) => {
    return {
      id: backendLog._id || backendLog.id,
      event: backendLog.action || backendLog.event,
      relatedUsername: backendLog.userId?.username || backendLog.userId?.email || null,
      adminName: backendLog.adminId
        ? (backendLog.adminId.fullName || backendLog.adminId.username || backendLog.adminId.email || 'Admin')
        : 'Auto-Detection System',
      adminId: backendLog.adminId?._id?.toString() || backendLog.adminId?.toString() || 'auto-detection',
      createdAt: new Date(backendLog.createdAt),
      severity: backendLog.severity?.toLowerCase() || 'medium',
      type: backendLog.category || backendLog.type || 'system',
      status: backendLog.resolved ? 'resolved' : 'unresolved',
      resolved: backendLog.resolved || false,
      resolvedAt: backendLog.resolvedAt ? new Date(backendLog.resolvedAt) : null,
      resolvedBy: backendLog.resolvedBy?.fullName || backendLog.resolvedBy?.username || null,
      description: backendLog.description || '',
      metadata: backendLog.metadata || {},
    };
  }, []);

  const loadAdmins = async () => {
    try {
      const response = await getSystemLogAdmins();
      if (response.success && response.data?.admins) {
        setAdmins(response.data.admins);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getSystemLogStats();
      if (response.success && response.data?.stats) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
      };

      // Map frontend sort to backend sort
      if (selectedSort === 'dateNewest') {
        params.sort = 'newest';
      } else if (selectedSort === 'dateOldest') {
        params.sort = 'oldest';
      } else if (selectedSort === 'severityHigh' || selectedSort === 'severityLow') {
        params.sort = 'severity';
      } else {
        params.sort = selectedSort || 'newest';
      }

      // Add filters
      if (searchQuery) params.search = searchQuery;
      if (typeFilter !== 'all') params.category = typeFilter;
      if (adminFilter !== 'all') params.adminUser = adminFilter;
      if (dateRangeFilter !== 'all') {
        params.dateRange = dateRangeFilter === 'last7Days' ? 'last7days' :
          dateRangeFilter === 'last30Days' ? 'last30days' :
            dateRangeFilter;
      }

      const response = await getSystemLogs(params);

      if (response.success && response.data) {
        // Map backend logs to frontend format
        const mappedLogs = (response.data.logs || []).map(mapBackendToFrontend);
        setLogs(mappedLogs);
        setFilteredLogs(mappedLogs);

        // Update pagination
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }

        // Update stats if provided
        if (response.data.stats) {
          setStats(response.data.stats);
        }
      } else {
        setError(response.error || 'Failed to load system logs');
        setLogs([]);
        setFilteredLogs([]);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      setError(error.message || 'Failed to load system logs');
      setLogs([]);
      setFilteredLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtering and sorting is now handled by backend, but we keep this for client-side display adjustments
  // The logs are already filtered and sorted from the backend
  useEffect(() => {
    setFilteredLogs(logs);
  }, [logs]);

  const getSeverityChip = (severity, type) => {
    const severityLevel = severity || type || 'normal';
    const severityConfig = {
      high: { label: 'HIGH', color: '#EF4444', bgcolor: '#FEE2E2' },
      critical: { label: 'HIGH', color: '#EF4444', bgcolor: '#FEE2E2' },
      medium: { label: 'MEDIUM', color: '#F59E0B', bgcolor: '#FEF3C7' },
      warning: { label: 'MEDIUM', color: '#F59E0B', bgcolor: '#FEF3C7' },
      low: { label: 'LOW', color: '#10B981', bgcolor: '#ECFDF5' }, // Green
      normal: { label: 'NORMAL', color: '#3B82F6', bgcolor: '#EFF6FF' }, // Blue
      info: { label: 'NORMAL', color: '#3B82F6', bgcolor: '#EFF6FF' },
    };

    const config = severityConfig[severityLevel.toLowerCase()] || severityConfig.normal;

    return (
      <Chip
        label={config.label}
        size="small"
        sx={{
          backgroundColor: config.bgcolor,
          color: config.color,
          fontWeight: 700,
          fontSize: 10,
          borderRadius: '4px',
          height: 22,
          minWidth: 60,
          letterSpacing: 0.5,
        }}
      />
    );
  };

  const getStatusChip = (status) => {
    // Check if status is the whole row object or just the string
    let statusValue = 'unresolved';
    if (typeof status === 'object' && status !== null) {
      statusValue = status.status || status.logStatus || 'unresolved';
    } else {
      statusValue = status || 'unresolved';
    }

    statusValue = statusValue.toLowerCase();
    const isAck = statusValue === 'acknowledged' || statusValue === 'resolved';

    const chip = (
      <Chip
        label={statusValue === 'resolved' ? 'RESOLVED' : (isAck ? 'ACKNOWLEDGED' : 'UNRESOLVED')}
        size="small"
        sx={{
          backgroundColor: statusValue === 'resolved' ? '#DCFCE7' : (isAck ? '#EFF6FF' : '#FEE2E2'), // Green vs Light Blue vs Light Red
          color: statusValue === 'resolved' ? '#166534' : (isAck ? '#3B82F6' : '#EF4444'),
          fontWeight: 700,
          fontSize: 10,
          borderRadius: '4px',
          height: 22,
          minWidth: 90,
          letterSpacing: 0.5,
        }}
      />
    );

    if (statusValue === 'acknowledged') {
      return (
        <Tooltip title="Acknowledged = reviewed but not yet resolved" arrow>
          {chip}
        </Tooltip>
      );
    }

    return chip;
  };

  const getUserChip = (username) => {
    return (
      <Chip
        label={username || 'N/A'}
        size="small"
        sx={{
          backgroundColor: '#FEF2F2',
          color: '#EF4444',
          fontWeight: 600,
          fontSize: 11,
          borderRadius: '4px',
          height: 24,
        }}
      />
    );
  };

  // Use stats from backend instead of calculating from logs
  const criticalLogs = stats.critical || 0;
  const securityLogs = stats.security || 0;
  const unresolvedLogs = stats.unresolved || 0;

  const getDateSortLabel = () => {
    switch (selectedSort) {
      case 'dateNewest':
        return 'Newest First';
      case 'dateOldest':
        return 'Oldest First';
      default:
        return 'Newest First';
    }
  };

  const handleDateMenuClose = (value) => {
    if (value) {
      setDateRangeFilter(value);
      setPage(0); // Reset to first page when filter changes
    }
    setDateMenuAnchor(null);
  };

  const handleAdminMenuClose = (value) => {
    if (value) {
      setAdminFilter(value);
      setPage(0); // Reset to first page when filter changes
    }
    setAdminMenuAnchor(null);
  };

  const handleSortMenuClose = (value) => {
    if (value) {
      setSelectedSort(value);
      setPage(0); // Reset to first page when sort changes
    }
    setSortMenuAnchor(null);
  };

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setPage(0); // Reset to first page when search changes
  };

  const handleOpenResolveModal = (log) => {
    setSelectedLogForResolution(log);
  };

  const handleCloseResolveModal = () => {
    setSelectedLogForResolution(null);
  };

  const handleConfirmResolve = async (log, notes) => {
    try {
      setLoading(true);
      const response = await resolveSystemLog(log.id);

      if (response.success) {
        // Reload logs to get updated data
        await loadLogs();
        await loadStats(); // Refresh stats
        handleCloseResolveModal();
        alert('Log resolved successfully');
      } else {
        alert(`Failed to resolve log: ${response.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resolving log:', error);
      alert(`Failed to resolve log: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    if (!filteredLogs.length) {
      alert('No logs to export');
      return;
    }

    const headers = ['Log ID', 'Event', 'Severity', 'Status', 'User', 'Admin', 'Timestamp', 'Resolution Notes'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => {
        const date = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);
        return [
          log.id,
          `"${log.event.replace(/"/g, '""')}"`, // Escape quotes
          log.severity || log.severityLevel,
          log.status || log.logStatus || 'unresolved',
          log.relatedUsername || 'N/A',
          log.adminName || log.adminId || 'System',
          format(date, 'yyyy-MM-dd HH:mm:ss'),
          `"${(log.resolutionNotes || '').replace(/"/g, '""')}"`
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `system_logs_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    {
      id: 'severity',
      label: 'Severity',
      render: (_, row) => getSeverityChip(row.severity || row.severityLevel, row.type || row.logType),
    },
    {
      id: 'event',
      label: 'Event',
      render: (value) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 13 }}>
          {value || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'relatedUsername',
      label: 'User',
      render: (value) => getUserChip(value),
    },
    {
      id: 'adminName',
      label: 'Admin',
      render: (value, row) => {
        const adminName = value || row.adminId || 'System';
        const isAuto = adminName.toLowerCase().includes('auto') || adminName.toLowerCase().includes('backend');
        if (isAuto) {
          return (
            <Chip
              icon={<Settings sx={{ fontSize: 12, color: '#3B82F6 !important' }} />}
              label={adminName.length > 20 ? `${adminName.substring(0, 20)}...` : adminName}
              size="small"
              sx={{ bgcolor: 'transparent', color: '#3B82F6', fontWeight: 500, fontSize: 13, p: 0, '& .MuiChip-label': { paddingLeft: 0.5 } }}
            />
          );
        }
        return (
          <Typography
            variant="body2"
            sx={{
              color: colors.brandBlack,
              fontSize: 13,
            }}
          >
            {adminName}
          </Typography>
        );
      },
    },
    {
      id: 'createdAt',
      label: 'Date',
      render: (value) => {
        if (!value) return 'N/A';
        const date = value?.toDate ? value.toDate() : new Date(value);
        return (
          <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
            {format(date, 'MMM d, yyyy HH:mm')}
          </Typography>
        );
      },
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => getStatusChip(row),
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => {
        return (
          <Button
            variant="outlined"
            size="small"
            startIcon={<RemoveRedEye sx={{ fontSize: 16 }} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenResolveModal(row);
            }}
            sx={{
              backgroundColor: '#EFF6FF',
              color: '#3B82F6',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 12,
              px: 2,
              py: 0.5,
              '&:hover': {
                backgroundColor: '#DBEAFE',
                border: '1px solid #93C5FD',
              },
            }}
          >
            View
          </Button>
        );
      },
    },
  ];

  // Pagination is handled by backend, so use filteredLogs directly
  const paginatedLogs = filteredLogs;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
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
            <Shield sx={{ fontSize: 28, color: colors.brandWhite }} />
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.brandBlack,
              fontSize: { xs: 24, md: 28 },
            }}
          >
            System Logs & Security
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: colors.textSecondary,
            fontSize: 14,
            ml: 8.5,
          }}
        >
          Immutable audit trail - Black Box Recorder
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 3, borderRadius: '12px' }}
        >
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
            {error}
          </Typography>
        </Alert>
      )}

      {/* Security Alerts Section - Show count only */}
      {unresolvedLogs > 0 && (
        <Card
          sx={{
            p: 3,
            mb: 4,
            borderRadius: '16px',
            backgroundColor: '#FDF2F2',
            border: '1px solid #FECACA',
            boxShadow: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                backgroundColor: colors.brandRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Warning sx={{ fontSize: 24, color: 'white' }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: colors.brandRed,
                  fontSize: 16,
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase',
                }}
              >
                SECURITY ALERTS
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.textSecondary,
                  fontSize: 14,
                }}
              >
                {unresolvedLogs} unresolved critical/security logs require Super Admin attention
              </Typography>
            </Box>
          </Box>
        </Card>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          {
            title: 'Total Logs',
            count: stats.total || 0,
            icon: Description,
            color: '#3B82F6', // Blue
            bgColor: '#EFF6FF', // Light Blue
          },
          {
            title: 'Critical',
            count: criticalLogs,
            icon: Error,
            color: '#EF4444', // Red
            bgColor: '#FEF2F2', // Light Red
          },
          {
            title: 'Security',
            count: securityLogs,
            icon: Shield,
            color: '#F59E0B', // Amber
            bgColor: '#FFFBEB', // Light Amber
          },
          {
            title: 'Unresolved',
            count: unresolvedLogs,
            icon: AccessTime,
            color: '#EF4444', // Red
            bgColor: '#FEF2F2', // Light Red
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Grid item xs={6} md={3} key={index}>
              <Card
                sx={{
                  p: 4,
                  borderRadius: '16px',
                  bgcolor: stat.bgColor,
                  boxShadow: 'none',
                  border: `1px solid ${stat.color}20`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  height: '100%',
                }}
              >
                <Icon sx={{ fontSize: 32, color: stat.color }} />
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                    {stat.count}
                  </Typography>
                  <Typography variant="body2" sx={{ color: colors.textSecondary, fontWeight: 500 }}>
                    {stat.title}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Filter Buttons */}
      {/* Filter Buttons Stripe */}
      <Card
        sx={{
          mb: 4,
          p: 1,
          borderRadius: '24px',
          backgroundColor: 'white',
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          width: '100%',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          '::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {[
          { value: 'all', label: 'All Logs', icon: List, color: '#DC2626', lightColor: '#FEF2F2' },
          { value: 'critical', label: 'Critical', icon: Error, color: '#EF4444', lightColor: '#FEF2F2' },
          { value: 'security', label: 'Security', icon: Shield, color: '#F59E0B', lightColor: '#FFFBEB' },
          { value: 'system', label: 'System', icon: Settings, color: '#3B82F6', lightColor: '#EFF6FF' },
          { value: 'admin', label: 'Admin Activity', icon: Person, color: '#10B981', lightColor: '#ECFDF5' },
        ].map((filter) => {
          const isSelected = typeFilter === filter.value;
          const Icon = filter.icon;

          return (
            <Button
              key={filter.value}
              onClick={() => setTypeFilter(filter.value)}
              sx={{
                flex: 1,
                minWidth: { xs: 150, md: 'auto' },
                backgroundColor: isSelected ? filter.color : 'transparent',
                color: isSelected ? 'white' : colors.textPrimary,
                borderRadius: '20px',
                py: 1.5,
                px: 2,
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
                textTransform: 'none',
                fontSize: 15,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: isSelected ? filter.color : 'rgba(0,0,0,0.02)',
                  opacity: isSelected ? 0.95 : 1,
                },
                justifyContent: 'center',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : filter.lightColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon sx={{ fontSize: 18, color: isSelected ? 'white' : filter.color }} />
              </Box>
              {filter.label}
            </Button>
          );
        })}
      </Card>

      {/* Advanced Filters */}
      <Card
        sx={{
          p: 3,
          mb: 4,
          borderRadius: '16px',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <FilterList sx={{ fontSize: 20, color: colors.brandRed }} />
          <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 16 }}>
            Advanced Filters
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 13, color: colors.textSecondary }}>
              Date Range
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={(e) => setDateMenuAnchor(e.currentTarget)}
              endIcon={<ArrowDropDown sx={{ color: colors.textSecondary }} />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 500,
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                color: colors.brandBlack,
                borderColor: '#E5E7EB',
                backgroundColor: '#F9FAFB',
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#D1D5DB',
                },
              }}
            >
              {dateRangeFilter === 'all' ? 'All Time' : dateRangeFilter === 'today' ? 'Today' : dateRangeFilter === 'last7Days' ? 'Last 7 Days' : 'Last 30 Days'}
            </Button>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 13, color: colors.textSecondary }}>
              Admin User
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              onClick={(e) => setAdminMenuAnchor(e.currentTarget)}
              endIcon={<ArrowDropDown sx={{ color: colors.textSecondary }} />}
              sx={{
                borderRadius: '10px',
                textTransform: 'none',
                fontWeight: 500,
                justifyContent: 'space-between',
                px: 2,
                py: 1.5,
                color: colors.brandBlack,
                borderColor: '#E5E7EB',
                backgroundColor: '#F9FAFB',
                '&:hover': {
                  backgroundColor: '#F3F4F6',
                  borderColor: '#D1D5DB',
                },
              }}
            >
              {adminFilter === 'all' ? 'All Admins' : logs.find((l) => l.adminId === adminFilter)?.adminName || adminFilter}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Search and Action Bar Card */}
      <Card
        sx={{
          p: 2,
          mb: 4,
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          backgroundColor: 'white',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 300 }}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search logs by event, admin, or user..."
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#F9FAFB',
                borderRadius: '8px',
                border: 'none',
                '& fieldset': { border: 'none' },
                '&:hover fieldset': { border: 'none' },
                '&.Mui-focused fieldset': { border: 'none' },
              }
            }}
          />
        </Box>
        <Button
          variant="contained"
          onClick={(e) => setSortMenuAnchor(e.currentTarget)}
          endIcon={<ArrowDropDown sx={{ color: colors.brandRed }} />}
          startIcon={
            <Box sx={{
              width: 24, height: 24, borderRadius: '50%', backgroundColor: '#FECACA',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <ArrowDropDown sx={{ transform: 'rotate(180deg)', color: '#DC2626', fontSize: 16 }} />
            </Box>
          }
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            py: 1.5,
            backgroundColor: '#FEF2F2',
            color: colors.brandBlack,
            boxShadow: 'none',
            border: '1px solid #FECACA',
            '&:hover': {
              backgroundColor: '#FEE2E2',
              boxShadow: 'none',
            },
          }}
        >
          Date: {getDateSortLabel()}
        </Button>
        <Button
          variant="contained"
          onClick={handleExport}
          startIcon={<FileDownload sx={{ fontSize: 18 }} />}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            py: 1.5,
            backgroundColor: '#4CAF50',
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: '#43A047',
              boxShadow: 'none',
            },
          }}
        >
          Export
        </Button>
      </Card>

      {/* Audit Trail Card */}
      <Card
        sx={{
          borderRadius: '16px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          backgroundColor: 'white',
          overflow: 'hidden',
        }}
      >
        {/* Audit Trail Header */}
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                backgroundColor: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px -1px rgba(220, 38, 38, 0.3)',
              }}
            >
              <Description sx={{ fontSize: 20, color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: 18, lineHeight: 1.2 }}>
                Audit Trail
              </Typography>
              <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>
                {filteredLogs.length} logs • Page {page + 1} of {Math.ceil(filteredLogs.length / rowsPerPage) || 1}
              </Typography>
            </Box>
          </Box>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              sx={{
                borderRadius: '8px',
                fontSize: 14,
                backgroundColor: '#F9FAFB',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
              <MenuItem value={100}>100</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={paginatedLogs}
          loading={loading}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={pagination.total || filteredLogs.length}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          emptyMessage="No system logs found"
        />
      </Card>

      {/* Date Range Menu */}
      <Menu
        anchorEl={dateMenuAnchor}
        open={Boolean(dateMenuAnchor)}
        onClose={() => handleDateMenuClose(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => handleDateMenuClose('all')}>All Time</MenuItem>
        <MenuItem onClick={() => handleDateMenuClose('today')}>Today</MenuItem>
        <MenuItem onClick={() => handleDateMenuClose('last7Days')}>Last 7 Days</MenuItem>
        <MenuItem onClick={() => handleDateMenuClose('last30Days')}>Last 30 Days</MenuItem>
      </Menu>

      {/* Admin Menu */}
      <Menu
        anchorEl={adminMenuAnchor}
        open={Boolean(adminMenuAnchor)}
        onClose={() => handleAdminMenuClose(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        {admins.map((admin) => (
          <MenuItem
            key={admin.id}
            onClick={() => handleAdminMenuClose(admin.id === 'all' ? 'all' : admin.id)}
          >
            {admin.label}
          </MenuItem>
        ))}
      </Menu>

      {/* Sort Menu */}
      <Menu
        anchorEl={sortMenuAnchor}
        open={Boolean(sortMenuAnchor)}
        onClose={() => handleSortMenuClose(null)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            mt: 1,
            minWidth: 200,
          },
        }}
      >
        <MenuItem onClick={() => handleSortMenuClose('dateNewest')}>Newest First</MenuItem>
        <MenuItem onClick={() => handleSortMenuClose('dateOldest')}>Oldest First</MenuItem>
        <MenuItem onClick={() => handleSortMenuClose('severityHigh')}>Severity (High to Low)</MenuItem>
        <MenuItem onClick={() => handleSortMenuClose('severityLow')}>Severity (Low to High)</MenuItem>
      </Menu>

      <ResolveLogModal
        open={Boolean(selectedLogForResolution)}
        onClose={handleCloseResolveModal}
        log={selectedLogForResolution}
        onResolve={handleConfirmResolve}
      />
    </Box >
  );
};

export default SystemLogsPage;
