import express from 'express';
import User from '../models/User.js';
import Deposit from '../models/Deposit.js';
import Withdrawal from '../models/Withdrawal.js';
import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import IncomeExpense from '../models/IncomeExpense.js';
import SystemConfig from '../models/SystemConfig.js';
import GTCMember from '../models/GTCMember.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import mongoose from 'mongoose';

const router = express.Router();

// ==================== DASHBOARD ROUTE ====================
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        // Parallel aggregation queries for better performance
        const [
            userStats,
            depositStats,
            withdrawalStats,
            orderStats,
            productStats,
            courseStats,
            incomeExpenseStats,
            recentActivity,
            systemConfig
        ] = await Promise.all([
            // User Statistics
            User.aggregate([
                {
                    $facet: {
                        totalUsers: [{ $count: 'count' }],
                        usersByType: [
                            { $group: { _id: '$userType', count: { $sum: 1 } } }
                        ],
                        usersByStatus: [
                            { $group: { _id: '$status', count: { $sum: 1 } } }
                        ],
                        totalWalletBalance: [
                            { $group: { _id: null, total: { $sum: '$walletBalance' } } }
                        ],
                        newUsersToday: [
                            {
                                $match: {
                                    createdAt: {
                                        $gte: new Date(new Date().setHours(0, 0, 0, 0))
                                    }
                                }
                            },
                            { $count: 'count' }
                        ],
                        newUsersThisMonth: [
                            {
                                $match: {
                                    createdAt: {
                                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    }
                                }
                            },
                            { $count: 'count' }
                        ]
                    }
                }
            ]),

            // Deposit Statistics
            Deposit.aggregate([
                {
                    $facet: {
                        totalDeposits: [
                            { $match: { status: 'completed' } },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        pendingDeposits: [
                            { $match: { status: { $in: ['pending', 'processing'] } } },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        depositsByMethod: [
                            { $match: { status: 'completed' } },
                            { $group: { _id: '$paymentMethod', total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        depositsToday: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        depositsThisMonth: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: {
                                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        last7DaysDeposits: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: {
                                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
                                    total: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ]
                    }
                }
            ]),

            // Withdrawal Statistics
            Withdrawal.aggregate([
                {
                    $facet: {
                        totalWithdrawals: [
                            { $match: { status: 'completed' } },
                            { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } }
                        ],
                        pendingWithdrawals: [
                            { $match: { status: { $in: ['pending', 'processing'] } } },
                            { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } }
                        ],
                        withdrawalsByMethod: [
                            { $match: { status: 'completed' } },
                            { $group: { _id: '$withdrawalMethod', total: { $sum: '$netAmount' }, count: { $sum: 1 } } }
                        ],
                        withdrawalsToday: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } }
                        ],
                        withdrawalsThisMonth: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: {
                                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } }
                        ],
                        last7DaysWithdrawals: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: {
                                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
                                    total: { $sum: '$netAmount' },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ]
                    }
                }
            ]),

            // Order Statistics
            Order.aggregate([
                {
                    $facet: {
                        totalOrders: [
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        ordersByStatus: [
                            { $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        ordersToday: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        ordersThisMonth: [
                            {
                                $match: {
                                    createdAt: {
                                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        last7DaysOrders: [
                            {
                                $match: {
                                    createdAt: {
                                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                                    }
                                }
                            },
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                                    total: { $sum: '$amount' },
                                    count: { $sum: 1 }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ]
                    }
                }
            ]),

            // Product Statistics
            Product.aggregate([
                {
                    $facet: {
                        totalProducts: [{ $count: 'count' }],
                        productsByCategory: [
                            { $group: { _id: '$category', count: { $sum: 1 } } }
                        ],
                        bestsellers: [
                            { $match: { bestseller: true } },
                            { $count: 'count' }
                        ],
                        averagePrice: [
                            { $group: { _id: null, avg: { $avg: '$price' } } }
                        ]
                    }
                }
            ]),

            // Course Statistics
            Course.aggregate([
                {
                    $facet: {
                        totalCourses: [{ $count: 'count' }],
                        publishedCourses: [
                            { $match: { isPublished: true } },
                            { $count: 'count' }
                        ],
                        totalVideos: [
                            { $unwind: '$videos' },
                            { $count: 'count' }
                        ],
                        coursesByCategory: [
                            { $group: { _id: '$category', count: { $sum: 1 } } }
                        ]
                    }
                }
            ]),

            // Income/Expense Statistics
            IncomeExpense.aggregate([
                {
                    $facet: {
                        totalIncome: [
                            { $match: { type: 'income' } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }
                        ],
                        totalExpense: [
                            { $match: { type: 'expense' } },
                            { $group: { _id: null, total: { $sum: '$amount' } } }
                        ],
                        incomeByCategory: [
                            { $match: { type: 'income' } },
                            { $group: { _id: '$category', total: { $sum: '$amount' } } }
                        ],
                        expenseByCategory: [
                            { $match: { type: 'expense' } },
                            { $group: { _id: '$category', total: { $sum: '$amount' } } }
                        ],
                        last30DaysIncome: [
                            {
                                $match: {
                                    type: 'income',
                                    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                                }
                            },
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                                    total: { $sum: '$amount' }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ],
                        last30DaysExpense: [
                            {
                                $match: {
                                    type: 'expense',
                                    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
                                }
                            },
                            {
                                $group: {
                                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
                                    total: { $sum: '$amount' }
                                }
                            },
                            { $sort: { _id: 1 } }
                        ]
                    }
                }
            ]),

            // Recent Activity (last 10 actions)
            Promise.all([
                Deposit.find({ status: { $in: ['pending', 'processing'] } })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('transactionId amount status createdAt userId')
                    .populate('userId', 'name email'),
                Withdrawal.find({ status: { $in: ['pending', 'processing'] } })
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('transactionId netAmount status createdAt userId')
                    .populate('userId', 'name email'),
                Order.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('_id amount status createdAt userId')
                    .populate('userId', 'name email')
            ]),

            // System Configuration
            SystemConfig.getOrCreateConfig()
        ]);

        // Format response
        const dashboardData = {
            success: true,
            timestamp: new Date(),

            // Overview KPIs
            overview: {
                totalUsers: userStats[0].totalUsers[0]?.count || 0,
                totalWalletBalance: userStats[0].totalWalletBalance[0]?.total || 0,
                newUsersToday: userStats[0].newUsersToday[0]?.count || 0,
                newUsersThisMonth: userStats[0].newUsersThisMonth[0]?.count || 0,

                totalDeposits: depositStats[0].totalDeposits[0]?.total || 0,
                totalDepositCount: depositStats[0].totalDeposits[0]?.count || 0,
                pendingDeposits: depositStats[0].pendingDeposits[0]?.total || 0,
                pendingDepositCount: depositStats[0].pendingDeposits[0]?.count || 0,

                totalWithdrawals: withdrawalStats[0].totalWithdrawals[0]?.total || 0,
                totalWithdrawalCount: withdrawalStats[0].totalWithdrawals[0]?.count || 0,
                pendingWithdrawals: withdrawalStats[0].pendingWithdrawals[0]?.total || 0,
                pendingWithdrawalCount: withdrawalStats[0].pendingWithdrawals[0]?.count || 0,

                totalOrders: orderStats[0].totalOrders[0]?.total || 0,
                totalOrderCount: orderStats[0].totalOrders[0]?.count || 0,

                netRevenue: (depositStats[0].totalDeposits[0]?.total || 0) - (withdrawalStats[0].totalWithdrawals[0]?.total || 0)
            },

            // User Breakdown
            users: {
                byType: userStats[0].usersByType,
                byStatus: userStats[0].usersByStatus
            },

            // Financial Metrics
            financial: {
                deposits: {
                    today: depositStats[0].depositsToday[0] || { total: 0, count: 0 },
                    thisMonth: depositStats[0].depositsThisMonth[0] || { total: 0, count: 0 },
                    byMethod: depositStats[0].depositsByMethod,
                    last7Days: depositStats[0].last7DaysDeposits
                },
                withdrawals: {
                    today: withdrawalStats[0].withdrawalsToday[0] || { total: 0, count: 0 },
                    thisMonth: withdrawalStats[0].withdrawalsThisMonth[0] || { total: 0, count: 0 },
                    byMethod: withdrawalStats[0].withdrawalsByMethod,
                    last7Days: withdrawalStats[0].last7DaysWithdrawals
                }
            },

            // E-commerce Metrics
            ecommerce: {
                orders: {
                    today: orderStats[0].ordersToday[0] || { total: 0, count: 0 },
                    thisMonth: orderStats[0].ordersThisMonth[0] || { total: 0, count: 0 },
                    byStatus: orderStats[0].ordersByStatus,
                    last7Days: orderStats[0].last7DaysOrders
                },
                products: {
                    total: productStats[0].totalProducts[0]?.count || 0,
                    byCategory: productStats[0].productsByCategory,
                    bestsellers: productStats[0].bestsellers[0]?.count || 0,
                    averagePrice: productStats[0].averagePrice[0]?.avg || 0
                }
            },

            // Course Metrics
            courses: {
                total: courseStats[0].totalCourses[0]?.count || 0,
                published: courseStats[0].publishedCourses[0]?.count || 0,
                totalVideos: courseStats[0].totalVideos[0]?.count || 0,
                byCategory: courseStats[0].coursesByCategory
            },

            // Income/Expense Tracking
            incomeExpense: {
                totalIncome: incomeExpenseStats[0].totalIncome[0]?.total || 0,
                totalExpense: incomeExpenseStats[0].totalExpense[0]?.total || 0,
                netProfit: (incomeExpenseStats[0].totalIncome[0]?.total || 0) - (incomeExpenseStats[0].totalExpense[0]?.total || 0),
                incomeByCategory: incomeExpenseStats[0].incomeByCategory,
                expenseByCategory: incomeExpenseStats[0].expenseByCategory,
                last30Days: {
                    income: incomeExpenseStats[0].last30DaysIncome,
                    expense: incomeExpenseStats[0].last30DaysExpense
                }
            },

            // Recent Activity
            recentActivity: {
                pendingDeposits: recentActivity[0],
                pendingWithdrawals: recentActivity[1],
                recentOrders: recentActivity[2]
            },

            // System Config
            systemConfig: {
                systemPercentage: systemConfig.systemPercentage,
                traderPercentage: systemConfig.traderPercentage,
                performanceFeeFrequency: systemConfig.performanceFeeFrequency
            }
        };

        res.status(200).json(dashboardData);

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});


// ==================== DEPOSIT ROUTES ====================

// 1. Get all deposits with basic filtering
router.get('/deposits', authenticateToken, async (req, res) => {
    try {
        const { status, userId, page = 1, limit = 20 } = req.query;

        // Build simple filter
        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [deposits, total] = await Promise.all([
            Deposit.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email username')
                .populate('processedBy', 'name email'),
            Deposit.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: deposits,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get deposits error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deposits',
            error: error.message
        });
    }
});

// 2. Get single deposit
router.get('/deposits/:id', authenticateToken, async (req, res) => {
    try {
        const deposit = await Deposit.findById(req.params.id)
            .populate('userId', 'name email username')
            .populate('processedBy', 'name email');

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        res.status(200).json({
            success: true,
            data: deposit
        });
    } catch (error) {
        console.error('Get deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch deposit',
            error: error.message
        });
    }
});

// 3. Update deposit
router.patch('/deposits/:id', authenticateToken, async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const deposit = await Deposit.findById(req.params.id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        // Update fields
        if (status) deposit.status = status;
        if (adminNotes) deposit.adminNotes = adminNotes;

        // Set processedBy if completing
        if (status && ['completed', 'processing'].includes(status)) {
            deposit.processedBy = req.user.userId;
            deposit.processedAt = new Date();
        }

        await deposit.save();

        res.status(200).json({
            success: true,
            message: 'Deposit updated successfully',
            data: deposit
        });
    } catch (error) {
        console.error('Update deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update deposit',
            error: error.message
        });
    }
});

// 4. Delete deposit
router.delete('/deposits/:id', authenticateToken, async (req, res) => {
    try {
        const deposit = await Deposit.findById(req.params.id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        // Prevent deletion of completed deposits
        if (deposit.status === 'completed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete completed deposits'
            });
        }

        await Deposit.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Deposit deleted successfully'
        });
    } catch (error) {
        console.error('Delete deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete deposit',
            error: error.message
        });
    }
});


