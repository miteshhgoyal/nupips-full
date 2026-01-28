// backend/src/routes/competition.routes.js
import express from 'express';
import axios from 'axios';
import https from 'https';
import User from '../models/User.js';
import Competition from '../models/Competition.js';
import GTCMember from '../models/GTCMember.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==================== MIDDLEWARE ====================

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

// ==================== AXIOS INSTANCE ====================

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

// ==================== HELPER FUNCTIONS ====================

/**
 * Count KYC-completed users in downline tree using member_tree API
 */
async function countDownlineKYC(authHeader) {
    try {
        const response = await gtcAxios.post(
            '/api/v3/agent/member_tree',
            {},
            { headers: authHeader }
        );

        if (response.data.code !== 200 || !response.data.data) {
            return 0;
        }

        // Recursively count KYC completed members in tree
        function countKYCInTree(node) {
            let count = 0;
            
            // Check current node
            if (node.kyc_status === 'completed') {
                count++;
            }
            
            // Check children
            if (node.children && Array.isArray(node.children)) {
                for (const child of node.children) {
                    count += countKYCInTree(child);
                }
            }
            
            return count;
        }

        return countKYCInTree(response.data.data);
    } catch (err) {
        console.warn('Error counting downline KYC:', err.message);
        return 0;
    }
}

/**
 * Fetch balance information from child accounts
 */
async function fetchBalanceInfo(memberId, authHeader) {
    try {
        const response = await gtcAxios.post(
            '/api/v3/agent/query_child_accounts',
            { member_id: memberId },
            { headers: authHeader }
        );

        if (response.data.code === 200) {
            const childData = response.data.data;

            // Wallet balance (already in USD)
            const walletBalance = parseFloat(childData.wallet?.amount || 0);

            // Trading balance - sum all MT5 accounts with currency conversion
            const tradingBalance = (childData.mt_account || []).reduce((sum, account) => {
                const balance = parseFloat(account.balance || 0);
                const currency = account.currency?.toUpperCase();

                // USC is cents, so divide by 100 to convert to USD
                // USD is already in dollars
                if (currency === 'USC') {
                    return sum + (balance / 100);
                } else if (currency === 'USD') {
                    return sum + balance;
                } else {
                    console.warn(`Unknown currency: ${currency} for account ${account.loginid}`);
                    return sum + balance;
                }
            }, 0);

            return {
                walletBalance,
                tradingBalance,
                totalGTCBalance: walletBalance + tradingBalance,
                mtAccounts: (childData.mt_account || []).map(account => ({
                    loginId: account.loginid,
                    accountName: account.account_name,
                    balance: parseFloat(account.balance || 0),
                    balanceUSD: account.currency?.toUpperCase() === 'USC'
                        ? parseFloat(account.balance || 0) / 100
                        : parseFloat(account.balance || 0),
                    credit: parseFloat(account.credit || 0),
                    equity: parseFloat(account.equity || 0),
                    margin: parseFloat(account.margin || 0),
                    currency: account.currency
                }))
            };
        }

        return null;
    } catch (err) {
        console.warn('Error fetching child accounts:', err.message);
        return null;
    }
}

/**
 * Fetch self-trading profit from member_pnl API
 */
