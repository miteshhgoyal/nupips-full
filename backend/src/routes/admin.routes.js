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
import { autoCheckPermission } from '../middlewares/checkPermission.js';
import mongoose from 'mongoose';

const router = express.Router();

router.use(authenticateToken);
router.use(autoCheckPermission);

// ==================== DASHBOARD ROUTE ====================

router.get('/dashboard', async (req, res) => {
    try {
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
            User.aggregate([
                {
                    $facet: {
                        totalUsers: [{ $count: 'count' }],
                        usersByType: [{ $group: { _id: '$userType', count: { $sum: 1 } } }],
                        usersByStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                        totalWalletBalance: [{ $group: { _id: null, total: { $sum: '$walletBalance' } } }],
                        newUsersToday: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $count: 'count' }
                        ],
                        newUsersThisMonth: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                                }
                            },
                            { $count: 'count' }
                        ]
                    }
                }
            ]),

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
                                    completedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        last7DaysDeposits: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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
                                    completedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$netAmount' }, count: { $sum: 1 } } }
                        ],
                        last7DaysWithdrawals: [
                            {
                                $match: {
                                    status: 'completed',
                                    completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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

            Order.aggregate([
                {
                    $facet: {
                        totalOrders: [{ $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }],
                        ordersByStatus: [{ $group: { _id: '$status', total: { $sum: '$amount' }, count: { $sum: 1 } } }],
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
                                    createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
                        ],
                        last7DaysOrders: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
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

            Product.aggregate([
                {
                    $facet: {
                        totalProducts: [{ $count: 'count' }],
                        productsByCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }],
                        bestsellers: [{ $match: { bestseller: true } }, { $count: 'count' }],
                        averagePrice: [{ $group: { _id: null, avg: { $avg: '$price' } } }]
                    }
                }
            ]),

            Course.aggregate([
                {
                    $facet: {
                        totalCourses: [{ $count: 'count' }],
                        publishedCourses: [{ $match: { isPublished: true } }, { $count: 'count' }],
                        totalVideos: [{ $unwind: '$videos' }, { $count: 'count' }],
                        coursesByCategory: [{ $group: { _id: '$category', count: { $sum: 1 } } }]
                    }
                }
            ]),

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

            SystemConfig.getOrCreateConfig()
        ]);

        const dashboardData = {
            success: true,
            timestamp: new Date(),
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
            users: {
                byType: userStats[0].usersByType,
                byStatus: userStats[0].usersByStatus
            },
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
            courses: {
                total: courseStats[0].totalCourses[0]?.count || 0,
                published: courseStats[0].publishedCourses[0]?.count || 0,
                totalVideos: courseStats[0].totalVideos[0]?.count || 0,
                byCategory: courseStats[0].coursesByCategory
            },
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
            recentActivity: {
                pendingDeposits: recentActivity[0],
                pendingWithdrawals: recentActivity[1],
                recentOrders: recentActivity[2]
            },
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

router.get('/deposits', async (req, res) => {
    try {
        const { status, userId, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

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

router.get('/deposits/:id', async (req, res) => {
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

router.patch('/deposits/:id', async (req, res) => {
    try {
        const { status, adminNotes } = req.body;

        const deposit = await Deposit.findById(req.params.id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        const previousStatus = deposit.status;

        if (status) deposit.status = status;
        if (adminNotes) deposit.adminNotes = adminNotes;

        if (status && ['completed', 'processing'].includes(status)) {
            deposit.processedBy = req.user.userId;
            deposit.processedAt = new Date();
        }

        if (status === 'completed' && previousStatus !== 'completed') {
            const user = await User.findById(deposit.userId);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            user.walletBalance += deposit.amount;
            user.financials.totalDeposits += deposit.amount;
            user.financials.depositHistory.push({
                amount: deposit.amount,
                date: new Date(),
                transactionId: deposit.transactionId,
                method: deposit.paymentMethod
            });

            await user.save();
            deposit.completedAt = new Date();
        }

        await deposit.save();

        res.status(200).json({
            success: true,
            message: status === 'completed' && previousStatus !== 'completed'
                ? `Deposit completed successfully. $${deposit.amount} added to user's wallet.`
                : 'Deposit updated successfully',
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

router.delete('/deposits/:id', async (req, res) => {
    try {
        const deposit = await Deposit.findById(req.params.id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

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

router.get('/withdrawals', async (req, res) => {
    try {
        const { status, userId, page = 1, limit = 20 } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.userId = userId;

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

router.get('/withdrawals/:id', async (req, res) => {
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

router.patch('/withdrawals/:id', async (req, res) => {
    try {
        const { status, adminNotes, rejectionReason } = req.body;

        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (status) withdrawal.status = status;
        if (adminNotes) withdrawal.adminNotes = adminNotes;
        if (rejectionReason) withdrawal.rejectionReason = rejectionReason;

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

router.delete('/withdrawals/:id', async (req, res) => {
    try {
        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status === 'completed') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete completed withdrawals'
            });
        }

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

router.get('/users', async (req, res) => {
    try {
        const { status, userType, search, page = 1, limit = 20 } = req.query;

        const filter = { email: { $ne: process.env.ADMIN_EMAIL }, userType: { $ne: 'subadmin' } };
        if (status) filter.status = status;
        if (userType) filter.userType = userType;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

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
                        activeUsers: [{ $match: { status: 'active' } }, { $count: 'count' }],
                        inactiveUsers: [{ $match: { status: 'inactive' } }, { $count: 'count' }],
                        agentUsers: [{ $match: { userType: 'agent' } }, { $count: 'count' }],
                        traderUsers: [{ $match: { userType: 'trader' } }, { $count: 'count' }],
                        totalWalletBalance: [{ $group: { _id: null, total: { $sum: '$walletBalance' } } }]
                    }
                }
            ])
        ]);

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

router.get('/users/list', async (req, res) => {
    try {
        const users = await User.find({
            userType: { $in: ['admin', 'subadmin'] },
            status: 'active'
        })
            .select('_id name username email userType')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Get users list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users list',
            error: error.message
        });
    }
});

router.get('/users/:id', async (req, res) => {
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

router.patch('/users/:id', async (req, res) => {
    try {
        const { name, email, phone, status, userType } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

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

router.get('/users/:id/tree', async (req, res) => {
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

router.get('/gtc-members/export', async (req, res) => {
    try {
        const members = await GTCMember.find()
            .populate('onboardingDoneBy', 'name email username')
            .sort({ joinedAt: -1 })
            .lean();

        const exportData = members.map(member => ({
            'GTC User ID': member.gtcUserId,
            'Name': member.name || '-',
            'Username': member.username || '-',
            'Email': member.email || '-',
            'Phone': member.phone || '-',
            'Level': member.level,
            'Parent ID': member.parentGtcUserId || '-',
            'Balance': member.balance || 0,
            'Status': member.status,
            'Onboarded (Call)': member.onboardedWithCall ? 'Yes' : 'No',
            'Onboarded (Message)': member.onboardedWithMessage ? 'Yes' : 'No',
            'Onboarded By': member.onboardingDoneBy?.name || '-',
            'Joined Date': member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '-'
        }));

        res.status(200).json({
            success: true,
            data: exportData,
            message: `Exported ${exportData.length} members`
        });
    } catch (error) {
        console.error('Failed to export GTC members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export GTC members',
            error: error.message
        });
    }
});

// ==================== GTC MEMBERS ROUTES ====================

// ============================================
// GET: Fetch all GTC members with filters
// ============================================
router.get('/gtc-members', async (req, res) => {
    try {
        const { page = 1, limit = 20, level, hasParent, search } = req.query;

        const filter = {};

        if (level) {
            filter.level = parseInt(level);
        }

        if (hasParent === 'true') {
            filter.parentGtcUserId = { $ne: null };
        } else if (hasParent === 'false') {
            filter.parentGtcUserId = null;
        }

        if (search) {
            filter.$or = [
                { gtcUserId: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } },
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [members, total, stats] = await Promise.all([
            GTCMember.find(filter)
                .sort({ joinedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('onboardingDoneBy', 'name email username userType')
                .populate('onboardingDoneBy', 'name email username userType')
                .lean(),
            GTCMember.countDocuments(filter),
            GTCMember.aggregate([
                {
                    $facet: {
                        totalMembers: [{ $count: 'count' }],
                        withParent: [
                            { $match: { parentGtcUserId: { $ne: null } } },
                            { $count: 'count' },
                        ],
                        rootMembers: [
                            { $match: { parentGtcUserId: null } },
                            { $count: 'count' },
                        ],
                        avgLevel: [{ $group: { _id: null, avg: { $avg: '$level' } } }],
                        maxLevel: [{ $group: { _id: null, max: { $max: '$level' } } }],
                    },
                },
            ]),
        ]);

        const formattedStats = {
            total: stats[0].totalMembers[0]?.count || 0,
            withParent: stats[0].withParent[0]?.count || 0,
            rootMembers: stats[0].rootMembers[0]?.count || 0,
            avgLevel: stats[0].avgLevel[0]?.avg || 0,
            maxLevel: stats[0].maxLevel[0]?.max || 0,
        };

        res.status(200).json({
            success: true,
            data: members,
            stats: formattedStats,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error('Failed to fetch GTC members:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC members',
            error: error.message,
        });
    }
});

// ============================================
// GET: Fetch single member by ID
// ============================================
router.get('/gtc-members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let member;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id)
                .populate('onboardingDoneBy', 'name email username userType')
                .populate('onboardingDoneBy', 'name email username userType')
                .lean();
        } else {
            member = await GTCMember.findOne({ gtcUserId: id })
                .populate('onboardingDoneBy', 'name email username userType')
                .lean();
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found',
            });
        }

        res.status(200).json({
            success: true,
            data: member,
        });
    } catch (error) {
        console.error('Failed to fetch GTC member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC member',
            error: error.message,
        });
    }
});

router.patch('/gtc-members/:id/onboarding', async (req, res) => {
    try {
        const { onboardedWithCall, onboardedWithMessage, onboardingDoneBy } = req.body;

        const member = await GTCMember.findOne({
            $or: [
                { _id: req.params.id },
                { gtcUserId: req.params.id }
            ]
        });

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found'
            });
        }

        // Check permissions for subadmin
        if (req.user.userType === 'subadmin') {
            // Subadmin can only toggle if they are the one who onboarded OR if no one has onboarded yet
            if (member.onboardingDoneBy && member.onboardingDoneBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only modify onboarding status for members you onboarded'
                });
            }
        }

        // Update onboarding status
        if (onboardedWithCall !== undefined) {
            member.onboardedWithCall = onboardedWithCall;
        }
        if (onboardedWithMessage !== undefined) {
            member.onboardedWithMessage = onboardedWithMessage;
        }

        // Handle onboardingDoneBy assignment
        if (onboardingDoneBy !== undefined) {
            // Only admin can change onboardingDoneBy
            if (req.user.userType !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Only admins can change who onboarded a member'
                });
            }
            member.onboardingDoneBy = onboardingDoneBy || null;
        } else {
            // Auto-assign if toggling ON and not already assigned
            if ((onboardedWithCall || onboardedWithMessage) && !member.onboardingDoneBy) {
                member.onboardingDoneBy = req.user._id;
            }
        }

        await member.save();

        // Populate onboardingDoneBy before returning
        await member.populate('onboardingDoneBy', 'name username email');

        res.status(200).json({
            success: true,
            message: 'Onboarding status updated successfully',
            data: member
        });
    } catch (error) {
        console.error('Update onboarding status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update onboarding status',
            error: error.message
        });
    }
});

// ============================================
// GET: Fetch member tree/hierarchy
// ============================================
router.get('/gtc-members/:id/tree', async (req, res) => {
    try {
        const { id } = req.params;
        let rootMember;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            rootMember = await GTCMember.findById(id)
                .populate('onboardingDoneBy', 'name email username')
                .lean();
        } else {
            rootMember = await GTCMember.findOne({ gtcUserId: id })
                .populate('onboardingDoneBy', 'name email username')
                .lean();
        }

        if (!rootMember) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found',
            });
        }

        async function buildTree(gtcUserId, level = 1, maxLevel = 10) {
            if (level > maxLevel) return [];

            const children = await GTCMember.find({
                parentGtcUserId: gtcUserId,
            })
                .populate('onboardingDoneBy', 'name email username')
                .lean();

            const tree = [];
            for (const child of children) {
                tree.push({
                    ...child,
                    level,
                    children: await buildTree(child.gtcUserId, level + 1, maxLevel),
                });
            }
            return tree;
        }

        const tree = await buildTree(rootMember.gtcUserId);

        res.status(200).json({
            success: true,
            data: {
                root: rootMember,
                tree,
            },
        });
    } catch (error) {
        console.error('Failed to fetch member tree:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch member tree',
            error: error.message,
        });
    }
});

router.get('/gtc-members/lookup/:gtcUserId', async (req, res) => {
    try {
        const member = await GTCMember.findOne({
            gtcUserId: req.params.gtcUserId
        }).lean();

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found'
            });
        }

        res.status(200).json({
            success: true,
            data: member
        });
    } catch (error) {
        console.error('Failed to lookup GTC member:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to lookup GTC member',
            error: error.message
        });
    }
});

router.get('/gtc-members/stats/overview', async (req, res) => {
    try {
        const stats = await GTCMember.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    byLevel: [{ $group: { _id: '$level', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
                    withParent: [{ $match: { parentGtcUserId: { $ne: null } } }, { $count: 'count' }],
                    rootMembers: [{ $match: { parentGtcUserId: null } }, { $count: 'count' }],
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

        res.status(200).json({
            success: true,
            data: formattedData
        });
    } catch (error) {
        console.error('Failed to fetch GTC statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC statistics',
            error: error.message
        });
    }
});

// ============================================
// PATCH: Toggle onboarded with call status
// ============================================
router.patch('/gtc-members/:id/toggle-call', async (req, res) => {
    try {
        const { id } = req.params;
        let member;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id);
        } else {
            member = await GTCMember.findOne({ gtcUserId: id });
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found',
            });
        }

        // Toggle the status
        member.onboardedWithCall = !member.onboardedWithCall;

        // Auto-assign onboardingDoneBy if not set and turning ON
        if (member.onboardedWithCall && !member.onboardingDoneBy) {
            member.onboardingDoneBy = req.user._id || req.user.userId;
        }

        // Set completion date if both are done
        if (
            member.onboardedWithCall &&
            member.onboardedWithMessage &&
            !member.onboardingCompletedAt
        ) {
            member.onboardingCompletedAt = new Date();
        }

        // Clear completion date if unchecking
        if (!member.onboardedWithCall || !member.onboardedWithMessage) {
            member.onboardingCompletedAt = null;
        }

        member.lastUpdated = new Date();
        await member.save();
        await member.populate('onboardingDoneBy', 'name email username userType');

        res.status(200).json({
            success: true,
            message: `Onboarded with call status updated to ${member.onboardedWithCall}`,
            data: member.toObject(),
        });
    } catch (error) {
        console.error('Toggle call status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle call status',
            error: error.message,
        });
    }
});

// ============================================
// PATCH: Toggle onboarded with message status
// ============================================
router.patch('/gtc-members/:id/toggle-message', async (req, res) => {
    try {
        const { id } = req.params;
        let member;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id);
        } else {
            member = await GTCMember.findOne({ gtcUserId: id });
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found',
            });
        }

        // Toggle the status
        member.onboardedWithMessage = !member.onboardedWithMessage;

        // Auto-assign onboardingDoneBy if not set and turning ON
        if (member.onboardedWithMessage && !member.onboardingDoneBy) {
            member.onboardingDoneBy = req.user._id || req.user.userId;
        }

        // Set completion date if both are done
        if (
            member.onboardedWithCall &&
            member.onboardedWithMessage &&
            !member.onboardingCompletedAt
        ) {
            member.onboardingCompletedAt = new Date();
        }

        // Clear completion date if unchecking
        if (!member.onboardedWithCall || !member.onboardedWithMessage) {
            member.onboardingCompletedAt = null;
        }

        member.lastUpdated = new Date();
        await member.save();
        await member.populate('onboardingDoneBy', 'name email username userType');

        res.status(200).json({
            success: true,
            message: `Onboarded with message status updated to ${member.onboardedWithMessage}`,
            data: member.toObject(),
        });
    } catch (error) {
        console.error('Toggle message status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle message status',
            error: error.message,
        });
    }
});

