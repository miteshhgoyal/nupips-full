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
            Deposit.aggregate([
                {
                    $facet: {
                        totalDeposits: [{ $count: 'count' }],
                        totalAmount: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
                        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }],
                        pending: [
                            { $match: { status: 'pending' } },
                            { $count: 'count' }
                        ],
                        todayDeposits: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
                        ]
                    }
                }
            ]),
            Withdrawal.aggregate([
                {
                    $facet: {
                        totalWithdrawals: [{ $count: 'count' }],
                        totalAmount: [{ $group: { _id: null, total: { $sum: '$amount' } } }],
                        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$amount' } } }],
                        pending: [
                            { $match: { status: 'pending' } },
                            { $count: 'count' }
                        ],
                        todayWithdrawals: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } }
                        ]
                    }
                }
            ]),
            Order.aggregate([
                {
                    $facet: {
                        totalOrders: [{ $count: 'count' }],
                        totalRevenue: [{ $group: { _id: null, total: { $sum: '$totalAmount' } } }],
                        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
                        todayOrders: [
                            {
                                $match: {
                                    createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                                }
                            },
                            { $count: 'count' }
                        ]
                    }
                }
            ]),
            Product.aggregate([
                {
                    $facet: {
                        totalProducts: [{ $count: 'count' }],
                        activeProducts: [
                            { $match: { status: 'active' } },
                            { $count: 'count' }
                        ],
                        totalStock: [{ $group: { _id: null, total: { $sum: '$stock' } } }],
                        lowStock: [
                            { $match: { stock: { $lt: 10 } } },
                            { $count: 'count' }
                        ]
                    }
                }
            ]),
            Course.aggregate([
                {
                    $facet: {
                        totalCourses: [{ $count: 'count' }],
                        publishedCourses: [
                            { $match: { status: 'published' } },
                            { $count: 'count' }
                        ],
                        totalEnrollments: [{ $group: { _id: null, total: { $sum: '$enrollments' } } }]
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
                        thisMonthIncome: [
                            {
                                $match: {
                                    type: 'income',
                                    date: {
                                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' } } }
                        ],
                        thisMonthExpense: [
                            {
                                $match: {
                                    type: 'expense',
                                    date: {
                                        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                                    }
                                }
                            },
                            { $group: { _id: null, total: { $sum: '$amount' } } }
                        ]
                    }
                }
            ]),
            Promise.all([
                User.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .select('name email username userType createdAt')
                    .lean(),
                Deposit.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('user', 'name username')
                    .select('user amount status createdAt')
                    .lean(),
                Withdrawal.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('user', 'name username')
                    .select('user amount status createdAt')
                    .lean(),
                Order.find()
                    .sort({ createdAt: -1 })
                    .limit(5)
                    .populate('user', 'name username')
                    .select('user orderNumber totalAmount status createdAt')
                    .lean()
            ]),
            SystemConfig.findOne().lean()
        ]);

        const dashboard = {
            users: {
                total: userStats[0].totalUsers[0]?.count || 0,
                byType: userStats[0].usersByType,
                byStatus: userStats[0].usersByStatus,
                totalWalletBalance: userStats[0].totalWalletBalance[0]?.total || 0,
                newToday: userStats[0].newUsersToday[0]?.count || 0,
                newThisMonth: userStats[0].newUsersThisMonth[0]?.count || 0
            },
            deposits: {
                total: depositStats[0].totalDeposits[0]?.count || 0,
                totalAmount: depositStats[0].totalAmount[0]?.total || 0,
                byStatus: depositStats[0].byStatus,
                pending: depositStats[0].pending[0]?.count || 0,
                today: {
                    count: depositStats[0].todayDeposits[0]?.count || 0,
                    amount: depositStats[0].todayDeposits[0]?.amount || 0
                }
            },
            withdrawals: {
                total: withdrawalStats[0].totalWithdrawals[0]?.count || 0,
                totalAmount: withdrawalStats[0].totalAmount[0]?.total || 0,
                byStatus: withdrawalStats[0].byStatus,
                pending: withdrawalStats[0].pending[0]?.count || 0,
                today: {
                    count: withdrawalStats[0].todayWithdrawals[0]?.count || 0,
                    amount: withdrawalStats[0].todayWithdrawals[0]?.amount || 0
                }
            },
            orders: {
                total: orderStats[0].totalOrders[0]?.count || 0,
                totalRevenue: orderStats[0].totalRevenue[0]?.total || 0,
                byStatus: orderStats[0].byStatus,
                today: orderStats[0].todayOrders[0]?.count || 0
            },
            products: {
                total: productStats[0].totalProducts[0]?.count || 0,
                active: productStats[0].activeProducts[0]?.count || 0,
                totalStock: productStats[0].totalStock[0]?.total || 0,
                lowStock: productStats[0].lowStock[0]?.count || 0
            },
            courses: {
                total: courseStats[0].totalCourses[0]?.count || 0,
                published: courseStats[0].publishedCourses[0]?.count || 0,
                totalEnrollments: courseStats[0].totalEnrollments[0]?.total || 0
            },
            finance: {
                totalIncome: incomeExpenseStats[0].totalIncome[0]?.total || 0,
                totalExpense: incomeExpenseStats[0].totalExpense[0]?.total || 0,
                thisMonthIncome: incomeExpenseStats[0].thisMonthIncome[0]?.total || 0,
                thisMonthExpense: incomeExpenseStats[0].thisMonthExpense[0]?.total || 0,
                netProfit: (incomeExpenseStats[0].totalIncome[0]?.total || 0) - (incomeExpenseStats[0].totalExpense[0]?.total || 0)
            },
            recentActivity: {
                users: recentActivity[0],
                deposits: recentActivity[1],
                withdrawals: recentActivity[2],
                orders: recentActivity[3]
            },
            systemConfig: systemConfig || {}
        };

        res.status(200).json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

// ==================== DEPOSITS ROUTES ====================

router.get('/deposits', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = users.map(u => u._id);

            filter.$or = [
                { user: { $in: userIds } },
                { transactionId: { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [deposits, total] = await Promise.all([
            Deposit.find(filter)
                .populate('user', 'name username email phone')
                .populate('processedBy', 'name username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
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
            .populate('user', 'name username email phone walletBalance')
            .populate('processedBy', 'name username email')
            .lean();

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
        const { status, adminNote } = req.body;

        const deposit = await Deposit.findById(req.params.id);

        if (!deposit) {
            return res.status(404).json({
                success: false,
                message: 'Deposit not found'
            });
        }

        if (deposit.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending deposits can be updated'
            });
        }

        if (status === 'approved') {
            const user = await User.findById(deposit.user);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            user.walletBalance += deposit.amount;
            await user.save();

            deposit.status = 'approved';
            deposit.processedBy = req.user._id;
            deposit.processedAt = new Date();
            if (adminNote) deposit.adminNote = adminNote;

            await deposit.save();

            res.status(200).json({
                success: true,
                message: 'Deposit approved successfully',
                data: deposit
            });
        } else if (status === 'rejected') {
            deposit.status = 'rejected';
            deposit.processedBy = req.user._id;
            deposit.processedAt = new Date();
            if (adminNote) deposit.adminNote = adminNote;

            await deposit.save();

            res.status(200).json({
                success: true,
                message: 'Deposit rejected successfully',
                data: deposit
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
    } catch (error) {
        console.error('Update deposit error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update deposit',
            error: error.message
        });
    }
});

// ==================== WITHDRAWALS ROUTES ====================

router.get('/withdrawals', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = users.map(u => u._id);

            filter.$or = [
                { user: { $in: userIds } },
                { transactionId: { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [withdrawals, total] = await Promise.all([
            Withdrawal.find(filter)
                .populate('user', 'name username email phone')
                .populate('processedBy', 'name username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
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
            .populate('user', 'name username email phone walletBalance')
            .populate('processedBy', 'name username email')
            .lean();

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
        const { status, adminNote, transactionId } = req.body;

        const withdrawal = await Withdrawal.findById(req.params.id);

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Only pending withdrawals can be updated'
            });
        }

        if (status === 'approved') {
            withdrawal.status = 'approved';
            withdrawal.processedBy = req.user._id;
            withdrawal.processedAt = new Date();
            if (adminNote) withdrawal.adminNote = adminNote;
            if (transactionId) withdrawal.transactionId = transactionId;

            await withdrawal.save();

            res.status(200).json({
                success: true,
                message: 'Withdrawal approved successfully',
                data: withdrawal
            });
        } else if (status === 'rejected') {
            const user = await User.findById(withdrawal.user);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            user.walletBalance += withdrawal.amount;
            await user.save();

            withdrawal.status = 'rejected';
            withdrawal.processedBy = req.user._id;
            withdrawal.processedAt = new Date();
            if (adminNote) withdrawal.adminNote = adminNote;

            await withdrawal.save();

            res.status(200).json({
                success: true,
                message: 'Withdrawal rejected and amount refunded',
                data: withdrawal
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }
    } catch (error) {
        console.error('Update withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update withdrawal',
            error: error.message
        });
    }
});

// ==================== INCOME/EXPENSE ROUTES ====================

router.get('/system-incomes', async (req, res) => {
    try {
        const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;

        const filter = {};

        if (type) {
            filter.type = type;
        }

        if (category) {
            filter.category = category;
        }

        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.date.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [records, total] = await Promise.all([
            IncomeExpense.find(filter)
                .populate('createdBy', 'name username')
                .sort({ date: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            IncomeExpense.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: records,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get income/expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch income/expense records',
            error: error.message
        });
    }
});

router.post('/system-incomes', async (req, res) => {
    try {
        const { type, category, amount, description, date } = req.body;

        const record = new IncomeExpense({
            type,
            category,
            amount,
            description,
            date: date ? new Date(date) : new Date(),
            createdBy: req.user._id
        });

        await record.save();

        res.status(201).json({
            success: true,
            message: 'Record created successfully',
            data: record
        });
    } catch (error) {
        console.error('Create income/expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create income/expense record',
            error: error.message
        });
    }
});

router.delete('/system-incomes/:id', async (req, res) => {
    try {
        const record = await IncomeExpense.findByIdAndDelete(req.params.id);

        if (!record) {
            return res.status(404).json({
                success: false,
                message: 'Record not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Record deleted successfully'
        });
    } catch (error) {
        console.error('Delete income/expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete income/expense record',
            error: error.message
        });
    }
});

// ==================== PRODUCTS ROUTES ====================

router.get('/products', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, category, search } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (category) {
            filter.category = category;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [products, total] = await Promise.all([
            Product.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products',
            error: error.message
        });
    }
});

router.post('/products', async (req, res) => {
    try {
        const productData = req.body;

        const product = new Product(productData);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            data: product
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create product',
            error: error.message
        });
    }
});

router.patch('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            data: product
        });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update product',
            error: error.message
        });
    }
});

