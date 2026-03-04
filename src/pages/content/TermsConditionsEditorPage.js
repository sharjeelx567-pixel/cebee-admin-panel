import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Card, CircularProgress, Alert, Chip, Snackbar } from '@mui/material';
import { CheckCircle, Info } from '@mui/icons-material';
import { colors } from '../../config/theme';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { format } from 'date-fns';
import { getPublishedTerms, createTerms, updateTerms } from '../../services/termsService';

const TermsConditionsEditorPage = () => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [version, setVersion] = useState('1.0');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [currentTermsId, setCurrentTermsId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get published terms first (sorted by updatedAt desc, so first is latest)
      const response = await getPublishedTerms();
      
      if (response.success && response.data?.terms && response.data.terms.length > 0) {
        // Use the first published terms (latest one)
        const terms = response.data.terms[0];
        setContent(terms.content || '');
        setVersion(terms.version || '1.0');
        setUpdatedAt(terms.updatedAt ? new Date(terms.updatedAt) : new Date());
        setCurrentTermsId(terms._id);
      } else {
        // No published terms found, start with empty content
        setContent('');
        setVersion('1.0');
        setUpdatedAt(null);
        setCurrentTermsId(null);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Failed to load terms & conditions. Please try again.');
      setContent('');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const termsData = {
        content: content.trim(),
        version: version.trim() || '1.0',
        isActive: true, // Always publish when saving
      };

      let response;
      if (currentTermsId) {
        // Update existing terms
        response = await updateTerms(currentTermsId, termsData);
      } else {
        // Create new terms
        response = await createTerms(termsData);
      }

      if (response.success) {
        const terms = response.data;
        setContent(terms.content || content);
        setVersion(terms.version || version);
        setUpdatedAt(terms.updatedAt ? new Date(terms.updatedAt) : new Date());
        setCurrentTermsId(terms._id || currentTermsId);
        
        setSuccessMessage(response.message || 'Terms & Conditions saved successfully!');
        
        // Reload content to get latest version
        await loadContent();
      } else {
        setError(response.error || 'Failed to save terms & conditions');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      setError('An unexpected error occurred while saving terms & conditions');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage(null);
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
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: colors.brandBlack,
              fontSize: 28,
              mb: 0.5,
            }}
          >
            Terms & Conditions Editor
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: 15 }}>
            Edit your terms & conditions content
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<CheckCircle sx={{ fontSize: 18 }} />}
          onClick={handleSave}
          disabled={saving}
          sx={{
            backgroundColor: colors.brandRed,
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 15,
            px: 3,
            py: 1.5,
            boxShadow: 'none',
            '&:hover': {
              backgroundColor: colors.brandDarkRed,
              boxShadow: 'none',
            },
          }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </Box>

      {/* Editor Card */}
      <Card
        sx={{
          padding: 4,
          borderRadius: '24px',
          backgroundColor: colors.brandWhite,
          border: `1px solid #E5E7EB`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        }}
      >
        {/* Metadata */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
          <Chip label={`Version: ${version}`} size="small" sx={{ backgroundColor: '#2196F3', color: 'white', fontWeight: 600 }} />
          <Chip 
            label={updatedAt ? `Updated: ${format(updatedAt instanceof Date ? updatedAt : new Date(updatedAt), 'MMM dd, yyyy')}` : 'Not yet updated'} 
            size="small" 
            sx={{ backgroundColor: '#4CAF50', color: 'white', fontWeight: 600 }} 
          />
          <Chip label="PUBLISHED" size="small" sx={{ backgroundColor: '#F44336', color: 'white', fontWeight: 600 }} />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Info Banner */}
        <Box sx={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Alert
            icon={<Info sx={{ fontSize: 22 }} />}
            severity="info"
            sx={{
              mb: 4,
              borderRadius: '16px',
              backgroundColor: '#DBEAFE',
              border: '1px solid #93C5FD',
              '& .MuiAlert-icon': {
                color: '#2563EB',
              },
              '& .MuiAlert-message': {
                color: '#1E40AF',
                fontSize: 15,
                fontWeight: 500,
              },
            }}
          >
            Rich text only — Basic formatting supported (bold, italic, lists). No images, videos, or custom styling.
          </Alert>

          <Box
            sx={{
              '& .ql-container': {
                minHeight: '500px',
                backgroundColor: colors.brandWhite,
                borderRadius: '0 0 16px 16px',
                border: `1px solid #E5E7EB`,
                borderTop: 'none',
              },
              '& .ql-toolbar': {
                borderRadius: '16px 16px 0 0',
                backgroundColor: '#F9FAFB',
                border: `1px solid #E5E7EB`,
                borderBottom: 'none',
              },
              '& .ql-editor': {
                minHeight: '500px',
                fontSize: 15,
                lineHeight: 1.7,
                padding: '20px',
              },
              '& .ql-editor.ql-blank::before': {
                fontStyle: 'normal',
                color: '#D1D5DB',
                fontSize: 15,
              },
            }}
          >
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              placeholder="Enter terms & conditions content..."
              modules={{
                toolbar: [
                  [{ header: [1, 2, 3, false] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  ['clean'],
                ],
              }}
              formats={['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet']}
            />
          </Box>
        </Box>
      </Card>

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

export default TermsConditionsEditorPage;
