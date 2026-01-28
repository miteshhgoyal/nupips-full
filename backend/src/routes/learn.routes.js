import express from "express";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import Course from "../models/Course.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

const router = express.Router();

// ============================================
// HELPER - Admin Check
// ============================================
const requireAdmin = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.userId);
		if (
			!user ||
			(user.userType !== "admin" && user.userType !== "subadmin")
		) {
			return res.status(403).json({ message: "Admin access required" });
		}
		next();
	} catch (error) {
		res.status(500).json({ message: "Authorization failed" });
	}
};

// ============================================
// PUBLIC/USER ROUTES
// ============================================

// Get all published courses
router.get("/courses", async (req, res) => {
	try {
		const { category, search } = req.query;
		let query = { isPublished: true };

		if (category) query.category = category;
		if (search) {
			query.$or = [
				{ name: { $regex: search, $options: "i" } },
				{ description: { $regex: search, $options: "i" } },
			];
		}

		const courses = await Course.find(query)
			.select("-videos.publicId")
			.sort({ createdAt: -1 })
			.lean();

		res.json({ success: true, courses });
	} catch (error) {
		console.error("Get courses error:", error);
		res.status(500).json({ message: "Failed to fetch courses" });
	}
});

// Get single course with all videos
router.get("/courses/:id", async (req, res) => {
	try {
		const course = await Course.findById(req.params.id)
			.select("-videos.publicId")
			.lean();

		if (!course || !course.isPublished) {
			return res.status(404).json({ message: "Course not found" });
		}

		res.json({ success: true, course });
	} catch (error) {
		console.error("Get course error:", error);
		res.status(500).json({ message: "Failed to fetch course" });
	}
});

// ============================================
// ADMIN ROUTES
// ============================================

// Get all courses (admin)
router.get(
	"/admin/courses",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const courses = await Course.find({})
				.sort({ createdAt: -1 })
				.lean();

			res.json({ success: true, courses });
		} catch (error) {
			console.error("Get all courses error:", error);
			res.status(500).json({ message: "Failed to fetch courses" });
		}
	},
);

// Add new course
router.post(
	"/admin/courses/add",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { name, description, category } = req.body;

			const course = new Course({
				name,
				description,
				category,
				createdBy: req.user.userId,
				videos: [],
			});

			await course.save();
			res.status(201).json({
				success: true,
				message: "Course created successfully",
				course,
			});
		} catch (error) {
			console.error("Add course error:", error);
			res.status(500).json({ message: "Failed to create course" });
		}
	},
);

// Edit course
router.put(
	"/admin/courses/:id",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { name, description, category, isPublished } = req.body;

			const course = await Course.findByIdAndUpdate(
				req.params.id,
				{
					name,
					description,
					category,
					isPublished:
						isPublished !== undefined ? isPublished : undefined,
				},
				{ new: true, runValidators: true },
			);

			if (!course) {
				return res.status(404).json({ message: "Course not found" });
			}

			res.json({
				success: true,
				message: "Course updated successfully",
				course,
			});
		} catch (error) {
			console.error("Edit course error:", error);
			res.status(500).json({ message: "Failed to update course" });
		}
	},
);

// Delete entire course
router.delete(
	"/admin/courses/:id",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const course = await Course.findById(req.params.id);
			if (!course) {
				return res.status(404).json({ message: "Course not found" });
			}

			// Delete all videos from Cloudinary
			await Promise.all(
				course.videos.map((v) =>
					cloudinary.uploader.destroy(v.publicId, {
						resource_type: "video",
					}),
				),
			);

			await Course.findByIdAndDelete(req.params.id);
			res.json({
				success: true,
				message: "Course deleted successfully",
			});
		} catch (error) {
			console.error("Delete course error:", error);
			res.status(500).json({ message: "Failed to delete course" });
		}
	},
);

// Add video to course
router.post(
	"/admin/courses/:id/videos/add",
	authenticateToken,
	requireAdmin,
	upload.single("video"),
	async (req, res) => {
		try {
			const { title, description, order } = req.body;

			if (!req.file) {
				return res.status(400).json({ message: "Video file required" });
			}

			const result = await cloudinary.uploader.upload(req.file.path, {
				resource_type: "video",
				folder: "courses/videos",
				chunk_size: 6000000,
			});

			const course = await Course.findById(req.params.id);
			if (!course) {
				return res.status(404).json({ message: "Course not found" });
			}

			course.videos.push({
				title,
				description,
				videoUrl: result.secure_url,
				publicId: result.public_id,
				duration: result.duration,
				order: order || course.videos.length + 1,
			});

			course.totalDuration = course.videos.reduce(
				(acc, v) => acc + (v.duration || 0),
				0,
			);

			await course.save();
			res.json({
				success: true,
				message: "Video added successfully",
				course,
			});
		} catch (error) {
			console.error("Add video error:", error);
			res.status(500).json({ message: "Failed to add video" });
		}
	},
);

// Update video details
router.put(
	"/admin/courses/:courseId/videos/:videoId",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const { title, description, order } = req.body;
			const course = await Course.findById(req.params.courseId);

			if (!course) {
				return res.status(404).json({ message: "Course not found" });
			}

			const video = course.videos.id(req.params.videoId);
			if (!video) {
				return res.status(404).json({ message: "Video not found" });
			}

			if (title) video.title = title;
			if (description) video.description = description;
			if (order) video.order = order;

			await course.save();
			res.json({
				success: true,
				message: "Video updated successfully",
				course,
			});
		} catch (error) {
			console.error("Update video error:", error);
			res.status(500).json({ message: "Failed to update video" });
		}
	},
);

// Delete video from course
router.delete(
	"/admin/courses/:courseId/videos/:videoId",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const course = await Course.findById(req.params.courseId);
			if (!course) {
				return res.status(404).json({ message: "Course not found" });
			}

			const video = course.videos.id(req.params.videoId);
			if (!video) {
				return res.status(404).json({ message: "Video not found" });
			}

			// Delete from Cloudinary
			await cloudinary.uploader.destroy(video.publicId, {
				resource_type: "video",
			});

			video.remove();
			course.totalDuration = course.videos.reduce(
				(acc, v) => acc + (v.duration || 0),
				0,
			);

			await course.save();
			res.json({
				success: true,
				message: "Video deleted successfully",
			});
		} catch (error) {
			console.error("Delete video error:", error);
			res.status(500).json({ message: "Failed to delete video" });
		}
	},
);

// Toggle publish status
router.put(
	"/admin/courses/:id/toggle-publish",
	authenticateToken,
	requireAdmin,
	async (req, res) => {
		try {
			const course = await Course.findById(req.params.id);
			if (!course) {
				return res.status(404).json({ message: "Course not found" });
			}

			course.isPublished = !course.isPublished;
			await course.save();

			res.json({
				success: true,
				message: `Course ${course.isPublished ? "published" : "unpublished"}`,
				isPublished: course.isPublished,
				course,
			});
		} catch (error) {
			console.error("Toggle publish error:", error);
			res.status(500).json({
				message: "Failed to toggle publish status",
			});
		}
	},
);

export default router;