// ============================================
// PATCH: Update onboarding details (NEW ROUTE)
// Admin/Subadmin only
// ============================================
router.patch('/gtc-members/:id/onboarding-details', async (req, res) => {
    try {
        const { id } = req.params;
        const { onboardingDoneBy, onboardingNotes } = req.body;

        // Only admin and subadmin can update
        if (!['admin', 'subadmin'].includes(req.user.userType)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or Subadmin privileges required.',
            });
        }

        let member;
        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id);
        } else {
            member = await GTCMember.findOne({ gtcUserId: id });
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'GTC member not found',
            });
        }

        // Update onboardingDoneBy field
        if (onboardingDoneBy !== undefined) {
            if (onboardingDoneBy) {
                // Validate if it's a valid user ID
                const user = await User.findById(onboardingDoneBy);
                if (!user) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid user ID for onboardingDoneBy',
                    });
                }
                member.onboardingDoneBy = onboardingDoneBy;
            } else {
                // Allow clearing by passing null
                member.onboardingDoneBy = null;
            }
        }

        // Update onboarding notes
        if (onboardingNotes !== undefined) {
            member.onboardingNotes = onboardingNotes.trim();
        }

        // Auto-set completion date if both call and message are done
        if (
            member.onboardedWithCall &&
            member.onboardedWithMessage &&
            !member.onboardingCompletedAt
        ) {
            member.onboardingCompletedAt = new Date();
        }

        // Clear completion date if either is unchecked
        if (!member.onboardedWithCall || !member.onboardedWithMessage) {
            member.onboardingCompletedAt = null;
        }

        member.lastUpdated = new Date();
        await member.save();

        // Populate the user details
        await member.populate('onboardingDoneBy', 'name email username userType');

        res.status(200).json({
            success: true,
            message: 'Onboarding details updated successfully',
            data: member.toObject(),
        });
    } catch (error) {
        console.error('Update onboarding details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update onboarding details',
            error: error.message,
        });
    }
});

