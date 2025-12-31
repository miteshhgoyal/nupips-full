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
    Bitcoin,
    Building2,
    Wallet,
    DollarSign,
    ArrowLeft,
    Info,
    CheckCircle,
    AlertCircle,
    X,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const FEATURES = {
    BANK_TRANSFER_ENABLED: false,
};

const Withdrawal = () => {
    const router = useRouter();
    const { user, checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState('');
    const [withdrawalMethod, setWithdrawalMethod] = useState('crypto');
    const [selectedCrypto, setSelectedCrypto] = useState('bep20/usdt');

    // Crypto details
    const [walletAddress, setWalletAddress] = useState('');
    const [walletNetwork, setWalletNetwork] = useState('');

    // Success state
    const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
    const [withdrawalDetails, setWithdrawalDetails] = useState(null);

    const cryptoOptions = [
        {
            value: 'bep20/usdt',
            label: 'USDT (BEP20)',
            network: 'Binance Smart Chain',
            fee: '0.5%',
            minWithdrawal: 10,
            processingTime: '1-24 hours',
        },
        {
            value: 'trc20/usdt',
            label: 'USDT (TRC20)',
            network: 'TRON',
            fee: '0.5%',
            minWithdrawal: 10,
            processingTime: '1-24 hours',
        },
    ];

    const selectedOption = cryptoOptions.find((opt) => opt.value === selectedCrypto);

    const calculateFee = () => {
        if (!amount || !selectedOption) return 0;
        const feePercent = parseFloat(selectedOption.fee) / 100;
        return parseFloat(amount) * feePercent;
    };

    const calculateNetAmount = () => {
        if (!amount) return 0;
        return parseFloat(amount) - calculateFee();
    };

    // FIXED: Proper validation with state sync
    const validateAmount = (testAmount) => {
        const numValue = parseFloat(testAmount);
        if (!testAmount || numValue <= 0 || isNaN(numValue)) {
            setAmountError('Please enter a valid amount');
            return false;
        }
        if (numValue > (user?.walletBalance || 0)) {
            setAmountError('Insufficient balance');
            return false;
        }
        if (selectedOption && numValue < selectedOption.minWithdrawal) {
            setAmountError(`Minimum withdrawal is $${selectedOption.minWithdrawal}`);
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

    const handleWithdraw = async () => {
        if (!validateAmount(amount)) return;

        if (withdrawalMethod === 'crypto') {
            if (!walletAddress.trim()) {
                setError('Please enter your wallet address');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                amount: parseFloat(amount),
                currency: 'USD',
                withdrawalMethod: 'blockbee-crypto',
            };

            if (withdrawalMethod === 'crypto') {
                payload.crypto = selectedCrypto;
                payload.walletAddress = walletAddress;
                payload.network = walletNetwork;
            }

            const response = await api.post('/withdrawal/create', payload);

            if (response.data.success) {
                setWithdrawalDetails(response.data.data);
                setWithdrawalSuccess(true);
                await checkAuth();
            } else {
                setError(response.data.message || 'Failed to create withdrawal');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to process withdrawal');
        } finally {
            setLoading(false);
        }
    };

    const resetWithdrawal = () => {
        setWithdrawalSuccess(false);
        setWithdrawalDetails(null);
        setAmount('');
        setWalletAddress('');
        setAmountError('');
        setError(null);
    };

    // Success Screen - FIXED layout
    if (withdrawalSuccess && withdrawalDetails) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                    <Text className="text-2xl font-bold text-white">Withdrawal Submitted</Text>
                </View>
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="py-4 pb-24">
                        <View className="mx-4 mb-6 bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-xl p-5 border border-green-500/30 items-center">
                            <View className="w-16 h-16 bg-green-500/20 rounded-xl items-center justify-center mb-4 border border-green-500/30">
                                <CheckCircle size={24} color="#22c55e" />
                            </View>
                            <Text className="text-xl font-bold text-white mb-2 text-center">Withdrawal Submitted!</Text>
                            <Text className="text-green-400 text-sm text-center">
                                ${amount} - {selectedOption?.processingTime}
                            </Text>
                        </View>

                        <View className="mx-4 mb-6 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <View style={{ marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text className="text-gray-400 text-xs">Amount</Text>
                                    <Text className="text-white font-bold text-lg">${amount}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text className="text-gray-400 text-xs">Fee</Text>
                                    <Text className="text-red-400 font-semibold">-${calculateFee().toFixed(2)}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text className="text-gray-400 text-xs font-semibold">Net Amount</Text>
                                    <Text className="text-green-400 font-bold text-lg">${calculateNetAmount().toFixed(2)}</Text>
                                </View>
                            </View>
                            <Text className="text-xs text-gray-500 text-center">
                                Transaction ID: {withdrawalDetails.transactionId}
                            </Text>
                        </View>

                        <View className="mx-4 gap-3">
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/dashboard')}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-xl py-4 items-center shadow-lg"
                            >
                                <Text className="text-white font-bold text-base">Go to Dashboard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={resetWithdrawal}
                                className="border-2 border-gray-700 rounded-xl py-4 items-center bg-gray-800/50"
                            >
                                <Text className="text-white font-bold text-base">Make Another Withdrawal</Text>
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
                <Text className="text-2xl font-bold text-white">Withdraw Funds</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Balance - EXACT Team stats */}
                    {user && (
                        <View className="mx-4 mb-6 bg-gradient-to-r from-orange-600/20 to-orange-500/20 rounded-xl p-5 border border-orange-500/30">
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <View className="w-10 h-10 bg-orange-500/20 rounded-full items-center justify-center mr-3">
                                    <Wallet size={20} color="#ffffff" />
                                </View>
                                <Text className="text-sm font-semibold text-white">Available Balance</Text>
                            </View>
                            <Text className="text-2xl font-bold text-white">
                                ${parseFloat(user.walletBalance || 0).toFixed(2)}
                            </Text>
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

                    {/* Method Selection - EXACT Team filters */}
                    <View className="mx-4 mb-6 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                        <Text className="text-lg font-light text-white mb-4">Withdrawal Method</Text>
                        <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                                onPress={() => setWithdrawalMethod('crypto')}
                                style={{
                                    flex: 1,
                                    padding: 16,
                                    borderRadius: 12,
                                    borderWidth: 2,
                                    marginRight: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderColor: withdrawalMethod === 'crypto' ? '#ea580c' : '#374151',
                                    backgroundColor: withdrawalMethod === 'crypto' ? 'rgba(234,88,12,0.1)' : 'rgba(31,41,55,0.3)'
                                }}
                            >
                                <Bitcoin size={24} color="#f97316" style={{ marginBottom: 8 }} />
                                <Text className="font-bold text-white text-base mb-1">Cryptocurrency</Text>
                                <Text className="text-gray-400 text-xs text-center">Fast & secure</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Amount Input - FIXED validation + EXACT Team input */}
                    <View className="mx-4 mb-6 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                        <Text className="text-lg font-light text-white mb-4">Withdrawal Amount</Text>

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
                                    placeholder="Enter withdrawal amount"
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
                            {[10, 50, 100, 500].map((quickAmount) => (
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

                        {/* Fee Preview */}
                        {amount && !amountError && selectedOption && (
                            <View className="p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text className="text-gray-400 text-xs">Amount</Text>
                                    <Text className="text-white font-semibold text-sm">${amount}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text className="text-gray-400 text-xs">Fee ({selectedOption.fee})</Text>
                                    <Text className="text-red-400 font-semibold text-sm">-${calculateFee().toFixed(2)}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text className="text-gray-400 text-xs font-semibold">You'll Receive</Text>
                                    <Text className="text-green-400 font-bold text-sm">${calculateNetAmount().toFixed(2)}</Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Crypto Selection & Details */}
                    {withdrawalMethod === 'crypto' && (
                        <View className="mx-4 mb-6 bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <Text className="text-lg font-light text-white mb-4">Cryptocurrency Details</Text>

                            {/* Crypto Selection */}
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ paddingHorizontal: 12 }}>
                                {cryptoOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => {
                                            setSelectedCrypto(option.value);
                                            setWalletNetwork(option.network);
                                        }}
                                        style={{
                                            padding: 16,
                                            borderRadius: 12,
                                            borderWidth: 2,
                                            width: 280,
                                            marginRight: index < cryptoOptions.length - 1 ? 12 : 0,
                                            borderColor: selectedCrypto === option.value ? '#ea580c' : '#374151',
                                            backgroundColor: selectedCrypto === option.value ? 'rgba(234,88,12,0.1)' : 'rgba(31,41,55,0.3)'
                                        }}
                                    >
                                        <Text style={{ fontWeight: '600', color: '#ffffff', fontSize: 14, marginBottom: 4 }}>
                                            {option.label}
                                        </Text>
                                        <Text style={{ color: '#9ca3af', fontSize: 12, marginBottom: 8 }}>
                                            {option.network}
                                        </Text>
                                        <Text style={{ fontSize: 12, color: '#6b7280' }}>Min: ${option.minWithdrawal}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            {/* Wallet Address */}
                            <View className="mb-4">
                                <Text className="text-xs font-semibold text-gray-400 uppercase mb-3 tracking-wide">Wallet Address</Text>
                                <TextInput
                                    value={walletAddress}
                                    onChangeText={setWalletAddress}
                                    placeholder="Enter your wallet address"
                                    placeholderTextColor="#6b7280"
                                    className="px-4 py-3 text-white bg-gray-900 border border-gray-700 rounded-xl"
                                />
                            </View>

                            <Text className="text-xs text-gray-500">Network: {walletNetwork || selectedOption?.network}</Text>
                        </View>
                    )}

                    {/* Submit Button - EXACT Team primary */}
                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={loading || !amount || !!amountError || !walletAddress.trim()}
                        className={`mx-4 rounded-xl py-4 items-center ${loading || !amount || !!amountError || !walletAddress.trim()
                                ? 'bg-gray-700/50'
                                : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                            }`}
                    >
                        {loading ? (
                            <View className="flex-row items-center gap-3">
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text className="text-white font-bold text-base">Processing...</Text>
                            </View>
                        ) : (
                            <Text className="text-white font-bold text-base">Submit Withdrawal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Withdrawal;
