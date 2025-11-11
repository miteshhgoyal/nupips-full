// routes/withdrawal.routes.js
import express from 'express';
import crypto from 'crypto';
import Withdrawal from '../models/Withdrawal.js';
import User from '../models/User.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Generate unique transaction ID
function generateTransactionId() {
    return 'WD-' + Date.now() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Create Withdrawal Request
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const {
            amount,
            currency,
            withdrawalMethod,
            crypto: cryptoCoin,
            walletAddress,
            network,
            bankDetails
        } = req.body;

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid amount'
            });
        }

        // Check minimum withdrawal
        const minWithdrawal = 20;
        if (amount < minWithdrawal) {
            return res.status(400).json({
                success: false,
                message: `Minimum withdrawal is $${minWithdrawal}`
            });
        }

        // Check balance
        if (amount > (user.walletBalance || 0)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        // Calculate fee
        let feePercent = 0.005; // 0.5% default
        if (withdrawalMethod === 'blockbee-crypto') {
            if (cryptoCoin === 'erc20/usdt') feePercent = 0.01; // 1% for ERC20
        } else if (withdrawalMethod === 'bank_transfer') {
            feePercent = 0.02; // 2% for bank transfer
        }

        const fee = amount * feePercent;
        const netAmount = amount - fee;

        // Validate withdrawal method specific details
        if (withdrawalMethod === 'blockbee-crypto') {
            if (!walletAddress || !walletAddress.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Wallet address is required'
                });
            }
            if (!cryptoCoin) {
                return res.status(400).json({
                    success: false,
                    message: 'Cryptocurrency is required'
                });
            }
        }

        if (withdrawalMethod === 'bank_transfer') {
            if (!bankDetails || !bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolderName) {
                return res.status(400).json({
                    success: false,
                    message: 'Complete bank details are required'
                });
            }
        }

        // Generate transaction ID
        const transactionId = generateTransactionId();

        // Create withdrawal details object
        const withdrawalDetails = {};

        if (withdrawalMethod === 'blockbee-crypto') {
            withdrawalDetails.cryptocurrency = cryptoCoin.split('/')[1]?.toUpperCase() || cryptoCoin.toUpperCase();
            withdrawalDetails.walletAddress = walletAddress;
            withdrawalDetails.network = network || cryptoCoin.toUpperCase();
        }

        if (withdrawalMethod === 'bank_transfer') {
            withdrawalDetails.bankName = bankDetails.bankName;
            withdrawalDetails.accountNumber = bankDetails.accountNumber;
            withdrawalDetails.accountHolderName = bankDetails.accountHolderName;
            withdrawalDetails.ifscCode = bankDetails.ifscCode;
            withdrawalDetails.swiftCode = bankDetails.swiftCode;
        }

        // Create withdrawal record
        const withdrawal = new Withdrawal({
            userId,
            transactionId,
            amount,
            currency: currency || 'USD',
            fee,
            netAmount,
            withdrawalMethod,
            withdrawalDetails,
            status: 'pending'
        });

        // Add BlockBee details if crypto
        if (withdrawalMethod === 'blockbee-crypto') {
            withdrawal.blockBee = {
                coin: cryptoCoin,
                ticker: cryptoCoin,
                blockBeeStatus: 'created',
                createdAt: new Date()
            };
        }

        await withdrawal.save();

        // Deduct from user wallet immediately (reserved)
        user.walletBalance = Math.max(0, (user.walletBalance || 0) - amount);
        await user.save();

        // Update user financials
        await user.updateFinancials();

        res.json({
            success: true,
            message: 'Withdrawal request created successfully',
            data: {
                transactionId,
                amount,
                fee,
                netAmount,
                status: 'pending',
                withdrawalMethod,
                estimatedProcessingTime: '1-24 hours'
            }
        });

    } catch (error) {
        console.error('Create withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating withdrawal'
        });
    }
});

// Get Withdrawal Status
router.get('/status/:transactionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { transactionId } = req.params;

        const withdrawal = await Withdrawal.findOne({
            userId,
            transactionId
        });

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        res.json({
            success: true,
            data: {
                transactionId: withdrawal.transactionId,
                amount: withdrawal.amount,
                fee: withdrawal.fee,
                netAmount: withdrawal.netAmount,
                currency: withdrawal.currency,
                status: withdrawal.status,
                withdrawalMethod: withdrawal.withdrawalMethod,
                blockBeeStatus: withdrawal.blockBee?.blockBeeStatus,
                txHash: withdrawal.blockBee?.txHash || withdrawal.withdrawalDetails?.txHash,
                createdAt: withdrawal.createdAt,
                processedAt: withdrawal.processedAt,
                completedAt: withdrawal.completedAt,
                rejectionReason: withdrawal.rejectionReason
            }
        });

    } catch (error) {
        console.error('Get withdrawal status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving withdrawal status'
        });
    }
});