async function fetchSelfTradingProfit(memberId, authHeader, competition = null) {
    let totalProfit = 0;
    let totalLoss = 0;
    let totalTrades = 0;
    let totalVolumeLots = 0;

    try {
        let payload = { member_id: memberId };

        // Add date range if competition is provided
        if (competition) {
            payload.start_date = new Date(competition.startDate).toISOString().split('T')[0];
            payload.end_date = new Date(competition.endDate).toISOString().split('T')[0];
        }

        const response = await gtcAxios.post(
            '/api/v3/agent/member_pnl',
            payload,
            { headers: authHeader }
        );

        if (response.data.code === 200) {
            const pnlData = response.data.data;

            // Process MT trade data
            if (pnlData.mt_trade) {
                const mtPnl = parseFloat(pnlData.mt_trade.total_pnl || 0);
                if (mtPnl > 0) {
                    totalProfit += mtPnl;
                } else {
                    totalLoss += Math.abs(mtPnl);
                }
                totalTrades += (pnlData.mt_trade.list || []).length;

                // Calculate volume
                if (pnlData.mt_trade.list && Array.isArray(pnlData.mt_trade.list)) {
                    totalVolumeLots = pnlData.mt_trade.list.reduce((sum, trade) => {
                        return sum + (parseFloat(trade.volume || 0) / 100); // Convert to lots
                    }, 0);
                }
            }

            // Process smart copy data
            if (pnlData.smart_copy) {
                const scPnl = parseFloat(pnlData.smart_copy.total_pnl || 0);
                if (scPnl > 0) {
                    totalProfit += scPnl;
                } else {
                    totalLoss += Math.abs(scPnl);
                }
                totalTrades += (pnlData.smart_copy.list || []).length;
            }
        }
    } catch (err) {
        console.warn('Could not fetch member P&L:', err.message);
    }

    const netProfit = totalProfit - totalLoss;

    return {
        selfTradingProfit: netProfit,
        totalProfit,
        totalLoss,
        totalTrades,
        totalVolumeLots
    };
}

/**
 * Fetch PAMM trading profit from share_profit_log API
 */
async function fetchPAMMProfit(memberId, authHeader, competition = null) {
    let pammProfit = 0;
    let pammTotalInvestment = 0;
    let pammDetails = [];

    try {
        let payload = {
            copy_id: 0,
            page: 1,
            page_size: 1000
        };

        // Add timestamps if competition is provided
        if (competition) {
            payload.start_time = Math.floor(new Date(competition.startDate).getTime() / 1000);
            payload.end_time = Math.floor(new Date(competition.endDate).getTime() / 1000);
        }

        const response = await gtcAxios.post(
            '/api/v3/agent/share_profit_log',
            payload,
            { headers: authHeader }
        );

        if (response.data.code === 200) {
            const data = response.data.data;

            if (data.summary) {
                pammProfit = parseFloat(data.summary.copy_earn || 0);
                pammTotalInvestment = parseFloat(data.summary.total_investment || 0);
            }

            if (data.list && Array.isArray(data.list)) {
                pammDetails = data.list.map(item => ({
                    strategyId: item.strategy_id,
                    strategyName: item.strategy_name,
                    copyProfit: parseFloat(item.copy_profit || 0),
                    copyEarn: parseFloat(item.copy_earn || 0),
                    copyAmount: parseFloat(item.copy_amount || 0),
                    settleTime: item.settle_time
                }));
            }
        }
    } catch (err) {
        console.warn('Could not fetch PAMM profit:', err.message);
    }

    return {
        pammProfit,
        pammTotalInvestment,
        pammDetails
    };
}

/**
 * Fetch team/referral information using member_tree API
 */
async function fetchTeamInfo(authHeader) {
    try {
        // Use member_tree for accurate team data
        const response = await gtcAxios.post(
            '/api/v3/agent/member_tree',
            {},
            { headers: authHeader }
        );

        if (response.data.code === 200 && response.data.data) {
            // Count direct members and total team size from tree
            function countMembers(node, isDirect = true) {
                let directCount = 0;
                let totalCount = 0;
                
                if (node.children && Array.isArray(node.children)) {
                    directCount = node.children.length;
                    totalCount = node.children.length;
                    
                    // Recursively count all descendants
                    for (const child of node.children) {
                        const childCounts = countMembers(child, false);
                        totalCount += childCounts.totalCount;
                    }
                }
                
                return { directCount, totalCount };
            }
            
            const counts = countMembers(response.data.data);
            
            return {
                gtcTeamSize: counts.totalCount,
                gtcDirectMembers: counts.directCount
            };
        }

        return { gtcTeamSize: 0, gtcDirectMembers: 0 };
    } catch (err) {
        console.warn('Could not fetch member tree data:', err.message);
        return { gtcTeamSize: 0, gtcDirectMembers: 0 };
    }
}

