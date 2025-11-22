import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    videoUrl: {
        type: String,
        required: true
    },
    duration: Number, // in seconds
    order: {
        type: Number,
        required: true
    },
    description: String,
    publicId: String // for Cloudinary deletion
}, { timestamps: true });

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: String,
    videos: [videoSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    totalDuration: Number
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);
