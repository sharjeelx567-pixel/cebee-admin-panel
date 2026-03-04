import { createTheme } from '@mui/material/styles';

// ========================================
// TYPOGRAPHY SYSTEM - STANDARDIZED
// ========================================

// Base font size: 16px (1rem)
// Scale ratio: 1.25 (Major Third)
// Mobile scale ratio: 1.2 (Minor Third)

export const typography = {
  // Font Families
  fontFamily: {
    primary: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    mono: '"Monaco", "Courier New", monospace',
  },

  // Font Sizes (Desktop)
  fontSize: {
    // Display sizes (for hero sections, rarely used in admin)
    display: '64px',      // 4rem
    displayMobile: '40px', // 2.5rem

    // Headings
    h1: '32px',           // 2rem
    h2: '28px',           // 1.75rem
    h3: '24px',           // 1.5rem
    h4: '20px',           // 1.25rem
    h5: '18px',           // 1.125rem
    h6: '16px',           // 1rem

    // Body text
    body: '16px',         // 1rem (base)
    bodyLarge: '18px',    // 1.125rem
    bodySmall: '14px',    // 0.875rem

    // UI Elements
    caption: '12px',      // 0.75rem
    overline: '11px',     // 0.6875rem
    button: '14px',       // 0.875rem
    buttonLarge: '16px',  // 1rem
    input: '16px',        // 1rem
    label: '14px',        // 0.875rem

    // Mobile sizes
    mobile: {
      h1: '24px',         // 1.5rem
      h2: '22px',         // 1.375rem
      h3: '20px',         // 1.25rem
      h4: '18px',         // 1.125rem
      h5: '16px',         // 1rem
      h6: '14px',         // 0.875rem
      body: '15px',       // 0.9375rem
      bodySmall: '13px',  // 0.8125rem
      caption: '11px',    // 0.6875rem
    },
  },

  // Font Weights
  fontWeight: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  // Letter Spacing
  letterSpacing: {
    tight: '-0.8px',
    normal: '0px',
    wide: '0.5px',
    wider: '1px',
  },
};

// ========================================
// BUTTON SYSTEM - STANDARDIZED
// ========================================

export const buttons = {
  // Button Sizes
  size: {
    small: {
      height: '32px',
      minHeight: '32px',
      padding: '6px 16px',
      fontSize: typography.fontSize.caption,
      iconSize: '16px',
    },
    medium: {
      height: '40px',
      minHeight: '40px',
      padding: '10px 24px',
      fontSize: typography.fontSize.button,
      iconSize: '20px',
    },
    large: {
      height: '48px',
      minHeight: '48px',
      padding: '12px 32px',
      fontSize: typography.fontSize.buttonLarge,
      iconSize: '24px',
    },
    // Mobile sizes (touch-friendly)
    mobile: {
      small: {
        height: '36px',
        minHeight: '36px',
        padding: '8px 16px',
      },
      medium: {
        height: '44px',
        minHeight: '44px',
        padding: '10px 24px',
      },
      large: {
        height: '52px',
        minHeight: '52px',
        padding: '14px 32px',
      },
    },
  },

  // Border Radius
  borderRadius: {
    small: '8px',
    medium: '10px',
    large: '12px',
    rounded: '100px', // Fully rounded pill shape
  },

  // Icon Button Sizes
  iconButton: {
    small: {
      width: '32px',
      height: '32px',
      iconSize: '16px',
    },
    medium: {
      width: '40px',
      height: '40px',
      iconSize: '20px',
    },
    large: {
      width: '48px',
      height: '48px',
      iconSize: '24px',
    },
    mobile: {
      small: {
        width: '36px',
        height: '36px',
      },
      medium: {
        width: '44px',
        height: '44px',
      },
      large: {
        width: '52px',
        height: '52px',
      },
    },
  },

  // Button Group Spacing
  groupSpacing: {
    tight: '8px',
    normal: '12px',
    relaxed: '16px',
  },
};

