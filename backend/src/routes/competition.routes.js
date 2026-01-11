// backend/src/routes/competition.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import Competition from '../models/Competition.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Admin middleware
const requireAdmin = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user || user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }
        next();
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Authorization failed'
        });
    }
};

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

// Add response interceptor
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

        // Fetch Profit Logs
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

        // Fetch Agent/Member data
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

        // Trading volume
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
 * Calculate competition score using dynamic config
 */
async function calculateCompetitionScore(user, gtcData, config) {
    const { rules, bonusMultipliers, normalizationTargets } = config;

    let scores = {
        directReferrals: 0,
        teamSize: 0,
        tradingVolume: 0,
        profitability: 0,
        accountBalance: 0,
        kycCompletion: 0,
    };

    let bonusMultiplier = 1.0;

    // 1. Direct Referrals Score
    const directReferrals = user.referralDetails?.totalDirectReferrals || 0;
    scores.directReferrals = Math.min(
        directReferrals / normalizationTargets.directReferralsTarget,
        1
    ) * rules.directReferralsWeight;

    // 2. Team Size Score
    const nupipsTeamSize = user.referralDetails?.totalDownlineUsers || 0;
    const gtcTeamSize = gtcData?.gtcTeamSize || 0;
    const totalTeamSize = Math.max(nupipsTeamSize, gtcTeamSize);
    scores.teamSize = Math.min(
        totalTeamSize / normalizationTargets.teamSizeTarget,
        1
    ) * rules.teamSizeWeight;

    // 3. Trading Volume Score
    const tradingVolume = gtcData?.totalVolumeLots || 0;
    const volumeInDollars = tradingVolume * 100000;
    scores.tradingVolume = Math.min(
        volumeInDollars / normalizationTargets.tradingVolumeTarget,
        1
    ) * rules.tradingVolumeWeight;

    // 4. Profitability Score
    const winRate = gtcData?.winRate || 0;
    const profitPercent = Math.max(gtcData?.profitPercent || 0, 0);
    const profitabilityScore = (winRate / 100) * 0.5 + (Math.min(profitPercent / normalizationTargets.profitPercentTarget, 1)) * 0.5;
    scores.profitability = profitabilityScore * rules.profitabilityWeight;

    // 5. Account Balance Score
    const accountBalance = gtcData?.accountBalance || 0;
    scores.accountBalance = Math.min(
        accountBalance / normalizationTargets.accountBalanceTarget,
        1
    ) * rules.accountBalanceWeight;

    // 6. KYC Completion Score
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

/**
 * Helper function to determine reward for a given rank
 */
function getRewardForRank(rank, rewards) {
    const reward = rewards.find(r => rank >= r.minRank && rank <= r.maxRank);
    return reward || null;
}

// ==================== USER ROUTES ====================

/**
 * GET /competition/status
 */
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const config = await Competition.getActiveConfig();

        res.json({
            success: true,
            status: config.competitionEnabled && config.isActive(),
            config: {
                enabled: config.competitionEnabled,
                periodActive: config.period.active,
                startDate: config.period.startDate,
                endDate: config.period.endDate,
                description: config.period.description,
            },
        });
    } catch (error) {
        console.error('Error fetching competition status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition status',
        });
    }
});

/**
 * GET /competition/leaderboard
 */
