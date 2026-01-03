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
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';
import SummaryCard from '@/components/SummaryCard';

// Duration formatter
const formatDuration = (seconds) => {
    if (!seconds) return "0m";
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
};

// Course Card Component
const CourseCard = ({ course, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden mb-4"
            activeOpacity={0.7}
        >
            {/* Course Header */}
            <View className="p-5 bg-orange-500/10 border-b border-orange-500/20">
                <View className="mb-3">
                    <View className="bg-orange-500/15 border border-orange-500/30 px-3 py-1.5 rounded-xl self-start">
                        <Text className="text-xs text-orange-400 font-bold uppercase tracking-wide">
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
                <Text className="text-neutral-400 text-sm mb-4 leading-5" numberOfLines={3}>
                    {course.description}
                </Text>

                <View className="flex-row gap-3 mb-4">
                    <View className="flex-1 bg-black/40 border border-neutral-800 px-4 py-3 rounded-xl flex-row items-center">
                        <Video size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-sm">
                            {course.videos?.length || 0} lessons
                        </Text>
                    </View>
                    <View className="flex-1 bg-black/40 border border-neutral-800 px-4 py-3 rounded-xl flex-row items-center">
                        <Clock size={16} color="#9ca3af" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold text-sm">
                            {formatDuration(course.totalDuration)}
                        </Text>
                    </View>
                </View>

                {/* CTA Button */}
                <TouchableOpacity
                    className="w-full py-4 bg-orange-500 rounded-xl flex-row items-center justify-center"
                    activeOpacity={0.7}
                >
                    <Text className="text-white font-bold text-base mr-2">Start Learning</Text>
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
        if (!refreshing && courses.length === 0) {
            setLoading(true);
        }
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
        setRefreshing(true);
        loadCourses();
    };

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("all");
    };

    if (loading && courses.length === 0 && !refreshing) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading courses...</Text>
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
                        <Text className="text-2xl font-bold text-white">Learning Center</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">Explore our courses</Text>
                    </View>
                </View>
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

                {/* Stats Cards */}
                <View className="px-5 mt-6 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Overview</Text>
                    <View className="flex-row gap-3 mb-3">
                        <SummaryCard
                            icon={<PlayCircle size={20} color="#3b82f6" />}
                            label="Courses"
                            value={courses.length}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                        <SummaryCard
                            icon={<Video size={20} color="#a855f7" />}
                            label="Lessons"
                            value={courses.reduce((sum, c) => sum + (c.videos?.length || 0), 0)}
                            valueColor="text-white"
                            bgColor="bg-neutral-900/50"
                        />
                    </View>
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <View className="flex-row items-center mb-3">
                            <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-3">
                                <Clock size={20} color="#ea580c" />
                            </View>
                            <View>
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">
                                    Total Duration
                                </Text>
                                <Text className="text-2xl font-bold text-white">
                                    {formatDuration(courses.reduce((sum, c) => sum + (c.totalDuration || 0), 0))}
                                </Text>
                            </View>
                        </View>
                        <Text className="text-xs text-neutral-500">Learning time across all courses</Text>
                    </View>
                </View>

                {/* Filters */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Search & Filter</Text>

                    {/* Search Bar */}
                    <View className="mb-4">
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                            Search Courses
                        </Text>
                        <View className="relative">
                            <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                <Search size={18} color="#9ca3af" />
                            </View>
                            <TextInput
                                placeholder="Search courses..."
                                placeholderTextColor="#6b7280"
                                value={searchTerm}
                                onChangeText={setSearchTerm}
                                className="pl-12 pr-4 py-4 text-white text-base font-medium bg-neutral-900 border-2 border-neutral-800 rounded-xl"
                            />
                        </View>
                    </View>

                    {/* Category Filter */}
                    <View className="mb-4">
                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                            Category
                        </Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View className="flex-row gap-2">
                                <TouchableOpacity
                                    onPress={() => setCategoryFilter("all")}
                                    className={`px-4 py-3 rounded-xl border-2 ${categoryFilter === "all"
                                            ? "bg-orange-500 border-orange-500"
                                            : "bg-transparent border-neutral-800"
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        className={`font-bold text-sm ${categoryFilter === "all" ? "text-white" : "text-neutral-400"
                                            }`}
                                    >
                                        All
                                    </Text>
                                </TouchableOpacity>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat}
                                        onPress={() => setCategoryFilter(cat)}
                                        className={`px-4 py-3 rounded-xl border-2 ${categoryFilter === cat
                                                ? "bg-orange-500 border-orange-500"
                                                : "bg-transparent border-neutral-800"
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            className={`font-bold text-sm ${categoryFilter === cat ? "text-white" : "text-neutral-400"
                                                }`}
                                        >
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Clear Filters */}
                    {(searchTerm || categoryFilter !== "all") && (
                        <TouchableOpacity
                            onPress={clearFilters}
                            className="flex-row items-center bg-red-500/10 border-2 border-red-500/30 rounded-xl py-3 px-4"
                            activeOpacity={0.7}
                        >
                            <X size={18} color="#ef4444" style={{ marginRight: 8 }} />
                            <Text className="text-red-400 font-bold">Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Courses List */}
                <View className="px-5 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">
                        Courses ({courses.length})
                    </Text>

                    {courses.length === 0 ? (
                        <View className="bg-neutral-900/30 rounded-2xl p-12 items-center">
                            <View className="w-20 h-20 bg-neutral-800/50 rounded-2xl items-center justify-center mb-4">
                                <BookOpen size={40} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2 text-center">
                                {searchTerm || categoryFilter !== "all" ? "No Courses Found" : "No Courses Available"}
                            </Text>
                            <Text className="text-neutral-400 text-sm text-center">
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