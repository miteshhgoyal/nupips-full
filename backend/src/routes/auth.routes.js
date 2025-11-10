import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { name, username, email, phone, password } = req.body;

        // Validate required fields
        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({
                message: 'All fields are required'
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedpass = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name,
            username,
            email,
            phone,
            password: hashedpass
        });

        await newUser.save();

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
                walletBalance: newUser.walletBalance
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
                walletBalance: user.walletBalance
            },
            rememberMe
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId)
            .select('-password');

        if (user)
            res.status(200).json({
                valid: true,
                user
            });

        else
            res.status(400).json({
                valid: false,
                user
            })
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ valid: false, message: 'Invalid token' });
    }
});

router.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

export default router;