router.patch('/gtc-members/:id/notes', async (req, res) => {
    try {
        const GTCMember = mongoose.model('GTCMember');
        const { notes } = req.body;

        // Both admin and subadmin can edit notes
        if (!['admin', 'subadmin'].includes(req.user.userType)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin or subadmin only.'
            });
        }

        const { id } = req.params;
        let member;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id);
        } else {
            member = await GTCMember.findOne({ gtcUserId: id });
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        member.notes = notes || '';
        await member.save();

        // Return with populated field
        const updatedMember = await GTCMember.findById(member._id)
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

        res.status(200).json({
            success: true,
            message: 'Notes updated successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Update notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notes',
            error: error.message
        });
    }
});

router.patch('/gtc-members/:id/assign-onboarded-by', async (req, res) => {
    try {
        const GTCMember = mongoose.model('GTCMember');
        const User = mongoose.model('User');
        const { userId } = req.body;

        // Only main admin can assign onboardingDoneBy
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only main admin can assign onboarded by.'
            });
        }

        const { id } = req.params;
        let member;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id);
        } else {
            member = await GTCMember.findOne({ gtcUserId: id });
        }

        if (!member) {
            return res.status(404).json({
                success: false,
                message: 'Member not found'
            });
        }

        // If userId is provided, validate it
        if (userId) {
            const user = await User.findOne({
                _id: userId,
                userType: { $in: ['admin', 'subadmin'] }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found or is not an admin/subadmin'
                });
            }

            member.onboardingDoneBy = userId;
        } else {
            // Allow clearing the assignment
            member.onboardingDoneBy = null;
        }

        await member.save();

        // Return with populated field
        const updatedMember = await GTCMember.findById(member._id)
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

        res.status(200).json({
            success: true,
            message: 'Onboarded by assigned successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Assign onboarded by error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign onboarded by',
            error: error.message
        });
    }
});

