import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    Box,
    Button,
    IconButton,
    TextField,
    Grid,
} from '@mui/material';
import {
    Close,
    VerifiedUser,
    Warning,
    Description,
    CheckCircle,
    Edit,
    Cancel,
    ArticleOutlined,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { colors } from '../../config/theme';

const ResolveLogModal = ({ open, onClose, log, onResolve }) => {
    const isResolved = log && log.status === 'resolved';
    const [notes, setNotes] = useState((log && log.resolutionNotes) || '');

    if (!log) return null;

    const date = log.createdAt instanceof Date ? log.createdAt : new Date(log.createdAt);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    overflow: 'hidden',
                },
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    backgroundColor: isResolved ? '#059669' : colors.brandRed, // Green if resolved, Red if not
                    p: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {isResolved ? <CheckCircle sx={{ color: 'white', fontSize: 24 }} /> : <VerifiedUser sx={{ color: 'white', fontSize: 24 }} />}
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'white' }}>
                            {isResolved ? 'Log Details (Resolved)' : 'Resolve Security Log'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                            {isResolved ? 'Immutable Record' : 'Super Admin Action Required'}
                        </Typography>
                    </Box>
                </Box>
                <IconButton onClick={onClose} sx={{ color: 'white' }}>
                    <Close />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 4 }}>
                {/* Warning Banner - Only for unresolved */}
                {!isResolved && (
                    <Box
                        sx={{
                            backgroundColor: '#FFF8E1', // Amber 50
                            border: '1px solid #FFE0B2', // Amber 200
                            borderRadius: '12px',
                            p: 2,
                            mb: 4,
                            display: 'flex',
                            gap: 2,
                        }}
                    >
                        <Warning sx={{ color: '#F57C00', mt: 0.5 }} /> {/* Orange 700 */}
                        <Box>
                            <Typography sx={{ fontWeight: 700, color: '#F57C00', mb: 0.5 }}>
                                Important
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#BF360C' }}> {/* Deep Orange 900 */}
                                Resolution is permanent and will be recorded in the immutable audit
                                trail. Provide detailed notes for compliance.
                            </Typography>
                        </Box>
                    </Box>
                )}

                {/* Log Summary */}
                <Box
                    sx={{
                        backgroundColor: '#F9FAFB', // Light gray bg
                        borderRadius: '16px',
                        p: 3,
                        mb: 4,
                        border: '1px solid #F3F4F6'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <ArticleOutlined sx={{ color: colors.brandRed, fontSize: 20 }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: 16 }}>
                            Log Summary
                        </Typography>
                    </Box>

                    <Grid container spacing={2}>
                        {[
                            { label: 'Log ID', value: log.id || 'LOG_CRIT_001' },
                            { label: 'Event', value: log.event },
                            { label: 'Severity', value: (log.severity || 'HIGH').toUpperCase() },
                            { label: 'Date', value: format(date, 'MMM dd, yyyy • HH:mm') },
                            { label: 'User', value: log.relatedUsername || 'N/A' },
                            { label: 'Admin', value: log.adminName || 'System' },
                            ...(isResolved ? [{ label: 'Status', value: 'RESOLVED' }] : [])
                        ].map((item, index) => (
                            <React.Fragment key={item.label}>
                                <Grid item xs={12}>
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            py: 1.5,
                                            borderBottom: index !== (isResolved ? 6 : 5) ? `1px solid ${colors.divider}` : 'none',
                                        }}
                                    >
                                        <Typography sx={{ color: colors.textSecondary, fontWeight: 500, width: '120px', fontSize: 15 }}>
                                            {item.label}
                                        </Typography>
                                        <Typography sx={{ fontWeight: 600, color: colors.brandBlack, flex: 1, fontSize: 15 }}>
                                            {item.value}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </React.Fragment>
                        ))}
                    </Grid>
                </Box>

                {/* Resolution Notes */}
                <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Edit sx={{ color: colors.brandRed, fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 700, fontSize: 16 }}>
                            {isResolved ? 'Resolution Notes (Immutable)' : 'Resolution Notes'}
                        </Typography>
                        {!isResolved && <Typography sx={{ color: colors.brandRed, fontWeight: 700 }}>*</Typography>}
                    </Box>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder={isResolved ? 'No notes provided.' : "Explain how this log was resolved, what actions were taken, and any..."}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isResolved}
                        sx={{
                            backgroundColor: isResolved ? '#F3F4F6' : '#FAFAFA',
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                            }
                        }}
                    />
                </Box>
            </DialogContent>

            {/* Footer */}
            <DialogActions sx={{ p: 4, pt: 0, justifyContent: isResolved ? 'flex-end' : 'space-between', gap: 2 }}>
                <Button
                    fullWidth={!isResolved}
                    variant="contained"
                    onClick={onClose}
                    sx={{
                        backgroundColor: '#6B7280', // Slate 500
                        color: 'white',
                        py: 1.5,
                        fontSize: 16,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: '12px',
                        '&:hover': { backgroundColor: '#4B5563' },
                        ...(isResolved && { width: 'auto', px: 4 })
                    }}
                    startIcon={isResolved ? null : <Cancel sx={{ fontSize: 20 }} />}
                >
                    {isResolved ? 'Close' : 'Cancel'}
                </Button>
                {!isResolved && (
                    <Button
                        fullWidth
                        variant="contained"
                        onClick={() => onResolve(log, notes)}
                        disabled={!notes.trim()}
                        sx={{
                            backgroundColor: '#4CAF50', // Vibrant Green
                            color: 'white',
                            py: 1.5,
                            fontSize: 16,
                            fontWeight: 600,
                            textTransform: 'none',
                            borderRadius: '12px',
                            '&:hover': { backgroundColor: '#059669' },
                            '&:disabled': {
                                backgroundColor: '#E5E7EB',
                                color: '#9CA3AF',
                            }
                        }}
                        startIcon={<CheckCircle sx={{ fontSize: 20 }} />}
                    >
                        Resolve Log
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ResolveLogModal;
