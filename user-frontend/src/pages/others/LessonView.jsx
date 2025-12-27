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
  Clock,
  List,
  X,
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (!course || !currentLesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Lesson Not Found
          </h2>
          <button
            onClick={() => navigate(`/learn/course/${courseId}`)}
            className="mt-4 px-6 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
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
          {currentLesson.title} - {course.name}
        </title>
      </Helmet>

      <div className="min-h-screen bg-white">
        {/* Top Nav */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => navigate(`/learn/course/${courseId}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Course</span>
              </button>

              <div className="flex-1 text-center max-w-xl">
                <h1 className="text-white font-bold truncate text-sm mb-1">
                  {course.name}
                </h1>
                <div className="flex items-center justify-center gap-3">
                  <p className="text-gray-600 text-xs">
                    Lesson {currentLesson.order} of {sortedLessons.length}
                  </p>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-orange-600 font-bold">
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowLessonList(!showLessonList)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-xl transition-all"
              >
                <List className="w-5 h-5" />
                <span className="hidden sm:inline">Lessons</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
          {/* Video Area */}
          <div className="flex-1">
            <div className="aspect-video bg-black">
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

            {/* Lesson Info */}
            <div className="border-b border-gray-200 bg-white">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-linear-to-r from-orange-500 to-orange-600 text-white shadow-md">
                    Lesson {currentLesson.order}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                    <Clock className="w-4 h-4" />
                    {formatDuration(currentLesson.duration)}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  {currentLesson.title}
                </h2>
                {currentLesson.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {currentLesson.description}
                  </p>
                )}

                {/* Progress */}
                <div className="bg-white rounded-xl p-4 mb-4 border border-gray-200 mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Course Progress
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      {progressPercentage}% Complete
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-orange-500 to-orange-600 rounded-full transition-all"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {currentIndex + 1} of {sortedLessons.length} lessons
                    completed
                  </p>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-3">
                  {previousLesson ? (
                    <button
                      onClick={() => goToLesson(previousLesson)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 hover:bg-gray-50 rounded-xl font-semibold transition-all"
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      Next Lesson
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate(`/learn/course/${courseId}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                      <Award className="w-5 h-5" />
                      Course Complete!
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div
            className={`lg:w-96 bg-white border-l border-gray-200 ${
              showLessonList ? "block" : "hidden lg:block"
            } ${showLessonList ? "fixed inset-0 z-50 lg:relative" : ""}`}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 bg-white">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <List className="w-5 h-5 text-orange-600" />
                Course Lessons
              </h3>
              <button
                onClick={() => setShowLessonList(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(100vh-140px)]">
              {sortedLessons.map((lesson) => (
                <button
                  key={lesson._id}
                  onClick={() => goToLesson(lesson)}
                  className={`w-full p-4 text-left border-b border-gray-200 transition-all ${
                    lesson._id === lessonId
                      ? "bg-orange-50 border-l-4 border-l-orange-600"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                        lesson._id === lessonId
                          ? "bg-linear-to-br from-orange-500 to-orange-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className="text-sm font-bold">{lesson.order}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4
                        className={`font-semibold mb-1.5 line-clamp-2 ${
                          lesson._id === lessonId
                            ? "text-orange-600"
                            : "text-gray-900"
                        }`}
                      >
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lesson.duration)}
                        </span>
                        {lesson._id === lessonId && (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-semibold">
                            <PlayCircle className="w-3 h-3" />
                            Playing
                          </span>
                        )}
                      </div>
                    </div>

                    {lesson._id === lessonId && (
                      <PlayCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Footer Stats */}
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Completed</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentIndex + 1}/{sortedLessons.length}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <p className="text-xs text-gray-600 mb-1">Progress</p>
                  <p className="text-lg font-bold text-orange-600">
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