// Bulk update onboarding status
router.patch('/gtc-members/bulk/onboarding', async (req, res) => {
    try {
        const { memberIds, onboardedWithCall, onboardedWithMessage } = req.body;

        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'memberIds array is required'
            });
        }

        const updateFields = {};
        if (onboardedWithCall !== undefined) updateFields.onboardedWithCall = onboardedWithCall;
        if (onboardedWithMessage !== undefined) updateFields.onboardedWithMessage = onboardedWithMessage;
        updateFields.lastUpdated = new Date();

        const result = await GTCMember.updateMany(
            { gtcUserId: { $in: memberIds } },
            { $set: updateFields }
        );

        res.status(200).json({
            success: true,
            message: `Updated ${result.modifiedCount} members`,
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('Bulk update error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to bulk update onboarding status',
            error: error.message
        });
    }
});

// ============================================
// GET: Fetch onboarding statistics
// ============================================
router.get('/gtc-members/stats/onboarding', async (req, res) => {
    try {
        const stats = await GTCMember.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    onboardedWithCall: [
                        { $match: { onboardedWithCall: true } },
                        { $count: 'count' },
                    ],
                    onboardedWithMessage: [
                        { $match: { onboardedWithMessage: true } },
                        { $count: 'count' },
                    ],
                    bothOnboarded: [
                        {
                            $match: {
                                onboardedWithCall: true,
                                onboardedWithMessage: true,
                            },
                        },
                        { $count: 'count' },
                    ],
                    notOnboarded: [
                        {
                            $match: {
                                onboardedWithCall: false,
                                onboardedWithMessage: false,
                            },
                        },
                        { $count: 'count' },
                    ],
                    partialOnboarded: [
                        {
                            $match: {
                                $or: [
                                    { onboardedWithCall: true, onboardedWithMessage: false },
                                    { onboardedWithCall: false, onboardedWithMessage: true },
                                ],
                            },
                        },
                        { $count: 'count' },
                    ],
                },
            },
        ]);

        const formattedStats = {
            total: stats[0].total[0]?.count || 0,
            onboardedWithCall: stats[0].onboardedWithCall[0]?.count || 0,
            onboardedWithMessage: stats[0].onboardedWithMessage[0]?.count || 0,
            bothOnboarded: stats[0].bothOnboarded[0]?.count || 0,
            notOnboarded: stats[0].notOnboarded[0]?.count || 0,
            partialOnboarded: stats[0].partialOnboarded[0]?.count || 0,
        };

        res.status(200).json({
            success: true,
            data: formattedStats,
        });
    } catch (error) {
        console.error('Failed to fetch onboarding stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch onboarding statistics',
            error: error.message,
        });
    }
});

