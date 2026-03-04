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
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { colors, constants } from '../config/theme';


const RewardFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rewardType: 'gift_card', // Default to gift card
    giftCardPlatform: 'Amazon',
    giftCardRegion: 'US',
    usdAmount: 0,
    quantityAvailable: 100,
    minRankRequired: 1,
    status: 'active',
    isLimited: true,
    expiryDate: null,
  });

  useEffect(() => {
    if (isEditMode) {
      loadRewardData();
    } else {
      setLoading(false);
    }
  }, [id]);

  const loadRewardData = async () => {
    try {
      setLoading(true);
      // Simulate network
      await new Promise(resolve => setTimeout(resolve, 800));

      // Mock data replacement
      setFormData({
        name: 'Mock Reward',
        description: 'This is a mock reward description.',
        type: 'points',
        pointsRequired: 500,
        cashValue: 0,
        quantityAvailable: 50,
        minRankRequired: 1,
        tier: 'silver',
        status: 'active',
        isLimited: true,
        expiryDate: null,
      });
    } catch (error) {
      console.error('Error loading reward:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Mock save
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Reward saved:', formData);
      alert('Reward saved (Mock)!');

      navigate(constants.routes.rewards);
    } catch (error) {
      console.error('Error saving reward:', error);
      alert('Failed to save reward');
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
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(constants.routes.rewards)}
        sx={{ mb: 3, color: colors.brandRed, textTransform: 'none', fontWeight: 600 }}
      >
        Back to Rewards
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
        {isEditMode ? 'Edit Reward' : 'Add New Reward'}
      </Typography>

      <Card sx={{ padding: 3, borderRadius: '16px' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Reward Name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Reward Type</InputLabel>
              <Select
                value={formData.rewardType}
                onChange={(e) => handleChange('rewardType', e.target.value)}
                label="Reward Type"
              >
                <MenuItem value="gift_card">Gift Card (Default)</MenuItem>
                <MenuItem value="alternative">Alternative Non-Cash Reward (Requires Approval)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {formData.rewardType === 'gift_card' && (
            <>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Gift Card Platform</InputLabel>
                  <Select
                    value={formData.giftCardPlatform}
                    onChange={(e) => handleChange('giftCardPlatform', e.target.value)}
                    label="Gift Card Platform"
                  >
                    <MenuItem value="Amazon">Amazon</MenuItem>
                    <MenuItem value="Google Play">Google Play</MenuItem>
                    <MenuItem value="Apple">Apple</MenuItem>
                    <MenuItem value="Steam">Steam</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={formData.giftCardRegion}
                    onChange={(e) => handleChange('giftCardRegion', e.target.value)}
                    label="Region"
                  >
                    <MenuItem value="US">US</MenuItem>
                    <MenuItem value="UK">UK</MenuItem>
                    <MenuItem value="EU">EU</MenuItem>
                    <MenuItem value="CA">Canada</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Reward Value (USD)"
              value={formData.usdAmount}
              onChange={(e) => handleChange('usdAmount', parseFloat(e.target.value) || 0)}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Quantity Available"
              value={formData.quantityAvailable}
              onChange={(e) => handleChange('quantityAvailable', parseInt(e.target.value) || 0)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="Minimum Rank Required"
              value={formData.minRankRequired}
              onChange={(e) => handleChange('minRankRequired', parseInt(e.target.value) || 1)}
              helperText="Top 3 (1-3) for monthly leaderboard rewards"
            />
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate(constants.routes.rewards)}
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
                {saving ? 'Saving...' : 'Save Reward'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Card>
    </Box>
  );
};

export default RewardFormPage;
