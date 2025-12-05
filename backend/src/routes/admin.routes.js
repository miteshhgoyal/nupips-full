import express from 'express';
import User from '../models/User.js';
import Deposit from '../models/Deposit.js';
import Withdrawal from '../models/Withdrawal.js';
import Course from '../models/Course.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import IncomeExpense from '../models/IncomeExpense.js';
import SystemConfig from '../models/SystemConfig.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

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

export default router;