/**
 * Main function to fetch complete GTC FX data for a user
 */
async function fetchGTCData(user, competition = null) {
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
        const memberId = accountData.id || accountData.member_id;

        // 2. Fetch Balance Information
        const balanceInfo = await fetchBalanceInfo(memberId, authHeader);
        let walletBalance = 0;
        let tradingBalance = 0;
        let totalGTCBalance = 0;

        if (balanceInfo) {
            walletBalance = balanceInfo.walletBalance;
            tradingBalance = balanceInfo.tradingBalance;
            totalGTCBalance = balanceInfo.totalGTCBalance;
        } else {
            totalGTCBalance = parseFloat(accountData.amount || 0);
            walletBalance = totalGTCBalance;
            tradingBalance = 0;
        }

        // 3. Fetch Self-Trading Profit
        const selfTradingData = await fetchSelfTradingProfit(memberId, authHeader, competition);

        // 4. Fetch PAMM Profit
        const pammData = await fetchPAMMProfit(memberId, authHeader, competition);

        // 5. Calculate Combined Profit
        const totalProfit = selfTradingData.totalProfit;
        const totalLoss = selfTradingData.totalLoss;
        const selfTradingProfit = selfTradingData.selfTradingProfit;
        const pammProfit = pammData.pammProfit;
        const netProfit = selfTradingProfit + pammProfit;

        // 6. Fetch Team Info
        const teamInfo = await fetchTeamInfo(authHeader);

        // 7. Fetch KYC count if needed
        const kycCompletedCount = await countDownlineKYC(authHeader);

        // 8. Calculate metrics
        const equity = parseFloat(accountData.equity || totalGTCBalance);
        const profitPercent = totalGTCBalance > 0 ? (netProfit / totalGTCBalance) * 100 : 0;
        const winRate = totalProfit + totalLoss > 0
            ? (totalProfit / (totalProfit + totalLoss)) * 100
            : 0;

        // 9. Return complete data object
        return {
            // Balance fields
            accountBalance: totalGTCBalance,
            walletBalance: walletBalance,
            tradingBalance: tradingBalance,
            totalGTCBalance: totalGTCBalance,
            equity: equity,
            margin: parseFloat(accountData.margin || 0),
            freeMargin: parseFloat(accountData.free_margin || 0),
            marginLevel: parseFloat(accountData.margin_level || 0),

            // Profit fields
            totalProfit: totalProfit,
            totalLoss: totalLoss,
            netProfit: netProfit,
            selfTradingProfit: selfTradingProfit,
            pammProfit: pammProfit,
            pammTotalInvestment: pammData.pammTotalInvestment,
            profitPercent: profitPercent,
            winRate: winRate,

            // Trading metrics
            totalVolumeLots: selfTradingData.totalVolumeLots,
            totalTrades: selfTradingData.totalTrades,

            // Account info
            accountLevel: parseInt(accountData.level || 0),
            isAgent: accountData.user_type === 'agent' || accountData.is_agent === 1,

            // Team info
            gtcTeamSize: teamInfo.gtcTeamSize,
            gtcDirectMembers: teamInfo.gtcDirectMembers,

            // KYC count
            kycCompletedCount: kycCompletedCount,

            // Raw data
            rawAccountData: accountData,
        };
    } catch (error) {
        console.error('Error fetching GTC data:', error.message);
        return null;
    }
}

/**
 * Calculate high watermark for a user (baseline at competition start)
 */
