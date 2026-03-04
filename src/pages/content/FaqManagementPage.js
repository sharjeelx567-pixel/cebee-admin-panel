import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  IconButton,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Help, MoreVert, List as ListIcon, ArrowDropDown, Search as SearchIcon } from '@mui/icons-material';
import { colors } from '../../config/theme';
import DataTable from '../../components/common/DataTable';
import { useNavigate } from 'react-router-dom';
import { getFaqs, deleteFaq } from '../../services/faqService';

// Static FAQ data
const staticFaqsData = [
  {
    id: '1',
    faqId: 'FAQ_001',
    question: 'What is CeBee Predict?',
    answer: 'CeBee Predict is a 100% skill-based football prediction platform where users showcase their football knowledge by predicting match outcomes. It is NOT a betting or gambling platform. You earn Skill Points (SP) based on your prediction accuracy.',
    category: 'Getting Started',
    status: 'published',
    order: 1,
    views: 2500,
    helpful: 2350,
    createdAt: 'Oct 24, 2025',
  },
  {
    id: '2',
    faqId: 'FAQ_002',
    question: 'How do I create an account?',
    answer: 'Download the CeBee Predict app from the App Store or Google Play. Tap "Sign Up" and enter your email, username, and password. Verify your email address and you\'re ready to start predicting!',
    category: 'Getting Started',
    status: 'published',
    order: 2,
    views: 1800,
    helpful: 1650,
    createdAt: 'Oct 20, 2025',
  },
  {
    id: '3',
    faqId: 'FAQ_003',
    question: 'How do I make predictions?',
    answer: 'Browse available matches, select your predictions, and submit before deadline. You can predict match outcomes, scores, and other match events. Make sure to submit before the match starts!',
    category: 'Getting Started',
    status: 'published',
    order: 3,
    views: 2100,
    helpful: 1980,
    createdAt: 'Oct 18, 2025',
  },
  {
    id: '4',
    faqId: 'FAQ_004',
    question: 'What are SP (Skill Points)?',
    answer: 'SP are points you earn by making correct predictions. Accumulate SP to win rewards and climb the leaderboard. The more accurate your predictions, the more SP you earn!',
    category: 'Rewards',
    status: 'published',
    order: 4,
    views: 3200,
    helpful: 3000,
    createdAt: 'Oct 15, 2025',
  },
  {
    id: '5',
    faqId: 'FAQ_005',
    question: 'How do I claim my rewards?',
    answer: 'Navigate to the rewards section and claim your reward. Rewards are fulfilled as gift cards by default. Alternative non-cash rewards may be available with support approval.',
    category: 'Rewards',
    status: 'published',
    order: 5,
    views: 2800,
    helpful: 2600,
    createdAt: 'Oct 12, 2025',
  },
  {
    id: '6',
    faqId: 'FAQ_006',
    question: 'What types of rewards are available?',
    answer: 'CeBee rewards are non-cash only. Gift cards are the primary and default reward type. Alternative non-cash rewards of equal value may be available with support approval for users with genuine reasons.',
    category: 'Payments',
    status: 'published',
    order: 6,
    views: 1900,
    helpful: 1750,
    createdAt: 'Oct 10, 2025',
  },
  {
    id: '7',
    faqId: 'FAQ_007',
    question: 'How long does reward fulfillment take?',
    answer: 'Rewards are fulfilled within 3-5 business days after verification. Gift cards are delivered via email once your reward claim is approved.',
    category: 'Payments',
    status: 'published',
    order: 7,
    views: 2400,
    helpful: 2250,
    createdAt: 'Oct 08, 2025',
  },
  {
    id: '8',
    faqId: 'FAQ_008',
    question: 'Is my personal information secure?',
    answer: 'Yes, we use industry-standard encryption to protect your data. Your personal information is stored securely and never shared with third parties without your consent.',
    category: 'Security',
    status: 'published',
    order: 8,
    views: 1600,
    helpful: 1520,
    createdAt: 'Oct 05, 2025',
  },
  {
    id: '9',
    faqId: 'FAQ_009',
    question: 'Can I change my predictions?',
    answer: 'Predictions can be edited until the match deadline. After the match starts, predictions are locked and cannot be changed. Make sure to review your predictions before the deadline!',
    category: 'Predictions',
    status: 'published',
    order: 9,
    views: 1500,
    helpful: 1400,
    createdAt: 'Oct 02, 2025',
  },
  {
    id: '10',
    faqId: 'FAQ_010',
    question: 'What happens if a match is postponed?',
    answer: 'If a match is postponed, predictions are automatically adjusted to the new match time. You will be notified of any changes and can update your predictions if needed.',
    category: 'Predictions',
    status: 'published',
    order: 10,
    views: 1200,
    helpful: 1100,
    createdAt: 'Sep 28, 2025',
  },
  {
    id: '11',
    faqId: 'FAQ_011',
    question: 'How are winners determined?',
    answer: 'Winners are determined by the highest SP accumulated during the period. Leaderboard rankings are updated in real-time based on prediction accuracy and consistency.',
    category: 'Leaderboard',
    status: 'published',
    order: 11,
    views: 2700,
    helpful: 2550,
    createdAt: 'Sep 25, 2025',
  },
  {
    id: '12',
    faqId: 'FAQ_012',
    question: 'Can I play on multiple devices?',
    answer: 'Yes, you can access your account from any device by logging in with your credentials. Your progress and predictions are synced across all devices.',
    category: 'Account',
    status: 'published',
    order: 12,
    views: 1400,
    helpful: 1300,
    createdAt: 'Sep 20, 2025',
  },
  {
    id: '13',
    faqId: 'FAQ_013',
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login screen and follow instructions. You will receive a password reset link via email to create a new password.',
    category: 'Account',
    status: 'published',
    order: 13,
    views: 1800,
    helpful: 1700,
    createdAt: 'Sep 15, 2025',
  },
  {
    id: '14',
    faqId: 'FAQ_014',
    question: 'What is the referral program?',
    answer: 'Invite friends to earn bonus SP when they join and make predictions. Both you and your friend receive bonus points once they complete their first prediction.',
    category: 'Rewards',
    status: 'published',
    order: 14,
    views: 2200,
    helpful: 2050,
    createdAt: 'Sep 10, 2025',
  },
  {
    id: '15',
    faqId: 'FAQ_015',
    question: 'Are there any fees?',
    answer: 'The platform is free to use. Payment processing fees may apply for withdrawals depending on your chosen payment method. All fees are clearly displayed before withdrawal.',
    category: 'Payments',
    status: 'published',
    order: 15,
    views: 1900,
    helpful: 1800,
    createdAt: 'Sep 05, 2025',
  },
  {
    id: '16',
    faqId: 'FAQ_016',
    question: 'Can I delete my account?',
    answer: 'Yes, contact support to request account deletion. Please note that this action is permanent and all your data, predictions, and rewards will be deleted.',
    category: 'Account',
    status: 'published',
    order: 16,
    views: 800,
    helpful: 750,
    createdAt: 'Sep 01, 2025',
  },
  {
    id: '17',
    faqId: 'FAQ_017',
    question: 'What leagues are available?',
    answer: 'We cover major leagues including Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and many more. New leagues and competitions are added regularly based on user demand.',
    category: 'Matches',
    status: 'published',
    order: 17,
    views: 1700,
    helpful: 1600,
    createdAt: 'Aug 28, 2025',
  },
  {
    id: '18',
    faqId: 'FAQ_018',
    question: 'How do I contact support?',
    answer: 'Use the in-app support chat or email support@ceebeepredict.com. Our support team is available 24/7 to assist you with any questions or issues.',
    category: 'Support',
    status: 'published',
    order: 18,
    views: 1300,
    helpful: 1250,
    createdAt: 'Aug 25, 2025',
  },
  {
    id: '19',
    faqId: 'FAQ_019',
    question: 'What is KYC verification?',
    answer: 'KYC is identity verification required for withdrawals to ensure security and comply with regulations. You will need to provide a valid ID and proof of address.',
    category: 'Security',
    status: 'published',
    order: 19,
    views: 2100,
    helpful: 1950,
    createdAt: 'Aug 20, 2025',
  },
  {
    id: '20',
    faqId: 'FAQ_020',
    question: 'Can I play from any country?',
    answer: 'CeBee Predict is available in most countries. Check terms for restrictions in your region. Some features may be limited based on local regulations.',
    category: 'Getting Started',
    status: 'published',
    order: 20,
    views: 1600,
    helpful: 1500,
    createdAt: 'Aug 15, 2025',
  },
  {
    id: '21',
    faqId: 'FAQ_021',
    question: 'How often are rewards distributed?',
    answer: 'Rewards are distributed monthly based on leaderboard rankings. Winners are announced on the 1st of each month, and rewards are processed within 5 business days.',
    category: 'Rewards',
    status: 'published',
    order: 21,
    views: 2600,
    helpful: 2450,
    createdAt: 'Aug 10, 2025',
  },
  {
    id: '22',
    faqId: 'FAQ_022',
    question: 'What happens to my SP if I miss a month?',
    answer: 'SP accumulates and carries over to the next period. Your total SP is maintained across all periods, so you never lose your earned points.',
    category: 'Rewards',
    status: 'published',
    order: 22,
    views: 1400,
    helpful: 1300,
    createdAt: 'Aug 05, 2025',
  },
  {
    id: '23',
    faqId: 'FAQ_023',
    question: 'Can I appeal a decision?',
    answer: 'Yes, contact support with your case details for review. Our team will investigate and respond within 48 hours. Appeals must be submitted within 7 days of the decision.',
    category: 'Support',
    status: 'published',
    order: 23,
    views: 900,
    helpful: 850,
    createdAt: 'Jul 30, 2025',
  },
  {
    id: '24',
    faqId: 'FAQ_024',
    question: 'How are odds calculated?',
    answer: 'Odds are based on real-time data and historical performance. Our algorithm analyzes team form, head-to-head records, player availability, and other factors to provide accurate odds.',
    category: 'Predictions',
    status: 'published',
    order: 24,
    views: 1800,
    helpful: 1700,
    createdAt: 'Jul 25, 2025',
  },
];