router.get('/leaderboard', authenticateToken, async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { limit = 100 } = req.query;

        // Get active competition config
        const config = await Competition.getActiveConfig();

        if (!config.competitionEnabled || !config.isActive()) {
            return res.json({
                success: true,
                active: false,
                message: 'Competition is not currently active',
                leaderboard: [],
                userRank: null,
            });
        }

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
                rules: config.rules,
                rewards: config.rewards,
                period: config.period,
                stats: { totalParticipants: 0 },
            });
        }

        const scorePromises = users.map(async (user) => {
            try {
                const gtcData = await fetchGTCData(user);
                if (!gtcData) return null;

                const scoreData = await calculateCompetitionScore(user, gtcData, config);

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
            userRank = {
                ...userRank,
                eligibleReward: getRewardForRank(userRank.rank, config.rewards)
            };
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
            rules: config.rules,
            rewards: config.rewards,
            period: config.period,
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

        // Get active competition config
        const config = await Competition.getActiveConfig();

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

        const scoreData = await calculateCompetitionScore(user, gtcData, config);

        // Calculate rank
        const allUsers = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        }).select('_id gtcfx referralDetails').lean();

        let rank = 1;
        for (const otherUser of allUsers) {
            if (otherUser._id.toString() === userId) continue;

            const otherGtcData = await fetchGTCData(otherUser);
            if (!otherGtcData) continue;

            const otherScore = await calculateCompetitionScore(otherUser, otherGtcData, config);
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
                eligibleReward: getRewardForRank(rank, config.rewards),
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
        const config = await Competition.getActiveConfig();

        res.json({
            success: true,
            config: {
                competitionEnabled: config.competitionEnabled,
                rules: config.rules,
                rewards: config.rewards,
                period: config.period,
                bonusMultipliers: config.bonusMultipliers,
                isActive: config.isActive(),
            },
        });
    } catch (error) {
        console.error('Config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch config',
        });
    }
});

// ==================== ADMIN ROUTES ====================

/**
 * GET /competition/admin/leaderboard - Admin Top Rankers (Top 25 + Reward Eligible)
 */
router.get('/admin/leaderboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 25, showRewards = 'true' } = req.query;

        // Get active competition config
        const config = await Competition.getActiveConfig();

        if (!config.competitionEnabled || !config.isActive()) {
            return res.json({
                success: true,
                active: false,
                message: 'Competition is not currently active',
                topRankers: [],
                rewardEligible: [],
                stats: { totalParticipants: 0 }
            });
        }

        const users = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        })
            .select('name username email gtcfx referralDetails userType')
            .lean();

        if (users.length === 0) {
            return res.json({
                success: true,
                topRankers: [],
                rewardEligible: [],
                rules: config.rules,
                rewards: config.rewards,
                stats: { totalParticipants: 0 },
            });
        }

        const scorePromises = users.map(async (user) => {
            try {
                const gtcData = await fetchGTCData(user);
                if (!gtcData) return null;

                const scoreData = await calculateCompetitionScore(user, gtcData, config);

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
                    eligibleReward: getRewardForRank(currentRank, config.rewards), // Will be set later
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
            return {
                ...user,
                rank: currentRank,
                eligibleReward: getRewardForRank(currentRank, config.rewards)
            };
        });

        const topRankers = rankedUsers.slice(0, parseInt(limit));

        // Filter reward-eligible users (those with valid rewards for their rank)
        const rewardEligible = rankedUsers.filter(user =>
            user.eligibleReward && user.rank <= 50 // Top 50 for rewards
        ).slice(0, 25);

        const stats = {
            totalParticipants: rankedUsers.length,
            averageScore: parseFloat((rankedUsers.reduce((sum, u) => sum + u.score, 0) / rankedUsers.length).toFixed(2)),
            highestScore: rankedUsers[0]?.score || 0,
            kycVerifiedCount: rankedUsers.filter(u => u.isVerified).length,
            agentCount: rankedUsers.filter(u => u.isAgent).length,
            rewardEligibleCount: rewardEligible.length,
        };

        res.json({
            success: true,
            topRankers,
            rewardEligible,
            rules: config.rules,
            rewards: config.rewards,
            period: config.period,
            stats,
        });

    } catch (error) {
        console.error('Admin leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch admin leaderboard data',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/config
 */
router.get('/admin/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const config = await Competition.getActiveConfig();

        res.json({
            success: true,
            config,
            isActive: config.isActive(),
        });
    } catch (error) {
        console.error('Error fetching competition config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition configuration',
            error: error.message,
        });
    }
});

