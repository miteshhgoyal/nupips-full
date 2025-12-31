import React, { useState, useEffect } from 'react';
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
        setSearchResults([]);
    };

    // Success Screen
    if (success && transferResult) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="bg-gradient-to-r from-green-600/20 to-green-500/20 border-b border-green-600/30 px-6 py-5">
                    <View className="flex-row items-center gap-3 mb-2">
                        <CheckCircle size={28} color="#22c55e" />
                        <Text className="text-3xl font-bold text-white flex-1">Transfer Successful</Text>
                    </View>
                    <Text className="text-green-300 text-lg font-medium">Funds sent successfully</Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="px-6 py-8 pb-24">
                        <View className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl p-8 border border-green-500/30 items-center mb-8">
                            <View className="w-24 h-24 bg-green-500/20 rounded-3xl items-center justify-center mb-6 border border-green-500/40">
                                <CheckCircle size={52} color="#22c55e" />
                            </View>
                            <Text className="text-4xl font-bold text-white mb-4 text-center">
                                Transfer Successful!
                            </Text>
                            <Text className="text-gray-300 text-xl text-center mb-8">
                                You sent <Text className="font-bold text-green-400">${transferResult.amount.toFixed(2)}</Text>{' '}
                                to <Text className="font-bold text-white">@{transferResult.receiver.username}</Text>
                            </Text>
                        </View>

                        <View className="bg-gray-900/50 rounded-3xl p-8 mb-10 border border-gray-700/50">
                            <View className="space-y-5">
                                <View className="flex-row justify-between items-center py-4 border-b border-gray-700">
                                    <Text className="text-gray-400 text-lg font-semibold">Amount</Text>
                                    <Text className="text-3xl font-bold text-white">
                                        ${transferResult.amount.toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center py-4 border-b border-gray-700">
                                    <Text className="text-gray-400 text-lg font-semibold">To</Text>
                                    <Text className="text-2xl font-bold text-blue-400">
                                        @{transferResult.receiver.username}
                                    </Text>
                                </View>
                                <View className="h-px bg-gradient-to-r from-orange-500/50 to-transparent my-4" />
                                <View className="flex-row justify-between items-center py-4">
                                    <Text className="text-gray-400 text-xl font-semibold">New Balance</Text>
                                    <Text className="text-3xl font-bold text-green-400">
                                        ${transferResult.newBalance.toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="gap-4">
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/dashboard')}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl py-6 items-center shadow-2xl shadow-orange-500/30"
                            >
                                <Text className="text-white font-bold text-xl">Go to Dashboard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={resetTransfer}
                                className="border-2 border-gray-700/50 rounded-3xl py-6 items-center bg-gray-900/30 backdrop-blur-sm"
                            >
                                <Text className="text-white font-bold text-xl">Make Another Transfer</Text>
                            </TouchableOpacity>
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
            <View className="bg-gray-800/40 border-b border-gray-800 px-6 py-5">
                <View className="flex-row items-center gap-4 mb-2">
                    <Send size={32} color="#ea580c" />
                    <Text className="text-3xl font-bold text-white flex-1">Transfer Funds</Text>
                </View>
                <Text className="text-gray-400 text-lg">Send money to other users</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="px-6 py-8 pb-24">
                        {/* Current Balance */}
                        {user && (
                            <View className="bg-gradient-to-r from-orange-600/20 to-orange-500/20 rounded-3xl p-8 mb-8 border border-orange-600/40">
                                <View className="flex-row items-center gap-4 mb-4">
                                    <View className="w-16 h-16 bg-orange-500/30 rounded-2xl items-center justify-center">
                                        <DollarSign size={24} color="#ffffff" />
                                    </View>
                                    <View>
                                        <Text className="text-xl font-bold text-white mb-1">Available Balance</Text>
                                        <Text className="text-4xl font-bold text-orange-400">
                                            ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Error Alert */}
                        {error && (
                            <View className="mb-8 p-5 bg-red-500/20 border border-red-500/40 rounded-3xl flex-row items-start gap-4">
                                <AlertCircle size={24} color="#ef4444" />
                                <Text className="text-red-400 text-lg flex-1">{error}</Text>
                                <TouchableOpacity onPress={() => setError(null)}>
                                    <X size={24} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Receiver */}
                        <View className="bg-gray-900/30 rounded-3xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
                            <Text className="text-2xl font-bold text-white mb-6">Recipient</Text>

                            <View className="mb-6">
                                <Text className="text-gray-400 text-lg font-semibold mb-4">
                                    Username or Email
                                </Text>
                                <View className="relative">
                                    <User
                                        size={24}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 20,
                                            top: 20,
                                            zIndex: 1,
                                        }}
                                    />
                                    <TextInput
                                        value={receiverIdentifier}
                                        onChangeText={handleReceiverChange}
                                        placeholder="Enter username or email"
                                        placeholderTextColor="#6b7280"
                                        className="pl-16 pr-16 py-5 text-white bg-gray-950 border-2 border-gray-800 rounded-3xl text-lg"
                                    />
                                    {searching && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ea580c"
                                            style={{
                                                position: 'absolute',
                                                right: 20,
                                                top: 20,
                                            }}
                                        />
                                    )}
                                </View>
                            </View>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <View className="bg-gray-950/80 border border-gray-700/50 rounded-3xl overflow-hidden max-h-60">
                                    <FlatList
                                        data={searchResults}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => selectUser(item)}
                                                className="p-5 border-b border-gray-800/50 last:border-b-0 active:bg-gray-800/50"
                                                activeOpacity={0.7}
                                            >
                                                <Text className="text-xl font-bold text-white mb-1">
                                                    {item.name}
                                                </Text>
                                                <Text className="text-lg text-blue-400 font-semibold mb-1">
                                                    @{item.username}
                                                </Text>
                                                <Text className="text-sm text-gray-500">
                                                    {item.email}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Amount */}
                        <View className="bg-gray-900/30 rounded-3xl p-8 mb-8 border border-gray-700/50 backdrop-blur-sm">
                            <Text className="text-2xl font-bold text-white mb-6">Amount</Text>

                            <View className="mb-8">
                                <Text className="text-gray-400 text-lg font-semibold mb-4">
                                    Amount (USD)
                                </Text>
                                <View className="relative">
                                    <DollarSign
                                        size={24}
                                        color="#9ca3af"
                                        style={{
                                            position: 'absolute',
                                            left: 20,
                                            top: 20,
                                            zIndex: 1,
                                        }}
                                    />
                                    <TextInput
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        placeholder="Enter amount"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="decimal-pad"
                                        className={`pl-16 pr-6 py-5 text-xl text-white rounded-3xl ${amountError
                                                ? 'bg-red-500/20 border-2 border-red-500/40'
                                                : 'bg-gray-950 border-2 border-gray-800'
                                            }`}
                                    />
                                </View>
                                {amountError && (
                                    <View className="flex-row items-center gap-3 mt-4">
                                        <AlertCircle size={20} color="#ef4444" />
                                        <Text className="text-lg text-red-400 font-semibold">{amountError}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Quick amounts */}
                            <View className="flex-row flex-wrap gap-3">
                                {[10, 50, 100, 500, 1000].map((quickAmount) => (
                                    <TouchableOpacity
                                        key={quickAmount}
                                        onPress={() => {
                                            setAmount(quickAmount.toString());
                                            validateAmount(quickAmount.toString());
                                        }}
                                        className="flex-1 px-8 py-5 bg-gray-800/50 border border-gray-700 rounded-2xl items-center active:bg-gray-700/50"
                                        activeOpacity={0.8}
                                    >
                                        <Text className="text-xl font-bold text-white">${quickAmount}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Note */}
                        <View className="bg-gray-900/30 rounded-3xl p-8 mb-10 border border-gray-700/50 backdrop-blur-sm">
                            <Text className="text-2xl font-bold text-white mb-6">Note (Optional)</Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Add a note for the recipient..."
                                placeholderTextColor="#6b7280"
                                maxLength={200}
                                multiline
                                numberOfLines={4}
                                className="px-6 py-5 text-white bg-gray-950 border border-gray-800 rounded-3xl text-lg"
                                style={{ textAlignVertical: 'top', minHeight: 100 }}
                            />
                            <Text className="text-sm text-gray-500 mt-3 text-right">
                                {note.length}/200 characters
                            </Text>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            onPress={handleTransfer}
                            disabled={loading || !amount || amountError || !receiverIdentifier.trim()}
                            className={`rounded-3xl py-6 items-center shadow-2xl ${loading || !amount || amountError || !receiverIdentifier.trim()
                                    ? 'bg-gray-700/50 shadow-none'
                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-orange-500/40'
                                }`}
                        >
                            {loading ? (
                                <View className="flex-row items-center gap-4">
                                    <ActivityIndicator size="large" color="#ffffff" />
                                    <Text className="text-white font-bold text-xl">Processing Transfer...</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center gap-4">
                                    <Send size={28} color="#ffffff" />
                                    <Text className="text-white font-bold text-xl">Transfer Money</Text>
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
