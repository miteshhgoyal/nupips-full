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
  Play,
  BookOpen,
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Course Not Found
          </h2>
          <button
            onClick={() => navigate("/learn")}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
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
        <title>{course.name} - Learn</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate("/learn")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Courses</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {course.category}
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {course.name}
          </h1>
          <p className="text-gray-600">{course.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              {course.videos.length}
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
              {Math.floor((course.totalDuration || 0) / 60)}m
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium mb-1">
              Your Progress
            </p>
            <p className="text-2xl font-bold text-gray-900">0%</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Lessons */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Course Curriculum
            </h2>
            <p className="text-gray-600 mt-2">
              {course.videos.length} lessons •{" "}
              {Math.floor((course.totalDuration || 0) / 60)} minutes
            </p>
          </div>

          {course.videos.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No Lessons Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Check back soon for new content
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {course.videos
                .sort((a, b) => a.order - b.order)
                .map((video) => (
                  <div
                    key={video._id}
                    onClick={() => startLesson(video)}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start gap-5">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 group-hover:from-orange-600 group-hover:to-orange-700 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-md group-hover:shadow-lg">
                        <span className="text-xl font-bold text-white">
                          {video.order}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                            {video.title}
                          </h3>
                          <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg flex-shrink-0">
                            <Clock className="w-4 h-4" />
                            {formatDuration(video.duration)}
                          </span>
                        </div>

                        {video.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {video.description}
                          </p>
                        )}

                        <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg">
                          <Play className="w-4 h-4" />
                          Start Lesson
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* CTA */}
        {course.videos.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 text-center border border-orange-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to Start Learning?
            </h3>
            <p className="text-gray-600 mb-6">
              Begin your journey with the first lesson
            </p>
            <button
              onClick={() => startLesson(course.videos[0])}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg inline-flex items-center gap-3"
            >
              <PlayCircle className="w-6 h-6" />
              Start First Lesson
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CourseView;
