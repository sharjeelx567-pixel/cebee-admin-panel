import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Button,
} from '@mui/material';
import {
  Dashboard,
  CalendarToday,
  SportsSoccer,
  People,
  BarChart,
  EmojiEvents,
  CardGiftcard,
  Notifications,
  EditNote,
  Poll,
  Group,
  Description,
  Settings,
  Logout,
  CheckCircle,
  Sync,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { constants, colors } from '../../config/theme';
import appIcon from '../../assets/app_icon.png';

// Final navigation order for Phase 1 - Approved
// Flow: Polls → Fixtures → Predictions → Rankings → Rewards
// Rationale: Community polls drive fixture creation, which leads to predictions, rankings, and rewards
const menuItems = [
  { title: 'Dashboard', icon: Dashboard, route: constants.routes.dashboard },
  { title: 'Poll Management', icon: Poll, route: constants.routes.polls },
  { title: 'Fixture Management', icon: CalendarToday, route: constants.routes.fixtures },
  { title: 'League Management', icon: SportsSoccer, route: '/leagues' },
  { title: 'Team Management', icon: Group, route: '/teams' },
  { title: 'Predictions Management', icon: BarChart, route: constants.routes.predictions },
  { title: 'Leaderboard Control', icon: EmojiEvents, route: constants.routes.leaderboard },
  { title: 'Rewards Management', icon: CardGiftcard, route: constants.routes.rewards },
  { title: 'User Management', icon: People, route: constants.routes.users },
  { title: 'Referral Management', icon: Group, route: constants.routes.referrals },
  { title: 'Notifications Center', icon: Notifications, route: constants.routes.notifications },
  { title: 'Content / App Updates', icon: EditNote, route: constants.routes.content },
  { title: 'API Data & Sync Center', icon: Sync, route: constants.routes.apiSync },
  { title: 'System Logs', icon: Description, route: constants.routes.logs },
  { title: 'Settings', icon: Settings, route: constants.routes.settings },
];

const SideMenu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate(constants.routes.login);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${colors.brandBlack} 0%, #1a1a1a 100%)`,
        boxShadow: '4px 0 30px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          padding: 3,
          background: `linear-gradient(180deg, ${colors.brandRed}26 0%, transparent 100%)`,
          borderBottom: `1px solid ${colors.brandWhite}14`,
          overflow: 'hidden',
          maxWidth: '100%',
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            maxWidth: '100%',
            overflow: 'hidden',
          }}
        >
          <Box
            component="img"
            src={appIcon}
            alt="CeBee Predict"
            sx={{
              width: 48,
              height: 48,
              flexShrink: 0,
              borderRadius: '12px',
              boxShadow: `0 4px 12px ${colors.brandRed}80`,
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: colors.brandWhite,
                letterSpacing: -0.5,
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              CeBee Predict
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: `${colors.brandWhite}99`,
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              Admin Panel
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Menu Items */}
      <List
        sx={{
          flex: 1,
          padding: '16px 12px',
          overflowY: 'auto',
        }}
      >
        {menuItems.map((item) => {
          const isSelected = location.pathname === item.route || location.pathname.startsWith(item.route + '/');
          return (
            <ListItem key={item.route} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => navigate(item.route)}
                sx={{
                  borderRadius: '12px',
                  padding: '14px 14px',
                  background: isSelected
                    ? `linear-gradient(90deg, ${colors.brandRed}33 0%, ${colors.brandRed}14 100%)`
                    : 'transparent',
                  border: isSelected ? `1px solid ${colors.brandRed}66` : 'none',
                  boxShadow: isSelected ? `0 2px 12px ${colors.brandRed}40` : 'none',
                  '&:hover': {
                    background: isSelected
                      ? `linear-gradient(90deg, ${colors.brandRed}40 0%, ${colors.brandRed}20 100%)`
                      : `${colors.brandWhite}0D`,
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    padding: '8px',
                    background: isSelected
                      ? `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`
                      : `linear-gradient(135deg, ${colors.brandWhite}1A 0%, ${colors.brandWhite}0D 100%)`,
                    borderRadius: '11px',
                    boxShadow: isSelected ? `0 2px 8px ${colors.brandRed}4D` : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {React.createElement(item.icon, {
                    sx: {
                      fontSize: 20,
                      color: isSelected ? colors.brandWhite : `${colors.brandWhite}99`,
                    },
                  })}
                </ListItemIcon>
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? colors.brandWhite : `${colors.brandWhite}B3`,
                    letterSpacing: isSelected ? -0.3 : 0,
                    whiteSpace: 'nowrap',
                    overflow: 'visible',
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    paddingLeft: 1,
                  }}
                />
                {isSelected && (
                  <CheckCircle sx={{ fontSize: 16, color: `${colors.brandWhite}26` }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Profile & Logout */}
      <Box
        sx={{
          margin: 2,
          padding: 2.5,
          background: `linear-gradient(135deg, ${colors.brandWhite}14 0%, ${colors.brandWhite}0A 100%)`,
          borderRadius: '16px',
          border: `1px solid ${colors.brandWhite}1F`,
          boxShadow: '0 2px 15px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 44,
              height: 44,
              background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
              boxShadow: `0 4px 12px ${colors.brandRed}66`,
            }}
          >
            <People sx={{ fontSize: 20 }} />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: colors.brandWhite,
                fontSize: 13,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {admin?.name || 'Admin User'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: `${colors.brandWhite}99`,
                fontSize: 11,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                mb: 0.3,
              }}
            >
              {admin?.email || 'admin@ceebee.com'}
            </Typography>
            <Box
              sx={{
                display: 'inline-block',
                px: 1,
                py: 0.3,
                borderRadius: '6px',
                background: `linear-gradient(135deg, ${colors.brandRed}40 0%, ${colors.brandRed}20 100%)`,
                border: `1px solid ${colors.brandRed}66`,
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: colors.brandWhite,
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {admin?.role || 'Super Admin'}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Logout />}
          onClick={handleLogout}
          sx={{
            height: 44,
            background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
              boxShadow: `0 4px 12px ${colors.brandRed}4D`,
            },
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default SideMenu;
