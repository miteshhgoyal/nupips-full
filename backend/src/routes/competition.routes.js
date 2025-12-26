// backend/src/routes/competition.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create axios instance for GTC FX API calls
const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://apiv1.gtctrader100.top',
    timeout: 45000,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production',
    }),
});

// Add response interceptor for better error handling
gtcAxios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('GTC FX API Error:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
            url: error.config?.url,
        });
        return Promise.reject(error);
    }
);

// Enhanced Competition Configuration
const COMPETITION_CONFIG = {
    rules: {
        // Core metrics weights (total 100%)
        directReferralsWeight: 25,      // 25% - New members introduced to Nupips
        teamSizeWeight: 15,              // 15% - Total downline team size
        tradingVolumeWeight: 20,         // 20% - Total trading volume from GTC
        profitabilityWeight: 15,         // 15% - Profit/Loss ratio from GTC
        accountBalanceWeight: 10,        // 10% - GTC account balance
        kycCompletionWeight: 5,          // 5% - KYC verification status
        activeTradesWeight: 5,           // 5% - Number of active trades
        consistencyWeight: 5,            // 5% - Trading consistency score
    },
    rewards: [
        {
            rankRange: "1st",
            minRank: 1,
            maxRank: 1,
            title: "Champion",
            prize: "Moscow Russia Trip",
            description: "Lifetime VIP status + exclusive training"
        },
        {
            rankRange: "2nd",
            minRank: 2,
            maxRank: 2,
            title: "Grand Master",
            prize: "$5,000 Cash",
            description: "Gold Benefits + premium features"
        },
        {
            rankRange: "3rd",
            minRank: 3,
            maxRank: 3,
            title: "Master",
            prize: "$5,000 Cash",
            description: "Gold Benefits + priority support"
        },
        {
            rankRange: "4th",
            minRank: 4,
            maxRank: 4,
            title: "Elite Platinum",
            prize: "$2,500 Cash",
            description: "Silver Benefits + trading tools"
        },
        {
            rankRange: "5th-10th",
            minRank: 5,
            maxRank: 10,
            title: "Top Performers",
            prize: "$1,000 Cash",
            description: "Bronze Benefits + recognition"
        },
        {
            rankRange: "11th-25th",
            minRank: 11,
            maxRank: 25,
            title: "Rising Stars",
            prize: "$500 Credit",
            description: "Special badges + community spotlight"
        },
    ],
    period: {
        active: true,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        description: 'Annual Trading Championship 2025'
    },
    normalizers: {
        maxDirectReferrals: 150,         // Normalize direct referrals
        maxTeamSize: 500,                // Normalize team size
        maxVolume: 2000000,              // Normalize volume to $2M
        maxBalance: 100000,              // Normalize balance to $100K
        maxActiveTrades: 50,             // Normalize active trades
        maxConsistencyDays: 90,          // 90 days of consistent trading
    },
    bonusMultipliers: {
        kycVerified: 1.1,                // 10% bonus for KYC verified users
        agentStatus: 1.05,               // 5% bonus for agents
    }
};

/**
 * Fetch comprehensive GTC FX data for a user
 * Combines multiple GTC API endpoints for complete metrics
 */
