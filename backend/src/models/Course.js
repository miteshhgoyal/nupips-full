// models/Course.js
import mongoose from 'mongoose';

// ==================== SUBDOCUMENTS ====================

/**
 * Video subdocument schema
 */
const videoSchema = new mongoose.Schema({
    // ========== Video Information ==========
    title: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },

    // ========== Video Properties ==========
    duration: {
        type: Number, // in seconds
    },
    order: {
        type: Number,
        required: true
    },
    description: String,

    // ========== Cloud Storage ==========
    publicId: String // for Cloudinary deletion
}, {
    timestamps: true
});

// ==================== MAIN SCHEMA ====================

const courseSchema = new mongoose.Schema({
    // ========== Course Information ==========
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },

    // ========== Categorization ==========
    category: String,

    // ========== Course Content ==========
    videos: [videoSchema],

    // ========== Metadata ==========
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // ========== Course Status ==========
    isPublished: {
        type: Boolean,
        default: false
    },

    // ========== Course Statistics ==========
    totalDuration: Number // Total duration in seconds
}, {
    timestamps: true
});

// ==================== INDEXES ====================
// Indexes for better query performance
courseSchema.index({ name: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ createdBy: 1 });

// Compound index for common queries
courseSchema.index({ isPublished: 1, category: 1 });

// ==================== INSTANCE METHODS ====================

/**
 * Calculate and update total course duration
 */
courseSchema.methods.calculateTotalDuration = function () {
    if (this.videos && this.videos.length > 0) {
        this.totalDuration = this.videos.reduce((total, video) => {
            return total + (video.duration || 0);
        }, 0);
    } else {
        this.totalDuration = 0;
    }
    return this.totalDuration;
};

// ==================== PRE-SAVE HOOKS ====================

/**
 * Pre-save middleware to auto-calculate total duration
 */
courseSchema.pre('save', function (next) {
    this.calculateTotalDuration();
    next();
});

// ==================== EXPORT ====================

export default mongoose.model('Course', courseSchema);