async function calculateHighWatermark(user, gtcData, competition) {
    const watermark = {
        capturedAt: new Date(),
        // NuPips data
        nupipsDirectReferrals: user.referralDetails?.totalDirectReferrals || 0,
        nupipsTeamSize: user.referralDetails?.totalDownlineUsers || 0,
        
        // GTC data
        gtcDirectMembers: gtcData?.gtcDirectMembers || 0,
        gtcTeamSize: gtcData?.gtcTeamSize || 0,
        gtcTradingVolumeLots: gtcData?.totalVolumeLots || 0,
        gtcTotalProfit: gtcData?.totalProfit || 0,
        gtcTotalLoss: gtcData?.totalLoss || 0,
        gtcSelfTradingProfit: gtcData?.selfTradingProfit || 0,
        gtcPammProfit: gtcData?.pammProfit || 0,
        gtcAccountBalance: gtcData?.totalGTCBalance || 0,
        gtcTotalTrades: gtcData?.totalTrades || 0,
        
        // KYC count
        kycCompletedCount: gtcData?.kycCompletedCount || 0,
    };
    
    return watermark;
}

/**
 * Calculate growth metrics during competition
 */
function calculateGrowthMetrics(user, gtcData, watermark, competition) {
    const growth = {};
    
    // Current values
    const currentNupipsReferrals = user.referralDetails?.totalDirectReferrals || 0;
    const currentGtcReferrals = gtcData?.gtcDirectMembers || 0;
    const currentNupipsTeam = user.referralDetails?.totalDownlineUsers || 0;
    const currentGtcTeam = gtcData?.gtcTeamSize || 0;
    
    // Direct referrals growth
    const nupipsReferralsGrowth = Math.max(0, currentNupipsReferrals - watermark.nupipsDirectReferrals);
    const gtcReferralsGrowth = Math.max(0, currentGtcReferrals - watermark.gtcDirectMembers);
    
    growth.directReferralsGrowth = 
        competition.rules.dataSource?.directReferrals === 'nupips' ? nupipsReferralsGrowth :
        competition.rules.dataSource?.directReferrals === 'gtc' ? gtcReferralsGrowth :
        Math.max(nupipsReferralsGrowth, gtcReferralsGrowth); // 'max'
    
    // Team size growth
    const nupipsTeamGrowth = Math.max(0, currentNupipsTeam - watermark.nupipsTeamSize);
    const gtcTeamGrowth = Math.max(0, currentGtcTeam - watermark.gtcTeamSize);
    
    growth.teamSizeGrowth = 
        competition.rules.dataSource?.teamSize === 'nupips' ? nupipsTeamGrowth :
        competition.rules.dataSource?.teamSize === 'gtc' ? gtcTeamGrowth :
        Math.max(nupipsTeamGrowth, gtcTeamGrowth); // 'max'
    
    // Trading volume growth (GTC only)
    const currentVolume = gtcData?.totalVolumeLots || 0;
    growth.tradingVolumeGrowth = Math.max(0, currentVolume - watermark.gtcTradingVolumeLots);
    
    // Profit growth (GTC only) - growth during competition period
    const currentProfit = gtcData?.totalProfit || 0;
    const currentLoss = gtcData?.totalLoss || 0;
    const watermarkNetProfit = watermark.gtcTotalProfit - watermark.gtcTotalLoss;
    const currentNetProfit = currentProfit - currentLoss;
    growth.profitGrowth = currentNetProfit - watermarkNetProfit;
    
    // Account balance growth
    const currentBalance = gtcData?.totalGTCBalance || 0;
    growth.accountBalanceGrowth = currentBalance - watermark.gtcAccountBalance;
    
    // KYC count growth
    const currentKycCount = gtcData?.kycCompletedCount || 0;
    growth.kycCountGrowth = Math.max(0, currentKycCount - watermark.kycCompletedCount);
    
    // Trades growth
    const currentTrades = gtcData?.totalTrades || 0;
    growth.tradesGrowth = Math.max(0, currentTrades - watermark.gtcTotalTrades);
    
    return growth;
}

/**
 * Calculate competition score based on GROWTH metrics
 */