const FaqManagementPage = () => {
  const navigate = useNavigate();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFaq, setSelectedFaq] = useState(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [statusAnchorEl, setStatusAnchorEl] = useState(null);

  const [openDialog, setOpenDialog] = useState(false);
  const [rowsPerPageMenuAnchor, setRowsPerPageMenuAnchor] = useState(null);

  // Load FAQs from API with filters
  const loadFaqs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = {
        page: page + 1, // Backend uses 1-based pagination
        limit: rowsPerPage,
      };

      // Add search filter
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }

      // Add category filter
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }

      // Add status filter - backend expects 'published', 'draft', 'archived' or 'All'
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await getFaqs(params);

      if (response.success && response.data) {
        // Backend returns { faqs: [...], pagination: {...} }
        const faqsData = response.data.faqs || [];
        
        // Map backend data to frontend format
        const mappedFaqs = faqsData.map((faq, index) => ({
          id: faq._id || faq.id,
          faqId: faq.faqId || `FAQ_${String((page * rowsPerPage) + index + 1).padStart(3, '0')}`,
          question: faq.question || '',
          answer: faq.answer || '',
          category: faq.category || 'Getting Started',
          status: faq.status ? faq.status.toLowerCase() : 'published',
          order: faq.order || 0,
          createdAt: faq.createdAt ? new Date(faq.createdAt).toLocaleDateString() : '',
          views: faq.views || 0,
          helpful: faq.helpful || 0,
        }));

        setFaqs(mappedFaqs);
        
        // Update pagination
        if (response.data.pagination) {
          setPagination({
            total: response.data.pagination.total || 0,
            pages: response.data.pagination.pages || 0,
          });
        }
      } else {
        setError(response.error || 'Failed to load FAQs');
        setFaqs([]);
      }
    } catch (error) {
      console.error('Error loading FAQs:', error);
      setError('An unexpected error occurred while loading FAQs');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0); // Reset to first page when search changes
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load FAQs when filters or pagination change
  useEffect(() => {
    loadFaqs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, searchQuery, categoryFilter, statusFilter]);

  const handleRowsPerPageMenuOpen = (event) => {
    setRowsPerPageMenuAnchor(event.currentTarget);
  };

  const handleRowsPerPageMenuClose = () => {
    setRowsPerPageMenuAnchor(null);
  };

  const handleRowsPerPageSelect = (value) => {
    setRowsPerPage(value);
    setPage(0);
    handleRowsPerPageMenuClose();
  };

  const handleMenuOpen = (event, faq) => {
    setAnchorEl(event.currentTarget);
    setSelectedFaq(faq);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedFaq(null);
  };

  const handleEdit = () => {
    if (selectedFaq) {
      navigate(`/content-updates/faq/edit/${selectedFaq.id}`);
    }
    handleMenuClose();
  };

  const handleDeleteFromMenu = async () => {
    if (selectedFaq) {
      if (window.confirm(`Are you sure you want to delete "${selectedFaq.question}"?`)) {
        try {
          const response = await deleteFaq(selectedFaq.id);
          if (response.success) {
            // Reload FAQs after deletion
            loadFaqs();
          } else {
            alert(response.error || 'Failed to delete FAQ');
          }
        } catch (error) {
          console.error('Error deleting FAQ:', error);
          alert('An unexpected error occurred while deleting FAQ');
        }
      }
    }
    handleMenuClose();
  };

  const handleRowClick = (faq) => {
    setSelectedFaq(faq);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const columns = [
    {
      id: 'id',
      label: 'FAQ ID',
      render: (_, row) => (
        <Box
          sx={{
            backgroundColor: '#F5F5F5',
            color: '#6B7280',
            fontWeight: 600,
            fontSize: 13,
            borderRadius: '8px',
            px: 2,
            py: 1,
            display: 'inline-block',
          }}
        >
          {row.faqId || `FAQ_${String(row.order || 0).padStart(3, '0')}`}
        </Box>
      ),
    },
    {
      id: 'question',
      label: 'Question',
      render: (value, row) => (
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: colors.brandBlack, mb: 0.5, fontSize: 14 }}>
            {value || 'N/A'}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: '#9CA3AF', fontSize: 13 }}
          >
            {row.answer?.substring(0, 60) || 'N/A'}...
          </Typography>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      render: (value) => (
        <Chip
          label={value || 'Getting Started'}
          size="small"
          sx={{
            backgroundColor: '#FFF5F5',
            color: '#EF4444',
            fontWeight: 600,
            fontSize: 13,
            height: 32,
            borderRadius: '20px',
            border: 'none',
          }}
        />
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (_, row) => {
        const status = row.status || 'published';
        return (
          <Chip
            label={status.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: '#D1FAE5',
              color: '#10B981',
              fontWeight: 700,
              fontSize: 13,
              height: 32,
              borderRadius: '20px',
              border: 'none',
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuOpen(e, row);
          }}
          sx={{
            backgroundColor: '#FFE0E0',
            color: colors.brandRed,
            width: 36,
            height: 36,
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: '#FFCCCC',
            },
          }}
        >
          <MoreVert sx={{ fontSize: 18 }} />
        </IconButton>
      ),
    },
  ];

  // Use faqs directly since pagination is handled by backend
  const paginatedFaqs = faqs;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%' }}>
      {/* FAQ Management Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, width: '100%' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.75, fontSize: 24 }}>
            FAQ Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: 14 }}>
            Manage frequently asked questions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add sx={{ fontSize: 20 }} />}
          onClick={() => navigate('/content-updates/faq/add')}
          sx={{
            backgroundColor: colors.brandRed,
            borderRadius: '20px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: 16,
            px: 4,
            py: 1.5,
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
            '&:hover': {
              backgroundColor: colors.brandDarkRed,
              boxShadow: '0 6px 16px rgba(220, 38, 38, 0.4)',
            },
          }}
        >
          Add FAQ
        </Button>
      </Box>

      {/* Filter Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Box
          sx={{
            flex: 1,
            minWidth: 240,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            padding: '10px 16px',
            backgroundColor: colors.brandWhite,
            borderRadius: '12px',
            border: `1.5px solid ${colors.divider}40`,
          }}
        >
          <SearchIcon sx={{ color: colors.textSecondary }} />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0); // Reset to first page on search
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(0);
                loadFaqs();
              }
            }}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              fontSize: '14px',
              color: colors.brandBlack,
            }}
          />
        </Box>

        <Box sx={{ minWidth: 180 }}>
          <Button
            onClick={(e) => setCategoryAnchorEl(e.currentTarget)}
            endIcon={<ArrowDropDown />}
            sx={{
              width: '100%',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: colors.brandWhite,
              borderRadius: '12px',
              border: `1.5px solid ${colors.divider}40`,
              color: categoryFilter === 'all' ? colors.textSecondary : colors.brandBlack,
              textTransform: 'none',
              fontSize: 14,
              height: '46px',
            }}
          >
            {categoryFilter === 'all' ? 'Category: All' : categoryFilter}
          </Button>
          <Menu
            anchorEl={categoryAnchorEl}
            open={Boolean(categoryAnchorEl)}
            onClose={() => setCategoryAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: '12px', mt: 1, minWidth: 180 } }}
          >
            <MenuItem onClick={() => { setCategoryFilter('all'); setCategoryAnchorEl(null); setPage(0); }}>All Categories</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Getting Started'); setCategoryAnchorEl(null); setPage(0); }}>Getting Started</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Predictions'); setCategoryAnchorEl(null); setPage(0); }}>Predictions</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Rewards'); setCategoryAnchorEl(null); setPage(0); }}>Rewards</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Account'); setCategoryAnchorEl(null); setPage(0); }}>Account</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Payments'); setCategoryAnchorEl(null); setPage(0); }}>Payments</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Security'); setCategoryAnchorEl(null); setPage(0); }}>Security</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Leaderboard'); setCategoryAnchorEl(null); setPage(0); }}>Leaderboard</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Support'); setCategoryAnchorEl(null); setPage(0); }}>Support</MenuItem>
            <MenuItem onClick={() => { setCategoryFilter('Matches'); setCategoryAnchorEl(null); setPage(0); }}>Matches</MenuItem>
          </Menu>
        </Box>

        <Box sx={{ minWidth: 180 }}>
          <Button
            onClick={(e) => setStatusAnchorEl(e.currentTarget)}
            endIcon={<ArrowDropDown />}
            sx={{
              width: '100%',
              justifyContent: 'space-between',
              padding: '10px 16px',
              backgroundColor: colors.brandWhite,
              borderRadius: '12px',
              border: `1.5px solid ${colors.divider}40`,
              color: statusFilter === 'all' ? colors.textSecondary : colors.brandBlack,
              textTransform: 'none',
              fontSize: 14,
              height: '46px',
            }}
          >
            {statusFilter === 'all' ? 'Status: All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </Button>
          <Menu
            anchorEl={statusAnchorEl}
            open={Boolean(statusAnchorEl)}
            onClose={() => setStatusAnchorEl(null)}
            PaperProps={{ sx: { borderRadius: '12px', mt: 1, minWidth: 180 } }}
          >
            <MenuItem onClick={() => { setStatusFilter('all'); setStatusAnchorEl(null); setPage(0); }}>All Statuses</MenuItem>
            <MenuItem onClick={() => { setStatusFilter('published'); setStatusAnchorEl(null); setPage(0); }}>Published</MenuItem>
            <MenuItem onClick={() => { setStatusFilter('draft'); setStatusAnchorEl(null); setPage(0); }}>Draft</MenuItem>
            <MenuItem onClick={() => { setStatusFilter('archived'); setStatusAnchorEl(null); setPage(0); }}>Archived</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* FAQs List Header */}
      <Card
        sx={{
          padding: 3,
          mb: 0,
          borderRadius: '20px 20px 0 0',
          backgroundColor: colors.brandWhite,
          border: 'none',
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box
              sx={{
                width: 52,
                height: 52,
                backgroundColor: colors.brandRed,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Help sx={{ fontSize: 26, color: colors.brandWhite }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 0.25, fontSize: 20 }}>
                FAQs List
              </Typography>
              <Typography variant="body2" sx={{ color: '#9CA3AF', fontSize: 14 }}>
                {pagination.total || faqs.length} FAQs found
              </Typography>
            </Box>
          </Box>
          <Button
            onClick={handleRowsPerPageMenuOpen}
            endIcon={<ArrowDropDown sx={{ color: colors.brandRed }} />}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 500,
              fontSize: 14,
              px: 2,
              py: 1,
              color: colors.brandBlack,
              border: `1.5px solid ${colors.divider}40`,
              backgroundColor: colors.brandWhite,
              '&:hover': {
                backgroundColor: '#F5F5F5',
                borderColor: colors.brandRed,
              },
            }}
          >
            <ListIcon sx={{ fontSize: 18, mr: 1, color: colors.brandRed }} />
            {rowsPerPage} / page
          </Button>
          <Menu
            anchorEl={rowsPerPageMenuAnchor}
            open={Boolean(rowsPerPageMenuAnchor)}
            onClose={handleRowsPerPageMenuClose}
            PaperProps={{
              sx: {
                borderRadius: '12px',
                minWidth: 140,
                mt: 1,
                boxShadow: `0 4px 12px ${colors.shadow}33`,
              },
            }}
          >
            {[10, 25, 50].map((num) => (
              <MenuItem
                key={num}
                onClick={() => handleRowsPerPageSelect(num)}
                sx={{ gap: 1.5, py: 1.5 }}
              >
                <ListIcon sx={{ fontSize: 18, color: colors.brandRed }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {num} / page
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={paginatedFaqs}
        loading={loading}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={pagination.total || faqs.length}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        onRowClick={handleRowClick}
        emptyMessage="No FAQs found"
      />

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            minWidth: 180,
            boxShadow: `0 4px 12px ${colors.shadow}33`,
          },
        }}
      >
        <MenuItem onClick={handleEdit}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Edit
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleDeleteFromMenu} sx={{ color: colors.error }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Delete
          </Typography>
        </MenuItem>
      </Menu>

      {/* FAQ Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            padding: 2,
          },
        }}
      >
        <DialogContent sx={{ padding: 4 }}>
          {selectedFaq && (
            <Box>
              {/* Question Title */}
              <Typography variant="h5" sx={{ fontWeight: 700, color: colors.brandBlack, mb: 3, fontSize: 22 }}>
                {selectedFaq.question}
              </Typography>

              {/* Answer Section */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: colors.brandBlack, mb: 1.5, fontSize: 16 }}>
                  Answer:
                </Typography>
                <Typography variant="body1" sx={{ color: '#4A4A4A', lineHeight: 1.8, fontSize: 15 }}>
                  {selectedFaq.answer}
                </Typography>
              </Box>

              {/* Metadata */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="body2" sx={{ color: '#4A4A4A', mb: 1, fontSize: 14 }}>
                  <strong>Category:</strong> {selectedFaq.category}
                </Typography>
                <Typography variant="body2" sx={{ color: '#4A4A4A', mb: 1, fontSize: 14 }}>
                  <strong>Status:</strong> {selectedFaq.status ? selectedFaq.status.charAt(0).toUpperCase() + selectedFaq.status.slice(1) : 'Published'}
                </Typography>
                {selectedFaq.views && (
                  <Typography variant="body2" sx={{ color: '#4A4A4A', mb: 1, fontSize: 14 }}>
                    <strong>Views:</strong> {selectedFaq.views}
                  </Typography>
                )}
                {selectedFaq.helpful && (
                  <Typography variant="body2" sx={{ color: '#4A4A4A', mb: 1, fontSize: 14 }}>
                    <strong>Helpful:</strong> {selectedFaq.helpful} ({((selectedFaq.helpful / (selectedFaq.views || 1)) * 100).toFixed(1)}%)
                  </Typography>
                )}
                {selectedFaq.createdAt && (
                  <Typography variant="body2" sx={{ color: '#4A4A4A', fontSize: 14 }}>
                    <strong>Created:</strong> {selectedFaq.createdAt}
                  </Typography>
                )}
              </Box>

              {/* Close Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="text"
                  onClick={handleCloseDialog}
                  sx={{
                    color: colors.brandRed,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: 16,
                    '&:hover': {
                      backgroundColor: 'transparent',
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default FaqManagementPage;
