import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Box, 
  Badge,
  Popover,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Notifications as NotificationsIcon,
  CardGiftcard,
  VerifiedUser,
  Warning,
  Security,
  CheckCircle,
  Cancel,
  AccessTime,
  ArrowForwardIos,
} from '@mui/icons-material';
import { constants, colors } from '../../config/theme';
import { getPageIcon, getPageTitle } from '../../utils/pageUtils';
import { formatDistanceToNow } from 'date-fns';

// Mock Notification Data Generator
const generateMockNotifications = () => {
  return [
    {
      id: 'notif_001',
      category: 'reward',
      icon: CardGiftcard,
      iconColor: colors.brandRed,
      iconBg: `${colors.brandRed}20`,
      title: 'Reward Claimed',
      description: 'User PredictionMaster claimed $150 USDT',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      isRead: false,
      targetRoute: '/rewards/5',
      logId: 'LOG_RW_001',
    },
    {
      id: 'notif_002',
      category: 'kyc',
      icon: VerifiedUser,
      iconColor: '#10B981',
      iconBg: '#10B98120',
      title: 'KYC Submitted',
      description: 'New KYC document from user john_doe',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      isRead: false,
      targetRoute: '/users/USER001',
      logId: 'LOG_KYC_045',
    },
    {
      id: 'notif_003',
      category: 'reward',
      icon: AccessTime,
      iconColor: '#F59E0B',
      iconBg: '#F59E0B20',
      title: 'Reward Pending Approval',
      description: 'Monthly reward for rank #3 requires review',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isRead: false,
      targetRoute: '/rewards/7',
      logId: 'LOG_RW_089',
    },
    {
      id: 'notif_004',
      category: 'system',
      icon: Warning,
      iconColor: '#EF4444',
      iconBg: '#EF444420',
      title: 'Suspicious Login Activity',
      description: 'Multiple failed login attempts from IP 192.168.1.100',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
      isRead: true,
      targetRoute: '/logs',
      logId: 'LOG_SEC_234',
    },
    {
      id: 'notif_005',
      category: 'kyc',
      icon: CheckCircle,
      iconColor: '#10B981',
      iconBg: '#10B98120',
      title: 'KYC Verified',
      description: 'User jane_smith identity verified successfully',
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      isRead: true,
      targetRoute: '/users/USER006',
      logId: 'LOG_KYC_046',
    },
    {
      id: 'notif_006',
      category: 'reward',
      icon: Cancel,
      iconColor: '#EF4444',
      iconBg: '#EF444420',
      title: 'Reward Expired',
      description: 'Unclaimed reward for USER_1003 has expired',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      targetRoute: '/rewards/3',
      logId: 'LOG_RW_078',
    },
    {
      id: 'notif_007',
      category: 'kyc',
      icon: Cancel,
      iconColor: '#EF4444',
      iconBg: '#EF444420',
      title: 'KYC Rejected',
      description: 'Document verification failed for alex_miller',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      targetRoute: '/users/USER007',
      logId: 'LOG_KYC_047',
    },
    {
      id: 'notif_008',
      category: 'system',
      icon: Security,
      iconColor: '#6366F1',
      iconBg: '#6366F120',
      title: 'System Warning',
      description: 'High server load detected - monitoring',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      targetRoute: '/logs',
      logId: 'LOG_SYS_901',
    },
    {
      id: 'notif_009',
      category: 'reward',
      icon: CardGiftcard,
      iconColor: colors.brandRed,
      iconBg: `${colors.brandRed}20`,
      title: 'Reward Claimed',
      description: 'User sarah_jones claimed $80 Gift Card',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isRead: true,
      targetRoute: '/rewards/4',
      logId: 'LOG_RW_045',
    },
    {
      id: 'notif_010',
      category: 'kyc',
      icon: VerifiedUser,
      iconColor: '#10B981',
      iconBg: '#10B98120',
      title: 'KYC Submitted',
      description: 'New KYC document from user mike_wilson',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isRead: true,
      targetRoute: '/users/USER005',
      logId: 'LOG_KYC_048',
    },
  ];
};

