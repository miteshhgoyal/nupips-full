// routes/profile.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Deposit from "../models/Deposit.js";
import Withdrawal from "../models/Withdrawal.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get my profile
router.get("/", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId).select("-password");
        if (!me) return res.status(404).json({ message: "User not found" });
        res.json(me);
    } catch (e) {
        console.error("Get profile error:", e);
        res.status(500).json({ message: "Failed to fetch profile" });
    }
});

// Update profile
router.put("/update", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId);
        if (!me) return res.status(404).json({ message: "User not found" });

        const { name, username, changePassword } = req.body;

        // Only allow name/username edits (email/phone are locked)
        if (typeof name === "string") me.name = name.trim().slice(0, 60);

        if (typeof username === "string") {
            const trimmed = username.trim();
            if (trimmed.length < 3) {
                return res.status(400).json({ message: "Username must be at least 3 characters" });
            }
            if (trimmed !== me.username) {
                const exists = await User.findOne({ username: trimmed });
                if (exists) return res.status(400).json({ message: "Username already taken" });
            }
            me.username = trimmed;
        }

        // Password change
        if (changePassword?.currentPassword && changePassword?.newPassword) {
            const isMatch = await bcrypt.compare(changePassword.currentPassword, me.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            if (changePassword.newPassword.length < 8) {
                return res.status(400).json({ message: "New password must be at least 8 characters" });
            }
            const salt = await bcrypt.genSalt(10);
            me.password = await bcrypt.hash(changePassword.newPassword, salt);
        }

        await me.save();
        const safeUser = await User.findById(me._id).select("-password");
        res.json({ message: "Profile updated", user: safeUser });
    } catch (e) {
        console.error("Update profile error:", e);
        res.status(500).json({ message: "Failed to update profile" });
    }
});

// Get dashboard data with REAL DATA
router.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId).select("-password");
        if (!me) return res.status(404).json({ message: "User not found" });

        // Build dashboard payload
        const dashboard = {
            walletBalance: me.walletBalance || 0,
            financials: me.financials || {},
            tradingStats: me.tradingStats || {},
            referralDetails: me.referralDetails || {},
            downlineStats: me.downlineStats || {},
            recentActivity: [],
            chartData: {
                deposits: [],
                withdrawals: [],
            },
        };

        // ==================== REAL RECENT ACTIVITY ====================
        try {
            // Get last 5 deposits
            const recentDeposits = await Deposit.find({
                userId: me._id,
                status: { $in: ["completed"] },
            })
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            // Get last 5 withdrawals
            const recentWithdrawals = await Withdrawal.find({
                userId: me._id,
                status: { $in: ["completed"] },
            })
                .sort({ createdAt: -1 })
                .limit(3)
                .lean();

            // Get recent referrals (last 3 users referred by this user)
            const recentReferrals = await User.find({
                "referralDetails.referredBy": me._id,
            })
                .sort({ createdAt: -1 })
                .limit(2)
                .select("name username createdAt")
                .lean();

            // Combine and format activities
            const activities = [];

            recentDeposits.forEach((dep) => {
                activities.push({
                    type: "deposit",
                    title: `Deposit ${dep.status === "completed" ? "Completed" : "Pending"}`,
                    date: getRelativeTime(dep.createdAt),
                    value: `+$${Number(dep.amount).toFixed(2)}`,
                    timestamp: dep.createdAt,
                });
            });

            recentWithdrawals.forEach((wd) => {
                activities.push({
                    type: "withdrawal",
                    title: `Withdrawal ${wd.status === "completed" ? "Processed" : "Pending"}`,
                    date: getRelativeTime(wd.createdAt),
                    value: `-$${Number(wd.amount).toFixed(2)}`,
                    timestamp: wd.createdAt,
                });
            });

            recentReferrals.forEach((ref) => {
                activities.push({
                    type: "referral",
                    title: "New Referral",
                    date: getRelativeTime(ref.createdAt),
                    value: ref.username || ref.name,
                    timestamp: ref.createdAt,
                });
            });

            // Sort by timestamp (most recent first) and take top 10
            dashboard.recentActivity = activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);
        } catch (activityError) {
            console.error("Error fetching recent activity:", activityError);
            // Continue with empty activity if error
        }

        // ==================== REAL CHART DATA (Last 7 Days) ====================
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Get deposits for last 7 days
            const weeklyDeposits = await Deposit.aggregate([
                {
                    $match: {
                        userId: me._id,
                        status: "completed",
                        createdAt: { $gte: sevenDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        total: { $sum: "$amount" },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Get withdrawals for last 7 days
            const weeklyWithdrawals = await Withdrawal.aggregate([
                {
                    $match: {
                        userId: me._id,
                        status: "completed",
                        createdAt: { $gte: sevenDaysAgo },
                    },
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                        },
                        total: { $sum: "$amount" },
                    },
                },
                { $sort: { _id: 1 } },
            ]);

            // Build 7-day chart data
            const last7Days = getLast7Days();
            const depositMap = {};
            const withdrawalMap = {};

            weeklyDeposits.forEach((d) => {
                depositMap[d._id] = d.total;
            });

            weeklyWithdrawals.forEach((w) => {
                withdrawalMap[w._id] = w.total;
            });

            dashboard.chartData.deposits = last7Days.map((day) => ({
                label: day.label,
                value: depositMap[day.date] || 0,
            }));

            dashboard.chartData.withdrawals = last7Days.map((day) => ({
                label: day.label,
                value: withdrawalMap[day.date] || 0,
            }));
        } catch (chartError) {
            console.error("Error generating chart data:", chartError);
            // Fallback to empty chart data
            dashboard.chartData.deposits = getLast7Days().map((d) => ({
                label: d.label,
                value: 0,
            }));
            dashboard.chartData.withdrawals = getLast7Days().map((d) => ({
                label: d.label,
                value: 0,
            }));
        }

        res.json(dashboard);
    } catch (e) {
        console.error("Dashboard error:", e);
        res.status(500).json({ message: "Failed to load dashboard" });
    }
});

