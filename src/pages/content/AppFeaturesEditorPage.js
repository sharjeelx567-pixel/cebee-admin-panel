import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  IconButton,
  Alert,
  Snackbar,
} from '@mui/material';
import { Star, Edit as EditIcon, CheckCircle, Close, Description, Tag } from '@mui/icons-material';
import { colors } from '../../config/theme';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { getPublishedAppFeatures, getAppFeatureById, createAppFeatures, updateAppFeatures } from '../../services/appFeaturesService';

// Static default content
const defaultContent = `<h1>How CeBee Predict Works</h1>

<h2>Welcome to CeBee Predict</h2>

<p>CeBee Predict is a 100% skill-based prediction platform where you can test your football knowledge and win exciting rewards. No betting, no gambling - just pure prediction skills!</p>

<h2>Getting Started</h2>

<ul>
  <li><strong>Create Account:</strong> Sign up with your email or social media account</li>
  <li><strong>Complete Profile:</strong> Add your details and verify your account</li>
  <li><strong>Start Predicting:</strong> Browse available matches and make your predictions</li>
  <li><strong>Earn SP:</strong> Correct predictions earn you Skill Points (SP)</li>
</ul>

<h2>How SP (Skill Points) Work</h2>

<ul>
  <li>SP is awarded for accurate predictions</li>
  <li>Difficult predictions earn more SP</li>
  <li>SP accumulates throughout the month</li>
  <li>SP has no monetary value - it's purely skill-based</li>
</ul>

<h2>Making Predictions</h2>

<ul>
  <li>Choose from available football matches</li>
  <li>Predict the outcome: Home Win, Draw, or Away Win</li>
  <li>Submit before match kickoff</li>
  <li>Wait for match results to see your SP earnings</li>
</ul>

<h2>Monthly Leaderboard & Winners</h2>

<ul>
  <li>Leaderboard updates in real-time based on SP earned</li>
  <li>Top performers at month-end win rewards</li>
  <li>Rewards include merchandise, vouchers, and exclusive benefits</li>
  <li>Winners announced on the 1st of each month</li>
</ul>

<h2>Reward System</h2>

<ul>
  <li>Rewards are 100% non-monetary</li>
  <li>Options include branded merchandise, gift vouchers, and exclusive perks</li>
  <li>Choose your preferred reward from available options</li>
  <li>Rewards delivered within 15 business days</li>
</ul>

<h2>Fair Play Guidelines</h2>

<ul>
  <li>One account per user</li>
  <li>No automated tools or bots</li>
  <li>Predictions cannot be changed after submission</li>
  <li>Violation results in account suspension</li>
</ul>`;