async function fetchComprehensiveGTCData(user) {
    try {
        if (!user.gtcfx?.accessToken) {
            return null;
        }

        const authHeader = { Authorization: `Bearer ${user.gtcfx.accessToken}` };

        // 1. Fetch Account Info
        const accountResponse = await gtcAxios.post(
            '/api/v3/account_info',
            {},
            { headers: authHeader }
        );

        if (accountResponse.data.code !== 200) {
            console.warn(`Failed to fetch GTC account for user ${user.username}`);
            return null;
        }

        const accountData = accountResponse.data.data;

        // 2. Fetch Profit Logs for detailed trading history
        let profitLogs = [];
        try {
            const profitResponse = await gtcAxios.post(
                '/api/v3/share_profit_log',
                { page: 1, page_size: 100 },
                { headers: authHeader }
            );

            if (profitResponse.data.code === 200) {
                profitLogs = profitResponse.data.data?.list || [];
            }
        } catch (err) {
            console.warn('Could not fetch profit logs:', err.message);
        }

        // 3. Fetch Agent/Member data for team metrics
        let memberData = null;
        try {
            const memberResponse = await gtcAxios.post(
                '/api/v3/agent/member',
                { page: 1, page_size: 10 },
                { headers: authHeader }
            );

            if (memberResponse.data.code === 200) {
                memberData = memberResponse.data.data;
            }
        } catch (err) {
            console.warn('Could not fetch member data:', err.message);
        }

        // Calculate comprehensive metrics
        const totalProfit = parseFloat(accountData.total_profit || 0);
        const totalLoss = parseFloat(accountData.total_loss || 0);
        const balance = parseFloat(accountData.amount || 0);
        const equity = parseFloat(accountData.equity || balance);

        // Profitability metrics
        const netProfit = totalProfit - totalLoss;
        const profitPercent = balance > 0 ? (netProfit / balance) * 100 : 0;
        const winRate = totalProfit + totalLoss > 0 ? (totalProfit / (totalProfit + totalLoss)) * 100 : 0;

        // Trading volume from profit logs
        let totalVolumeLots = 0;
        let activeTrades = 0;
        let tradingDays = new Set();

        profitLogs.forEach(log => {
            totalVolumeLots += parseFloat(log.volume || 0);
            if (log.status === 'active' || log.status === 1) {
                activeTrades++;
            }
            if (log.created_at) {
                const tradeDate = new Date(log.created_at).toDateString();
                tradingDays.add(tradeDate);
            }
        });

        // Calculate consistency score (based on trading days in last 90 days)
        const consistencyScore = Math.min(tradingDays.size / 90, 1) * 100;

        // Member/Agent metrics from GTC
        const gtcTeamSize = memberData?.total || 0;
        const gtcDirectMembers = memberData?.list?.filter(m => m.level === 1).length || 0;

        return {
            // Account metrics
            accountBalance: balance,
            equity: equity,
            margin: parseFloat(accountData.margin || 0),
            freeMargin: parseFloat(accountData.free_margin || 0),
            marginLevel: parseFloat(accountData.margin_level || 0),

            // Profit/Loss metrics
            totalProfit: totalProfit,
            totalLoss: totalLoss,
            netProfit: netProfit,
            profitPercent: profitPercent,
            winRate: winRate,

            // Trading activity metrics
            totalVolumeLots: totalVolumeLots,
            activeTrades: activeTrades,
            totalTrades: profitLogs.length,
            consistencyScore: consistencyScore,
            tradingDaysCount: tradingDays.size,

            // Account status
            kycStatus: parseInt(accountData.kyc_status || 0),
            accountLevel: parseInt(accountData.level || 0),
            isAgent: accountData.user_type === 'agent' || accountData.is_agent === 1,

            // GTC Team metrics
            gtcTeamSize: gtcTeamSize,
            gtcDirectMembers: gtcDirectMembers,

            // Raw data for additional processing
            rawAccountData: accountData,
            profitLogsCount: profitLogs.length,
        };
    } catch (error) {
        console.error('Error fetching comprehensive GTC data:', error.message);
        return null;
    }
}

/**
 * Calculate enhanced multi-criteria competition score
 * Combines Nupips metrics with GTC FX metrics
 */
