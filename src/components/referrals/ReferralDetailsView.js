import React from 'react';
import { Box, Typography, Card, Grid, Button, IconButton, Divider, Chip } from '@mui/material';
import {
    ArrowBack,
    Flag,
    InfoOutlined,
    CardGiftcard,
    CheckCircle,
    CalendarToday,
    AccessTime,
    Person,
    Description,
    PersonOutline,
    Star,
} from '@mui/icons-material';
import { colors } from '../../config/theme';
import { format } from 'date-fns';

const InfoCard = ({ icon, title, children }) => (
    <Card
        sx={{
            p: 3,
            borderRadius: '16px',
            boxShadow: 'none',
            border: `1px solid ${colors.divider}`,
            height: '100%',
        }}
    >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Box
                sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.brandBlack,
                }}
            >
                {icon}
            </Box>
            <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 700 }}>
                {title}
            </Typography>
        </Box>
        {children}
    </Card>
);

const DetailRow = ({ label, value, isLink, color }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: 14 }}>
            {label}
        </Typography>
        <Typography
            variant="body2"
            sx={{
                fontWeight: 600,
                fontSize: 14,
                color: color || colors.brandBlack,
                cursor: isLink ? 'pointer' : 'default',
            }}
        >
            {value}
        </Typography>
    </Box>
);