// ==================== WITHDRAWAL ROUTES ====================

// 1. Get all withdrawals with basic filtering
router.get('/withdrawals', authenticateToken, async (req, res) => {
    try {
        const { status, userId, page = 1, limit = 20 } = req.query;

        // Build simple filter
        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('userId', 'name email username')
                .populate('processedBy', 'name email'),
            Withdrawal.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: withdrawals,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawals',
            error: error.message
        });
    }
});

// 2. Get single withdrawal
router.get('/withdrawals/:id', authenticateToken, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id)
            .populate('userId', 'name email username')
            .populate('processedBy', 'name email');

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        res.status(200).json({
            success: true,
            data: withdrawal
        });
    } catch (error) {
        console.error('Get withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch withdrawal',
            error: error.message
        });
    }
});

// 3. Update withdrawal
router.patch('/withdrawals/:id', authenticateToken, async (req, res) => {
    try {
        const { status, adminNotes, rejectionReason } = req.body;

        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        // Update fields
        if (status) withdrawal.status = status;
        if (adminNotes) withdrawal.adminNotes = adminNotes;
        if (rejectionReason) withdrawal.rejectionReason = rejectionReason;

        // Set processedBy
        if (status && ['completed', 'processing', 'rejected'].includes(status)) {
            withdrawal.processedBy = req.user.userId;
            withdrawal.processedAt = new Date();
        }

        await withdrawal.save();

        res.status(200).json({
            success: true,
            message: 'Withdrawal updated successfully',
            data: withdrawal
        });
    } catch (error) {
        console.error('Update withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update withdrawal',
            error: error.message
        });
    }
});

