


// Static initial data
const initialRewards = [
    {
        id: '1',
        userId: 'USR_1001',
        rank: 1,
        username: 'ChiefPredictor',
        userEmail: 'chief@example.com',
        spTotal: 2850,
        usdAmount: 500,
        payoutMethod: 'USDT',
        kycVerified: true,
        kycStatus: 'verified',
        status: 'processing',
        rewardMonth: '2025-09',
        rewardType: 'Monthly SP Rewards',
        walletAddress: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        payoutGateway: 'Fireblocks',
        risk: false,
        riskBadges: [],
        claimDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        claimSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        kycSubmittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        kycVerifiedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        kycVerifiedBy: 'Admin_001',
        riskLevel: 'none',
        consentOptIn: true,
        consentSource: 'Reward Claim Flow',
        consentTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        adminNotes: 'User is a consistent top performer.',
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'User Claimed Reward', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' },
            { id: 3, action: 'KYC Verified', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'Admin_001' }
        ]
    },
    {
        id: '2',
        userId: 'USR_1002',
        rank: 2,
        username: 'KingOfPredictions',
        userEmail: 'king@example.com',
        spTotal: 2780,
        usdAmount: 300,
        payoutMethod: 'Gift Card',
        giftCardPlatform: 'Amazon',
        giftCardRegion: 'US',
        kycVerified: false,
        kycStatus: 'under_review',
        status: 'pending',
        rewardMonth: '2025-09',
        rewardType: 'Monthly SP Rewards',
        risk: false,
        riskLevel: 'none',
        claimDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        claimSubmittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        kycSubmittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        consentOptIn: false,
        consentSource: 'Reward Claim Flow',
        adminNotes: '',
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'User Claimed Reward', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' },
            { id: 3, action: 'KYC Submitted', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' }
        ]
    },
    {
        id: '3',
        userId: 'USR_1003',
        rank: 3,
        username: 'AfricanLegend',
        userEmail: 'legend@example.com',
        spTotal: 2650,
        usdAmount: 150,
        payoutMethod: 'USDT',
        walletAddress: '0x82D7656EC7ab88b098defB751B7401B5f6d8923A',
        payoutGateway: 'Fireblocks',
        kycVerified: false,
        kycStatus: 'under_review',
        status: 'pending',
        rewardMonth: '2025-09',
        risk: false,
        riskLevel: 'low',
        claimDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        claimSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        kycSubmittedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        consentOptIn: true,
        consentSource: 'Reward Claim Flow',
        consentTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        adminNotes: '',
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'User Claimed Reward', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' }
        ]
    },
    {
        id: '4',
        userId: 'USR_1004',
        rank: 4,
        username: 'GhostUser',
        userEmail: 'ghost@example.com',
        spTotal: 2500,
        usdAmount: 100,
        payoutMethod: 'USDT',
        kycVerified: false,
        kycStatus: 'not_submitted',
        status: 'unclaimed',
        rewardMonth: '2025-09',
        risk: false,
        riskLevel: 'none',
        claimDeadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        consentOptIn: false,
        adminNotes: 'User did not claim within 7-day window.',
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'Claim Window Expired', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' }
        ]
    },
    {
        id: '5',
        userId: 'USR_1005',
        rank: 5,
        username: 'RiskyPlayer',
        userEmail: 'risk@example.com',
        spTotal: 2400,
        usdAmount: 80,
        payoutMethod: 'USDT',
        walletAddress: '0x92D7656EC7ab88b098defB751B7401B5f6d8456B',
        kycVerified: false,
        kycStatus: 'rejected',
        status: 'pending',
        risk: true,
        rewardMonth: '2025-09',
        riskLevel: 'high',
        riskBadges: ['Suspicious Activity', 'Document Mismatch'],
        riskReason: 'Multiple accounts detected with similar betting patterns and document inconsistencies',
        consentOptIn: true,
        adminNotes: 'Suspicious betting patterns detected.',
        claimDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        claimSubmittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        kycSubmittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'User Claimed Reward', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' },
            { id: 3, action: 'KYC Submitted', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' },
            { id: 4, action: 'Risk Flagged', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' }
        ]
    },
    {
        id: '6',
        userId: 'USR_1006',
        rank: 1,
        username: 'WinnerPaidOut',
        userEmail: 'winner@example.com',
        spTotal: 3100,
        usdAmount: 500,
        payoutMethod: 'USDT',
        kycVerified: true,
        kycStatus: 'verified',
        status: 'paid',
        rewardMonth: '2025-08',
        risk: false,
        claimDeadline: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        claimSubmittedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        kycSubmittedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        kycVerifiedAt: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(),
        kycVerifiedBy: 'Admin_002',
        riskLevel: 'none',
        consentOptIn: true,
        consentTimestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        adminNotes: 'Payment processed successfully.',
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'User Claimed Reward', timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' },
            { id: 3, action: 'KYC Verified', timestamp: new Date(Date.now() - 38 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'Admin_002' },
            { id: 4, action: 'Reward Paid', timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'Admin_002' }
        ]
    },
    {
        id: '7',
        userId: 'USR_1007',
        rank: 2,
        username: 'DeclinedUser',
        userEmail: 'declined@example.com',
        spTotal: 2900,
        usdAmount: 300,
        payoutMethod: 'Gift Card',
        kycVerified: false,
        kycStatus: 'rejected',
        status: 'cancelled',
        rewardMonth: '2025-08',
        risk: true,
        riskLevel: 'high',
        claimDeadline: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        claimSubmittedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        kycSubmittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        kycVerifiedBy: 'Admin_001',
        consentOptIn: false,
        declineReason: 'KYC verification failed due to invalid documents. Please resubmit valid government-issued ID for verification.',
        adminNotes: 'Multiple failed KYC attempts. User flagged for review.',
        events: [
            { id: 1, action: 'Reward Generated', timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'System' },
            { id: 2, action: 'User Claimed Reward', timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'User' },
            { id: 3, action: 'KYC Rejected', timestamp: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'Admin_001' },
            { id: 4, action: 'Reward Declined', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), triggeredBy: 'Admin_001' }
        ]
    },
];