function calculateCompetitionScoreWithGrowth(user, gtcData, growth, competition) {
    const { rules, normalizationTargets, kycConfig } = competition;
    
    const scores = {
        directReferrals: 0,
        teamSize: 0,
        tradingVolume: 0,
        profitability: 0,
        accountBalance: 0,
        kycCount: 0,
    };
    
    // 1. Direct Referrals Score (based on growth)
    scores.directReferrals = Math.min(
        growth.directReferralsGrowth / normalizationTargets.directReferralsTarget,
        1
    ) * rules.directReferralsWeight;
    
    // 2. Team Size Score (based on growth)
    scores.teamSize = Math.min(
        growth.teamSizeGrowth / normalizationTargets.teamSizeTarget,
        1
    ) * rules.teamSizeWeight;
    
    // 3. Trading Volume Score (based on growth in lots)
    const volumeInDollars = growth.tradingVolumeGrowth * 100000;
    scores.tradingVolume = Math.min(
        volumeInDollars / normalizationTargets.tradingVolumeTarget,
        1
    ) * rules.tradingVolumeWeight;
    
    // 4. Profitability Score (based on profit growth)
    const profitScore = growth.profitGrowth > 0 ? 
        Math.min(growth.profitGrowth / normalizationTargets.profitPercentTarget, 1) : 0;
    scores.profitability = profitScore * rules.profitabilityWeight;
    
    // 5. Account Balance Score (based on growth)
    scores.accountBalance = Math.min(
        Math.max(0, growth.accountBalanceGrowth) / normalizationTargets.accountBalanceTarget,
        1
    ) * rules.accountBalanceWeight;
    
    // 6. KYC Count Score (if enabled)
    if (kycConfig?.countDownlineKyc && kycConfig.kycWeight > 0) {
        scores.kycCount = Math.min(
            growth.kycCountGrowth / normalizationTargets.kycCountTarget,
            1
        ) * kycConfig.kycWeight;
    }
    
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    
    return {
        totalScore: parseFloat(totalScore.toFixed(2)),
        baseScore: parseFloat(totalScore.toFixed(2)),
        breakdown: {
            directReferralsScore: parseFloat(scores.directReferrals.toFixed(2)),
            teamSizeScore: parseFloat(scores.teamSize.toFixed(2)),
            tradingVolumeScore: parseFloat(scores.tradingVolume.toFixed(2)),
            profitabilityScore: parseFloat(scores.profitability.toFixed(2)),
            accountBalanceScore: parseFloat(scores.accountBalance.toFixed(2)),
            kycCountScore: parseFloat(scores.kycCount.toFixed(2)),
        },
        growth: {
            directReferralsGrowth: growth.directReferralsGrowth,
            teamSizeGrowth: growth.teamSizeGrowth,
            tradingVolumeGrowth: parseFloat(growth.tradingVolumeGrowth.toFixed(2)),
            tradingVolumeGrowthDollars: parseFloat((growth.tradingVolumeGrowth * 100000).toFixed(2)),
            profitGrowth: parseFloat(growth.profitGrowth.toFixed(2)),
            accountBalanceGrowth: parseFloat(growth.accountBalanceGrowth.toFixed(2)),
            kycCountGrowth: growth.kycCountGrowth,
            tradesGrowth: growth.tradesGrowth,
        },
        metrics: {
            // Current values
            nupipsDirectReferrals: user.referralDetails?.totalDirectReferrals || 0,
            nupipsTeamSize: user.referralDetails?.totalDownlineUsers || 0,
            gtcDirectMembers: gtcData?.gtcDirectMembers || 0,
            gtcTeamSize: gtcData?.gtcTeamSize || 0,
            tradingVolumeLots: parseFloat((gtcData?.totalVolumeLots || 0).toFixed(2)),
            netProfit: parseFloat((gtcData?.netProfit || 0).toFixed(2)),
            selfTradingProfit: parseFloat((gtcData?.selfTradingProfit || 0).toFixed(2)),
            pammProfit: parseFloat((gtcData?.pammProfit || 0).toFixed(2)),
            totalProfit: parseFloat((gtcData?.totalProfit || 0).toFixed(2)),
            totalLoss: parseFloat((gtcData?.totalLoss || 0).toFixed(2)),
            accountBalance: parseFloat((gtcData?.totalGTCBalance || 0).toFixed(2)),
            kycCompletedCount: gtcData?.kycCompletedCount || 0,
            totalTrades: gtcData?.totalTrades || 0,
            isAgent: gtcData?.isAgent || false,
        },
        username: user.username,
        name: user.name,
        email: user.email,
    };
}

