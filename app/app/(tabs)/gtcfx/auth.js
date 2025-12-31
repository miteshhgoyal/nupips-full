import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Image,
    Linking,
} from "react-native";
import { useRouter } from 'expo-router';
import { useGTCFxAuth } from "@/context/gtcfxAuthContext";
import api from "@/services/api";
import {
    User,
    Lock,
    Eye,
    EyeOff,
    TrendingUp,
    AlertCircle,
    LogOut,
    ArrowRight,
    Activity,
    DollarSign,
    Calendar,
    Shield,
    ArrowLeft,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';

const GTCFxAuth = () => {
    const {
        gtcLogin,
        gtcLogout,
        clearGTCError,
        gtcError,
        gtcAuthenticated,
        gtcUser,
        gtcLoading,
    } = useGTCFxAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        account: "",
        password: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState("");

    const handleInputChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
        if (submitError) {
            setSubmitError("");
        }
        if (gtcError) {
            clearGTCError();
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.account?.trim()) {
            newErrors.account = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.account)) {
            newErrors.account = "Please enter a valid email address";
        }

        if (!formData.password?.trim()) {
            newErrors.password = "Password is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setSubmitError("");

        try {
            const response = await api.post("/gtcfx/login", {
                account: formData.account,
                password: formData.password,
            });

            if (response.data && response.data.data) {
                const { access_token, refresh_token, user } = response.data.data;
                const loginSuccess = await gtcLogin({
                    access_token,
                    refresh_token,
                    user,
                });

                if (loginSuccess) {
                    setFormData({ account: "", password: "" });
                } else {
                    setSubmitError("Failed to complete login. Please try again.");
                }
            } else {
                setSubmitError(
                    response.data.message || "Login failed. Please check your credentials."
                );
            }
        } catch (error) {
            console.error("GTC FX login error:", error);

            if (error.response?.data?.message) {
                setSubmitError(error.response.data.message);
            } else if (error.message === "Network Error") {
                setSubmitError(
                    "Network error. Please check your connection and try again."
                );
            } else {
                setSubmitError("Login failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await gtcLogout();
        setFormData({ account: "", password: "" });
    };

    if (gtcLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium text-center">Loading GTC FX...</Text>
            </SafeAreaView>
        );
    }

    if (gtcAuthenticated && gtcUser) {
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
                        <Text className="text-white font-semibold text-base ml-3">GTC FX Account</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="py-4 pb-24">
                        {/* Profile Card */}
                        <View className="mx-2 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                            <View className="items-center mb-6">
                                <View className="w-20 h-20 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mb-4">
                                    {gtcUser.avatar ? (
                                        <Image
                                            source={{ uri: gtcUser.avatar }}
                                            className="w-20 h-20 rounded-2xl"
                                        />
                                    ) : (
                                        <User size={32} color="#ea580c" />
                                    )}
                                </View>
                                <Text className="text-xl font-bold text-white mb-2 text-center">{gtcUser.nickname || gtcUser.realname || "User"}</Text>
                                <Text className="text-gray-400 text-sm text-center">{gtcUser.email}</Text>
                            </View>

                            {/* Status Badges */}
                            <View className="flex-row mb-6">
                                <View className={`flex-1 px-4 py-2 rounded-xl text-xs font-semibold mr-3 border ${gtcUser.status === 1
                                    ? "bg-green-500/20 border-green-500/30"
                                    : "bg-red-500/20 border-red-500/30"
                                    }`}>
                                    <Shield size={16} color={gtcUser.status === 1 ? "#22c55e" : "#ef4444"} style={{ marginRight: 6 }} />
                                    <Text className={`font-semibold ${gtcUser.status === 1 ? "text-green-400" : "text-red-400"}`}>
                                        {gtcUser.status === 1 ? "Active" : "Inactive"}
                                    </Text>
                                </View>
                                <View className="flex-1 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                                    <Activity size={16} color="#3b82f6" style={{ marginRight: 6 }} />
                                    <Text className="text-blue-400 text-xs font-semibold">{gtcUser.userType === 1 ? "Agent" : "User"}</Text>
                                </View>
                            </View>

                            {/* Stats Cards */}
                            <View className="mb-6">
                                <View className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl mb-4">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mr-4">
                                            <DollarSign size={20} color="#ea580c" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-xs font-medium mb-1">Account Balance</Text>
                                            <Text className="text-3xl font-bold text-white">
                                                ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="p-5 bg-gray-900/50 border border-gray-800 rounded-xl">
                                    <View className="flex-row items-center">
                                        <View className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-xl items-center justify-center mr-4">
                                            <Calendar size={20} color="#3b82f6" />
                                        </View>
                                        <View className="flex-1">
                                            <Text className="text-gray-400 text-xs font-medium mb-1">Member Since</Text>
                                            <Text className="text-2xl font-bold text-white">
                                                {gtcUser.create_time
                                                    ? new Date(parseInt(gtcUser.create_time) * 1000).toLocaleDateString(
                                                        "en-US",
                                                        { month: "short", year: "numeric" }
                                                    )
                                                    : "N/A"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Actions */}
                            <TouchableOpacity
                                onPress={() => router.push("/gtcfx/dashboard")}
                                className="w-full bg-orange-600 px-6 py-5 rounded-xl items-center mb-4 border border-orange-600/30 active:bg-orange-700"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center">
                                    <Text className="text-white font-bold text-xl mr-3">Go to Dashboard</Text>
                                    <ArrowRight size={20} color="#ffffff" />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleLogout}
                                className="w-full bg-red-500/20 border border-red-500/30 rounded-xl px-6 py-5 items-center active:bg-red-500/30"
                                activeOpacity={0.9}
                            >
                                <View className="flex-row items-center">
                                    <LogOut size={20} color="#ef4444" style={{ marginRight: 8 }} />
                                    <Text className="text-red-400 font-bold text-xl">Logout</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Login Form
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
                    <Text className="text-white font-semibold text-base ml-3">GTC FX Login</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24 px-4">
                    {/* Hero */}
                    <View className="items-center mb-6">
                        <View className="w-20 h-20 bg-orange-500/20 border border-orange-500/50 rounded-xl items-center justify-center mb-4">
                            <TrendingUp size={32} color="#ea580c" />
                        </View>
                        <Text className="text-gray-400 text-center text-sm font-medium">Access your trading account and strategies</Text>
                    </View>

                    {/* Form Card */}
                    <View className="bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        {submitError && (
                            <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                                <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                                <Text className="text-red-400 text-sm flex-1">{submitError}</Text>
                            </View>
                        )}

                        {gtcError && (
                            <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                                <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                                <Text className="text-red-400 text-sm flex-1">{gtcError}</Text>
                            </View>
                        )}

                        {/* Email */}
                        <View className="mb-6">
                            <Text className="text-gray-400 text-sm font-medium mb-3">Email Address</Text>
                            <View className="relative">
                                <User size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
                                <TextInput
                                    value={formData.account}
                                    onChangeText={(value) => handleInputChange("account", value)}
                                    editable={!isLoading}
                                    className={`w-full pl-12 pr-5 py-4 border rounded-xl text-white text-base ${errors.account
                                        ? "border-red-500/50 bg-red-500/10"
                                        : "border-gray-700/40 bg-gray-900/50"
                                        }`}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#6b7280"
                                />
                            </View>
                            {errors.account && (
                                <View className="flex-row items-center mt-3">
                                    <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
                                    <Text className="text-red-400 text-sm">{errors.account}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password */}
                        <View className="mb-6">
                            <Text className="text-gray-400 text-sm font-medium mb-3">Password</Text>
                            <View className="relative">
                                <Lock size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 18, zIndex: 1 }} />
                                <TextInput
                                    value={formData.password}
                                    onChangeText={(value) => handleInputChange("password", value)}
                                    editable={!isLoading}
                                    secureTextEntry={!showPassword}
                                    className={`w-full pl-12 pr-12 py-4 border rounded-xl text-white text-base ${errors.password
                                        ? "border-red-500/50 bg-red-500/10"
                                        : "border-gray-700/40 bg-gray-900/50"
                                        }`}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#6b7280"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 16, top: 18, zIndex: 1 }}
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9ca3af" />
                                    ) : (
                                        <Eye size={20} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <View className="flex-row items-center mt-3">
                                    <AlertCircle size={16} color="#ef4444" style={{ marginRight: 8 }} />
                                    <Text className="text-red-400 text-sm">{errors.password}</Text>
                                </View>
                            )}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            className="w-full bg-orange-600 px-6 py-5 rounded-xl items-center border border-orange-600/30 active:bg-orange-700 mb-6"
                            activeOpacity={0.9}
                        >
                            {isLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 12 }} />
                                    <Text className="text-white font-bold text-lg">Signing In...</Text>
                                </>
                            ) : (
                                <Text className="text-white font-bold text-lg">Login to GTC FX</Text>
                            )}
                        </TouchableOpacity>

                        {/* Footer */}
                        <View className="items-center">
                            <Text className="text-gray-500 text-sm mb-4">Need help?</Text>
                            <TouchableOpacity
                                onPress={() => Linking.openURL("mailto:support@gtcfx.com")}
                                className="px-6 py-3 border border-orange-600/30 rounded-xl active:bg-orange-600/10"
                                activeOpacity={0.9}
                            >
                                <Text className="text-orange-400 font-semibold text-base">Contact Support</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxAuth;
