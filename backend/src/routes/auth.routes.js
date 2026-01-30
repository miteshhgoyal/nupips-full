import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import GTCMember from "../models/GTCMember.js";
import Notification from "../models/Notification.js";
import ReservedUser from "../models/ReservedUser.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ==================== HELPER FUNCTIONS ====================

async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

async function propagateReferralUpward(currentSponsor, newUserId, level) {
    try {
        if (currentSponsor.referralDetails?.referredBy) {
            const upperSponsor = await User.findById(
                currentSponsor.referralDetails.referredBy,
            );
            if (upperSponsor) {
                const existsInTree =
                    upperSponsor.referralDetails.referralTree.some(
                        (entry) =>
                            entry.userId.toString() === newUserId.toString(),
                    );
                if (!existsInTree) {
                    upperSponsor.referralDetails.referralTree.push({
                        userId: newUserId,
                        level: level,
                        addedAt: new Date(),
                    });
                    upperSponsor.referralDetails.totalDownlineUsers += 1;
                    await upperSponsor.save();
                    await propagateReferralUpward(
                        upperSponsor,
                        newUserId,
                        level + 1,
                    );
                }
            }
        }
    } catch (error) {
        console.error("Error propagating referral:", error);
    }
}

async function removeFromSponsorTree(sponsorId, userIdToRemove) {
    try {
        const sponsor = await User.findById(sponsorId);
        if (!sponsor) return;

        // Check if it was a direct referral (level 1)
        const wasDirectReferral = sponsor.referralDetails.referralTree.some(
            (entry) =>
                entry.userId.toString() === userIdToRemove.toString() &&
                entry.level === 1
        );

        // Remove from tree
        sponsor.referralDetails.referralTree =
            sponsor.referralDetails.referralTree.filter(
                (entry) => entry.userId.toString() !== userIdToRemove.toString()
            );

        // Update counts
        if (wasDirectReferral) {
            sponsor.referralDetails.totalDirectReferrals -= 1;
        }
        sponsor.referralDetails.totalDownlineUsers -= 1;

        await sponsor.save();

        // Propagate removal upward
        if (sponsor.referralDetails?.referredBy) {
            await removeFromSponsorTree(
                sponsor.referralDetails.referredBy,
                userIdToRemove
            );
        }
    } catch (error) {
        console.error("Error removing from sponsor tree:", error);
    }
}

// MAIN FLOW: Handle GTC upline matching for new user
async function handleGTCUplineMatching(
    newUser,
    attemptedReferrerId = null,
    attemptedReferrerUsername = null,
) {
    try {
        // 1. Find child in GTCMembers by email match
        const gtcChild = await GTCMember.findOne({ email: newUser.email });
        if (!gtcChild || !gtcChild.parentGtcUserId) {
            console.log(`No GTC upline for ${newUser.email}`);
            return { matched: false, uplineId: null };
        }

        // 2. Find upline in GTCMembers by gtcUserId match
        const gtcUpline = await GTCMember.findOne({
            gtcUserId: gtcChild.parentGtcUserId,
        });
        if (!gtcUpline || !gtcUpline.email) {
            console.log(`No GTC upline email for ${gtcChild.parentGtcUserId}`);
            return { matched: false, uplineId: null };
        }

        // 3. Find upline in NuPips Users by email match
        const uplineUser = await User.findOne({ email: gtcUpline.email });

        if (uplineUser) {
            // UPLINE EXISTS - Match immediately
            await matchUserWithUpline(
                newUser,
                uplineUser,
                attemptedReferrerId,
                attemptedReferrerUsername,
            );
            console.log(
                `Matched ${newUser.username} with upline ${uplineUser.username}`,
            );
            return { matched: true, uplineId: uplineUser._id };
        } else {
            // UPLINE NOT IN NUPIPS - Reserve user
            await reserveUserForUpline(
                newUser._id,
                gtcUpline.email,
                attemptedReferrerId,
                attemptedReferrerUsername,
            );
            console.log(
                `Reserved ${newUser.username} for GTC upline ${gtcUpline.email}`,
            );
            return { matched: false, uplineId: null, reserved: true };
        }
    } catch (error) {
        console.error("Error in GTC upline matching:", error);
        return { matched: false, uplineId: null };
    }
}

