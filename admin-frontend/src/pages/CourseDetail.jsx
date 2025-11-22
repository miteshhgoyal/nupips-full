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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Course Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The course you're looking for doesn't exist
          </p>
          <button
            onClick={() => navigate("/courses")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
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

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/courses")}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back to Courses</span>
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <PlayCircle className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 truncate">
                  {course.name}
                </h1>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200">
                  {course.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border ${
                    course.isPublished
                      ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border-green-200"
                      : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-200"
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
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setShowEditCourseModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 text-blue-700 rounded-xl font-semibold transition-all border border-blue-200 flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Edit3 className="w-4 h-4" />
                Edit Course
              </button>
              <button
                onClick={togglePublish}
                className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-sm hover:shadow-md border ${
                  course.isPublished
                    ? "bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-700 border-gray-200"
                    : "bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 text-green-700 border-green-200"
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
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Video
              </button>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
            <button
              onClick={() => setError("")}
              className="hover:bg-red-200 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium flex-1">
              {success}
            </p>
            <button
              onClick={() => setSuccess("")}
              className="hover:bg-green-200 rounded-lg p-1 transition-colors"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Video className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-900 mb-1">
                  Total Videos
                </p>
                <p className="text-3xl font-bold text-purple-900">
                  {course.videos.length}
                </p>
              </div>
            </div>
            <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-orange-900 mb-1">
                  Total Duration
                </p>
                <p className="text-3xl font-bold text-orange-900">
                  {formatDuration(course.totalDuration || 0)}
                </p>
              </div>
            </div>
            <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                style={{ width: "85%" }}
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <PlayCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Avg Duration
                </p>
                <p className="text-3xl font-bold text-blue-900">
                  {course.videos.length > 0
                    ? formatDuration(
                        (course.totalDuration || 0) / course.videos.length
                      )
                    : "0:00"}
                </p>
              </div>
            </div>
            <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{ width: "70%" }}
              />
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-orange-50 via-orange-50 to-white border-b border-orange-100">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="w-6 h-6 text-orange-600" />
              Course Videos
              <span className="text-orange-600">({course.videos.length})</span>
            </h2>
          </div>

          {course.videos.length === 0 ? (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <Video className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Videos Yet
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start building your course by uploading your first video lesson
              </p>
              <button
                onClick={() => setShowAddVideoModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Your First Video
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {course.videos
                .sort((a, b) => a.order - b.order)
                .map((video, index) => (
                  <div
                    key={video._id}
                    className="p-5 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:shadow-lg transition-shadow">
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
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
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
                          className="w-10 h-10 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center transition-all hover:shadow-md group/btn"
                          title="Edit Video"
                        >
                          <Edit3 className="w-4 h-4 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowDeleteVideoModal(true);
                          }}
                          className="w-10 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-all hover:shadow-md group/btn"
                          title="Delete Video"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 group-hover/btn:scale-110 transition-transform" />
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
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-gray-900 rounded-3xl max-w-6xl w-full shadow-2xl overflow-hidden border border-gray-800">
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
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            <div className="aspect-video bg-black">
              <video
                src={selectedVideo.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                controlsList="nodownload"
              >
                Your browser does not support video playback.
              </video>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 via-orange-50 to-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Add New Video
                  </h2>
                  <p className="text-sm text-gray-600">
                    Upload a video lesson to your course
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddVideoModal(false);
                    resetVideoForm();
                  }}
                  disabled={uploading}
                  className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6 text-gray-600" />
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none disabled:opacity-50 disabled:bg-gray-50 transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Video File <span className="text-red-500">*</span>
                  </label>
                  <label
                    className={`block w-full border-2 border-dashed rounded-2xl transition-all ${
                      uploading
                        ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                        : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/30 cursor-pointer"
                    }`}
                  >
                    <div className="w-full p-8 flex flex-col items-center justify-center">
                      {videoFile ? (
                        <>
                          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-base text-gray-900 font-semibold text-center mb-1 max-w-full px-2 truncate">
                            {videoFile.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                            <Upload className="w-8 h-8 text-gray-400" />
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
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-2xl p-5 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-orange-900 flex items-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Uploading video...
                      </span>
                      <span className="text-lg font-bold text-orange-600">
                        {uploadProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-orange-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-300 shadow-md"
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

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAddVideoModal(false);
                  resetVideoForm();
                }}
                disabled={uploading}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVideo}
                disabled={uploading || !videoFormData.title || !videoFile}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-blue-50 to-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Edit Video
                  </h2>
                  <p className="text-sm text-gray-600">
                    Update video information
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditVideoModal(false);
                    resetVideoForm();
                  }}
                  className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowEditVideoModal(false);
                  resetVideoForm();
                }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditVideo}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-blue-50 to-white flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    Edit Course Details
                  </h2>
                  <p className="text-sm text-gray-600">
                    Update course information
                  </p>
                </div>
                <button
                  onClick={() => setShowEditCourseModal(false)}
                  className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => setShowEditCourseModal(false)}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-white font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCourse}
                disabled={submitting}
                className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Delete Video?
              </h3>
              <p className="text-gray-600 mb-2 leading-relaxed">
                Are you sure you want to delete
              </p>
              <p className="text-gray-900 font-semibold mb-6">
                "{selectedVideo.title}"?
              </p>
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3 mb-6">
                This action cannot be undone and will permanently remove this
                video.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteVideoModal(false);
                    setSelectedVideo(null);
                  }}
                  className="flex-1 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVideo}
                  disabled={submitting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
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