async function calculateEnhancedCompetitionScore(user, gtcData) {
    const { rules, normalizers, bonusMultipliers } = COMPETITION_CONFIG;

    // Initialize score components
    let scores = {
        directReferrals: 0,
        teamSize: 0,
        tradingVolume: 0,
        profitability: 0,
        accountBalance: 0,
        kycCompletion: 0,
        activeTrades: 0,
        consistency: 0,
    };

    let bonusMultiplier = 1.0;

    // 1. Direct Referrals Score (25%) - From Nupips database
    const directReferrals = user.referralDetails?.totalDirectReferrals || 0;
    const directReferralsProgress = Math.min(directReferrals / normalizers.maxDirectReferrals, 1);
    scores.directReferrals = directReferralsProgress * rules.directReferralsWeight;

    // 2. Team Size Score (15%) - Combined Nupips + GTC team
    const nupipsTeamSize = user.referralDetails?.totalDownlineUsers || 0;
    const gtcTeamSize = gtcData?.gtcTeamSize || 0;
    const totalTeamSize = Math.max(nupipsTeamSize, gtcTeamSize);
    const teamSizeProgress = Math.min(totalTeamSize / normalizers.maxTeamSize, 1);
    scores.teamSize = teamSizeProgress * rules.teamSizeWeight;

    // 3. Trading Volume Score (20%) - From GTC profit logs
    const tradingVolume = gtcData?.totalVolumeLots || 0;
    const volumeInDollars = tradingVolume * 100000;
    const volumeProgress = Math.min(volumeInDollars / normalizers.maxVolume, 1);
    scores.tradingVolume = volumeProgress * rules.tradingVolumeWeight;

    // 4. Profitability Score (15%) - Win rate and profit percent combined
    const winRate = gtcData?.winRate || 0;
    const profitPercent = Math.max(gtcData?.profitPercent || 0, 0);
    const profitabilityScore = (winRate / 100) * 0.5 + (Math.min(profitPercent / 100, 1)) * 0.5;
    scores.profitability = profitabilityScore * rules.profitabilityWeight;

    // 5. Account Balance Score (10%) - Rewards larger accounts
    const accountBalance = gtcData?.accountBalance || 0;
    const balanceProgress = Math.min(accountBalance / normalizers.maxBalance, 1);
    scores.accountBalance = balanceProgress * rules.accountBalanceWeight;

    // 6. KYC Completion Score (5%) - Binary: verified or not
    const isKYCVerified = gtcData?.kycStatus === 1;
    scores.kycCompletion = isKYCVerified ? rules.kycCompletionWeight : 0;

    // Apply KYC bonus multiplier
    if (isKYCVerified) {
        bonusMultiplier *= bonusMultipliers.kycVerified;
    }

    // 7. Active Trades Score (5%) - Rewards active trading
    const activeTrades = gtcData?.activeTrades || 0;
    const activeTradesProgress = Math.min(activeTrades / normalizers.maxActiveTrades, 1);
    scores.activeTrades = activeTradesProgress * rules.activeTradesWeight;

    // 8. Consistency Score (5%) - Rewards regular trading
    const consistencyScore = gtcData?.consistencyScore || 0;
    const consistencyProgress = consistencyScore / 100;
    scores.consistency = consistencyProgress * rules.consistencyWeight;

    // Apply agent bonus if applicable
    if (gtcData?.isAgent || user.userType === 'agent') {
        bonusMultiplier *= bonusMultipliers.agentStatus;
    }

    // Calculate total base score
    const baseScore = Object.values(scores).reduce((sum, score) => sum + score, 0);

    // Apply bonus multiplier
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
            accountBalanceScore: parseFloat(scores.accountBalance.toFixed(2)),
            kycCompletionScore: parseFloat(scores.kycCompletion.toFixed(2)),
            activeTradesScore: parseFloat(scores.activeTrades.toFixed(2)),
            consistencyScore: parseFloat(scores.consistency.toFixed(2)),
        },
        progressPercentages: {
            directReferrals: parseFloat((directReferralsProgress * 100).toFixed(1)),
            teamSize: parseFloat((teamSizeProgress * 100).toFixed(1)),
            tradingVolume: parseFloat((volumeProgress * 100).toFixed(1)),
            profitability: parseFloat((profitabilityScore * 100).toFixed(1)),
            accountBalance: parseFloat((balanceProgress * 100).toFixed(1)),
            kycCompletion: isKYCVerified ? 100 : 0,
            activeTrades: parseFloat((activeTradesProgress * 100).toFixed(1)),
            consistency: parseFloat((consistencyProgress * 100).toFixed(1)),
        },
        metrics: {
            // Nupips metrics
            directReferrals,
            nupipsTeamSize,

            // GTC metrics
            gtcTeamSize: gtcData?.gtcTeamSize || 0,
            tradingVolumeLots: parseFloat((gtcData?.totalVolumeLots || 0).toFixed(2)),
            tradingVolumeDollars: parseFloat((volumeInDollars).toFixed(2)),
            profitPercent: parseFloat((gtcData?.profitPercent || 0).toFixed(2)),
            winRate: parseFloat((gtcData?.winRate || 0).toFixed(2)),
            accountBalance: parseFloat((gtcData?.accountBalance || 0).toFixed(2)),
            equity: parseFloat((gtcData?.equity || 0).toFixed(2)),
            activeTrades: gtcData?.activeTrades || 0,
            totalTrades: gtcData?.totalTrades || 0,
            consistencyScore: parseFloat((gtcData?.consistencyScore || 0).toFixed(2)),
            tradingDays: gtcData?.tradingDaysCount || 0,

            // Status flags
            isKYCVerified,
            isAgent: gtcData?.isAgent || false,
        },
        targets: {
            maxDirectReferrals: normalizers.maxDirectReferrals,
            maxTeamSize: normalizers.maxTeamSize,
            maxVolume: normalizers.maxVolume,
            maxBalance: normalizers.maxBalance,
            maxActiveTrades: normalizers.maxActiveTrades,
            maxConsistencyDays: normalizers.maxConsistencyDays,
        }
    };
}