// ==================== SUBADMIN ROUTES ====================

// Get all subadmins
router.get('/subadmins', async (req, res) => {
    try {
        const { status, search, page = 1, limit = 20 } = req.query;

        // Only admin can access this
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const filter = { userType: 'subadmin' };
        if (status) filter.status = status;

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [subadmins, total] = await Promise.all([
            User.find(filter)
                .select('-password -gtcfx.accessToken -gtcfx.refreshToken')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: subadmins,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get subadmins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subadmins',
            error: error.message
        });
    }
});


// Get available pages list
router.get('/subadmins/available-pages', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const availablePages = [
            { key: 'dashboard', name: 'Dashboard', description: 'Main analytics dashboard' },
            { key: 'deposits', name: 'Deposits', description: 'Manage user deposits' },
            { key: 'withdrawals', name: 'Withdrawals', description: 'Manage user withdrawals' },
            { key: 'system-incomes', name: 'System Incomes', description: 'View system income/expense' },
            { key: 'products', name: 'Products', description: 'Manage products in marketing shop' },
            { key: 'orders', name: 'Orders', description: 'Manage product orders' },
            { key: 'competition', name: 'Competition', description: 'View and manage competitions' },
            { key: 'gtc-members', name: 'GTC Members', description: 'Manage GTC members' },
            { key: 'users', name: 'Users', description: 'Manage all users' },
            { key: 'courses', name: 'Courses', description: 'Manage courses and videos' },
            { key: 'system-configuration', name: 'System Configuration', description: 'Configure system settings' }
        ];

        res.status(200).json({
            success: true,
            data: availablePages
        });
    } catch (error) {
        console.error('Get available pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available pages',
            error: error.message
        });
    }
});

