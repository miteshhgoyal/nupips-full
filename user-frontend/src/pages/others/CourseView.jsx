// pages/user/CourseView.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Loader,
  AlertCircle,
  ArrowLeft,
  Clock,
  Video,
  BookOpen,
  CheckCircle,
  Lock,
  Play,
  Award,
  TrendingUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const CourseView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [course, setCourse] = useState(null);

  useEffect(() => {
    loadCourse();
  }, [id]);

  const loadCourse = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/learn/courses/${id}`);
      setCourse(response.data.course);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startLesson = (video) => {
    navigate(`/learn/course/${id}/lesson/${video._id}`);
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
            The course you're looking for doesn't exist or is no longer
            available
          </p>
          <button
            onClick={() => navigate("/learn")}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Back to All Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{course.name} - Learn | Platform</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
        {/* Course Hero Section */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 text-white relative overflow-hidden">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
            <button
              onClick={() => navigate("/learn")}
              className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-6 transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to All Courses</span>
            </button>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-white/20 backdrop-blur-sm border border-white/30">
                    {course.category}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  {course.name}
                </h1>
                <p className="text-orange-50 text-lg max-w-3xl leading-relaxed">
                  {course.description}
                </p>
              </div>
            </div>

            {/* Course Stats - Enhanced Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Video className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-100 font-medium mb-1">
                      Total Lessons
                    </p>
                    <p className="text-3xl font-bold">{course.videos.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-100 font-medium mb-1">
                      Total Duration
                    </p>
                    <p className="text-3xl font-bold">
                      {Math.floor((course.totalDuration || 0) / 60)}m
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-6 border border-white/30 hover:bg-white/20 transition-all shadow-lg sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-100 font-medium mb-1">
                      Your Progress
                    </p>
                    <p className="text-3xl font-bold">0%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 font-medium flex-1">{error}</p>
            </div>
          )}

          {/* Course Lessons Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-orange-50 via-orange-50 to-white border-b border-orange-100">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3 mb-1">
                    <Video className="w-7 h-7 text-orange-600" />
                    Course Curriculum
                  </h2>
                  <p className="text-gray-600">
                    {course.videos.length} lessons •{" "}
                    {Math.floor((course.totalDuration || 0) / 60)} minutes of
                    content
                  </p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-orange-200 shadow-sm">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold text-orange-600">0</span> of{" "}
                    {course.videos.length} completed
                  </p>
                </div>
              </div>
            </div>

            {course.videos.length === 0 ? (
              <div className="p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                  <Video className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No Lessons Available Yet
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  The instructor is working on adding content to this course.
                  Check back soon!
                </p>
                <button
                  onClick={() => navigate("/learn")}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
                >
                  Browse Other Courses
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {course.videos
                  .sort((a, b) => a.order - b.order)
                  .map((video, index) => (
                    <div
                      key={video._id}
                      onClick={() => startLesson(video)}
                      className="p-6 hover:bg-gradient-to-r hover:from-orange-50/50 hover:to-transparent transition-all cursor-pointer group"
                    >
                      <div className="flex items-start gap-5">
                        {/* Lesson Number Badge */}
                        <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-md group-hover:shadow-lg">
                          <span className="text-xl font-bold text-white">
                            {video.order}
                          </span>
                        </div>

                        {/* Lesson Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                              {video.title}
                            </h3>
                            <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg flex-shrink-0 border border-gray-200">
                              <Clock className="w-4 h-4" />
                              {formatDuration(video.duration)}
                            </span>
                          </div>

                          {video.description && (
                            <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {video.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 flex-wrap">
                            <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg group-hover:gap-3">
                              <Play className="w-4 h-4" />
                              Start Lesson
                            </button>

                            {/* Progress Indicator */}
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                              <span className="text-xs text-gray-500 font-medium">
                                Not started
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Info Cards Section */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    Learn at Your Own Pace
                  </h3>
                  <p className="text-blue-700 text-sm leading-relaxed">
                    Take your time with each lesson. You can pause, rewind, and
                    replay as many times as you need to master the content.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-purple-900 mb-2">
                    Track Your Progress
                  </h3>
                  <p className="text-purple-700 text-sm leading-relaxed">
                    Your progress is automatically saved. Pick up right where
                    you left off and watch your completion percentage grow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Start Learning CTA */}
          {course.videos.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl p-8 text-center text-white">
              <h3 className="text-2xl font-bold mb-3">
                Ready to Start Learning?
              </h3>
              <p className="text-orange-50 mb-6 max-w-2xl mx-auto">
                Begin your journey with the first lesson and unlock your
                potential. Let's get started!
              </p>
              <button
                onClick={() => startLesson(course.videos[0])}
                className="px-8 py-4 bg-white text-orange-600 hover:bg-orange-50 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-xl inline-flex items-center gap-3"
              >
                <PlayCircle className="w-6 h-6" />
                Start First Lesson
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CourseView;
