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
  BookOpen,
  Award,
  Filter,
  TrendingUp,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const Learn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courses, setCourses] = useState([]);

  // Filters
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
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${mins}m`;
  };

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50">
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
        <title>Learning Center - Explore Courses</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* Hero Header Section */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white relative overflow-hidden">
          {/* Decorative Background */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                <BookOpen className="w-8 h-8" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                Learning Center
              </h1>
            </div>
            <p className="text-orange-50 text-lg md:text-xl max-w-3xl leading-relaxed">
              Expand your knowledge with our expert-led courses. Learn new
              skills at your own pace and unlock your potential.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Alert */}
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <PlayCircle className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Available Courses
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {courses.length}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Video className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900 mb-1">
                    Total Lessons
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {courses.reduce((sum, c) => sum + c.videos.length, 0)}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                  style={{ width: "85%" }}
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-orange-100 p-6 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-orange-900 mb-1">
                    Total Duration
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {formatDuration(
                      courses.reduce(
                        (sum, c) => sum + (c.totalDuration || 0),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
              <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                  style={{ width: "70%" }}
                />
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Find Your Course
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search courses by name or keyword..."
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
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <PlayCircle className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || categoryFilter !== "all"
                  ? "No Courses Found"
                  : "No Courses Available"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || categoryFilter !== "all"
                  ? "Try adjusting your search or filter criteria to find courses"
                  : "New courses are coming soon. Check back later!"}
              </p>
              {(searchTerm || categoryFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setCategoryFilter("all");
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-gray-600">
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {courses.length}
                  </span>{" "}
                  {courses.length === 1 ? "course" : "courses"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <div
                    key={course._id}
                    onClick={() => navigate(`/learn/course/${course._id}`)}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group"
                  >
                    {/* Course Header with Gradient */}
                    <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 p-6 relative overflow-hidden min-h-[160px] flex flex-col justify-between">
                      {/* Decorative Elements */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-500"></div>

                      <div className="relative z-10">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-white border border-white/30 mb-3">
                          {course.category}
                        </span>
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:line-clamp-none transition-all">
                          {course.name}
                        </h3>
                      </div>
                    </div>

                    {/* Course Body */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">
                        {course.description}
                      </p>

                      <div className="flex items-center gap-4 mb-5 text-sm">
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                          <Video className="w-4 h-4" />
                          <span className="font-medium">
                            {course.videos.length} lessons
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
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

          {/* Bottom CTA Section */}
          {courses.length > 0 && (
            <div className="mt-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-xl p-8 md:p-12 text-center text-white relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/30">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  Start Your Learning Journey Today
                </h3>
                <p className="text-blue-50 text-lg mb-8 max-w-2xl mx-auto">
                  Join thousands of learners who are advancing their skills and
                  achieving their goals through our courses.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                    <p className="text-sm text-blue-100 mb-1">Total Courses</p>
                    <p className="text-2xl font-bold">{courses.length}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                    <p className="text-sm text-blue-100 mb-1">Learning Hours</p>
                    <p className="text-2xl font-bold">
                      {Math.floor(
                        courses.reduce(
                          (sum, c) => sum + (c.totalDuration || 0),
                          0
                        ) / 3600
                      )}
                      +
                    </p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/30">
                    <p className="text-sm text-blue-100 mb-1">Total Lessons</p>
                    <p className="text-2xl font-bold">
                      {courses.reduce((sum, c) => sum + c.videos.length, 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Learn;
