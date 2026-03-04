import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Grid,
  CircularProgress,
  IconButton,
  Chip,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  ArrowBack,
  Save,
  Add,
  Info,
  Image as ImageIcon,
  Stadium,
  Flag,
  VisibilityOff,
  ArrowDownward,
  CloudUpload,
  Close,
  CheckCircle,
} from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import { createLeague, updateLeague, getLeague } from '../services/leaguesService';

const LeagueFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    type: 'domestic',
    logoUrl: '',
    isActive: false,
    priority: '',
    country: '',
    league_code: '',
  });

  useEffect(() => {
    const loadLeagueData = async () => {
      try {
        setLoading(true);
        setError('');

        if (id) {
          const result = await getLeague(id);
          
          if (result.success && result.data?.league) {
            const league = result.data.league;
            
            // Normalize leagueType: convert "Domestic"/"International"/"Cup" to "domestic"/"international"/"cup"
            // Backend returns "Domestic", "International", or "Cup", form uses "domestic", "international", or "cup"
            let normalizedType = 'domestic';
            const leagueType = (league.leagueType || league.type || '').toLowerCase();
            if (leagueType === 'international') {
              normalizedType = 'international';
            } else if (leagueType === 'cup') {
              normalizedType = 'cup';
            } else if (leagueType === 'domestic') {
              normalizedType = 'domestic';
            }
            
            setFormData({
              name: league.league_name || league.name || '',
              type: normalizedType,
              logoUrl: league.logo || league.logoUrl || '',
              isActive: league.status === 'Active',
              priority: league.priority?.toString() || '0',
              country: league.country || '',
              league_code: league.league_code || '',
            });
            
            if (league.logo) {
              setLogoPreview(league.logo);
            }
          } else {
            setError(result.error || 'Failed to load league data');
          }
        }
      } catch (error) {
        console.error('Error loading league:', error);
        setError('An unexpected error occurred while loading league data');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      loadLeagueData();
    } else {
      setLoading(false);
    }
  }, [id, isEditMode]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload PNG, JPG, or SVG file');
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setFormData({ ...formData, logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData({ ...formData, logoUrl: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.name.trim()) {
      setError('League name is required');
      return;
    }

    if (!formData.type || !formData.type.trim()) {
      setError('League type is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Map form data to backend format
      // Normalize type: form uses "domestic", "international", or "cup"
      // Backend expects "Domestic", "International", or "Cup"
      const normalizedType = (formData.type || 'domestic').toLowerCase();
      let leagueType = 'Domestic'; // Default
      
      if (normalizedType === 'international') {
        leagueType = 'International';
      } else if (normalizedType === 'cup') {
        leagueType = 'Cup';
      } else if (normalizedType === 'domestic') {
        leagueType = 'Domestic';
      }
      
      const leagueData = {
        league_name: formData.name.trim(),
        leagueType: leagueType,
        logo: formData.logoUrl || null,
        status: formData.isActive ? 'Active' : 'Inactive',
        priority: formData.priority ? parseInt(formData.priority) : 0,
        country: formData.country?.trim() || null,
        league_code: formData.league_code?.trim().toUpperCase() || null,
      };
      
      // Debug log to verify data being sent
      console.log('Saving league - Full data:', {
        formData: formData,
        formType: formData.type,
        normalizedType,
        backendLeagueType: leagueType,
        leagueData: leagueData,
        isEditMode,
        leagueId: id
      });

      let result;
      
      if (isEditMode) {
        // Update existing league
        result = await updateLeague(id, leagueData);
      } else {
        // Create new league
        result = await createLeague(leagueData);
      }

      if (result.success) {
        // Show success message
        alert(result.message || `League ${isEditMode ? 'updated' : 'created'} successfully!`);
        
        // Navigate back to leagues list
        navigate('/leagues');
      } else {
        setError(result.error || `Failed to ${isEditMode ? 'update' : 'create'} league`);
      }
    } catch (error) {
      console.error('Error saving league:', error);
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: colors.brandRed }} />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* Header with Buttons */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton
          onClick={() => navigate('/leagues')}
          sx={{
            backgroundColor: colors.brandRed,
            color: colors.brandWhite,
            width: 48,
            height: 48,
            '&:hover': {
              backgroundColor: colors.brandDarkRed,
            },
          }}
        >
          <ArrowBack />
        </IconButton>
        <IconButton
          sx={{
            backgroundColor: colors.brandRed,
            color: colors.brandWhite,
            width: 48,
            height: 48,
            '&:hover': {
              backgroundColor: colors.brandDarkRed,
            },
          }}
        >
          <Add />
        </IconButton>
        <Box sx={{ flex: 1, ml: 2 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.brandBlack,
              fontSize: { xs: 24, md: 28 },
              mb: 0.5,
            }}
          >
            {isEditMode ? 'Edit League' : 'Add New League'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: colors.textSecondary,
              fontSize: 14,
            }}
          >
            {isEditMode ? 'Edit league information' : 'Create a new league'}
          </Typography>
        </Box>
      </Box>

      {/* Form */}
      <Card sx={{ padding: 3, borderRadius: '16px' }}>
        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: '12px',
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {/* Section Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: colors.brandRed,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info sx={{ fontSize: 18, color: colors.brandWhite }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: colors.brandBlack,
              fontSize: 18,
            }}
          >
            League Information
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* League Logo */}
          <Grid item xs={12}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <ImageIcon sx={{ fontSize: 18, color: colors.brandRed }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}
                >
                  League Logo
                </Typography>
                <Chip
                  label="Optional"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: 11,
                    backgroundColor: colors.backgroundLight,
                    color: colors.textSecondary,
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: colors.textSecondary, fontSize: 12, ml: 4 }}
              >
                P1: Logo not displayed in user app (copyright). Team badges used instead.
              </Typography>
            </Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleLogoUpload}
              style={{ display: 'none' }}
            />
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: `2px dashed ${colors.divider}66`,
                borderRadius: '12px',
                padding: 4,
                backgroundColor: colors.backgroundLight,
                cursor: 'pointer',
                textAlign: 'center',
                position: 'relative',
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                  backgroundColor: `${colors.backgroundLight}DD`,
                },
              }}
            >
              {logoPreview ? (
                <>
                  <img
                    src={logoPreview}
                    alt="League logo"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '180px',
                      borderRadius: '8px',
                    }}
                  />
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveLogo();
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: colors.brandRed,
                      color: colors.brandWhite,
                      '&:hover': {
                        backgroundColor: colors.brandDarkRed,
                      },
                    }}
                  >
                    <Close />
                  </IconButton>
                </>
              ) : (
                <>
                  <CloudUpload
                    sx={{
                      fontSize: 48,
                      color: colors.brandRed,
                      mb: 1,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.brandBlack,
                      mb: 0.5,
                    }}
                  >
                    Click to Upload Logo
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: colors.textSecondary,
                      fontSize: 12,
                    }}
                  >
                    PNG, JPG or SVG (Max 2MB)
                  </Typography>
                </>
              )}
            </Box>
          </Grid>

          {/* League Name */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Stadium sx={{ fontSize: 18, color: colors.brandRed }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}
              >
                League Name
              </Typography>
              <Typography sx={{ color: colors.brandRed, fontSize: 18 }}>*</Typography>
            </Box>
            <TextField
              fullWidth
              placeholder="e.g., Premier League, La Liga, UEFA Champions League"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Grid>

          {/* League Type */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Flag sx={{ fontSize: 18, color: colors.brandRed }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}
              >
                League Type
              </Typography>
              <Typography sx={{ color: colors.brandRed, fontSize: 18 }}>*</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <ToggleButtonGroup
                value={formData.type}
                exclusive
                onChange={(e, newValue) => {
                  if (newValue !== null) handleChange('type', newValue);
                }}
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '20px',
                    textTransform: 'none',
                    fontWeight: 600,
                    border: `1.5px solid ${colors.divider}66`,
                    px: 3,
                    py: 1,
                    '&.Mui-selected': {
                      backgroundColor: colors.info,
                      color: colors.brandWhite,
                      '&:hover': {
                        backgroundColor: colors.info,
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="domestic">Domestic</ToggleButton>
                <ToggleButton value="international">International</ToggleButton>
                <ToggleButton value="cup">Cup</ToggleButton>
              </ToggleButtonGroup>
              <Typography
                variant="caption"
                sx={{ color: colors.textSecondary, fontSize: 12 }}
              >
                • {formData.type === 'domestic' ? 'National leagues (e.g., Premier League)' :
                  formData.type === 'international' ? 'International competitions (e.g., UEFA Champions League)' :
                    'Cup competitions (e.g., FA Cup)'}
              </Typography>
              <IconButton size="small" sx={{ ml: 'auto' }}>
                <ArrowDownward sx={{ fontSize: 16, color: colors.brandRed }} />
              </IconButton>
            </Box>
          </Grid>

          {/* League Status */}
          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <VisibilityOff sx={{ fontSize: 18, color: colors.textSecondary }} />
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}
                >
                  League Status
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.textSecondary, fontSize: 13 }}
                >
                  {formData.isActive ? 'Active - Visible in user app' : 'Inactive - Hidden from user app'}
                </Typography>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => handleChange('isActive', e.target.checked)}
                  disabled={!isEditMode && !formData.isActive}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.success,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.success,
                    },
                  }}
                />
              </Box>
              {!isEditMode && (
                <Alert
                  severity="info"
                  icon={<Info sx={{ fontSize: 18 }} />}
                  sx={{
                    backgroundColor: `${colors.info}14`,
                    color: colors.brandBlack,
                    borderRadius: '8px',
                    '& .MuiAlert-icon': {
                      color: colors.info,
                    },
                  }}
                >
                  New leagues are created as Inactive by default. Activate from the list page after creation.
                </Alert>
              )}
            </Box>
          </Grid>

          {/* Priority */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ArrowDownward sx={{ fontSize: 18, color: colors.brandRed }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: colors.brandBlack, fontSize: 14 }}
              >
                Priority (Optional - for future sorting)
              </Typography>
            </Box>
            <TextField
              fullWidth
              type="number"
              placeholder="Lower number = higher display priority (e.g., 1, 2, 3...)"
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              sx={{
                borderRadius: '12px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                },
              }}
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<Close />}
                onClick={() => navigate('/leagues')}
                sx={{
                  borderColor: colors.textSecondary,
                  color: colors.textSecondary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '12px',
                  px: 3,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} sx={{ color: colors.brandWhite }} /> : <CheckCircle />}
                onClick={handleSave}
                disabled={saving || !formData.name?.trim()}
                sx={{
                  background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  '&:disabled': {
                    backgroundColor: '#9CA3AF',
                    color: colors.brandWhite,
                  },
                }}
              >
                {saving 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update League' : 'Create League')
                }
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default LeagueFormPage;
