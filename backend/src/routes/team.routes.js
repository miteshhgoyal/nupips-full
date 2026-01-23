// routes/team.routes.js - Replace with this enhanced version

import express from 'express';
import User from '../models/User.js';
import GTCMember from '../models/GTCMember.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get direct team members with GTC status and privacy
router.get('/direct', authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: 'User not found' });

        // Get direct referrals from referralTree (level 1 only)
        const directReferralIds = me.referralDetails.referralTree
            .filter(entry => entry.level === 1)
            .map(entry => entry.userId);

        const directTeam = await User.find({ _id: { $in: directReferralIds } })
            .select('name username email phone userType status walletBalance financials createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // Get all GTC members to check registration status
        const gtcMembers = await GTCMember.find({}).select('email').lean();
        const gtcEmailsSet = new Set(gtcMembers.map(m => m.email.toLowerCase().trim()));

        // Add GTC status to each direct team member
        const teamWithGTCStatus = directTeam.map(member => ({
            ...member,
            hasJoinedGTC: gtcEmailsSet.has(member.email.toLowerCase().trim())
        }));

        res.json({
            total: teamWithGTCStatus.length,
            team: teamWithGTCStatus
        });
    } catch (e) {
        console.error('Get direct team error:', e);
        res.status(500).json({ message: 'Failed to fetch direct team' });
    }
});

// Get full downline tree with privacy and GTC status
router.get('/tree', authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: 'User not found' });

        // Get all GTC members for status checking
        const gtcMembers = await GTCMember.find({}).select('email').lean();
        const gtcEmailsSet = new Set(gtcMembers.map(m => m.email.toLowerCase().trim()));

        // Get direct referral IDs (level 1)
        const directReferralIds = new Set(
            me.referralDetails.referralTree
                .filter(entry => entry.level === 1)
                .map(entry => entry.userId.toString())
        );

        // Recursive function to build tree with privacy
        async function buildTree(userId, level = 1, maxLevel = 10) {
            if (level >= maxLevel) return [];

            const children = await User.find({ 'referralDetails.referredBy': userId })
                .select('name username email phone userType status walletBalance financials createdAt')
                .lean();

            const tree = [];
            for (const child of children) {
                const isDirect = directReferralIds.has(child._id.toString());
                const hasJoinedGTC = gtcEmailsSet.has(child.email.toLowerCase().trim());

                tree.push({
                    ...child,
                    level,
                    // Mask email and phone for non-direct members
                    email: isDirect ? child.email : maskEmail(child.email),
                    phone: isDirect ? child.phone : maskPhone(child.phone),
                    hasJoinedGTC,
                    isDirect, // Flag to identify direct members
                    children: await buildTree(child._id, level + 1, maxLevel)
                });
            }

            return tree;
        }

        const tree = await buildTree(me._id);

        res.json({
            root: {
                _id: me._id,
                name: me.name,
                username: me.username,
                email: me.email,
                phone: me.phone,
                userType: me.userType,
                status: me.status,
                walletBalance: me.walletBalance,
                level: 0,
                hasJoinedGTC: gtcEmailsSet.has(me.email.toLowerCase().trim())
            },
            rootFinancials: me.financials,
            tree
        });
    } catch (e) {
        console.error('Get team tree error:', e);
        res.status(500).json({ message: 'Failed to fetch team tree' });
    }
});

// Get team statistics with GTC metrics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: 'User not found' });

        // Get all downline user IDs from referralTree
        const allDownlineIds = me.referralDetails.referralTree.map(entry => entry.userId);
        const allDownline = await User.find({ _id: { $in: allDownlineIds } })
            .select('email financials walletBalance status')
            .lean();

        // Get direct team (level 1 only)
        const directTeamIds = me.referralDetails.referralTree
            .filter(entry => entry.level === 1)
            .map(entry => entry.userId);

        // Get GTC members for status
        const gtcMembers = await GTCMember.find({}).select('email').lean();
        const gtcEmailsSet = new Set(gtcMembers.map(m => m.email.toLowerCase().trim()));

        // Calculate GTC registration stats
        const directTeam = await User.find({ _id: { $in: directTeamIds } })
            .select('email')
            .lean();

        const directWithGTC = directTeam.filter(u =>
            gtcEmailsSet.has(u.email.toLowerCase().trim())
        ).length;

        const allDownlineWithGTC = allDownline.filter(u =>
            gtcEmailsSet.has(u.email.toLowerCase().trim())
        ).length;

        // Calculate financial metrics
        const totalRebateIncome = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalRebateIncome || 0),
            0
        );

        const totalAffiliateIncome = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalAffiliateIncome || 0),
            0
        );

        const totalDeposits = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalDeposits || 0),
            0
        );

        const totalWithdrawals = allDownline.reduce(
            (sum, u) => sum + (u.financials?.totalWithdrawals || 0),
            0
        );

        const totalBalance = allDownline.reduce(
            (sum, u) => sum + (u.walletBalance || 0),
            0
        );

        res.json({
            directCount: directTeamIds.length,
            totalDownline: allDownline.length,
            activeUsers: allDownline.filter(u => u.status === 'active').length,
            totalRebateIncome,
            totalAffiliateIncome,
            totalCommissions: totalRebateIncome + totalAffiliateIncome,
            totalDeposits,
            totalWithdrawals,
            totalBalance,
            // GTC Metrics
            gtcStats: {
                directWithGTC,
                directWithoutGTC: directTeamIds.length - directWithGTC,
                totalDownlineWithGTC: allDownlineWithGTC,
                totalDownlineWithoutGTC: allDownline.length - allDownlineWithGTC,
                gtcRegistrationRate: directTeamIds.length > 0
                    ? ((directWithGTC / directTeamIds.length) * 100).toFixed(1)
                    : 0
            }
        });
    } catch (e) {
        console.error('Get team stats error:', e);
        res.status(500).json({ message: 'Failed to fetch team statistics' });
    }
});

// Helper functions for masking
function maskEmail(email) {
    if (!email) return '••••@••••.com';
    const [username, domain] = email.split('@');
    if (!username || !domain) return '••••@••••.com';

    const maskedUsername = username.length > 2
        ? username[0] + '•'.repeat(username.length - 2) + username[username.length - 1]
        : '••••';

    return `${maskedUsername}@${domain}`;
}

function maskPhone(phone) {
    if (!phone) return '••••••••••';
    if (phone.length <= 4) return '••••••••••';

    return '••••••' + phone.slice(-4);
}

export default router;
