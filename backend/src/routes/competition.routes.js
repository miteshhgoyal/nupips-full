// backend/src / routes / competition.routes.js
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

// Simplified Competition Configuration
const COMPETITION_CONFIG = {
    competitionEnabled: true,
    rules: {
        // Core metrics weights (total 100%)
        directReferralsWeight: 25,      // 25% - New members introduced to Nupips
        teamSizeWeight: 15,              // 15% - Total downline team size
        tradingVolumeWeight: 20,         // 20% - Total trading volume from GTC
        profitabilityWeight: 15,         // 15% - Profit/Loss ratio from GTC
        accountBalanceWeight: 15,        // 15% - GTC account balance
        kycCompletionWeight: 10,         // 10% - KYC verification status
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
    bonusMultipliers: {
        kycVerified: 1.1,                // 10% bonus for KYC verified users
    }
};

/**
 * Fetch GTC FX data for a user
 */
async function fetchGTCData(user) {
    try {
        if (!user.gtcfx?.accessToken) {
            return null;
        }

        const authHeader = { Authorization: `Bearer ${user.gtcfx.accessToken}` };

        // Fetch Account Info
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

        // Fetch Profit Logs for trading history
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

        // Fetch Agent/Member data for team metrics
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

        // Calculate metrics
        const totalProfit = parseFloat(accountData.total_profit || 0);
        const totalLoss = parseFloat(accountData.total_loss || 0);
        const balance = parseFloat(accountData.amount || 0);
        const equity = parseFloat(accountData.equity || balance);

        const netProfit = totalProfit - totalLoss;
        const profitPercent = balance > 0 ? (netProfit / balance) * 100 : 0;
        const winRate = totalProfit + totalLoss > 0 ? (totalProfit / (totalProfit + totalLoss)) * 100 : 0;

        // Trading volume from profit logs
        let totalVolumeLots = 0;
        profitLogs.forEach(log => {
            totalVolumeLots += parseFloat(log.volume || 0);
        });

        const gtcTeamSize = memberData?.total || 0;
        const gtcDirectMembers = memberData?.list?.filter(m => m.level === 1).length || 0;

        return {
            accountBalance: balance,
            equity: equity,
            margin: parseFloat(accountData.margin || 0),
            freeMargin: parseFloat(accountData.free_margin || 0),
            marginLevel: parseFloat(accountData.margin_level || 0),
            totalProfit: totalProfit,
            totalLoss: totalLoss,
            netProfit: netProfit,
            profitPercent: profitPercent,
            winRate: winRate,
            totalVolumeLots: totalVolumeLots,
            totalTrades: profitLogs.length,
            kycStatus: parseInt(accountData.kyc_status || 0),
            accountLevel: parseInt(accountData.level || 0),
            isAgent: accountData.user_type === 'agent' || accountData.is_agent === 1,
            gtcTeamSize: gtcTeamSize,
            gtcDirectMembers: gtcDirectMembers,
            rawAccountData: accountData,
        };
    } catch (error) {
        console.error('Error fetching GTC data:', error.message);
        return null;
    }
}

/**
 * Calculate competition score with simple normalization
 */
async function calculateCompetitionScore(user, gtcData) {
    const { rules, bonusMultipliers } = COMPETITION_CONFIG;

    let scores = {
        directReferrals: 0,
        teamSize: 0,
        tradingVolume: 0,
        profitability: 0,
        accountBalance: 0,
        kycCompletion: 0,
    };

    let bonusMultiplier = 1.0;

    // 1. Direct Referrals Score (25%)
    const directReferrals = user.referralDetails?.totalDirectReferrals || 0;
    scores.directReferrals = Math.min(directReferrals / 10, 1) * rules.directReferralsWeight;

    // 2. Team Size Score (15%)
    const nupipsTeamSize = user.referralDetails?.totalDownlineUsers || 0;
    const gtcTeamSize = gtcData?.gtcTeamSize || 0;
    const totalTeamSize = Math.max(nupipsTeamSize, gtcTeamSize);
    scores.teamSize = Math.min(totalTeamSize / 50, 1) * rules.teamSizeWeight;

    // 3. Trading Volume Score (20%)
    const tradingVolume = gtcData?.totalVolumeLots || 0;
    const volumeInDollars = tradingVolume * 100000;
    scores.tradingVolume = Math.min(volumeInDollars / 100000, 1) * rules.tradingVolumeWeight;

    // 4. Profitability Score (15%)
    const winRate = gtcData?.winRate || 0;
    const profitPercent = Math.max(gtcData?.profitPercent || 0, 0);
    const profitabilityScore = (winRate / 100) * 0.5 + (Math.min(profitPercent / 100, 1)) * 0.5;
    scores.profitability = profitabilityScore * rules.profitabilityWeight;

    // 5. Account Balance Score (15%)
    const accountBalance = gtcData?.accountBalance || 0;
    scores.accountBalance = Math.min(accountBalance / 10000, 1) * rules.accountBalanceWeight;

    // 6. KYC Completion Score (10%)
    const isKYCVerified = gtcData?.kycStatus === 1;
    scores.kycCompletion = isKYCVerified ? rules.kycCompletionWeight : 0;

    // Apply KYC bonus multiplier
    if (isKYCVerified) {
        bonusMultiplier *= bonusMultipliers.kycVerified;
    }

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
            accountBalanceScore: parseFloat(scores.accountBalance.toFixed(2)),
            kycCompletionScore: parseFloat(scores.kycCompletion.toFixed(2)),
        },
        metrics: {
            directReferrals,
            nupipsTeamSize,
            gtcTeamSize: gtcData?.gtcTeamSize || 0,
            tradingVolumeLots: parseFloat((gtcData?.totalVolumeLots || 0).toFixed(2)),
            tradingVolumeDollars: parseFloat((volumeInDollars).toFixed(2)),
            profitPercent: parseFloat((gtcData?.profitPercent || 0).toFixed(2)),
            winRate: parseFloat((gtcData?.winRate || 0).toFixed(2)),
            accountBalance: parseFloat((gtcData?.accountBalance || 0).toFixed(2)),
            equity: parseFloat((gtcData?.equity || 0).toFixed(2)),
            totalTrades: gtcData?.totalTrades || 0,
            isKYCVerified,
            isAgent: gtcData?.isAgent || false,
        }
    };
}

