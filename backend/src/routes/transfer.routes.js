import express from 'express';
import Transfer from '../models/Transfer.js';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Create Transfer
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const senderId = req.user.userId;
        const { amount, receiverIdentifier, note } = req.body;

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount',
            });
        }

        if (!receiverIdentifier || !receiverIdentifier.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Receiver username or email is required',
            });
        }

        // Get sender
        const sender = await User.findById(senderId);
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: 'Sender not found',
            });
        }

        // Check sender is not admin
        if (sender.userType === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin accounts cannot make transfers',
            });
        }

        // Check sender balance > 0
        if (sender.walletBalance <= 0 || sender.walletBalance < amount) {
            return res.status(400).json({
                success: false,
                message: `Insufficient balance. Your balance: $${sender.walletBalance.toFixed(2)}`,
            });
        }

        // Find receiver by username or email
        const receiver = await User.findOne({
            $or: [
                { username: receiverIdentifier.trim() },
                { email: receiverIdentifier.trim().toLowerCase() },
            ],
        });

        if (!receiver) {
            return res.status(404).json({
                success: false,
                message: 'Receiver not found. Please check username or email.',
            });
        }

        // Check receiver is not admin
        if (receiver.userType === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot transfer to admin accounts',
            });
        }

        // Prevent self-transfer
        if (sender._id.toString() === receiver._id.toString()) {
            return res.status(400).json({
                success: false,
                message: 'Cannot transfer to yourself',
            });
        }

        // Create transfer record
        const transfer = new Transfer({
            senderId: sender._id,
            receiverId: receiver._id,
            amount,
            note: note?.trim() || '',
        });

        // Deduct from sender
        sender.walletBalance = Math.max(0, sender.walletBalance - amount);

        // Add to receiver
        receiver.walletBalance = (receiver.walletBalance || 0) + amount;

        // Save
        await transfer.save();
        await sender.save();
        await receiver.save();

        // Update financials
        await sender.updateFinancials();
        await receiver.updateFinancials();

        res.json({
            success: true,
            message: `Successfully transferred $${amount.toFixed(2)} to ${receiver.username}`,
            data: {
                transferId: transfer._id,
                amount: transfer.amount,
                receiver: {
                    username: receiver.username,
                    name: receiver.name,
                },
                newBalance: sender.walletBalance,
                timestamp: transfer.createdAt,
            },
        });
    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error processing transfer',
        });
    }
});

// Get Transfer History
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { type = 'all', page = 1, limit = 20 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = {};

        if (type === 'sent') {
            query.senderId = userId;
        } else if (type === 'received') {
            query.receiverId = userId;
        } else {
            query.$or = [{ senderId: userId }, { receiverId: userId }];
        }

        const transfers = await Transfer.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('senderId', 'name username')
            .populate('receiverId', 'name username');

        const total = await Transfer.countDocuments(query);

        const formattedTransfers = transfers.map((t) => ({
            id: t._id,
            amount: t.amount,
            direction: t.senderId._id.toString() === userId ? 'sent' : 'received',
            sender: {
                username: t.senderId.username,
                name: t.senderId.name,
            },
            receiver: {
                username: t.receiverId.username,
                name: t.receiverId.name,
            },
            note: t.note,
            createdAt: t.createdAt,
        }));

        res.json({
            success: true,
            data: formattedTransfers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Get transfer history error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving transfer history',
        });
    }
});

// Search Users (exclude admins)
router.get('/search/users', authenticateToken, async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.userId;

        if (!query || query.trim().length < 2) {
            return res.json({
                success: true,
                data: [],
            });
        }

        const users = await User.find({
            _id: { $ne: userId },
            userType: { $ne: 'admin' },
            status: 'active',
            $or: [
                { username: { $regex: query.trim(), $options: 'i' } },
                { email: { $regex: query.trim(), $options: 'i' } },
                { name: { $regex: query.trim(), $options: 'i' } },
            ],
        })
            .select('name username email')
            .limit(10);

        res.json({
            success: true,
            data: users.map((u) => ({
                id: u._id,
                name: u.name,
                username: u.username,
                email: u.email,
            })),
        });
    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error searching users',
        });
    }
});

export default router;
