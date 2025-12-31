import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
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

// Stats Card Component - nupips-team style
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-xl p-5 border ${colors.bg} ${colors.border} mb-3`}>
        <View className="flex-row items-center mb-2">
            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${colors.iconBg}`}>
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
                        className="px-10 py-4 bg-orange-600 rounded-xl active:bg-orange-700"
                        activeOpacity={0.9}
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

            {/* Header - nupips-team style */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70"
                    activeOpacity={0.9}
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-base ml-3">Back to Courses</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")} className="p-1" activeOpacity={0.7}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Course Header */}
                    <View className="mx-4 mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-14 h-14 bg-orange-600/30 border border-orange-600/50 rounded-xl items-center justify-center mr-3">
                                <BookOpen size={24} color="#ea580c" />
                            </View>
                            <View className="bg-blue-500/20 border border-blue-500/30 px-4 py-2.5 rounded-xl">
                                <Text className="text-blue-400 text-sm font-semibold uppercase">
                                    {course.category}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-3xl font-bold text-white mb-3">{course.name}</Text>
                        <Text className="text-gray-400 text-base leading-relaxed">{course.description}</Text>
                    </View>

                    {/* Stats Cards - nupips-team style */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Course Overview</Text>
                        <StatsCard
                            title="Total Lessons"
                            value={course.videos?.length || 0}
                            subtitle="Course content"
                            icon={<Video size={20} color="#a855f7" />}
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
                            icon={<Clock size={20} color="#ea580c" />}
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
                            icon={<PlayCircle size={20} color="#22c55e" />}
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
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden mb-6">
                        {/* Header */}
                        <View className="p-6 bg-orange-600/20 border-b border-orange-600/30">
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
                                                    className="flex-row items-center bg-orange-600 px-6 py-3.5 rounded-xl active:bg-orange-700"
                                                    activeOpacity={0.9}
                                                >
                                                    <Play size={16} color="#ffffff" />
                                                    <Text className="text-white font-semibold ml-2">Start Lesson</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>

                    {/* CTA Section */}
                    {course.videos?.length > 0 && (
                        <View className="mx-4 bg-orange-600/20 border border-orange-600/30 rounded-xl p-8 items-center">
                            <Text className="text-2xl font-bold text-white mb-4 text-center">
                                Ready to Start Learning?
                            </Text>
                            <Text className="text-gray-400 mb-6 text-center text-base">
                                Begin your journey with the first lesson
                            </Text>
                            <TouchableOpacity
                                onPress={() => startLesson(course.videos[0])}
                                className="flex-row items-center bg-orange-600 px-10 py-5 rounded-2xl active:bg-orange-700"
                                activeOpacity={0.9}
                            >
                                <PlayCircle size={24} color="#ffffff" />
                                <Text className="text-white font-bold text-xl ml-3">Start First Lesson</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CourseView;
