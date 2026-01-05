// backend/src/scripts/migrateGTCMembers.js
import mongoose from 'mongoose';
import GTCMember from '../models/GTCMember.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateGTCMembers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/nupips');
        console.log('Connected to MongoDB');

        // Update all existing members to have onboarding fields set to false
        const result = await GTCMember.updateMany(
            {
                $or: [
                    { onboardedWithCall: { $exists: false } },
                    { onboardedWithMessage: { $exists: false } }
                ]
            },
            {
                $set: {
                    onboardedWithCall: false,
                    onboardedWithMessage: false
                }
            }
        );

        console.log(`Migration completed successfully!`);
        console.log(`Modified ${result.modifiedCount} documents`);
        console.log(`Matched ${result.matchedCount} documents`);

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateGTCMembers();
