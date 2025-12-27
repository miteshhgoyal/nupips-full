import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Modal,
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

const Learn = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");

    useEffect(() => {
        loadCourses();
    }, [searchTerm, categoryFilter]);

    const loadCourses = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await api.get("/learn/courses", {
                params: {
                    search: searchTerm || undefined,
                    category: categoryFilter !== "all" ? categoryFilter : undefined,
                },
            });
            setCourses(response.data.courses);
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    const categories = [...new Set(courses.map((c) => c.category))];

    const formatDuration = (seconds) => {
        if (!seconds) return "0m";
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    if (loading && courses.length === 0) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <View className="flex flex-col items-center gap-4">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-gray-400 font-medium">Loading courses...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <ScrollView className="flex-1">
                <View className="mx-4 my-8">
                    {/* Header */}
                    <View className="flex flex-row items-center gap-3 mb-4">
                        <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center">
                            <BookOpen size={24} color="#f97316" />
                        </View>
                        <Text className="text-3xl font-bold text-white">Learning Center</Text>
                    </View>
                    <Text className="text-gray-400 mb-6">
                        Expand your knowledge with our expert-led courses
                    </Text>

                    {error && (
                        <View className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl flex flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-sm text-red-400 flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError("")} className="hover:bg-red-800 rounded p-1">
                                <X size={16} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Stats */}
                    <View className="grid grid-cols-1 gap-4 mb-8">
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-blue-900 rounded-xl flex items-center justify-center">
                                    <PlayCircle size={24} color="#3b82f6" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Available Courses</Text>
                            <Text className="text-2xl font-bold text-white">{courses.length}</Text>
                        </View>

                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-purple-900 rounded-xl flex items-center justify-center">
                                    <Video size={24} color="#a855f7" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Total Lessons</Text>
                            <Text className="text-2xl font-bold text-white">
                                {courses.reduce((sum, c) => sum + c.videos.length, 0)}
                            </Text>
                        </View>

                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm">
                            <View className="flex flex-row items-center justify-between mb-4">
                                <View className="w-12 h-12 bg-orange-900 rounded-xl flex items-center justify-center">
                                    <Clock size={24} color="#f97316" />
                                </View>
                            </View>
                            <Text className="text-gray-400 text-sm font-medium mb-1">Total Duration</Text>
                            <Text className="text-2xl font-bold text-white">
                                {formatDuration(
                                    courses.reduce((sum, c) => sum + (c.totalDuration || 0), 0)
                                )}
                            </Text>
                        </View>
                    </View>

                    {/* Filters */}
                    <View className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-6 mb-8">
                        <Text className="text-xl font-bold text-white mb-4">Find Your Course</Text>
                        <View className="grid grid-cols-1 gap-4">
                            <View className="relative">
                                <Search size={20} color="#9ca3af" className="absolute left-3 top-1/2 -translate-y-1/2" />
                                <TextInput
                                    placeholder="Search courses..."
                                    value={searchTerm}
                                    onChangeText={setSearchTerm}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                                />
                            </View>

                            <View>
                                <Text className="text-gray-400 mb-2">Category</Text>
                                <View className="border border-gray-700 rounded-xl bg-gray-900">
                                    <TouchableOpacity onPress={() => setCategoryFilter("all")}>
                                        <Text className={`px-4 py-3 ${categoryFilter === "all" ? "bg-orange-900 text-white" : "text-white"}`}>
                                            All Categories
                                        </Text>
                                    </TouchableOpacity>
                                    {categories.map((cat) => (
                                        <TouchableOpacity key={cat} onPress={() => setCategoryFilter(cat)}>
                                            <Text className={`px-4 py-3 ${categoryFilter === cat ? "bg-orange-900 text-white" : "text-white"}`}>
                                                {cat}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Courses Grid */}
                    {courses.length === 0 ? (
                        <View className="bg-gray-800 rounded-xl border border-gray-700 shadow-sm p-16 text-center">
                            <View className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <PlayCircle size={40} color="#6b7280" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2">
                                {searchTerm || categoryFilter !== "all"
                                    ? "No Courses Found"
                                    : "No Courses Available"}
                            </Text>
                            <Text className="text-gray-400 mb-6">
                                {searchTerm || categoryFilter !== "all"
                                    ? "Try adjusting your filters"
                                    : "Check back soon for new content"}
                            </Text>
                            {(searchTerm || categoryFilter !== "all") && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchTerm("");
                                        setCategoryFilter("all");
                                    }}
                                    className="px-6 py-3 bg-linear-to-r from-orange-600 to-orange-500 rounded-xl"
                                >
                                    <Text className="text-white font-semibold">Clear Filters</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <>
                            <Text className="text-gray-400 mb-4">
                                Showing{" "}
                                <Text className="font-bold text-white">{courses.length}</Text>{" "}
                                {courses.length === 1 ? "course" : "courses"}
                            </Text>

                            <View className="grid grid-cols-1 gap-6">
                                {courses.map((course) => (
                                    <TouchableOpacity
                                        key={course._id}
                                        onPress={() => router.push(`/learn/course/${course._id}`)}
                                        className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:shadow-lg cursor-pointer"
                                    >
                                        <View className="bg-linear-to-br from-orange-900 to-orange-800 p-6 border-b border-orange-700">
                                            <Text className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-orange-600 mb-3">
                                                {course.category}
                                            </Text>
                                            <Text className="text-xl font-bold text-white line-clamp-2 group-hover:text-orange-500 transition-colors">
                                                {course.name}
                                            </Text>
                                        </View>

                                        <View className="p-6">
                                            <Text className="text-gray-400 text-sm mb-5 line-clamp-3">
                                                {course.description}
                                            </Text>

                                            <View className="flex flex-row items-center gap-4 mb-5 text-sm flex-wrap">
                                                <View className="flex flex-row items-center gap-1.5 text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg">
                                                    <Video size={16} color="#6b7280" />
                                                    <Text className="font-medium">{course.videos.length} lessons</Text>
                                                </View>
                                                <View className="flex flex-row items-center gap-1.5 text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg">
                                                    <Clock size={16} color="#6b7280" />
                                                    <Text className="font-medium">{formatDuration(course.totalDuration)}</Text>
                                                </View>
                                            </View>

                                            <TouchableOpacity className="w-full py-3 bg-linear-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg flex flex-row items-center justify-center gap-2">
                                                <Text className="text-white">Start Learning</Text>
                                                <ChevronRight size={20} color="#ffffff" />
                                            </TouchableOpacity>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Learn;