// Get User Withdrawals
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const withdrawals = await Withdrawal.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('-withdrawalDetails.accountNumber'); // Hide sensitive data

        const total = await Withdrawal.countDocuments({ userId });

        res.json({
            success: true,
            data: {
                withdrawals,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });

    } catch (error) {
        console.error('Get withdrawals error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error retrieving withdrawals'
        });
    }
});

// Cancel Withdrawal (only if pending)
router.post('/cancel/:transactionId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { transactionId } = req.params;

        const withdrawal = await Withdrawal.findOne({
            userId,
            transactionId,
            status: 'pending'
        });

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found or cannot be cancelled'
            });
        }

        // Update status to cancelled
        withdrawal.status = 'cancelled';
        await withdrawal.save();

        // Refund amount to user wallet
        const user = await User.findById(userId);
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + withdrawal.amount;
            await user.save();
            await user.updateFinancials();
        }

        res.json({
            success: true,
            message: 'Withdrawal cancelled successfully',
            data: {
                transactionId: withdrawal.transactionId,
                refundedAmount: withdrawal.amount
            }
        });

    } catch (error) {
        console.error('Cancel withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error cancelling withdrawal'
        });
    }
});

// Admin: Approve Withdrawal (admin only)
router.post('/admin/approve/:transactionId', authenticateToken, async (req, res) => {
    try {
        const adminId = req.user.userId;
        const { transactionId } = req.params;
        const { txHash } = req.body;

        // Check if user is admin
        const admin = await User.findById(adminId);
        if (!admin || admin.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const withdrawal = await Withdrawal.findOne({ transactionId });

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal cannot be approved'
            });
        }

        // Update withdrawal
        withdrawal.status = 'completed';
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();
        withdrawal.completedAt = new Date();

        if (txHash) {
            if (withdrawal.withdrawalMethod === 'blockbee-crypto') {
                withdrawal.blockBee.txHash = txHash;
                withdrawal.blockBee.blockBeeStatus = 'completed';
            } else {
                withdrawal.withdrawalDetails.txHash = txHash;
            }
        }

        await withdrawal.save();

        // Update user financials
        const user = await User.findById(withdrawal.userId);
        if (user) {
            await user.updateFinancials();
        }

        res.json({
            success: true,
            message: 'Withdrawal approved successfully',
            data: {
                transactionId: withdrawal.transactionId,
                status: withdrawal.status
            }
        });

    } catch (error) {
        console.error('Approve withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error approving withdrawal'
        });
    }
});

// Admin: Reject Withdrawal (admin only)
router.post('/admin/reject/:transactionId', authenticateToken, async (req, res) => {
    try {
        const adminId = req.user.userId;
        const { transactionId } = req.params;
        const { reason } = req.body;

        // Check if user is admin
        const admin = await User.findById(adminId);
        if (!admin || admin.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        const withdrawal = await Withdrawal.findOne({ transactionId });

        if (!withdrawal) {
            return res.status(404).json({
                success: false,
                message: 'Withdrawal not found'
            });
        }

        if (withdrawal.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Withdrawal cannot be rejected'
            });
        }

        // Update withdrawal
        withdrawal.status = 'rejected';
        withdrawal.rejectionReason = reason || 'Rejected by admin';
        withdrawal.processedBy = adminId;
        withdrawal.processedAt = new Date();

        await withdrawal.save();

        // Refund amount to user wallet
        const user = await User.findById(withdrawal.userId);
        if (user) {
            user.walletBalance = (user.walletBalance || 0) + withdrawal.amount;
            await user.save();
            await user.updateFinancials();
        }

        res.json({
            success: true,
            message: 'Withdrawal rejected successfully',
            data: {
                transactionId: withdrawal.transactionId,
                refundedAmount: withdrawal.amount
            }
        });

    } catch (error) {
        console.error('Reject withdrawal error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error rejecting withdrawal'
        });
    }
});

export default router;