/**
 * POST /competition/admin/config
 */
router.post('/admin/config', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.user.userId;
        const configData = req.body;

        // Validate that weights sum to 100
        const totalWeight =
            (configData.rules?.directReferralsWeight || 0) +
            (configData.rules?.teamSizeWeight || 0) +
            (configData.rules?.tradingVolumeWeight || 0) +
            (configData.rules?.profitabilityWeight || 0) +
            (configData.rules?.accountBalanceWeight || 0) +
            (configData.rules?.kycCompletionWeight || 0);

        if (totalWeight !== 100) {
            return res.status(400).json({
                success: false,
                message: `Total weight must equal 100%. Current total: ${totalWeight}%`,
            });
        }

        // Create new configuration
        const newConfig = new Competition({
            ...configData,
            createdBy: userId,
            updatedBy: userId,
            version: 1,
        });

        await newConfig.save();

        res.status(201).json({
            success: true,
            message: 'Competition configuration created successfully',
            config: newConfig,
        });
    } catch (error) {
        console.error('Error creating competition config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create competition configuration',
            error: error.message,
        });
    }
});

/**
 * PUT /competition/admin/config/:id
 */
router.put('/admin/config/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const updateData = req.body;

        // Validate that weights sum to 100 if rules are being updated
        if (updateData.rules) {
            const totalWeight =
                (updateData.rules.directReferralsWeight || 0) +
                (updateData.rules.teamSizeWeight || 0) +
                (updateData.rules.tradingVolumeWeight || 0) +
                (updateData.rules.profitabilityWeight || 0) +
                (updateData.rules.accountBalanceWeight || 0) +
                (updateData.rules.kycCompletionWeight || 0);

            if (totalWeight !== 100) {
                return res.status(400).json({
                    success: false,
                    message: `Total weight must equal 100%. Current total: ${totalWeight}%`,
                });
            }
        }

        const config = await Competition.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy') {
                config[key] = updateData[key];
            }
        });

        config.updatedBy = userId;
        config.version += 1;

        await config.save();

        res.json({
            success: true,
            message: 'Competition configuration updated successfully',
            config,
        });
    } catch (error) {
        console.error('Error updating competition config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update competition configuration',
            error: error.message,
        });
    }
});

/**
 * PATCH /competition/admin/config/:id/toggle
 */
router.patch('/admin/config/:id/toggle', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const config = await Competition.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        config.competitionEnabled = !config.competitionEnabled;
        config.updatedBy = userId;
        await config.save();

        res.json({
            success: true,
            message: `Competition ${config.competitionEnabled ? 'enabled' : 'disabled'} successfully`,
            config,
        });
    } catch (error) {
        console.error('Error toggling competition status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle competition status',
            error: error.message,
        });
    }
});

/**
 * PATCH /competition/admin/config/:id/rewards
 */
router.patch('/admin/config/:id/rewards', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rewards } = req.body;
        const userId = req.user.userId;

        if (!Array.isArray(rewards)) {
            return res.status(400).json({
                success: false,
                message: 'Rewards must be an array',
            });
        }

        const config = await Competition.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        config.rewards = rewards;
        config.updatedBy = userId;
        config.version += 1;

        await config.save();

        res.json({
            success: true,
            message: 'Rewards updated successfully',
            config,
        });
    } catch (error) {
        console.error('Error updating rewards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update rewards',
            error: error.message,
        });
    }
});

/**
 * PATCH /competition/admin/config/:id/rules
 */
