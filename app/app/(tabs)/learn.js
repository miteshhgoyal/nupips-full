import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
} from "react-native";
import { useRouter } from 'expo-router';
import api from "../../services/api";
import { LinearGradient } from 'expo-linear-gradient';
import {
    PlayCircle,
    Search,
    AlertCircle,
    Clock,
    Video,
    ChevronRight,
    X,
    BookOpen,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

// Duration formatter (used by both StatsCard and CourseCard)
const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
};

// Stats Card Component (team page style)
const StatsCard = ({ title, value, subtitle, icon, colors }) => (
    <View className={`rounded-xl p-6 border ${colors.bg} ${colors.border}`}>
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

// Course Card Component
const CourseCard = ({ course, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800/40 rounded-xl overflow-hidden border border-gray-700/30 mb-4"
            activeOpacity={0.7}
        >
            {/* Course Header */}
            <LinearGradient
                colors={['#ea580c', '#c2410c']}
                className="p-6 border-b border-orange-700/50"
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View className="flex-row items-center gap-2 mb-3">
                    <View className="bg-white/20 px-3 py-1 rounded-full">
                        <Text className="text-xs text-white font-semibold uppercase">
                            {course.category}
                        </Text>
                    </View>
                </View>
                <Text className="text-xl font-bold text-white" numberOfLines={2}>
                    {course.name}
                </Text>
            </LinearGradient>

            {/* Course Info */}
            <View className="p-6">
                <Text className="text-gray-400 text-sm mb-5" numberOfLines={3}>
                    {course.description}
                </Text>

                <View className="flex-row gap-3 mb-5">
                    <View className="flex-row items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl flex-1">
                        <Video size={16} color="#9ca3af" />
                        <Text className="text-white font-medium">{course.videos?.length || 0} lessons</Text>
                    </View>
                    <View className="flex-row items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-xl flex-1">
                        <Clock size={16} color="#9ca3af" />
                        <Text className="text-white font-medium">
                            {formatDuration(course.totalDuration)}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl flex-row items-center justify-center gap-2">
                    <Text className="text-white font-semibold">Start Learning</Text>
                    <ChevronRight size={20} color="#ffffff" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const Learn = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
        loadCourses();
    }, [searchTerm, categoryFilter]);

    const loadCourses = async () => {
        setLoading(true);
        setRefreshing(true);
        setError("");
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (categoryFilter !== "all") params.category = categoryFilter;

            const response = await api.get("/learn/courses", { params });
            setCourses(response.data.courses || []);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load courses");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const categories = Array.from(new Set(courses.map((c) => c.category || 'General')));

    const handleRefresh = () => {
        loadCourses();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("all");
    };

    if (loading && courses.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading courses...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-4">
                <View className="flex-row items-center gap-3 mb-2">
                    <View className="w-12 h-12 bg-orange-500 rounded-xl items-center justify-center">
                        <BookOpen size={24} color="#ffffff" />
                    </View>
                    <Text className="text-2xl font-bold text-white flex-1">Learning Center</Text>
                </View>
                <Text className="text-gray-400 text-sm">Expand your knowledge with expert-led courses</Text>
            </View>

            <ScrollView
                className="flex-1"
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#ea580c"
                    />
                }
            >
                <View className="py-4 pb-24">
                    {/* Error Alert */}
                    {error && (
                        <View className="mx-4 mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")} className="p-1 rounded-lg">
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Stats Cards */}
                    <View className="mx-4 mb-8">
                        <Text className="text-lg font-light text-white mb-4">Overview</Text>
                        <View className="gap-4">
                            <StatsCard
                                title="Available Courses"
                                value={courses.length}
                                subtitle="Total courses"
                                icon={<PlayCircle size={20} color="#3b82f6" />}
                                colors={{
                                    bg: "bg-blue-500/10",
                                    border: "border-blue-500/30",
                                    iconBg: "bg-blue-500/20",
                                    text: "text-white",
                                    subText: "text-gray-400",
                                }}
                            />
                            <StatsCard
                                title="Total Lessons"
                                value={courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0)}
                                subtitle="All courses combined"
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
                                value={formatDuration(courses.reduce((sum, c) => sum + (c.totalDuration || 0), 0))}
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
                        </View>
                    </View>

                    {/* Filters */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-4">Find Your Course</Text>

                        {/* Search */}
                        <View className="relative mb-4">
                            <Search
                                size={20}
                                color="#9ca3af"
                                style={{ position: 'absolute', left: 12, top: 14, zIndex: 1 }}
                            />
                            <TextInput
                                placeholder="Search courses..."
                                placeholderTextColor="#6b7280"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-12 pr-4 py-3 text-white"
                            />
                        </View>

                        {/* Category Filter */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setCategoryFilter("all")}
                                    className={`px-5 py-3 rounded-xl ${categoryFilter === "all"
                                            ? "bg-orange-600"
                                            : "bg-gray-800/40 border border-gray-700/30"
                                        }`}
                                >
                                    <Text className={`font-semibold ${categoryFilter === "all" ? "text-white" : "text-gray-400"
                                        }`}>
                                        All
                                    </Text>
                                </TouchableOpacity>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setCategoryFilter(cat)}
                                        className={`px-5 py-3 rounded-xl ${categoryFilter === cat
                                                ? "bg-orange-600"
                                                : "bg-gray-800/40 border border-gray-700/30"
                                            }`}
                                    >
                                        <Text className={`font-semibold ${categoryFilter === cat ? "text-white" : "text-gray-400"
                                            }`}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        {(searchTerm || categoryFilter !== "all") && (
                            <TouchableOpacity
                                onPress={clearFilters}
                                className="mx-auto px-6 py-3 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-center gap-2"
                            >
                                <X size={16} color="#ef4444" />
                                <Text className="text-red-400 font-semibold">Clear Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Courses List */}
                    <View className="mx-4">
                        <Text className="text-lg font-light text-white mb-4">
                            Courses ({courses.length})
                        </Text>

                        {courses.length === 0 ? (
                            <View className="bg-gray-800/40 rounded-xl p-12 items-center border border-gray-700/30">
                                <View className="w-20 h-20 bg-gray-700 rounded-full items-center justify-center mb-6">
                                    <PlayCircle size={40} color="#6b7280" />
                                </View>
                                <Text className="text-xl font-semibold text-gray-300 mb-2">
                                    {searchTerm || categoryFilter !== "all" ? "No Courses Found" : "No Courses Available"}
                                </Text>
                                <Text className="text-gray-500 text-sm text-center mb-6">
                                    {searchTerm || categoryFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "Check back soon for new content"}
                                </Text>
                            </View>
                        ) : (
                            courses.map((course) => (
                                <CourseCard
                                    key={course._id}
                                    course={course}
                                    onPress={() => router.push(`/(tabs)/course-view?id=${course._id}`)}
                                />
                            ))
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Learn;
