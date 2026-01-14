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

        // Fetch Account Info (for member_id and other data)
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
        const memberId = accountData.id || accountData.member_id;

        // NEW: Fetch child accounts to get accurate balance
        let walletBalance = 0;
        let tradingBalance = 0;
        let totalGTCBalance = 0;

        try {
            const childAccountsResponse = await gtcAxios.post(
                '/api/v3/agent/query_child_accounts',
                { member_id: memberId },
                { headers: authHeader }
            );

            if (childAccountsResponse.data.code === 200) {
                const childData = childAccountsResponse.data.data;

                // Get wallet balance
                walletBalance = parseFloat(childData.wallet?.amount || 0);

                // Get total trading balance from all MT accounts
                if (childData.mt_account && Array.isArray(childData.mt_account)) {
                    tradingBalance = childData.mt_account.reduce((sum, account) => {
                        return sum + parseFloat(account.balance || 0);
                    }, 0);
                }

                // Total GTC Balance = Wallet + All MT Account Balances
                totalGTCBalance = walletBalance + tradingBalance;
            } else {
                console.warn('Could not fetch child accounts, using fallback balance');
                // Fallback to account_info balance if child accounts API fails
                totalGTCBalance = parseFloat(accountData.amount || 0);
                walletBalance = totalGTCBalance;
                tradingBalance = 0;
            }
        } catch (err) {
            console.warn('Error fetching child accounts:', err.message);
            // Fallback to account_info balance
            totalGTCBalance = parseFloat(accountData.amount || 0);
            walletBalance = totalGTCBalance;
            tradingBalance = 0;
        }

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

        // Calculate metrics using account_info data for profit/loss
        const totalProfit = parseFloat(accountData.total_profit || 0);
        const totalLoss = parseFloat(accountData.total_loss || 0);

        // Use totalGTCBalance from child accounts instead of accountData.amount
        const equity = parseFloat(accountData.equity || totalGTCBalance);

        const netProfit = totalProfit - totalLoss;
        const profitPercent = totalGTCBalance > 0 ? (netProfit / totalGTCBalance) * 100 : 0;
        const winRate = totalProfit + totalLoss > 0 ? (totalProfit / (totalProfit + totalLoss)) * 100 : 0;

        // Trading volume
        let totalVolumeLots = 0;
        profitLogs.forEach(log => {
            totalVolumeLots += parseFloat(log.volume || 0);
        });

        const gtcTeamSize = memberData?.total || 0;
        const gtcDirectMembers = memberData?.list?.filter(m => m.level === 1).length || 0;

        return {
            // Use total GTC balance (wallet + all MT accounts)
            accountBalance: totalGTCBalance, // For backward compatibility
            walletBalance: walletBalance,
            tradingBalance: tradingBalance,
            totalGTCBalance: totalGTCBalance,

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
 * Calculate competition score using competition config
 */
async function calculateCompetitionScore(user, gtcData, competition) {
    const { rules, normalizationTargets } = competition;

    let scores = {
        directReferrals: 0,
        teamSize: 0,
        tradingVolume: 0,
        profitability: 0,
        accountBalance: 0,
    };

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

    // 5. Account Balance Score - USE TOTAL GTC BALANCE
    const accountBalance = gtcData?.totalGTCBalance || 0;
    scores.accountBalance = Math.min(
        accountBalance / normalizationTargets.accountBalanceTarget,
        1
    ) * rules.accountBalanceWeight;

    const baseScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const totalScore = baseScore;

    return {
        totalScore: parseFloat(totalScore.toFixed(2)),
        baseScore: parseFloat(baseScore.toFixed(2)),
        breakdown: {
            directReferralsScore: parseFloat(scores.directReferrals.toFixed(2)),
            teamSizeScore: parseFloat(scores.teamSize.toFixed(2)),
            tradingVolumeScore: parseFloat(scores.tradingVolume.toFixed(2)),
            profitabilityScore: parseFloat(scores.profitability.toFixed(2)),
            accountBalanceScore: parseFloat(scores.accountBalance.toFixed(2)),
        },
        metrics: {
            directReferrals,
            nupipsTeamSize,
            gtcTeamSize: gtcData?.gtcTeamSize || 0,
            tradingVolumeLots: parseFloat((gtcData?.totalVolumeLots || 0).toFixed(2)),
            tradingVolumeDollars: parseFloat((volumeInDollars).toFixed(2)),
            profitPercent: parseFloat((gtcData?.profitPercent || 0).toFixed(2)),
            winRate: parseFloat((gtcData?.winRate || 0).toFixed(2)),
            // Show total GTC balance in metrics
            totalGTCBalance: parseFloat((gtcData?.totalGTCBalance || 0).toFixed(2)),
            walletBalance: parseFloat((gtcData?.walletBalance || 0).toFixed(2)),
            tradingBalance: parseFloat((gtcData?.tradingBalance || 0).toFixed(2)),
            accountBalance: parseFloat((gtcData?.totalGTCBalance || 0).toFixed(2)), // For backward compatibility
            equity: parseFloat((gtcData?.equity || 0).toFixed(2)),
            totalTrades: gtcData?.totalTrades || 0,
            isAgent: gtcData?.isAgent || false,
        },
        username: user.username,
        name: user.name,
        email: user.email,
    };
}

/**
 * Helper function to determine reward for a given rank
 */
function getRewardForRank(rank, rewards) {
    if (!rank || !rewards || rewards.length === 0) return null;
    const reward = rewards.find(r => rank >= r.minRank && rank <= r.maxRank);
    return reward || null;
}

/**
 * Generate slug from title
 */
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

// ==================== USER ROUTES ====================

/**
 * GET /competition/list - Get all competitions
 */
router.get('/list', authenticateToken, async (req, res) => {
    try {
        const { status, includeAll = 'false' } = req.query;
        const userId = req.user.userId;

        let query = {};

        if (status) {
            query.status = status;
        } else if (includeAll === 'false') {
            query.status = { $in: ['active', 'upcoming'] };
        }

        const competitions = await Competition.find(query)
            .select('-participants -stats')
            .sort({ startDate: -1 })
            .lean();

        const user = await User.findById(userId)
            .select('gtcfx')
            .lean();

        const hasGTCAccount = !!(user?.gtcfx?.accessToken);

        const enrichedCompetitions = competitions.map(comp => ({
            ...comp,
            isActive: comp.status === 'active',
            isUpcoming: comp.status === 'upcoming',
            isCompleted: comp.status === 'completed',
            canView: !(comp.requirements?.requiresGTCAccount) || hasGTCAccount,
            requiresConnection: (comp.requirements?.requiresGTCAccount) && !hasGTCAccount,
            userParticipating: false,
        }));

        res.json({
            success: true,
            competitions: enrichedCompetitions,
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competitions',
            error: error.message,
        });
    }
});

/**
 * GET /competition/:slug - Get specific competition details
 */
router.get('/:slug', authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;

        const competition = await Competition.findOne({ slug })
            .select('-participants')
            .lean();

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        res.json({
            success: true,
            competition: {
                ...competition,
                isActive: competition.status === 'active',
                isUpcoming: competition.status === 'upcoming',
                isCompleted: competition.status === 'completed',
            },
        });
    } catch (error) {
        console.error('Error fetching competition:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition',
            error: error.message,
        });
    }
});

