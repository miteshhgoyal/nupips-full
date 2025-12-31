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
import { LinearGradient } from 'expo-linear-gradient';
import {
    PlayCircle,
    AlertCircle,
    ArrowLeft,
    Clock,
    Video,
    Play,
    BookOpen,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-xl p-6 border ${colors.bg} ${colors.border} flex-1`}>
        <View className="flex-row items-center gap-3 mb-3">
            <View className={`w-12 h-12 rounded-xl items-center justify-center ${colors.iconBg}`}>
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
                    <View className="w-20 h-20 bg-red-500/20 rounded-2xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-2 text-center">
                        Course Not Found
                    </Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="px-8 py-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl mt-6"
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
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center gap-3 mb-2"
                >
                    <ArrowLeft size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-lg">Back to Courses</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Course Header */}
                    <View className="mb-8">
                        <View className="flex-row items-center gap-3 mb-4">
                            <View className="w-14 h-14 bg-orange-500/20 rounded-xl items-center justify-center">
                                <BookOpen size={24} color="#ea580c" />
                            </View>
                            <View className="bg-blue-500/20 px-4 py-2 rounded-full">
                                <Text className="text-blue-400 text-sm font-semibold uppercase">
                                    {course.category}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-3xl font-bold text-white mb-3">{course.name}</Text>
                        <Text className="text-gray-400 text-lg leading-relaxed">{course.description}</Text>
                    </View>

                    {/* Stats Cards */}
                    <View className="flex-row gap-4 mb-8">
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
                            icon={<Clock size={20} color="#f97316" />}
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
                    <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden mb-8">
                        <LinearGradient
                            colors={['#ea580c20', '#c2410c20']}
                            className="p-6 border-b border-orange-600/30"
                        >
                            <Text className="text-xl font-bold text-white mb-1 flex-row items-center gap-2">
                                <PlayCircle size={24} color="#ea580c" />
                                Course Curriculum
                            </Text>
                            <Text className="text-gray-400">
                                {course.videos?.length || 0} lessons • {formatDuration(course.totalDuration)}
                            </Text>
                        </LinearGradient>

                        {course.videos?.length === 0 ? (
                            <View className="p-16 items-center">
                                <View className="w-24 h-24 bg-gray-700 rounded-2xl items-center justify-center mb-6">
                                    <Video size={48} color="#6b7280" />
                                </View>
                                <Text className="text-xl font-semibold text-gray-300 mb-2">No Lessons Yet</Text>
                                <Text className="text-gray-500 text-center">Check back soon for new content</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={course.videos.sort((a, b) => a.order - b.order)}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item: video }) => (
                                    <TouchableOpacity
                                        onPress={() => startLesson(video)}
                                        className="p-6 border-b border-gray-700/30 last:border-b-0 active:bg-gray-800/50"
                                        activeOpacity={0.7}
                                    >
                                        <View className="flex-row items-start gap-4">
                                            <LinearGradient
                                                colors={['#ea580c', '#c2410c']}
                                                style={{ width: 56, height: 56 }}
                                                className="rounded-xl items-center justify-center"
                                            >
                                                <Text className="text-2xl font-bold text-white">
                                                    {video.order}
                                                </Text>
                                            </LinearGradient>

                                            <View className="flex-1 min-w-0">
                                                <View className="flex-row items-center justify-between mb-2">
                                                    <Text className="text-xl font-bold text-white flex-1" numberOfLines={1}>
                                                        {video.title}
                                                    </Text>
                                                    <View className="flex-row items-center gap-1.5 bg-gray-800/50 px-3 py-1.5 rounded-lg ml-4">
                                                        <Clock size={14} color="#9ca3af" />
                                                        <Text className="text-gray-400 text-sm font-medium">
                                                            {formatDuration(video.duration)}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {video.description && (
                                                    <Text className="text-gray-400 text-sm mb-4" numberOfLines={2}>
                                                        {video.description}
                                                    </Text>
                                                )}

                                                <LinearGradient
                                                    colors={['#ea580c', '#c2410c']}
                                                    className="flex-row items-center gap-2 px-6 py-3 rounded-xl"
                                                >
                                                    <Play size={16} color="#ffffff" />
                                                    <Text className="text-white font-semibold">Start Lesson</Text>
                                                </LinearGradient>
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
                        <LinearGradient
                            colors={['#ea580c20', '#c2410c20']}
                            className="rounded-2xl p-8 items-center border border-orange-600/30"
                        >
                            <Text className="text-2xl font-bold text-white mb-4 text-center">
                                Ready to Start Learning?
                            </Text>
                            <Text className="text-gray-400 mb-6 text-center">
                                Begin your journey with the first lesson
                            </Text>
                            <TouchableOpacity
                                onPress={() => startLesson(course.videos[0])}
                                className="flex-row items-center gap-3 px-10 py-5 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl shadow-lg"
                                activeOpacity={0.9}
                            >
                                <PlayCircle size={24} color="#ffffff" />
                                <Text className="text-white font-bold text-xl">Start First Lesson</Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default CourseView;