// Brand Colors matching Flutter app
export const colors = {
  // Brand Colors
  brandRed: '#D71920',
  brandDarkRed: '#B01418',
  brandWhite: '#FFFFFF',
  brandBlack: '#000000',

  // Background Colors
  backgroundLight: '#F5F5F5',
  backgroundDark: '#121212',
  cardBackground: '#FFFFFF',

  // Text Colors
  textPrimary: '#000000',
  textSecondary: '#666666',
  textHint: '#999999',
  textWhite: '#FFFFFF',

  // Status Colors
  success: '#4CAF50',
  error: '#D71920',
  warning: '#FF9800',
  info: '#2196F3',

  // UI Colors
  divider: '#E0E0E0',
  border: '#CCCCCC',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

// Create Material-UI theme with standardized typography
export const theme = createTheme({
  typography: {
    fontFamily: typography.fontFamily.primary,
    
    // Headings
    h1: {
      fontSize: typography.fontSize.h1,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: typography.lineHeight.tight,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.h1,
      },
    },
    h2: {
      fontSize: typography.fontSize.h2,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: typography.lineHeight.tight,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.h2,
      },
    },
    h3: {
      fontSize: typography.fontSize.h3,
      fontWeight: typography.fontWeight.bold,
      letterSpacing: typography.letterSpacing.tight,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.h3,
      },
    },
    h4: {
      fontSize: typography.fontSize.h4,
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: typography.letterSpacing.normal,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.h4,
      },
    },
    h5: {
      fontSize: typography.fontSize.h5,
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: typography.letterSpacing.normal,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.h5,
      },
    },
    h6: {
      fontSize: typography.fontSize.h6,
      fontWeight: typography.fontWeight.semibold,
      letterSpacing: typography.letterSpacing.normal,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.h6,
      },
    },
    
    // Body text
    body1: {
      fontSize: typography.fontSize.body,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.body,
      },
    },
    body2: {
      fontSize: typography.fontSize.bodySmall,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.bodySmall,
      },
    },
    
    // UI Elements
    button: {
      fontSize: typography.fontSize.button,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'none',
      letterSpacing: typography.letterSpacing.normal,
      lineHeight: typography.lineHeight.normal,
    },
    caption: {
      fontSize: typography.fontSize.caption,
      fontWeight: typography.fontWeight.regular,
      lineHeight: typography.lineHeight.normal,
      '@media (max-width:1023px)': {
        fontSize: typography.fontSize.mobile.caption,
      },
    },
    overline: {
      fontSize: typography.fontSize.overline,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'uppercase',
      letterSpacing: typography.letterSpacing.wide,
      lineHeight: typography.lineHeight.normal,
    },
    subtitle1: {
      fontSize: typography.fontSize.bodyLarge,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
    },
    subtitle2: {
      fontSize: typography.fontSize.bodySmall,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal,
    },
  },
  palette: {
    primary: {
      main: colors.brandRed,
      dark: colors.brandDarkRed,
      contrastText: colors.brandWhite,
    },
    secondary: {
      main: colors.brandBlack,
      contrastText: colors.brandWhite,
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    background: {
      default: colors.backgroundLight,
      paper: colors.cardBackground,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: buttons.borderRadius.medium,
          textTransform: 'none',
          fontWeight: typography.fontWeight.semibold,
          letterSpacing: typography.letterSpacing.normal,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&.Mui-disabled': {
            opacity: 0.6,
            cursor: 'not-allowed',
          },
        },
        // Size variants
        sizeSmall: {
          height: buttons.size.small.height,
          minHeight: buttons.size.small.minHeight,
          padding: buttons.size.small.padding,
          fontSize: buttons.size.small.fontSize,
          borderRadius: buttons.borderRadius.small,
          '@media (max-width:1023px)': {
            height: buttons.size.mobile.small.height,
            minHeight: buttons.size.mobile.small.minHeight,
            padding: buttons.size.mobile.small.padding,
          },
        },
        sizeMedium: {
          height: buttons.size.medium.height,
          minHeight: buttons.size.medium.minHeight,
          padding: buttons.size.medium.padding,
          fontSize: buttons.size.medium.fontSize,
          borderRadius: buttons.borderRadius.medium,
          '@media (max-width:1023px)': {
            height: buttons.size.mobile.medium.height,
            minHeight: buttons.size.mobile.medium.minHeight,
            padding: buttons.size.mobile.medium.padding,
          },
        },
        sizeLarge: {
          height: buttons.size.large.height,
          minHeight: buttons.size.large.minHeight,
          padding: buttons.size.large.padding,
          fontSize: buttons.size.large.fontSize,
          borderRadius: buttons.borderRadius.large,
          '@media (max-width:1023px)': {
            height: buttons.size.mobile.large.height,
            minHeight: buttons.size.mobile.large.minHeight,
            padding: buttons.size.mobile.large.padding,
          },
        },
        // Variant styles
        containedPrimary: {
          background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
          color: colors.brandWhite,
          '&:hover': {
            background: `linear-gradient(135deg, ${colors.brandDarkRed} 0%, ${colors.brandRed} 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 12px ${colors.brandRed}40`,
          },
        },
        containedSecondary: {
          background: colors.brandBlack,
          color: colors.brandWhite,
          '&:hover': {
            background: '#1a1a1a',
            transform: 'translateY(-2px)',
            boxShadow: `0 6px 12px rgba(0, 0, 0, 0.3)`,
          },
        },
        outlined: {
          borderWidth: '1.5px',
          borderColor: colors.divider,
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: colors.brandRed,
            backgroundColor: `${colors.brandRed}0D`,
          },
        },
        outlinedPrimary: {
          borderWidth: '1.5px',
          borderColor: colors.brandRed,
          color: colors.brandRed,
          '&:hover': {
            borderWidth: '1.5px',
            borderColor: colors.brandDarkRed,
            backgroundColor: `${colors.brandRed}14`,
          },
        },
        text: {
          '&:hover': {
            backgroundColor: `${colors.brandRed}0D`,
          },
        },
        textPrimary: {
          color: colors.brandRed,
          '&:hover': {
            backgroundColor: `${colors.brandRed}14`,
          },
        },
        // Icon buttons
        startIcon: {
          '& > *:first-of-type': {
            fontSize: 'inherit',
          },
        },
        endIcon: {
          '& > *:first-of-type': {
            fontSize: 'inherit',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: buttons.borderRadius.medium,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
        sizeSmall: {
          width: buttons.iconButton.small.width,
          height: buttons.iconButton.small.height,
          fontSize: buttons.iconButton.small.iconSize,
          borderRadius: buttons.borderRadius.small,
          '@media (max-width:1023px)': {
            width: buttons.iconButton.mobile.small.width,
            height: buttons.iconButton.mobile.small.height,
          },
        },
        sizeMedium: {
          width: buttons.iconButton.medium.width,
          height: buttons.iconButton.medium.height,
          fontSize: buttons.iconButton.medium.iconSize,
          borderRadius: buttons.borderRadius.medium,
          '@media (max-width:1023px)': {
            width: buttons.iconButton.mobile.medium.width,
            height: buttons.iconButton.mobile.medium.height,
          },
        },
        sizeLarge: {
          width: buttons.iconButton.large.width,
          height: buttons.iconButton.large.height,
          fontSize: buttons.iconButton.large.iconSize,
          borderRadius: buttons.borderRadius.large,
          '@media (max-width:1023px)': {
            width: buttons.iconButton.mobile.large.width,
            height: buttons.iconButton.mobile.large.height,
          },
        },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
        grouped: {
          minWidth: 'auto',
          '&:not(:last-of-type)': {
            borderRight: `1px solid ${colors.divider}`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: `${colors.backgroundLight}4D`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: `${colors.divider}26`,
              borderWidth: 1.5,
              transition: 'border-color 0.3s ease',
            },
            '&:hover fieldset': {
              borderColor: colors.brandRed,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.brandRed,
              borderWidth: 2.5,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: `0 4px 6px ${colors.shadow}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: `0 8px 16px ${colors.shadow}33`,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
      },
    },
  },
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
});

// Constants matching Flutter app
export const constants = {
  // Route Names
  routes: {
    login: '/login',
    dashboard: '/dashboard',
    fixtures: '/fixtures',
    users: '/users',
    predictions: '/predictions',
    leaderboard: '/leaderboard',
    rewards: '/rewards',
    notifications: '/notifications',
    content: '/content',
    polls: '/polls',
    referrals: '/referrals',
    logs: '/logs',
    settings: '/settings',
    apiSync: '/api-data-sync',
  },
  // Side Menu Width
  sideMenuWidth: 300,
  sideMenuCollapsedWidth: 80,
  // Top Bar Height
  topBarHeight: 80,
  topBarHeightMobile: 64,
  // Breakpoints
  breakpoints: {
    mobile: 480,
    tablet: 1024,
    desktop: 1440,
  },
};
