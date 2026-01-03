import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    User,
    Mail,
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
    CheckCircle,
    AlertCircle,
    Send,
    History,
    Package,
    Badge,
    ChevronRight,
    ArrowLeft,
    DollarSign,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

// Import Components
import TabButton from '@/components/TabButton';

const Profile = () => {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);
    const [editing, setEditing] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [activeTab, setActiveTab] = useState('overview');

    const [basic, setBasic] = useState({ name: '', username: '' });
    const [pwd, setPwd] = useState({
        current: '',
        next: '',
        confirm: '',
        showCurrent: false,
        showNext: false,
        showConfirm: false,
    });

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        try {
            const res = await api.get('/profile');
            setBasic({
                name: res.data.name || '',
                username: res.data.username || '',
            });
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!basic.name.trim() || !basic.username.trim()) {
            setError('Name and username are required');
            return;
        }
        setSaving(true);
        try {
            const res = await api.put('/profile/update', {
                name: basic.name.trim(),
                username: basic.username.trim(),
            });
            updateUser?.(res.data.user);
            setSuccess('Profile updated');
            setEditing(false);
        } catch (e) {
            setError(e.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const updatePassword = async () => {
        if (!pwd.current || !pwd.next || !pwd.confirm) {
            setError('Fill all password fields');
            return;
        }
        if (pwd.next.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }
        if (pwd.next !== pwd.confirm) {
            setError('Passwords do not match');
            return;
        }

        setChangingPwd(true);
        try {
            await api.put('/profile/update', {
                changePassword: {
                    currentPassword: pwd.current,
                    newPassword: pwd.next,
                },
            });
            setSuccess('Password updated');
            setPwd({
                current: '',
                next: '',
                confirm: '',
                showCurrent: false,
                showNext: false,
                showConfirm: false,
            });
        } catch (e) {
            setError(e.response?.data?.message || 'Password update failed');
        } finally {
            setChangingPwd(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview' },
        { id: 'edit', label: 'Edit Profile' },
        { id: 'security', label: 'Security' },
    ];

    const QuickActionButton = ({ icon: Icon, label, onPress, bgColor }) => (
        <TouchableOpacity
            onPress={onPress}
            className="bg-neutral-900/40 rounded-2xl p-5 border border-neutral-800 mb-3"
            activeOpacity={0.7}
        >
            <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                    <View
                        className={`w-12 h-12 rounded-xl items-center justify-center mr-4`}
                        style={{ backgroundColor: bgColor }}
                    >
                        <Icon size={20} color="#fff" />
                    </View>
                    <Text className="text-white font-semibold text-base">{label}</Text>
                </View>
                <ChevronRight size={20} color="#9ca3af" />
            </View>
        </TouchableOpacity>
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

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-neutral-400 mt-4 font-medium">Loading profile...</Text>
            </SafeAreaView>
        );
    }

    const renderOverview = () => (
        <View className="px-5">
            {/* Profile Header */}
            <View className="items-center mb-6">
                <View className="w-24 h-24 bg-orange-500/15 rounded-2xl items-center justify-center mb-4">
                    <User size={44} color="#ea580c" />
                </View>
                <Text className="text-2xl font-bold text-white mb-1">{user?.name}</Text>
                <Text className="text-neutral-400 text-base">@{user?.username}</Text>
            </View>

            {/* Balance Cards */}
            <View className="bg-neutral-900/50 rounded-2xl p-5 mb-6">
                <Text className="text-lg font-bold text-white mb-5">Wallet Overview</Text>
                <View className="bg-black/40 rounded-2xl p-5 mb-3">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-green-500/15 rounded-xl items-center justify-center mr-3">
                                <Wallet size={18} color="#22c55e" />
                            </View>
                            <Text className="text-neutral-400 text-sm">Wallet Balance</Text>
                        </View>
                        <Text className="text-white font-bold text-xl">
                            ${user?.walletBalance?.toFixed(2) || '0.00'}
                        </Text>
                    </View>
                </View>
                <View className="bg-black/40 rounded-2xl p-5">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-500/15 rounded-xl items-center justify-center mr-3">
                                <TrendingUp size={18} color="#3b82f6" />
                            </View>
                            <Text className="text-neutral-400 text-sm">Total Deposits</Text>
                        </View>
                        <Text className="text-white font-bold text-xl">
                            ${user?.financials?.totalDeposits?.toFixed(2) || '0.00'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View className="bg-neutral-900/50 rounded-2xl p-5 mb-6">
                <Text className="text-lg font-bold text-white mb-5">Quick Actions</Text>
                <QuickActionButton
                    icon={Send}
                    label="Transfer Funds"
                    onPress={() => router.push('/transfer')}
                    bgColor="#ea580c"
                />
                <QuickActionButton
                    icon={History}
                    label="Transaction History"
                    onPress={() => router.push('/transaction-history')}
                    bgColor="#3b82f6"
                />
                <QuickActionButton
                    icon={Package}
                    label="My Orders"
                    onPress={() => router.push('/orders')}
                    bgColor="#8b5cf6"
                />
                <QuickActionButton
                    icon={Badge}
                    label="Broker Selection"
                    onPress={() => router.push('/broker-selection')}
                    bgColor="#22c55e"
                />
            </View>

            {/* Account Info */}
            <View className="bg-neutral-900/50 rounded-2xl p-5">
                <Text className="text-lg font-bold text-white mb-5">Account Information</Text>
                <InfoRow icon={Mail} label="Email" value={user?.email || '—'} />
                <View className="flex-row items-center justify-between py-4">
                    <View className="flex-row items-center flex-1">
                        <Calendar size={18} color="#9ca3af" style={{ marginRight: 12 }} />
                        <Text className="text-neutral-400 text-sm">Member Since</Text>
                    </View>
                    <Text className="text-white font-semibold text-sm">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderEditProfile = () => (
        <View className="px-5">
            <View className="bg-neutral-900/50 rounded-2xl p-5">
                <View className="flex-row justify-between items-center mb-5">
                    <Text className="text-lg font-bold text-white">Profile Details</Text>
                    {editing ? (
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => {
                                    setEditing(false);
                                    setBasic({ name: user?.name, username: user?.username });
                                }}
                                className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center"
                                activeOpacity={0.7}
                            >
                                <X size={18} color="#9ca3af" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={saveProfile}
                                className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center"
                                activeOpacity={0.7}
                            >
                                {saving ? <ActivityIndicator color="#fff" size="small" /> : <Save size={18} color="#fff" />}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setEditing(true)}
                            className="w-10 h-10 bg-neutral-800 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <Edit3 size={18} color="#ea580c" />
                        </TouchableOpacity>
                    )}
                </View>

                <View className="mb-4">
                    <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                        Full Name
                    </Text>
                    <TextInput
                        editable={editing}
                        value={editing ? basic.name : user?.name}
                        onChangeText={(t) => setBasic({ ...basic, name: t })}
                        placeholder="Name"
                        placeholderTextColor="#6b7280"
                        className={`px-4 py-4 rounded-2xl border-2 text-white text-base ${editing ? 'bg-black/40 border-orange-500' : 'bg-black/40 border-neutral-800'
                            }`}
                    />
                </View>

                <View>
                    <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                        Username
                    </Text>
                    <TextInput
                        editable={editing}
                        value={editing ? basic.username : user?.username}
                        onChangeText={(t) => setBasic({ ...basic, username: t })}
                        placeholder="Username"
                        placeholderTextColor="#6b7280"
                        className={`px-4 py-4 rounded-2xl border-2 text-white text-base ${editing ? 'bg-black/40 border-orange-500' : 'bg-black/40 border-neutral-800'
                            }`}
                    />
                </View>
            </View>
        </View>
    );

    const renderSecurity = () => (
        <View className="px-5">
            <View className="bg-neutral-900/50 rounded-2xl p-5">
                <Text className="text-lg font-bold text-white mb-5">Change Password</Text>

                {['current', 'next', 'confirm'].map((k) => {
                    const showKey = `show${k[0].toUpperCase()}${k.slice(1)}`;
                    return (
                        <View key={k} className="mb-4">
                            <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                {k === 'current' ? 'Current Password' : k === 'next' ? 'New Password' : 'Confirm Password'}
                            </Text>
                            <View className="relative">
                                <Lock
                                    size={20}
                                    color="#9ca3af"
                                    style={{
                                        position: 'absolute',
                                        left: 16,
                                        top: 16,
                                        zIndex: 1,
                                    }}
                                />
                                <TextInput
                                    secureTextEntry={!pwd[showKey]}
                                    value={pwd[k]}
                                    onChangeText={(t) => setPwd({ ...pwd, [k]: t })}
                                    placeholder={
                                        k === 'current'
                                            ? 'Enter current password'
                                            : k === 'next'
                                                ? 'Enter new password'
                                                : 'Confirm new password'
                                    }
                                    placeholderTextColor="#6b7280"
                                    className="pl-12 pr-12 py-4 bg-black/40 border-2 border-neutral-800 rounded-2xl text-white text-base"
                                />
                                <TouchableOpacity
                                    onPress={() => setPwd({ ...pwd, [showKey]: !pwd[showKey] })}
                                    className="absolute right-4 top-4"
                                    style={{ zIndex: 2 }}
                                    activeOpacity={0.7}
                                >
                                    {pwd[showKey] ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                <TouchableOpacity
                    onPress={updatePassword}
                    disabled={changingPwd}
                    className={`py-5 rounded-2xl flex-row items-center justify-center mt-2 ${changingPwd ? 'bg-neutral-800/50' : 'bg-orange-500'
                        }`}
                    activeOpacity={0.7}
                >
                    {changingPwd ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <RefreshCw size={18} color="#fff" />
                            <Text className="text-white font-bold ml-3 text-base">Update Password</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

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
                            <Text className="text-2xl font-bold text-white">Profile</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Manage your account</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Error/Success Alerts */}
            {error && (
                <View className="mx-5 mt-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex-row items-center">
                    <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                    <Text className="text-red-400 text-sm flex-1">{error}</Text>
                    <TouchableOpacity onPress={() => setError('')}>
                        <X size={18} color="#ef4444" />
                    </TouchableOpacity>
                </View>
            )}
            {success && (
                <View className="mx-5 mt-5 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex-row items-center">
                    <CheckCircle size={20} color="#22c55e" style={{ marginRight: 12 }} />
                    <Text className="text-green-400 text-sm flex-1">{success}</Text>
                    <TouchableOpacity onPress={() => setSuccess('')}>
                        <X size={18} color="#22c55e" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Tabs */}
            <View className="border-b border-neutral-800 mt-5">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 20 }}
                >
                    {tabs.map((tab) => (
                        <TabButton
                            key={tab.id}
                            label={tab.label}
                            active={activeTab === tab.id}
                            onPress={() => setActiveTab(tab.id)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 20, paddingBottom: 100 }}
            >
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'edit' && renderEditProfile()}
                {activeTab === 'security' && renderSecurity()}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