// Get single subadmin
router.get('/subadmins/:id', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const subadmin = await User.findOne({
            _id: req.params.id,
            userType: 'subadmin'
        }).select('-password -gtcfx.accessToken -gtcfx.refreshToken');

        if (!subadmin) {
            return res.status(404).json({
                success: false,
                message: 'Subadmin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: subadmin
        });
    } catch (error) {
        console.error('Get subadmin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch subadmin',
            error: error.message
        });
    }
});

// Create new subadmin
router.post('/subadmins', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { name, username, email, phone, password, permissions } = req.body;

        // Validation
        if (!name || !username || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, username, email, phone, password'
            });
        }

        // Validate permissions
        const validPages = [
            'dashboard',
            'deposits',
            'withdrawals',
            'system-incomes',
            'products',
            'orders',
            'competition',
            'gtc-members',
            'users',
            'courses',
            'system-configuration'
        ];

        if (permissions?.pages) {
            const invalidPages = permissions.pages.filter(p => !validPages.includes(p));
            if (invalidPages.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid pages: ${invalidPages.join(', ')}`
                });
            }
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: existingUser.email === email
                    ? 'Email already exists'
                    : 'Username already exists'
            });
        }

        // Hash password
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create subadmin
        const subadmin = new User({
            name,
            username,
            email,
            phone,
            password: hashedPassword,
            userType: 'subadmin',
            permissions: {
                pages: permissions?.pages || []
            },
            status: 'active'
        });

        await subadmin.save();

        // Remove sensitive data before sending response
        const subadminData = subadmin.toObject();
        delete subadminData.password;
        delete subadminData.gtcfx;

        res.status(201).json({
            success: true,
            message: 'Subadmin created successfully',
            data: subadminData
        });
    } catch (error) {
        console.error('Create subadmin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create subadmin',
            error: error.message
        });
    }
});

// Update subadmin
router.patch('/subadmins/:id', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { name, email, phone, status, permissions, password } = req.body;

        const subadmin = await User.findOne({
            _id: req.params.id,
            userType: 'subadmin'
        });

        if (!subadmin) {
            return res.status(404).json({
                success: false,
                message: 'Subadmin not found'
            });
        }

        // Update basic fields
        if (name) subadmin.name = name;
        if (email) {
            // Check if email is already taken by another user
            const emailExists = await User.findOne({
                email,
                _id: { $ne: req.params.id }
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
            subadmin.email = email;
        }
        if (phone) subadmin.phone = phone;
        if (status) subadmin.status = status;

        // Update permissions
        if (permissions?.pages) {
            const validPages = [
                'dashboard',
                'deposits',
                'withdrawals',
                'system-incomes',
                'products',
                'orders',
                'competition',
                'gtc-members',
                'users',
                'courses',
                'system-configuration'
            ];

            const invalidPages = permissions.pages.filter(p => !validPages.includes(p));
            if (invalidPages.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid pages: ${invalidPages.join(', ')}`
                });
            }

            subadmin.permissions.pages = permissions.pages;
        }

        // Update password if provided
        if (password) {
            const bcrypt = await import('bcryptjs');
            subadmin.password = await bcrypt.hash(password, 10);
        }

        await subadmin.save();

        // Remove sensitive data
        const subadminData = subadmin.toObject();
        delete subadminData.password;
        delete subadminData.gtcfx;

        res.status(200).json({
            success: true,
            message: 'Subadmin updated successfully',
            data: subadminData
        });
    } catch (error) {
        console.error('Update subadmin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update subadmin',
            error: error.message
        });
    }
});

