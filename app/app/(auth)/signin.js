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
    StatusBar,
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { Mail, Lock, AlertCircle, RotateCcw, LogIn, EyeOff, Eye, CheckCircle } from 'lucide-react-native';
import api from '@/services/api';

const SignIn = () => {
    const router = useRouter();
    const { login, clearError, error: authError } = useAuth();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const [formData, setFormData] = useState({ userInput: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    React.useEffect(() => {
        const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            keyboardDidShow.remove();
            keyboardDidHide.remove();
        };
    }, []);

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
            console.log("=====================");
            console.log("proceeding to send login request");
            const response = await api.post('/auth/login', {
                userInput: formData.userInput,
                password: formData.password,
                rememberMe,
            });
            console.log("login request sent");
            if (response.data.token) {
                console.log("login request successful");
                setSuccessMessage('Login successful! Redirecting...');
                console.log("logging in using auth context login function");
                await login(response.data);
            }
            console.log("login request was unsuccessful");
            setTimeout(() => router.replace('/(tabs)/dashboard'), 1000);
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
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        paddingVertical: 24,
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View className="w-full max-w-md mx-auto">
                        {/* Header */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/50">
                                <LogIn size={40} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-2">Nupips User Panel</Text>
                            <Text className="text-gray-400 text-base">Welcome Back</Text>
                        </View>

                        {/* Form Container */}
                        <View className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
                            {successMessage && (
                                <View className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg flex-row items-center">
                                    <CheckCircle size={18} color="#22c55e" />
                                    <Text className="text-sm text-green-400 ml-2 flex-1">{successMessage}</Text>
                                </View>
                            )}

                            {errors.submit && (
                                <View className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg flex-row items-center">
                                    <AlertCircle size={18} color="#ef4444" />
                                    <Text className="text-sm text-red-400 ml-2 flex-1">{errors.submit}</Text>
                                </View>
                            )}

                            {/* Username/Email Input */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                                    Username or Email
                                </Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <Mail size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.userInput}
                                        onChangeText={(value) => handleInputChange('userInput', value)}
                                        placeholder="Enter Username or Email"
                                        placeholderTextColor="#6b7280"
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                </View>
                                {errors.userInput && (
                                    <Text className="text-xs text-red-400 mt-1 ml-1">{errors.userInput}</Text>
                                )}
                            </View>

                            {/* Password Input */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                                    Password
                                </Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <Lock size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        placeholder="Enter Password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showPassword}
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? (
                                            <Eye size={20} color="#9ca3af" />
                                        ) : (
                                            <EyeOff size={20} color="#9ca3af" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {errors.password && (
                                    <Text className="text-xs text-red-400 mt-1 ml-1">{errors.password}</Text>
                                )}
                            </View>

                            {/* Remember Me */}
                            <TouchableOpacity
                                onPress={() => setRememberMe(!rememberMe)}
                                className="flex-row items-center mb-6"
                            >
                                <View className={`w-5 h-5 rounded border-2 mr-2 ${rememberMe ? 'bg-orange-600 border-orange-600' : 'border-gray-600'}`} />
                                <Text className="text-sm text-gray-300">Remember me</Text>
                            </TouchableOpacity>

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={resetForm}
                                    className="flex-1 px-6 py-3.5 bg-gray-700 rounded-lg items-center justify-center border border-gray-600 flex-row"
                                >
                                    <RotateCcw size={18} color="#d1d5db" />
                                    <Text className="text-gray-200 font-semibold text-sm ml-2">Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 px-6 py-3.5 bg-orange-600 rounded-lg items-center justify-center disabled:opacity-50 flex-row shadow-lg shadow-orange-900/50"
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <>
                                            <LogIn size={18} color="white" />
                                            <Text className="text-white font-semibold text-sm ml-2">Sign In</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="items-center mt-6">
                            <Text className="text-gray-400 text-sm">
                                Don't have an account?{' '}
                                <Text
                                    onPress={() => router.push('/(auth)/signup')}
                                    className="text-orange-500 font-semibold"
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
