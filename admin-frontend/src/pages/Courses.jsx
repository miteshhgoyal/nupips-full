// pages/admin/Courses.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Plus,
  Edit3,
  Trash2,
  Search,
  Loader,
  AlertCircle,
  ArrowLeft,
  X,
  CheckCircle,
  Video,
  Eye,
  EyeOff,
  Clock,
  Filter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Courses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [courses, setCourses] = useState([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, [searchTerm, categoryFilter]);

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/learn/admin/courses", {
        params: {
          search: searchTerm || undefined,
          category: categoryFilter !== "all" ? categoryFilter : undefined,
        },
      });

      setCourses(response.data.courses);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = async () => {
    setError("");
    setSuccess("");

    if (!formData.name || !formData.description || !formData.category) {
      setError("Please fill all required fields");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/learn/admin/courses/add", formData);

      setSuccess("Course added successfully");
      setShowAddModal(false);
      resetForm();
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    setSubmitting(true);
    try {
      await api.delete(`/learn/admin/courses/${selectedCourse._id}`);
      setSuccess("Course deleted successfully");
      setShowDeleteModal(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete course");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublish = async (course) => {
    try {
      await api.put(`/learn/admin/courses/${course._id}/toggle-publish`);
      setSuccess(`Course ${!course.isPublished ? "published" : "unpublished"}`);
      loadCourses();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "",
    });
  };

  const categories = [...new Set(courses.map((c) => c.category))];

  const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Courses Management | Admin</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 md:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                  <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Courses Management
                </h1>
              </div>
              <p className="text-sm md:text-base text-gray-600 ml-0 md:ml-[52px]">
                Create and manage your educational courses
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto px-6 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5" />
              Add Course
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
            <button
              onClick={() => setError("")}
              className="hover:bg-red-100 rounded p-1 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800 font-medium flex-1">
              {success}
            </p>
            <button
              onClick={() => setSuccess("")}
              className="hover:bg-green-100 rounded p-1 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 text-green-600" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 hover:shadow transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                <PlayCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-0.5">
                  Total Courses
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {courses.length}
                </p>
              </div>
            </div>
            <div className="h-1.5 md:h-2 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 hover:shadow transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                <Eye className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-0.5">
                  Published
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {courses.filter((c) => c.isPublished).length}
                </p>
              </div>
            </div>
            <div className="h-1.5 md:h-2 bg-green-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                style={{
                  width: `${
                    courses.length > 0
                      ? (courses.filter((c) => c.isPublished).length /
                          courses.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 hover:shadow transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Video className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-0.5">
                  Total Videos
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {courses.reduce((sum, c) => sum + c.videos.length, 0)}
                </p>
              </div>
            </div>
            <div className="h-1.5 md:h-2 bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                style={{ width: "90%" }}
              />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-5 hover:shadow transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm">
                <Clock className="w-6 h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600 mb-0.5">
                  Total Duration
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900">
                  {formatDuration(
                    courses.reduce((sum, c) => sum + (c.totalDuration || 0), 0)
                  )}
                </p>
              </div>
            </div>
            <div className="h-1.5 md:h-2 bg-orange-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                style={{ width: "75%" }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
            <h3 className="text-base md:text-lg font-bold text-gray-900">
              Filter Courses
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            <div className="relative">
              <Search className="w-4 h-4 md:w-5 md:h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-base"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all bg-white text-sm md:text-base"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Courses Grid */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 bg-orange-50 border-b border-orange-100">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              All Courses
              <span className="text-orange-600">({courses.length})</span>
            </h2>
          </div>

          {courses.length === 0 ? (
            <div className="p-8 md:p-16 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-xl mb-4 md:mb-6">
                <PlayCircle className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2">
                No Courses Yet
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-6 max-w-md mx-auto">
                Start creating your educational platform by adding your first
                course
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow inline-flex items-center gap-2 text-sm md:text-base"
              >
                <Plus className="w-5 h-5" />
                Add Your First Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 hover:shadow transition-all hover:border-orange-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow transition-shadow flex-shrink-0">
                      <PlayCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg text-xs font-semibold border ${
                        course.isPublished
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-700 border-gray-200"
                      }`}
                    >
                      {course.isPublished ? (
                        <>
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Published</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span className="hidden sm:inline">Draft</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-bold text-gray-900 mb-2 text-base md:text-lg group-hover:text-orange-600 transition-colors line-clamp-1">
                    {course.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>

                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {course.category}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      <Video className="w-3 h-3" />
                      {course.videos.length}
                    </span>
                    {course.totalDuration > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200">
                        <Clock className="w-3 h-3" />
                        {formatDuration(course.totalDuration)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => navigate(`/courses/${course._id}`)}
                      className="flex-1 py-2 md:py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs md:text-sm font-semibold transition-all border border-blue-200 hover:shadow-sm"
                    >
                      Manage
                    </button>
                    <button
                      onClick={() => togglePublish(course)}
                      className={`flex-1 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all border hover:shadow-sm ${
                        course.isPublished
                          ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200"
                      }`}
                    >
                      <span className="hidden sm:inline">
                        {course.isPublished ? "Unpublish" : "Publish"}
                      </span>
                      <span className="sm:hidden">
                        {course.isPublished ? (
                          <EyeOff className="w-3.5 h-3.5 mx-auto" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 mx-auto" />
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCourse(course);
                        setShowDeleteModal(true);
                      }}
                      className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center transition-all hover:shadow-sm flex-shrink-0 group/btn"
                      title="Delete Course"
                    >
                      <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-600 group-hover/btn:scale-110 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 md:p-6 border-b border-gray-200 bg-orange-50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    Add New Course
                  </h2>
                  <p className="text-xs md:text-sm text-gray-600">
                    Create a new educational course
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g., Complete Web Development"
                    className="w-full px-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe what students will learn in this course..."
                    rows={4}
                    className="w-full px-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none transition-all text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    placeholder="e.g., Programming, Design, Business"
                    className="w-full px-4 py-2.5 md:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm md:text-base"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-200 flex items-center gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 py-2.5 md:py-3 border-2 border-gray-200 rounded-lg hover:bg-white font-semibold transition-all text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCourse}
                disabled={
                  submitting ||
                  !formData.name ||
                  !formData.description ||
                  !formData.category
                }
                className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm md:text-base"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    Create Course
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCourse && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl md:rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 md:p-8 text-center">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-5">
                <Trash2 className="w-7 h-7 md:w-8 md:h-8 text-red-600" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                Delete Course?
              </h3>
              <p className="text-sm md:text-base text-gray-600 mb-2 leading-relaxed">
                Are you sure you want to delete
              </p>
              <p className="text-sm md:text-base text-gray-900 font-semibold mb-2 px-2">
                "{selectedCourse.name}"?
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-red-800 font-medium mb-1">
                  ⚠️ Warning: This action is permanent
                </p>
                <p className="text-xs text-red-700">
                  All videos and content in this course will be permanently
                  deleted.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedCourse(null);
                  }}
                  className="flex-1 py-2.5 md:py-3 border-2 border-gray-200 rounded-lg hover:bg-gray-50 font-semibold transition-all text-sm md:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={submitting}
                  className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow disabled:opacity-50 flex items-center justify-center gap-2 text-sm md:text-base"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      Delete Course
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

export default Courses;