// Delete subadmin
router.delete('/subadmins/:id', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const subadmin = await User.findOne({
            _id: req.params.id,
            userType: 'subadmin'
        });

        if (!subadmin) {
            return res.status(404).json({
                success: false,
                message: 'Subadmin not found'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            message: 'Subadmin deleted successfully'
        });
    } catch (error) {
        console.error('Delete subadmin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete subadmin',
            error: error.message
        });
    }
});

// Update subadmin permissions only
router.patch('/subadmins/:id/permissions', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { pages } = req.body;

        if (!pages || !Array.isArray(pages)) {
            return res.status(400).json({
                success: false,
                message: 'pages array is required'
            });
        }

        const validPages = [
            'dashboard',
            'deposits',
            'withdrawals',
            'system-incomes',
            'products',
            'orders',
            'competition',
            'gtc-members',
            'users',
            'courses',
            'system-configuration'
        ];

        const invalidPages = pages.filter(p => !validPages.includes(p));
        if (invalidPages.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid pages: ${invalidPages.join(', ')}`,
                validPages
            });
        }

        const subadmin = await User.findOne({
            _id: req.params.id,
            userType: 'subadmin'
        });

        if (!subadmin) {
            return res.status(404).json({
                success: false,
                message: 'Subadmin not found'
            });
        }

        subadmin.permissions.pages = pages;
        await subadmin.save();

        res.status(200).json({
            success: true,
            message: 'Permissions updated successfully',
            data: {
                permissions: subadmin.permissions
            }
        });
    } catch (error) {
        console.error('Update permissions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update permissions',
            error: error.message
        });
    }
});

export default router;
