// backend/src/routes/competition.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import CompetitionConfig from '../models/CompetitionConfig.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// HELPER - Admin Check
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.userType !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin access required' });
        }
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Authorization failed' });
    }
};

// Create axios instance for GTC FX API calls
const gtcAxios = axios.create({
    baseURL: process.env.GTCFX_API_URL || 'https://apiv1.gtctrader100.top',
    timeout: 45000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
    })
});

// Add response interceptor for better error handling
gtcAxios.interceptors.response.use(
    response => response,
    error => {
        console.error('GTC FX API Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url
        });
        return Promise.reject(error);
    }
);

// CENTRALIZED COMPETITION CONFIGURATION - SIMPLIFIED
let COMPETITION_CONFIG = {
    period: {
        active: true,
        startDate: new Date('2025-01-01T00:00:00Z'),
        endDate: new Date('2025-12-31T23:59:59Z'),
        description: 'Trading Championship'
    },
    rules: {
        directReferralsWeight: 30,
        teamSizeWeight: 20,
        tradingVolumeWeight: 25,
        profitabilityWeight: 15,
        accountBalanceWeight: 10
    },
    bonusMultipliers: {
        kycVerified: 1.1
    },
    prizes: [
        {
            rankRange: '1st',
            minRank: 1,
            maxRank: 1,
            title: 'Champion',
            prize: 'Moscow Russia Trip',
            prizeValue: 10000,
            description: 'Lifetime VIP + exclusive training',
            color: 'amber',
            icon: 'Trophy'
        },
        {
            rankRange: '2nd',
            minRank: 2,
            maxRank: 2,
            title: 'Grand Master',
            prize: '$5,000 Cash',
            prizeValue: 5000,
            description: 'Gold Benefits + premium features',
            color: 'slate',
            icon: 'Trophy'
        },
        {
            rankRange: '3rd',
            minRank: 3,
            maxRank: 3,
            title: 'Master',
            prize: '$5,000 Cash',
            prizeValue: 5000,
            description: 'Gold Benefits + priority support',
            color: 'orange',
            icon: 'Trophy'
        },
        {
            rankRange: '4th',
            minRank: 4,
            maxRank: 4,
            title: 'Elite Platinum',
            prize: '$2,500 Cash',
            prizeValue: 2500,
            description: 'Silver Benefits + trading tools',
            color: 'cyan',
            icon: 'Medal'
        },
        {
            rankRange: '5th-10th',
            minRank: 5,
            maxRank: 10,
            title: 'Top Performers',
            prize: '$1,000 Cash',
            prizeValue: 1000,
            description: 'Bronze Benefits + recognition',
            color: 'blue',
            icon: 'Medal'
        },
        {
            rankRange: '11th-25th',
            minRank: 11,
            maxRank: 25,
            title: 'Rising Stars',
            prize: '$500 Credit',
            prizeValue: 500,
            description: 'Special badges + spotlight',
            color: 'gray',
            icon: 'Award'
        }
    ],
    ui: {
        competitionTitle: 'Trading Championship 2025',
        heroDescription: 'Compete for amazing prizes and showcase your trading skills',
        leaderboardLimit: 100,
        topDisplayCount: 50,
        refreshInterval: 300000,
        rulesModal: {
            title: 'Competition Rules',
            subtitle: 'Everything you need to know',
            rules: [
                {
                    title: 'Relative Ranking System',
                    description: 'Rankings are determined by your total score compared to all participants. Only one person can hold each rank position.',
                    icon: 'Target'
                },
                {
                    title: 'Competition Period',
                    description: 'Competition runs from Jan 1, 2025 to Dec 31, 2025. Final rankings will be determined at 11:59 PM on the last day.',
                    icon: 'Clock'
                },
                {
                    title: 'One Prize Per Participant',
                    description: 'You will receive ONE prize based on your final rank at the end of the competition. Higher ranks win better prizes!',
                    icon: 'Gift'
                },
                {
                    title: 'Score Calculation',
                    description: 'Your score is calculated from 5 different metrics with weighted contributions. See breakdown below for details.',
                    icon: 'BarChart3'
                }
            ],
            proTips: [
                'Complete KYC verification to unlock a 10% bonus multiplier',
                'Rankings update in real-time based on all participant activities',
                'Only your final rank at 11:59 PM on Dec 31, 2025 determines your prize',
                'Focus on metrics with higher weights for maximum score impact'
            ]
        },
        metricConfig: [
            { key: 'directReferrals', name: 'Direct Referrals', icon: 'Users', color: 'orange', unit: 'referrals', format: 'number' },
            { key: 'tradingVolume', name: 'Trading Volume', icon: 'DollarSign', color: 'blue', unit: 'USD', format: 'currency' },
            { key: 'teamSize', name: 'Team Size', icon: 'Users', color: 'green', unit: 'members', format: 'number' },
            { key: 'profitability', name: 'Profitability', icon: 'TrendingUp', color: 'purple', unit: 'win rate', format: 'percentage' },
            { key: 'accountBalance', name: 'Account Balance', icon: 'DollarSign', color: 'indigo', unit: 'USD', format: 'currency' },
            { key: 'kycCompletion', name: 'KYC Verification', icon: 'CheckCircle', color: 'pink', unit: 'verified', format: 'boolean' }
        ],
        rankColors: {
            '1': { bg: 'amber', text: 'amber', icon: 'Trophy' },
            '2': { bg: 'slate', text: 'slate', icon: 'Trophy' },
            '3': { bg: 'orange', text: 'orange', icon: 'Trophy' },
            '4': { bg: 'cyan', text: 'cyan', icon: 'Medal' },
            '5-10': { bg: 'blue', text: 'blue', icon: 'Medal' },
            'default': { bg: 'gray', text: 'gray', icon: 'Award' }
        }
    }
};

