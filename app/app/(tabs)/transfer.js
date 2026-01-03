import React, { useState } from 'react';
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
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    Send,
    DollarSign,
    User,
    CheckCircle,
    AlertCircle,
    X,
    ArrowLeft,
    Wallet,
    ArrowLeftRight,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// Import Components
import QuickAmountButton from '@/components/QuickAmountButton';
import DetailRow from '@/components/DetailRow';

const Transfer = () => {
    const router = useRouter();
    const { user, checkAuth } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const [amount, setAmount] = useState('');
    const [receiverIdentifier, setReceiverIdentifier] = useState('');
    const [note, setNote] = useState('');
    const [amountError, setAmountError] = useState('');

    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [transferResult, setTransferResult] = useState(null);

    /* ---------- Logic ---------- */

    const validateAmount = (val) => {
        const num = parseFloat(val);
        if (!val || isNaN(num) || num <= 0) {
            setAmountError('Please enter a valid amount');
            return false;
        }
        if (num < 1) {
            setAmountError('Minimum transfer is $1');
            return false;
        }
        if (num > (user?.walletBalance || 0)) {
            setAmountError(`Insufficient balance. Available: $${(user?.walletBalance || 0).toFixed(2)}`);
            return false;
        }
        setAmountError('');
        return true;
    };

    const handleAmountChange = (val) => {
        setAmount(val);
        setTimeout(() => {
            if (val) validateAmount(val);
            else setAmountError('');
        }, 0);
    };

    const handleQuickAmount = (val) => {
        const str = val.toString();
        setAmount(str);
        setAmountError('');
        setTimeout(() => validateAmount(str), 50);
    };

    const handleSearchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        setSearching(true);
        try {
            const res = await api.get(`/transfer/search/users?query=${encodeURIComponent(query)}`);
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
            setError('Please enter receiver username or email');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.post('/transfer/create', {
                amount: parseFloat(amount),
                receiverIdentifier: receiverIdentifier.trim(),
                note: note.trim(),
            });

            if (res.data.success) {
                setTransferResult(res.data.data);
                setSuccess(true);
                await checkAuth();
            } else {
                setError(res.data.message || 'Transfer failed');
            }
        } catch (e) {
            setError(e.response?.data?.message || 'Failed to process transfer');
        } finally {
            setLoading(false);
        }
    };

    const resetTransfer = () => {
        setSuccess(false);
        setTransferResult(null);
        setAmount('');
        setReceiverIdentifier('');
        setNote('');
        setError(null);
        setSearchResults([]);
    };

    /* ---------- Success Screen ---------- */

    if (success && transferResult) {
        return (
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />

                {/* Header */}
                <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                    <View>
                        <Text className="text-2xl font-bold text-white">Transfer Complete</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">Money sent successfully</Text>
                    </View>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="px-5 pt-5 pb-24">
                        {/* Success Card */}
                        <View className="bg-neutral-900/50 rounded-2xl p-8 items-center mb-6">
                            <View className="w-20 h-20 bg-green-500/15 rounded-2xl items-center justify-center mb-5">
                                <CheckCircle size={48} color="#22c55e" />
                            </View>

                            <Text className="text-3xl font-bold text-white mb-3 text-center">
                                Transfer Successful!
                            </Text>

                            <Text className="text-neutral-400 text-base mb-7 text-center">
                                ${transferResult.amount.toFixed(2)} sent to @{transferResult.receiver.username}
                            </Text>

                            {/* Details Card */}
                            <View className="w-full bg-black/40 border border-neutral-800 rounded-2xl p-5 mb-6">
                                <DetailRow label="Amount" value={`$${transferResult.amount.toFixed(2)}`} />
                                <DetailRow
                                    label="Recipient"
                                    value={`@${transferResult.receiver.username}`}
                                    valueColor="text-blue-400"
                                />
                                <DetailRow
                                    label="New Balance"
                                    value={`$${transferResult.newBalance.toFixed(2)}`}
                                    valueColor="text-green-400"
                                />
                            </View>

                            {/* Action Buttons */}
                            <View className="w-full gap-3">
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)')}
                                    className="py-4 rounded-2xl items-center bg-orange-500"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold text-base">Go to Dashboard</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={resetTransfer}
                                    className="py-4 rounded-2xl items-center bg-neutral-800/50 border border-neutral-800"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-neutral-300 font-semibold text-base">Transfer Again</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    /* ---------- Form Screen ---------- */

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
                            <Text className="text-2xl font-bold text-white">Transfer</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Send money to users</Text>
                        </View>
                    </View>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="pb-24">
                        {/* Balance Card */}
                        {user && (
                            <View className="mx-5 mt-5 mb-6">
                                <View className="bg-neutral-900/50 rounded-2xl p-5">
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-12 h-12 bg-cyan-500/15 rounded-xl items-center justify-center mr-4">
                                                <Wallet size={22} color="#06b6d4" />
                                            </View>
                                            <View>
                                                <Text className="text-xs text-neutral-400 mb-1">Available Balance</Text>
                                                <Text className="text-2xl font-bold text-white">
                                                    ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                                </Text>
                                            </View>
                                        </View>
                                        <View className="w-10 h-10 bg-cyan-500/15 rounded-full items-center justify-center">
                                            <ArrowLeftRight size={18} color="#06b6d4" />
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <View className="mx-5 mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                                <View className="flex-row items-center">
                                    <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                                    <View className="flex-1">
                                        <Text className="text-red-400 text-sm font-medium">{error}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setError(null)} className="ml-2">
                                        <X size={18} color="#ef4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Recipient Section */}
                        <View className="px-5 mb-6">
                            <View className="bg-neutral-900/50 rounded-2xl p-5">
                                <Text className="text-lg font-bold text-white mb-5">Recipient</Text>

                                <View className="relative">
                                    <User
                                        size={20}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 16,
                                            top: 16,
                                            zIndex: 1,
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
                                                zIndex: 2,
                                            }}
                                        />
                                    )}
                                    <TextInput
                                        value={receiverIdentifier}
                                        onChangeText={handleReceiverChange}
                                        placeholder="Username or email"
                                        placeholderTextColor="#6b7280"
                                        className="pl-12 pr-12 py-4 text-base font-medium text-white bg-black/40 rounded-2xl border-2 border-neutral-800"
                                    />
                                </View>

                                {/* Search Results */}
                                {searchResults.length > 0 && (
                                    <View className="mt-4 bg-black/40 border border-neutral-800 rounded-2xl overflow-hidden">
                                        <FlatList
                                            data={searchResults}
                                            keyExtractor={(i) => i.id}
                                            renderItem={({ item }) => (
                                                <TouchableOpacity
                                                    onPress={() => selectUser(item)}
                                                    className="p-4 border-b border-neutral-800"
                                                    activeOpacity={0.7}
                                                >
                                                    <Text className="text-white font-semibold text-base mb-1">
                                                        {item.name}
                                                    </Text>
                                                    <Text className="text-blue-400 text-sm font-medium mb-1">
                                                        @{item.username}
                                                    </Text>
                                                    <Text className="text-neutral-500 text-xs">{item.email}</Text>
                                                </TouchableOpacity>
                                            )}
                                        />
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Amount Section */}
                        <View className="px-5 mb-6">
                            <View className="bg-neutral-900/50 rounded-2xl p-5">
                                <Text className="text-lg font-bold text-white mb-5">Enter Amount</Text>

                                <View className="relative mb-2">
                                    <DollarSign
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
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        placeholder="0.00"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="decimal-pad"
                                        className={`pl-12 pr-4 py-4 text-base font-medium text-white bg-black/40 rounded-2xl border-2 ${amountError ? 'border-red-500' : 'border-neutral-800'
                                            }`}
                                    />
                                </View>

                                {amountError && (
                                    <Text className="text-xs text-red-400 mb-3">{amountError}</Text>
                                )}

                                {/* Quick Amounts */}
                                <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
                                    Quick Select
                                </Text>
                                <View className="flex-row gap-2 mb-3">
                                    {[10, 50, 100, 500].map((quickAmount) => (
                                        <QuickAmountButton
                                            key={quickAmount}
                                            amount={quickAmount}
                                            isActive={parseFloat(amount) === quickAmount}
                                            onPress={() => handleQuickAmount(quickAmount)}
                                        />
                                    ))}
                                </View>
                                <View className="flex-row gap-2">
                                    <QuickAmountButton
                                        amount={1000}
                                        isActive={parseFloat(amount) === 1000}
                                        onPress={() => handleQuickAmount(1000)}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Note Section */}
                        <View className="px-5 mb-6">
                            <View className="bg-neutral-900/50 rounded-2xl p-5">
                                <Text className="text-lg font-bold text-white mb-5">Note (Optional)</Text>

                                <TextInput
                                    value={note}
                                    onChangeText={setNote}
                                    placeholder="Add a note..."
                                    placeholderTextColor="#6b7280"
                                    multiline
                                    numberOfLines={4}
                                    maxLength={200}
                                    className="text-white text-base bg-black/40 border border-neutral-800 rounded-2xl p-4 mb-2"
                                    style={{ textAlignVertical: 'top' }}
                                />
                                <Text className="text-xs text-neutral-500 text-right">{note.length}/200</Text>
                            </View>
                        </View>

                        {/* Submit Button */}
                        <View className="px-5">
                            <TouchableOpacity
                                onPress={handleTransfer}
                                disabled={
                                    loading || !amount || !!amountError || !receiverIdentifier.trim()
                                }
                                className={`rounded-2xl py-5 items-center ${loading || !amount || !!amountError || !receiverIdentifier.trim()
                                        ? 'bg-neutral-800/50 opacity-50'
                                        : 'bg-orange-500'
                                    }`}
                                activeOpacity={0.7}
                            >
                                {loading ? (
                                    <View className="flex-row items-center gap-3">
                                        <ActivityIndicator size="small" color="#fff" />
                                        <Text className="text-white font-bold text-base">Processing...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center gap-2.5">
                                        <Send size={18} color="#fff" />
                                        <Text className="text-white font-bold text-base">Transfer Money</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Transfer;