const ReferralDetailsView = ({ referral, onBack, referrerStats }) => {
    if (!referral) return null;

    const date = referral.referralDate instanceof Date ? referral.referralDate : new Date(referral.referralDate);
    const formattedDate = format(date, 'MMM dd, yyyy');
    const formattedTime = format(date, 'HH:mm');

    // Default stats if not provided
    const stats = referrerStats || {
        totalReferrals: 0,
        monthlyReferrals: 0,
        totalCP: 0,
        monthlyCP: 0
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
            <style>
                {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
            </style>

            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={onBack} sx={{ backgroundColor: '#F5F5F5', '&:hover': { backgroundColor: '#E0E0E0' } }}>
                        <ArrowBack sx={{ fontSize: 20 }} />
                    </IconButton>
                    <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 20 }}>
                        Referral: REF_{referral.id.padStart(3, '0')}
                    </Typography>
                </Box>
                <Button
                    startIcon={<Flag sx={{ fontSize: 18 }} />}
                    sx={{
                        color: colors.warning,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { backgroundColor: '#FFF3E0' },
                    }}
                >
                    Flag for Review
                </Button>
            </Box>

            {/* Info Banner */}
            <Box
                sx={{
                    backgroundColor: '#E3F2FD',
                    border: '1px solid #BBDEFB',
                    borderRadius: '12px',
                    p: 2,
                    display: 'flex',
                    gap: 2,
                    mb: 4,
                }}
            >
                <InfoOutlined sx={{ color: '#1976D2', mt: 0.5 }} />
                <Box>
                    <Typography sx={{ fontWeight: 700, color: '#1976D2', fontSize: 14, mb: 0.5 }}>
                        Immutable Record
                    </Typography>
                    <Typography sx={{ fontSize: 13, color: '#0D47A1' }}>
                        CP values and referral records cannot be edited. You may flag referrals for review.
                    </Typography>
                </Box>
            </Box>

            {/* Stats Ribbon */}
            <Card
                sx={{
                    borderRadius: '16px',
                    boxShadow: 'none',
                    border: `1px solid ${colors.divider}`,
                    p: 4,
                    mb: 4,
                }}
            >
                <Grid container alignItems="center">
                    <Grid item xs={3} sx={{ textAlign: 'center', borderRight: `1px solid ${colors.divider}` }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <CardGiftcard sx={{ color: colors.textSecondary, fontSize: 24 }} />
                            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>CP Awarded</Typography>
                            <Typography sx={{ fontSize: 20, fontWeight: 700, color: colors.brandRed }}>{(referral.cpAwarded || 0)} CP</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={3} sx={{ textAlign: 'center', borderRight: `1px solid ${colors.divider}` }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <CheckCircle sx={{ color: colors.textSecondary, fontSize: 24 }} />
                            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Status</Typography>
                            <Typography sx={{ fontSize: 20, fontWeight: 700, color: colors.success }}>Valid</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={3} sx={{ textAlign: 'center', borderRight: `1px solid ${colors.divider}` }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ color: colors.textSecondary, fontSize: 24 }} />
                            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Referral Date</Typography>
                            <Typography sx={{ fontSize: 20, fontWeight: 700, color: colors.brandBlack }}>{formattedDate}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={3} sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                            <AccessTime sx={{ color: colors.textSecondary, fontSize: 24 }} />
                            <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>Referral Time</Typography>
                            <Typography sx={{ fontSize: 20, fontWeight: 700, color: colors.brandBlack }}>{formattedTime}</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Card>

            {/* Info Cards Row */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <InfoCard
                        icon={<PersonOutline sx={{ color: '#4CAF50' }} />}
                        title="Referrer Information"
                    >
                        <DetailRow label="User ID" value={referral.referrerId || "USR_1003"} />
                        <DetailRow label="Username" value={referral.referrerUsername} />
                        <DetailRow label="Email" value={referral.referrerEmail || "referrer@example.com"} />
                        <DetailRow label="Country" value={referral.referrerCountry || "N/A"} />
                        <Box sx={{ mt: 3 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<PersonOutline />}
                                sx={{ borderRadius: '20px', textTransform: 'none' }}
                            >
                                View Referrer Profile
                            </Button>
                        </Box>
                    </InfoCard>
                </Grid>
                <Grid item xs={12} md={6}>
                    <InfoCard
                        icon={<PersonOutline sx={{ color: '#2196F3' }} />}
                        title="Referred User Information"
                    >
                        <DetailRow label="User ID" value={referral.referredId || "USR_2015"} />
                        <DetailRow label="Username" value={referral.referredUsername} />
                        <DetailRow label="Email" value={referral.referredEmail} />
                        <DetailRow label="Country" value={referral.referredCountry} />
                        <Box sx={{ mt: 3 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                color="error"
                                startIcon={<PersonOutline />}
                                sx={{ borderRadius: '20px', textTransform: 'none' }}
                            >
                                View Referred User Profile
                            </Button>
                        </Box>
                    </InfoCard>
                </Grid>
            </Grid>

            {/* Details Card */}
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <InfoCard
                        icon={<Description sx={{ color: '#9C27B0' }} />}
                        title="Referral Details"
                    >
                        <DetailRow label="Referral ID" value={`REF_${referral.id.padStart(3, '0')}`} />
                        <DetailRow label="Referral Date" value={formattedDate} />
                        <DetailRow label="Referral Time" value={formattedTime + ':00'} />
                        <DetailRow label="Source" value={referral.source || 'Invite Link'} />
                        <DetailRow label="CP Awarded" value={(referral.cpAwarded || 0) + " CP"} color={colors.brandRed} />
                        <DetailRow label="Status" value={referral.status ? referral.status.toUpperCase() : 'VALID'} color={referral.status === 'valid' ? colors.success : colors.error} />
                        {(referral.statusReason || referral.riskReason) && (
                            <DetailRow
                                label="Status Reason"
                                value={referral.statusReason || referral.riskReason}
                                color={colors.error}
                            />
                        )}
                    </InfoCard>
                </Grid>
                <Grid item xs={12} md={6}>
                    <InfoCard
                        icon={<Star sx={{ color: '#FFC107' }} />}
                        title="Referrer Performance Summary"
                    >
                        <DetailRow label="Total Referrals (Lifetime)" value={stats.totalReferrals} />
                        <DetailRow label="Referrals this Month" value={stats.monthlyReferrals} />
                        <DetailRow label="Total CP Earned" value={`${stats.totalCP} CP`} />
                        <DetailRow label="CP Earned (Month)" value={`${stats.monthlyCP} CP`} />
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: '#FFFBEB', borderRadius: '8px' }}>
                            <Typography variant="caption" sx={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <InfoOutlined fontSize="small" />
                                Current Referrer Performance
                            </Typography>
                        </Box>
                    </InfoCard>
                </Grid>
            </Grid>

        </Box>
    );
};

export default ReferralDetailsView;