// Load config from database on startup
(async () => {
    try {
        const savedConfig = await CompetitionConfig.findOne({ isActive: true }).sort({ createdAt: -1 });
        if (savedConfig) {
            COMPETITION_CONFIG = {
                period: savedConfig.period,
                rules: savedConfig.rules,
                bonusMultipliers: savedConfig.bonusMultipliers,
                prizes: savedConfig.prizes,
                ui: savedConfig.ui
            };
            console.log('Competition config loaded from database');
        }
    } catch (error) {
        console.error('Failed to load competition config from database:', error.message);
    }
})();

// Fetch comprehensive GTC FX data for a user
async function fetchComprehensiveGTCData(user) {
    try {
        if (!user.gtcfx?.accessToken) return null;

        const authHeader = { Authorization: `Bearer ${user.gtcfx.accessToken}` };

        // Fetch account info
        const accountResponse = await gtcAxios.post('/api/v3/account/info', {}, { headers: authHeader });
        if (accountResponse.data.code !== 200) {
            console.warn(`Failed to fetch GTC account for user ${user.username}`);
            return null;
        }
        const accountData = accountResponse.data.data;

        // Fetch profit logs
        let profitLogs = [];
        try {
            const profitResponse = await gtcAxios.post('/api/v3/share/profitlog', { page: 1, pagesize: 100 }, { headers: authHeader });
            if (profitResponse.data.code === 200) {
                profitLogs = profitResponse.data.data?.list || [];
            }
        } catch (err) {
            console.warn('Could not fetch profit logs:', err.message);
        }

        // Fetch member data
        let memberData = null;
        try {
            const memberResponse = await gtcAxios.post('/api/v3/agent/member', { page: 1, pagesize: 10 }, { headers: authHeader });
            if (memberResponse.data.code === 200) {
                memberData = memberResponse.data.data;
            }
        } catch (err) {
            console.warn('Could not fetch member data:', err.message);
        }

        // Calculate metrics
        const totalProfit = parseFloat(accountData.totalprofit || 0);
        const totalLoss = parseFloat(accountData.totalloss || 0);
        const balance = parseFloat(accountData.amount || 0);
        const netProfit = totalProfit - totalLoss;
        const winRate = (totalProfit + totalLoss) > 0 ? (totalProfit / (totalProfit + totalLoss)) * 100 : 0;

        let totalVolumeLots = 0;
        profitLogs.forEach(log => {
            totalVolumeLots += parseFloat(log.volume || 0);
        });

        const gtcTeamSize = memberData?.total || 0;
        const gtcDirectMembers = memberData?.list?.filter(m => m.level === 1).length || 0;

        return {
            accountBalance: balance,
            totalProfit: totalProfit,
            totalLoss: totalLoss,
            netProfit: netProfit,
            winRate: winRate,
            totalVolumeLots: totalVolumeLots,
            totalTrades: profitLogs.length,
            kycStatus: parseInt(accountData.kycstatus || 0),
            gtcTeamSize: gtcTeamSize,
            gtcDirectMembers: gtcDirectMembers
        };
    } catch (error) {
        console.error('Error fetching comprehensive GTC data:', error.message);
        return null;
    }
}

