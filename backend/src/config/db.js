import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from "../models/User.js";
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const MONGO_URI = process.env.NODE_ENV === 'development'
    ? process.env.MONGODB_URI
    : process.env.MONGODB_URI_PROD;

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Seed admin user if not exists
        await seedAdminUser();
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const seedAdminUser = async () => {
    try {
        const adminUserId = process.env.ADMIN_USER_ID || 'superadmin';
        const adminPassword = process.env.ADMIN_PASSWORD;
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@nupips.com';
        const adminMobile = process.env.ADMIN_MOBILE || '0000000000';

        if (!adminPassword) {
            console.warn('ADMIN_PASSWORD not set');
            return;
        }

        const existingAdmin = await User.findOne({ username: adminUserId });
        if (existingAdmin) {
            console.log('Admin user already exists');
            return;
        }

        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // Build all fields from schema
        const admin = new User({
            username: adminUserId,
            name: 'Admin Account',
            email: adminEmail,
            phone: adminMobile,
            password: hashedPassword,
            walletBalance: 0,
            addresses: [
                {
                    firstName: 'Admin',
                    lastName: 'Account',
                    email: adminEmail,
                    street: 'Test Street',
                    city: 'Test City',
                    state: 'Test State',
                    zipcode: '000000',
                    country: 'India',
                    phone: adminMobile,
                    isDefault: true,
                    label: 'Home'
                }
            ],
            referralDetails: {
                referredBy: null,
                referralTree: [],
                totalDirectReferrals: 0,
                totalDownlineUsers: 0
            },
            userType: 'admin',
            financials: {
                totalDeposits: 0,
                totalWithdrawals: 0,
                pendingDeposits: 0,
                pendingWithdrawals: 0,
                totalRebateIncome: 0,
                totalAffiliateIncome: 0,
                netBalance: 0,
                lastDepositAt: null,
                lastWithdrawalAt: null
            },
            tradingStats: {
                totalVolumeLots: 0,
                totalTrades: 0,
                totalProfit: 0,
                totalLoss: 0,
                winRate: 0
            },
            downlineStats: {
                totalAgents: 0,
                totalTraders: 0,
                cumulativeBalance: 0,
                totalDownlineVolume: 0
            },
            gtcfx: {
                accessToken: null,
                refreshToken: null,
                user: null,
                lastSync: null
            },
            status: 'active'
        });

        await admin.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error seeding admin user:', error.message);
    }
};

export default connectDB;