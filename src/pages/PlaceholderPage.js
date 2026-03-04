import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { colors, constants } from '../config/theme';

const PlaceholderPage = ({ title = 'Page', description = 'This page is being converted from Flutter.' }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{ textAlign: 'center', padding: 6 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 2 }}>
        {title}
      </Typography>
      <Typography variant="body1" sx={{ color: colors.textSecondary, mb: 3 }}>
        {description}
      </Typography>
      <Button
        variant="contained"
        startIcon={<ArrowBack />}
        onClick={() => navigate(constants.routes.dashboard)}
        sx={{
          background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
          borderRadius: '12px',
          textTransform: 'none',
          fontWeight: 600,
        }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
};

export default PlaceholderPage;