// Calculate competition score - SIMPLIFIED
async function calculateEnhancedCompetitionScore(user, gtcData) {
    const { rules, bonusMultipliers } = COMPETITION_CONFIG;

    let scores = {
        directReferrals: 0,
        teamSize: 0,
        tradingVolume: 0,
        profitability: 0,
        accountBalance: 0
    };

    let bonusMultiplier = 1.0;

    // Direct Referrals - using log scale for better distribution
    const directReferrals = user.referralDetails?.totalDirectReferrals || 0;
    const directReferralsScore = Math.log10(directReferrals + 1) / Math.log10(151); // log scale to 150
    scores.directReferrals = directReferralsScore * rules.directReferralsWeight;

    // Team Size - using log scale
    const nupipsTeamSize = user.referralDetails?.totalDownlineUsers || 0;
    const gtcTeamSize = gtcData?.gtcTeamSize || 0;
    const totalTeamSize = Math.max(nupipsTeamSize, gtcTeamSize);
    const teamSizeScore = Math.log10(totalTeamSize + 1) / Math.log10(501); // log scale to 500
    scores.teamSize = teamSizeScore * rules.teamSizeWeight;

    // Trading Volume - using log scale
    const tradingVolume = gtcData?.totalVolumeLots || 0;
    const volumeInDollars = tradingVolume * 100000;
    const volumeScore = Math.log10(volumeInDollars + 1) / Math.log10(2000001); // log scale to 2M
    scores.tradingVolume = volumeScore * rules.tradingVolumeWeight;

    // Profitability
    const winRate = gtcData?.winRate || 0;
    const profitabilityScore = winRate / 100;
    scores.profitability = profitabilityScore * rules.profitabilityWeight;

    // Account Balance - using log scale
    const accountBalance = gtcData?.accountBalance || 0;
    const balanceScore = Math.log10(accountBalance + 1) / Math.log10(100001); // log scale to 100k
    scores.accountBalance = balanceScore * rules.accountBalanceWeight;

    // KYC Completion
    const isKYCVerified = gtcData?.kycStatus === 1;
    if (isKYCVerified) bonusMultiplier *= bonusMultipliers.kycVerified;

    const baseScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const totalScore = baseScore * bonusMultiplier;

    return {
        totalScore: parseFloat(totalScore.toFixed(2)),
        baseScore: parseFloat(baseScore.toFixed(2)),
        bonusMultiplier: parseFloat(bonusMultiplier.toFixed(2)),
        breakdown: {
            directReferralsScore: parseFloat(scores.directReferrals.toFixed(2)),
            teamSizeScore: parseFloat(scores.teamSize.toFixed(2)),
            tradingVolumeScore: parseFloat(scores.tradingVolume.toFixed(2)),
            profitabilityScore: parseFloat(scores.profitability.toFixed(2)),
            accountBalanceScore: parseFloat(scores.accountBalance.toFixed(2))
        },
        progressPercentages: {
            directReferrals: parseFloat((directReferralsScore * 100).toFixed(1)),
            teamSize: parseFloat((teamSizeScore * 100).toFixed(1)),
            tradingVolume: parseFloat((volumeScore * 100).toFixed(1)),
            profitability: parseFloat((profitabilityScore * 100).toFixed(1)),
            accountBalance: parseFloat((balanceScore * 100).toFixed(1)),
            kycCompletion: isKYCVerified ? 100 : 0
        },
        metrics: {
            directReferrals,
            nupipsTeamSize,
            gtcTeamSize: gtcData?.gtcTeamSize || 0,
            tradingVolumeLots: parseFloat((gtcData?.totalVolumeLots || 0).toFixed(2)),
            tradingVolumeDollars: parseFloat(volumeInDollars.toFixed(2)),
            winRate: parseFloat((gtcData?.winRate || 0).toFixed(2)),
            accountBalance: parseFloat((gtcData?.accountBalance || 0).toFixed(2)),
            totalTrades: gtcData?.totalTrades || 0,
            isKYCVerified
        }
    };
}