router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete product',
            error: error.message
        });
    }
});

// ==================== ORDERS ROUTES ====================

router.get('/orders', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            const users = await User.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const userIds = users.map(u => u._id);

            filter.$or = [
                { user: { $in: userIds } },
                { orderNumber: { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = end;
            }
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate('user', 'name username email phone')
                .populate('items.product', 'name price images')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

router.patch('/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Order updated successfully',
            data: order
        });
    } catch (error) {
        console.error('Update order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update order',
            error: error.message
        });
    }
});

// ==================== COURSES ROUTES ====================

router.get('/courses', async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [courses, total] = await Promise.all([
            Course.find(filter)
                .populate('instructor', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Course.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses',
            error: error.message
        });
    }
});

router.post('/courses', async (req, res) => {
    try {
        const courseData = req.body;

        const course = new Course(courseData);
        await course.save();

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: course
        });
    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course',
            error: error.message
        });
    }
});

router.patch('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            data: course
        });
    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course',
            error: error.message
        });
    }
});

router.delete('/courses/:id', async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('Delete course error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course',
            error: error.message
        });
    }
});

// ==================== SYSTEM CONFIG ROUTES ====================

router.get('/system-configuration', async (req, res) => {
    try {
        let config = await SystemConfig.findOne().lean();

        if (!config) {
            config = await SystemConfig.create({
                siteName: 'NuPips',
                maintenance: false
            });
        }

        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Get system config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system configuration',
            error: error.message
        });
    }
});

