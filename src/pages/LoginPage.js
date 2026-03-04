import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { constants } from '../config/theme';
import { colors } from '../config/theme';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Fade,
  Slide,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Mail, Lock, ArrowForward } from '@mui/icons-material';
import appIcon from '../assets/app_icon.png';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(constants.routes.dashboard);
    }
    // Trigger fade-in animation
    setTimeout(() => setFadeIn(true), 100);
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) {
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        navigate(constants.routes.dashboard);
      } else {
        // Show specific error message, especially for rate limiting
        const errorMsg = result.error || 'Login failed. Please try again.';
        setError(errorMsg);
        
        // If it's a rate limit error, show a more helpful message
        if (result.status === 429) {
          setError('Too many login attempts. Please wait a moment before trying again.');
        }
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };



  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: colors.brandWhite,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Red Branding Section */}
      <Box
        sx={{
          height: { xs: '28vh', md: '28vh' },
          background: `linear-gradient(135deg, #D40000 0%, #8B0000 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Box
            component="img"
            src={appIcon}
            alt="CeBee Predict"
            sx={{
              width: { xs: 90, md: 90 },
              height: { xs: 90, md: 90 },
              borderRadius: '20px',
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
              mb: 2,
            }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: colors.brandWhite,
              letterSpacing: -0.8,
              fontSize: { xs: 28, md: 28 },
              mb: 1,
            }}
          >
            CeBee Predict Admin
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: `${colors.brandWhite}E6`,
              letterSpacing: 0.2,
              fontSize: 14,
            }}
          >
            Internal Management Portal
          </Typography>
        </Box>
      </Box>

      {/* Login Form Section */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 3, md: 4 },
        }}
      >
        <Fade in={fadeIn} timeout={800}>
          <Slide direction="up" in={fadeIn} timeout={800}>
            <Container
              maxWidth="sm"
              sx={{
                width: '100%',
              }}
            >
              <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      color: colors.brandBlack,
                      letterSpacing: -0.5,
                      fontSize: { xs: 24, md: 26 },
                      mb: 1,
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: colors.textSecondary,
                      fontSize: 15,
                    }}
                  >
                    Please log in to access the admin panel
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.brandBlack,
                      mb: 1.25,
                      fontSize: 14,
                    }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="admin@ceebeepredict.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: `${colors.backgroundLight}4D`,
                        fontSize: 15,
                        '& fieldset': {
                          borderColor: `${colors.divider}26`,
                          borderWidth: 1.5,
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail sx={{ color: colors.textSecondary, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.brandBlack,
                      mb: 1.25,
                      fontSize: 14,
                    }}
                  >
                    Password
                  </Typography>
                  <TextField
                    fullWidth
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: `${colors.backgroundLight}4D`,
                        fontSize: 15,
                        '& fieldset': {
                          borderColor: `${colors.divider}26`,
                          borderWidth: 1.5,
                        },
                      },
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: colors.textSecondary, fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? (
                              <VisibilityOff sx={{ fontSize: 20, color: colors.textSecondary }} />
                            ) : (
                              <Visibility sx={{ fontSize: 20, color: colors.textSecondary }} />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        sx={{
                          color: '#D40000',
                          '&.Mui-checked': {
                            color: '#D40000',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 500, fontSize: 14 }}
                      >
                        Remember me
                      </Typography>
                    }
                  />
                  <Button
                    variant="text"
                    sx={{
                      color: '#D40000',
                      fontWeight: 700,
                      fontSize: 14,
                      textTransform: 'none',
                      padding: '4px 4px',
                    }}
                  >
                    Forgot Password?
                  </Button>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    height: 60,
                    background: `linear-gradient(135deg, #D40000 0%, #8B0000 100%)`,
                    borderRadius: '12px',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                    boxShadow: loading
                      ? '0 4px 8px rgba(212, 0, 0, 0.3)'
                      : '0 4px 16px rgba(212, 0, 0, 0.4)',
                    '&:hover': {
                      background: `linear-gradient(135deg, #8B0000 0%, #D40000 100%)`,
                      boxShadow: '0 6px 16px rgba(212, 0, 0, 0.4)',
                    },
                    '&:disabled': {
                      background: 'rgba(212, 0, 0, 0.6)',
                    },
                  }}
                  endIcon={
                    loading ? (
                      <CircularProgress size={24} sx={{ color: colors.brandWhite }} />
                    ) : (
                      <ArrowForward />
                    )
                  }
                >
                  {loading ? 'Logging in...' : 'Login to Dashboard'}
                </Button>
              </Box>
            </Container>
          </Slide>
        </Fade>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          width: '100%',
          padding: { xs: 2, md: 2.5 },
          backgroundColor: `${colors.backgroundLight}4D`,
          borderTop: `1px solid ${colors.divider}33`,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: 12, md: 13 },
            fontWeight: 500,
            color: colors.textSecondary,
            letterSpacing: 0.2,
          }}
        >
          © 2025 CeBee Predict — Internal Use Only
        </Typography>
      </Box>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginPage;
