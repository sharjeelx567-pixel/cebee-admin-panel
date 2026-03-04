import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
} from '@mui/material';
import {
  Help,
  Book,
  Lightbulb,
  Description,
  Shield,
} from '@mui/icons-material';
import { colors } from '../config/theme';
import FaqManagementPage from './content/FaqManagementPage';
import GameRulesEditorPage from './content/GameRulesEditorPage';
import AppFeaturesEditorPage from './content/AppFeaturesEditorPage';
import TermsConditionsEditorPage from './content/TermsConditionsEditorPage';
import PrivacyPolicyEditorPage from './content/PrivacyPolicyEditorPage';

const ContentUpdatesPage = () => {
  const [selectedSection, setSelectedSection] = useState('faq');

  const sections = [
    { value: 'faq', label: 'FAQ', icon: Help, color: colors.brandRed },
    { value: 'rules', label: 'Rules & Fair Play', icon: Book, color: colors.info },
    { value: 'features', label: 'How It Works', icon: Lightbulb, color: colors.success },
    { value: 'terms', label: 'Terms', icon: Description, color: colors.warning },
    { value: 'privacy', label: 'Privacy', icon: Shield, color: colors.info },
  ];

  const renderContent = () => {
    switch (selectedSection) {
      case 'faq':
        return <FaqManagementPage />;
      case 'rules':
        return <GameRulesEditorPage />;
      case 'features':
        return <AppFeaturesEditorPage />;
      case 'terms':
        return <TermsConditionsEditorPage />;
      case 'privacy':
        return <PrivacyPolicyEditorPage />;
      default:
        return <FaqManagementPage />;
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header */}
      <Box sx={{ mb: 3, width: '100%' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.brandBlack,
            fontSize: { xs: 24, md: 28 },
            mb: 1,
          }}
        >
          Content & App Updates
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>
          Manage FAQ, Rules & Fair Play, How It Works, Terms & Privacy
        </Typography>
      </Box>

      {/* Section Tabs */}
      <Box 
        sx={{ 
          mb: 4, 
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          width: '100%',
          maxWidth: '100%',
          backgroundColor: colors.brandWhite,
          borderRadius: { xs: '16px', md: '20px' },
          padding: { xs: '4px', md: '6px' },
          gap: { xs: '4px', md: '6px' },
          overflow: { xs: 'visible', sm: 'hidden' },
          boxSizing: 'border-box',
        }}
      >
        {sections.map((section, index) => {
          const isSelected = selectedSection === section.value;
          const Icon = section.icon;
          return (
            <Button
              key={section.value}
              startIcon={<Icon sx={{ fontSize: { xs: 18, sm: 20, md: 22 }, flexShrink: 0 }} />}
              onClick={() => setSelectedSection(section.value)}
              sx={{
                flex: { xs: '1 1 auto', sm: 1 },
                minWidth: { xs: 'auto', sm: 0 },
                width: { xs: '100%', sm: 'auto' },
                borderRadius: { xs: '12px', md: '16px' },
                textTransform: 'none',
                fontWeight: 600,
                fontSize: { xs: 14, sm: 15, md: 16 },
                px: { xs: 2, sm: 2, md: 2.5 },
                py: { xs: 1.5, sm: 1.75, md: 2 },
                backgroundColor: isSelected ? section.color : 'transparent',
                color: isSelected ? colors.brandWhite : '#6B7280',
                border: 'none',
                boxShadow: isSelected ? `0 4px 12px ${section.color}40` : 'none',
                justifyContent: { xs: 'flex-start', sm: 'center' },
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%',
                boxSizing: 'border-box',
                '&:hover': {
                  backgroundColor: isSelected ? section.color : '#F5F5F5',
                },
                '& .MuiSvgIcon-root': {
                  color: isSelected ? colors.brandWhite : section.color,
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
                {section.label}
              </Box>
            </Button>
          );
        })}
      </Box>

      {/* Content */}
      <Box sx={{ width: '100%' }}>{renderContent()}</Box>
    </Box>
  );
};

export default ContentUpdatesPage;