router.patch('/system-configuration', async (req, res) => {
    try {
        let config = await SystemConfig.findOne();

        if (!config) {
            config = new SystemConfig(req.body);
        } else {
            Object.assign(config, req.body);
        }

        await config.save();

        res.status(200).json({
            success: true,
            message: 'System configuration updated successfully',
            data: config
        });
    } catch (error) {
        console.error('Update system config error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update system configuration',
            error: error.message
        });
    }
});

// ==================== USERS ROUTES ====================

router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, userType, status, search } = req.query;

        const filter = {};

        if (userType) {
            filter.userType = userType;
        }

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -gtcfx.accessToken -gtcfx.refreshToken')
                .populate('referralDetails.referredBy', 'name username')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            data: users,
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

// ============================================
// GET: Fetch all users for assignment dropdown (NEW ROUTE)
// Returns only admin and subadmin users
// ============================================
router.get('/users/list', async (req, res) => {
    try {
        const users = await User.find(
            { userType: { $in: ['admin', 'subadmin'] } },
            { _id: 1, name: 1, username: 1, email: 1, userType: 1 }
        ).sort({ name: 1 });

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

// ==================== GTC MEMBERS ROUTES ====================
// CRITICAL: Specific routes MUST come BEFORE parameterized routes
// Order matters: /stats, /tree, /export, /lookup BEFORE /:id

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
// GET: Fetch onboarding statistics (BEFORE :id route)
// ============================================
router.get('/gtc-members/stats/onboarding', async (req, res) => {
    try {
        const stats = await GTCMember.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    onboardedWithCall: [
                        { $match: { onboardedWithCall: true } },
                        { $count: 'count' }
                    ],
                    onboardedWithMessage: [
                        { $match: { onboardedWithMessage: true } },
                        { $count: 'count' }
                    ],
                    bothOnboarded: [
                        {
                            $match: {
                                onboardedWithCall: true,
                                onboardedWithMessage: true
                            }
                        },
                        { $count: 'count' }
                    ],
                    notOnboarded: [
                        {
                            $match: {
                                onboardedWithCall: false,
                                onboardedWithMessage: false
                            }
                        },
                        { $count: 'count' }
                    ],
                    partialOnboarded: [
                        {
                            $match: {
                                $or: [
                                    {
                                        onboardedWithCall: true,
                                        onboardedWithMessage: false
                                    },
                                    {
                                        onboardedWithCall: false,
                                        onboardedWithMessage: true
                                    }
                                ]
                            }
                        },
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const formattedStats = {
            total: stats[0].total[0]?.count || 0,
            onboardedWithCall: stats[0].onboardedWithCall[0]?.count || 0,
            onboardedWithMessage: stats[0].onboardedWithMessage[0]?.count || 0,
            bothOnboarded: stats[0].bothOnboarded[0]?.count || 0,
            notOnboarded: stats[0].notOnboarded[0]?.count || 0,
            partialOnboarded: stats[0].partialOnboarded[0]?.count || 0
        };

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Failed to fetch onboarding stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch onboarding statistics',
            error: error.message
        });
    }
});

// ============================================
// GET: Fetch overview statistics (BEFORE :id route)
// ============================================
router.get('/gtc-members/stats/overview', async (req, res) => {
    try {
        const stats = await GTCMember.aggregate([
            {
                $facet: {
                    totalMembers: [{ $count: 'count' }],
                    activeMembers: [
                        { $match: { status: 'active' } },
                        { $count: 'count' }
                    ],
                    withParent: [
                        { $match: { parentGtcUserId: { $ne: null } } },
                        { $count: 'count' }
                    ],
                    rootMembers: [
                        { $match: { parentGtcUserId: null } },
                        { $count: 'count' }
                    ],
                    avgLevel: [{ $group: { _id: null, avg: { $avg: '$level' } } }],
                    maxLevel: [{ $group: { _id: null, max: { $max: '$level' } } }],
                    totalBalance: [{ $group: { _id: null, total: { $sum: '$balance' } } }]
                }
            }
        ]);

        const formattedStats = {
            total: stats[0].totalMembers[0]?.count || 0,
            active: stats[0].activeMembers[0]?.count || 0,
            withParent: stats[0].withParent[0]?.count || 0,
            rootMembers: stats[0].rootMembers[0]?.count || 0,
            avgLevel: stats[0].avgLevel[0]?.avg || 0,
            maxLevel: stats[0].maxLevel[0]?.max || 0,
            totalBalance: stats[0].totalBalance[0]?.total || 0
        };

        res.status(200).json({
            success: true,
            data: formattedStats
        });
    } catch (error) {
        console.error('Failed to fetch overview stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch overview statistics',
            error: error.message
        });
    }
});

// ============================================
// GET: Export GTC members to Excel (BEFORE :id route)
// ============================================
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

// ============================================
// GET: Lookup member by gtcUserId (BEFORE :id route)
// ============================================
router.get('/gtc-members/lookup/:gtcUserId', async (req, res) => {
    try {
        const member = await GTCMember.findOne({ gtcUserId: req.params.gtcUserId })
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

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

// ============================================
// GET: Fetch member tree/hierarchy (BEFORE :id route)
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
        console.error('Failed to fetch GTC member tree:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch GTC member tree',
            error: error.message,
        });
    }
});