/**
 * GET /competition/:slug/leaderboard
 */
router.get('/:slug/leaderboard', authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const { limit = 100 } = req.query;
        const currentUserId = req.user.userId;

        const competition = await Competition.findOne({ slug });

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        if (!competition.isActive() && !competition.isCompleted()) {
            return res.json({
                success: true,
                active: false,
                message: 'Competition is not currently active',
                leaderboard: [],
                userRank: null,
            });
        }

        const currentUser = await User.findById(currentUserId)
            .select('gtcfx')
            .lean();

        const hasGTCAccount = !!(currentUser?.gtcfx?.accessToken);

        if (competition.requirements?.requiresGTCAccount && !hasGTCAccount) {
            return res.status(403).json({
                success: false,
                message: 'GTC account connection required to view this leaderboard',
                requiresConnection: true,
            });
        }

        const leaderboard = competition.participants
            .sort((a, b) => b.score - a.score)
            .slice(0, parseInt(limit))
            .map(p => ({
                userId: p.userId.toString(),
                name: p.name,
                username: p.username,
                email: p.email,
                rank: p.rank,
                score: p.score,
                baseScore: p.scoreBreakdown?.baseScore,
                breakdown: p.scoreBreakdown?.breakdown,
                metrics: p.scoreBreakdown?.metrics,
                isAgent: p.scoreBreakdown?.metrics?.isAgent,
                lastCalculated: p.lastCalculated,
            }));

        const userParticipant = competition.participants.find(
            p => p.userId.toString() === currentUserId
        );

        let userRank = null;
        if (userParticipant) {
            userRank = {
                userId: userParticipant.userId.toString(),
                name: userParticipant.name,
                username: userParticipant.username,
                rank: userParticipant.rank,
                score: userParticipant.score,
                baseScore: userParticipant.scoreBreakdown?.baseScore,
                breakdown: userParticipant.scoreBreakdown?.breakdown,
                metrics: userParticipant.scoreBreakdown?.metrics,
                eligibleReward: getRewardForRank(userParticipant.rank, competition.rewards),
                lastCalculated: userParticipant.lastCalculated,
            };
        }

        res.json({
            success: true,
            competition: {
                id: competition._id,
                title: competition.title,
                slug: competition.slug,
                status: competition.status,
                startDate: competition.startDate,
                endDate: competition.endDate,
            },
            leaderboard,
            userRank,
            stats: competition.stats,
            rules: competition.rules,
            rewards: competition.rewards,
        });

    } catch (error) {
        console.error('Competition leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition leaderboard',
            error: error.message,
        });
    }
});

