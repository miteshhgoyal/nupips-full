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

// Course Card Component
const CourseCard = ({ course, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden mb-4 active:bg-gray-800/60"
            activeOpacity={0.95}
        >
            {/* Course Header */}
            <View className="p-5 bg-orange-600/10 border-b border-orange-600/20">
                <View className="flex-row items-center mb-3">
                    <View className="bg-orange-500/20 px-3 py-1.5 border border-orange-500/30 rounded-full">
                        <Text className="text-xs text-orange-400 font-semibold uppercase">
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

                <View className="mb-4" style={{ gap: 10 }}>
                    <View className="flex-row items-center bg-gray-900/50 border border-gray-700/30 px-4 py-3 rounded-xl">
                        <Video size={16} color="#9ca3af" />
                        <Text className="text-white font-medium ml-2">{course.videos?.length || 0} lessons</Text>
                    </View>
                    <View className="flex-row items-center bg-gray-900/50 border border-gray-700/30 px-4 py-3 rounded-xl">
                        <Clock size={16} color="#9ca3af" />
                        <Text className="text-white font-medium ml-2">
                            {formatDuration(course.totalDuration)}
                        </Text>
                    </View>
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    style={{
                        width: '100%',
                        paddingVertical: 16,
                        backgroundColor: '#ea580c',
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    activeOpacity={0.7}
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

            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <Text className="text-2xl font-bold text-white">Learning Center</Text>
                <Text className="text-sm text-gray-400 mt-0.5">Explore our courses</Text>
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

                {/* Stats Cards */}
                <View className="px-4 mt-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Overview</Text>
                    <StatsCard
                        title="Available Courses"
                        value={courses.length}
                        subtitle="Total courses"
                        icon={<PlayCircle size={22} color="#3b82f6" />}
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
                        value={formatDuration(courses.reduce((sum, c) => sum + (c.totalDuration || 0), 0))}
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
                </View>

                {/* Filters */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Search & Filter</Text>

                    <View className="mb-4">
                        <View className="relative">
                            <Search
                                size={20}
                                color="#9ca3af"
                                style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}
                            />
                            <TextInput
                                placeholder="Search courses..."
                                placeholderTextColor="#6b7280"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                style={{
                                    paddingLeft: 48,
                                    paddingRight: 16,
                                    paddingVertical: 16,
                                    fontSize: 15,
                                    fontWeight: '500',
                                    color: '#ffffff',
                                    backgroundColor: 'rgba(17,24,39,0.5)',
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: '#374151',
                                }}
                            />
                        </View>
                    </View>

                    {/* Category Filter */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                        <View className="flex-row" style={{ gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setCategoryFilter("all")}
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 10,
                                    borderRadius: 10,
                                    borderWidth: 1.5,
                                    backgroundColor: categoryFilter === "all" ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                    borderColor: categoryFilter === "all" ? '#ea580c' : '#374151',
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={{
                                    fontWeight: '700',
                                    fontSize: 13,
                                    color: categoryFilter === "all" ? '#ffffff' : '#9ca3af',
                                }}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            {categories.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategoryFilter(cat)}
                                    style={{
                                        paddingHorizontal: 16,
                                        paddingVertical: 10,
                                        borderRadius: 10,
                                        borderWidth: 1.5,
                                        backgroundColor: categoryFilter === cat ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                        borderColor: categoryFilter === cat ? '#ea580c' : '#374151',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{
                                        fontWeight: '700',
                                        fontSize: 13,
                                        color: categoryFilter === cat ? '#ffffff' : '#9ca3af',
                                    }}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>

                    {(searchTerm || categoryFilter !== "all") && (
                        <TouchableOpacity
                            onPress={clearFilters}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                borderWidth: 1.5,
                                borderColor: 'rgba(239,68,68,0.3)',
                                borderRadius: 12,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                            }}
                            activeOpacity={0.7}
                        >
                            <X size={18} color="#ef4444" />
                            <Text className="text-red-400 font-semibold ml-2">Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Courses List */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">
                        Courses ({courses.length})
                    </Text>

                    {courses.length === 0 ? (
                        <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-12 items-center">
                            <View className="w-20 h-20 bg-gray-700/50 border border-gray-600 rounded-xl items-center justify-center mb-6">
                                <BookOpen size={40} color="#6b7280" />
                            </View>
                            <Text className="text-gray-300 text-lg font-semibold mb-2 text-center">
                                {searchTerm || categoryFilter !== "all" ? "No Courses Found" : "No Courses Available"}
                            </Text>
                            <Text className="text-gray-500 text-sm text-center">
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
            </ScrollView>
        </SafeAreaView>
    );
};

export default Learn;