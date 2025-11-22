// pages/user/LessonView.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  PlayCircle,
  Loader,
  AlertCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  List,
  X,
  Video,
  Award,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";

const LessonView = () => {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [showLessonList, setShowLessonList] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId, lessonId]);

  const loadCourse = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/learn/courses/${courseId}`);
      const courseData = response.data.course;
      setCourse(courseData);

      const lesson = courseData.videos.find((v) => v._id === lessonId);
      if (!lesson) {
        setError("Lesson not found");
        return;
      }
      setCurrentLesson(lesson);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load lesson");
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

  const sortedLessons = course?.videos.sort((a, b) => a.order - b.order) || [];
  const currentIndex = sortedLessons.findIndex((v) => v._id === lessonId);
  const previousLesson =
    currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex < sortedLessons.length - 1
      ? sortedLessons[currentIndex + 1]
      : null;

  const goToLesson = (lesson) => {
    navigate(`/learn/course/${courseId}/lesson/${lesson._id}`);
    setShowLessonList(false);
  };

  const progressPercentage = Math.round(
    ((currentIndex + 1) / sortedLessons.length) * 100
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-white font-medium">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6 border border-red-500/30">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Lesson Not Found
          </h2>
          <p className="text-gray-400 mb-6">
            {error || "The lesson you're looking for doesn't exist"}
          </p>
          <button
            onClick={() => navigate(`/learn/course/${courseId}`)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {currentLesson.title} - {course.name} | Learn
        </title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Top Navigation Bar */}
        <div className="bg-gray-900/95 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigate(`/learn/course/${courseId}`)}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline font-medium">
                  Back to Course
                </span>
              </button>

              <div className="flex-1 px-4 text-center max-w-xl">
                <h1 className="text-white font-bold truncate text-sm sm:text-base mb-1">
                  {course.name}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-gray-400 text-xs">
                    Lesson {currentLesson.order} of {sortedLessons.length}
                  </p>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-orange-500 font-bold">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowLessonList(!showLessonList)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg border border-gray-700"
              >
                <List className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Lessons</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
          {/* Main Video Area */}
          <div className="flex-1">
            {/* Video Player */}
            <div className="aspect-video bg-black relative group">
              <video
                key={currentLesson._id}
                src={currentLesson.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
                controlsList="nodownload"
              >
                Your browser does not support video playback.
              </video>
            </div>

            {/* Lesson Info Section */}
            <div className="bg-gray-900 border-b border-gray-800">
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md">
                        Lesson {currentLesson.order}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                        <Clock className="w-4 h-4" />
                        {formatDuration(currentLesson.duration)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm text-gray-400 bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">
                        <Video className="w-4 h-4" />
                        HD Quality
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      {currentLesson.title}
                    </h2>
                    {currentLesson.description && (
                      <p className="text-gray-300 leading-relaxed">
                        {currentLesson.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="bg-gray-800 rounded-xl p-4 mb-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-300">
                      Course Progress
                    </span>
                    <span className="text-sm font-bold text-orange-500">
                      {progressPercentage}% Complete
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {currentIndex + 1} of {sortedLessons.length} lessons
                    completed
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-3">
                  {previousLesson ? (
                    <button
                      onClick={() => goToLesson(previousLesson)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all border border-gray-700 hover:border-gray-600 shadow-md hover:shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      Previous
                    </button>
                  ) : (
                    <div className="flex-1"></div>
                  )}

                  {nextLesson ? (
                    <button
                      onClick={() => goToLesson(nextLesson)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      Next Lesson
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/learn/course/${courseId}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      <Award className="w-5 h-5" />
                      Course Complete!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Lesson Sidebar (Desktop) / Modal (Mobile) */}
          <div
            className={`lg:w-96 bg-gray-900 border-l border-gray-800 ${
              showLessonList ? "block" : "hidden lg:block"
            } ${
              showLessonList
                ? "fixed inset-0 z-50 lg:relative animate-in fade-in slide-in-from-right duration-300"
                : ""
            }`}
          >
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/95 backdrop-blur-sm sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-orange-500" />
                  Course Lessons
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {sortedLessons.length} total lessons
                </p>
              </div>
              <button
                onClick={() => setShowLessonList(false)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {sortedLessons.map((lesson, index) => (
                <button
                  key={lesson._id}
                  onClick={() => goToLesson(lesson)}
                  className={`w-full p-4 text-left border-b border-gray-800 transition-all group ${
                    lesson._id === lessonId
                      ? "bg-gradient-to-r from-orange-500/20 to-transparent border-l-4 border-l-orange-500"
                      : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        lesson._id === lessonId
                          ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg"
                          : "bg-gray-800 text-gray-400 group-hover:bg-gray-700"
                      }`}
                    >
                      <span className="text-sm font-bold">{lesson.order}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-semibold mb-1.5 line-clamp-2 leading-snug ${
                          lesson._id === lessonId
                            ? "text-orange-400"
                            : "text-white group-hover:text-orange-400"
                        } transition-colors`}
                      >
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lesson.duration)}
                        </span>
                        {lesson._id === lessonId && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-500 font-semibold">
                            <PlayCircle className="w-3 h-3" />
                            Playing
                          </span>
                        )}
                      </div>
                    </div>

                    {lesson._id === lessonId && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                          <PlayCircle className="w-5 h-5 text-orange-500" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Sidebar Footer Stats */}
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Completed</p>
                  <p className="text-lg font-bold text-white">
                    {currentIndex + 1}/{sortedLessons.length}
                  </p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <p className="text-xs text-gray-400 mb-1">Progress</p>
                  <p className="text-lg font-bold text-orange-500">
                    {progressPercentage}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LessonView;