// ============================================
// PATCH: Toggle onboardedWithCall (BEFORE :id route)
// ============================================
router.patch('/gtc-members/:id/toggle-onboarded-call', async (req, res) => {
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
                message: 'GTC member not found'
            });
        }

        member.onboardedWithCall = !member.onboardedWithCall;

        if (member.onboardedWithCall && !member.onboardingDoneBy) {
            member.onboardingDoneBy = req.user._id;
        }

        await member.save();

        const updatedMember = await GTCMember.findById(member._id)
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

        res.status(200).json({
            success: true,
            message: `Onboarded with call ${member.onboardedWithCall ? 'enabled' : 'disabled'}`,
            data: updatedMember
        });
    } catch (error) {
        console.error('Failed to toggle onboarded call:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle onboarded call status',
            error: error.message
        });
    }
});

// ============================================
// PATCH: Toggle onboardedWithMessage (BEFORE :id route)
// ============================================
router.patch('/gtc-members/:id/toggle-onboarded-message', async (req, res) => {
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
                message: 'GTC member not found'
            });
        }

        member.onboardedWithMessage = !member.onboardedWithMessage;

        if (member.onboardedWithMessage && !member.onboardingDoneBy) {
            member.onboardingDoneBy = req.user._id;
        }

        await member.save();

        const updatedMember = await GTCMember.findById(member._id)
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

        res.status(200).json({
            success: true,
            message: `Onboarded with message ${member.onboardedWithMessage ? 'enabled' : 'disabled'}`,
            data: updatedMember
        });
    } catch (error) {
        console.error('Failed to toggle onboarded message:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle onboarded message status',
            error: error.message
        });
    }
});

