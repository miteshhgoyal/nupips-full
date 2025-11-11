// routes/profile.routes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Get my profile (unchanged)
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

        // IMPORTANT: Email and phone are NOT updatable by users
        // Ignore any incoming email/phone to prevent changes.
        // If needed, you can log attempts here.

        // Editable fields
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

        // Password change flow
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

export default router;