router.put("/privacy", authenticateToken, async (req, res) => {
    try {
        const { hideDetailsFromDownline } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update privacy setting
        if (typeof hideDetailsFromDownline === 'boolean') {
            user.privacySettings = user.privacySettings || {};
            user.privacySettings.hideDetailsFromDownline = hideDetailsFromDownline;
        }

        await user.save();

        res.json({
            success: true,
            message: "Privacy settings updated successfully",
            user: await User.findById(user._id).select("-password")
        });
    } catch (error) {
        console.error("Update privacy settings error:", error);
        res.status(500).json({ message: "Failed to update privacy settings" });
    }
});

// Get sponsor/upline information
router.get("/sponsor", authenticateToken, async (req, res) => {
    try {
        const me = await User.findById(req.user.userId).select("-password");
        if (!me) return res.status(404).json({ message: "User not found" });

        // Check if user has a referrer
        if (!me.referralDetails?.referredBy) {
            return res.json({ hasSponsor: false, sponsor: null });
        }

        // Fetch sponsor details
        const sponsor = await User.findById(me.referralDetails.referredBy)
            .select("name username email phone userType status createdAt walletBalance financials downlineStats privacySettings")
            .lean();

        if (!sponsor) {
            return res.json({ hasSponsor: false, sponsor: null });
        }

        // Check if sponsor has enabled privacy mode
        const hideDetails = sponsor.privacySettings?.hideDetailsFromDownline || false;

        // Return safe sponsor data with conditional privacy
        res.json({
            hasSponsor: true,
            sponsor: {
                id: sponsor._id,
                name: sponsor.name,
                username: sponsor.username,
                email: sponsor.email,
                phone: sponsor.phone,
                userType: sponsor.userType,
                status: sponsor.status,
                memberSince: sponsor.createdAt,

                // Hide financial details if privacy is enabled
                walletBalance: hideDetails ? null : (sponsor.walletBalance || 0),
                totalDeposits: hideDetails ? null : (sponsor.financials?.totalDeposits || 0),
                totalWithdrawals: hideDetails ? null : (sponsor.financials?.totalWithdrawals || 0),
                downlineCount: hideDetails ? null : (sponsor.downlineStats?.totalTraders + sponsor.downlineStats?.totalAgents || 0),

                // Privacy indicator
                detailsHidden: hideDetails
            }
        });
    } catch (e) {
        console.error("Get sponsor error:", e);
        res.status(500).json({ message: "Failed to fetch sponsor information" });
    }
});

// ==================== HELPER FUNCTIONS ====================

// Get relative time string (e.g., "2 hours ago", "3 days ago")
function getRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
}

// Get last 7 days with labels (Mon, Tue, etc.)
function getLast7Days() {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            date: d.toISOString().split("T"), // YYYY-MM-DD format
            label: dayNames[d.getDay()],
        });
    }

    return days;
}

// ==================== ADDRESS MANAGEMENT ====================

// Add new address
router.post('/address/add', authenticateToken, async (req, res) => {
    try {
        const { firstName, lastName, email, street, city, state, zipcode, country, phone, isDefault, label } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate required fields
        if (!firstName || !lastName || !email || !street || !city || !state || !zipcode || !phone) {
            return res.status(400).json({ message: 'All address fields are required' });
        }

        // If this is set as default, unset other defaults
        if (isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // If this is the first address, make it default
        const makeDefault = user.addresses.length === 0 || isDefault;

        // Add new address
        user.addresses.push({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            street: street.trim(),
            city: city.trim(),
            state: state.trim(),
            zipcode: zipcode.trim(),
            country: country || 'India',
            phone: phone.trim(),
            isDefault: makeDefault,
            label: label || 'Home'
        });

        await user.save();

        res.json({
            success: true,
            message: 'Address added successfully',
            user: await User.findById(user._id).select('-password')
        });
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ message: 'Failed to add address', error: error.message });
    }
});

