// pages/user/Learn.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Search,
  Loader,
  AlertCircle,
  Clock,
  Video,
  ChevronRight,
  X,
  BookOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Learn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadCourses();
  }, [searchTerm, categoryFilter]);

  const loadCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/learn/courses", {
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
        <title>Learning Center</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Learning Center
            </h1>
          </div>
          <p className="text-gray-600">
            Expand your knowledge with our expert-led courses
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 flex-1">{error}</p>
            <button
              onClick={() => setError("")}
              className="hover:bg-red-100 rounded p-1"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Available Courses
            </p>
            <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Lessons
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {courses.reduce((sum, c) => sum + c.videos.length, 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Total Duration
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatDuration(
                courses.reduce((sum, c) => sum + (c.totalDuration || 0), 0)
              )}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Find Your Course
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all"
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
        {courses.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <PlayCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {searchTerm || categoryFilter !== "all"
                ? "No Courses Found"
                : "No Courses Available"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your filters"
                : "Check back soon for new content"}
            </p>
            {(searchTerm || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("all");
                }}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Showing{" "}
              <span className="font-bold text-gray-900">{courses.length}</span>{" "}
              {courses.length === 1 ? "course" : "courses"}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div
                  key={course._id}
                  onClick={() => navigate(`/learn/course/${course._id}`)}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg cursor-pointer transition-all group"
                >
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 border-b border-orange-200">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-orange-600 mb-3">
                      {course.category}
                    </span>
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {course.name}
                    </h3>
                  </div>

                  <div className="p-6">
                    <p className="text-gray-600 text-sm mb-5 line-clamp-3">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 mb-5 text-sm flex-wrap">
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Video className="w-4 h-4" />
                        <span className="font-medium">
                          {course.videos.length} lessons
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">
                          {formatDuration(course.totalDuration)}
                        </span>
                      </div>
                    </div>

                    <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 group-hover:gap-3">
                      Start Learning
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Learn;
