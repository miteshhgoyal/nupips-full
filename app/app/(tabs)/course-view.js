import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from "react-native";
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from "@/services/api";
import {
    PlayCircle,
    AlertCircle,
    ArrowLeft,
    Clock,
    Video,
    Play,
    BookOpen,
    X,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-2xl p-5 border ${colors.bg} ${colors.border} mb-3`}>
        <View className="flex-row items-center mb-2">
            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${colors.iconBg}`}>
                {icon}
            </View>
            <Text className={`text-sm font-semibold ${colors.text}`}>{title}</Text>
        </View>
        <Text className={`text-2xl font-bold ${colors.text}`}>{value}</Text>
        <Text className={`text-xs ${colors.subText} mt-1`}>{subtitle}</Text>
    </View>
);

const CourseView = () => {
    const router = useRouter();
    const { id } = useLocalSearchParams();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [course, setCourse] = useState(null);

    useEffect(() => {
        if (id) {
            loadCourse();
        }
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
        if (!seconds) return "0m";
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    const startLesson = (video) => {
        router.push({
            pathname: '/(tabs)/lesson-view',
            params: { courseId: id, lessonId: video._id },
        });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading course...</Text>
            </SafeAreaView>
        );
    }

    if (!course) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/20 border border-red-500/40 rounded-xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-xl font-semibold text-white mb-2 text-center">
                        Course Not Found
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={{
                            paddingHorizontal: 40,
                            paddingVertical: 16,
                            backgroundColor: '#ea580c',
                            borderRadius: 14,
                        }}
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-semibold text-lg">Back to Courses</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#ffffff" style={{ marginRight: 12 }} />
                    <View>
                        <Text className="text-2xl font-bold text-white">Course Details</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">View course content</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Error Alert */}
                {error && (
                    <View className="mx-4 mt-5 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-sm font-medium leading-5">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError("")} className="ml-2 p-1">
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Course Header */}
                <View className="px-4 mt-5 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-14 h-14 bg-orange-600/20 border border-orange-600/30 rounded-xl items-center justify-center mr-3">
                            <BookOpen size={24} color="#ea580c" />
                        </View>
                        <View className="bg-blue-500/20 border border-blue-500/30 px-4 py-2 rounded-xl">
                            <Text className="text-blue-400 text-sm font-semibold uppercase">
                                {course.category}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-3xl font-bold text-white mb-3">{course.name}</Text>
                    <Text className="text-gray-400 text-base leading-relaxed">{course.description}</Text>
                </View>

                {/* Stats Cards */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Course Overview</Text>
                    <StatsCard
                        title="Total Lessons"
                        value={course.videos?.length || 0}
                        subtitle="Course content"
                        icon={<Video size={22} color="#a855f7" />}
                        colors={{
                            bg: "bg-purple-500/10",
                            border: "border-purple-500/30",
                            iconBg: "bg-purple-500/20",
                            text: "text-white",
                            subText: "text-gray-400",
                        }}
                    />
                    <StatsCard
                        title="Total Duration"
                        value={formatDuration(course.totalDuration)}
                        subtitle="Learning time"
                        icon={<Clock size={22} color="#ea580c" />}
                        colors={{
                            bg: "bg-orange-500/10",
                            border: "border-orange-500/30",
                            iconBg: "bg-orange-500/20",
                            text: "text-white",
                            subText: "text-gray-400",
                        }}
                    />
                    <StatsCard
                        title="Progress"
                        value="0%"
                        subtitle="Course completion"
                        icon={<PlayCircle size={22} color="#22c55e" />}
                        colors={{
                            bg: "bg-green-500/10",
                            border: "border-green-500/30",
                            iconBg: "bg-green-500/20",
                            text: "text-white",
                            subText: "text-gray-400",
                        }}
                    />
                </View>

                {/* Lessons Section */}
                <View className="px-4 mb-6">
                    <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
                        {/* Header */}
                        <View className="p-6 bg-orange-600/10 border-b border-orange-600/20">
                            <View className="flex-row items-center mb-1">
                                <PlayCircle size={24} color="#ea580c" />
                                <Text className="text-xl font-bold text-white ml-3">Course Curriculum</Text>
                            </View>
                            <Text className="text-gray-400 text-sm">
                                {course.videos?.length || 0} lessons • {formatDuration(course.totalDuration)}
                            </Text>
                        </View>

                        {course.videos?.length === 0 ? (
                            <View className="p-12 items-center">
                                <View className="w-24 h-24 bg-gray-700/50 border border-gray-600 rounded-xl items-center justify-center mb-6">
                                    <Video size={48} color="#6b7280" />
                                </View>
                                <Text className="text-lg font-semibold text-gray-300 mb-2 text-center">No Lessons Yet</Text>
                                <Text className="text-gray-500 text-sm text-center">Check back soon for new content</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={course.videos.sort((a, b) => a.order - b.order)}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item: video }) => (
                                    <TouchableOpacity
                                        onPress={() => startLesson(video)}
                                        className="p-6 border-b border-gray-700/30 last:border-b-0 bg-gray-800/30 active:bg-gray-800/60"
                                        activeOpacity={0.95}
                                    >
                                        <View className="flex-row items-start">
                                            <View className="w-12 h-12 bg-orange-600/50 border border-orange-600 rounded-xl items-center justify-center mr-4">
                                                <Text className="text-xl font-bold text-white">
                                                    {video.order}
                                                </Text>
                                            </View>

                                            <View className="flex-1 min-w-0">
                                                <View className="flex-row items-center mb-2">
                                                    <Text className="text-xl font-bold text-white flex-1 pr-4" numberOfLines={1}>
                                                        {video.title}
                                                    </Text>
                                                    <View className="flex-row items-center bg-gray-800/60 border border-gray-700/30 px-3.5 py-2 rounded-xl">
                                                        <Clock size={14} color="#9ca3af" />
                                                        <Text className="text-gray-400 text-sm font-medium ml-2">
                                                            {formatDuration(video.duration)}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {video.description && (
                                                    <Text className="text-gray-400 text-sm mb-4" numberOfLines={2}>
                                                        {video.description}
                                                    </Text>
                                                )}

                                                <TouchableOpacity
                                                    style={{
                                                        flexDirection: 'row',
                                                        alignItems: 'center',
                                                        backgroundColor: '#ea580c',
                                                        paddingHorizontal: 24,
                                                        paddingVertical: 14,
                                                        borderRadius: 12,
                                                        alignSelf: 'flex-start',
                                                    }}
                                                    activeOpacity={0.7}
                                                >
                                                    <Play size={16} color="#ffffff" />
                                                    <Text className="text-white font-semibold ml-2">Start Lesson</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                                scrollEnabled={false}
                            />
                        )}
                    </View>
                </View>

                {/* CTA Section */}
                {course.videos?.length > 0 && (
                    <View className="px-4 mb-6">
                        <View className="bg-orange-600/10 border border-orange-600/20 rounded-2xl p-8 items-center">
                            <Text className="text-2xl font-bold text-white mb-4 text-center">
                                Ready to Start Learning?
                            </Text>
                            <Text className="text-gray-400 mb-6 text-center text-base">
                                Begin your journey with the first lesson
                            </Text>
                            <TouchableOpacity
                                onPress={() => startLesson(course.videos[0])}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: '#ea580c',
                                    paddingHorizontal: 40,
                                    paddingVertical: 18,
                                    borderRadius: 14,
                                }}
                                activeOpacity={0.7}
                            >
                                <PlayCircle size={24} color="#ffffff" />
                                <Text className="text-white font-bold text-xl ml-3">Start First Lesson</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default CourseView;