import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Helper function to propagate referral info up the tree
async function propagateReferralUpward(currentSponsor, newUserId, level) {
    try {
        // If current sponsor has a referrer, update their tree too
        if (currentSponsor.referralDetails?.referredBy) {
            const upperSponsor = await User.findById(currentSponsor.referralDetails.referredBy);

            if (upperSponsor) {
                // Check if user already exists in tree (prevent duplicates)
                const existsInTree = upperSponsor.referralDetails.referralTree.some(
                    entry => entry.userId.toString() === newUserId.toString()
                );

                if (!existsInTree) {
                    // Add to upper sponsor's tree at the next level
                    upperSponsor.referralDetails.referralTree.push({
                        userId: newUserId,
                        level: level,
                        addedAt: new Date()
                    });

                    // Update total downline count (not direct)
                    upperSponsor.referralDetails.totalDownlineUsers += 1;

                    await upperSponsor.save();

                    // Continue propagating upward recursively
                    await propagateReferralUpward(upperSponsor, newUserId, level + 1);
                }
            }
        }
    } catch (error) {
        console.error('Error propagating referral:', error);
    }
}

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, phone, password, referredBy } = req.body;

        // Validate required fields
        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({
                    message: 'User with this email already exists'
                });
            }
            if (existingUser.username === username) {
                return res.status(400).json({
                    message: 'Username is already taken'
                });
            }
        }

        // Handle referral code
        let sponsorId = null;
        let sponsor = null;
        if (referredBy) {
            sponsor = await User.findOne({ username: referredBy.trim() });
            if (sponsor) {
                sponsorId = sponsor._id;
            } else {
                return res.status(400).json({
                    message: 'Invalid referral code. Sponsor not found.'
                });
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedpass = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            username,
            email,
            phone,
            password: hashedpass,
            referralDetails: {
                referredBy: sponsorId,
                referralTree: [],
                totalDirectReferrals: 0,
                totalDownlineUsers: 0
            }
        });

        await newUser.save();

        // Update sponsor's referral tree
        if (sponsorId && sponsor) {
            // Add new user to sponsor's referral tree at level 1
            sponsor.referralDetails.referralTree.push({
                userId: newUser._id,
                level: 1,
                addedAt: new Date()
            });

            // Increment direct referral count
            sponsor.referralDetails.totalDirectReferrals += 1;
            sponsor.referralDetails.totalDownlineUsers += 1;

            await sponsor.save();

            // Propagate upward to all ancestors
            await propagateReferralUpward(sponsor, newUser._id, 2);
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                walletBalance: newUser.walletBalance,
                referredBy: sponsorId ? referredBy : null
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { userInput, password, rememberMe } = req.body;

        // Validate required fields
        if (!userInput || !password) {
            return res.status(400).json({
                message: 'Username/Email and password are required'
            });
        }

        // Find user by email or username
        const user = await User.findOne({
            $or: [
                { email: userInput },
                { username: userInput }
            ]
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if account is active
        if (user.status !== 'active') {
            return res.status(403).json({
                message: `Account is ${user.status}. Please contact support.`
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Set token expiration based on rememberMe
        const tokenExpiration = rememberMe ? '30d' : '7d';

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiration }
        );

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
                userType: user.userType
            },
            rememberMe
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Verify Token Route
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                valid: false,
                message: 'User not found'
            });
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                valid: false,
                message: `Account is ${user.status}`
            });
        }

        res.status(200).json({
            valid: true,
            user
        });

    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

// Logout Route
router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

// Change Password Route
router.put("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required"
            });
        }

        // Find user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Current password is incorrect" });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters"
            });
        }

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({
                message: "New password must be different from current password"
            });
        }

        // Hash and save new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Password updated successfully" });

    } catch (error) {
        console.error("Change password error:", error);
        res.status(500).json({ message: "Failed to change password" });
    }
});

export default router;
