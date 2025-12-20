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
} from 'react-native';
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import {
    Send,
    DollarSign,
    User,
    CheckCircle,
    AlertCircle,
    Loader,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const Transfer = () => {
    const router = useRouter();
    const { user, checkAuth } = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Form
    const [amount, setAmount] = useState('');
    const [receiverIdentifier, setReceiverIdentifier] = useState('');
    const [note, setNote] = useState('');
    const [amountError, setAmountError] = useState('');

    // Search
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    // Result
    const [transferResult, setTransferResult] = useState(null);

    // Validate amount
    const validateAmount = (value) => {
        const numValue = parseFloat(value);

        if (!value || numValue <= 0) {
            setAmountError('Please enter a valid amount');
            return false;
        }

        if (numValue > (user?.walletBalance || 0)) {
            setAmountError(
                `Insufficient balance. Available: $${(user?.walletBalance || 0).toFixed(2)}`
            );
            return false;
        }

        if (numValue < 1) {
            setAmountError('Minimum transfer is $1');
            return false;
        }

        setAmountError('');
        return true;
    };

    const handleAmountChange = (value) => {
        setAmount(value);
        if (value) {
            validateAmount(value);
        } else {
            setAmountError('');
        }
    };

    // Search users
    const handleSearchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await api.get(
                `/transfer/search/users?query=${encodeURIComponent(query)}`
            );
            if (response.data.success) {
                setSearchResults(response.data.data);
            }
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleReceiverChange = (value) => {
        setReceiverIdentifier(value);
        setError('');
        handleSearchUsers(value);
    };

    const selectUser = (selectedUser) => {
        setReceiverIdentifier(selectedUser.username);
        setSearchResults([]);
    };

    // Submit
    const handleTransfer = async () => {
        if (!validateAmount(amount)) return;

        if (!receiverIdentifier.trim()) {
            setError('Please enter receiver username or email');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/transfer/create', {
                amount: parseFloat(amount),
                receiverIdentifier: receiverIdentifier.trim(),
                note: note.trim(),
            });

            if (response.data.success) {
                setTransferResult(response.data.data);
                setSuccess(true);
                await checkAuth();
            } else {
                setError(response.data.message || 'Transfer failed');
            }
        } catch (err) {
            console.error('Transfer error:', err);
            setError(err.response?.data?.message || 'Failed to process transfer');
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
    };

    if (success && transferResult) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                    <Text className="text-3xl text-white">Transfer Successful</Text>
                </View>
                <ScrollView className="flex-1">
                    <View className="py-4 pb-24 px-4">
                        <View className="bg-gray-800/40 rounded-xl p-6 border border-gray-700/30">
                            <View className="items-center mb-6">
                                <View className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle size={40} color="#22c55e" />
                                </View>
                                <Text className="text-2xl font-bold text-white mb-2">
                                    Transfer Successful!
                                </Text>
                                <Text className="text-gray-400 text-center">
                                    You sent ${transferResult.amount.toFixed(2)} to{' '}
                                    {transferResult.receiver.username}
                                </Text>
                            </View>

                            <View className="p-4 bg-gray-900 rounded-xl mb-6 border border-gray-700">
                                <View className="gap-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400">Amount</Text>
                                        <Text className="text-white font-semibold">
                                            ${transferResult.amount.toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400">To</Text>
                                        <Text className="text-white font-semibold">
                                            @{transferResult.receiver.username}
                                        </Text>
                                    </View>
                                    <View className="h-px bg-gray-700 my-2" />
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400">New Balance</Text>
                                        <Text className="text-green-400 font-bold">
                                            ${transferResult.newBalance.toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="gap-3">
                                <TouchableOpacity
                                    onPress={() => router.push('/dashboard')}
                                    className="bg-orange-600 rounded-xl py-4 items-center"
                                >
                                    <Text className="text-white font-bold text-base">
                                        Go to Dashboard
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={resetTransfer}
                                    className="bg-gray-700 rounded-xl py-4 items-center"
                                >
                                    <Text className="text-white font-bold text-base">
                                        Make Another Transfer
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-3xl text-white">Transfer Funds</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1">
                    <View className="py-4 pb-24 px-4">
                        {/* Current Balance */}
                        {user && (
                            <View className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl p-5 mb-6">
                                <View className="flex-row items-center gap-2 mb-2">
                                    <Send size={20} color="#fff" />
                                    <Text className="text-sm font-semibold text-white">
                                        Available Balance
                                    </Text>
                                </View>
                                <Text className="text-3xl font-bold text-white">
                                    ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <View className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                                <AlertCircle size={20} color="#ef4444" />
                                <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            </View>
                        )}

                        {/* Receiver */}
                        <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                            <Text className="text-xl font-light text-white mb-4">Recipient</Text>

                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-400 mb-2">
                                    Username or Email
                                </Text>
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
                                    <TextInput
                                        value={receiverIdentifier}
                                        onChangeText={handleReceiverChange}
                                        placeholder="Enter username or email"
                                        placeholderTextColor="#6b7280"
                                        className="pl-12 pr-12 py-4 text-white bg-gray-900 border-2 border-gray-700 rounded-xl"
                                    />
                                    {searching && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#9ca3af"
                                            style={{
                                                position: 'absolute',
                                                right: 16,
                                                top: 16,
                                            }}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <View className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                                    <ScrollView style={{ maxHeight: 240 }}>
                                        {searchResults.map((u) => (
                                            <TouchableOpacity
                                                key={u.id}
                                                onPress={() => selectUser(u)}
                                                className="p-3 border-b border-gray-700 last:border-b-0"
                                            >
                                                <Text className="font-semibold text-white">
                                                    {u.name}
                                                </Text>
                                                <Text className="text-sm text-gray-400">
                                                    @{u.username}
                                                </Text>
                                                <Text className="text-xs text-gray-500">
                                                    {u.email}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}
                        </View>

                        {/* Amount */}
                        <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                            <Text className="text-xl font-light text-white mb-4">Amount</Text>

                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-400 mb-2">
                                    Amount (USD)
                                </Text>
                                <View className="relative">
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
                                        placeholder="Enter amount"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="decimal-pad"
                                        className={`pl-12 pr-4 py-4 text-lg text-white rounded-xl ${amountError
                                                ? 'bg-red-500/20 border-2 border-red-500/30'
                                                : 'bg-gray-900 border-2 border-gray-700'
                                            }`}
                                    />
                                </View>
                                {amountError && (
                                    <View className="flex-row items-center gap-1 mt-2">
                                        <AlertCircle size={14} color="#ef4444" />
                                        <Text className="text-sm text-red-400">{amountError}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Quick amounts */}
                            <View className="flex-row flex-wrap gap-2">
                                {[10, 50, 100, 500, 1000].map((quickAmount) => (
                                    <TouchableOpacity
                                        key={quickAmount}
                                        onPress={() => {
                                            setAmount(quickAmount.toString());
                                            validateAmount(quickAmount.toString());
                                        }}
                                        className="px-4 py-2 bg-gray-700/50 rounded-lg"
                                    >
                                        <Text className="text-white font-semibold">
                                            ${quickAmount}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Note */}
                        <View className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/30 mb-6">
                            <Text className="text-xl font-light text-white mb-4">
                                Note (Optional)
                            </Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Add a note..."
                                placeholderTextColor="#6b7280"
                                maxLength={200}
                                multiline
                                numberOfLines={3}
                                className="px-4 py-3 text-white bg-gray-900 border border-gray-700 rounded-xl"
                                style={{ textAlignVertical: 'top', minHeight: 80 }}
                            />
                            <Text className="text-xs text-gray-500 mt-2">
                                {note.length}/200 characters
                            </Text>
                        </View>

                        {/* Submit */}
                        <TouchableOpacity
                            onPress={handleTransfer}
                            disabled={
                                loading || !amount || amountError || !receiverIdentifier
                            }
                            className={`rounded-xl py-4 items-center ${loading || !amount || amountError || !receiverIdentifier
                                    ? 'bg-gray-700/50'
                                    : 'bg-orange-600'
                                }`}
                        >
                            {loading ? (
                                <View className="flex-row items-center gap-2">
                                    <ActivityIndicator color="#fff" />
                                    <Text className="text-white font-bold">Processing...</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-2">
                                    <Send size={20} color="#fff" />
                                    <Text className="text-white font-bold text-base">
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