/**
 * GET /competition/leaderboard
 * Fetch enhanced competition leaderboard with comprehensive metrics
 */
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { limit = 100 } = req.query;

        // Find all active users with GTC FX connected
        const users = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        })
            .select('name username email gtcfx referralDetails tradingStats userType')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                leaderboard: [],
                userRank: null,
                rules: COMPETITION_CONFIG.rules,
                rewards: COMPETITION_CONFIG.rewards,
                period: COMPETITION_CONFIG.period,
                stats: {
                    totalParticipants: 0,
                },
            });
        }

        // Calculate scores for all users (with parallel processing for speed)
        const scorePromises = users.map(async (user) => {
            try {
                const gtcData = await fetchComprehensiveGTCData(user);

                if (!gtcData) {
                    return null;
                }

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
                    targets: scoreData.targets,
                    isVerified: scoreData.metrics.isKYCVerified,
                    isAgent: scoreData.metrics.isAgent,
                };
            } catch (error) {
                console.error(`Error processing user ${user.username}:`, error.message);
                return null;
            }
        });

        const scoredUsersResults = await Promise.all(scorePromises);
        const scoredUsers = scoredUsersResults.filter(u => u !== null);

        // Sort by score (descending)
        scoredUsers.sort((a, b) => b.score - a.score);

        // Assign ranks with tie handling
        let currentRank = 1;
        const leaderboard = scoredUsers.map((user, index) => {
            if (index > 0 && user.score < scoredUsers[index - 1].score) {
                currentRank = index + 1;
            }
            return {
                ...user,
                rank: currentRank,
            };
        });

        // Limit leaderboard size if requested
        const limitedLeaderboard = leaderboard.slice(0, parseInt(limit));

        // Find current user rank (even if not in limited leaderboard)
        const userRankIndex = leaderboard.findIndex(u => u.userId === currentUserId);
        let userRank = userRankIndex >= 0 ? leaderboard[userRankIndex] : null;

        // Add eligible reward info
        if (userRank) {
            userRank = { ...userRank, eligibleReward: getRewardForRank(userRank.rank) };
        }

        // Calculate leaderboard statistics
        const stats = {
            totalParticipants: leaderboard.length,
            averageScore: parseFloat((leaderboard.reduce((sum, u) => sum + u.score, 0) / leaderboard.length).toFixed(2)),
            highestScore: leaderboard[0]?.score || 0,
            kycVerifiedCount: leaderboard.filter(u => u.isVerified).length,
            agentCount: leaderboard.filter(u => u.isAgent).length,
        };

        res.json({
            success: true,
            leaderboard: limitedLeaderboard,
            userRank,
            rules: COMPETITION_CONFIG.rules,
            rewards: COMPETITION_CONFIG.rewards,
            period: COMPETITION_CONFIG.period,
            stats,
        });

    } catch (error) {
        console.error('Competition leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition data',
            error: error.message,
        });
    }
});

/**
 * GET /competition/my-stats
 * Get detailed stats for current user with all metrics
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId)
            .select('name username email gtcfx referralDetails tradingStats userType')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.gtcfx?.accessToken) {
            return res.json({
                success: true,
                connected: false,
                message: 'GTC FX not connected',
            });
        }

        const gtcData = await fetchComprehensiveGTCData(user);

        if (!gtcData) {
            return res.json({
                success: true,
                connected: true,
                message: 'Unable to fetch GTC FX data',
                hasToken: true,
            });
        }

        const scoreData = await calculateEnhancedCompetitionScore(user, gtcData);

        // Get user's rank among all participants
        const allUsers = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        })
            .select('_id')
            .lean();

        // Calculate rank (simplified - you might want to cache this)
        let rank = 1;
        for (const otherUser of allUsers) {
            if (otherUser._id.toString() === userId) continue;

            const otherUserData = await User.findById(otherUser._id)
                .select('gtcfx referralDetails tradingStats userType')
                .lean();

            const otherGtcData = await fetchComprehensiveGTCData(otherUserData);
            if (!otherGtcData) continue;

            const otherScore = await calculateEnhancedCompetitionScore(otherUserData, otherGtcData);
            if (otherScore.totalScore > scoreData.totalScore) {
                rank++;
            }
        }

        res.json({
            success: true,
            connected: true,
            user: {
                name: user.name,
                username: user.username,
                userType: user.userType,
            },
            ranking: {
                rank,
                score: scoreData.totalScore,
                baseScore: scoreData.baseScore,
                bonusMultiplier: scoreData.bonusMultiplier,
                eligibleReward: getRewardForRank(rank),
            },
            breakdown: scoreData.breakdown,
            progressPercentages: scoreData.progressPercentages,
            metrics: scoreData.metrics,
            targets: scoreData.targets,
            gtcAccountInfo: {
                balance: gtcData.accountBalance,
                equity: gtcData.equity,
                margin: gtcData.margin,
                freeMargin: gtcData.freeMargin,
                marginLevel: gtcData.marginLevel,
            },
        });

    } catch (error) {
        console.error('My stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user stats',
            error: error.message,
        });
    }
});

/**
 * GET /competition/config
 * Get competition configuration (public)
 */
router.get('/config', async (req, res) => {
    try {
        res.json({
            success: true,
            config: COMPETITION_CONFIG,
        });
    } catch (error) {
        console.error('Config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch config',
        });
    }
});

/**
 * Helper function to determine reward for a given rank
 */
function getRewardForRank(rank) {
    const reward = COMPETITION_CONFIG.rewards.find(r => rank >= r.minRank && rank <= r.maxRank);
    return reward || null;
}

export default router;