router.patch('/admin/config/:id/rules', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { rules } = req.body;
        const userId = req.user.userId;

        // Validate that weights sum to 100
        const totalWeight =
            (rules.directReferralsWeight || 0) +
            (rules.teamSizeWeight || 0) +
            (rules.tradingVolumeWeight || 0) +
            (rules.profitabilityWeight || 0) +
            (rules.accountBalanceWeight || 0) +
            (rules.kycCompletionWeight || 0);

        if (totalWeight !== 100) {
            return res.status(400).json({
                success: false,
                message: `Total weight must equal 100%. Current total: ${totalWeight}%`,
            });
        }

        const config = await Competition.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        config.rules = rules;
        config.updatedBy = userId;
        config.version += 1;

        await config.save();

        res.json({
            success: true,
            message: 'Scoring rules updated successfully',
            config,
        });
    } catch (error) {
        console.error('Error updating rules:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update scoring rules',
            error: error.message,
        });
    }
});

/**
 * PATCH /competition/admin/config/:id/period
 */
router.patch('/admin/config/:id/period', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { period } = req.body;
        const userId = req.user.userId;

        // Validate dates
        if (period.startDate && period.endDate) {
            const startDate = new Date(period.startDate);
            const endDate = new Date(period.endDate);

            if (endDate <= startDate) {
                return res.status(400).json({
                    success: false,
                    message: 'End date must be after start date',
                });
            }
        }

        const config = await Competition.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        config.period = { ...config.period, ...period };
        config.updatedBy = userId;
        config.version += 1;

        await config.save();

        res.json({
            success: true,
            message: 'Competition period updated successfully',
            config,
        });
    } catch (error) {
        console.error('Error updating period:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update competition period',
            error: error.message,
        });
    }
});

/**
 * DELETE /competition/admin/config/:id
 */
router.delete('/admin/config/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const config = await Competition.findById(id);

        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        // Soft delete - just disable it
        config.competitionEnabled = false;
        config.period.active = false;
        await config.save();

        res.json({
            success: true,
            message: 'Competition configuration deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting competition config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete competition configuration',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/stats
 */
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalConfigs = await Competition.countDocuments();
        const activeConfigs = await Competition.countDocuments({
            competitionEnabled: true,
            'period.active': true
        });

        const latestConfig = await Competition.getActiveConfig();

        res.json({
            success: true,
            stats: {
                totalConfigs,
                activeConfigs,
                latestVersion: latestConfig?.version || 0,
                isCurrentlyActive: latestConfig?.isActive() || false,
            },
            latestConfig,
        });
    } catch (error) {
        console.error('Error fetching competition stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition statistics',
            error: error.message,
        });
    }
});

/**
 * POST /competition/admin/config/:id/duplicate
 */
router.post('/admin/config/:id/duplicate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const originalConfig = await Competition.findById(id).lean();

        if (!originalConfig) {
            return res.status(404).json({
                success: false,
                message: 'Competition configuration not found',
            });
        }

        // Remove _id and timestamps
        delete originalConfig._id;
        delete originalConfig.createdAt;
        delete originalConfig.updatedAt;

        // Create new config based on original
        const newConfig = new Competition({
            ...originalConfig,
            createdBy: userId,
            updatedBy: userId,
            version: 1,
            period: {
                ...originalConfig.period,
                description: `${originalConfig.period.description} (Copy)`,
            },
        });

        await newConfig.save();

        res.status(201).json({
            success: true,
            message: 'Competition configuration duplicated successfully',
            config: newConfig,
        });
    } catch (error) {
        console.error('Error duplicating competition config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to duplicate competition configuration',
            error: error.message,
        });
    }
});

/**
 * POST /competition/admin/seed
 * Manually trigger seeding of default configuration
 */
router.post('/admin/seed', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const existingConfig = await Competition.findOne();

        if (existingConfig) {
            return res.status(400).json({
                success: false,
                message: 'Configuration already exists. Use duplicate or create new instead.',
            });
        }

        const config = await Competition.seedDefaultConfig();

        res.status(201).json({
            success: true,
            message: 'Default configuration seeded successfully',
            config,
        });
    } catch (error) {
        console.error('Error seeding configuration:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to seed default configuration',
            error: error.message,
        });
    }
});

export default router;