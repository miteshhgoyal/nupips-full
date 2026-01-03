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
import SummaryCard from '@/components/SummaryCard';

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
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading course...</Text>
            </SafeAreaView>
        );
    }

    if (!course) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />
                <View className="flex-1 justify-center items-center px-6">
                    <View className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-2xl items-center justify-center mb-6">
                        <AlertCircle size={40} color="#ef4444" />
                    </View>
                    <Text className="text-2xl font-bold text-white mb-3 text-center">
                        Course Not Found
                    </Text>
                    <Text className="text-neutral-400 text-center mb-8">{error}</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="px-10 py-4 bg-orange-500 rounded-2xl"
                        activeOpacity={0.7}
                    >
                        <Text className="text-white font-bold text-lg">Back to Courses</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-bold text-white">Course Details</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">View course content</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Error Alert */}
                {error && (
                    <View className="mx-5 mt-5 mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <View className="flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-sm font-medium leading-5">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError("")}>
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Course Header */}
                <View className="px-5 mt-6 mb-6">
                    <View className="flex-row items-center mb-4">
                        <View className="w-14 h-14 bg-orange-500/20 border border-orange-500/30 rounded-xl items-center justify-center mr-3">
                            <BookOpen size={24} color="#ea580c" />
                        </View>
                        <View className="bg-orange-500/15 border border-orange-500/30 px-4 py-2 rounded-xl">
                            <Text className="text-orange-400 text-sm font-bold uppercase tracking-wide">
                                {course.category}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-3xl font-bold text-white mb-3">{course.name}</Text>
                    <Text className="text-neutral-400 text-base leading-6">{course.description}</Text>
                </View>

                {/* Stats Cards */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Course Overview</Text>
                    <View className="flex-row gap-3 mb-3">
                        <SummaryCard
                            icon={<Video size={20} color="#a855f7" />}
                            label="Lessons"
                            value={course.videos?.length || 0}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                        <SummaryCard
                            icon={<Clock size={20} color="#ea580c" />}
                            label="Duration"
                            value={formatDuration(course.totalDuration)}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                    </View>
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <View className="flex-row items-center mb-3">
                            <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-3">
                                <PlayCircle size={20} color="#22c55e" />
                            </View>
                            <View>
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">
                                    Progress
                                </Text>
                                <Text className="text-2xl font-bold text-white">0%</Text>
                            </View>
                        </View>
                        <Text className="text-xs text-neutral-500">Course completion status</Text>
                    </View>
                </View>

                {/* Lessons Section */}
                <View className="px-5 mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden">
                        {/* Header */}
                        <View className="p-6 bg-orange-500/10 border-b border-orange-500/20">
                            <View className="flex-row items-center mb-2">
                                <PlayCircle size={24} color="#ea580c" style={{ marginRight: 12 }} />
                                <Text className="text-xl font-bold text-white">Course Curriculum</Text>
                            </View>
                            <Text className="text-neutral-400 text-sm">
                                {course.videos?.length || 0} lessons • {formatDuration(course.totalDuration)}
                            </Text>
                        </View>

                        {course.videos?.length === 0 ? (
                            <View className="p-12 items-center">
                                <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                    <Video size={40} color="#6b7280" />
                                </View>
                                <Text className="text-xl font-bold text-white mb-2 text-center">No Lessons Yet</Text>
                                <Text className="text-neutral-400 text-sm text-center">Check back soon for new content</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={course.videos.sort((a, b) => a.order - b.order)}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item: video }) => (
                                    <TouchableOpacity
                                        onPress={() => startLesson(video)}
                                        className="p-6 border-b border-neutral-800 last:border-b-0 bg-black/20 active:bg-black/40"
                                        activeOpacity={0.9}
                                    >
                                        <View className="flex-row items-start">
                                            <View className="w-12 h-12 bg-orange-500 border-2 border-orange-600 rounded-xl items-center justify-center mr-4">
                                                <Text className="text-xl font-bold text-white">
                                                    {video.order}
                                                </Text>
                                            </View>

                                            <View className="flex-1 min-w-0">
                                                <View className="flex-row items-center mb-2">
                                                    <Text className="text-lg font-bold text-white flex-1 pr-4" numberOfLines={1}>
                                                        {video.title}
                                                    </Text>
                                                    <View className="flex-row items-center bg-neutral-800/80 border border-neutral-700 px-3 py-1.5 rounded-lg">
                                                        <Clock size={14} color="#9ca3af" style={{ marginRight: 6 }} />
                                                        <Text className="text-neutral-400 text-xs font-bold">
                                                            {formatDuration(video.duration)}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {video.description && (
                                                    <Text className="text-neutral-400 text-sm mb-4 leading-5" numberOfLines={2}>
                                                        {video.description}
                                                    </Text>
                                                )}

                                                <TouchableOpacity
                                                    className="flex-row items-center bg-orange-500 px-6 py-3.5 rounded-xl self-start"
                                                    activeOpacity={0.7}
                                                >
                                                    <Play size={16} color="#ffffff" style={{ marginRight: 8 }} />
                                                    <Text className="text-white font-bold text-sm">Start Lesson</Text>
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
                    <View className="px-5 mb-6">
                        <View className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-8 items-center">
                            <Text className="text-2xl font-bold text-white mb-3 text-center">
                                Ready to Start Learning?
                            </Text>
                            <Text className="text-neutral-400 mb-6 text-center text-base leading-6">
                                Begin your journey with the first lesson
                            </Text>
                            <TouchableOpacity
                                onPress={() => startLesson(course.videos[0])}
                                className="flex-row items-center bg-orange-500 px-10 py-5 rounded-2xl"
                                activeOpacity={0.7}
                            >
                                <PlayCircle size={24} color="#ffffff" style={{ marginRight: 12 }} />
                                <Text className="text-white font-bold text-xl">Start First Lesson</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default CourseView;