// app/(auth)/signin.js
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
    Alert,
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
    CheckCircle,
} from 'lucide-react-native';
import api from '@/services/api';

const SignIn = () => {
    const router = useRouter();
    const { login, clearError, error: authError } = useAuth();

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

                const loginSuccess = login({
                    access_token,
                    refresh_token,
                    email: email || formData.account,
                });

                if (loginSuccess) {
                    router.replace('/(tabs)/dashboard');
                } else {
                    setSubmitError('Failed to complete login. Please try again.');
                }
            } else {
                setSubmitError(
                    response.data.message ||
                    'Login failed. Please check your credentials.'
                );
            }
        } catch (error) {
            console.error('Login error:', error);

            if (error.response?.data?.code === -1) {
                setSubmitError(
                    error.response.data.message ||
                    'User does not exist or password is incorrect'
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
            <View key={field.name} style={{ marginBottom: 20 }}>
                {/* Label */}
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    {field.label}
                </Text>

                {/* Input Container */}
                <View
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#ffffff',
                        borderWidth: 1,
                        borderColor: hasError ? '#ef4444' : '#d1d5db',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 2,
                    }}
                >
                    <Icon
                        size={20}
                        color="#ea580c"
                        style={{ marginRight: 8 }}
                    />
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
                        style={{
                            flex: 1,
                            paddingVertical: 12,
                            fontSize: 16,
                            color: '#111827',
                        }}
                    />

                    {/* Password Toggle */}
                    {field.hasToggle && (
                        <TouchableOpacity
                            onPress={() => togglePasswordVisibility(field.name)}
                            disabled={isLoading}
                            style={{ padding: 4 }}
                        >
                            {showPassword ? (
                                <Eye size={18} color="#9ca3af" />
                            ) : (
                                <EyeOff size={18} color="#9ca3af" />
                            )}
                        </TouchableOpacity>
                    )}
                </View>

                {/* Error Message */}
                {errors[field.name] && (
                    <Text style={{ marginTop: 6, fontSize: 13, color: '#dc2626' }}>
                        {errors[field.name]}
                    </Text>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#faf5f0' }} edges={['top']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        paddingHorizontal: 16,
                        paddingTop: 40,
                        paddingBottom: 40,
                        justifyContent: 'center',
                    }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Title */}
                    <View style={{ textAlign: 'center', marginBottom: 32 }}>
                        <Text
                            style={{
                                fontSize: 24,
                                fontWeight: '700',
                                color: '#92400e',
                                textAlign: 'center',
                            }}
                        >
                            {pageConfig.title}
                        </Text>
                    </View>

                    {/* Card Container */}
                    <View
                        style={{
                            backgroundColor: '#ffffff',
                            borderRadius: 8,
                            padding: 24,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 3,
                            borderWidth: 1,
                            borderColor: '#fed7aa',
                        }}
                    >
                        {/* Submit Error */}
                        {submitError && (
                            <View
                                style={{
                                    marginBottom: 16,
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    backgroundColor: '#fef2f2',
                                    borderWidth: 1,
                                    borderColor: '#fecaca',
                                    borderRadius: 6,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                }}
                            >
                                <AlertCircle size={18} color="#dc2626" style={{ marginTop: 2, marginRight: 8 }} />
                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        fontWeight: '500',
                                        color: '#b91c1c',
                                    }}
                                >
                                    {submitError}
                                </Text>
                            </View>
                        )}

                        {/* Auth Error */}
                        {authError && (
                            <View
                                style={{
                                    marginBottom: 16,
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    backgroundColor: '#fef2f2',
                                    borderWidth: 1,
                                    borderColor: '#fecaca',
                                    borderRadius: 6,
                                    paddingHorizontal: 12,
                                    paddingVertical: 10,
                                }}
                            >
                                <AlertCircle size={18} color="#dc2626" style={{ marginTop: 2, marginRight: 8 }} />
                                <Text
                                    style={{
                                        flex: 1,
                                        fontSize: 13,
                                        fontWeight: '500',
                                        color: '#b91c1c',
                                    }}
                                >
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
                            style={{
                                marginTop: 8,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                backgroundColor: isLoading ? '#d97706' : '#ea580c',
                                borderRadius: 6,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : null}
                            <Text
                                style={{
                                    color: '#ffffff',
                                    fontSize: 16,
                                    fontWeight: '600',
                                    marginLeft: isLoading ? 8 : 0,
                                }}
                            >
                                {isLoading
                                    ? pageConfig.submitButton.loading
                                    : pageConfig.submitButton.default}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default SignIn;
