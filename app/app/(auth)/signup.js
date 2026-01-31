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
    Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { User, Mail, Phone, Lock, RotateCcw, UserCheck, Users, AlertCircle, CheckCircle, EyeOff, Eye } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import api from '@/services/api';

const SignUp = () => {
    const router = useRouter();
    const { login } = useAuth();

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
            const response = await api.post('/auth/register', {
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
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
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
                    <View className="w-full max-w-lg mx-auto">
                        {/* Header */}
                        <View className="items-center mb-10">
                            <View className="w-24 h-24 bg-orange-500 rounded-2xl items-center justify-center mb-5">
                                <UserCheck size={48} color="white" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-2">Nupips User Panel</Text>
                            <Text className="text-neutral-400 text-base">Join Our Community</Text>
                        </View>

                        {/* Form Container */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                            {formData.referredBy && (
                                <View className="mb-5 p-4 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex-row items-center">
                                    <Users size={20} color="#a855f7" />
                                    <View className="ml-3 flex-1">
                                        <Text className="text-xs font-bold text-purple-300 uppercase tracking-wide">
                                            Referred by: <Text className="font-mono">{formData.referredBy}</Text>
                                        </Text>
                                        <Text className="text-xs text-purple-400 mt-1">
                                            You'll be linked to this sponsor after registration
                                        </Text>
                                    </View>
                                </View>
                            )}

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

                            {/* Username */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">Username</Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <User size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.username}
                                        onChangeText={(value) => handleInputChange('username', value)}
                                        placeholder="Username"
                                        placeholderTextColor="#6b7280"
                                        className={`pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.username ? 'bg-red-500/5 border-red-500' : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                </View>
                                {errors.username && (
                                    <View className="flex-row items-center mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400 font-medium">{errors.username}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Full Name */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">Full Name</Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <User size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.name}
                                        onChangeText={(value) => handleInputChange('name', value)}
                                        placeholder="Full Name"
                                        placeholderTextColor="#6b7280"
                                        className={`pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.name ? 'bg-red-500/5 border-red-500' : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                </View>
                                {errors.name && (
                                    <View className="flex-row items-center mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400 font-medium">{errors.name}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Email */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">Email</Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Mail size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.email}
                                        onChangeText={(value) => handleInputChange('email', value)}
                                        placeholder="Email Address"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="email-address"
                                        className={`pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.email ? 'bg-red-500/5 border-red-500' : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                </View>
                                {errors.email && (
                                    <View className="flex-row items-center mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400 font-medium">{errors.email}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Phone */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">Phone</Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Phone size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.phone}
                                        onChangeText={(value) => handleInputChange('phone', value)}
                                        placeholder="Phone Number"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="phone-pad"
                                        className={`pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.phone ? 'bg-red-500/5 border-red-500' : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                </View>
                                {errors.phone && (
                                    <View className="flex-row items-center mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400 font-medium">{errors.phone}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Password */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">Password</Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Lock size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.password}
                                        onChangeText={(value) => handleInputChange('password', value)}
                                        placeholder="Password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showPassword}
                                        className={`pl-12 pr-12 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.password ? 'bg-red-500/5 border-red-500' : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={{ position: 'absolute', right: 16, top: 16, zIndex: 1, padding: 4 }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showPassword ? <Eye size={20} color="#9ca3af" /> : <EyeOff size={20} color="#9ca3af" />}
                                    </TouchableOpacity>
                                </View>
                                {errors.password && (
                                    <View className="flex-row items-start mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6, marginTop: 2 }} />
                                        <Text className="text-xs text-red-400 font-medium flex-1">{errors.password}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Confirm Password */}
                            <View className="mb-5">
                                <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">Confirm Password</Text>
                                <View className="relative">
                                    <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                        <Lock size={20} color="#ea580c" />
                                    </View>
                                    <TextInput
                                        value={formData.confirmPassword}
                                        onChangeText={(value) => handleInputChange('confirmPassword', value)}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#6b7280"
                                        secureTextEntry={!showConfirmPassword}
                                        className={`pl-12 pr-12 py-4 text-white text-base font-medium rounded-xl border-2 ${errors.confirmPassword ? 'bg-red-500/5 border-red-500' : 'bg-black/40 border-neutral-800'
                                            }`}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={{ position: 'absolute', right: 16, top: 16, zIndex: 1, padding: 4 }}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        {showConfirmPassword ? <Eye size={20} color="#9ca3af" /> : <EyeOff size={20} color="#9ca3af" />}
                                    </TouchableOpacity>
                                </View>
                                {errors.confirmPassword && (
                                    <View className="flex-row items-center mt-2">
                                        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400 font-medium">{errors.confirmPassword}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Referral Code */}
                            {!formData.referredBy && (
                                <View className="mb-5">
                                    <Text className="text-xs font-semibold text-neutral-400 mb-3 uppercase tracking-wide">
                                        Referral Code (Optional)
                                    </Text>
                                    <View className="relative">
                                        <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                            <Users size={20} color="#ea580c" />
                                        </View>
                                        <TextInput
                                            value={formData.referredBy}
                                            onChangeText={(value) => handleInputChange('referredBy', value)}
                                            placeholder="Referral Code (Optional)"
                                            placeholderTextColor="#6b7280"
                                            className="pl-12 pr-4 py-4 text-white text-base font-medium rounded-xl border-2 bg-black/40 border-neutral-800"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Terms Checkbox */}
                            <TouchableOpacity
                                onPress={() => setAcceptTerms(!acceptTerms)}
                                className="flex-row items-center mb-2"
                                activeOpacity={0.7}
                            >
                                <View
                                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${acceptTerms ? 'bg-orange-500 border-orange-500' : 'border-neutral-600'
                                        }`}
                                >
                                    {acceptTerms && <CheckCircle size={14} color="#fff" strokeWidth={3} />}
                                </View>
                                <Text className="text-sm text-white font-medium flex-1">
                                    I agree to the Terms and Privacy Policy
                                </Text>
                            </TouchableOpacity>
                            {errors.terms && (
                                <View className="flex-row items-center mb-5">
                                    <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text className="text-xs text-red-400 font-medium">{errors.terms}</Text>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View className="flex-row gap-3 mt-4">
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
                                            <UserCheck size={18} color="white" />
                                            <Text className="text-white font-bold text-base ml-2">Register</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Footer */}
                        <View className="items-center mt-8">
                            <Text className="text-neutral-400 text-base">
                                Already have an account?{' '}
                                <Text
                                    onPress={() => router.push('/(auth)/signin')}
                                    className="text-orange-500 font-bold"
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