// Match user with existing upline (immediate)
async function matchUserWithUpline(
    newUser,
    uplineUser,
    attemptedReferrerId,
    attemptedReferrerUsername,
) {
    // Check if already matched
    if (
        newUser.referralDetails.referredBy?.toString() ===
        uplineUser._id.toString()
    ) {
        return;
    }

    // If user had a different referrer, remove from their tree
    const oldReferrerId = newUser.referralDetails.referredBy;
    const hadPreviousReferrer = oldReferrerId && oldReferrerId.toString() !== uplineUser._id.toString();
    
    if (hadPreviousReferrer) {
        await removeFromSponsorTree(oldReferrerId, newUser._id);
    }

    // Update new user's upline
    newUser.referralDetails.referredBy = uplineUser._id;
    await newUser.save();

    // Update upline's tree
    await updateSponsorTree(uplineUser._id, newUser._id);

    // Send notifications based on whether there was a migration
    if (hadPreviousReferrer) {
        // Migration happened - more detailed notifications
        await Notification.create({
            user: newUser._id,
            message: `Account Migration Complete! Your upline has been updated to ${uplineUser.username} as per GTC FX hierarchy. All future commissions and bonuses will be linked to your new upline.`,
            type: "upline_migrated",
        });

        await Notification.create({
            user: uplineUser._id,
            message: `New Team Member Added! ${newUser.username} has been migrated to your team from GTC FX sync. Welcome them to your downline!`,
            type: "new_downline_added",
        });

        // Notify OLD referrer about the migration
        const oldReferrer = await User.findById(oldReferrerId);
        if (oldReferrer) {
            await Notification.create({
                user: oldReferrerId,
                message: `Team Update: ${newUser.username} has been migrated to their GTC upline ${uplineUser.username}. This change is based on the official GTC FX hierarchy sync.`,
                type: "referral_migrated",
            });
        }
    } else {
        // Direct match without migration
        await Notification.create({
            user: newUser._id,
            message: `Upline Matched! Your upline ${uplineUser.username} has been set based on GTC FX hierarchy.`,
            type: "upline_matched",
        });

        await Notification.create({
            user: uplineUser._id,
            message: `New Team Member! ${newUser.username} joined your team (GTC FX sync).`,
            type: "new_downline_added",
        });
    }
}

// Reserve user for future upline matching
async function reserveUserForUpline(
    nupipsUserId,
    gtcUplineEmail,
    attemptedReferrerId,
    attemptedReferrerUsername,
) {
    await ReservedUser.create({
        nupipsUserId,
        gtcUplineEmail: gtcUplineEmail,
        attemptedReferrerId,
        attemptedReferrerUsername,
        status: "pending",
    });

    // Notify new user about pending migration
    if (attemptedReferrerId) {
        const attemptedReferrer = await User.findById(attemptedReferrerId);
        await Notification.create({
            user: nupipsUserId,
            message: `⏳ Pending Migration: You are temporarily linked to ${attemptedReferrer?.username}. Once your GTC upline (${gtcUplineEmail}) joins NuPips, your account will be automatically migrated to maintain GTC FX hierarchy.`,
            type: "upline_pending_migration",
        });
    } else {
        await Notification.create({
            user: nupipsUserId,
            message: `⏳ Waiting for Upline: Your GTC upline (${gtcUplineEmail}) needs to join NuPips. Once they register, you'll be automatically linked to them as per GTC FX hierarchy.`,
            type: "upline_pending_migration",
        });
    }

    // Notify attempted referrer about temporary assignment
    if (attemptedReferrerId) {
        const newUser = await User.findById(nupipsUserId);
        await Notification.create({
            user: attemptedReferrerId,
            message: `Temporary Assignment: ${newUser.username} has been temporarily added to your team. They will be automatically migrated to their GTC upline (${gtcUplineEmail}) once that user joins NuPips.`,
            type: "referral_temporary",
        });
    }
}

// Check and match reserved users when new upline registers
async function checkReservedUsersForUpline(newUplineUser) {
    try {
        const reservedUsers = await ReservedUser.find({
            gtcUplineEmail: newUplineUser.email,
            status: "pending",
        });

        for (const reserved of reservedUsers) {
            const reservedNupipsUser = await User.findById(
                reserved.nupipsUserId,
            );
            if (reservedNupipsUser) {
                // Notify reserved user about upcoming migration
                await Notification.create({
                    user: reservedNupipsUser._id,
                    message: `Migration Starting: Your GTC upline ${newUplineUser.username} has joined! Your account is being migrated to maintain proper GTC FX hierarchy...`,
                    type: "migration_starting",
                });

                // Match them!
                await matchUserWithUpline(
                    reservedNupipsUser,
                    newUplineUser,
                    reserved.attemptedReferrerId,
                    reserved.attemptedReferrerUsername,
                );

                // Mark as matched
                reserved.status = "matched";
                await reserved.save();

                // Notify upline about their waiting downline
                await Notification.create({
                    user: newUplineUser._id,
                    message: `Team Member Waiting: ${reservedNupipsUser.username} was already in the system waiting for you! They have now been added to your team as per GTC FX hierarchy.`,
                    type: "reserved_user_matched",
                });
            }
        }
    } catch (error) {
        console.error("Error checking reserved users:", error);
    }
}

async function updateSponsorTree(sponsorId, newUserId) {
    try {
        const sponsor = await User.findById(sponsorId);
        if (!sponsor) return;

        const existsInTree = sponsor.referralDetails.referralTree.some(
            (entry) => entry.userId.toString() === newUserId.toString(),
        );

        if (!existsInTree) {
            sponsor.referralDetails.referralTree.push({
                userId: newUserId,
                level: 1,
                addedAt: new Date(),
            });
            sponsor.referralDetails.totalDirectReferrals += 1;
            sponsor.referralDetails.totalDownlineUsers += 1;
            await sponsor.save();
            await propagateReferralUpward(sponsor, newUserId, 2);
        }
    } catch (error) {
        console.error("Error updating sponsor tree:", error);
    }
}

