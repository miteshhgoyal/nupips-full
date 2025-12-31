import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    Modal,
} from "react-native";
import { Video } from 'expo-av';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from "@/services/api";
import { LinearGradient } from 'expo-linear-gradient';
import {
    PlayCircle,
    AlertCircle,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
    Clock,
    List,
    X,
    Award,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth } = Dimensions.get('window');
const VIDEO_HEIGHT = screenWidth * 0.5625; // 16:9 aspect ratio

const LessonView = () => {
    const router = useRouter();
    const { courseId, lessonId } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [showLessonList, setShowLessonList] = useState(false);
    const [videoStatus, setVideoStatus] = useState({ isLoaded: false });

    useEffect(() => {
        if (courseId) {
            loadCourse();
        }
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
        if (!seconds) return "0m";
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    const sortedLessons = course?.videos.sort((a, b) => a.order - b.order) || [];
    const currentIndex = sortedLessons.findIndex((v) => v._id === lessonId);
    const previousLesson = currentIndex > 0 ? sortedLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < sortedLessons.length - 1 ? sortedLessons[currentIndex + 1] : null;

    const goToLesson = (lesson) => {
        router.push({
            pathname: '/(tabs)/lesson-view',
            params: { courseId, lessonId: lesson._id },
        });
        setShowLessonList(false);
    };

    const progressPercentage = Math.round(((currentIndex + 1) / sortedLessons.length) * 100);

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading lesson...</Text>
            </SafeAreaView>
        );
    }

    if (!course || !currentLesson) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/20 rounded-2xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2 text-center">
                        Lesson Not Found
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/course-view', params: { id: courseId } })}
                        className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl mt-6"
                    >
                        <Text className="text-white font-semibold text-lg">Back to Course</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Top Navigation */}
            <View className="bg-gray-800 border-b border-gray-800 px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center gap-2"
                    >
                        <ArrowLeft size={20} color="#ea580c" />
                        <Text className="text-white font-semibold text-base">Course</Text>
                    </TouchableOpacity>

                    <View className="flex-1 items-center mx-8">
                        <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>
                            {course.name}
                        </Text>
                        <View className="flex-row items-center gap-2">
                            <Text className="text-gray-400 text-xs">
                                Lesson {currentLesson.order} of {sortedLessons.length}
                            </Text>
                            <View className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </View>
                            <Text className="text-orange-400 text-xs font-bold">{progressPercentage}%</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowLessonList(true)}
                        className="p-2 bg-gray-800/50 rounded-xl"
                    >
                        <List size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Video Player */}
                    <View className="bg-black rounded-2xl overflow-hidden mb-6" style={{ height: VIDEO_HEIGHT }}>
                        <Video
                            source={{ uri: currentLesson.videoUrl }}
                            style={{ width: '100%', height: VIDEO_HEIGHT }}
                            useNativeControls
                            resizeMode="contain"
                            shouldPlay
                            isLooping
                            onLoad={() => setVideoStatus({ isLoaded: true })}
                        />
                    </View>

                    {/* Lesson Info */}
                    <View className="bg-gray-800/40 border border-gray-700/30 rounded-2xl p-6 mb-6">
                        <View className="flex-row items-center gap-3 mb-4 flex-wrap">
                            <View className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 rounded-full">
                                <Text className="text-white text-xs font-bold">Lesson {currentLesson.order}</Text>
                            </View>
                            <View className="flex-row items-center gap-1.5 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                                <Clock size={14} color="#9ca3af" />
                                <Text className="text-gray-400 text-sm font-medium">
                                    {formatDuration(currentLesson.duration)}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-2xl font-bold text-white mb-4">{currentLesson.title}</Text>
                        {currentLesson.description && (
                            <Text className="text-gray-400 leading-relaxed text-base">
                                {currentLesson.description}
                            </Text>
                        )}

                        {/* Progress Bar */}
                        <View className="mt-8 p-4 bg-gray-800/50 rounded-xl border border-gray-700/30">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-gray-400 text-sm font-medium">Course Progress</Text>
                                <Text className="text-orange-400 text-sm font-bold">
                                    {progressPercentage}% Complete
                                </Text>
                            </View>
                            <View className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </View>
                            <Text className="text-gray-500 text-xs mt-2">
                                {currentIndex + 1} of {sortedLessons.length} lessons completed
                            </Text>
                        </View>

                        {/* Navigation Buttons */}
                        <View className="flex-row gap-3 mt-8">
                            {previousLesson ? (
                                <TouchableOpacity
                                    onPress={() => goToLesson(previousLesson)}
                                    className="flex-1 flex-row items-center justify-center gap-2 px-6 py-4 border border-gray-700 rounded-xl bg-gray-800/50"
                                >
                                    <ChevronLeft size={20} color="#9ca3af" />
                                    <Text className="text-gray-400 font-semibold">Previous</Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-1" />
                            )}

                            {nextLesson ? (
                                <TouchableOpacity
                                    onPress={() => goToLesson(nextLesson)}
                                    className="flex-1 flex-row items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl shadow-lg"
                                >
                                    <Text className="text-white font-bold">Next Lesson</Text>
                                    <ChevronRight size={20} color="#ffffff" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="flex-1 flex-row items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-xl shadow-lg"
                                >
                                    <Award size={20} color="#ffffff" />
                                    <Text className="text-white font-bold">Course Complete!</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Lesson List Modal */}
            <Modal visible={showLessonList} animationType="slide" transparent>
                <View className="flex-1 bg-black/50">
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowLessonList(false)}
                    />
                    <View className="bg-gray-900 rounded-2xl max-h-[80%] mx-4 mb-6">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center gap-2">
                                <List size={24} color="#ea580c" />
                                <Text className="text-xl font-bold text-white">Course Lessons</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowLessonList(false)}>
                                <X size={24} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="max-h-[60vh]">
                            {sortedLessons.map((lesson) => (
                                <TouchableOpacity
                                    key={lesson._id}
                                    onPress={() => goToLesson(lesson)}
                                    className={`p-6 border-b border-gray-800 last:border-b-0 ${lesson._id === lessonId
                                            ? "bg-orange-500/10 border-l-4 border-l-orange-500"
                                            : "hover:bg-gray-800/30"
                                        }`}
                                >
                                    <View className="flex-row items-start gap-4">
                                        <LinearGradient
                                            colors={
                                                lesson._id === lessonId
                                                    ? ['#ea580c', '#c2410c']
                                                    : ['#4b5563', '#6b7280']
                                            }
                                            style={{ width: 40, height: 40 }}
                                            className="rounded-xl items-center justify-center"
                                        >
                                            <Text className="text-lg font-bold text-white">
                                                {lesson.order}
                                            </Text>
                                        </LinearGradient>

                                        <View className="flex-1">
                                            <Text
                                                className={`font-semibold mb-2 ${lesson._id === lessonId ? 'text-orange-400' : 'text-white'
                                                    }`}
                                                numberOfLines={2}
                                            >
                                                {lesson.title}
                                            </Text>
                                            <View className="flex-row items-center gap-2">
                                                <Clock size={14} color="#9ca3af" />
                                                <Text className="text-gray-400 text-sm font-medium">
                                                    {formatDuration(lesson.duration)}
                                                </Text>
                                                {lesson._id === lessonId && (
                                                    <View className="flex-row items-center gap-1 ml-4">
                                                        <PlayCircle size={12} color="#ea580c" />
                                                        <Text className="text-xs text-orange-400 font-semibold">Playing</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Footer Stats */}
                        <View className="p-6 bg-gray-800/50 border-t border-gray-700">
                            <View className="flex-row gap-4">
                                <View className="flex-1 bg-gray-700/50 p-4 rounded-xl">
                                    <Text className="text-gray-400 text-xs mb-1">Completed</Text>
                                    <Text className="text-xl font-bold text-white">
                                        {currentIndex + 1}/{sortedLessons.length}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-gray-700/50 p-4 rounded-xl">
                                    <Text className="text-gray-400 text-xs mb-1">Progress</Text>
                                    <Text className="text-xl font-bold text-orange-400">
                                        {progressPercentage}%
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

export default LessonView;
