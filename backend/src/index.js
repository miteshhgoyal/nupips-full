import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import express from 'express';
import cors from 'cors';
import connectDB from "./config/db.js";
import connectCloudinary from './config/cloudinary.js';
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import gtcfxRoutes from "./routes/gtcfx.routes.js";
import gtcfxProxyRoutes from './routes/gtcfx.proxy.routes.js';
import depositRoutes from "./routes/deposit.routes.js";
import withdrawalRoutes from "./routes/withdrawal.routes.js";
import transferRoutes from "./routes/transfer.routes.js";
import teamRoutes from "./routes/team.routes.js";
import productRoutes from "./routes/product.routes.js";
import learnRoutes from "./routes/learn.routes.js";
import systemRoutes from "./routes/system.routes.js";
import incomesRoutes from "./routes/incomes.routes.js";
import adminRoutes from './routes/admin.routes.js';
import competitionRoutes from './routes/competition.routes.js';
import notificationRoutes from './routes/notification.routes.js';

import { startPerformanceFeesCron } from './jobs/syncPerformanceFees.cron.js';

const app = express();
const PORT = process.env.PORT || 8000;

const allowedOrigins = [
    'https://admin.nupips.com',
    'https://nupips.com',
    'https://user.nupips.com',
    'http://localhost:5173',        // dev origin
    'http://localhost:5174',        // dev origin
];

const corsOptions = {
    origin: function (origin, callback) {
        // allow non-browser tools with no origin
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/gtcfx", gtcfxRoutes);
app.use('/api/v3', gtcfxProxyRoutes);
app.use("/deposit", depositRoutes);
app.use("/withdrawal", withdrawalRoutes);
app.use("/transfer", transferRoutes);
app.use("/team", teamRoutes);
app.use("/product", productRoutes);
app.use("/learn", learnRoutes);
app.use("/system", systemRoutes);
app.use("/incomes", incomesRoutes);
app.use("/admin", adminRoutes);
app.use('/competition', competitionRoutes);
app.use('/notifications', notificationRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'Nupips API is running!',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*path', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`API URL: http://localhost:${PORT}`);

            // Start cron jobs after DB connection
            startPerformanceFeesCron();
        });
    })
    .catch(err => {
        console.error("DB connection failed:", err);
        process.exit(1);
    });

connectCloudinary();

export default app;
