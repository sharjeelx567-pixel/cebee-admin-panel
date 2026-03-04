import React, { useState, useEffect } from 'react';
import { Box, Drawer, Fade, useMediaQuery, useTheme } from '@mui/material';
import { useLocation } from 'react-router-dom';
import SideMenu from './SideMenu';
import TopBar from './TopBar';
import { constants, colors } from '../../config/theme';

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const location = useLocation();
  const theme = useTheme();
  
  // Mobile-first approach: Use MUI's useMediaQuery hook
  // Desktop = screens ≥1024px (lg breakpoint)
  const isDesktop = useMediaQuery(`(min-width:${constants.breakpoints.tablet}px)`);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
    setFadeIn(false);
    const timer = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        minHeight: '100vh',
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden', // Prevent horizontal scroll
        backgroundColor: colors.backgroundLight,
      }}
    >
      {/* Desktop Sidebar - Sticky, always visible on large screens */}
      {isDesktop && (
        <Box
          component="nav"
          sx={{
            width: constants.sideMenuWidth,
            flexShrink: 0,
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: theme.zIndex.drawer,
            overflowY: 'auto',
            overflowX: 'hidden',
            // Custom scrollbar styling
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: `${colors.brandRed}40`,
              borderRadius: '3px',
              '&:hover': {
                background: `${colors.brandRed}60`,
              },
            },
          }}
        >
          <SideMenu />
        </Box>
      )}

      {/* Mobile Drawer - Hidden by default, slides in from left */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: constants.sideMenuWidth,
              maxWidth: '85vw', // Prevent drawer from taking full width on very small screens
              overflowY: 'auto',
              overflowX: 'hidden',
            },
          }}
        >
          <SideMenu />
        </Drawer>
      )}

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          width: '100%',
          // Add left margin on desktop to account for fixed sidebar
          marginLeft: {
            xs: 0,
            lg: `${constants.sideMenuWidth}px`,
          },
          // Ensure content doesn't overflow
          maxWidth: {
            xs: '100vw',
            lg: `calc(100vw - ${constants.sideMenuWidth}px)`,
          },
          overflow: 'hidden',
        }}
      >
        {/* Top Bar */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: theme.zIndex.appBar,
            width: '100%',
          }}
        >
          <TopBar onMenuClick={handleDrawerToggle} isMobile={!isDesktop} />
        </Box>

        {/* Page Content - scrollable area; id used so child pages can lock scroll (e.g. fixture dropdown) */}
        <Box
          id="main-content-scroll"
          sx={{
            flex: 1,
            width: '100%',
            padding: { 
              xs: '12px',      // Mobile: 12px
              sm: '16px',      // Small: 16px
              md: '20px',      // Medium: 20px
              lg: '24px',      // Large: 24px
            },
            backgroundColor: colors.backgroundLight,
            overflowX: 'hidden',
            overflowY: 'auto',
            // Add scroll behavior
            scrollBehavior: 'smooth',
            // Custom scrollbar for content area
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: colors.backgroundLight,
            },
            '&::-webkit-scrollbar-thumb': {
              background: `${colors.brandRed}40`,
              borderRadius: '4px',
              '&:hover': {
                background: `${colors.brandRed}60`,
              },
            },
          }}
        >
          <Fade in={fadeIn} timeout={600}>
            <Box
              sx={{
                width: '100%',
                maxWidth: '100%',
                minHeight: 'calc(100vh - 120px)', // Account for topbar and padding
                animation: fadeIn ? 'fadeInUp 0.6s ease-out' : 'none',
                '@keyframes fadeInUp': {
                  from: {
                    opacity: 0,
                    transform: 'translateY(20px)',
                  },
                  to: {
                    opacity: 1,
                    transform: 'translateY(0)',
                  },
                },
              }}
            >
              {children}
            </Box>
          </Fade>
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