// Remove address
router.post('/address/remove', authenticateToken, async (req, res) => {
    try {
        const { addressId } = req.body;

        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find address
        const addressIndex = user.addresses.findIndex(
            addr => addr._id.toString() === addressId
        );

        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        const wasDefault = user.addresses[addressIndex].isDefault;

        // Remove address
        user.addresses.splice(addressIndex, 1);

        // If removed address was default and there are other addresses, set first as default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Address removed successfully',
            user: await User.findById(user._id).select('-password')
        });
    } catch (error) {
        console.error('Remove address error:', error);
        res.status(500).json({ message: 'Failed to remove address', error: error.message });
    }
});

// Update address
router.put('/address/update/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, street, city, state, zipcode, country, phone, isDefault, label } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find address
        const address = user.addresses.id(id);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // If setting as default, unset others
        if (isDefault && !address.isDefault) {
            user.addresses.forEach(addr => {
                addr.isDefault = false;
            });
        }

        // Update fields
        if (firstName) address.firstName = firstName.trim();
        if (lastName) address.lastName = lastName.trim();
        if (email) address.email = email.trim();
        if (street) address.street = street.trim();
        if (city) address.city = city.trim();
        if (state) address.state = state.trim();
        if (zipcode) address.zipcode = zipcode.trim();
        if (country) address.country = country.trim();
        if (phone) address.phone = phone.trim();
        if (typeof isDefault === 'boolean') address.isDefault = isDefault;
        if (label) address.label = label.trim();

        await user.save();

        res.json({
            success: true,
            message: 'Address updated successfully',
            user: await User.findById(user._id).select('-password')
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ message: 'Failed to update address', error: error.message });
    }
});

// Set default address
router.post('/address/set-default', authenticateToken, async (req, res) => {
    try {
        const { addressId } = req.body;

        if (!addressId) {
            return res.status(400).json({ message: 'Address ID is required' });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find address
        const address = user.addresses.id(addressId);
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Unset all defaults
        user.addresses.forEach(addr => {
            addr.isDefault = false;
        });

        // Set new default
        address.isDefault = true;

        await user.save();

        res.json({
            success: true,
            message: 'Default address updated',
            user: await User.findById(user._id).select('-password')
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({ message: 'Failed to set default address', error: error.message });
    }
});

// Get all addresses
router.get('/addresses', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('addresses');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            addresses: user.addresses || []
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({ message: 'Failed to fetch addresses', error: error.message });
    }
});

// ==================== GTC REFERRAL LINK MANAGEMENT ====================

// Get GTC referral link
router.get('/gtc/referral-link', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('gtcfx.referralLink gtcfx.referralLinkUpdatedAt');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            referralLink: user.gtcfx?.referralLink || null,
            updatedAt: user.gtcfx?.referralLinkUpdatedAt || null
        });
    } catch (error) {
        console.error('Get GTC referral link error:', error);
        res.status(500).json({ message: 'Failed to fetch referral link', error: error.message });
    }
});

// Add/Update GTC referral link
router.put('/gtc/referral-link', authenticateToken, async (req, res) => {
    try {
        const { referralLink } = req.body;

        if (!referralLink || typeof referralLink !== 'string') {
            return res.status(400).json({ message: 'Referral link is required' });
        }

        const trimmedLink = referralLink.trim();

        // Validate URL format
        const urlPattern = /^https?:\/\/.+/;
        if (!urlPattern.test(trimmedLink)) {
            return res.status(400).json({
                message: 'Invalid referral link format. Must be a valid URL (http:// or https://)'
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Initialize gtcfx object if it doesn't exist
        if (!user.gtcfx) {
            user.gtcfx = {};
        }

        // Update referral link
        user.gtcfx.referralLink = trimmedLink;
        user.gtcfx.referralLinkUpdatedAt = new Date();

        await user.save();

        res.json({
            success: true,
            message: 'GTC referral link updated successfully',
            referralLink: user.gtcfx.referralLink,
            updatedAt: user.gtcfx.referralLinkUpdatedAt
        });
    } catch (error) {
        console.error('Update GTC referral link error:', error);
        res.status(500).json({
            message: 'Failed to update referral link',
            error: error.message
        });
    }
});

// Remove GTC referral link
router.delete('/gtc/referral-link', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.gtcfx) {
            return res.status(404).json({ message: 'No referral link found' });
        }

        // Remove referral link
        user.gtcfx.referralLink = null;
        user.gtcfx.referralLinkUpdatedAt = new Date();

        await user.save();

        res.json({
            success: true,
            message: 'GTC referral link removed successfully'
        });
    } catch (error) {
        console.error('Remove GTC referral link error:', error);
        res.status(500).json({
            message: 'Failed to remove referral link',
            error: error.message
        });
    }
});

export default router;
