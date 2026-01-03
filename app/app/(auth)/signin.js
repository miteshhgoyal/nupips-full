import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { Mail, Lock, AlertCircle, RotateCcw, LogIn, EyeOff, Eye, CheckCircle } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import api from '@/services/api';

const SignIn = () => {
    const router = useRouter();
    const { login, clearError, error: authError } = useAuth();

    const [formData, setFormData] = useState({ userInput: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    const handleInputChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
        if (authError) {
            clearError();
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.userInput.trim()) newErrors.userInput = 'Username or Email is required';
        if (!formData.password) newErrors.password = 'Password is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (isLoading || !validateForm()) return;
        setIsLoading(true);
        setSuccessMessage('');
        setErrors({});

        try {
            const response = await api.post('/auth/login', {
                userInput: formData.userInput,
                password: formData.password,
                rememberMe,
            });
            if (response.data.token) {
                setSuccessMessage('Login successful! Redirecting...');
                await login(response.data);
                setTimeout(() => router.replace('/(tabs)/dashboard'), 1000);
            }
        } catch (error) {
            setErrors({
                submit: error.response?.data?.message || 'Invalid credentials. Please try again.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({ userInput: '', password: '' });
        setRememberMe(false);
        setErrors({});
        setSuccessMessage('');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 20,
                        paddingVertical: 40,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View className="w-full max-w-md mx-auto">
                        {/* Header */}
                        <View className="items-center mb-10">
                            <View className="w-24 h-24 bg-orange-500 rounded-2xl items-center justify-center mb-5">
                                <LogIn size={48} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-2">Nupips User Panel</Text>
                            <Text className="text-neutral-400 text-base">Welcome Back</Text>
                        </View>

                        {/* Form Container */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                            {successMessage && (
                                <View className="mb-5 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex-row items-center">
                                    <CheckCircle size={20} color="#22c55e" />
                                    <Text className="text-sm text-green-400 ml-3 flex-1 font-medium">{successMessage}</Text>
                                </View>
                            )}

                            {errors.submit && (
                                <View className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex-row items-center">
                                    <AlertCircle size={20} color="#ef4444" />
                                    <Text className="text-sm text-red-400 ml-3 flex-1 font-medium">{errors.submit}</Text>
                                </View>
                            )}

                            {/* Username/Email Input */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">
                                    Username or Email
                                </Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Mail size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.userInput}
                                        onChangeText={(value) => handleInputChange('userInput', value)}
                                        placeholder="Enter Username or Email"
                                        placeholderTextColor="#6b7280"
                                        className={`pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.userInput
                                                ? 'bg-red-500/5 border-red-500'
                                                : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                </View>
                                {errors.userInput && (
                                    <View className="flex-row items-center mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400 font-medium">{errors.userInput}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Password Input */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">
                                    Password
                                </Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Lock size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        placeholder="Enter Password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showPassword}
                                        className={`pl-12 pr-12 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.password
                                                ? 'bg-red-500/5 border-red-500'
                                                : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 16, top: 16, zIndex: 1, padding: 4 }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPassword ? (
                                            <Eye size={20} color="#9ca3af" />
                                        ) : (
                                            <EyeOff size={20} color="#9ca3af" />
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

                            {/* Remember Me */}
                            <TouchableOpacity
                                onPress={() => setRememberMe(!rememberMe)}
                                className="flex-row items-center mb-6"
                                activeOpacity={0.7}
                            >
                                <View
                                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${rememberMe ? 'bg-orange-500 border-orange-500' : 'border-neutral-600'
                                        }`}
                                >
                                    {rememberMe && <CheckCircle size={14} color="#fff" strokeWidth={3} />}
                                </View>
                                <Text className="text-sm text-white font-medium">Remember me</Text>
                            </TouchableOpacity>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={resetForm}
                                    className="flex-1 py-4 bg-neutral-800 border border-neutral-700 rounded-xl items-center justify-center flex-row"
                                    activeOpacity={0.7}
                                >
                                    <RotateCcw size={18} color="#d1d5db" />
                                    <Text className="text-neutral-200 font-bold text-base ml-2">Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    className={`flex-1 py-4 rounded-xl items-center justify-center flex-row ${isLoading ? 'bg-neutral-800/50' : 'bg-orange-500'
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <>
                                            <LogIn size={18} color="white" />
                                            <Text className="text-white font-bold text-base ml-2">Sign In</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="items-center mt-8">
                            <Text className="text-neutral-400 text-base">
                                Don't have an account?{' '}
                                <Text
                                    onPress={() => router.push('/(auth)/signup')}
                                    className="text-orange-500 font-bold"
                                >
                                    Register Now
                                </Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;