// 4. Delete withdrawal
router.delete('/withdrawals/:id', authenticateToken, async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        // Prevent deletion of completed withdrawals
        if (withdrawal.status === 'completed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete completed withdrawals'
            });
        }

        // Refund to wallet if it was processing
        if (withdrawal.status === 'processing') {
            const user = await User.findById(withdrawal.userId);
            if (user) {
                user.walletBalance += withdrawal.amount;
                await user.save();
            }
        }

        await Withdrawal.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Withdrawal deleted successfully'
        });
    } catch (error) {
        console.error('Delete withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete withdrawal',
            error: error.message
        });
    }
});

// ==================== USER ROUTES ====================

// 1. Get all users with filtering
router.get('/users', authenticateToken, async (req, res) => {
    try {
        const { status, userType, search, page = 1, limit = 20 } = req.query;

        // Build filter
        const filter = { email: { $ne: process.env.ADMIN_EMAIL } };
        if (status) filter.status = status;
        if (userType) filter.userType = userType;

        // Search filter
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total, stats] = await Promise.all([
            User.find(filter)
                .select('-password -gtcfx.accessToken -gtcfx.refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(filter),
            User.aggregate([
                {
                    $facet: {
                        totalUsers: [{ $count: 'count' }],
                        activeUsers: [
                            { $match: { status: 'active' } },
                            { $count: 'count' }
                        ],
                        inactiveUsers: [
                            { $match: { status: 'inactive' } },
                            { $count: 'count' }
                        ],
                        agentUsers: [
                            { $match: { userType: 'agent' } },
                            { $count: 'count' }
                        ],
                        traderUsers: [
                            { $match: { userType: 'trader' } },
                            { $count: 'count' }
                        ],
                        totalWalletBalance: [
                            { $group: { _id: null, total: { $sum: '$walletBalance' } } }
                        ]
                    }
                }
            ])
        ]);

        // Format stats
        const formattedStats = {
            total: stats[0].totalUsers[0]?.count || 0,
            active: stats[0].activeUsers[0]?.count || 0,
            inactive: stats[0].inactiveUsers[0]?.count || 0,
            agents: stats[0].agentUsers[0]?.count || 0,
            traders: stats[0].traderUsers[0]?.count || 0,
            totalBalance: stats[0].totalWalletBalance[0]?.total || 0
        };

        res.status(200).json({
            success: true,
            data: users,
            stats: formattedStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// 2. Get single user with full details
router.get('/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -gtcfx.accessToken -gtcfx.refreshToken')
            .populate('referralDetails.referredBy', 'name username email')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// 3. Update user (admin can only update basic details)
router.patch('/users/:id', authenticateToken, async (req, res) => {
    try {
        const { name, email, phone, status, userType } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update only allowed fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (status) user.status = status;
        if (userType) user.userType = userType;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// 4. Get user's team tree
router.get('/users/:id/tree', authenticateToken, async (req, res) => {
    try {
        const rootUser = await User.findById(req.params.id)
            .select('name username email phone userType status walletBalance financials')
            .lean();

        if (!rootUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Recursive function to build tree
        async function buildTree(userId, level = 1, maxLevel = 10) {
            if (level > maxLevel) return [];

            const children = await User.find({
                'referralDetails.referredBy': userId
            })
                .select('name username email phone userType status walletBalance financials createdAt')
                .lean();

            const tree = [];
            for (const child of children) {
                tree.push({
                    ...child,
                    level,
                    children: await buildTree(child._id, level + 1, maxLevel)
                });
            }
            return tree;
        }

        const tree = await buildTree(req.params.id);

        res.status(200).json({
            success: true,
            data: {
                root: rootUser,
                tree
            }
        });
    } catch (error) {
        console.error('Get user tree error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user tree',
            error: error.message
        });
    }
});

// ==================== GTC MEMBERS ROUTES ====================

// 1. Get all GTC members with filtering
router.get('/gtc-members', authenticateToken, async (req, res) => {
    try {
        console.log('='.repeat(80));
        console.log('[GTC MEMBERS] Fetching all GTC members with filters');
        console.log('[GTC MEMBERS] Query params:', req.query);

        const { level, hasParent, search, page = 1, limit = 20 } = req.query;

        // Build filter
        const filter = {};

        if (level) filter.level = parseInt(level);

        if (hasParent === 'true') {
            filter.parentGtcUserId = { $ne: null };
        } else if (hasParent === 'false') {
            filter.parentGtcUserId = null;
        }

        // Search filter
        if (search) {
            filter.$or = [
                { gtcUserId: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('[GTC MEMBERS] Applied filter:', JSON.stringify(filter, null, 2));

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        console.log('[GTC MEMBERS] Pagination - Page:', page, 'Limit:', limit, 'Skip:', skip);

        const [members, total, stats] = await Promise.all([
            GTCMember.find(filter)
                .sort({ joinedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            GTCMember.countDocuments(filter),
            GTCMember.aggregate([
                {
                    $facet: {
                        totalMembers: [{ $count: 'count' }],
                        withParent: [
                            { $match: { parentGtcUserId: { $ne: null } } },
                            { $count: 'count' }
                        ],
                        rootMembers: [
                            { $match: { parentGtcUserId: null } },
                            { $count: 'count' }
                        ],
                        avgLevel: [
                            { $group: { _id: null, avg: { $avg: '$level' } } }
                        ],
                        maxLevel: [
                            { $group: { _id: null, max: { $max: '$level' } } }
                        ]
                    }
                }
            ])
        ]);

        console.log('[GTC MEMBERS] Query completed - Found:', members.length, 'Total:', total);

        // Format stats
        const formattedStats = {
            total: stats[0].totalMembers[0]?.count || 0,
            withParent: stats[0].withParent[0]?.count || 0,
            rootMembers: stats[0].rootMembers[0]?.count || 0,
            avgLevel: stats[0].avgLevel[0]?.avg || 0,
            maxLevel: stats[0].maxLevel[0]?.max || 0
        };

        console.log('[GTC MEMBERS] Stats:', formattedStats);
        console.log('[GTC MEMBERS] Request completed successfully');
        console.log('='.repeat(80));

        res.status(200).json({
            success: true,
            data: members,
            stats: formattedStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('='.repeat(80));
        console.error('[GTC MEMBERS] ERROR - Failed to fetch members');
        console.error('[GTC MEMBERS] Error details:', error.message);
        console.error('[GTC MEMBERS] Stack trace:', error.stack);
        console.error('='.repeat(80));

        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC members',
            error: error.message
        });
    }
});

// 2. Get single GTC member (supports both MongoDB _id and gtcUserId)
router.get('/gtc-members/:id', authenticateToken, async (req, res) => {
    try {
        console.log('='.repeat(80));
        console.log('[GTC MEMBER] Fetching single member');

        const { id } = req.params;
        console.log('[GTC MEMBER] Requested ID:', id);

        let member;
        let searchMethod;

        // Check if it's a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            searchMethod = 'MongoDB ObjectId';
            console.log('[GTC MEMBER] Searching by MongoDB _id');
            member = await GTCMember.findById(id).lean();
        } else {
            searchMethod = 'GTC User ID';
            console.log('[GTC MEMBER] Searching by gtcUserId');
            member = await GTCMember.findOne({ gtcUserId: id }).lean();
        }

        if (!member) {
            console.log('[GTC MEMBER] Member not found using:', searchMethod);
            console.log('='.repeat(80));
            return res.status(404).json({
                success: false,
                message: 'GTC member not found'
            });
        }

        console.log('[GTC MEMBER] Member found:', member.gtcUserId, '-', member.username);
        console.log('[GTC MEMBER] Search method used:', searchMethod);
        console.log('[GTC MEMBER] Request completed successfully');
        console.log('='.repeat(80));

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        console.error('='.repeat(80));
        console.error('[GTC MEMBER] ERROR - Failed to fetch member');
        console.error('[GTC MEMBER] Error details:', error.message);
        console.error('[GTC MEMBER] Stack trace:', error.stack);
        console.error('='.repeat(80));

        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC member',
            error: error.message
        });
    }
});

// 3. Get GTC member's team tree (supports both MongoDB _id and gtcUserId)
router.get('/gtc-members/:id/tree', authenticateToken, async (req, res) => {
    try {
        console.log('='.repeat(80));
        console.log('[GTC MEMBER TREE] Fetching member tree');

        const { id } = req.params;
        console.log('[GTC MEMBER TREE] Root ID:', id);

        let rootMember;
        let searchMethod;

        // Check if it's a valid MongoDB ObjectId
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            searchMethod = 'MongoDB ObjectId';
            console.log('[GTC MEMBER TREE] Searching root by MongoDB _id');
            rootMember = await GTCMember.findById(id).lean();
        } else {
            searchMethod = 'GTC User ID';
            console.log('[GTC MEMBER TREE] Searching root by gtcUserId');
            rootMember = await GTCMember.findOne({ gtcUserId: id }).lean();
        }

        if (!rootMember) {
            console.log('[GTC MEMBER TREE] Root member not found using:', searchMethod);
            console.log('='.repeat(80));
            return res.status(404).json({
                success: false,
                message: 'GTC member not found'
            });
        }

        console.log('[GTC MEMBER TREE] Root member found:', rootMember.gtcUserId, '-', rootMember.username);
        console.log('[GTC MEMBER TREE] Building tree structure...');

        // Recursive function to build tree
        async function buildTree(gtcUserId, level = 1, maxLevel = 10) {
            if (level > maxLevel) {
                console.log('[GTC MEMBER TREE] Max level reached at level:', level);
                return [];
            }

            const children = await GTCMember.find({
                parentGtcUserId: gtcUserId
            }).lean();

            console.log('[GTC MEMBER TREE] Level', level, '- Found', children.length, 'children for gtcUserId:', gtcUserId);

            const tree = [];
            for (const child of children) {
                tree.push({
                    ...child,
                    level,
                    children: await buildTree(child.gtcUserId, level + 1, maxLevel)
                });
            }
            return tree;
        }

        const tree = await buildTree(rootMember.gtcUserId);

        console.log('[GTC MEMBER TREE] Tree built successfully');
        console.log('[GTC MEMBER TREE] Total direct children:', tree.length);
        console.log('[GTC MEMBER TREE] Request completed successfully');
        console.log('='.repeat(80));

        res.status(200).json({
            success: true,
            data: {
                root: rootMember,
                tree
            }
        });
    } catch (error) {
        console.error('='.repeat(80));
        console.error('[GTC MEMBER TREE] ERROR - Failed to fetch member tree');
        console.error('[GTC MEMBER TREE] Error details:', error.message);
        console.error('[GTC MEMBER TREE] Stack trace:', error.stack);
        console.error('='.repeat(80));

        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC member tree',
            error: error.message
        });
    }
});

// 4. Get GTC member by GTC User ID (explicit lookup - kept for backward compatibility)
router.get('/gtc-members/lookup/:gtcUserId', authenticateToken, async (req, res) => {
    try {
        console.log('='.repeat(80));
        console.log('[GTC MEMBER LOOKUP] Explicit gtcUserId lookup');
        console.log('[GTC MEMBER LOOKUP] GTC User ID:', req.params.gtcUserId);

        const member = await GTCMember.findOne({
            gtcUserId: req.params.gtcUserId
        }).lean();

        if (!member) {
            console.log('[GTC MEMBER LOOKUP] Member not found with gtcUserId:', req.params.gtcUserId);
            console.log('='.repeat(80));
            return res.status(404).json({
                success: false,
                message: 'GTC member not found'
            });
        }

        console.log('[GTC MEMBER LOOKUP] Member found:', member.username, '-', member.email);
        console.log('[GTC MEMBER LOOKUP] Request completed successfully');
        console.log('='.repeat(80));

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        console.error('='.repeat(80));
        console.error('[GTC MEMBER LOOKUP] ERROR - Failed to lookup member');
        console.error('[GTC MEMBER LOOKUP] Error details:', error.message);
        console.error('[GTC MEMBER LOOKUP] Stack trace:', error.stack);
        console.error('='.repeat(80));

        res.status(500).json({
            success: false,
            message: 'Failed to lookup GTC member',
            error: error.message
        });
    }
});

// 5. Get GTC member statistics
router.get('/gtc-members/stats/overview', authenticateToken, async (req, res) => {
    try {
        console.log('='.repeat(80));
        console.log('[GTC STATS] Fetching statistics overview');

        const stats = await GTCMember.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byLevel: [
                        { $group: { _id: '$level', count: { $sum: 1 } } },
                        { $sort: { _id: 1 } }
                    ],
                    withParent: [
                        { $match: { parentGtcUserId: { $ne: null } } },
                        { $count: 'count' }
                    ],
                    rootMembers: [
                        { $match: { parentGtcUserId: null } },
                        { $count: 'count' }
                    ],
                    recentJoins: [
                        { $sort: { joinedAt: -1 } },
                        { $limit: 10 },
                        { $project: { name: 1, username: 1, email: 1, joinedAt: 1, level: 1 } }
                    ]
                }
            }
        ]);

        const formattedData = {
            total: stats[0].total[0]?.count || 0,
            byLevel: stats[0].byLevel,
            withParent: stats[0].withParent[0]?.count || 0,
            rootMembers: stats[0].rootMembers[0]?.count || 0,
            recentJoins: stats[0].recentJoins
        };

        console.log('[GTC STATS] Total members:', formattedData.total);
        console.log('[GTC STATS] Members with parent:', formattedData.withParent);
        console.log('[GTC STATS] Root members:', formattedData.rootMembers);
        console.log('[GTC STATS] Levels breakdown:', formattedData.byLevel);
        console.log('[GTC STATS] Request completed successfully');
        console.log('='.repeat(80));

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('='.repeat(80));
        console.error('[GTC STATS] ERROR - Failed to fetch statistics');
        console.error('[GTC STATS] Error details:', error.message);
        console.error('[GTC STATS] Stack trace:', error.stack);
        console.error('='.repeat(80));

        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC statistics',
            error: error.message
        });
    }
});

export default router;
