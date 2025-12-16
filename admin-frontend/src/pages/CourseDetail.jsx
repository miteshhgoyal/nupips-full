// pages/admin/CourseDetail.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Plus,
  Edit3,
  Trash2,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  CheckCircle,
  Video,
  Upload,
  Clock,
  Eye,
  EyeOff,
  Save,
  Play,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";

const CourseDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [course, setCourse] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [showDeleteVideoModal, setShowDeleteVideoModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [showVideoPlayerModal, setShowVideoPlayerModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // Form state
  const [videoFormData, setVideoFormData] = useState({
    title: "",
    description: "",
    order: "",
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [courseFormData, setCourseFormData] = useState({
    name: "",
    description: "",
    category: "",
    isPublished: false,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/learn/admin/courses`);
      const foundCourse = response.data.courses.find((c) => c._id === id);

      if (!foundCourse) {
        setError("Course not found");
        return;
      }

      setCourse(foundCourse);
      setCourseFormData({
        name: foundCourse.name,
        description: foundCourse.description,
        category: foundCourse.category,
        isPublished: foundCourse.isPublished,
      });
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCourse();
    setRefreshing(false);
  };

  const handleAddVideo = async () => {
    setError("");
    setSuccess("");

    if (!videoFormData.title || !videoFile) {
      setError("Please provide video title and file");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("title", videoFormData.title);
      formData.append("description", videoFormData.description);
      formData.append("order", videoFormData.order || course.videos.length + 1);
      formData.append("video", videoFile);

      await api.post(`/learn/admin/courses/${id}/videos/add`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        },
      });

      setSuccess("Video added successfully");
      setShowAddVideoModal(false);
      resetVideoForm();
      loadCourse();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add video");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEditVideo = async () => {
    setError("");
    setSuccess("");

    setSubmitting(true);
    try {
      await api.put(
        `/learn/admin/courses/${id}/videos/${selectedVideo._id}`,
        videoFormData
      );

      setSuccess("Video updated successfully");
      setShowEditVideoModal(false);
      resetVideoForm();
      loadCourse();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteVideo = async () => {
    setSubmitting(true);
    try {
      await api.delete(
        `/learn/admin/courses/${id}/videos/${selectedVideo._id}`
      );
      setSuccess("Video deleted successfully");
      setShowDeleteVideoModal(false);
      setSelectedVideo(null);
      loadCourse();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete video");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCourse = async () => {
    setError("");
    setSuccess("");

    setSubmitting(true);
    try {
      await api.put(`/learn/admin/courses/${id}`, courseFormData);

      setSuccess("Course updated successfully");
      setShowEditCourseModal(false);
      loadCourse();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update course");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async () => {
    try {
      await api.put(`/learn/admin/courses/${id}/toggle-publish`);
      setSuccess(`Course ${!course.isPublished ? "published" : "unpublished"}`);
      loadCourse();
      setTimeout(() => setSuccess(""), 3000);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status");
    }
  };

  const openEditVideoModal = (video) => {
    setSelectedVideo(video);
    setVideoFormData({
      title: video.title,
      description: video.description || "",
      order: video.order,
    });
    setShowEditVideoModal(true);
  };

  const openVideoPlayer = (video) => {
    setSelectedVideo(video);
    setShowVideoPlayerModal(true);
  };

  const resetVideoForm = () => {
    setVideoFormData({
      title: "",
      description: "",
      order: "",
    });
    setVideoFile(null);
    setSelectedVideo(null);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{course.name} - Course Details | Admin</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/courses")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Courses</span>
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <PlayCircle className="w-8 h-8 text-orange-600" />
                {course.name}
              </h1>
              <p className="text-gray-600 mt-2">{course.description}</p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <button onClick={() => setError("")}>
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-green-700">{success}</p>
            </div>
            <button onClick={() => setSuccess("")}>
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Course Info Card */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {course.category}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                  course.isPublished
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                {course.isPublished ? (
                  <>
                    <Eye className="w-4 h-4" />
                    Published
                  </>
                ) : (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Draft
                  </>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowEditCourseModal(true)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors border border-blue-200 flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit Course
              </button>
              <button
                onClick={togglePublish}
                className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 border ${
                  course.isPublished
                    ? "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                    : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                }`}
              >
                {course.isPublished ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Publish
                  </>
                )}
              </button>
              <button
                onClick={() => setShowAddVideoModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Video
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-purple-900">
                Total Videos
              </p>
            </div>
            <p className="text-2xl font-bold text-purple-900">
              {course.videos.length}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-orange-900">
                Total Duration
              </p>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {formatDuration(course.totalDuration || 0)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <PlayCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-900">Avg Duration</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {course.videos.length > 0
                ? formatDuration(
                    (course.totalDuration || 0) / course.videos.length
                  )
                : "0:00"}
            </p>
          </div>
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-orange-600" />
              Course Videos
              <span className="text-orange-600">({course.videos.length})</span>
            </h2>
          </div>

          {course.videos.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Videos Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start building your course by uploading your first video lesson
              </p>
              <button
                onClick={() => setShowAddVideoModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Video
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {course.videos
                .sort((a, b) => a.order - b.order)
                .map((video) => (
                  <div
                    key={video._id}
                    className="p-5 hover:bg-orange-50/30 transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow transition-shadow">
                        <span className="text-lg font-bold text-white">
                          {video.order}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 mb-1 text-lg group-hover:text-orange-600 transition-colors">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                            {video.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                            <Clock className="w-4 h-4" />
                            {formatDuration(video.duration)}
                          </span>
                          <button
                            onClick={() => openVideoPlayer(video)}
                            className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                          >
                            <Play className="w-4 h-4" />
                            Watch Video
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => openEditVideoModal(video)}
                          className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors"
                          title="Edit Video"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowDeleteVideoModal(true);
                          }}
                          className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Player Modal */}
      {showVideoPlayerModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-2xl max-w-6xl w-full shadow-2xl border border-gray-800 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="text-xl font-bold text-white truncate mb-1">
                  {selectedVideo.title}
                </h3>
                {selectedVideo.description && (
                  <p className="text-sm text-gray-400 line-clamp-1">
                    {selectedVideo.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowVideoPlayerModal(false);
                  setSelectedVideo(null);
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="flex-1 bg-black p-4 flex items-center justify-center min-h-0">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain rounded"
                controlsList="nodownload"
                style={{ maxHeight: "calc(90vh - 100px)" }}
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Plus className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Add New Video
                    </h2>
                    <p className="text-xs text-gray-500">
                      Upload a video lesson to your course
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAddVideoModal(false);
                    resetVideoForm();
                  }}
                  disabled={uploading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={videoFormData.title}
                    onChange={(e) =>
                      setVideoFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g., Introduction to React Hooks"
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={videoFormData.description}
                    onChange={(e) =>
                      setVideoFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Brief description of what this video covers..."
                    rows={4}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Position
                  </label>
                  <input
                    type="number"
                    value={videoFormData.order}
                    onChange={(e) =>
                      setVideoFormData((prev) => ({
                        ...prev,
                        order: e.target.value,
                      }))
                    }
                    placeholder={`Default: ${course.videos.length + 1}`}
                    disabled={uploading}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video File <span className="text-red-500">*</span>
                  </label>
                  <label
                    className={`block w-full border-2 border-dashed rounded-xl transition-all ${
                      uploading
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                        : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/30 cursor-pointer"
                    }`}
                  >
                    <div className="p-8 flex flex-col items-center justify-center">
                      {videoFile ? (
                        <>
                          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-sm">
                            <Video className="w-7 h-7 text-white" />
                          </div>
                          <p className="text-base text-gray-900 font-semibold text-center mb-1 truncate max-w-full px-2">
                            {videoFile.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                            <Upload className="w-7 h-7 text-gray-400" />
                          </div>
                          <p className="text-base text-gray-700 font-medium mb-1">
                            Click to upload video file
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports MP4, MOV, AVI and more
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files[0])}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploading && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading video...
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-orange-800 mt-3 font-medium">
                      Please don't close this window while uploading
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowAddVideoModal(false);
                  resetVideoForm();
                }}
                disabled={uploading}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={uploading || !videoFormData.title || !videoFile}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Uploading {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Video
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Video
                    </h2>
                    <p className="text-xs text-gray-500">
                      Update video information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowEditVideoModal(false);
                    resetVideoForm();
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={videoFormData.title}
                    onChange={(e) =>
                      setVideoFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={videoFormData.description}
                    onChange={(e) =>
                      setVideoFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Order Position
                  </label>
                  <input
                    type="number"
                    value={videoFormData.order}
                    onChange={(e) =>
                      setVideoFormData((prev) => ({
                        ...prev,
                        order: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={() => {
                  setShowEditVideoModal(false);
                  resetVideoForm();
                }}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditVideo}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {showEditCourseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Edit3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Edit Course Details
                    </h2>
                    <p className="text-xs text-gray-500">
                      Update course information
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditCourseModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseFormData.name}
                    onChange={(e) =>
                      setCourseFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={courseFormData.description}
                    onChange={(e) =>
                      setCourseFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={courseFormData.category}
                    onChange={(e) =>
                      setCourseFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3">
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCourse}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Video Modal */}
      {showDeleteVideoModal && selectedVideo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Delete Video?
              </h2>
              <p className="text-sm text-gray-600 text-center mb-2">
                Are you sure you want to delete
              </p>
              <p className="text-sm text-gray-900 font-semibold text-center mb-6">
                "{selectedVideo.title}"?
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  This action cannot be undone and will permanently remove
                  this video.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteVideoModal(false);
                    setSelectedVideo(null);
                  }}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVideo}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete Video
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CourseDetail;
