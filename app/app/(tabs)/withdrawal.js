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

// Import Components
import InputField from '@/components/InputField';
import QuickAmountButton from '@/components/QuickAmountButton';
import DetailRow from '@/components/DetailRow';

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

    const handleWithdraw = async () => {
        const isValid = await new Promise((resolve) => {
            setTimeout(() => {
                const valid = !amountError && amount && validateAmount(amount);
                resolve(valid);
            }, 100);
        });

        if (!isValid) return;

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
            <SafeAreaView className="flex-1 bg-[#0a0a0a]">
                <StatusBar style="light" />

                {/* Header */}
                <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                    <Text className="text-2xl font-bold text-white">Withdrawal Submitted</Text>
                    <Text className="text-sm text-neutral-400 mt-0.5">Your request is being processed</Text>
                </View>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Success Card */}
                    <View className="px-5 mt-6 mb-6">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 items-center">
                            <View className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-2xl items-center justify-center mb-5">
                                <CheckCircle size={52} color="#10b981" />
                            </View>

                            <Text className="text-3xl font-bold text-white mb-3 text-center">
                                Withdrawal Submitted!
                            </Text>

                            <Text className="text-neutral-400 text-base mb-7 text-center leading-6">
                                ${amount} will be processed within {selectedOption?.processingTime}
                            </Text>

                            {/* Details Card */}
                            <View className="w-full bg-black/40 border border-neutral-800 rounded-xl p-5 mb-8">
                                <DetailRow label="Amount" value={`$${amount}`} />
                                <DetailRow label="Fee" value={`-$${calculateFee().toFixed(2)}`} valueColor="text-red-400" />
                                <DetailRow label="Net Amount" value={`$${calculateNetAmount().toFixed(2)}`} valueColor="text-green-400" />
                                <View className="pt-3 border-t border-neutral-800">
                                    <Text className="text-neutral-400 text-xs font-bold uppercase tracking-wide mb-2">
                                        Transaction ID
                                    </Text>
                                    <Text className="text-neutral-300 font-mono text-xs" numberOfLines={1}>
                                        {withdrawalDetails.transactionId}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="w-full gap-3">
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)')}
                                    className="py-5 rounded-xl items-center bg-green-500"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold text-lg">Go to Dashboard</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={resetWithdrawal}
                                    className="py-5 rounded-xl items-center bg-neutral-800 border border-neutral-700"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-neutral-300 font-bold text-base">Make Another Withdrawal</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={20} color="#fff" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-bold text-white">Withdraw Funds</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">Transfer funds from your wallet</Text>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Balance Card */}
                {user && (
                    <View className="mx-5 mt-6 mb-6">
                        <View className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                        <Wallet size={22} color="#ea580c" />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">
                                            Available Balance
                                        </Text>
                                        <Text className="text-3xl font-bold text-white">
                                            ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                                <View className="w-10 h-10 bg-orange-500/10 rounded-full items-center justify-center">
                                    <TrendingUp size={20} color="#ea580c" />
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Error Alert */}
                {error && (
                    <View className="mx-5 mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl">
                        <View className="flex-row items-start">
                            <AlertCircle size={20} color="#ef4444" style={{ marginTop: 2, marginRight: 12 }} />
                            <View className="flex-1">
                                <Text className="text-red-400 text-sm font-medium leading-5">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError(null)}>
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Withdrawal Method */}
                <View className="px-5 mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <Text className="text-xl font-bold text-white mb-5">Withdrawal Method</Text>
                        <TouchableOpacity
                            onPress={() => setWithdrawalMethod('crypto')}
                            className={`p-6 rounded-xl border-2 items-center ${withdrawalMethod === 'crypto'
                                    ? 'bg-orange-500/10 border-orange-500'
                                    : 'bg-black/40 border-neutral-800'
                                }`}
                            activeOpacity={0.7}
                        >
                            <Bitcoin size={32} color="#ea580c" style={{ marginBottom: 12 }} />
                            <Text className="font-bold text-white text-lg mb-2">Cryptocurrency</Text>
                            <Text className="text-neutral-400 text-xs text-center">Fast & secure withdrawals</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Amount Input */}
                <View className="px-5 mb-6">
                    <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                        <Text className="text-xl font-bold text-white mb-5">Withdrawal Amount</Text>

                        <InputField
                            label="Amount (USD)"
                            value={amount}
                            onChangeText={handleAmountChange}
                            placeholder="0.00"
                            keyboardType="decimal-pad"
                            error={amountError}
                            icon={DollarSign}
                        />

                        {/* Quick Amounts */}
                        <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                            Quick Select
                        </Text>
                        <View className="flex-row gap-2 mb-5">
                            {[10, 50, 100, 500].map((quickAmount) => (
                                <QuickAmountButton
                                    key={quickAmount}
                                    amount={quickAmount}
                                    isActive={parseFloat(amount) === quickAmount}
                                    onPress={() => handleQuickAmount(quickAmount)}
                                />
                            ))}
                        </View>

                        {/* Fee Preview */}
                        {amount && !amountError && selectedOption && (
                            <View className="p-4 bg-black/40 border border-neutral-800 rounded-xl gap-2.5">
                                <View className="flex-row justify-between">
                                    <Text className="text-neutral-400 text-xs">Amount</Text>
                                    <Text className="text-white font-bold text-sm">${amount}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-neutral-400 text-xs">Fee ({selectedOption.fee})</Text>
                                    <Text className="text-red-400 font-bold text-sm">
                                        -${calculateFee().toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between pt-2.5 border-t border-neutral-800">
                                    <Text className="text-neutral-400 text-xs font-bold">You'll Receive</Text>
                                    <Text className="text-green-400 font-bold text-sm">
                                        ${calculateNetAmount().toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Crypto Selection & Details */}
                {withdrawalMethod === 'crypto' && (
                    <View className="px-5 mb-6">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5">
                            <Text className="text-xl font-bold text-white mb-5">Cryptocurrency Details</Text>

                            {/* Crypto Selection */}
                            <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                                Select Network
                            </Text>
                            <View className="gap-3 mb-5">
                                {cryptoOptions.map((option) => (
                                    <TouchableOpacity
                                        key={option.value}
                                        onPress={() => {
                                            setSelectedCrypto(option.value);
                                            setWalletNetwork(option.network);
                                        }}
                                        className={`p-4 rounded-xl border-2 ${selectedCrypto === option.value
                                                ? 'bg-orange-500/10 border-orange-500'
                                                : 'bg-black/40 border-neutral-800'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <View className="flex-row items-center justify-between mb-3">
                                            <View>
                                                <Text className="text-white font-bold text-base mb-1">
                                                    {option.label}
                                                </Text>
                                                <Text className="text-neutral-400 text-xs">{option.network}</Text>
                                            </View>
                                            {selectedCrypto === option.value && (
                                                <View className="w-8 h-8 bg-orange-500 rounded-full items-center justify-center">
                                                    <Check size={18} color="#fff" />
                                                </View>
                                            )}
                                        </View>

                                        <View className="pt-3 border-t border-neutral-800 gap-1.5">
                                            <View className="flex-row justify-between">
                                                <Text className="text-neutral-400 text-xs">Min. Withdrawal</Text>
                                                <Text className="text-white text-xs font-bold">
                                                    ${option.minWithdrawal}
                                                </Text>
                                            </View>
                                            <View className="flex-row justify-between">
                                                <Text className="text-neutral-400 text-xs">Processing Time</Text>
                                                <Text className="text-white text-xs font-bold">
                                                    {option.processingTime}
                                                </Text>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Wallet Address */}
                            <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                                Wallet Address
                            </Text>
                            <TextInput
                                value={walletAddress}
                                onChangeText={setWalletAddress}
                                placeholder="Enter your wallet address"
                                placeholderTextColor="#6b7280"
                                className="px-4 py-4 text-base font-medium text-white bg-black/40 rounded-xl border-2 border-neutral-800"
                            />

                            <Text className="text-xs text-neutral-500 mt-3 font-medium">
                                Network: {walletNetwork || selectedOption?.network}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Submit Button */}
                <View className="px-5">
                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={loading || !amount || !!amountError || !walletAddress.trim()}
                        className={`py-5 rounded-xl items-center ${loading || !amount || !!amountError || !walletAddress.trim()
                                ? 'bg-neutral-800/50'
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
                            <Text className="text-white font-bold text-lg">Submit Withdrawal</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Withdrawal;