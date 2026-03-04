import React, { useState, useEffect } from 'react';
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
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { colors, constants } from '../config/theme';
import { getFaqById, createFaq, updateFaq } from '../services/faqService';

const FaqFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: 'Getting Started',
    status: 'draft',
    order: 0,
  });

  useEffect(() => {
    const loadFaqData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getFaqById(id);
        
        if (response.success && response.data) {
          const faq = response.data;
          // Backend returns status as 'PUBLISHED', 'DRAFT', 'ARCHIVED' (uppercase)
          // Convert to lowercase for form
          const status = faq.status ? faq.status.toLowerCase() : 'draft';
          
          setFormData({
            question: faq.question || '',
            answer: faq.answer || '',
            category: faq.category || 'Getting Started',
            status: status,
            order: faq.order || 0,
          });
        } else {
          setError(response.error || 'Failed to load FAQ');
        }
      } catch (error) {
        console.error('Error loading FAQ:', error);
        setError('An unexpected error occurred while loading FAQ');
      } finally {
        setLoading(false);
      }
    };

    if (isEditMode) {
      loadFaqData();
    } else {
      setLoading(false);
    }
  }, [id, isEditMode]);



  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.question.trim()) {
      setError('Question is required');
      return;
    }
    if (!formData.answer.trim()) {
      setError('Answer is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let response;
      if (isEditMode) {
        response = await updateFaq(id, formData);
      } else {
        response = await createFaq(formData);
      }

      if (response.success) {
        setSuccessMessage(response.message || (isEditMode ? 'FAQ updated successfully' : 'FAQ created successfully'));
        // Navigate after a short delay to show success message
        setTimeout(() => {
          navigate(constants.routes.content);
        }, 1500);
      } else {
        setError(response.error || 'Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      setError('An unexpected error occurred while saving FAQ');
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
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(constants.routes.content)}
        sx={{ mb: 3, color: colors.brandRed, textTransform: 'none', fontWeight: 600 }}
      >
        Back to Content Updates
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {isEditMode ? 'Edit FAQ' : 'Add FAQ'}
      </Typography>

      <Card sx={{ padding: 3, borderRadius: '16px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Question"
              value={formData.question}
              onChange={(e) => handleChange('question', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={6}
              label="Answer"
              value={formData.answer}
              onChange={(e) => handleChange('answer', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                label="Category"
              >
                <MenuItem value="Getting Started">Getting Started</MenuItem>
                <MenuItem value="Predictions">Predictions</MenuItem>
                <MenuItem value="Rewards">Rewards</MenuItem>
                <MenuItem value="Payments">Payments</MenuItem>
                <MenuItem value="Security">Security</MenuItem>
                <MenuItem value="Leaderboard">Leaderboard</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
                <MenuItem value="Support">Support</MenuItem>
                <MenuItem value="Matches">Matches</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              type="number"
              label="Order"
              value={formData.order}
              onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            </Grid>
          )}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(constants.routes.content)}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: `linear-gradient(135deg, ${colors.success} 0%, ${colors.success}DD 100%)`,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                {saving ? 'Saving...' : 'Save FAQ'}
              </Button>
            </Box>
          </Grid>
        </Grid>
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

export default FaqFormPage;
