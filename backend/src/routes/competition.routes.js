// backend/src/routes/competition.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create axios instance for GTC FX API calls (same pattern as gtcfx.routes.js)
const gtcAxios = axios.create({
    baseURL: process.env.GTC_FX_API_URL || 'https://apiv1.gtctrader100.top',
    timeout: 30000,
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

// Competition configuration - can be moved to database later
const COMPETITION_CONFIG = {
    rules: {
        directReferralsWeight: 40, // 40%
        tradingVolumeWeight: 35,   // 35%
        profitPercentWeight: 25,   // 25%
    },
    rewards: [
        { rankRange: "1st Place", title: "Grand Prize", prize: "$5,000 Cash + Premium Benefits" },
        { rankRange: "2nd Place", title: "Runner Up", prize: "$3,000 Cash + Gold Benefits" },
        { rankRange: "3rd Place", title: "Third Place", prize: "$2,000 Cash + Silver Benefits" },
        { rankRange: "4th-5th", title: "Top 5", prize: "$1,000 Cash Bonus" },
        { rankRange: "6th-10th", title: "Top 10", prize: "$500 Cash Bonus" },
    ],
    period: {
        active: true,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
    },
    normalizers: {
        maxReferrals: 100,      // Normalize referrals to this max
        maxVolume: 1000000,     // Normalize volume to $1M
        maxProfitPercent: 100,  // Normalize profit to 100%
    }
};

/**
 * Calculate competition score for a user
 */
async function calculateCompetitionScore(user, gtcData) {
    const { rules, normalizers } = COMPETITION_CONFIG;

    // 1. Direct Referrals Score (40%)
    const directReferrals = user.referralDetails?.totalDirectReferrals || 0;
    const referralScore = Math.min(directReferrals / normalizers.maxReferrals, 1) * rules.directReferralsWeight;

    // 2. Trading Volume Score (35%)
    const tradingVolume = gtcData?.totalVolume || 0;
    const volumeScore = Math.min(tradingVolume / normalizers.maxVolume, 1) * rules.tradingVolumeWeight;

    // 3. Profit Percentage Score (25%)
    const profitPercent = gtcData?.profitPercent || 0;
    const profitScore = Math.min(Math.max(profitPercent, 0) / normalizers.maxProfitPercent, 1) * rules.profitPercentWeight;

    // Total score (0-100)
    const totalScore = referralScore + volumeScore + profitScore;

    return {
        totalScore: parseFloat(totalScore.toFixed(2)),
        breakdown: {
            referralScore: parseFloat(referralScore.toFixed(2)),
            volumeScore: parseFloat(volumeScore.toFixed(2)),
            profitScore: parseFloat(profitScore.toFixed(2)),
        },
        metrics: {
            directReferrals,
            tradingVolume: parseFloat(tradingVolume.toFixed(2)),
            profitPercent: parseFloat(profitPercent.toFixed(2)),
        },
    };
}

/**
 * Fetch GTC FX data for a user
 */
async function fetchGTCData(user) {
    try {
        if (!user.gtcfx?.accessToken) {
            return null;
        }

        // Fetch account info from GTC FX API
        const accountResponse = await gtcAxios.post(
            '/api/v3/account_info',
            {},
            {
                headers: { Authorization: `Bearer ${user.gtcfx.accessToken}` }
            }
        );

        if (accountResponse.data.code !== 200) {
            console.warn(`Failed to fetch GTC data for user ${user._id}: ${accountResponse.data.message}`);
            return null;
        }

        const accountData = accountResponse.data.data;

        // Calculate profit percentage if data available
        const totalProfit = parseFloat(accountData.total_profit || 0);
        const totalLoss = parseFloat(accountData.total_loss || 0);
        const balance = parseFloat(accountData.amount || 1);
        const profitPercent = balance > 0 ? ((totalProfit - totalLoss) / balance) * 100 : 0;

        // Get trading volume from user's trading stats (stored in your DB)
        // Or fetch from GTC API if available
        const totalVolume = parseFloat(user.tradingStats?.totalVolumeLots || 0);

        return {
            totalVolume: totalVolume,
            profitPercent: profitPercent,
            kycStatus: accountData.kyc_status || 0,
            accountBalance: parseFloat(accountData.amount || 0),
            totalProfit: totalProfit,
            totalLoss: totalLoss,
        };
    } catch (error) {
        console.error('Error fetching GTC data:', error.message);
        return null;
    }
}

/**
 * GET /api/competition/leaderboard
 * Fetch competition leaderboard and user rank
 */
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;

        // Find all users with GTC FX connected
        const users = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        })
            .select('name username email gtcfx referralDetails tradingStats')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                leaderboard: [],
                userRank: null,
                rules: COMPETITION_CONFIG.rules,
                rewards: COMPETITION_CONFIG.rewards,
                period: COMPETITION_CONFIG.period,
                totalParticipants: 0,
            });
        }

        // Calculate scores for all users
        const scoredUsers = [];

        for (const user of users) {
            try {
                const gtcData = await fetchGTCData(user);

                if (!gtcData) {
                    console.log(`Skipping user ${user.username} - no GTC data`);
                    continue; // Skip users without GTC data
                }

                const scoreData = await calculateCompetitionScore(user, gtcData);

                scoredUsers.push({
                    userId: user._id.toString(),
                    username: user.username,
                    email: user.email,
                    score: scoreData.totalScore,
                    breakdown: scoreData.breakdown,
                    metrics: scoreData.metrics,
                    isVerified: gtcData.kycStatus === 1,
                });
            } catch (error) {
                console.error(`Error processing user ${user.username}:`, error.message);
                continue;
            }
        }

        // Sort by score (descending)
        scoredUsers.sort((a, b) => b.score - a.score);

        // Assign ranks
        const leaderboard = scoredUsers.map((user, index) => ({
            ...user,
            rank: index + 1,
        }));

        // Find current user rank
        const userRankIndex = leaderboard.findIndex(u => u.userId === currentUserId);
        const userRank = userRankIndex >= 0 ? leaderboard[userRankIndex] : null;

        // Add eligible reward info
        if (userRank) {
            if (userRank.rank === 1) {
                userRank.eligibleReward = COMPETITION_CONFIG.rewards[0].prize;
            } else if (userRank.rank === 2) {
                userRank.eligibleReward = COMPETITION_CONFIG.rewards[1].prize;
            } else if (userRank.rank === 3) {
                userRank.eligibleReward = COMPETITION_CONFIG.rewards[2].prize;
            } else if (userRank.rank <= 5) {
                userRank.eligibleReward = COMPETITION_CONFIG.rewards[3].prize;
            } else if (userRank.rank <= 10) {
                userRank.eligibleReward = COMPETITION_CONFIG.rewards[4].prize;
            } else {
                userRank.eligibleReward = null;
            }
        }

        res.json({
            success: true,
            leaderboard,
            userRank,
            rules: COMPETITION_CONFIG.rules,
            rewards: COMPETITION_CONFIG.rewards,
            period: COMPETITION_CONFIG.period,
            totalParticipants: leaderboard.length,
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
 * GET /api/competition/my-stats
 * Get detailed stats for current user
 */
router.get('/my-stats', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId)
            .select('name username email gtcfx referralDetails tradingStats')
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

        res.json({
            success: true,
            connected: true,
            score: scoreData.totalScore,
            breakdown: scoreData.breakdown,
            metrics: scoreData.metrics,
            isVerified: gtcData.kycStatus === 1,
            accountBalance: gtcData.accountBalance,
            totalProfit: gtcData.totalProfit,
            totalLoss: gtcData.totalLoss,
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
 * GET /api/competition/config
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

export default router;
