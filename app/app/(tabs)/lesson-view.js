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
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading lesson...</Text>
            </SafeAreaView>
        );
    }

    if (!course || !currentLesson) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-2xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3 text-center">
                        Lesson Not Found
                    </Text>
                    <Text className="text-neutral-400 text-center mb-8">{error}</Text>
                    <TouchableOpacity
                        onPress={() => router.push({ pathname: '/(tabs)/course-view', params: { id: courseId } })}
                        className="px-10 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-lg">Back to Course</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Top Navigation */}
            <View className="bg-neutral-900/50 border-b border-neutral-800 px-5 py-4">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={22} color="#ea580c" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-base">Course</Text>
                    </TouchableOpacity>

                    <View className="flex-1 items-center mx-4">
                        <Text className="text-white font-bold text-sm mb-1" numberOfLines={1}>
                            {course.name}
                        </Text>
                        <View className="flex-row items-center">
                            <Text className="text-neutral-400 text-xs mr-2">
                                Lesson {currentLesson.order} of {sortedLessons.length}
                            </Text>
                            <View className="w-16 h-2 bg-neutral-800 rounded-full overflow-hidden mr-2">
                                <View
                                    className="h-full bg-orange-500 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </View>
                            <Text className="text-orange-400 text-xs font-bold">{progressPercentage}%</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => setShowLessonList(true)}
                        className="w-11 h-11 bg-neutral-900 border border-neutral-800 rounded-xl items-center justify-center"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        activeOpacity={0.7}
                    >
                        <List size={20} color="#9ca3af" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Video Player */}
                <View className="px-5 mt-5 mb-6">
                    <View className="bg-black border-2 border-neutral-800 rounded-2xl overflow-hidden" style={{ height: VIDEO_HEIGHT }}>
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
                </View>

                {/* Lesson Info */}
                <View className="px-5 mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                        <View className="flex-row items-center flex-wrap mb-4 gap-2">
                            <View className="bg-orange-500/15 border border-orange-500/30 px-4 py-2 rounded-xl">
                                <Text className="text-orange-400 text-xs font-bold uppercase tracking-wide">
                                    Lesson {currentLesson.order}
                                </Text>
                            </View>
                            <View className="flex-row items-center bg-black/40 border border-neutral-800 px-3 py-2 rounded-lg">
                                <Clock size={14} color="#9ca3af" style={{ marginRight: 6 }} />
                                <Text className="text-neutral-400 text-sm font-bold">
                                    {formatDuration(currentLesson.duration)}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-2xl font-bold text-white mb-4">{currentLesson.title}</Text>
                        {currentLesson.description && (
                            <Text className="text-neutral-400 leading-6 text-base mb-6">
                                {currentLesson.description}
                            </Text>
                        )}

                        {/* Progress Bar */}
                        <View className="p-5 bg-black/40 border border-neutral-800 rounded-xl mb-6">
                            <View className="flex-row items-center justify-between mb-3">
                                <Text className="text-neutral-400 text-sm font-bold">Course Progress</Text>
                                <Text className="text-orange-400 text-sm font-bold">
                                    {progressPercentage}% Complete
                                </Text>
                            </View>
                            <View className="w-full h-3 bg-neutral-800 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-orange-500 rounded-full"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </View>
                            <Text className="text-neutral-500 text-xs mt-2">
                                {currentIndex + 1} of {sortedLessons.length} lessons completed
                            </Text>
                        </View>

                        {/* Navigation Buttons */}
                        <View className="flex-row gap-3">
                            {previousLesson ? (
                                <TouchableOpacity
                                    onPress={() => goToLesson(previousLesson)}
                                    className="flex-1 flex-row items-center justify-center py-4 bg-neutral-800 border border-neutral-700 rounded-xl"
                                    activeOpacity={0.7}
                                >
                                    <ChevronLeft size={20} color="#9ca3af" style={{ marginRight: 6 }} />
                                    <Text className="text-neutral-300 font-bold">Previous</Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-1" />
                            )}

                            {nextLesson ? (
                                <TouchableOpacity
                                    onPress={() => goToLesson(nextLesson)}
                                    className="flex-1 flex-row items-center justify-center py-4 bg-orange-500 rounded-xl"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold mr-2">Next Lesson</Text>
                                    <ChevronRight size={20} color="#ffffff" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="flex-1 flex-row items-center justify-center py-4 bg-green-500 rounded-xl"
                                    activeOpacity={0.7}
                                >
                                    <Award size={20} color="#ffffff" style={{ marginRight: 8 }} />
                                    <Text className="text-white font-bold">Course Complete!</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Lesson List Modal */}
            <Modal visible={showLessonList} animationType="slide" transparent>
                <View className="flex-1 bg-black/70 justify-end">
                    <TouchableOpacity
                        className="flex-1"
                        activeOpacity={1}
                        onPress={() => setShowLessonList(false)}
                    />
                    <View className="bg-[#0a0a0a] border-t border-neutral-800 rounded-t-3xl max-h-[90%]">
                        {/* Modal Header */}
                        <View className="p-6 border-b border-neutral-800 flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                <List size={24} color="#ea580c" style={{ marginRight: 12 }} />
                                <Text className="text-xl font-bold text-white">Course Lessons</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowLessonList(false)}
                                className="w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <X size={20} color="#9ca3af" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
                            {sortedLessons.map((lesson) => (
                                <TouchableOpacity
                                    key={lesson._id}
                                    onPress={() => goToLesson(lesson)}
                                    className={`p-5 border-b border-neutral-800 last:border-b-0 rounded-xl mb-2 ${lesson._id === lessonId
                                            ? "bg-orange-500/10 border-2 border-orange-500/30"
                                            : "bg-neutral-900/30"
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <View className="flex-row items-start">
                                        <View
                                            className={`w-12 h-12 rounded-xl items-center justify-center mr-4 border-2 ${lesson._id === lessonId
                                                    ? "bg-orange-500 border-orange-600"
                                                    : "bg-neutral-800 border-neutral-700"
                                                }`}
                                        >
                                            <Text
                                                className={`text-xl font-bold ${lesson._id === lessonId ? "text-white" : "text-neutral-300"
                                                    }`}
                                            >
                                                {lesson.order}
                                            </Text>
                                        </View>

                                        <View className="flex-1">
                                            <Text
                                                className={`font-bold text-base mb-2 ${lesson._id === lessonId ? 'text-orange-400' : 'text-white'
                                                    }`}
                                                numberOfLines={2}
                                            >
                                                {lesson.title}
                                            </Text>
                                            <View className="flex-row items-center">
                                                <Clock size={14} color="#9ca3af" style={{ marginRight: 6 }} />
                                                <Text className="text-neutral-400 text-sm font-bold">
                                                    {formatDuration(lesson.duration)}
                                                </Text>
                                                {lesson._id === lessonId && (
                                                    <View className="flex-row items-center ml-4">
                                                        <PlayCircle size={12} color="#ea580c" style={{ marginRight: 4 }} />
                                                        <Text className="text-xs text-orange-400 font-bold">Playing</Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Footer Stats */}
                        <View className="p-6 bg-neutral-900/50 border-t border-neutral-800">
                            <View className="flex-row gap-3">
                                <View className="flex-1 bg-black/40 border border-neutral-800 p-4 rounded-xl">
                                    <Text className="text-neutral-400 text-xs font-bold uppercase tracking-wide mb-2">
                                        Completed
                                    </Text>
                                    <Text className="text-xl font-bold text-white">
                                        {currentIndex + 1}/{sortedLessons.length}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-black/40 border border-neutral-800 p-4 rounded-xl">
                                    <Text className="text-neutral-400 text-xs font-bold uppercase tracking-wide mb-2">
                                        Progress
                                    </Text>
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