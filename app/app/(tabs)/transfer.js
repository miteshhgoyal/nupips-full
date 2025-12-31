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

    // FIXED: Proper validation with state sync
    const validateAmount = (testAmount) => {
        const numValue = parseFloat(testAmount);
        if (!testAmount || numValue <= 0 || isNaN(numValue)) {
            setAmountError('Please enter a valid amount');
            return false;
        }
        if (numValue > (user?.walletBalance || 0)) {
            setAmountError(`Insufficient balance. Available: $${(user?.walletBalance || 0).toFixed(2)}`);
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
        setTimeout(() => {
            if (value) validateAmount(value);
            else setAmountError('');
        }, 0);
    };

    // FIXED: Quick amount with proper state sync
    const handleQuickAmount = (quickAmount) => {
        const value = quickAmount.toString();
        setAmount(value);
        setAmountError('');
        setTimeout(() => validateAmount(value), 50);
    };

    const handleSearchUsers = async (query) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const response = await api.get(`/transfer/search/users?query=${encodeURIComponent(query)}`);
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

    // Success Screen - FIXED layout
    if (success && transferResult) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                    <Text className="text-2xl font-bold text-white">Transfer Successful</Text>
                </View>
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="py-4 pb-24">
                        <View className="mx-4 mb-6 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-5 border border-green-500/30 items-center">
                            <View className="w-16 h-16 bg-green-500/20 rounded-xl items-center justify-center mb-4 border border-green-500/30">
                                <CheckCircle size={24} color="#22c55e" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2 text-center">Transfer Successful!</Text>
                            <Text className="text-green-400 text-sm text-center">
                                ${transferResult.amount.toFixed(2)} to @{transferResult.receiver.username}
                            </Text>
                        </View>

                        <View className="mx-4 mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <View style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text className="text-gray-400 text-xs">Amount</Text>
                                    <Text className="text-white font-bold text-lg">${transferResult.amount.toFixed(2)}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text className="text-gray-400 text-xs">To</Text>
                                    <Text className="text-blue-400 font-semibold text-sm">@{transferResult.receiver.username}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text className="text-gray-400 text-xs font-semibold">New Balance</Text>
                                    <Text className="text-green-400 font-bold text-lg">${transferResult.newBalance.toFixed(2)}</Text>
                                </View>
                            </View>
                        </View>

                        <View className="mx-4" style={{ gap: 12 }}>
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/dashboard')}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl py-4 items-center shadow-lg"
                            >
                                <Text className="text-white font-bold text-base">Go to Dashboard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={resetTransfer}
                                className="border-2 border-gray-700 rounded-xl py-4 items-center bg-gray-800/50"
                            >
                                <Text className="text-white font-bold text-base">Make Another Transfer</Text>
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

            {/* Header - EXACT NupipsTeam: px-4 py-3 */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <Text className="text-2xl font-bold text-white">Transfer Funds</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="py-4 pb-24">
                        {/* Balance - EXACT Team stats */}
                        {user && (
                            <View className="mx-4 mb-6 bg-gradient-to-r from-orange-600/20 to-orange-500/20 rounded-xl p-5 border border-orange-500/30">
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <View className="w-10 h-10 bg-orange-500/20 rounded-full items-center justify-center mr-3">
                                        <DollarSign size={20} color="#ffffff" />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-semibold text-white">Available Balance</Text>
                                        <Text className="text-lg font-bold text-orange-400">
                                            ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Error Alert - EXACT Team */}
                        {error && (
                            <View className="mx-4 mb-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start" style={{ marginRight: 12 }}>
                                <AlertCircle size={20} color="#ef4444" style={{ marginRight: 12 }} />
                                <View className="flex-1">
                                    <Text className="text-red-400 text-sm font-semibold">{error}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setError(null)}>
                                    <X size={20} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Receiver Input - EXACT Team input */}
                        <View className="mx-4 mb-6 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <Text className="text-lg font-light text-white mb-4">Recipient</Text>
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Username or Email</Text>
                                <View className="relative">
                                    <User
                                        size={18}
                                        color="#9ca3af"
                                        style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                                    />
                                    {searching && (
                                        <ActivityIndicator
                                            size="small"
                                            color="#ea580c"
                                            style={{ position: 'absolute', right: 12, top: 12 }}
                                        />
                                    )}
                                    <TextInput
                                        value={receiverIdentifier}
                                        onChangeText={handleReceiverChange}
                                        placeholder="Enter username or email"
                                        placeholderTextColor="#6b7280"
                                        className="pl-10 pr-12 py-3 text-white rounded-xl border bg-gray-800/40 border-gray-700"
                                    />
                                </View>
                            </View>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <View className="bg-gray-950/80 border border-gray-700/50 rounded-xl overflow-hidden" style={{ maxHeight: 240 }}>
                                    <FlatList
                                        data={searchResults}
                                        keyExtractor={(item) => item.id}
                                        renderItem={({ item }) => (
                                            <TouchableOpacity
                                                onPress={() => selectUser(item)}
                                                style={{
                                                    padding: 16,
                                                    borderBottomWidth: 1,
                                                    borderBottomColor: 'rgba(75,85,99,0.5)',
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={{ fontWeight: '600', color: '#ffffff', fontSize: 16, marginBottom: 4 }}>
                                                    {item.name}
                                                </Text>
                                                <Text style={{ color: '#60a5fa', fontWeight: '600', fontSize: 14, marginBottom: 2 }}>
                                                    @{item.username}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: '#6b7280' }}>
                                                    {item.email}
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        showsVerticalScrollIndicator={false}
                                    />
                                </View>
                            )}
                        </View>

                        {/* Amount Input - FIXED validation + quick amounts */}
                        <View className="mx-4 mb-6 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <Text className="text-lg font-light text-white mb-4">Amount</Text>

                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Amount (USD)</Text>
                                <View className="relative">
                                    <DollarSign
                                        size={18}
                                        color="#9ca3af"
                                        style={{ position: 'absolute', left: 12, top: 12, zIndex: 1 }}
                                    />
                                    <TextInput
                                        value={amount}
                                        onChangeText={handleAmountChange}
                                        placeholder="Enter amount"
                                        placeholderTextColor="#6b7280"
                                        keyboardType="decimal-pad"
                                        className="pl-10 pr-4 py-3 text-white rounded-xl border"
                                        style={{
                                            borderColor: amountError ? '#ef4444' : '#374151',
                                            borderWidth: 1,
                                            backgroundColor: amountError ? 'rgba(239,68,68,0.1)' : 'rgba(31,41,55,0.4)'
                                        }}
                                    />
                                </View>
                                {amountError ? (
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                                        <AlertCircle size={16} color="#ef4444" style={{ marginRight: 6 }} />
                                        <Text className="text-xs text-red-400">{amountError}</Text>
                                    </View>
                                ) : null}
                            </View>

                            {/* Quick Amounts - FIXED */}
                            <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Quick Amounts</Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
                                {[10, 50, 100, 500, 1000].map((quickAmount) => (
                                    <TouchableOpacity
                                        key={quickAmount}
                                        onPress={() => handleQuickAmount(quickAmount)}
                                        style={{
                                            flex: 1,
                                            minWidth: 70,
                                            paddingHorizontal: 16,
                                            paddingVertical: 8,
                                            margin: 2,
                                            borderRadius: 12,
                                            borderWidth: 1,
                                            alignItems: 'center',
                                            borderColor: parseFloat(amount) === quickAmount ? '#ea580c' : '#374151',
                                            backgroundColor: parseFloat(amount) === quickAmount ? '#ea580c' : 'rgba(31,41,55,0.4)'
                                        }}
                                    >
                                        <Text style={{
                                            fontWeight: '600',
                                            fontSize: 12,
                                            color: parseFloat(amount) === quickAmount ? '#ffffff' : '#9ca3af',
                                            textAlign: 'center'
                                        }}>
                                            ${quickAmount}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Note */}
                        <View className="mx-4 mb-6 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <Text className="text-lg font-light text-white mb-4">Note (Optional)</Text>
                            <TextInput
                                value={note}
                                onChangeText={setNote}
                                placeholder="Add a note for the recipient..."
                                placeholderTextColor="#6b7280"
                                maxLength={200}
                                multiline
                                numberOfLines={4}
                                className="px-4 py-3 text-white bg-gray-900 border border-gray-700 rounded-xl"
                                style={{ textAlignVertical: 'top', minHeight: 100 }}
                            />
                            <Text className="text-xs text-gray-500 mt-2 text-right">
                                {note.length}/200 characters
                            </Text>
                        </View>

                        {/* Submit Button - EXACT Team primary */}
                        <TouchableOpacity
                            onPress={handleTransfer}
                            disabled={loading || !amount || !!amountError || !receiverIdentifier.trim()}
                            className={`mx-4 rounded-xl py-4 items-center ${loading || !amount || !!amountError || !receiverIdentifier.trim()
                                    ? 'bg-gray-700/50'
                                    : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                }`}
                        >
                            {loading ? (
                                <View className="flex-row items-center" style={{ gap: 12 }}>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text className="text-white font-bold text-base">Processing...</Text>
                                </View>
                            ) : (
                                <View className="flex-row items-center" style={{ gap: 12 }}>
                                    <Send size={20} color="#ffffff" />
                                    <Text className="text-white font-bold text-base">Transfer Money</Text>
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