/**
 * POST /competition/:slug/calculate-my-score
 */
router.post('/:slug/calculate-my-score', authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.userId;

        const competition = await Competition.findOne({ slug });

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        if (!competition.isActive()) {
            return res.status(400).json({
                success: false,
                message: 'Competition is not currently active',
            });
        }

        const user = await User.findById(userId)
            .select('name username email gtcfx referralDetails userType')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (competition.requirements?.requiresGTCAccount && !user.gtcfx?.accessToken) {
            return res.status(403).json({
                success: false,
                message: 'GTC account connection required',
                requiresConnection: true,
            });
        }

        const gtcData = await fetchGTCData(user);

        if (competition.requirements?.requiresGTCAccount && !gtcData) {
            return res.status(400).json({
                success: false,
                message: 'Unable to fetch GTC FX data',
            });
        }

        const participationCheck = competition.canUserParticipate(user, gtcData);
        if (!participationCheck.canParticipate) {
            return res.status(403).json({
                success: false,
                message: participationCheck.reason,
            });
        }

        const scoreData = await calculateCompetitionScore(user, gtcData, competition);

        competition.updateParticipantScore(userId, scoreData);

        await competition.save();

        const updatedParticipant = competition.participants.find(
            p => p.userId.toString() === userId
        );

        res.json({
            success: true,
            message: 'Score calculated and updated successfully',
            ranking: {
                rank: updatedParticipant.rank,
                score: scoreData.totalScore,
                baseScore: scoreData.baseScore,
                eligibleReward: getRewardForRank(updatedParticipant.rank, competition.rewards),
            },
            breakdown: scoreData.breakdown,
            metrics: scoreData.metrics,
        });

    } catch (error) {
        console.error('Calculate score error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate score',
            error: error.message,
        });
    }
});

/**
 * GET /competition/:slug/my-stats
 */
