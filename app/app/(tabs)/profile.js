import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    User,
    Mail,
    Phone,
    ShieldCheck,
    Edit3,
    Save,
    X,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Wallet,
    TrendingUp,
    TrendingDown,
    Calendar,
    Info,
    Link2,
    Copy,
    Check,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Users
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const Profile = () => {
    const router = useRouter();
    const { user, checkAuth, updateUser } = useAuth();

    // States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form states
    const [basic, setBasic] = useState({ name: '', username: '' });
    const [pwd, setPwd] = useState({
        current: '',
        next: '',
        confirm: '',
        showCurrent: false,
        showNext: false,
        showConfirm: false,
    });

    // Load profile data
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            const response = await api.get('/profile');
            const data = response.data;
            setBasic({
                name: data.name || '',
                username: data.username || '',
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const validateBasic = () => {
        if (!basic.name.trim()) return 'Name is required';
        if (!basic.username.trim()) return 'Username is required';
        if (basic.username.length < 3) return 'Username must be at least 3 characters';
        return '';
    };

    const saveBasic = async () => {
        const validationError = validateBasic();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);
        setError('');
        try {
            const response = await api.put('/profile/update', {
                name: basic.name.trim(),
                username: basic.username.trim(),
            });
            updateUser?.(response.data.user);
            setSuccess('Profile updated successfully');
            setEditing(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const changePassword = async () => {
        if (!pwd.current || !pwd.next || !pwd.confirm) {
            setError('Please fill all password fields');
            return;
        }
        if (pwd.next.length < 8) {
            setError('New password must be at least 8 characters');
            return;
        }
        if (pwd.next !== pwd.confirm) {
            setError('New password and confirm password do not match');
            return;
        }

        setChangingPassword(true);
        setError('');
        try {
            await api.put('/profile/update', {
                changePassword: {
                    currentPassword: pwd.current,
                    newPassword: pwd.next,
                },
            });
            setSuccess('Password updated successfully');
            setPwd({ current: '', next: '', confirm: '', showCurrent: false, showNext: false, showConfirm: false });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    const resetForm = () => {
        setError('');
        setSuccess('');
        setPwd({ current: '', next: '', confirm: '', showCurrent: false, showNext: false, showConfirm: false });
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#f97316" />
                    <Text className="text-white mt-4 text-lg">Loading profile...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-700 px-6 py-5">
                <TouchableOpacity onPress={() => router.back()} className="flex-row items-center gap-3 mb-4">
                    <ArrowLeft size={28} color="#f97316" />
                    <Text className="text-2xl font-bold text-white">Profile</Text>
                </TouchableOpacity>
                <View className="flex-row items-center gap-4">
                    <View className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl items-center justify-center">
                        <User size={32} color="white" />
                    </View>
                    <View className="flex-1">
                        <Text className="text-2xl font-bold text-white">{basic.name || user?.name}</Text>
                        <Text className="text-lg text-gray-400">@{basic.username || user?.username}</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-6 py-8 pb-24">
                    {/* Balance Cards */}
                    <View className="grid grid-cols-2 gap-6 mb-10">
                        <View className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-3xl p-8 border border-orange-500/40">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-14 h-14 bg-orange-500/80 rounded-2xl items-center justify-center">
                                    <Wallet size={24} color="white" />
                                </View>
                                <Text className="text-xl font-bold text-white">Balance</Text>
                            </View>
                            <Text className="text-3xl font-bold text-orange-100">
                                ${user?.walletBalance?.toFixed(2) || '0.00'}
                            </Text>
                        </View>

                        <View className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-3xl p-8 border border-emerald-500/40">
                            <View className="flex-row items-center gap-3 mb-4">
                                <View className="w-14 h-14 bg-emerald-500/80 rounded-2xl items-center justify-center">
                                    <TrendingUp size={24} color="white" />
                                </View>
                                <Text className="text-xl font-bold text-white">Total Deposits</Text>
                            </View>
                            <Text className="text-3xl font-bold text-emerald-100">
                                ${user?.financials?.totalDeposits?.toFixed(2) || '0.00'}
                            </Text>
                        </View>
                    </View>

                    {/* Alerts */}
                    {error && (
                        <View className="mb-6 p-6 bg-red-500/20 border border-red-500/40 rounded-3xl flex-row items-start gap-4">
                            <AlertCircle size={28} color="#ef4444" />
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-red-300 mb-2">{error}</Text>
                                <TouchableOpacity onPress={() => setError('')}>
                                    <Text className="text-red-400 text-lg font-semibold">Dismiss</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {success && (
                        <View className="mb-6 p-6 bg-green-500/20 border border-green-500/40 rounded-3xl flex-row items-start gap-4">
                            <CheckCircle size={28} color="#22c55e" />
                            <Text className="text-xl font-bold text-green-300">{success}</Text>
                        </View>
                    )}

                    {/* Basic Info */}
                    <View className="bg-gray-800/50 rounded-3xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-2xl font-bold text-white">Basic Information</Text>
                            {editing ? (
                                <View className="flex-row gap-3">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setEditing(false);
                                            setBasic({ name: user?.name || '', username: user?.username || '' });
                                        }}
                                        className="p-3 bg-gray-700/50 rounded-2xl"
                                    >
                                        <X size={24} color="#9ca3af" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={saveBasic}
                                        disabled={saving}
                                        className="p-3 bg-orange-600 rounded-2xl items-center justify-center"
                                    >
                                        {saving ? (
                                            <ActivityIndicator color="white" size={20} />
                                        ) : (
                                            <Save size={24} color="white" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setEditing(true)}
                                    className="p-3 bg-gray-700/50 rounded-2xl"
                                >
                                    <Edit3 size={24} color="#f97316" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-gray-400 text-lg font-semibold mb-4">Full Name</Text>
                                <View className="relative">
                                    <User size={24} color="#9ca3af" style={{ position: 'absolute', left: 20, top: 20, zIndex: 1 }} />
                                    <TextInput
                                        value={editing ? basic.name : user?.name || ''}
                                        onChangeText={(text) => setBasic({ ...basic, name: text })}
                                        editable={editing}
                                        className={`pl-16 pr-6 py-6 text-2xl text-white rounded-3xl border-2 ${editing
                                                ? 'border-orange-500/50 bg-gray-900/70'
                                                : 'border-gray-700/50 bg-gray-900/50'
                                            }`}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-400 text-lg font-semibold mb-4">@Username</Text>
                                <View className="relative">
                                    <Users size={24} color="#9ca3af" style={{ position: 'absolute', left: 20, top: 20, zIndex: 1 }} />
                                    <TextInput
                                        value={editing ? basic.username : user?.username || ''}
                                        onChangeText={(text) => setBasic({ ...basic, username: text })}
                                        editable={editing}
                                        className={`pl-16 pr-6 py-6 text-2xl text-white rounded-3xl border-2 ${editing
                                                ? 'border-orange-500/50 bg-gray-900/70'
                                                : 'border-gray-700/50 bg-gray-900/50'
                                            }`}
                                    />
                                </View>
                                <Text className="text-sm text-gray-500 mt-2">Must be unique and at least 3 characters</Text>
                            </View>
                        </View>
                    </View>

                    {/* Security */}
                    <View className="bg-gray-800/50 rounded-3xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
                        <Text className="text-2xl font-bold text-white mb-6">Security</Text>

                        <View className="space-y-6">
                            <View>
                                <Text className="text-gray-400 text-lg font-semibold mb-4">Current Password</Text>
                                <View className="relative">
                                    <Lock size={24} color="#9ca3af" style={{ position: 'absolute', left: 20, top: 20, zIndex: 1 }} />
                                    <TextInput
                                        value={pwd.current}
                                        onChangeText={(text) => setPwd({ ...pwd, current: text })}
                                        secureTextEntry={!pwd.showCurrent}
                                        className="pl-16 pr-16 py-6 text-xl text-white bg-gray-900/70 border-2 border-gray-700 rounded-3xl"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setPwd({ ...pwd, showCurrent: !pwd.showCurrent })}
                                        style={{ position: 'absolute', right: 20, top: 20, zIndex: 1 }}
                                    >
                                        {pwd.showCurrent ? (
                                            <EyeOff size={24} color="#9ca3af" />
                                        ) : (
                                            <Eye size={24} color="#9ca3af" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View>
                                <Text className="text-gray-400 text-lg font-semibold mb-4">New Password</Text>
                                <View className="relative">
                                    <Lock size={24} color="#9ca3af" style={{ position: 'absolute', left: 20, top: 20, zIndex: 1 }} />
                                    <TextInput
                                        value={pwd.next}
                                        onChangeText={(text) => setPwd({ ...pwd, next: text })}
                                        secureTextEntry={!pwd.showNext}
                                        className="pl-16 pr-16 py-6 text-xl text-white bg-gray-900/70 border-2 border-gray-700 rounded-3xl"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setPwd({ ...pwd, showNext: !pwd.showNext })}
                                        style={{ position: 'absolute', right: 20, top: 20, zIndex: 1 }}
                                    >
                                        {pwd.showNext ? (
                                            <EyeOff size={24} color="#9ca3af" />
                                        ) : (
                                            <Eye size={24} color="#9ca3af" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                <Text className="text-sm text-gray-500 mt-2">Minimum 8 characters</Text>
                            </View>

                            <View>
                                <Text className="text-gray-400 text-lg font-semibold mb-4">Confirm Password</Text>
                                <View className="relative">
                                    <Lock size={24} color="#9ca3af" style={{ position: 'absolute', left: 20, top: 20, zIndex: 1 }} />
                                    <TextInput
                                        value={pwd.confirm}
                                        onChangeText={(text) => setPwd({ ...pwd, confirm: text })}
                                        secureTextEntry={!pwd.showConfirm}
                                        className="pl-16 pr-16 py-6 text-xl text-white bg-gray-900/70 border-2 border-gray-700 rounded-3xl"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setPwd({ ...pwd, showConfirm: !pwd.showConfirm })}
                                        style={{ position: 'absolute', right: 20, top: 20, zIndex: 1 }}
                                    >
                                        {pwd.showConfirm ? (
                                            <EyeOff size={24} color="#9ca3af" />
                                        ) : (
                                            <Eye size={24} color="#9ca3af" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={changePassword}
                                disabled={changingPassword}
                                className={`rounded-3xl py-6 items-center ${changingPassword
                                        ? 'bg-gray-700/50'
                                        : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-2xl shadow-orange-500/40'
                                    }`}
                            >
                                {changingPassword ? (
                                    <View className="flex-row items-center gap-3">
                                        <ActivityIndicator color="white" />
                                        <Text className="text-white font-bold text-xl">Updating...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center gap-3">
                                        <RefreshCw size={24} color="white" />
                                        <Text className="text-white font-bold text-xl">Update Password</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Account Info */}
                    <View className="bg-gray-800/50 rounded-3xl p-8 border border-gray-700/50 backdrop-blur-sm">
                        <Text className="text-2xl font-bold text-white mb-6">Account Info</Text>
                        <View className="space-y-6">
                            <View className="flex-row justify-between py-4 border-b border-gray-700 pb-4">
                                <Text className="text-gray-400 text-lg">Email</Text>
                                <Text className="text-xl font-bold text-white">{user?.email}</Text>
                            </View>
                            <View className="flex-row justify-between py-4 border-b border-gray-700 pb-4">
                                <Text className="text-gray-400 text-lg">Member Since</Text>
                                <Text className="text-xl font-bold text-white">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                            <View className="flex-row justify-between py-4">
                                <Text className="text-gray-400 text-lg">Status</Text>
                                <View className={`px-6 py-3 rounded-2xl ${user?.status === 'active'
                                        ? 'bg-green-500/20 border border-green-500/40'
                                        : 'bg-gray-700/50 border border-gray-600'
                                    }`}>
                                    <Text className={`font-bold ${user?.status === 'active' ? 'text-green-400' : 'text-gray-400'
                                        }`}>
                                        {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1) || 'Active'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
