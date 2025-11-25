import mongoose from "mongoose";

const SystemSchema = new mongoose.Schema({
    systemPercentage: {
        type: Number,
        default: 40,
        min: 0,
        max: 100
    },
    traderPercentage: {
        type: Number,
        default: 25,
        min: 0,
        max: 100
    },
    uplineDistribution: [{
        level: { type: Number, required: true, min: 1 },
        percentage: { type: Number, required: true, min: 0, max: 100 }
    }],
    maxUplineLevels: {
        type: Number,
        default: 10,
        min: 1,
        max: 20
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    collection: 'systemconfigs'
});

SystemSchema.statics.getOrCreateConfig = async function () {
    try {
        let config = await this.findOne({});
        if (!config) {
            config = await this.create({
                systemPercentage: 40,
                traderPercentage: 25,
                uplineDistribution: [
                    { level: 1, percentage: 20 },
                    { level: 2, percentage: 10 },
                    { level: 3, percentage: 5 }
                ],
                maxUplineLevels: 10
            });
        }
        return config;
    } catch (error) {
        console.error('Error in getOrCreateConfig:', error);
        throw error;
    }
};

SystemSchema.pre('save', function (next) {
    let total = this.systemPercentage + this.traderPercentage;

    if (this.uplineDistribution && Array.isArray(this.uplineDistribution)) {
        this.uplineDistribution.forEach(item => {
            total += item.percentage;
        });
    }

    if (total > 100) {
        return next(new Error(`Total percentage (${total}%) exceeds 100%`));
    }
    next();
});

export default mongoose.model("SystemConfig", SystemSchema);
