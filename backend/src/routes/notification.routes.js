import express from 'express';
import Notification from '../models/Notification.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Get user notifications (paginated, unread first)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const notifications = await Notification.find({ user: req.user.userId })
            .sort({ isRead: 1, createdAt: -1 }) // unread first, then newest
            .limit(limit)
            .skip(skip)
            .lean();

        const total = await Notification.countDocuments({ user: req.user.userId });
        const unreadCount = await Notification.countDocuments({
            user: req.user.userId,
            isRead: false
        });

        res.json({
            success: true,
            notifications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                unreadCount
            }
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications'
        });
    }
});

// Get unread count only
router.get('/count', authenticateToken, async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            user: req.user.userId,
            isRead: false
        });

        res.json({
            success: true,
            unreadCount
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch unread count'
        });
    }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark as read'
        });
    }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const result = await Notification.updateMany(
            { user: req.user.userId, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: `Marked ${result.modifiedCount} notifications as read`
        });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all as read'
        });
    }
});

// Delete single notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification'
        });
    }
});

// Delete multiple notifications
router.delete('/bulk', authenticateToken, async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Notification IDs are required'
            });
        }

        const result = await Notification.deleteMany({
            _id: { $in: ids },
            user: req.user.userId
        });

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} notifications`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notifications'
        });
    }
});

// Delete all notifications
router.delete('/', authenticateToken, async (req, res) => {
    try {
        const result = await Notification.deleteMany({ user: req.user.userId });

        res.json({
            success: true,
            message: `Deleted all ${result.deletedCount} notifications`
        });
    } catch (error) {
        console.error('Delete all notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete all notifications'
        });
    }
});

export default router;
