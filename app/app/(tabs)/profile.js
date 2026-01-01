import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import api from "@/services/api";
import {
    User,
    Mail,
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
    CheckCircle,
    AlertCircle,
    Send,
    History,
    Package,
    Badge,
    Users,
    ChevronRight,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";

/* ---------- Small UI Primitives ---------- */

const Section = ({ title, children }) => (
    <View className="mx-4 mb-8">
        <Text className="text-lg font-bold text-gray-300 mb-4 px-1">{title}</Text>
        <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden">
            {children}
        </View>
    </View>
);

const Card = ({ children }) => (
    <View className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 mb-4">
        {children}
    </View>
);

const AlertBox = ({ type, text, onClose }) => (
    <View
        className={`mx-4 mb-4 p-4 rounded-2xl border flex-row ${type === "error"
            ? "bg-red-500/10 border-red-500/30"
            : "bg-green-500/10 border-green-500/30"
            }`}
    >
        {type === "error" ? (
            <AlertCircle size={20} color="#ef4444" />
        ) : (
            <CheckCircle size={20} color="#22c55e" />
        )}
        <Text className="text-sm text-white ml-3 flex-1">{text}</Text>
        <TouchableOpacity onPress={onClose}>
            <X size={18} color="#9ca3af" />
        </TouchableOpacity>
    </View>
);

const RowItem = ({ icon: Icon, label, value, right }) => (
    <View className="flex-row items-center justify-between py-3">
        <View className="flex-row items-center">
            <Icon size={18} color="#9ca3af" />
            <Text className="text-gray-400 ml-4">{label}</Text>
        </View>
        {right || <Text className="text-white font-semibold">{value}</Text>}
    </View>
);

const QuickAction = ({ icon: Icon, label, onPress, last }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`flex-row items-center justify-between px-5 py-4 ${!last ? "border-b border-gray-700/50" : ""
            }`}
        activeOpacity={0.85}
    >
        <View className="flex-row items-center">
            <View className="w-12 h-12 bg-orange-500/20 border border-orange-500/40 rounded-xl items-center justify-center mr-4">
                <Icon size={20} color="#ea580c" />
            </View>
            <Text className="text-white font-semibold">{label}</Text>
        </View>
        <ChevronRight size={18} color="#9ca3af" />
    </TouchableOpacity>
);

/* ---------- Main Screen ---------- */

