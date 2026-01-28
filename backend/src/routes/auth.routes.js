import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import GTCMember from '../models/GTCMember.js';
import Notification from '../models/Notification.js';
import ReservedUser from '../models/ReservedUser.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

async function propagateReferralUpward(currentSponsor, newUserId, level) {
    try {
        if (currentSponsor.referralDetails?.referredBy) {
            const upperSponsor = await User.findById(currentSponsor.referralDetails.referredBy);
            if (upperSponsor) {
                const existsInTree = upperSponsor.referralDetails.referralTree.some(
                    entry => entry.userId.toString() === newUserId.toString()
                );
                if (!existsInTree) {
                    upperSponsor.referralDetails.referralTree.push({
                        userId: newUserId,
                        level: level,
                        addedAt: new Date()
                    });
                    upperSponsor.referralDetails.totalDownlineUsers += 1;
                    await upperSponsor.save();
                    await propagateReferralUpward(upperSponsor, newUserId, level + 1);
                }
            }
        }
    } catch (error) {
        console.error('Error propagating referral:', error);
    }
}

// MAIN FLOW: Handle GTC upline matching for new user
async function handleGTCUplineMatching(newUser, attemptedReferrerId = null, attemptedReferrerUsername = null) {
    try {
        // 1. Find child in GTCMembers by email match
        const gtcChild = await GTCMember.findOne({ email: newUser.email });
        if (!gtcChild || !gtcChild.parentGtcUserId) {
            console.log(`No GTC upline for ${newUser.email}`);
            return { matched: false, uplineId: null };
        }

        // 2. Find upline in GTCMembers by gtcUserId match
        const gtcUpline = await GTCMember.findOne({ gtcUserId: gtcChild.parentGtcUserId });
        if (!gtcUpline || !gtcUpline.email) {
            console.log(`No GTC upline email for ${gtcChild.parentGtcUserId}`);
            return { matched: false, uplineId: null };
        }

        // 3. Find upline in NuPips Users by email match
        const uplineUser = await User.findOne({ email: gtcUpline.email });

        if (uplineUser) {
            // UPLINE EXISTS - Match immediately
            await matchUserWithUpline(newUser, uplineUser, attemptedReferrerId, attemptedReferrerUsername);
            console.log(`Matched ${newUser.username} with upline ${uplineUser.username}`);
            return { matched: true, uplineId: uplineUser._id };
        } else {
            // UPLINE NOT IN NUPIPS - Reserve user
            await reserveUserForUpline(newUser._id, gtcUpline.email, attemptedReferrerId, attemptedReferrerUsername);
            console.log(`Reserved ${newUser.username} for GTC upline ${gtcUpline.email}`);
            return { matched: false, uplineId: null, reserved: true };
        }
    } catch (error) {
        console.error('Error in GTC upline matching:', error);
        return { matched: false, uplineId: null };
    }
}

// Match user with existing upline (immediate)
async function matchUserWithUpline(newUser, uplineUser, attemptedReferrerId, attemptedReferrerUsername) {
    // Check if already matched
    if (newUser.referralDetails.referredBy?.toString() === uplineUser._id.toString()) {
        return;
    }

    // Update new user's upline
    newUser.referralDetails.referredBy = uplineUser._id;
    await newUser.save();

    // Update upline's tree
    await updateSponsorTree(uplineUser._id, newUser._id);

    // Send notifications
    await Notification.create({
        user: newUser._id,
        message: `Your upline is now ${uplineUser.username} (synced from GTC FX)`,
        type: 'upline_matched'
    });

    await Notification.create({
        user: uplineUser._id,
        message: `${newUser.username} joined your team (GTC FX sync)`,
        type: 'new_downline_added'
    });

    // Notify attempted referrer if different
    if (attemptedReferrerId && attemptedReferrerId.toString() !== uplineUser._id.toString()) {
        await Notification.create({
            user: attemptedReferrerId,
            message: `${newUser.username} was assigned to GTC upline ${uplineUser.username}`,
            type: 'referral_overridden'
        });
    }
}

// Reserve user for future upline matching
async function reserveUserForUpline(nupipsUserId, gtcUplineEmail, attemptedReferrerId, attemptedReferrerUsername) {
    await ReservedUser.create({
        nupipsUserId,
        gtcUplineEmail: gtcUplineEmail,
        attemptedReferrerId,
        attemptedReferrerUsername,
        status: 'pending'
    });

    // Notify new user
    await Notification.create({
        user: nupipsUserId,
        message: `Your upline ${gtcUplineEmail} needs to join NuPips to complete matching`,
        type: 'upline_reserved'
    });

    // Notify attempted referrer
    if (attemptedReferrerId) {
        const newUser = await User.findById(nupipsUserId);
        await Notification.create({
            user: attemptedReferrerId,
            message: `${newUser.username} reserved for GTC upline ${gtcUplineEmail}`,
            type: 'referral_reserved'
        });
    }
}