// Generate improvement suggestions
function generateImprovementSuggestions(userRank, nextRankUser) {
    if (!userRank || !nextRankUser) return null;

    const scoreDiff = nextRankUser.score - userRank.score;
    const improvements = [];

    if (userRank.metrics.directReferrals < nextRankUser.metrics.directReferrals) {
        const diff = nextRankUser.metrics.directReferrals - userRank.metrics.directReferrals;
        improvements.push({
            area: 'Direct Referrals',
            icon: 'Users',
            priority: 'high',
            action: `Refer ${diff} more member${diff !== 1 ? 's' : ''} to catch up`,
            impact: userRank.breakdown.directReferralsScore < nextRankUser.breakdown.directReferralsScore
                ? (nextRankUser.breakdown.directReferralsScore - userRank.breakdown.directReferralsScore).toFixed(1)
                : '0'
        });
    }

    if (userRank.metrics.tradingVolumeDollars < nextRankUser.metrics.tradingVolumeDollars) {
        const diff = nextRankUser.metrics.tradingVolumeDollars - userRank.metrics.tradingVolumeDollars;
        improvements.push({
            area: 'Trading Volume',
            icon: 'DollarSign',
            priority: 'high',
            action: `Increase trading by $${diff.toLocaleString()}`,
            impact: userRank.breakdown.tradingVolumeScore < nextRankUser.breakdown.tradingVolumeScore
                ? (nextRankUser.breakdown.tradingVolumeScore - userRank.breakdown.tradingVolumeScore).toFixed(1)
                : '0'
        });
    }

    if (userRank.metrics.nupipsTeamSize < nextRankUser.metrics.nupipsTeamSize) {
        const diff = nextRankUser.metrics.nupipsTeamSize - userRank.metrics.nupipsTeamSize;
        improvements.push({
            area: 'Team Growth',
            icon: 'Users',
            priority: 'medium',
            action: `Grow team by ${diff} member${diff !== 1 ? 's' : ''}`,
            impact: userRank.breakdown.teamSizeScore < nextRankUser.breakdown.teamSizeScore
                ? (nextRankUser.breakdown.teamSizeScore - userRank.breakdown.teamSizeScore).toFixed(1)
                : '0'
        });
    }

    if (userRank.metrics.winRate < nextRankUser.metrics.winRate) {
        improvements.push({
            area: 'Win Rate',
            icon: 'TrendingUp',
            priority: 'medium',
            action: `Improve win rate by ${(nextRankUser.metrics.winRate - userRank.metrics.winRate).toFixed(1)}%`,
            impact: userRank.breakdown.profitabilityScore < nextRankUser.breakdown.profitabilityScore
                ? (nextRankUser.breakdown.profitabilityScore - userRank.breakdown.profitabilityScore).toFixed(1)
                : '0'
        });
    }

    if (!userRank.metrics.isKYCVerified) {
        improvements.push({
            area: 'KYC Verification',
            icon: 'CheckCircle',
            priority: 'critical',
            action: 'Complete KYC for instant 10% score boost',
            impact: (userRank.totalScore * 0.1).toFixed(1)
        });
    }

    improvements.sort((a, b) => parseFloat(b.impact) - parseFloat(a.impact));

    return {
        scoreDifference: parseFloat(scoreDiff.toFixed(2)),
        topImprovements: improvements.slice(0, 3),
        allImprovements: improvements
    };
}

// Get reward for rank
function getRewardForRank(rank) {
    const reward = COMPETITION_CONFIG.prizes.find(r => rank >= r.minRank && rank <= r.maxRank);
    return reward || null;
}

// ========== PUBLIC ROUTES ==========