router.get('/:slug/my-stats', authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.userId;

        const competition = await Competition.findOne({ slug });

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        const user = await User.findById(userId)
            .select('name username email gtcfx userType')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const hasGTCAccount = !!(user.gtcfx?.accessToken);

        if (competition.requirements?.requiresGTCAccount && !hasGTCAccount) {
            return res.json({
                success: true,
                connected: false,
                message: 'GTC account connection required',
                requiresConnection: true,
                competition: {
                    title: competition.title,
                    slug: competition.slug,
                    status: competition.status,
                },
            });
        }

        const participant = competition.participants.find(
            p => p.userId.toString() === userId
        );

        if (!participant) {
            return res.json({
                success: true,
                participating: false,
                message: 'You have not participated in this competition yet. Calculate your score to participate.',
                competition: {
                    title: competition.title,
                    slug: competition.slug,
                    status: competition.status,
                },
            });
        }

        const gtcData = await fetchGTCData(user);

        res.json({
            success: true,
            participating: true,
            connected: true,
            user: {
                name: user.name,
                username: user.username,
                userType: user.userType,
            },
            competition: {
                title: competition.title,
                slug: competition.slug,
                status: competition.status,
                startDate: competition.startDate,
                endDate: competition.endDate,
            },
            ranking: {
                rank: participant.rank,
                score: participant.score,
                baseScore: participant.scoreBreakdown?.baseScore,
                eligibleReward: getRewardForRank(participant.rank, competition.rewards),
                lastCalculated: participant.lastCalculated,
            },
            breakdown: participant.scoreBreakdown?.breakdown,
            metrics: participant.scoreBreakdown?.metrics,
            gtcAccountInfo: gtcData ? {
                // Show total balance only
                balance: gtcData.totalGTCBalance,
                walletBalance: gtcData.walletBalance,
                tradingBalance: gtcData.tradingBalance,
                equity: gtcData.equity,
                margin: gtcData.margin,
                freeMargin: gtcData.freeMargin,
                marginLevel: gtcData.marginLevel,
            } : null,
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

// ==================== ADMIN ROUTES ====================

/**
 * POST /competition/admin/create
 */
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const userId = req.user.userId;
        const competitionData = req.body;

        // Validate required fields
        if (!competitionData.title || !competitionData.description) {
            return res.status(400).json({
                success: false,
                message: 'Title and description are required',
            });
        }

        if (!competitionData.startDate || !competitionData.endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required',
            });
        }

        // Generate slug
        const slug = competitionData.slug || generateSlug(competitionData.title);

        // Check if slug exists
        const existingCompetition = await Competition.findOne({ slug });
        if (existingCompetition) {
            return res.status(400).json({
                success: false,
                message: 'A competition with this slug already exists',
            });
        }

        // Validate that weights sum to 100
        if (competitionData.rules) {
            const totalWeight =
                (competitionData.rules.directReferralsWeight || 0) +
                (competitionData.rules.teamSizeWeight || 0) +
                (competitionData.rules.tradingVolumeWeight || 0) +
                (competitionData.rules.profitabilityWeight || 0) +
                (competitionData.rules.accountBalanceWeight || 0);

            if (totalWeight !== 100) {
                return res.status(400).json({
                    success: false,
                    message: `Total weight must equal 100%. Current total: ${totalWeight}%`,
                });
            }
        }

        // Validate rewards
        if (competitionData.rewards && competitionData.rewards.length > 0) {
            for (const reward of competitionData.rewards) {
                if (!reward.minRank || !reward.maxRank || !reward.title || !reward.prize) {
                    return res.status(400).json({
                        success: false,
                        message: 'All reward fields are required',
                    });
                }
                if (reward.minRank > reward.maxRank) {
                    return res.status(400).json({
                        success: false,
                        message: 'Min rank cannot be greater than max rank',
                    });
                }
            }
        }

        const competition = new Competition({
            ...competitionData,
            slug,
            createdBy: userId,
            updatedBy: userId,
        });

        await competition.save();

        res.status(201).json({
            success: true,
            message: 'Competition created successfully',
            competition,
        });
    } catch (error) {
        console.error('Error creating competition:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create competition',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/list
 */
router.get('/admin/list', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;

        let query = {};
        if (status) {
            query.status = status;
        }

        const competitions = await Competition.find(query)
            .select('-participants')
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name username')
            .populate('updatedBy', 'name username')
            .lean();

        res.json({
            success: true,
            competitions,
        });
    } catch (error) {
        console.error('Error fetching competitions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competitions',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/:id
 */
router.get('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const competition = await Competition.findById(id)
            .populate('createdBy', 'name username email')
            .populate('updatedBy', 'name username email')
            .lean();

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        res.json({
            success: true,
            competition,
        });
    } catch (error) {
        console.error('Error fetching competition:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch competition',
            error: error.message,
        });
    }
});

/**
 * PUT /competition/admin/:id
 */
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const updateData = req.body;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        // Prevent updating completed competitions
        if (competition.status === 'completed' && updateData.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify completed competition',
            });
        }

        // If slug is empty, generate from title
        if (updateData.slug === '' && updateData.title) {
            updateData.slug = generateSlug(updateData.title);
        }

        // Validate that weights sum to 100 if rules are being updated
        if (updateData.rules) {
            const totalWeight =
                (updateData.rules.directReferralsWeight || 0) +
                (updateData.rules.teamSizeWeight || 0) +
                (updateData.rules.tradingVolumeWeight || 0) +
                (updateData.rules.profitabilityWeight || 0) +
                (updateData.rules.accountBalanceWeight || 0);

            if (totalWeight !== 100) {
                return res.status(400).json({
                    success: false,
                    message: `Total weight must equal 100%. Current total: ${totalWeight}%`,
                });
            }
        }

        // Validate rewards if provided
        if (updateData.rewards && updateData.rewards.length > 0) {
            for (const reward of updateData.rewards) {
                if (!reward.minRank || !reward.maxRank || !reward.title || !reward.prize) {
                    return res.status(400).json({
                        success: false,
                        message: 'All reward fields are required',
                    });
                }
                if (reward.minRank > reward.maxRank) {
                    return res.status(400).json({
                        success: false,
                        message: 'Min rank cannot be greater than max rank',
                    });
                }
            }
        }

        // Update fields
        Object.keys(updateData).forEach(key => {
            if (key !== '_id' && key !== 'createdAt' && key !== 'createdBy' && key !== 'participants' && key !== 'stats') {
                competition[key] = updateData[key];
            }
        });

        competition.updatedBy = userId;
        competition.version += 1;

        await competition.save();

        res.json({
            success: true,
            message: 'Competition updated successfully',
            competition,
        });
    } catch (error) {
        console.error('Error updating competition:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update competition',
            error: error.message,
        });
    }
});