// ==================== ROUTES ====================

// Register Route - MAIN FLOW
router.post("/register", async (req, res) => {
    try {
        const { name, username, email, phone, password, referredBy } = req.body;

        // Validation
        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        if (password.length < 6) {
            return res
                .status(400)
                .json({ message: "Password must be at least 6 characters" });
        }

        // Check duplicates
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });
        if (existingUser) {
            if (existingUser.email === email) {
                return res
                    .status(400)
                    .json({ message: "Email already exists" });
            }
            return res.status(400).json({ message: "Username taken" });
        }

        // Get attempted referrer
        let attemptedReferrerId = null;
        let attemptedReferrerUsername = null;
        let newUser;
        if (referredBy) {
            const referrer = await User.findOne({
                nupipsId: referredBy.trim(),
            });
            if (referrer) {
                attemptedReferrerId = referrer._id;
                attemptedReferrerUsername = referrer.username;

                // Create user
                newUser = new User({
                    name,
                    username,
                    email,
                    phone,
                    password: await hashPassword(password),
                    referralDetails: {
                        referredBy: attemptedReferrerId,
                        referralTree: [],
                        totalDirectReferrals: 0,
                        totalDownlineUsers: 0,
                    },
                });
            } else {
                newUser = new User({
                    name,
                    username,
                    email,
                    phone,
                    password: await hashPassword(password),
                    referralDetails: {
                        referredBy: null,
                        referralTree: [],
                        totalDirectReferrals: 0,
                        totalDownlineUsers: 0,
                    },
                });
            }
        } else {
            newUser = new User({
                name,
                username,
                email,
                phone,
                password: await hashPassword(password),
                referralDetails: {
                    referredBy: null,
                    referralTree: [],
                    totalDirectReferrals: 0,
                    totalDownlineUsers: 0,
                },
            });
        }
        await newUser.save();

        // Update attempted referrer's tree immediately (if provided)
        if (attemptedReferrerId) {
            await updateSponsorTree(attemptedReferrerId, newUser._id);
        }

        // MAIN LOGIC: Handle GTC upline matching
        const result = await handleGTCUplineMatching(
            newUser,
            attemptedReferrerId,
            attemptedReferrerUsername,
        );

        // Check if new user is an upline for reserved users
        await checkReservedUsersForUpline(newUser);

        const token = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email,
                userType: newUser.userType,
                permissions: newUser.permissions || { pages: [] },
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
        );

        res.status(201).json({
            message: "Registration successful",
            token,
            user: {
                id: newUser._id,
                name: newUser.name,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                walletBalance: newUser.walletBalance,
                permissions: newUser.permissions,
                uplineStatus: result.matched
                    ? "matched"
                    : result?.reserved
                        ? "reserved"
                        : "no_upline",
                referredBy: newUser.referralDetails.referredBy
                    ? (await User.findById(newUser.referralDetails.referredBy))
                            ?.username
                    : null,
            },
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Login Route
router.post("/login", async (req, res) => {
    try {
        const { userInput, password, rememberMe } = req.body;
        if (!userInput || !password) {
            return res.status(400).json({ message: "Credentials required" });
        }

        const user = await User.findOne({
            $or: [{ email: userInput }, { username: userInput }],
        });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.status !== "active") {
            return res
                .status(403)
                .json({ message: `Account is ${user.status}` });
        }

        const tokenExpiration = rememberMe ? "30d" : "1d";
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType == "subadmin" ? "admin" : user.userType,
                permissions: user.permissions || { pages: [] },
            },
            process.env.JWT_SECRET,
            { expiresIn: tokenExpiration },
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                username: user.username,
                email: user.email,
                phone: user.phone,
                walletBalance: user.walletBalance,
                userType: user.userType,
                permissions: user.permissions,
            },
            rememberMe,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Verify Token Route
router.get("/verify", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user || user.status !== "active") {
            return res
                .status(403)
                .json({ valid: false, message: "Invalid user" });
        }
        res.json({ valid: true, user });
    } catch (error) {
        res.status(401).json({ valid: false, message: "Invalid token" });
    }
});

// Get Current User Route
router.get("/me", authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user || user.status !== "active") {
            return res
                .status(403)
                .json({ valid: false, message: "Invalid user" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(401).json({ success: false, message: "Failed" });
    }
});

// Logout Route
router.post("/logout", (req, res) => {
    res.json({ message: "Logged out" });
});

// Change Password Route
router.put("/change-password", authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ message: "Invalid input" });
        }

        const user = await User.findById(req.user.userId);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        user.password = await hashPassword(newPassword);
        await user.save();
        res.json({ message: "Password updated" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
