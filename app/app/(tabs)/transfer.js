import React, { useState } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    FlatList,
} from "react-native";
import { useAuth } from "@/context/authContext";
import api from "@/services/api";
import {
    Send,
    DollarSign,
    User,
    CheckCircle,
    AlertCircle,
    X,
} from "lucide-react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";

/* ---------- UI Primitives ---------- */

const Section = ({ title, children }) => (
    <View className="mx-4 mb-6">
        <Text className="text-lg font-light text-white mb-4">
            {title}
        </Text>
        {children}
    </View>
);

const Card = ({ children }) => (
    <View className="bg-gray-800/40 border border-gray-700/40 rounded-2xl p-5">
        {children}
    </View>
);

const AlertBox = ({ text, onClose }) => (
    <View className="mb-4 p-4 bg-red-500/15 border border-red-500/30 rounded-xl flex-row items-start">
        <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
        <Text className="text-red-400 text-sm flex-1">{text}</Text>
        <TouchableOpacity onPress={onClose}>
            <X size={18} color="#ef4444" />
        </TouchableOpacity>
    </View>
);

/* ---------- Screen ---------- */

const Transfer = () => {
    const router = useRouter();
    const { user, checkAuth } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [amount, setAmount] = useState("");
    const [receiverIdentifier, setReceiverIdentifier] = useState("");
    const [note, setNote] = useState("");
    const [amountError, setAmountError] = useState("");

    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [transferResult, setTransferResult] = useState(null);

    /* ---------- Logic (UNCHANGED) ---------- */

    const validateAmount = (val) => {
        const num = parseFloat(val);
        if (!val || isNaN(num) || num <= 0) {
            setAmountError("Please enter a valid amount");
            return false;
        }
        if (num < 1) {
            setAmountError("Minimum transfer is $1");
            return false;
        }
        if (num > (user?.walletBalance || 0)) {
            setAmountError(
                `Insufficient balance. Available: $${(user?.walletBalance || 0).toFixed(2)}`
            );
            return false;
        }
        setAmountError("");
        return true;
    };

    const handleAmountChange = (val) => {
        setAmount(val);
        setTimeout(() => {
            if (val) validateAmount(val);
            else setAmountError("");
        }, 0);
    };

    const handleQuickAmount = (val) => {
        const str = val.toString();
        setAmount(str);
        setAmountError("");
        setTimeout(() => validateAmount(str), 50);
    };

    const handleSearchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await api.get(
                `/transfer/search/users?query=${encodeURIComponent(query)}`
            );
            if (res.data.success) setSearchResults(res.data.data);
        } catch { }
        finally {
            setSearching(false);
        }
    };

    const handleReceiverChange = (val) => {
        setReceiverIdentifier(val);
        setError(null);
        handleSearchUsers(val);
    };

    const selectUser = (u) => {
        setReceiverIdentifier(u.username);
        setSearchResults([]);
    };

    const handleTransfer = async () => {
        if (!validateAmount(amount)) return;
        if (!receiverIdentifier.trim()) {
            setError("Please enter receiver username or email");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.post("/transfer/create", {
                amount: parseFloat(amount),
                receiverIdentifier: receiverIdentifier.trim(),
                note: note.trim(),
            });

            if (res.data.success) {
                setTransferResult(res.data.data);
                setSuccess(true);
                await checkAuth();
            } else {
                setError(res.data.message || "Transfer failed");
            }
        } catch (e) {
            setError(e.response?.data?.message || "Failed to process transfer");
        } finally {
            setLoading(false);
        }
    };

    const resetTransfer = () => {
        setSuccess(false);
        setTransferResult(null);
        setAmount("");
        setReceiverIdentifier("");
        setNote("");
        setError(null);
        setSearchResults([]);
    };

    /* ---------- Success ---------- */

    if (success && transferResult) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                    <Text className="text-2xl font-bold text-white">
                        Transfer Successful
                    </Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="py-6 pb-24">
                        <View className="mx-4 mb-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 items-center">
                            <View className="w-16 h-16 bg-green-500/20 rounded-xl items-center justify-center mb-4">
                                <CheckCircle size={28} color="#22c55e" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2">
                                Transfer Complete
                            </Text>
                            <Text className="text-green-400 text-sm">
                                ${transferResult.amount.toFixed(2)} to @{transferResult.receiver.username}
                            </Text>
                        </View>

                        <Card>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-gray-400 text-sm">Amount</Text>
                                <Text className="text-white font-bold text-lg">
                                    ${transferResult.amount.toFixed(2)}
                                </Text>
                            </View>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-gray-400 text-sm">Recipient</Text>
                                <Text className="text-blue-400 font-semibold">
                                    @{transferResult.receiver.username}
                                </Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-400 text-sm">New Balance</Text>
                                <Text className="text-green-400 font-bold text-lg">
                                    ${transferResult.newBalance.toFixed(2)}
                                </Text>
                            </View>
                        </Card>

                        <View className="mx-4 mt-6">
                            <TouchableOpacity
                                onPress={() => router.push("/(tabs)/dashboard")}
                                className="bg-orange-600 rounded-xl py-4 items-center mb-3"
                            >
                                <Text className="text-white font-bold">
                                    Go to Dashboard
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={resetTransfer}
                                className="border border-gray-700 rounded-xl py-4 items-center"
                            >
                                <Text className="text-gray-300 font-bold">
                                    Make Another Transfer
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    /* ---------- Form ---------- */

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <Text className="text-2xl font-bold text-white">Transfer Funds</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="py-6 pb-24">
                        {user && (
                            <View className="mx-4 mb-6 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
                                <Text className="text-gray-400 text-sm mb-1">
                                    Available Balance
                                </Text>
                                <Text className="text-2xl font-bold text-orange-400">
                                    ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {error && (
                            <View className="mx-4">
                                <AlertBox text={error} onClose={() => setError(null)} />
                            </View>
                        )}

                        <Section title="Recipient">
                            <Card>
                                <View className="relative mb-4">
                                    <User
                                        size={18}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 16,
                                            top: 16,
                                            zIndex: 1
                                        }}
                                    />
                                    {searching && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ea580c"
                                            style={{
                                                position: 'absolute',
                                                right: 16,
                                                top: 16,
                                                zIndex: 2
                                            }}
                                        />
                                    )}
                                    <TextInput
                                        value={receiverIdentifier}
                                        onChangeText={handleReceiverChange}
                                        placeholder="Username or email"
                                        placeholderTextColor="#6b7280"
                                        className="pl-12 pr-12 py-4 text-white bg-gray-900 border border-gray-700/40 rounded-xl"
                                    />
                                </View>


                                {searchResults.length > 0 && (
                                    <View className="bg-gray-900/80 border border-gray-700/50 rounded-xl overflow-hidden">
                                        <FlatList
                                            data={searchResults}
                                            keyExtractor={(i) => i.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    onPress={() => selectUser(item)}
                                                    className="p-4 border-b border-gray-700/40"
                                                >
                                                    <Text className="text-white font-semibold mb-1">
                                                        {item.name}
                                                    </Text>
                                                    <Text className="text-blue-400 font-semibold">
                                                        @{item.username}
                                                    </Text>
                                                    <Text className="text-gray-500 text-xs">
                                                        {item.email}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                )}
                            </Card>
                        </Section>

                        <Section title="Amount">
                            <Card>
                                <View className="relative mb-2">
                                    <DollarSign
                                        size={18}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 16,
                                            top: 16,
                                            zIndex: 1
                                        }}
                                    />
                                    <TextInput
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        placeholder="Enter amount"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="decimal-pad"
                                        className="pl-12 pr-4 py-4 text-white bg-gray-900 border rounded-xl"
                                        style={{
                                            borderColor: amountError ? "#ef4444" : "#374151",
                                        }}
                                    />
                                </View>

                                {amountError && (
                                    <Text className="text-xs text-red-400 mt-2">
                                        {amountError}
                                    </Text>
                                )}

                                <View className="flex-row flex-wrap mt-4">
                                    {[10, 50, 100, 500, 1000].map(v => (
                                        <TouchableOpacity
                                            key={v}
                                            onPress={() => handleQuickAmount(v)}
                                            className={`px-4 py-2 mr-2 mb-2 rounded-xl border ${parseFloat(amount) === v
                                                ? "border-orange-500 bg-orange-500/10"
                                                : "border-gray-700/40"
                                                }`}
                                        >
                                            <Text className={`font-semibold ${parseFloat(amount) === v
                                                ? "text-orange-400"
                                                : "text-gray-400"
                                                }`}>
                                                ${v}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </Card>
                        </Section>

                        <Section title="Note (Optional)">
                            <Card>
                                <TextInput
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Add a note…"
                                    placeholderTextColor="#6b7280"
                                    multiline
                                    numberOfLines={4}
                                    maxLength={200}
                                    className="text-white bg-gray-900 border border-gray-700/40 rounded-xl p-4"
                                    style={{ textAlignVertical: "top" }}
                                />
                                <Text className="text-xs text-gray-500 mt-2 text-right">
                                    {note.length}/200
                                </Text>
                            </Card>
                        </Section>

                        <TouchableOpacity
                            onPress={handleTransfer}
                            disabled={loading || !amount || !!amountError || !receiverIdentifier.trim()}
                            className={`mx-4 rounded-xl py-4 items-center ${loading || !amount || !!amountError || !receiverIdentifier.trim()
                                ? "bg-gray-700/50"
                                : "bg-orange-600"
                                }`}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <View className="flex-row items-center">
                                    <Send size={18} color="#fff" />
                                    <Text className="text-white font-bold ml-3">
                                        Transfer Money
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Transfer;
