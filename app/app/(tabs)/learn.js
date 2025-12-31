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

// Duration formatter
const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
};

// Stats Card Component - Matching nupips-team style
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

// Course Card Component
const CourseCard = ({ course, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800/40 border border-gray-700/30 rounded-xl overflow-hidden mb-3 active:bg-gray-800/60"
            activeOpacity={0.95}
        >
            {/* Course Header */}
            <View className="p-5 bg-orange-600/20 border-b border-orange-600/30">
                <View className="flex-row items-center mb-3">
                    <View className="bg-white/20 px-3 py-1.5 border border-white/30 rounded-full">
                        <Text className="text-xs text-white font-semibold uppercase">
                            {course.category}
                        </Text>
                    </View>
                </View>
                <Text className="text-xl font-bold text-white" numberOfLines={2}>
                    {course.name}
                </Text>
            </View>

            {/* Course Info */}
            <View className="p-5">
                <Text className="text-gray-400 text-sm mb-4" numberOfLines={3}>
                    {course.description}
                </Text>

                <View className="mb-4">
                    <View className="flex-row items-center bg-gray-800/50 border border-gray-700/30 px-4 py-2.5 rounded-lg mb-3">
                        <Video size={16} color="#9ca3af" />
                        <Text className="text-white font-medium ml-2">{course.videos?.length || 0} lessons</Text>
                    </View>
                    <View className="flex-row items-center bg-gray-800/50 border border-gray-700/30 px-4 py-2.5 rounded-lg">
                        <Clock size={16} color="#9ca3af" />
                        <Text className="text-white font-medium ml-2">
                            {formatDuration(course.totalDuration)}
                        </Text>
                    </View>
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    className="w-full py-4 bg-orange-600 rounded-xl flex-row items-center justify-center active:bg-orange-700"
                    activeOpacity={0.9}
                >
                    <Text className="text-white font-semibold text-base mr-2">Start Learning</Text>
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

            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-2xl font-bold text-white">Learning Center</Text>
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
                showsVerticalScrollIndicator={false}
            >
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

                    {/* Stats Cards - Matching nupips-team gap-3 style */}
                    <View className="mx-4 mb-6">
                        <Text className="text-lg font-light text-white mb-3">Overview</Text>
                        <View>
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
                                icon={<Clock size={20} color="#ea580c" />}
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
                    <View className="mx-4 mb-4">
                        <View className="mb-3">
                            <View className="flex-1 relative">
                                <Search
                                    size={18}
                                    color="#9ca3af"
                                    style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                                />
                                <TextInput
                                    placeholder="Search courses..."
                                    placeholderTextColor="#6b7280"
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    className="bg-gray-800/40 border border-gray-700/30 rounded-xl pl-10 pr-4 py-3 text-white"
                                />
                            </View>
                        </View>

                        {/* Category Filter */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                            <View className="flex-row">
                                <TouchableOpacity
                                    onPress={() => setCategoryFilter("all")}
                                    className={`px-4 py-2 rounded-xl mr-2 ${categoryFilter === "all"
                                        ? "bg-orange-600"
                                        : "bg-gray-800/40 border border-gray-700/30"
                                        }`}
                                    activeOpacity={0.9}
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
                                        className={`px-4 py-2 rounded-xl mr-2 ${categoryFilter === cat
                                            ? "bg-orange-600"
                                            : "bg-gray-800/40 border border-gray-700/30"
                                            }`}
                                        activeOpacity={0.9}
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
                                className="flex-row items-center bg-red-500/20 border border-red-500/30 rounded-xl py-3 px-4"
                                activeOpacity={0.9}
                            >
                                <X size={18} color="#ef4444" />
                                <Text className="text-red-400 font-semibold ml-2">Clear Filters</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Courses List */}
                    <View className="mx-4">
                        <Text className="text-lg font-light text-white mb-3">
                            Courses ({courses.length})
                        </Text>

                        {courses.length === 0 ? (
                            <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-8 items-center">
                                <PlayCircle size={48} color="#6b7280" />
                                <Text className="text-gray-400 mt-4 font-medium text-center">
                                    {searchTerm || categoryFilter !== "all" ? "No Courses Found" : "No Courses Available"}
                                </Text>
                                <Text className="text-gray-500 text-sm mt-2 text-center">
                                    {searchTerm || categoryFilter !== "all"
                                        ? "Try adjusting your filters"
                                        : "Check back soon for new content"
                                    }
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
