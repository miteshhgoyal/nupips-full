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
} from "lucide-react-native";

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

    // Login form state
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

    // Loading state
    if (gtcLoading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center p-4">
                <View className="text-center">
                    <View className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <Text className="text-gray-400 text-lg">Loading GTC FX...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Authenticated state - Show account info and logout
    if (gtcAuthenticated && gtcUser) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <ScrollView className="flex-1">
                    <View className="mx-4 my-8">
                        {/* Header */}
                        <View className="text-center mb-8">
                            <View className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-600 to-orange-500 rounded-2xl shadow-lg mb-6">
                                <TrendingUp size={40} color="#ffffff" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-2">GTC FX Account</Text>
                            <Text className="text-gray-400">Manage your GTC FX authentication</Text>
                        </View>

                        {/* User Info Card */}
                        <View className="bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-700 mb-6">
                            {/* Profile Section */}
                            <View className="flex flex-col items-center gap-6 mb-8 pb-8 border-b border-gray-700">
                                <View className="w-20 h-20 bg-linear-to-br from-orange-600 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    {gtcUser.avatar ? (
                                        <Image
                                            source={{ uri: gtcUser.avatar }}
                                            style={{ width: 80, height: 80, borderRadius: 40 }}
                                        />
                                    ) : (
                                        <User size={40} color="#ffffff" />
                                    )}
                                </View>
                                <View className="text-center flex-1">
                                    <Text className="text-2xl font-bold text-white mb-1">
                                        {gtcUser.nickname || gtcUser.realname || "User"}
                                    </Text>
                                    <Text className="text-gray-400 mb-2">{gtcUser.email}</Text>
                                    <View className="flex flex-wrap gap-2 justify-center">
                                        <View
                                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${gtcUser.status === 1
                                                ? "bg-green-900 text-green-300"
                                                : "bg-red-900 text-red-300"
                                                }`}
                                        >
                                            <Shield size={12} color="#ffffff" />
                                            <Text>{gtcUser.status === 1 ? "Active" : "Inactive"}</Text>
                                        </View>
                                        <View className="inline-flex items-center gap-1 px-3 py-1 bg-blue-900 text-blue-300 rounded-full text-xs font-semibold">
                                            <Activity size={12} color="#ffffff" />
                                            <Text>{gtcUser.userType === 1 ? "Agent" : "User"}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Account Details Grid */}
                            <View className="grid grid-cols-1 gap-4 mb-8">
                                <View className="p-4 bg-gray-900 rounded-xl">
                                    <View className="flex flex-row items-center gap-3 mb-2">
                                        <View className="w-10 h-10 bg-orange-900 rounded-lg flex items-center justify-center">
                                            <DollarSign size={20} color="#f97316" />
                                        </View>
                                        <View>
                                            <Text className="text-sm text-gray-400 font-medium">Account Balance</Text>
                                            <Text className="text-xl font-bold text-white">
                                                ${parseFloat(gtcUser.amount || 0).toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="p-4 bg-gray-900 rounded-xl">
                                    <View className="flex flex-row items-center gap-3 mb-2">
                                        <View className="w-10 h-10 bg-blue-900 rounded-lg flex items-center justify-center">
                                            <Calendar size={20} color="#3b82f6" />
                                        </View>
                                        <View>
                                            <Text className="text-sm text-gray-400 font-medium">Member Since</Text>
                                            <Text className="text-xl font-bold text-white">
                                                {gtcUser.create_time
                                                    ? new Date(parseInt(gtcUser.create_time) * 1000).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            year: "numeric",
                                                        }
                                                    )
                                                    : "N/A"}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="grid grid-cols-1 gap-4">
                                <TouchableOpacity
                                    onPress={() => router.push("/gtcfx/dashboard")}
                                    className="flex flex-row items-center justify-center gap-2 w-full bg-linear-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold"
                                >
                                    <Text>Go to Dashboard</Text>
                                    <ArrowRight size={20} color="#ffffff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={handleLogout}
                                    className="w-full bg-gray-700 text-red-400 border-2 border-red-700 py-4 px-6 rounded-xl font-semibold flex flex-row items-center justify-center gap-2"
                                >
                                    <LogOut size={20} color="#ef4444" />
                                    <Text>Logout</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Not authenticated - Show login form
    return (
        <SafeAreaView className="flex-1 bg-gray-900 justify-center p-4">
            <View className="w-full mx-4">
                {/* Header */}
                <View className="text-center mb-8">
                    <View className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-600 to-orange-500 rounded-2xl shadow-lg mb-6">
                        <TrendingUp size={40} color="#ffffff" />
                    </View>
                    <Text className="text-3xl font-bold text-white mb-2">GTC FX Login</Text>
                    <Text className="text-gray-400">Access your trading account and strategies</Text>
                </View>

                {/* Login Form Card */}
                <View className="bg-gray-800 rounded-2xl p-8 shadow-lg border border-gray-700">
                    {/* Error Messages */}
                    {submitError && (
                        <View className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl flex flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-sm text-red-400 flex-1">{submitError}</Text>
                        </View>
                    )}

                    {gtcError && (
                        <View className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl flex flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-sm text-red-400 flex-1">{gtcError}</Text>
                        </View>
                    )}

                    <View className="space-y-5">
                        {/* Email Field */}
                        <View>
                            <Text className="text-sm font-medium text-gray-400 mb-2">Email Address</Text>
                            <View className="relative">
                                <User size={20} color="#9ca3af" className="absolute left-4 top-1/2 -translate-y-1/2" />
                                <TextInput
                                    value={formData.account}
                                    onChangeText={(value) => handleInputChange("account", value)}
                                    editable={!isLoading}
                                    className={`w-full pl-12 pr-4 py-3 border rounded-xl ${errors.account ? "border-red-700 bg-red-900" : "border-gray-700 bg-gray-900"
                                        } text-white`}
                                    placeholder="Enter your email"
                                />
                            </View>
                            {errors.account && (
                                <View className="mt-2 flex flex-row items-center gap-1">
                                    <AlertCircle size={16} color="#ef4444" />
                                    <Text className="text-sm text-red-400">{errors.account}</Text>
                                </View>
                            )}
                        </View>

                        {/* Password Field */}
                        <View>
                            <Text className="text-sm font-medium text-gray-400 mb-2">Password</Text>
                            <View className="relative">
                                <Lock size={20} color="#9ca3af" className="absolute left-4 top-1/2 -translate-y-1/2" />
                                <TextInput
                                    value={formData.password}
                                    onChangeText={(value) => handleInputChange("password", value)}
                                    editable={!isLoading}
                                    secureTextEntry={!showPassword}
                                    className={`w-full pl-12 pr-12 py-3 border rounded-xl ${errors.password ? "border-red-700 bg-red-900" : "border-gray-700 bg-gray-900"
                                        } text-white`}
                                    placeholder="Enter your password"
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
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
                                <View className="mt-2 flex flex-row items-center gap-1">
                                    <AlertCircle size={16} color="#ef4444" />
                                    <Text className="text-sm text-red-400">{errors.password}</Text>
                                </View>
                            )}
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleLogin}
                            disabled={isLoading}
                            className="w-full bg-linear-to-r from-orange-600 to-orange-500 text-white py-4 px-6 rounded-xl font-semibold flex flex-row items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text>Signing In...</Text>
                                </>
                            ) : (
                                <Text>Login to GTC FX</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Footer */}
                <View className="text-center mt-6">
                    <Text className="text-gray-400 text-sm">
                        Need help?{" "}
                        <TouchableOpacity onPress={() => Linking.openURL("mailto:support@gtcfx.com")}>
                            <Text className="text-orange-500 font-medium">Contact Support</Text>
                        </TouchableOpacity>
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default GTCFxAuth;
