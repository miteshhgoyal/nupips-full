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
    Calendar,
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
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4 font-medium">Loading profile...</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-2xl font-bold text-white">Profile</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Profile Header */}
                    <View className="mx-4 items-center mb-6">
                        <View className="w-24 h-24 bg-orange-600/30 border border-orange-600/50 rounded-xl items-center justify-center mb-4">
                            <User size={48} color="#ea580c" />
                        </View>
                        <Text className="text-2xl font-bold text-white mb-1 text-center">
                            {basic.name || user?.name || 'User'}
                        </Text>
                        <Text className="text-lg text-gray-400 text-center">
                            @{basic.username || user?.username || 'username'}
                        </Text>
                    </View>

                    {/* Balance Cards - VERTICAL */}
                    <View className="mx-4 mb-6">
                        <View className="bg-orange-600/20 border border-orange-600/40 rounded-xl p-6 mb-4">
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 bg-orange-600/50 border border-orange-600 rounded-xl items-center justify-center mr-4">
                                    <Wallet size={24} color="#ffffff" />
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-sm font-medium mb-1">Wallet Balance</Text>
                                    <Text className="text-2xl font-bold text-orange-400">
                                        ${user?.walletBalance?.toFixed(2) || '0.00'}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="bg-green-500/20 border border-green-500/40 rounded-xl p-6">
                            <View className="flex-row items-center">
                                <View className="w-14 h-14 bg-green-500/50 border border-green-500 rounded-xl items-center justify-center mr-4">
                                    <TrendingUp size={24} color="#ffffff" />
                                </View>
                                <View>
                                    <Text className="text-gray-400 text-sm font-medium mb-1">Total Deposits</Text>
                                    <Text className="text-2xl font-bold text-green-400">
                                        ${user?.financials?.totalDeposits?.toFixed(2) || '0.00'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Alerts */}
                    {error && (
                        <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError('')} className="p-1" activeOpacity={0.7}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {success && (
                        <View className="mx-4 mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-xl flex-row items-start">
                            <CheckCircle size={20} color="#22c55e" style={{ marginRight: 12 }} />
                            <Text className="text-green-400 text-sm flex-1">{success}</Text>
                            <TouchableOpacity onPress={() => setSuccess('')} className="p-1" activeOpacity={0.7}>
                                <X size={20} color="#22c55e" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Basic Info */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center justify-between mb-5">
                            <Text className="text-xl font-bold text-white">Basic Information</Text>
                            {editing ? (
                                <View className="flex-row">
                                    <TouchableOpacity
                                        onPress={() => {
                                            setEditing(false);
                                            setBasic({ name: user?.name || '', username: user?.username || '' });
                                        }}
                                        className="w-12 h-12 bg-gray-800/50 border border-gray-700/30 rounded-xl items-center justify-center mr-3 active:bg-gray-800/70"
                                        activeOpacity={0.9}
                                    >
                                        <X size={20} color="#9ca3af" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={saveBasic}
                                        disabled={saving}
                                        className="w-12 h-12 bg-orange-600 rounded-xl items-center justify-center active:bg-orange-700"
                                        activeOpacity={0.9}
                                    >
                                        {saving ? (
                                            <ActivityIndicator size="small" color="#ffffff" />
                                        ) : (
                                            <Save size={20} color="#ffffff" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => setEditing(true)}
                                    className="w-12 h-12 bg-gray-800/50 border border-gray-700/30 rounded-xl items-center justify-center active:bg-gray-800/70"
                                    activeOpacity={0.9}
                                >
                                    <Edit3 size={20} color="#ea580c" />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View>
                            <Text className="text-gray-400 text-sm font-medium mb-4">Full Name</Text>
                            <View className="relative mb-5">
                                <User size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }} />
                                <TextInput
                                    value={editing ? basic.name : user?.name || ''}
                                    onChangeText={(text) => setBasic({ ...basic, name: text })}
                                    editable={editing}
                                    placeholder="Enter your name"
                                    placeholderTextColor="#6b7280"
                                    className={`pl-12 pr-5 py-4 text-white text-base rounded-xl border ${editing
                                        ? 'border-orange-600/50 bg-gray-900/70'
                                        : 'border-gray-700/30 bg-gray-900/50'
                                        }`}
                                />
                            </View>

                            <Text className="text-gray-400 text-sm font-medium mb-4">@Username</Text>
                            <View className="relative">
                                <Users size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }} />
                                <TextInput
                                    value={editing ? basic.username : user?.username || ''}
                                    onChangeText={(text) => setBasic({ ...basic, username: text })}
                                    editable={editing}
                                    placeholder="Enter username"
                                    placeholderTextColor="#6b7280"
                                    className={`pl-12 pr-5 py-4 text-white text-base rounded-xl border ${editing
                                        ? 'border-orange-600/50 bg-gray-900/70'
                                        : 'border-gray-700/30 bg-gray-900/50'
                                        }`}
                                />
                            </View>
                            <Text className="text-xs text-gray-500 mt-3">Must be unique and at least 3 characters</Text>
                        </View>
                    </View>

                    {/* Security */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <Text className="text-xl font-bold text-white mb-5">Security</Text>

                        <View>
                            <Text className="text-gray-400 text-sm font-medium mb-4">Current Password</Text>
                            <View className="relative mb-5">
                                <Lock size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }} />
                                <TextInput
                                    value={pwd.current}
                                    onChangeText={(text) => setPwd({ ...pwd, current: text })}
                                    secureTextEntry={!pwd.showCurrent}
                                    placeholder="Enter current password"
                                    placeholderTextColor="#6b7280"
                                    className="pl-12 pr-12 py-4 text-white text-base bg-gray-900/70 border border-gray-700/30 rounded-xl"
                                />
                                <TouchableOpacity
                                    onPress={() => setPwd({ ...pwd, showCurrent: !pwd.showCurrent })}
                                    className="absolute right-5 top-5"
                                >
                                    {pwd.showCurrent ? (
                                        <EyeOff size={20} color="#9ca3af" />
                                    ) : (
                                        <Eye size={20} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text className="text-gray-400 text-sm font-medium mb-4">New Password</Text>
                            <View className="relative mb-5">
                                <Lock size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }} />
                                <TextInput
                                    value={pwd.next}
                                    onChangeText={(text) => setPwd({ ...pwd, next: text })}
                                    secureTextEntry={!pwd.showNext}
                                    placeholder="Enter new password (min 8 chars)"
                                    placeholderTextColor="#6b7280"
                                    className="pl-12 pr-12 py-4 text-white text-base bg-gray-900/70 border border-gray-700/30 rounded-xl"
                                />
                                <TouchableOpacity
                                    onPress={() => setPwd({ ...pwd, showNext: !pwd.showNext })}
                                    className="absolute right-5 top-5"
                                >
                                    {pwd.showNext ? (
                                        <EyeOff size={20} color="#9ca3af" />
                                    ) : (
                                        <Eye size={20} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Text className="text-gray-400 text-sm font-medium mb-4">Confirm Password</Text>
                            <View className="relative mb-5">
                                <Lock size={20} color="#9ca3af" style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }} />
                                <TextInput
                                    value={pwd.confirm}
                                    onChangeText={(text) => setPwd({ ...pwd, confirm: text })}
                                    secureTextEntry={!pwd.showConfirm}
                                    placeholder="Confirm new password"
                                    placeholderTextColor="#6b7280"
                                    className="pl-12 pr-12 py-4 text-white text-base bg-gray-900/70 border border-gray-700/30 rounded-xl"
                                />
                                <TouchableOpacity
                                    onPress={() => setPwd({ ...pwd, showConfirm: !pwd.showConfirm })}
                                    className="absolute right-5 top-5"
                                >
                                    {pwd.showConfirm ? (
                                        <EyeOff size={20} color="#9ca3af" />
                                    ) : (
                                        <Eye size={20} color="#9ca3af" />
                                    )}
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                onPress={changePassword}
                                disabled={changingPassword}
                                className={`w-full py-5 rounded-xl flex-row items-center justify-center ${changingPassword
                                    ? 'bg-gray-700/50'
                                    : 'bg-orange-600 active:bg-orange-700'
                                    }`}
                                activeOpacity={0.9}
                            >
                                {changingPassword ? (
                                    <>
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text className="text-white font-bold text-lg ml-3">Updating...</Text>
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw size={20} color="#ffffff" />
                                        <Text className="text-white font-bold text-lg ml-3">Update Password</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Account Info */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6">
                        <Text className="text-xl font-bold text-white mb-5">Account Info</Text>
                        <View>
                            <View className="flex-row items-center justify-between py-5 border-b border-gray-700/30 mb-5">
                                <View className="flex-row items-center">
                                    <Mail size={20} color="#9ca3af" />
                                    <Text className="text-gray-400 text-sm font-medium ml-4">Email</Text>
                                </View>
                                <Text className="text-lg font-semibold text-white">{user?.email}</Text>
                            </View>
                            <View className="flex-row items-center justify-between py-5 border-b border-gray-700/30 mb-5">
                                <View className="flex-row items-center">
                                    <Calendar size={20} color="#9ca3af" />
                                    <Text className="text-gray-400 text-sm font-medium ml-4">Member Since</Text>
                                </View>
                                <Text className="text-lg font-semibold text-white">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </Text>
                            </View>
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center">
                                    <ShieldCheck size={20} color="#9ca3af" />
                                    <Text className="text-gray-400 text-sm font-medium ml-4">Status</Text>
                                </View>
                                <View className={`px-5 py-3 rounded-xl ${user?.status === 'active'
                                    ? 'bg-green-500/20 border border-green-500/40'
                                    : 'bg-gray-700/50 border border-gray-600'
                                    }`}>
                                    <Text className={`font-semibold ${user?.status === 'active' ? 'text-green-400' : 'text-gray-400'
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
