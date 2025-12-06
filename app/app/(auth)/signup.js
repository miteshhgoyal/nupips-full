import React, { useState, useEffect } from 'react';
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
import { User, Mail, Phone, Lock, RotateCcw, UserCheck, Users, AlertCircle, CheckCircle, EyeOff, Eye } from 'lucide-react-native';
import api from '@/services/api';

const SignUp = () => {
    const router = useRouter();
    const { login } = useAuth();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        referredBy: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
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
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.username.trim()) newErrors.username = 'Username is required';
        else if (formData.username.length < 4) newErrors.username = 'Username must be at least 4 characters';
        if (!formData.name.trim()) newErrors.name = 'Full name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Please enter a valid email';
        if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
        if (!formData.password) newErrors.password = 'Password is required';
        else {
            const hasLetter = /[a-zA-Z]/.test(formData.password);
            const hasDigit = /\d/.test(formData.password);
            const hasSpecial = /[@#$%^&*]/.test(formData.password);
            const validLength = formData.password.length >= 6;
            const validChars = /^[A-Za-z\d@#$%^&*]+$/.test(formData.password);
            if (!(hasLetter && hasDigit && hasSpecial && validLength && validChars)) {
                newErrors.password = 'Password must be at least 6 characters with letters, numbers, and special chars (@#$%^&*)';
            }
        }
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!acceptTerms) newErrors.terms = 'Please accept the terms and conditions';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (isLoading || !validateForm()) return;
        setIsLoading(true);
        setErrors({});
        try {
            const response = await api.post('/register', {
                name: formData.name,
                username: formData.username,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                referredBy: formData.referredBy || null,
            });
            setSuccessMessage('Registration successful! Redirecting...');
            if (response.data.token) {
                await login({
                    ...response.data,
                    rememberMe: true,
                });
                setTimeout(() => router.replace('/(tabs)/dashboard'), 1000);
            }
        } catch (error) {
            setErrors({
                submit: error.response?.data?.message || 'Registration failed',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            name: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: '',
            referredBy: '',
        });
        setAcceptTerms(false);
        setErrors({});
        setSuccessMessage('');
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
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
                    <View className="w-full max-w-lg mx-auto">
                        {/* Header */}
                        <View className="items-center mb-8">
                            <View className="w-20 h-20 bg-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-orange-900/50">
                                <UserCheck size={40} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-2">Nupips User Panel</Text>
                            <Text className="text-gray-400 text-base">Join Our Community</Text>
                        </View>

                        {/* Form Container */}
                        <View className="bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-700">
                            {formData.referredBy && (
                                <View className="mb-4 p-3 bg-purple-900/30 border border-purple-700 rounded-lg flex-row items-center">
                                    <Users size={20} color="#a78bfa" />
                                    <View className="ml-2 flex-1">
                                        <Text className="text-xs font-semibold text-purple-300">
                                            Referred by: <Text className="font-mono">{formData.referredBy}</Text>
                                        </Text>
                                        <Text className="text-xs text-purple-400 mt-0.5">
                                            You'll be linked to this sponsor after registration
                                        </Text>
                                    </View>
                                </View>
                            )}

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

                            {/* Username */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Username</Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <User size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.username}
                                        onChangeText={(value) => handleInputChange('username', value)}
                                        placeholder="Username"
                                        placeholderTextColor="#6b7280"
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                </View>
                                {errors.username && <Text className="text-xs text-red-400 mt-1 ml-1">{errors.username}</Text>}
                            </View>

                            {/* Full Name */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Full Name</Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <User size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.name}
                                        onChangeText={(value) => handleInputChange('name', value)}
                                        placeholder="Full Name"
                                        placeholderTextColor="#6b7280"
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                </View>
                                {errors.name && <Text className="text-xs text-red-400 mt-1 ml-1">{errors.name}</Text>}
                            </View>

                            {/* Email */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Email</Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <Mail size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.email}
                                        onChangeText={(value) => handleInputChange('email', value)}
                                        placeholder="Email Address"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="email-address"
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                </View>
                                {errors.email && <Text className="text-xs text-red-400 mt-1 ml-1">{errors.email}</Text>}
                            </View>

                            {/* Phone */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Phone</Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <Phone size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.phone}
                                        onChangeText={(value) => handleInputChange('phone', value)}
                                        placeholder="Phone Number"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="phone-pad"
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                </View>
                                {errors.phone && <Text className="text-xs text-red-400 mt-1 ml-1">{errors.phone}</Text>}
                            </View>

                            {/* Password */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Password</Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <Lock size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        placeholder="Password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showPassword}
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                        {showPassword ? <Eye size={20} color="#9ca3af" /> : <EyeOff size={20} color="#9ca3af" />}
                                    </TouchableOpacity>
                                </View>
                                {errors.password && <Text className="text-xs text-red-400 mt-1 ml-1">{errors.password}</Text>}
                            </View>

                            {/* Confirm Password */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Confirm Password</Text>
                                <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                    <Lock size={20} color="#ea580c" />
                                    <TextInput
                                        value={formData.confirmPassword}
                                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showConfirmPassword}
                                        className="flex-1 py-3 px-3 text-base text-white"
                                    />
                                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                        {showConfirmPassword ? <Eye size={20} color="#9ca3af" /> : <EyeOff size={20} color="#9ca3af" />}
                                    </TouchableOpacity>
                                </View>
                                {errors.confirmPassword && <Text className="text-xs text-red-400 mt-1 ml-1">{errors.confirmPassword}</Text>}
                            </View>

                            {/* Referral Code */}
                            {!formData.referredBy && (
                                <View className="mb-4">
                                    <Text className="text-xs font-semibold text-gray-300 mb-2 uppercase tracking-wider">Referral Code (Optional)</Text>
                                    <View className="flex-row items-center bg-gray-700 border border-gray-600 rounded-lg px-3">
                                        <Users size={20} color="#ea580c" />
                                        <TextInput
                                            value={formData.referredBy}
                                            onChangeText={(value) => handleInputChange('referredBy', value)}
                                            placeholder="Referral Code (Optional)"
                                            placeholderTextColor="#6b7280"
                                            className="flex-1 py-3 px-3 text-base text-white"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                onPress={() => setAcceptTerms(!acceptTerms)}
                                className="flex-row items-center mb-6"
                            >
                                <View className={`w-5 h-5 rounded border-2 mr-2 ${acceptTerms ? 'bg-orange-600 border-orange-600' : 'border-gray-600'}`} />
                                <Text className="text-sm text-gray-300">I agree to the Terms and Privacy Policy</Text>
                            </TouchableOpacity>
                            {errors.terms && <Text className="text-xs text-red-400 mb-4 ml-1">{errors.terms}</Text>}

                            {/* Action Buttons */}
                            <View className="flex-row gap-3">
                                <TouchableOpacity
                                    onPress={resetForm}
                                    className="flex-1 px-4 py-3.5 bg-gray-700 rounded-lg items-center justify-center border border-gray-600 flex-row"
                                >
                                    <RotateCcw size={18} color="#d1d5db" />
                                    <Text className="text-gray-200 font-semibold text-sm ml-2">Reset</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-3.5 bg-orange-600 rounded-lg items-center justify-center disabled:opacity-50 flex-row shadow-lg shadow-orange-900/50"
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#ffffff" />
                                    ) : (
                                        <>
                                            <UserCheck size={18} color="white" />
                                            <Text className="text-white font-semibold text-sm ml-2">Register</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="items-center mt-6">
                            <Text className="text-gray-400 text-sm">
                                Already have an account?{' '}
                                <Text
                                    onPress={() => router.push('/(auth)/signin')}
                                    className="text-orange-500 font-semibold"
                                >
                                    Sign In
                                </Text>
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignUp;