/**
 * DELETE /competition/admin/:id
 */
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        // Soft delete - cancel it
        competition.status = 'cancelled';
        await competition.save();

        res.json({
            success: true,
            message: 'Competition cancelled successfully',
        });
    } catch (error) {
        console.error('Error deleting competition:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete competition',
            error: error.message,
        });
    }
});

/**
 * POST /competition/admin/:id/duplicate
 */
router.post('/admin/:id/duplicate', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const originalCompetition = await Competition.findById(id).lean();

        if (!originalCompetition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        // Remove _id, timestamps, and participants
        delete originalCompetition._id;
        delete originalCompetition.createdAt;
        delete originalCompetition.updatedAt;
        delete originalCompetition.participants;
        delete originalCompetition.stats;

        // Generate new slug
        const newSlug = `${originalCompetition.slug}-copy-${Date.now()}`;

        const newCompetition = new Competition({
            ...originalCompetition,
            title: `${originalCompetition.title} (Copy)`,
            slug: newSlug,
            status: 'draft',
            createdBy: userId,
            updatedBy: userId,
            version: 1,
        });

        await newCompetition.save();

        res.status(201).json({
            success: true,
            message: 'Competition duplicated successfully',
            competition: newCompetition,
        });
    } catch (error) {
        console.error('Error duplicating competition:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to duplicate competition',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/:id/participants
 */
router.get('/admin/:id/participants', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 100, sortBy = 'rank' } = req.query;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        let participants = [...competition.participants];

        // Sort
        if (sortBy === 'score') {
            participants.sort((a, b) => b.score - a.score);
        } else if (sortBy === 'rank') {
            participants.sort((a, b) => (a.rank || 0) - (b.rank || 0));
        } else if (sortBy === 'name') {
            participants.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }

        const limitedParticipants = participants.slice(0, parseInt(limit));

        res.json({
            success: true,
            competition: {
                id: competition._id,
                title: competition.title,
                slug: competition.slug,
                status: competition.status,
            },
            participants: limitedParticipants,
            stats: competition.stats,
        });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch participants',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/:id/winners
 */
router.get('/admin/:id/winners', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        // Get all participants who are eligible for rewards
        const winners = competition.participants
            .filter(p => {
                const reward = getRewardForRank(p.rank, competition.rewards);
                return reward !== null;
            })
            .sort((a, b) => (a.rank || 0) - (b.rank || 0))
            .map(p => ({
                userId: p.userId,
                name: p.name,
                username: p.username,
                email: p.email,
                rank: p.rank,
                score: p.score,
                reward: getRewardForRank(p.rank, competition.rewards),
                scoreBreakdown: p.scoreBreakdown,
                lastCalculated: p.lastCalculated,
            }));

        res.json({
            success: true,
            competition: {
                id: competition._id,
                title: competition.title,
                slug: competition.slug,
                status: competition.status,
                startDate: competition.startDate,
                endDate: competition.endDate,
            },
            winners,
            totalWinners: winners.length,
            rewards: competition.rewards,
        });
    } catch (error) {
        console.error('Error fetching winners:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch winners',
            error: error.message,
        });
    }
});