// GET /competition/leaderboard
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const limit = COMPETITION_CONFIG.ui.leaderboardLimit || req.query.limit || 100;

        const users = await User.find({
            'gtcfx.accessToken': { $ne: null }
        })
            .select('name username email gtcfx referralDetails tradingStats userType')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                leaderboard: [],
                userRank: null,
                config: COMPETITION_CONFIG,
                stats: { totalParticipants: 0 }
            });
        }

        const scorePromises = users.map(async (user) => {
            try {
                const gtcData = await fetchComprehensiveGTCData(user);
                if (!gtcData) return null;

                const scoreData = await calculateEnhancedCompetitionScore(user, gtcData);

                return {
                    userId: user._id.toString(),
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    userType: user.userType,
                    score: scoreData.totalScore,
                    baseScore: scoreData.baseScore,
                    bonusMultiplier: scoreData.bonusMultiplier,
                    breakdown: scoreData.breakdown,
                    progressPercentages: scoreData.progressPercentages,
                    metrics: scoreData.metrics,
                    isVerified: scoreData.metrics.isKYCVerified
                };
            } catch (error) {
                console.error(`Error processing user ${user.username}:`, error.message);
                return null;
            }
        });

        const scoredUsersResults = await Promise.all(scorePromises);
        const scoredUsers = scoredUsersResults.filter(u => u !== null);

        scoredUsers.sort((a, b) => b.score - a.score);

        let currentRank = 1;
        const leaderboard = scoredUsers.map((user, index) => {
            if (index > 0 && user.score < scoredUsers[index - 1].score) {
                currentRank = index + 1;
            }
            return { ...user, rank: currentRank };
        });

        const limitedLeaderboard = leaderboard.slice(0, parseInt(limit));

        const userRankIndex = leaderboard.findIndex(u => u.userId === currentUserId);
        let userRank = userRankIndex >= 0 ? leaderboard[userRankIndex] : null;
        let improvementSuggestions = null;

        if (userRank && userRankIndex > 0) {
            const nextRankUser = leaderboard[userRankIndex - 1];
            improvementSuggestions = generateImprovementSuggestions(userRank, nextRankUser);
        }

        if (userRank) {
            userRank = {
                ...userRank,
                eligibleReward: getRewardForRank(userRank.rank),
                improvementSuggestions
            };
        }

        const stats = {
            totalParticipants: leaderboard.length,
            averageScore: parseFloat((leaderboard.reduce((sum, u) => sum + u.score, 0) / leaderboard.length).toFixed(2)),
            highestScore: leaderboard[0]?.score || 0,
            kycVerifiedCount: leaderboard.filter(u => u.isVerified).length
        };

        res.json({
            success: true,
            leaderboard: limitedLeaderboard,
            userRank,
            config: COMPETITION_CONFIG,
            stats
        });
    } catch (error) {
        console.error('Competition leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition data',
            error: error.message
        });
    }
});

// ========== ADMIN ROUTES ==========

// GET /competition/admin/config
router.get('/admin/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        res.json({
            success: true,
            config: COMPETITION_CONFIG
        });
    } catch (error) {
        console.error('Get admin config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch configuration',
            error: error.message
        });
    }
});

// PUT /competition/admin/config
router.put('/admin/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { period, rules, bonusMultipliers, prizes, ui } = req.body;

        // Validate weights total to 100%
        if (rules) {
            const totalWeight = Object.values(rules).reduce((sum, weight) => sum + weight, 0);
            if (Math.abs(totalWeight - 100) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: `Total weight must equal 100%. Current total: ${totalWeight.toFixed(2)}%`
                });
            }
        }

        // Update in-memory config
        if (period) {
            COMPETITION_CONFIG.period = {
                ...COMPETITION_CONFIG.period,
                ...period,
                startDate: new Date(period.startDate),
                endDate: new Date(period.endDate)
            };
        }

        if (rules) {
            Object.keys(rules).forEach(key => {
                COMPETITION_CONFIG.rules[key] = rules[key];
            });
        }

        if (bonusMultipliers) {
            Object.keys(bonusMultipliers).forEach(key => {
                COMPETITION_CONFIG.bonusMultipliers[key] = bonusMultipliers[key];
            });
        }

        if (prizes) COMPETITION_CONFIG.prizes = prizes;
        if (ui) COMPETITION_CONFIG.ui = { ...COMPETITION_CONFIG.ui, ...ui };

        // Save to database
        const configDoc = new CompetitionConfig({
            ...COMPETITION_CONFIG,
            isActive: true,
            lastModifiedBy: req.user.userId
        });

        await CompetitionConfig.updateMany({}, { isActive: false });
        await configDoc.save();

        res.json({
            success: true,
            message: 'Configuration updated successfully',
            config: COMPETITION_CONFIG
        });
    } catch (error) {
        console.error('Update admin config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update configuration',
            error: error.message
        });
    }
});