// In-memory store
let rewardsStore = [...initialRewards];
let userKycStore = {
    // Stores KYC data per user ID (using simplistic mapping for now)
    '1': { status: 'verified', submittedAt: new Date(Date.now() - 5 * 86400000).toISOString(), verifiedAt: new Date(Date.now() - 4 * 86400000).toISOString(), verifiedBy: 'Admin_001', riskLevel: 'none', notes: 'All documents clear.' },
    'user-123': { status: 'pending', submittedAt: new Date().toISOString(), riskLevel: 'medium', notes: 'Check IP address.' }
};

export const MockDataService = {
    // Rewards
    getRewards: async () => {
        return [...rewardsStore];
    },

    getRewardById: async (id) => {
        return rewardsStore.find(r => r.id === id);
    },

    updateReward: async (id, updates) => {
        const index = rewardsStore.findIndex(r => r.id === id);
        if (index !== -1) {
            rewardsStore[index] = { ...rewardsStore[index], ...updates };
            return rewardsStore[index];
        }
        return null;
    },

    addRewardEvent: async (id, event) => {
        const reward = rewardsStore.find(r => r.id === id);
        if (reward) {
            const events = reward.events || [];
            const newEvents = [event, ...events];
            reward.events = newEvents;
            return reward;
        }
        return null;
    },

    // KYC
    getKycData: async (userId) => {
        return userKycStore[userId] || { status: 'not_submitted', riskLevel: 'none', notes: '' };
    },

    updateKycData: async (userId, data) => {
        userKycStore[userId] = { ...(userKycStore[userId] || {}), ...data };
        return userKycStore[userId];
    }
};