/**
 * POST /competition/admin/:id/recalculate-all
 */
router.post('/admin/:id/recalculate-all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        if (!competition.isActive()) {
            return res.status(400).json({
                success: false,
                message: 'Can only recalculate scores for active competitions',
            });
        }

        // Get all users with GTC accounts
        const users = await User.find({
            'gtcfx.accessToken': { $ne: null },
            status: 'active',
        }).select('name username email gtcfx referralDetails userType').lean();

        let successCount = 0;
        let errorCount = 0;

        for (const user of users) {
            try {
                const gtcData = await fetchGTCData(user);
                if (!gtcData) continue;

                const participationCheck = competition.canUserParticipate(user, gtcData);
                if (!participationCheck.canParticipate) continue;

                const scoreData = await calculateCompetitionScore(user, gtcData, competition);

                competition.updateParticipantScore(user._id, scoreData);

                successCount++;
            } catch (error) {
                console.error(`Error processing user ${user.username}:`, error.message);
                errorCount++;
            }
        }

        await competition.save();

        res.json({
            success: true,
            message: 'Scores recalculated successfully',
            stats: {
                successCount,
                errorCount,
                totalParticipants: competition.stats.totalParticipants,
            },
            competition: {
                id: competition._id,
                title: competition.title,
                stats: competition.stats,
            },
        });
    } catch (error) {
        console.error('Error recalculating scores:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to recalculate scores',
            error: error.message,
        });
    }
});

/**
 * PATCH /competition/admin/:id/status
 */
router.patch('/admin/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.userId;

        // Validate MongoDB ObjectId
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid competition ID',
            });
        }

        if (!['draft', 'upcoming', 'active', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const competition = await Competition.findById(id);

        if (!competition) {
            return res.status(404).json({
                success: false,
                message: 'Competition not found',
            });
        }

        competition.status = status;
        competition.updatedBy = userId;

        await competition.save();

        res.json({
            success: true,
            message: 'Competition status updated successfully',
            competition,
        });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message,
        });
    }
});

/**
 * GET /competition/admin/stats/overview
 */
router.get('/admin/stats/overview', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalCompetitions = await Competition.countDocuments();
        const activeCompetitions = await Competition.countDocuments({ status: 'active' });
        const upcomingCompetitions = await Competition.countDocuments({ status: 'upcoming' });
        const completedCompetitions = await Competition.countDocuments({ status: 'completed' });

        // Get total participants across all competitions
        const competitions = await Competition.find().select('participants').lean();
        let totalParticipations = 0;
        let uniqueParticipants = new Set();

        competitions.forEach(comp => {
            if (comp.participants && comp.participants.length > 0) {
                totalParticipations += comp.participants.length;
                comp.participants.forEach(p => {
                    uniqueParticipants.add(p.userId.toString());
                });
            }
        });

        res.json({
            success: true,
            stats: {
                totalCompetitions,
                activeCompetitions,
                upcomingCompetitions,
                completedCompetitions,
                totalParticipations,
                uniqueParticipants: uniqueParticipants.size,
            },
        });
    } catch (error) {
        console.error('Error fetching overview stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overview stats',
            error: error.message,
        });
    }
});

export default router;