/**
 * Helper to get reward for a given rank
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
                growth: p.scoreBreakdown?.growth, // NEW: growth metrics
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
                growth: userParticipant.scoreBreakdown?.growth, // NEW
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
                kycConfig: competition.kycConfig,
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
 * NEW: Captures high watermark on first participation, calculates growth-based score
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

        const gtcData = await fetchGTCData(user, competition);

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

        // Check if participant exists
        const existingParticipant = competition.participants.find(
            p => p.userId.toString() === userId
        );

        let watermark;
        let scoreData;

        if (!existingParticipant) {
            // NEW PARTICIPANT: Capture high watermark
            watermark = await calculateHighWatermark(user, gtcData, competition);
            
            // First calculation - growth is 0
            const zeroGrowth = {
                directReferralsGrowth: 0,
                teamSizeGrowth: 0,
                tradingVolumeGrowth: 0,
                profitGrowth: 0,
                accountBalanceGrowth: 0,
                kycCountGrowth: 0,
                tradesGrowth: 0,
            };
            
            scoreData = calculateCompetitionScoreWithGrowth(user, gtcData, zeroGrowth, competition);
        } else {
            // EXISTING PARTICIPANT: Calculate growth from watermark
            watermark = existingParticipant.highWatermark;
            const growth = calculateGrowthMetrics(user, gtcData, watermark, competition);
            scoreData = calculateCompetitionScoreWithGrowth(user, gtcData, growth, competition);
        }

        // Update participant score (pass watermark for new participants)
        competition.updateParticipantScore(userId, scoreData, watermark);

        await competition.save();

        const updatedParticipant = competition.participants.find(
            p => p.userId.toString() === userId
        );

        res.json({
            success: true,
            message: existingParticipant ? 'Score updated successfully' : 'Joined competition successfully',
            isNewParticipant: !existingParticipant,
            ranking: {
                rank: updatedParticipant.rank,
                score: scoreData.totalScore,
                baseScore: scoreData.baseScore,
                eligibleReward: getRewardForRank(updatedParticipant.rank, competition.rewards),
            },
            breakdown: scoreData.breakdown,
            growth: scoreData.growth,
            metrics: scoreData.metrics,
            watermark: watermark,
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

        const gtcData = await fetchGTCData(user, competition);

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
                kycConfig: competition.kycConfig,
            },
            ranking: {
                rank: participant.rank,
                score: participant.score,
                baseScore: participant.scoreBreakdown?.baseScore,
                eligibleReward: getRewardForRank(participant.rank, competition.rewards),
                lastCalculated: participant.lastCalculated,
            },
            breakdown: participant.scoreBreakdown?.breakdown,
            growth: participant.scoreBreakdown?.growth, // NEW
            metrics: participant.scoreBreakdown?.metrics,
            watermark: participant.highWatermark, // NEW: show baseline
            gtcAccountInfo: gtcData ? {
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

        const slug = competitionData.slug || generateSlug(competitionData.title);

        const existingCompetition = await Competition.findOne({ slug });
        if (existingCompetition) {
            return res.status(400).json({
                success: false,
                message: 'A competition with this slug already exists',
            });
        }

        // Validate that weights sum to 100 (including KYC weight)
        if (competitionData.rules) {
            const kycWeight = competitionData.kycConfig?.kycWeight || 0;
            const totalWeight =
                (competitionData.rules.directReferralsWeight || 0) +
                (competitionData.rules.teamSizeWeight || 0) +
                (competitionData.rules.tradingVolumeWeight || 0) +
                (competitionData.rules.profitabilityWeight || 0) +
                (competitionData.rules.accountBalanceWeight || 0) +
                kycWeight;

            if (totalWeight !== 100) {
                return res.status(400).json({
                    success: false,
                    message: `Total weight (including KYC) must equal 100%. Current total: ${totalWeight}%`,
                });
            }

            // AUTO-SET requiresGTCAccount based on GTC-related weights
            const gtcRelatedWeight =
                (competitionData.rules.teamSizeWeight || 0) +
                (competitionData.rules.tradingVolumeWeight || 0) +
                (competitionData.rules.profitabilityWeight || 0) +
                (competitionData.rules.accountBalanceWeight || 0);

            if (!competitionData.requirements) {
                competitionData.requirements = {};
            }
            competitionData.requirements.requiresGTCAccount = gtcRelatedWeight > 0 || kycWeight > 0;
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
 * PUT /competition/admin/:id
 */