// ============================================
// PATCH: Assign onboardedBy (Admin Only) - NEW ROUTE
// ============================================
router.patch('/gtc-members/:id/assign-onboarded-by', async (req, res) => {
    try {
        // Only admin can assign onboardedBy
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only admin can assign onboardedBy.'
            });
        }

        const { id } = req.params;
        const { onboardedBy } = req.body;

        if (!onboardedBy) {
            return res.status(400).json({
                success: false,
                message: 'onboardedBy user ID is required'
            });
        }

        // Validate the user exists and is admin/subadmin
        const assignUser = await User.findById(onboardedBy);
        if (!assignUser || !['admin', 'subadmin'].includes(assignUser.userType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user. Must be an admin or subadmin.'
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
                message: 'GTC member not found'
            });
        }

        member.onboardingDoneBy = onboardedBy;
        await member.save();

        const updatedMember = await GTCMember.findById(member._id)
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

        res.status(200).json({
            success: true,
            message: 'OnboardedBy assigned successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Failed to assign onboardedBy:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign onboardedBy',
            error: error.message
        });
    }
});

// ============================================
// PATCH: Update notes (Admin & Subadmin) - NEW ROUTE
// ============================================
router.patch('/gtc-members/:id/notes', async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;

        if (notes === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Notes field is required'
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
                message: 'GTC member not found'
            });
        }

        member.notes = notes;
        // Note: notesUpdatedBy and notesUpdatedAt fields don't exist in schema yet
        // Uncomment these when schema is updated:
        // member.notesUpdatedBy = req.user._id;
        // member.notesUpdatedAt = new Date();

        await member.save();

        const updatedMember = await GTCMember.findById(member._id)
            .populate('onboardingDoneBy', 'name email username userType')
            .lean();

        res.status(200).json({
            success: true,
            message: 'Notes updated successfully',
            data: updatedMember
        });
    } catch (error) {
        console.error('Failed to update notes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update notes',
            error: error.message
        });
    }
});

// ============================================
// GET: Fetch single member by ID (MUST BE LAST)
// This route MUST come AFTER all specific routes
// ============================================
router.get('/gtc-members/:id', async (req, res) => {
    try {
        const { id } = req.params;
        let member;

        if (mongoose.Types.ObjectId.isValid(id) && id.length === 24) {
            member = await GTCMember.findById(id)
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

// ==================== SUBADMIN ROUTES ====================

// Get all subadmins
router.get('/subadmins', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { page = 1, limit = 20, status, search } = req.query;

        const filter = { userType: 'subadmin' };

        if (status) {
            filter.status = status;
        }

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

// Create subadmin
router.post('/subadmins', async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin only.'
            });
        }

        const { name, username, email, phone, password, permissions } = req.body;

        // Validate required fields
        if (!name || !username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, username, email, and password are required'
            });
        }

        // Validate permissions pages
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