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

// ============================================
// FEATURE FLAGS - Toggle features here
// ============================================
const FEATURES = {
    BANK_TRANSFER_ENABLED: false, // Set to true to enable bank transfer
};
// ============================================

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

    // Bank details (only used when BANK_TRANSFER_ENABLED is true)
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');
    const [ifscCode, setIfscCode] = useState('');

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

    const validateAmount = (value) => {
        const numValue = parseFloat(value);

        if (!value || numValue <= 0) {
            setAmountError('Please enter a valid amount');
            return false;
        }

        if (numValue > (user?.walletBalance || 0)) {
            setAmountError('Insufficient balance');
            return false;
        }

        if (selectedOption) {
            if (numValue < selectedOption.minWithdrawal) {
                setAmountError(`Minimum withdrawal is $${selectedOption.minWithdrawal}`);
                return false;
            }
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

    const handleWithdraw = async () => {
        if (!validateAmount(amount)) return;

        // Validate crypto details
        if (withdrawalMethod === 'crypto') {
            if (!walletAddress.trim()) {
                setError('Please enter your wallet address');
                return;
            }
            if (!walletNetwork.trim()) {
                setError('Please select network');
                return;
            }
        }

        // Validate bank details (only if feature enabled)
        if (FEATURES.BANK_TRANSFER_ENABLED && withdrawalMethod === 'bank_transfer') {
            if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
                setError('Please fill in all bank details');
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                amount: parseFloat(amount),
                currency: 'USD',
                withdrawalMethod: withdrawalMethod === 'crypto' ? 'blockbee-crypto' : 'bank_transfer',
            };

            if (withdrawalMethod === 'crypto') {
                payload.crypto = selectedCrypto;
                payload.walletAddress = walletAddress;
                payload.network = walletNetwork;
            } else if (FEATURES.BANK_TRANSFER_ENABLED) {
                payload.bankDetails = {
                    bankName,
                    accountNumber,
                    accountHolderName: accountHolder,
                    ifscCode,
                };
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
            console.error('Withdrawal error:', err);
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

    // Success Screen
    if (withdrawalSuccess && withdrawalDetails) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <StatusBar style="light" />
                <View className="bg-gradient-to-r from-green-600/20 to-green-500/20 border-b border-green-600/30 px-6 py-5">
                    <View className="flex-row items-center gap-3 mb-2">
                        <CheckCircle size={28} color="#22c55e" />
                        <Text className="text-3xl font-bold text-white flex-1">Withdrawal Submitted!</Text>
                    </View>
                    <Text className="text-green-300 text-lg font-medium">Your request is being processed</Text>
                </View>

                <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                    <View className="px-6 py-10 pb-24">
                        <View className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-3xl p-10 border border-green-500/30 items-center mb-12">
                            <View className="w-28 h-28 bg-green-500/20 rounded-3xl items-center justify-center mb-8 border border-green-500/40">
                                <CheckCircle size={64} color="#22c55e" />
                            </View>
                            <Text className="text-4xl font-bold text-white mb-4 text-center">
                                Withdrawal Submitted!
                            </Text>
                            <Text className="text-gray-300 text-xl text-center mb-2">
                                Your withdrawal request of{' '}
                                <Text className="font-bold text-green-400">${amount}</Text>
                            </Text>
                            <Text className="text-green-300 text-lg font-semibold text-center">
                                has been submitted for processing
                            </Text>
                        </View>

                        <View className="bg-gray-900/50 rounded-3xl p-10 mb-12 border border-gray-700/50">
                            <View className="space-y-6">
                                <View className="flex-row justify-between items-center py-6 border-b border-gray-700">
                                    <Text className="text-gray-400 text-xl font-semibold">Amount</Text>
                                    <Text className="text-4xl font-bold text-white">${amount}</Text>
                                </View>
                                <View className="flex-row justify-between items-center py-6 border-b border-gray-700">
                                    <Text className="text-gray-400 text-xl font-semibold">Fee ({selectedOption?.fee})</Text>
                                    <Text className="text-3xl font-bold text-red-400">
                                        -${calculateFee().toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center py-6">
                                    <Text className="text-gray-400 text-2xl font-semibold">Net Amount</Text>
                                    <Text className="text-4xl font-bold text-green-400">
                                        ${calculateNetAmount().toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center py-6 border-t border-gray-700 pt-6">
                                    <Text className="text-gray-400 text-xl font-semibold">Method</Text>
                                    <Text className="text-2xl font-bold text-orange-400 capitalize">
                                        {selectedOption?.label || 'Crypto'}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between items-center py-6">
                                    <Text className="text-gray-400 text-xl font-semibold">Status</Text>
                                    <View className="flex-row items-center gap-2 px-6 py-3 bg-yellow-500/20 border border-yellow-500/40 rounded-2xl">
                                        <View className="w-3 h-3 bg-yellow-400 rounded-full" />
                                        <Text className="text-lg font-bold text-yellow-400">Pending</Text>
                                    </View>
                                </View>
                                <View className="flex-row justify-between items-center pt-6">
                                    <Text className="text-gray-400 text-lg font-semibold">Transaction ID</Text>
                                    <Text className="text-xl font-mono text-white font-semibold">
                                        {withdrawalDetails.transactionId}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="bg-blue-500/10 border border-blue-500/30 rounded-3xl p-8 mb-12">
                            <View className="flex-row items-start gap-4">
                                <Info size={28} color="#60a5fa" />
                                <View className="flex-1">
                                    <Text className="text-xl font-bold text-blue-300 mb-3">Processing Time</Text>
                                    <Text className="text-lg text-blue-200 leading-relaxed">
                                        Your withdrawal will be processed within{' '}
                                        <Text className="font-bold text-white">
                                            {selectedOption?.processingTime || '24-48 hours'}
                                        </Text>
                                        . You'll be notified once it's completed.
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <View className="gap-4">
                            <TouchableOpacity
                                onPress={() => router.push('/(tabs)/dashboard')}
                                className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-3xl py-6 items-center shadow-2xl shadow-orange-500/40"
                            >
                                <Text className="text-white font-bold text-xl">Go to Dashboard</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={resetWithdrawal}
                                className="border-2 border-gray-700/50 rounded-3xl py-6 items-center bg-gray-900/30 backdrop-blur-sm"
                            >
                                <Text className="text-white font-bold text-xl">Make Another Withdrawal</Text>
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
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-6 py-8 pb-24">
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="flex-row items-center gap-3 mb-8 p-4 bg-gray-800/50 rounded-2xl w-fit"
                    >
                        <ArrowLeft size={24} color="#ea580c" />
                        <Text className="text-xl font-bold text-white">Back</Text>
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-10">
                        <View className="flex-1">
                            <Text className="text-4xl font-bold text-white mb-2 flex-row items-center gap-4">
                                <Wallet size={36} color="#ea580c" />
                                Withdraw Funds
                            </Text>
                            <Text className="text-gray-400 text-xl">Withdraw from your wallet</Text>
                        </View>
                        {user && (
                            <View className="items-end">
                                <Text className="text-gray-500 text-lg mb-1">Available Balance</Text>
                                <Text className="text-3xl font-bold text-white">
                                    ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Error Alert */}
                    {error && (
                        <View className="mb-8 p-6 bg-red-500/20 border border-red-500/40 rounded-3xl flex-row items-start gap-4">
                            <AlertCircle size={28} color="#ef4444" />
                            <View className="flex-1">
                                <Text className="text-xl font-bold text-red-300 mb-2">{error}</Text>
                                <TouchableOpacity onPress={() => setError(null)}>
                                    <Text className="text-red-400 text-lg font-semibold underline">Dismiss</Text>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => setError(null)}>
                                <X size={28} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Withdrawal Method */}
                    <View className="bg-gray-900/30 rounded-3xl p-8 mb-10 border border-gray-700/50 backdrop-blur-sm">
                        <Text className="text-2xl font-bold text-white mb-8">Withdrawal Method</Text>
                        <View className="flex-row gap-4">
                            <TouchableOpacity
                                onPress={() => setWithdrawalMethod('crypto')}
                                className={`flex-1 p-8 rounded-3xl border-2 items-center justify-center ${withdrawalMethod === 'crypto'
                                        ? 'bg-gradient-to-br from-orange-500/20 to-orange-400/20 border-orange-500 shadow-lg shadow-orange-500/25'
                                        : 'bg-gray-900/30 border-gray-700/50 hover:border-gray-600'
                                    }`}
                            >
                                <Bitcoin size={48} color="#f97316" />
                                <Text className="text-2xl font-bold text-white mt-4 mb-2">Cryptocurrency</Text>
                                <Text className="text-lg text-gray-400 text-center">
                                    Fast and secure crypto withdrawal
                                </Text>
                            </TouchableOpacity>

                            {FEATURES.BANK_TRANSFER_ENABLED && (
                                <TouchableOpacity
                                    onPress={() => setWithdrawalMethod('bank_transfer')}
                                    className={`flex-1 p-8 rounded-3xl border-2 items-center justify-center ${withdrawalMethod === 'bank_transfer'
                                            ? 'bg-gradient-to-br from-blue-500/20 to-blue-400/20 border-blue-500 shadow-lg shadow-blue-500/25'
                                            : 'bg-gray-900/30 border-gray-700/50 hover:border-gray-600'
                                        }`}
                                >
                                    <Building2 size={48} color="#3b82f6" />
                                    <Text className="text-2xl font-bold text-white mt-4 mb-2">Bank Transfer</Text>
                                    <Text className="text-lg text-gray-400 text-center">
                                        Direct bank account transfer
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Amount */}
                    <View className="bg-gray-900/30 rounded-3xl p-8 mb-10 border border-gray-700/50 backdrop-blur-sm">
                        <Text className="text-2xl font-bold text-white mb-8">Withdrawal Amount</Text>
                        <View className="mb-8">
                            <Text className="text-gray-400 text-xl font-semibold mb-4">Amount (USD)</Text>
                            <View className="relative">
                                <DollarSign
                                    size={28}
                                    color="#9ca3af"
                                    style={{
                                        position: 'absolute',
                                        left: 24,
                                        top: 24,
                                        zIndex: 1,
                                    }}
                                />
                                <TextInput
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    placeholder="Enter withdrawal amount"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="decimal-pad"
                                    className={`pl-20 pr-8 py-6 text-2xl text-white rounded-3xl ${amountError
                                            ? 'bg-red-500/20 border-3 border-red-500/50'
                                            : 'bg-gray-950 border-3 border-gray-800/50'
                                        }`}
                                />
                            </View>
                            {amountError && (
                                <View className="flex-row items-center gap-3 mt-6">
                                    <AlertCircle size={24} color="#ef4444" />
                                    <Text className="text-xl text-red-400 font-bold">{amountError}</Text>
                                </View>
                            )}
                        </View>

                        {/* Fee Preview */}
                        {amount && !amountError && selectedOption && (
                            <View className="p-8 bg-gray-950/50 rounded-3xl border border-gray-700 space-y-4">
                                <View className="flex-row justify-between py-4 border-b border-gray-700">
                                    <Text className="text-gray-400 text-2xl font-semibold">Withdrawal Amount</Text>
                                    <Text className="text-3xl font-bold text-white">${amount}</Text>
                                </View>
                                <View className="flex-row justify-between py-4 border-b border-gray-700">
                                    <Text className="text-gray-400 text-2xl font-semibold">Fee ({selectedOption.fee})</Text>
                                    <Text className="text-3xl font-bold text-red-400">
                                        -${calculateFee().toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between py-6 border-t border-gray-700 pt-6">
                                    <Text className="text-gray-400 text-3xl font-bold">You'll Receive</Text>
                                    <Text className="text-4xl font-bold text-green-400">
                                        ${calculateNetAmount().toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Crypto Details */}
                    {withdrawalMethod === 'crypto' && (
                        <View className="bg-gray-900/30 rounded-3xl p-8 mb-10 border border-gray-700/50 backdrop-blur-sm">
                            <Text className="text-2xl font-bold text-white mb-8">Cryptocurrency Details</Text>

                            {/* Crypto Selection */}
                            <View className="mb-8">
                                <Text className="text-gray-400 text-xl font-semibold mb-6">Select Cryptocurrency</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
                                    {cryptoOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => {
                                                setSelectedCrypto(option.value);
                                                setWalletNetwork(option.network);
                                            }}
                                            className={`p-8 rounded-3xl border-2 w-72 min-w-[280px] items-center justify-center ${selectedCrypto === option.value
                                                    ? 'bg-gradient-to-br from-orange-500/20 to-orange-400/20 border-orange-500 shadow-lg shadow-orange-500/25'
                                                    : 'bg-gray-900/30 border-gray-700/50 hover:border-gray-600'
                                                }`}
                                        >
                                            <Text className="text-3xl font-bold text-white mb-3">{option.label}</Text>
                                            <Text className="text-xl text-gray-400 mb-2">{option.network}</Text>
                                            <Text className="text-lg text-gray-500">Min: ${option.minWithdrawal}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Wallet Address */}
                            <View className="mb-6">
                                <Text className="text-gray-400 text-xl font-semibold mb-4">Wallet Address</Text>
                                <TextInput
                                    value={walletAddress}
                                    onChangeText={setWalletAddress}
                                    placeholder="Enter your wallet address"
                                    placeholderTextColor="#6b7280"
                                    className="px-6 py-6 text-xl text-white bg-gray-950 border-2 border-gray-800 rounded-3xl"
                                />
                            </View>

                            {/* Network */}
                            <View>
                                <Text className="text-gray-400 text-xl font-semibold mb-4">Network</Text>
                                <TextInput
                                    value={walletNetwork}
                                    editable={false}
                                    className="px-6 py-6 text-xl text-white bg-gray-950/70 border-2 border-gray-700 rounded-3xl"
                                />
                            </View>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={loading || !amount || amountError}
                        className={`rounded-3xl py-8 items-center shadow-2xl ${loading || !amount || amountError
                                ? 'bg-gray-700/50 shadow-none'
                                : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-orange-500/40'
                            }`}
                    >
                        {loading ? (
                            <View className="flex-row items-center gap-4">
                                <ActivityIndicator size="large" color="#ffffff" />
                                <Text className="text-white font-bold text-2xl">Processing...</Text>
                            </View>
                        ) : (
                            <Text className="text-white font-bold text-2xl">Submit Withdrawal Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Withdrawal;
