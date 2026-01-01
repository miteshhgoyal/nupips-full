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
    X,
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
                            <Text className="text-2xl font-bold text-white">GTC FX Account</Text>
                            <Text className="text-sm text-gray-400 mt-0.5">Manage your trading account</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Profile Header Card */}
                    <View className="mx-4 mt-5 mb-6">
                        <View className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 rounded-2xl p-6 border border-orange-500/20">
                            <View className="items-center mb-5">
                                <View style={{
                                    width: 80,
                                    height: 80,
                                    backgroundColor: 'rgba(234,88,12,0.15)',
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                    overflow: 'hidden',
                                }}>
                                    {gtcUser.avatar ? (
                                        <Image
                                            source={{ uri: gtcUser.avatar }}
                                            style={{ width: 80, height: 80, borderRadius: 16 }}
                                        />
                                    ) : (
                                        <User size={40} color="#ea580c" />
                                    )}
                                </View>
                                <Text className="text-2xl font-bold text-white mb-2 text-center">
                                    {gtcUser.nickname || gtcUser.realname || "User"}
                                </Text>
                                <Text className="text-gray-400 text-sm text-center">{gtcUser.email}</Text>
                            </View>

                            {/* Status Badges */}
                            <View className="flex-row" style={{ gap: 12 }}>
                                <View className="flex-1" style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    borderRadius: 12,
                                    backgroundColor: gtcUser.status === 1 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: gtcUser.status === 1 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Shield size={16} color={gtcUser.status === 1 ? "#22c55e" : "#ef4444"} style={{ marginRight: 8 }} />
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: gtcUser.status === 1 ? "#4ade80" : "#f87171",
                                    }}>
                                        {gtcUser.status === 1 ? "Active" : "Inactive"}
                                    </Text>
                                </View>

                                <View className="flex-1" style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(59,130,246,0.3)',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Activity size={16} color="#3b82f6" style={{ marginRight: 8 }} />
                                    <Text className="text-blue-400 font-bold" style={{ fontSize: 13 }}>
                                        {gtcUser.userType === 1 ? "Agent" : "User"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Stats Cards */}
                    <View className="px-4 mb-6">
                        {/* Balance Card */}
                        <View className="mb-5">
                            <View className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                            <DollarSign size={22} color="#ea580c" />
                                        </View>
                                        <View>
                                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                Account Balance
                                            </Text>
                                            <Text className="text-3xl font-bold text-white">
                                                ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View className="w-10 h-10 bg-orange-500/10 rounded-full items-center justify-center">
                                        <TrendingUp size={20} color="#ea580c" />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Member Since Card */}
                        <View className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                    <Calendar size={22} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                        Member Since
                                    </Text>
                                    <Text className="text-2xl font-bold text-white">
                                        {gtcUser.create_time
                                            ? new Date(parseInt(gtcUser.create_time) * 1000).toLocaleDateString(
                                                "en-US",
                                                { month: "short", day: "numeric", year: "numeric" }
                                            )
                                            : "N/A"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="px-4" style={{ gap: 12 }}>
                        <TouchableOpacity
                            onPress={() => router.push("/gtcfx/dashboard")}
                            style={{
                                paddingVertical: 18,
                                backgroundColor: '#ea580c',
                                borderRadius: 14,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                            activeOpacity={0.7}
                        >
                            <Text className="text-white font-bold text-base">Go to Dashboard</Text>
                            <ArrowRight size={20} color="#ffffff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogout}
                            style={{
                                paddingVertical: 18,
                                backgroundColor: 'rgba(239,68,68,0.15)',
                                borderWidth: 1.5,
                                borderColor: 'rgba(239,68,68,0.3)',
                                borderRadius: 14,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                            }}
                            activeOpacity={0.7}
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text className="text-red-400 font-bold text-base">Logout</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Login Form
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
                        <Text className="text-2xl font-bold text-white">GTC FX Login</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">Access your trading account</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Hero Section */}
                <View className="px-4 mt-5 mb-6">
                    <View className="items-center">
                        <View style={{
                            width: 80,
                            height: 80,
                            backgroundColor: 'rgba(234,88,12,0.15)',
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16,
                        }}>
                            <TrendingUp size={40} color="#ea580c" />
                        </View>
                        <Text className="text-gray-400 text-center text-sm leading-5">
                            Access your trading account and strategies
                        </Text>
                    </View>
                </View>

                {/* Form Card */}
                <View className="px-4">
                    <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                        {/* Error Alerts */}
                        {submitError && (
                            <View className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <View className="flex-row items-center">
                                    <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                                    <View className="flex-1">
                                        <Text className="text-red-400 text-sm font-medium leading-5">{submitError}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => setSubmitError("")}
                                        className="ml-2 p-1"
                                    >
                                        <X size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {gtcError && (
                            <View className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                <View className="flex-row items-center">
                                    <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                                    <View className="flex-1">
                                        <Text className="text-red-400 text-sm font-medium leading-5">{gtcError}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={clearGTCError}
                                        className="ml-2 p-1"
                                    >
                                        <X size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Email Input */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Email Address
                            </Text>
                            <View className="relative">
                                <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                    <User size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    value={formData.account}
                                    onChangeText={(value) => handleInputChange("account", value)}
                                    editable={!isLoading}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    style={{
                                        paddingLeft: 48,
                                        paddingRight: 16,
                                        paddingVertical: 16,
                                        fontSize: 15,
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        backgroundColor: errors.account ? 'rgba(239,68,68,0.05)' : 'rgba(17,24,39,0.5)',
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: errors.account ? '#ef4444' : '#374151',
                                    }}
                                />
                            </View>
                            {errors.account && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                    <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text className="text-xs text-red-400 font-medium">{errors.account}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Input */}
                        <View className="mb-6">
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Password
                            </Text>
                            <View className="relative">
                                <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                    <Lock size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    value={formData.password}
                                    onChangeText={(value) => handleInputChange("password", value)}
                                    editable={!isLoading}
                                    secureTextEntry={!showPassword}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#6b7280"
                                    style={{
                                        paddingLeft: 48,
                                        paddingRight: 48,
                                        paddingVertical: 16,
                                        fontSize: 15,
                                        fontWeight: '500',
                                        color: '#ffffff',
                                        backgroundColor: errors.password ? 'rgba(239,68,68,0.05)' : 'rgba(17,24,39,0.5)',
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: errors.password ? '#ef4444' : '#374151',
                                    }}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 16, top: 16, zIndex: 1, padding: 4 }}
                                    disabled={isLoading}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#9ca3af" />
                                    ) : (
                                        <Eye size={20} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                    <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text className="text-xs text-red-400 font-medium">{errors.password}</Text>
                                </View>
                            )}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            style={{
                                paddingVertical: 18,
                                backgroundColor: isLoading ? 'rgba(55,65,81,0.4)' : '#ea580c',
                                borderRadius: 14,
                                alignItems: 'center',
                                marginBottom: 20,
                                opacity: isLoading ? 0.5 : 1,
                            }}
                            activeOpacity={0.7}
                        >
                            {isLoading ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text className="text-white font-bold text-base">Signing In...</Text>
                                </View>
                            ) : (
                                <Text className="text-white font-bold text-base">Login to GTC FX</Text>
                            )}
                        </TouchableOpacity>

                        {/* Support Section */}
                        <View className="pt-5 border-t border-gray-700/50 items-center">
                            <Text className="text-gray-500 text-sm mb-4">Need help?</Text>
                            <TouchableOpacity
                                onPress={() => Linking.openURL("mailto:support@gtcfx.com")}
                                style={{
                                    paddingVertical: 12,
                                    paddingHorizontal: 24,
                                    backgroundColor: 'rgba(234,88,12,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(234,88,12,0.3)',
                                    borderRadius: 10,
                                }}
                                activeOpacity={0.7}
                            >
                                <Text className="text-orange-400 font-bold text-sm">Contact Support</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default GTCFxAuth;