const TopBar = ({ onMenuClick, isMobile }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(generateMockNotifications());
  const [anchorEl, setAnchorEl] = useState(null);

  const pageIcon = getPageIcon(location.pathname);
  const pageTitle = getPageTitle(location.pathname);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isNotificationOpen = Boolean(anchorEl);

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationItemClick = (notification) => {
    // Mark as read
    setNotifications(prev =>
      prev.map(n =>
        n.id === notification.id ? { ...n, isRead: true } : n
      )
    );

    // Log to system
    console.log(`[SYSTEM LOG] Admin viewed notification: ${notification.logId} at ${new Date().toISOString()}`);

    // Navigate to target page
    navigate(notification.targetRoute);

    // Close dropdown
    handleNotificationClose();
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        backgroundColor: colors.brandWhite,
        borderBottom: `1.5px solid ${colors.brandRed}14`,
        boxShadow: `0 2px 20px ${colors.brandRed}0F`,
        height: { 
          xs: constants.topBarHeightMobile,
          lg: constants.topBarHeight,
        },
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <Toolbar
        sx={{
          height: '100%',
          minHeight: { 
            xs: constants.topBarHeightMobile,
            lg: constants.topBarHeight,
          },
          padding: { 
            xs: '0 12px',
            sm: '0 16px', 
            md: '0 20px',
            lg: '0 24px',
          },
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* Menu Button (Mobile only) */}
        {isMobile && (
          <IconButton
            onClick={onMenuClick}
            sx={{
              width: 48,
              height: 48,
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: '12px',
              boxShadow: `0 4px 12px ${colors.brandRed}4D`,
              mr: 2,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
              },
            }}
          >
            <MenuIcon sx={{ color: colors.brandWhite }} />
          </IconButton>
        )}

        {/* Page Title with Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, flex: 1, minWidth: 0 }}>
          <Box
            sx={{
              padding: { xs: '9px', md: '11px' },
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              borderRadius: { xs: '10px', md: '12px' },
              boxShadow: `0 4px 12px ${colors.brandRed}4D`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {React.createElement(pageIcon, {
              sx: { fontSize: { xs: 20, md: 24 }, color: colors.brandWhite },
            })}
          </Box>
          <Box
            component="h6"
            sx={{
              fontSize: { xs: 16, sm: 18, md: 20 },
              fontWeight: 600,
              color: colors.brandBlack,
              letterSpacing: -0.8,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {pageTitle}
          </Box>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Quick Actions - Admin Notifications */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            onClick={handleNotificationClick}
            sx={{
              width: 48,
              height: 48,
              background: isNotificationOpen 
                ? `linear-gradient(135deg, ${colors.brandRed}14 0%, ${colors.brandRed}0A 100%)`
                : `linear-gradient(135deg, ${colors.brandWhite} 0%, ${colors.backgroundLight}80 100%)`,
              borderRadius: '12px',
              border: `1.5px solid ${colors.brandRed}${isNotificationOpen ? '4D' : '1F'}`,
              boxShadow: `0 2px 10px ${colors.brandRed}14`,
              '&:hover': {
                background: `linear-gradient(135deg, ${colors.backgroundLight} 0%, ${colors.brandWhite} 100%)`,
              },
            }}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                  border: `2.5px solid ${colors.brandWhite}`,
                  boxShadow: `0 3px 10px ${colors.brandRed}80`,
                  fontWeight: 700,
                  fontSize: 11,
                },
              }}
            >
              <NotificationsIcon sx={{ fontSize: 20, color: colors.brandRed }} />
            </Badge>
          </IconButton>
        </Box>

        {/* Notification Dropdown Panel */}
        <Popover
          open={isNotificationOpen}
          anchorEl={anchorEl}
          onClose={handleNotificationClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              mt: 1,
              width: { xs: '100vw', sm: 420 },
              maxWidth: { xs: 'calc(100vw - 24px)', sm: 420 },
              maxHeight: { xs: 'calc(100vh - 100px)', sm: 600 },
              borderRadius: { xs: '12px', sm: '16px' },
              boxShadow: `0 8px 32px ${colors.brandRed}26`,
              border: `1px solid ${colors.divider}`,
              overflow: 'hidden',
            },
          }}
        >
          {/* Header */}
          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderBottom: `1px solid ${colors.divider}`, bgcolor: `${colors.brandRed}0A` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, fontSize: { xs: 15, sm: 16 } }}>
                Admin Notifications
              </Typography>
              {unreadCount > 0 && (
                <Chip
                  label={`${unreadCount} New`}
                  size="small"
                  sx={{
                    bgcolor: colors.brandRed,
                    color: colors.brandWhite,
                    fontWeight: 700,
                    fontSize: { xs: 10, sm: 11 },
                    height: { xs: 22, sm: 24 },
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ color: colors.textSecondary, fontSize: { xs: 11, sm: 12 }, mt: 0.5, display: 'block' }}>
              System alerts and important events
            </Typography>
          </Box>

          {/* Notification List */}
          <List sx={{ p: 0, maxHeight: { xs: 'calc(100vh - 200px)', sm: 480 }, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <Box sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: colors.textSecondary, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: { xs: 13, sm: 14 } }}>
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationItemClick(notification)}
                    sx={{
                      py: { xs: 1.5, sm: 2 },
                      px: { xs: 2, sm: 2.5 },
                      bgcolor: notification.isRead ? 'transparent' : `${colors.brandRed}05`,
                      borderLeft: notification.isRead ? 'none' : `3px solid ${colors.brandRed}`,
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: `${colors.brandRed}0D`,
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: { xs: 44, sm: 48 } }}>
                      <Box
                        sx={{
                          width: { xs: 36, sm: 40 },
                          height: { xs: 36, sm: 40 },
                          borderRadius: { xs: '8px', sm: '10px' },
                          bgcolor: notification.iconBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {React.createElement(notification.icon, {
                          sx: { fontSize: { xs: 18, sm: 20 }, color: notification.iconColor },
                        })}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.isRead ? 600 : 700,
                              color: colors.brandBlack,
                              fontSize: 13,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <ArrowForwardIos sx={{ fontSize: 12, color: colors.textSecondary, ml: 1 }} />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              color: colors.textSecondary,
                              fontSize: 12,
                              mb: 0.5,
                              lineHeight: 1.4,
                            }}
                          >
                            {notification.description}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.brandRed,
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))
            )}
          </List>

          {/* Footer */}
          {notifications.length > 0 && (
            <Box
              sx={{
                p: { xs: 1.5, sm: 1.5 },
                borderTop: `1px solid ${colors.divider}`,
                bgcolor: colors.backgroundLight,
                textAlign: 'center',
              }}
            >
              <Typography 
                variant="caption" 
                sx={{ 
                  color: colors.textSecondary, 
                  fontSize: { xs: 10, sm: 11 }, 
                  fontStyle: 'italic',
                  display: 'block',
                  px: 1,
                }}
              >
                Click any notification to view details • All events logged in System Logs
              </Typography>
            </Box>
          )}
        </Popover>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;