router.put('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const updateData = req.body;

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

        if (competition.status === 'completed' && updateData.status !== 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot modify completed competition',
            });
        }

        if (updateData.slug === '' && updateData.title) {
            updateData.slug = generateSlug(updateData.title);
        }

        // Validate that weights sum to 100 (including KYC weight) if rules are being updated
        if (updateData.rules || updateData.kycConfig) {
            const rules = updateData.rules || competition.rules;
            const kycConfig = updateData.kycConfig || competition.kycConfig;
            const kycWeight = kycConfig?.kycWeight || 0;
            
            const totalWeight =
                (rules.directReferralsWeight || 0) +
                (rules.teamSizeWeight || 0) +
                (rules.tradingVolumeWeight || 0) +
                (rules.profitabilityWeight || 0) +
                (rules.accountBalanceWeight || 0) +
                kycWeight;

            if (totalWeight !== 100) {
                return res.status(400).json({
                    success: false,
                    message: `Total weight (including KYC) must equal 100%. Current total: ${totalWeight}%`,
                });
            }

            // AUTO-SET requiresGTCAccount based on GTC-related weights
            const gtcRelatedWeight =
                (rules.teamSizeWeight || 0) +
                (rules.tradingVolumeWeight || 0) +
                (rules.profitabilityWeight || 0) +
                (rules.accountBalanceWeight || 0);

            if (!updateData.requirements) {
                updateData.requirements = competition.requirements || {};
            }
            updateData.requirements.requiresGTCAccount = gtcRelatedWeight > 0 || kycWeight > 0;
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

        delete originalCompetition._id;
        delete originalCompetition.createdAt;
        delete originalCompetition.updatedAt;
        delete originalCompetition.participants;
        delete originalCompetition.stats;

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
                kycConfig: competition.kycConfig,
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
                kycConfig: competition.kycConfig,
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
 * NEW: Uses high watermark for growth-based scoring
 */
router.post('/admin/:id/recalculate-all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

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

        let successCount = 0;
        let errorCount = 0;

        // Recalculate for all existing participants
        for (const participant of competition.participants) {
            try {
                const user = await User.findById(participant.userId)
                    .select('name username email gtcfx referralDetails userType')
                    .lean();
                    
                if (!user) {
                    errorCount++;
                    continue;
                }

                const gtcData = await fetchGTCData(user, competition);
                if (!gtcData) {
                    errorCount++;
                    continue;
                }

                const participationCheck = competition.canUserParticipate(user, gtcData);
                if (!participationCheck.canParticipate) {
                    errorCount++;
                    continue;
                }

                // Calculate growth from stored watermark
                const watermark = participant.highWatermark;
                const growth = calculateGrowthMetrics(user, gtcData, watermark, competition);
                const scoreData = calculateCompetitionScoreWithGrowth(user, gtcData, growth, competition);

                competition.updateParticipantScore(user._id, scoreData);
                successCount++;
            } catch (error) {
                console.error(`Error processing participant ${participant.username}:`, error.message);
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