const AppFeaturesEditorPage = () => {
  const [content, setContent] = useState(defaultContent);
  const [title, setTitle] = useState('How CeBee Predict Works');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [version, setVersion] = useState('1.0');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [status, setStatus] = useState('published');
  const [currentAppFeatureId, setCurrentAppFeatureId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get published app features first (sorted by updatedAt desc, so first is latest)
      const response = await getPublishedAppFeatures();
      
      if (response.success && response.data?.appFeatures && response.data.appFeatures.length > 0) {
        // Use the first published app feature (latest one)
        const appFeature = response.data.appFeatures[0];
        setContent(appFeature.content || defaultContent);
        setTitle(appFeature.title || 'How CeBee Predict Works');
        setVersion(appFeature.version || '1.0');
        setUpdatedAt(appFeature.updatedAt ? new Date(appFeature.updatedAt) : new Date());
        setStatus(appFeature.status ? appFeature.status.toLowerCase() : 'published');
        setCurrentAppFeatureId(appFeature._id);
      } else {
        // No published features found, use default content
        setContent(defaultContent);
        setTitle('How CeBee Predict Works');
        setVersion('1.0');
        setUpdatedAt(new Date());
        setStatus('draft');
        setCurrentAppFeatureId(null);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load app features. Using default content.');
      // Use default content as fallback
      setContent(defaultContent);
      setTitle('How CeBee Predict Works');
      setVersion('1.0');
      setUpdatedAt(new Date());
      setStatus('draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const appFeatureData = {
        title: title.trim(),
        content: content.trim(),
        version: version.trim() || '1.0',
        status: status,
      };

      let response;
      if (currentAppFeatureId) {
        // Update existing app features
        response = await updateAppFeatures(currentAppFeatureId, appFeatureData);
      } else {
        // Create new app features
        response = await createAppFeatures(appFeatureData);
      }

      if (response.success) {
        const appFeature = response.data;
        setContent(appFeature.content || content);
        setTitle(appFeature.title || title);
        setVersion(appFeature.version || version);
        setUpdatedAt(appFeature.updatedAt ? new Date(appFeature.updatedAt) : new Date());
        setStatus(appFeature.status ? appFeature.status.toLowerCase() : status);
        setCurrentAppFeatureId(appFeature._id || currentAppFeatureId);
        
        setSuccessMessage(response.message || 'App features saved successfully!');
        setIsModalOpen(false);
        
        // Reload content to get latest version
        await loadContent();
      } else {
        setError(response.error || 'Failed to save app features');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setError('An unexpected error occurred while saving app features');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
  };

  const handleEditClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
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
      {/* App Features / How It Works Section */}
      <Card
        sx={{
          padding: 3,
          borderRadius: '20px',
          backgroundColor: '#C8E6C9',
          border: `1px solid #A5D6A7`,
          boxShadow: 'none',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mb: 2 }}>
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '18px',
              backgroundColor: '#A5D6A7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Star sx={{ fontSize: 36, color: '#388E3C' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.75, fontSize: 18 }}>
              App Features / How It Works
            </Typography>
            <Typography variant="body2" sx={{ color: '#737373', fontSize: 14, lineHeight: 1.5 }}>
              Explains how predictions work, how SP is earned, how monthly winners are selected, and what
              rewards are. Basic text formatting only, no images or videos.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 2 }}>
          <Chip
            label={`Version: ${version}`}
            size="small"
            sx={{
              backgroundColor: '#4CAF50',
              color: colors.brandWhite,
              fontWeight: 600,
              fontSize: 13,
              height: 34,
              borderRadius: '20px',
              px: 0.5,
            }}
          />
          <Chip
            label={updatedAt ? `Updated: ${format(updatedAt instanceof Date ? updatedAt : new Date(updatedAt), 'MMM dd, yyyy')}` : 'Updated: Not yet'}
            size="small"
            sx={{
              backgroundColor: '#2196F3',
              color: colors.brandWhite,
              fontWeight: 600,
              fontSize: 13,
              height: 34,
              borderRadius: '20px',
              px: 0.5,
            }}
          />
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: '#F44336',
              color: colors.brandWhite,
              fontWeight: 600,
              fontSize: 13,
              height: 34,
              borderRadius: '20px',
              px: 0.5,
            }}
          />
        </Box>
      </Card>

      {/* App Features Preview Section */}
      <Card
        sx={{
          padding: 3,
          borderRadius: '20px',
          backgroundColor: '#FFEBEE',
          border: `1px solid #FFCDD2`,
          boxShadow: 'none',
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '12px',
                backgroundColor: colors.brandRed,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star sx={{ fontSize: 24, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5, fontSize: 18 }}>
                App Features Preview
              </Typography>
              <Typography variant="body2" sx={{ color: '#737373', fontSize: 14 }}>
                Review app features and how it works
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<EditIcon sx={{ fontSize: 18 }} />}
            onClick={handleEditClick}
            sx={{
              backgroundColor: colors.brandRed,
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 15,
              px: 3,
              py: 1.25,
              boxShadow: 'none',
              '&:hover': {
                backgroundColor: colors.brandDarkRed,
                boxShadow: 'none',
              },
            }}
          >
            Edit
          </Button>
        </Box>

        <Box
          sx={{
            mt: 3,
            padding: 4,
            borderRadius: '20px',
            backgroundColor: colors.brandWhite,
            border: `1px solid ${colors.divider}26`,
            minHeight: '500px',
            maxWidth: '900px',
            margin: '24px auto 0',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 1.5, fontSize: 26 }}>
              {title}
            </Typography>
            {updatedAt && (
              <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: 14 }}>
                Version {version} • Updated {format(updatedAt instanceof Date ? updatedAt : new Date(updatedAt), 'MMM dd, yyyy')}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              '& .ql-editor': {
                padding: 0,
              },
              '& h1': {
                fontSize: '24px',
                fontWeight: 700,
                color: colors.brandBlack,
                marginBottom: '16px',
                marginTop: '0',
              },
              '& h2': {
                fontSize: '18px',
                fontWeight: 600,
                color: colors.brandBlack,
                marginTop: '24px',
                marginBottom: '12px',
              },
              '& p': {
                lineHeight: 1.7,
                color: '#4A4A4A',
                fontSize: '15px',
                marginBottom: '12px',
              },
              '& ul': {
                paddingLeft: '24px',
                marginBottom: '16px',
              },
              '& li': {
                lineHeight: 1.8,
                color: '#4A4A4A',
                fontSize: '15px',
                marginBottom: '8px',
              },
              '& strong': {
                fontWeight: 600,
                color: colors.brandBlack,
              },
            }}
            dangerouslySetInnerHTML={{ __html: content || '<p>No content available. Click Edit to add content.</p>' }}
          />
        </Box>
      </Card>

      {/* Edit App Features Modal */}
      <Dialog
        open={isModalOpen}
        onClose={handleModalClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                }}
              >
                <Star sx={{ fontSize: 24, color: colors.brandWhite }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.5 }}>
                  Edit App Features
                </Typography>
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 13 }}>
                  Make changes to how it works content
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={handleModalClose}
              sx={{
                border: `1.5px solid ${colors.divider}66`,
                borderRadius: '12px',
                color: colors.textSecondary,
              }}
            >
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 0 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Title Field */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Title
              </Typography>
              <TextField
                fullWidth
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="How CeBee Predict Works"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: colors.brandRed }}>
                      <Typography sx={{ fontSize: 16, fontWeight: 600 }}>Aa</Typography>
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: colors.brandWhite,
                    '& fieldset': {
                      borderColor: `${colors.divider}66`,
                    },
                  },
                }}
              />
            </Box>

            {/* Version Field */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Version
              </Typography>
              <TextField
                fullWidth
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: colors.brandRed }}>
                      <Tag sx={{ fontSize: 18 }} />
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    backgroundColor: colors.brandWhite,
                    '& fieldset': {
                      borderColor: `${colors.divider}66`,
                    },
                  },
                }}
              />
            </Box>

            {/* Status Field */}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, fontSize: 14 }}>
                Status
              </Typography>
              <TextField
                select
                fullWidth
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                SelectProps={{ native: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                  },
                }}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </TextField>
            </Box>

            {/* Content Field (Markdown supported) */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Description sx={{ fontSize: 18, color: colors.brandRed }} />
                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 14 }}>
                  Content (Markdown supported)
                </Typography>
              </Box>
              <Box
                sx={{
                  '& .ql-container': {
                    minHeight: '400px',
                    backgroundColor: colors.brandWhite,
                  },
                  '& .ql-editor': {
                    minHeight: '400px',
                  },
                  '& .ql-editor.ql-blank::before': {
                    fontStyle: 'normal',
                    color: colors.textSecondary,
                    fontSize: 14,
                  },
                }}
              >
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  placeholder="Enter app features content (Markdown supported)..."
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ list: 'ordered' }, { list: 'bullet' }],
                      ['code-block'],
                      ['clean'],
                    ],
                  }}
                  formats={['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'code-block']}
                />
              </Box>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
              <Button
                variant="outlined"
                onClick={handleModalClose}
                sx={{
                  borderColor: colors.divider,
                  color: colors.textSecondary,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: `linear-gradient(135deg, ${colors.brandRed} 0%, ${colors.brandDarkRed} 100%)`,
                  textTransform: 'none',
                  fontWeight: 600,
                  borderRadius: '12px',
                  px: 3,
                  py: 1,
                }}
              >
                {saving ? 'Saving...' : 'Save & Publish'}
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppFeaturesEditorPage;