// GET /competition/admin/top-rankers
router.get('/admin/top-rankers', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const limit = req.query.limit || 10;

        const users = await User.find({
            'gtcfx.accessToken': { $ne: null }
        })
            .select('name username email phone gtcfx referralDetails tradingStats userType createdAt')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                topRankers: [],
                stats: { totalParticipants: 0 }
            });
        }

        const scorePromises = users.map(async (user) => {
            try {
                const gtcData = await fetchComprehensiveGTCData(user);
                if (!gtcData) return null;

                const scoreData = await calculateEnhancedCompetitionScore(user, gtcData);

                return {
                    userId: user._id.toString(),
                    name: user.name,
                    username: user.username,
                    email: user.email,
                    phone: user.phone,
                    userType: user.userType,
                    memberSince: user.createdAt,
                    score: scoreData.totalScore,
                    baseScore: scoreData.baseScore,
                    bonusMultiplier: scoreData.bonusMultiplier,
                    breakdown: scoreData.breakdown,
                    progressPercentages: scoreData.progressPercentages,
                    metrics: scoreData.metrics,
                    isVerified: scoreData.metrics.isKYCVerified
                };
            } catch (error) {
                console.error(`Error processing user ${user.username}:`, error.message);
                return null;
            }
        });

        const scoredUsersResults = await Promise.all(scorePromises);
        const scoredUsers = scoredUsersResults.filter(u => u !== null);

        scoredUsers.sort((a, b) => b.score - a.score);

        let currentRank = 1;
        const rankedUsers = scoredUsers.map((user, index) => {
            if (index > 0 && user.score < scoredUsers[index - 1].score) {
                currentRank = index + 1;
            }
            return { ...user, rank: currentRank };
        });

        const topRankers = rankedUsers.slice(0, parseInt(limit));

        res.json({
            success: true,
            topRankers,
            stats: {
                totalParticipants: rankedUsers.length,
                averageScore: parseFloat((rankedUsers.reduce((sum, u) => sum + u.score, 0) / rankedUsers.length).toFixed(2)),
                highestScore: rankedUsers[0]?.score || 0,
                kycVerifiedCount: rankedUsers.filter(u => u.isVerified).length
            }
        });
    } catch (error) {
        console.error('Get top rankers error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch top rankers',
            error: error.message
        });
    }
});

// POST /competition/admin/reset-config
router.post('/admin/reset-config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const DEFAULT_CONFIG = {
            period: {
                active: true,
                startDate: new Date('2025-01-01T00:00:00Z'),
                endDate: new Date('2025-12-31T23:59:59Z'),
                description: 'Trading Championship'
            },
            rules: {
                directReferralsWeight: 30,
                teamSizeWeight: 20,
                tradingVolumeWeight: 25,
                profitabilityWeight: 15,
                accountBalanceWeight: 10
            },
            bonusMultipliers: {
                kycVerified: 1.1
            }
        };

        Object.assign(COMPETITION_CONFIG, DEFAULT_CONFIG);

        // Save to database
        const configDoc = new CompetitionConfig({
            ...COMPETITION_CONFIG,
            isActive: true,
            lastModifiedBy: req.user.userId
        });

        await CompetitionConfig.updateMany({}, { isActive: false });
        await configDoc.save();

        res.json({
            success: true,
            message: 'Configuration reset to defaults',
            config: COMPETITION_CONFIG
        });
    } catch (error) {
        console.error('Reset config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset configuration',
            error: error.message
        });
    }
});

export default router;