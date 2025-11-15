import mongoose from 'mongoose';

const transferSchema = new mongoose.Schema(
    {
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        note: {
            type: String,
            maxlength: 200,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
transferSchema.index({ senderId: 1, createdAt: -1 });
transferSchema.index({ receiverId: 1, createdAt: -1 });

const Transfer = mongoose.model('Transfer', transferSchema);

export default Transfer;