// Check and match reserved users when new upline registers
async function checkReservedUsersForUpline(newUplineUser) {
    try {
        const reservedUsers = await ReservedUser.find({
            gtcUplineEmail: newUplineUser.email,
            status: 'pending'
        });

        for (const reserved of reservedUsers) {
            const reservedNupipsUser = await User.findById(reserved.nupipsUserId);
            if (reservedNupipsUser) {
                // Match them!
                await matchUserWithUpline(reservedNupipsUser, newUplineUser, null, null);

                // Mark as matched
                reserved.status = 'matched';
                await reserved.save();

                // Notify upline about matched downline
                await Notification.create({
                    user: newUplineUser._id,
                    message: `${reservedNupipsUser.username} was waiting for you. Now matched in your team`,
                    type: 'reserved_user_matched'
                });
            }
        }
    } catch (error) {
        console.error('Error checking reserved users:', error);
    }
}

async function updateSponsorTree(sponsorId, newUserId) {
    try {
        const sponsor = await User.findById(sponsorId);
        if (!sponsor) return;

        const existsInTree = sponsor.referralDetails.referralTree.some(
            entry => entry.userId.toString() === newUserId.toString()
        );

        if (!existsInTree) {
            sponsor.referralDetails.referralTree.push({
                userId: newUserId,
                level: 1,
                addedAt: new Date()
            });
            sponsor.referralDetails.totalDirectReferrals += 1;
            sponsor.referralDetails.totalDownlineUsers += 1;
            await sponsor.save();
            await propagateReferralUpward(sponsor, newUserId, 2);
        }
    } catch (error) {
        console.error('Error updating sponsor tree:', error);
    }
}

// ==================== ROUTES ====================

// Register Route - MAIN FLOW
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, phone, password, referredBy } = req.body;

        // Validation
        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check duplicates
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Email already exists' });
            }
            return res.status(400).json({ message: 'Username taken' });
        }

        // Get attempted referrer
        let attemptedReferrerId = null;
        let attemptedReferrerUsername = null;
        if (referredBy) {
            const referrer = await User.findOne({ username: referredBy.trim() });
            if (referrer) {
                attemptedReferrerId = referrer._id;
                attemptedReferrerUsername = referrer.username;
            }
        }

        // Create user (no upline yet)
        const newUser = new User({
            name, username, email, phone,
            password: await hashPassword(password),
            referralDetails: { referredBy: null, referralTree: [], totalDirectReferrals: 0, totalDownlineUsers: 0 }
        });
        await newUser.save();

        // MAIN LOGIC: Handle GTC upline matching
        const result = await handleGTCUplineMatching(newUser, attemptedReferrerId, attemptedReferrerUsername);

        // Check if new user is an upline for reserved users
        await checkReservedUsersForUpline(newUser);

        const token = jwt.sign({
            userId: newUser._id,
            email: newUser.email,
            userType: newUser.userType,
            permissions: newUser.permissions || { pages: [] }
        }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                walletBalance: newUser.walletBalance,
                permissions: newUser.permissions,
                uplineStatus: result.matched ? 'matched' : (result?.reserved ? 'reserved' : 'no_upline'),
                referredBy: newUser.referralDetails.referredBy ?
                    (await User.findById(newUser.referralDetails.referredBy))?.username : null
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { userInput, password, rememberMe } = req.body;
        if (!userInput || !password) {
            return res.status(400).json({ message: 'Credentials required' });
        }

        const user = await User.findOne({ $or: [{ email: userInput }, { username: userInput }] });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (user.status !== 'active') {
            return res.status(403).json({ message: `Account is ${user.status}` });
        }

        const tokenExpiration = rememberMe ? '30d' : '1d';
        const token = jwt.sign({
            userId: user._id,
            email: user.email,
            userType: user.userType == 'subadmin' ? 'admin' : user.userType,
            permissions: user.permissions || { pages: [] }
        }, process.env.JWT_SECRET, { expiresIn: tokenExpiration });

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                walletBalance: user.walletBalance,
                userType: user.userType,
                permissions: user.permissions
            },
            rememberMe
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify Token Route
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user || user.status !== 'active') {
            return res.status(403).json({ valid: false, message: 'Invalid user' });
        }
        res.json({ valid: true, user });
    } catch (error) {
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

// Verify Token Route
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user || user.status !== 'active') {
            return res.status(403).json({ valid: false, message: 'Invalid user' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Failed' });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out' });
});

// Change Password Route
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: 'Invalid input' });
        }

        const user = await User.findById(req.user.userId);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        user.password = await hashPassword(newPassword);
        await user.save();
        res.json({ message: 'Password updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