const Profile = () => {
    const router = useRouter();
    const { user, updateUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPwd, setChangingPwd] = useState(false);
    const [editing, setEditing] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [basic, setBasic] = useState({ name: "", username: "" });
    const [pwd, setPwd] = useState({
        current: "",
        next: "",
        confirm: "",
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
            const res = await api.get("/profile");
            setBasic({
                name: res.data.name || "",
                username: res.data.username || "",
            });
        } catch (e) {
            setError(e.response?.data?.message || "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const saveProfile = async () => {
        if (!basic.name.trim() || !basic.username.trim()) {
            setError("Name and username are required");
            return;
        }
        setSaving(true);
        try {
            const res = await api.put("/profile/update", {
                name: basic.name.trim(),
                username: basic.username.trim(),
            });
            updateUser?.(res.data.user);
            setSuccess("Profile updated");
            setEditing(false);
        } catch (e) {
            setError(e.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const updatePassword = async () => {
        if (!pwd.current || !pwd.next || !pwd.confirm) {
            setError("Fill all password fields");
            return;
        }
        if (pwd.next.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (pwd.next !== pwd.confirm) {
            setError("Passwords do not match");
            return;
        }

        setChangingPwd(true);
        try {
            await api.put("/profile/update", {
                changePassword: {
                    currentPassword: pwd.current,
                    newPassword: pwd.next,
                },
            });
            setSuccess("Password updated");
            setPwd({
                current: "",
                next: "",
                confirm: "",
                showCurrent: false,
                showNext: false,
                showConfirm: false,
            });
        } catch (e) {
            setError(e.response?.data?.message || "Password update failed");
        } finally {
            setChangingPwd(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#ea580c" />
                <Text className="text-gray-400 mt-4">Loading profile…</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <Text className="text-2xl font-bold text-white">Profile</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="py-6">

                    {error && <AlertBox type="error" text={error} onClose={() => setError("")} />}
                    {success && <AlertBox type="success" text={success} onClose={() => setSuccess("")} />}

                    {/* Identity */}
                    <View className="mx-4 mb-8 items-center">
                        <View className="w-24 h-24 bg-orange-500/20 border border-orange-500/40 rounded-2xl items-center justify-center mb-4">
                            <User size={44} color="#ea580c" />
                        </View>
                        <Text className="text-2xl font-bold text-white">
                            {basic.name || user?.name}
                        </Text>
                        <Text className="text-gray-400 text-base">
                            @{basic.username || user?.username}
                        </Text>
                    </View>

                    {/* Wallet */}
                    <Section title="Balances">
                        <View className="p-5">
                            <RowItem
                                icon={Wallet}
                                label="Wallet Balance"
                                value={`$${user?.walletBalance?.toFixed(2) || "0.00"}`}
                            />
                            <RowItem
                                icon={TrendingUp}
                                label="Total Deposits"
                                value={`$${user?.financials?.totalDeposits?.toFixed(2) || "0.00"}`}
                            />
                        </View>
                    </Section>

                    {/* Quick Actions */}
                    <Section title="Quick Actions">
                        <QuickAction icon={Send} label="Transfer Funds" onPress={() => router.push("/transfer")} />
                        <QuickAction icon={History} label="Transaction History" onPress={() => router.push("/transaction-history")} />
                        <QuickAction icon={Package} label="My Orders" onPress={() => router.push("/orders")} />
                        <QuickAction icon={Badge} label="Broker Selection" onPress={() => router.push("/broker-selection")} last />
                    </Section>

                    {/* Edit Profile */}
                    <Section title="Basic Information">
                        <View className="p-5">
                            <View className="flex-row justify-between items-center mb-5">
                                <Text className="text-white font-bold text-lg">Profile Details</Text>
                                {editing ? (
                                    <View className="flex-row">
                                        <TouchableOpacity
                                            onPress={() => {
                                                setEditing(false);
                                                setBasic({ name: user?.name, username: user?.username });
                                            }}
                                            className="w-10 h-10 bg-gray-800 rounded-xl items-center justify-center mr-3"
                                        >
                                            <X size={18} color="#9ca3af" />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={saveProfile}
                                            className="w-10 h-10 bg-orange-500 rounded-xl items-center justify-center"
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="#fff" />
                                            ) : (
                                                <Save size={18} color="#fff" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => setEditing(true)}
                                        className="w-10 h-10 bg-gray-800 rounded-xl items-center justify-center"
                                    >
                                        <Edit3 size={18} color="#ea580c" />
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TextInput
                                editable={editing}
                                value={editing ? basic.name : user?.name}
                                onChangeText={(t) => setBasic({ ...basic, name: t })}
                                placeholder="Name"
                                placeholderTextColor="#6b7280"
                                className={`mb-4 px-4 py-4 rounded-xl border ${editing
                                    ? "bg-gray-900 border-orange-500/50"
                                    : "bg-gray-900/50 border-gray-700/50"
                                    } text-white`}
                            />

                            <TextInput
                                editable={editing}
                                value={editing ? basic.username : user?.username}
                                onChangeText={(t) => setBasic({ ...basic, username: t })}
                                placeholder="Username"
                                placeholderTextColor="#6b7280"
                                className={`px-4 py-4 rounded-xl border ${editing
                                    ? "bg-gray-900 border-orange-500/50"
                                    : "bg-gray-900/50 border-gray-700/50"
                                    } text-white`}
                            />
                        </View>
                    </Section>

                    {/* Security */}
                    <Section title="Security">
                        <View className="p-5">
                            {["current", "next", "confirm"].map((k) => {
                                const showKey = `show${k[0].toUpperCase()}${k.slice(1)}`;
                                return (
                                    <View key={k} className="relative mb-4">
                                        <Lock
                                            size={18}
                                            color="#fff"
                                            style={{
                                                position: 'absolute',
                                                left: 16,
                                                top: 16,  // Changed from 18 to 16 for better centering with py-4
                                                zIndex: 1
                                            }}
                                        />
                                        <TextInput
                                            secureTextEntry={!pwd[showKey]}
                                            value={pwd[k]}
                                            onChangeText={(t) => setPwd({ ...pwd, [k]: t })}
                                            placeholder={
                                                k === "current" ? "Current password" :
                                                    k === "next" ? "New password" : "Confirm password"
                                            }
                                            placeholderTextColor="#6b7280"
                                            className="pl-12 pr-12 py-4 bg-gray-900 border border-gray-700/50 rounded-xl text-white"
                                            style={{ paddingLeft: 48 }}  // Extra padding to avoid overlap
                                        />
                                        <TouchableOpacity
                                            onPress={() => setPwd({ ...pwd, [showKey]: !pwd[showKey] })}
                                            className="absolute right-5 top-5"
                                            style={{ zIndex: 2 }}  // Ensure eye button is above
                                        >
                                            {pwd[showKey] ? (
                                                <EyeOff size={18} color="#9ca3af" />
                                            ) : (
                                                <Eye size={18} color="#9ca3af" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}

                            <TouchableOpacity
                                onPress={updatePassword}
                                disabled={changingPwd}
                                className={`py-4 rounded-xl flex-row items-center justify-center ${changingPwd ? "bg-gray-700" : "bg-orange-500"
                                    }`}
                            >
                                {changingPwd ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <>
                                        <RefreshCw size={18} color="#fff" />
                                        <Text className="text-white font-bold ml-3">
                                            Update Password
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </Section>

                    {/* Account Info */}
                    <Section title="Account Info">
                        <View className="p-5">
                            <RowItem icon={Mail} label="Email" value={user?.email} />
                            <RowItem
                                icon={Calendar}
                                label="Member Since"
                                value={
                                    user?.createdAt
                                        ? new Date(user.createdAt).toLocaleDateString()
                                        : "—"
                                }
                            />
                        </View>
                    </Section>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Profile;
