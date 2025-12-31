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
                    <View className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-semibold text-white mb-2 text-center">
                        Lesson Not Found
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/course-view', params: { id: courseId } })}
                        className="px-10 py-4 bg-orange-600 rounded-xl active:bg-orange-700"
                        activeOpacity={0.9}
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

            {/* Top Navigation - nupips-team style */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70"
                        activeOpacity={0.9}
                    >
                        <ArrowLeft size={20} color="#ea580c" />
                        <Text className="text-white font-semibold text-base ml-2">Course</Text>
                    </TouchableOpacity>

                    <View className="flex-1 items-center mx-4">
                        <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>
                            {course.name}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-gray-400 text-xs mr-2">
                                Lesson {currentLesson.order} of {sortedLessons.length}
                            </Text>
                            <View className="w-16 h-1.5 bg-gray-700/50 border border-gray-600 rounded-full overflow-hidden mr-2">
                                <View
                                    className="h-full bg-orange-600 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </View>
                            <Text className="text-orange-400 text-xs font-bold">{progressPercentage}%</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowLessonList(true)}
                        className="w-11 h-11 bg-gray-800/50 border border-gray-700/30 rounded-xl items-center justify-center active:bg-gray-800/70"
                        activeOpacity={0.9}
                    >
                        <List size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Video Player */}
                    <View className="bg-black border border-gray-800 rounded-2xl overflow-hidden mb-6" style={{ height: VIDEO_HEIGHT }}>
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
                    <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center flex-wrap mb-4">
                            <View className="bg-orange-600/30 border border-orange-600 px-4 py-2.5 rounded-full mr-3 mb-3">
                                <Text className="text-white text-xs font-bold">Lesson {currentLesson.order}</Text>
                            </View>
                            <View className="flex-row items-center bg-gray-800/50 border border-gray-700/30 px-3.5 py-2 rounded-lg">
                                <Clock size={14} color="#9ca3af" />
                                <Text className="text-gray-400 text-sm font-medium ml-2">
                                    {formatDuration(currentLesson.duration)}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-2xl font-bold text-white mb-4">{currentLesson.title}</Text>
                        {currentLesson.description && (
                            <Text className="text-gray-400 leading-relaxed text-base mb-6">
                                {currentLesson.description}
                            </Text>
                        )}

                        {/* Progress Bar */}
                        <View className="p-4 bg-gray-800/50 border border-gray-700/30 rounded-xl mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-gray-400 text-sm font-medium">Course Progress</Text>
                                <Text className="text-orange-400 text-sm font-bold">
                                    {progressPercentage}% Complete
                                </Text>
                            </View>
                            <View className="w-full h-2.5 bg-gray-700/50 border border-gray-600 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-orange-600 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </View>
                            <Text className="text-gray-500 text-xs mt-2">
                                {currentIndex + 1} of {sortedLessons.length} lessons completed
                            </Text>
                        </View>

                        {/* Navigation Buttons */}
                        <View className="flex-row">
                            {previousLesson ? (
                                <TouchableOpacity
                                    onPress={() => goToLesson(previousLesson)}
                                    className="flex-1 flex-row items-center justify-center bg-gray-800/50 border border-gray-700/30 px-6 py-4 rounded-xl mr-3 active:bg-gray-800/70"
                                    activeOpacity={0.9}
                                >
                                    <ChevronLeft size={20} color="#9ca3af" />
                                    <Text className="text-gray-400 font-semibold ml-2">Previous</Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-1 mr-3" />
                            )}

                            {nextLesson ? (
                                <TouchableOpacity
                                    onPress={() => goToLesson(nextLesson)}
                                    className="flex-1 flex-row items-center justify-center bg-orange-600 px-6 py-4 rounded-xl active:bg-orange-700"
                                    activeOpacity={0.9}
                                >
                                    <Text className="text-white font-bold mr-2">Next Lesson</Text>
                                    <ChevronRight size={20} color="#ffffff" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="flex-1 flex-row items-center justify-center bg-green-600 px-6 py-4 rounded-xl active:bg-green-700"
                                    activeOpacity={0.9}
                                >
                                    <Award size={20} color="#ffffff" />
                                    <Text className="text-white font-bold ml-2">Course Complete!</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Lesson List Modal - nupips-team style */}
            <Modal visible={showLessonList} animationType="slide" transparent>
                <View className="flex-1 bg-black/50 justify-end">
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowLessonList(false)}
                    />
                    <View className="bg-gray-900 border border-gray-800 rounded-t-3xl max-h-[90%]">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-gray-800 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <List size={24} color="#ea580c" />
                                <Text className="text-xl font-bold text-white ml-3">Course Lessons</Text>
                            </View>
                            <TouchableOpacity onPress={() => setShowLessonList(false)} className="w-10 h-10 bg-gray-800 rounded-full items-center justify-center active:bg-gray-800/70" activeOpacity={0.7}>
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                            {sortedLessons.map((lesson) => (
                                <TouchableOpacity
                                    key={lesson._id}
                                    onPress={() => goToLesson(lesson)}
                                    className={`p-5 border-b border-gray-700/30 last:border-b-0 ${lesson._id === lessonId
                                            ? "bg-orange-600/10 border-l-4 border-l-orange-600"
                                            : "bg-gray-800/30 active:bg-gray-800/60"
                                        }`}
                                    activeOpacity={0.95}
                                >
                                    <View className="flex-row items-start">
                                        <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${lesson._id === lessonId
                                                ? "bg-orange-600 border border-orange-600/50"
                                                : "bg-gray-700/50 border border-gray-600"
                                            }`}>
                                            <Text className={`text-xl font-bold ${lesson._id === lessonId ? "text-white" : "text-gray-300"
                                                }`}>
                                                {lesson.order}
                                            </Text>
                                        </View>

                                        <View className="flex-1">
                                            <Text
                                                className={`font-semibold mb-2 ${lesson._id === lessonId ? 'text-orange-400' : 'text-white'
                                                    }`}
                                                numberOfLines={2}
                                            >
                                                {lesson.title}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <Clock size={14} color="#9ca3af" />
                                                <Text className="text-gray-400 text-sm font-medium ml-2">
                                                    {formatDuration(lesson.duration)}
                                                </Text>
                                                {lesson._id === lessonId && (
                                                    <View className="flex-row items-center ml-4">
                                                        <PlayCircle size={12} color="#ea580c" />
                                                        <Text className="text-xs text-orange-400 font-semibold ml-1">Playing</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Footer Stats */}
                        <View className="p-6 bg-gray-800/50 border-t border-gray-700/30">
                            <View className="flex-row">
                                <View className="flex-1 bg-gray-700/50 p-4 border border-gray-600 rounded-xl mr-3">
                                    <Text className="text-gray-400 text-xs mb-1">Completed</Text>
                                    <Text className="text-xl font-bold text-white">
                                        {currentIndex + 1}/{sortedLessons.length}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-gray-700/50 p-4 border border-gray-600 rounded-xl">
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
