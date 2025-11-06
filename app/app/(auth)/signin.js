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
import {
    Eye,
    EyeOff,
    Lock,
    Mail,
    AlertCircle,
} from 'lucide-react-native';
import api from '@/services/api';

const SignIn = () => {
    const router = useRouter();
    const { login, clearError, error: authError } = useAuth();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const pageConfig = {
        title: 'Welcome to Nupips User Panel',
        submitButton: {
            loading: 'Signing In...',
            default: 'Continue',
        },
    };

    const fieldConfigs = [
        {
            name: 'account',
            label: 'Email',
            type: 'email',
            placeholder: 'Enter your email',
            icon: Mail,
            validation: 'Email is required',
            required: true,
        },
        {
            name: 'password',
            label: 'Password',
            type: 'password',
            placeholder: 'Enter your password',
            icon: Lock,
            validation: 'Password is required',
            required: true,
            hasToggle: true,
        },
    ];

    const initialFormData = fieldConfigs.reduce((acc, field) => {
        acc[field.name] = '';
        return acc;
    }, {});

    const [formData, setFormData] = useState(initialFormData);
    const [passwordVisibility, setPasswordVisibility] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');

    React.useEffect(() => {
        const keyboardDidShow = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHide = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidShow.remove();
            keyboardDidHide.remove();
        };
    }, []);

    const handleInputChange = (fieldName, value) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
        if (errors[fieldName]) {
            setErrors((prev) => ({ ...prev, [fieldName]: '' }));
        }
        if (submitError) {
            setSubmitError('');
        }
        if (authError) {
            clearError();
        }
    };

    const togglePasswordVisibility = (fieldName) => {
        setPasswordVisibility((prev) => ({
            ...prev,
            [fieldName]: !prev[fieldName],
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        fieldConfigs.forEach((field) => {
            if (field.required && !formData[field.name]?.trim()) {
                newErrors[field.name] = field.validation;
            }
        });

        if (
            formData.account &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.account)
        ) {
            newErrors.account = 'Please enter a valid email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsLoading(true);
        setSubmitError('');

        try {
            const response = await api.post('/login', {
                account: formData.account,
                password: formData.password,
            });

            if (response.data.code === 200 && response.data.data) {
                const { access_token, refresh_token, email } = response.data.data;

                await login({
                    access_token,
                    refresh_token,
                    email: email || formData.account,
                });

                // REMOVED: router.replace('/(tabs)/dashboard');
                // MainLayout will handle navigation automatically
            } else {
                setSubmitError(
                    response.data.message || 'Login failed. Please check your credentials.'
                );
            }
        } catch (error) {
            console.error('[SignIn] Login error:', error);

            if (error.response?.data?.code === -1) {
                setSubmitError(
                    error.response.data.message || 'User does not exist or password is incorrect'
                );
            } else if (error.response?.data?.message) {
                setSubmitError(error.response.data.message);
            } else if (error.message === 'Network Error') {
                setSubmitError(
                    'Network error. Please check your connection and try again.'
                );
            } else {
                setSubmitError('Login failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderFormField = (field) => {
        const Icon = field.icon;
        const isPassword = field.type === 'password';
        const showPassword = passwordVisibility[field.name];
        const hasError = !!errors[field.name];

        return (
            <View key={field.name} className="mb-5">
                <Text className="text-xs font-semibold text-gray-700 mb-2 uppercase">
                    {field.label}
                </Text>

                <View
                    className={`flex-row items-center bg-white border rounded-lg px-3 ${hasError ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    <Icon size={20} color="#ea580c" />
                    <TextInput
                        value={formData[field.name]}
                        onChangeText={(value) => handleInputChange(field.name, value)}
                        placeholder={field.placeholder}
                        placeholderTextColor="#d1d5db"
                        secureTextEntry={isPassword && !showPassword}
                        keyboardType={field.type === 'email' ? 'email-address' : 'default'}
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!isLoading}
                        className="flex-1 py-3 px-3 text-base text-gray-900"
                    />

                    {field.hasToggle && (
                        <TouchableOpacity
                            onPress={() => togglePasswordVisibility(field.name)}
                            disabled={isLoading}
                            className="p-1"
                            activeOpacity={0.7}
                        >
                            {showPassword ? (
                                <Eye size={18} color="#9ca3af" />
                            ) : (
                                <EyeOff size={18} color="#9ca3af" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {errors[field.name] && (
                    <Text className="text-xs text-red-600 mt-1.5">
                        {errors[field.name]}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-orange-50">
            <StatusBar barStyle="dark-content" backgroundColor="#fef3c7" />
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
                    <View className={`flex-1 justify-center ${keyboardVisible ? 'pb-72' : 'pb-0'}`}>
                        {/* Header */}
                        <View className="mb-8">
                            <Text className="text-2xl font-bold text-amber-900 text-center">
                                {pageConfig.title}
                            </Text>
                        </View>

                        {/* Form Container */}
                        <View className="bg-white rounded-lg p-6 border border-orange-200">
                            {/* Submit Error */}
                            {submitError && (
                                <View className="mb-4 flex-row items-start bg-red-50 border border-red-300 rounded-lg px-3 py-2.5">
                                    <AlertCircle size={18} color="#dc2626" />
                                    <Text className="flex-1 text-xs font-medium text-red-900 ml-2">
                                        {submitError}
                                    </Text>
                                </View>
                            )}

                            {/* Auth Error */}
                            {authError && (
                                <View className="mb-4 flex-row items-start bg-red-50 border border-red-300 rounded-lg px-3 py-2.5">
                                    <AlertCircle size={18} color="#dc2626" />
                                    <Text className="flex-1 text-xs font-medium text-red-900 ml-2">
                                        {authError}
                                    </Text>
                                </View>
                            )}

                            {/* Form Fields */}
                            {fieldConfigs.map(renderFormField)}

                            {/* Submit Button */}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isLoading}
                                activeOpacity={0.8}
                                className={`mt-6 py-3.5 px-4 rounded-lg items-center justify-center ${isLoading ? 'bg-orange-400' : 'bg-orange-600'
                                    }`}
                            >
                                <View className="flex-row items-center">
                                    {isLoading && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ffffff"
                                            style={{ marginRight: 8 }}
                                        />
                                    )}
                                    <Text className="text-white text-base font-bold">
                                        {isLoading
                                            ? pageConfig.submitButton.loading
                                            : pageConfig.submitButton.default}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
