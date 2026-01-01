import React, { useState, useEffect, useRef } from 'react';
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
    Wallet,
    DollarSign,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    X,
    TrendingUp,
    Check,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

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

    // Timeout refs
    const amountTimeoutRef = useRef(null);
    const quickAmountTimeoutRef = useRef(null);

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

    // Validation with proper state sync
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

    // Triple timeout strategy
    const handleAmountChange = (value) => {
        if (amountTimeoutRef.current) {
            clearTimeout(amountTimeoutRef.current);
        }

        setAmount(value);

        amountTimeoutRef.current = setTimeout(() => {
            if (value) {
                setTimeout(() => validateAmount(value), 50);
                setTimeout(() => validateAmount(value), 100);
            } else {
                setAmountError('');
            }
        }, 0);
    };

    // Quadruple timeout for quick amounts
    const handleQuickAmount = (quickAmount) => {
        if (quickAmountTimeoutRef.current) {
            clearTimeout(quickAmountTimeoutRef.current);
        }
        if (amountTimeoutRef.current) {
            clearTimeout(amountTimeoutRef.current);
        }

        const value = quickAmount.toString();
        setAmount(value);
        setAmountError('');

        quickAmountTimeoutRef.current = setTimeout(() => {
            setTimeout(() => validateAmount(value), 50);
            setTimeout(() => validateAmount(value), 100);
            setTimeout(() => validateAmount(value), 150);
        }, 0);
    };

    // Ultra safe continue handler
    const handleWithdraw = async () => {
        console.log('Withdraw clicked - amount:', amount, 'error:', amountError);

        const isValid = await new Promise((resolve) => {
            setTimeout(() => {
                const valid = !amountError && amount && validateAmount(amount);
                console.log('Validation result:', valid);
                resolve(valid);
            }, 100);
        });

        if (!isValid) {
            console.log('Validation failed - blocking withdrawal');
            return;
        }

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

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (amountTimeoutRef.current) clearTimeout(amountTimeoutRef.current);
            if (quickAmountTimeoutRef.current) clearTimeout(quickAmountTimeoutRef.current);
        };
    }, []);

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

                {/* Header */}
                <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                    <View>
                        <Text className="text-2xl font-bold text-white">Withdrawal Submitted</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">Your request is being processed</Text>
                    </View>
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Success Card */}
                    <View className="px-4 mt-5 mb-6">
                        <View className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50" style={{ alignItems: 'center' }}>
                            <View style={{
                                width: 96,
                                height: 96,
                                backgroundColor: 'rgba(16,185,129,0.15)',
                                borderRadius: 20,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: 20,
                            }}>
                                <CheckCircle size={52} color="#10b981" />
                            </View>

                            <Text style={{ fontSize: 28, fontWeight: '700', color: '#ffffff', marginBottom: 12, textAlign: 'center' }}>
                                Withdrawal Submitted!
                            </Text>

                            <Text style={{ color: '#9ca3af', fontSize: 16, marginBottom: 28, textAlign: 'center' }}>
                                ${amount} will be processed within {selectedOption?.processingTime}
                            </Text>

                            {/* Details Card */}
                            <View className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-5 mb-8" style={{ gap: 12 }}>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">Amount</Text>
                                    <Text className="text-white font-bold text-sm">${amount}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">Fee</Text>
                                    <Text className="text-red-400 font-semibold text-sm">-${calculateFee().toFixed(2)}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">Net Amount</Text>
                                    <Text className="text-emerald-400 font-bold text-sm">${calculateNetAmount().toFixed(2)}</Text>
                                </View>
                                <View className="pt-3 border-t border-gray-700/50">
                                    <Text className="text-gray-400 text-xs mb-1">Transaction ID</Text>
                                    <Text className="text-gray-300 font-mono text-xs" numberOfLines={1}>
                                        {withdrawalDetails.transactionId}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="w-full" style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/dashboard')}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: '#10b981',
                                    }}
                                >
                                    <Text className="text-white font-bold text-base">Go to Dashboard</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={resetWithdrawal}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(55,65,81,0.5)',
                                        borderWidth: 1,
                                        borderColor: '#374151',
                                    }}
                                >
                                    <Text className="text-gray-300 font-semibold text-base">Make Another Withdrawal</Text>
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
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#ffffff" style={{ marginRight: 12 }} />
                    <View>
                        <Text className="text-2xl font-bold text-white">Withdraw Funds</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">Transfer funds from your wallet</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Balance Card */}
                {user && (
                    <View className="mx-4 mt-5 mb-6">
                        <View className="bg-gradient-to-br from-orange-600/20 to-orange-500/10 rounded-2xl p-6 border border-orange-500/20">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                        <Wallet size={22} color="#f97316" />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                            Available Balance
                                        </Text>
                                        <Text className="text-3xl font-bold text-white">
                                            ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                <View className="w-10 h-10 bg-orange-500/10 rounded-full items-center justify-center">
                                    <TrendingUp size={20} color="#f97316" />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Error Alert */}
                {error && (
                    <View className="mx-4 mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                        <View className="flex-row items-center">
                            <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-sm font-medium leading-5">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError(null)} className="ml-2 p-1">
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Withdrawal Method */}
                <View className="px-4 mb-6">
                    <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                        <Text className="text-xl font-bold text-white mb-5">Withdrawal Method</Text>
                        <TouchableOpacity
                            onPress={() => setWithdrawalMethod('crypto')}
                            style={{
                                padding: 20,
                                borderRadius: 14,
                                borderWidth: 2,
                                alignItems: 'center',
                                borderColor: withdrawalMethod === 'crypto' ? '#ea580c' : '#374151',
                                backgroundColor: withdrawalMethod === 'crypto' ? 'rgba(234,88,12,0.08)' : 'rgba(17,24,39,0.3)',
                            }}
                        >
                            <Bitcoin size={32} color="#f97316" style={{ marginBottom: 12 }} />
                            <Text className="font-bold text-white text-lg mb-2">Cryptocurrency</Text>
                            <Text className="text-gray-400 text-xs text-center">Fast & secure withdrawals</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Amount Input */}
                <View className="px-4 mb-6">
                    <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                        <Text className="text-xl font-bold text-white mb-5">Withdrawal Amount</Text>

                        <View className="mb-5">
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Amount (USD)
                            </Text>
                            <View className="relative">
                                <View style={{ position: 'absolute', left: 16, top: 16, zIndex: 1 }}>
                                    <DollarSign size={20} color="#9ca3af" />
                                </View>
                                <TextInput
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    placeholder="0.00"
                                    placeholderTextColor="#6b7280"
                                    keyboardType="decimal-pad"
                                    style={{
                                        paddingLeft: 48,
                                        paddingRight: 16,
                                        paddingVertical: 16,
                                        fontSize: 18,
                                        fontWeight: '600',
                                        color: '#ffffff',
                                        backgroundColor: amountError ? 'rgba(239,68,68,0.05)' : 'rgba(17,24,39,0.5)',
                                        borderRadius: 12,
                                        borderWidth: 1.5,
                                        borderColor: amountError ? '#ef4444' : '#374151',
                                    }}
                                />
                            </View>
                            {amountError && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                    <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
                                    <Text className="text-xs text-red-400 font-medium">{amountError}</Text>
                                </View>
                            )}
                        </View>

                        {/* Quick Amounts */}
                        <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                            Quick Select
                        </Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                            {[10, 50, 100, 500].map((quickAmount) => {
                                const isActive = parseFloat(amount) === quickAmount;
                                return (
                                    <TouchableOpacity
                                        key={quickAmount}
                                        onPress={() => handleQuickAmount(quickAmount)}
                                        style={{
                                            flex: 1,
                                            minWidth: 70,
                                            paddingVertical: 12,
                                            borderRadius: 10,
                                            borderWidth: 1.5,
                                            alignItems: 'center',
                                            borderColor: isActive ? '#ea580c' : '#374151',
                                            backgroundColor: isActive ? '#ea580c' : 'rgba(17,24,39,0.5)',
                                        }}
                                    >
                                        <Text style={{
                                            fontWeight: '700',
                                            fontSize: 13,
                                            color: isActive ? '#ffffff' : '#9ca3af',
                                        }}>
                                            ${quickAmount}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Fee Preview */}
                        {amount && !amountError && selectedOption && (
                            <View className="mt-5 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <Text className="text-gray-400 text-xs">Amount</Text>
                                    <Text className="text-white font-semibold text-sm">${amount}</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
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
                </View>

                {/* Crypto Selection & Details */}
                {withdrawalMethod === 'crypto' && (
                    <View className="px-4 mb-6">
                        <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50">
                            <Text className="text-xl font-bold text-white mb-5">Cryptocurrency Details</Text>

                            {/* Crypto Selection */}
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Select Network
                            </Text>
                            <View style={{ gap: 12, marginBottom: 20 }}>
                                {cryptoOptions.map((option) => {
                                    const isSelected = selectedCrypto === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => {
                                                setSelectedCrypto(option.value);
                                                setWalletNetwork(option.network);
                                            }}
                                            style={{
                                                padding: 16,
                                                borderRadius: 14,
                                                borderWidth: 2,
                                                borderColor: isSelected ? '#ea580c' : '#374151',
                                                backgroundColor: isSelected ? 'rgba(234,88,12,0.08)' : 'rgba(17,24,39,0.3)',
                                            }}
                                        >
                                            <View className="flex-row items-center justify-between mb-3">
                                                <View>
                                                    <Text className="text-white font-bold text-base mb-1">
                                                        {option.label}
                                                    </Text>
                                                    <Text className="text-gray-400 text-xs">
                                                        {option.network}
                                                    </Text>
                                                </View>
                                                {isSelected && (
                                                    <View className="w-8 h-8 bg-orange-500 rounded-full items-center justify-center">
                                                        <Check size={18} color="#ffffff" />
                                                    </View>
                                                )}
                                            </View>

                                            <View className="pt-3 border-t border-gray-700/50" style={{ gap: 6 }}>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-gray-400 text-xs">Min. Withdrawal</Text>
                                                    <Text className="text-white text-xs font-semibold">${option.minWithdrawal}</Text>
                                                </View>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-gray-400 text-xs">Processing Time</Text>
                                                    <Text className="text-white text-xs font-semibold">{option.processingTime}</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Wallet Address */}
                            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                Wallet Address
                            </Text>
                            <TextInput
                                value={walletAddress}
                                onChangeText={setWalletAddress}
                                placeholder="Enter your wallet address"
                                placeholderTextColor="#6b7280"
                                style={{
                                    paddingHorizontal: 16,
                                    paddingVertical: 16,
                                    fontSize: 15,
                                    fontWeight: '500',
                                    color: '#ffffff',
                                    backgroundColor: 'rgba(17,24,39,0.5)',
                                    borderRadius: 12,
                                    borderWidth: 1.5,
                                    borderColor: '#374151',
                                }}
                            />

                            <Text className="text-xs text-gray-500 mt-3">
                                Network: {walletNetwork || selectedOption?.network}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Submit Button */}
                <View className="px-4">
                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={loading || !amount || !!amountError || !walletAddress.trim()}
                        style={{
                            paddingVertical: 18,
                            backgroundColor: loading || !amount || !!amountError || !walletAddress.trim() ? 'rgba(55,65,81,0.4)' : '#ea580c',
                            borderRadius: 14,
                            alignItems: 'center',
                            opacity: loading || !amount || !!amountError || !walletAddress.trim() ? 0.5 : 1,
                        }}
                        activeOpacity={0.7}
                    >
                        {loading ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
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