router.get('/status', authenticateToken, async (req, res) => {
    res.json({
        status: COMPETITION_CONFIG.competitionEnabled,
    })
})

/**
 * GET /competition/leaderboard
 */
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { limit = 100 } = req.query;

        const users = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        })
            .select('name username email gtcfx referralDetails userType')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                leaderboard: [],
                userRank: null,
                rules: COMPETITION_CONFIG.rules,
                rewards: COMPETITION_CONFIG.rewards,
                period: COMPETITION_CONFIG.period,
                stats: { totalParticipants: 0 },
            });
        }

        const scorePromises = users.map(async (user) => {
            try {
                const gtcData = await fetchGTCData(user);
                if (!gtcData) return null;

                const scoreData = await calculateCompetitionScore(user, gtcData);

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
                    metrics: scoreData.metrics,
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

        if (userRank) {
            userRank = { ...userRank, eligibleReward: getRewardForRank(userRank.rank) };
        }

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
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId)
            .select('name username email gtcfx referralDetails userType')
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

        const gtcData = await fetchGTCData(user);

        if (!gtcData) {
            return res.json({
                success: true,
                connected: true,
                message: 'Unable to fetch GTC FX data',
                hasToken: true,
            });
        }

        const scoreData = await calculateCompetitionScore(user, gtcData);

        const allUsers = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        })
            .select('_id')
            .lean();

        let rank = 1;
        for (const otherUser of allUsers) {
            if (otherUser._id.toString() === userId) continue;

            const otherUserData = await User.findById(otherUser._id)
                .select('gtcfx referralDetails')
                .lean();

            const otherGtcData = await fetchGTCData(otherUserData);
            if (!otherGtcData) continue;

            const otherScore = await calculateCompetitionScore(otherUserData, otherGtcData);
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
            metrics: scoreData.metrics,
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