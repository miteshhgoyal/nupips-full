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

    const AlertBox = ({ message, onDismiss }) => (
        <View className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
            <View className="flex-row items-center">
                <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                <View className="flex-1">
                    <Text className="text-red-400 text-sm font-medium leading-5">{message}</Text>
                </View>
                <TouchableOpacity onPress={onDismiss} className="ml-2 p-1">
                    <X size={18} color="#ef4444" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const InfoRow = ({ icon: Icon, label, value }) => (
        <View className="flex-row items-center justify-between py-4 border-b border-neutral-800">
            <View className="flex-row items-center flex-1">
                <Icon size={18} color="#9ca3af" style={{ marginRight: 12 }} />
                <Text className="text-neutral-400 text-sm">{label}</Text>
            </View>
            <Text className="text-white font-semibold text-sm" numberOfLines={1}>
                {value}
            </Text>
        </View>
    );

    if (gtcLoading) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center px-6">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium text-center">Loading GTC FX...</Text>
            </SafeAreaView>
        );
    }

    if (gtcAuthenticated && gtcUser) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />

                {/* Header */}
                <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={20} color="#fff" />
                            </TouchableOpacity>
                            <View>
                                <Text className="text-2xl font-bold text-white">GTC FX Account</Text>
                                <Text className="text-sm text-neutral-400 mt-0.5">Manage your trading account</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Profile Header */}
                    <View className="px-5 mt-6 mb-6">
                        <View className="items-center mb-6">
                            <View className="w-24 h-24 bg-orange-500/15 rounded-2xl items-center justify-center mb-4 overflow-hidden">
                                {gtcUser.avatar ? (
                                    <Image
                                        source={{ uri: gtcUser.avatar }}
                                        style={{ width: 96, height: 96, borderRadius: 16 }}
                                    />
                                ) : (
                                    <User size={44} color="#ea580c" />
                                )}
                            </View>
                            <Text className="text-2xl font-bold text-white mb-2 text-center">
                                {gtcUser.nickname || gtcUser.realname || "User"}
                            </Text>
                            <Text className="text-neutral-400 text-base text-center">{gtcUser.email}</Text>
                        </View>

                        {/* Status Badges */}
                        <View className="flex-row gap-3 mb-6">
                            <View className={`flex-1 py-3 px-4 rounded-xl border-2 flex-row items-center justify-center ${gtcUser.status === 1
                                ? 'bg-green-500/15 border-green-500/30'
                                : 'bg-red-500/15 border-red-500/30'
                                }`}>
                                <Shield size={16} color={gtcUser.status === 1 ? "#22c55e" : "#ef4444"} />
                                <Text className={`font-bold text-sm ml-2 ${gtcUser.status === 1 ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {gtcUser.status === 1 ? "Active" : "Inactive"}
                                </Text>
                            </View>

                            <View className="flex-1 py-3 px-4 rounded-xl border-2 bg-blue-500/15 border-blue-500/30 flex-row items-center justify-center">
                                <Activity size={16} color="#3b82f6" />
                                <Text className="text-blue-400 font-bold text-sm ml-2">
                                    {gtcUser.userType === 1 ? "Agent" : "User"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Balance Overview */}
                    <View className="px-5 mb-6">
                        <Text className="text-lg font-bold text-white mb-4">Account Overview</Text>

                        {/* Main Balance Card */}
                        <View className="bg-neutral-900/50 rounded-2xl p-5 mb-3">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                        <DollarSign size={22} color="#ea580c" />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
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

                        {/* Member Since Card */}
                        <View className="bg-neutral-900/50 rounded-2xl p-5">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                    <Calendar size={22} color="#3b82f6" />
                                </View>
                                <View>
                                    <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1">
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

                    {/* Account Details */}
                    <View className="px-5 mb-6">
                        <View className="bg-neutral-900/50 rounded-2xl p-5">
                            <Text className="text-lg font-bold text-white mb-5">Account Information</Text>
                            <InfoRow
                                icon={User}
                                label="Real Name"
                                value={gtcUser.realname || "—"}
                            />
                            <InfoRow
                                icon={User}
                                label="Nickname"
                                value={gtcUser.nickname || "—"}
                            />
                            <View className="flex-row items-center justify-between py-4">
                                <View className="flex-row items-center flex-1">
                                    <Shield size={18} color="#9ca3af" style={{ marginRight: 12 }} />
                                    <Text className="text-neutral-400 text-sm">Account Status</Text>
                                </View>
                                <View className={`px-3 py-1.5 rounded-lg ${gtcUser.status === 1 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                                    <Text className={`font-semibold text-xs ${gtcUser.status === 1 ? 'text-green-400' : 'text-red-400'}`}>
                                        {gtcUser.status === 1 ? "Active" : "Inactive"}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View className="px-5 gap-3">
                        <TouchableOpacity
                            onPress={() => router.push("/gtcfx/dashboard")}
                            className="py-5 bg-orange-500 rounded-2xl flex-row items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <Text className="text-white font-bold text-base mr-2">Go to Dashboard</Text>
                            <ArrowRight size={20} color="#ffffff" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleLogout}
                            className="py-5 bg-red-500/15 border-2 border-red-500/30 rounded-2xl flex-row items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <LogOut size={20} color="#ef4444" />
                            <Text className="text-red-400 font-bold text-base ml-2">Logout</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Login Form
    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">GTC FX Login</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Access your trading account</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Hero Section */}
                <View className="px-5 mt-6 mb-6">
                    <View className="items-center">
                        <View className="w-24 h-24 bg-orange-500/15 rounded-2xl items-center justify-center mb-4">
                            <TrendingUp size={44} color="#ea580c" />
                        </View>
                        <Text className="text-neutral-400 text-center text-base leading-6">
                            Access your trading account and strategies
                        </Text>
                    </View>
                </View>

                {/* Form Card */}
                <View className="px-5">
                    <View className="bg-neutral-900/50 rounded-2xl p-5">
                        {/* Error Alerts */}
                        {submitError && <AlertBox message={submitError} onDismiss={() => setSubmitError("")} />}
                        {gtcError && <AlertBox message={gtcError} onDismiss={clearGTCError} />}

                        {/* Email Input */}
                        <View className="mb-5">
                            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
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
                                    className={`pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.account
                                        ? 'bg-red-500/5 border-red-500'
                                        : 'bg-black/40 border-neutral-800'
                                        }`}
                                />
                            </View>
                            {errors.account && (
                                <View className="flex-row items-center mt-2">
                                    <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text className="text-xs text-red-400 font-medium">{errors.account}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Input */}
                        <View className="mb-6">
                            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
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
                                    className={`pl-12 pr-12 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.password
                                        ? 'bg-red-500/5 border-red-500'
                                        : 'bg-black/40 border-neutral-800'
                                        }`}
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
                                <View className="flex-row items-center mt-2">
                                    <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text className="text-xs text-red-400 font-medium">{errors.password}</Text>
                                </View>
                            )}
                        </View>

                        {/* Login Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            className={`py-5 rounded-2xl items-center mb-5 ${isLoading ? 'bg-neutral-800/50' : 'bg-orange-500'
                                }`}
                            activeOpacity={0.7}
                        >
                            {isLoading ? (
                                <View className="flex-row items-center gap-3">
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text className="text-white font-bold text-base">Signing In...</Text>
                                </View>
                            ) : (
                                <Text className="text-white font-bold text-base">Login to GTC FX</Text>
                            )}
                        </TouchableOpacity>

                        {/* Support Section */}
                        <View className="pt-5 border-t border-neutral-800 items-center">
                            <Text className="text-neutral-500 text-sm mb-4">Need help?</Text>
                            <TouchableOpacity
                                onPress={() => Linking.openURL("mailto:support@gtcfx.com")}
                                className="py-3 px-6 bg-orange-500/15 border-2 border-orange-500/30 rounded-xl"
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