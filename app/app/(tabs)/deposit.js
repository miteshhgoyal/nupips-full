import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    TextInput,
    Image,
} from "react-native";
import { useAuth } from '@/context/authContext';
import api from '@/services/api';
import * as Clipboard from 'expo-clipboard';
import {
    Wallet,
    DollarSign,
    Copy,
    Check,
    Info,
    RefreshCw,
    Clock,
    CheckCircle,
    AlertCircle,
} from "lucide-react-native";
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

const Deposit = () => {
    const router = useRouter();
    const { user, checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [amount, setAmount] = useState('');
    const [amountError, setAmountError] = useState('');
    const [selectedCrypto, setSelectedCrypto] = useState('bep20/usdt');

    // Payment state
    const [step, setStep] = useState(1);
    const [paymentAddress, setPaymentAddress] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [transactionId, setTransactionId] = useState(null);
    const [copied, setCopied] = useState(false);

    // Checking payment status
    const [checkingPayment, setCheckingPayment] = useState(false);
    const [depositDetails, setDepositDetails] = useState(null);

    const cryptoOptions = [
        {
            value: 'bep20/usdt',
            label: 'USDT (BEP20)',
            network: 'Binance Smart Chain',
            fee: '0%',
            minDeposit: 10,
            processingTime: '5-15 minutes',
        },
        {
            value: 'trc20/usdt',
            label: 'USDT (TRC20)',
            network: 'TRON',
            fee: '0%',
            minDeposit: 10,
            processingTime: '5-10 minutes',
        },
    ];

    const selectedOption = cryptoOptions.find((opt) => opt.value === selectedCrypto);

    const validateAmount = (value) => {
        const numValue = parseFloat(value);
        if (!value || numValue <= 0) {
            setAmountError('Please enter a valid amount');
            return false;
        }

        if (numValue < selectedOption.minDeposit) {
            setAmountError(`Minimum deposit is $${selectedOption.minDeposit}`);
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

    const handleContinue = async () => {
        if (!validateAmount(amount)) return;

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/deposit/create', {
                amount: parseFloat(amount),
                currency: 'USD',
                paymentMethod: 'blockbee-crypto',
                crypto: selectedCrypto,
            });

            if (response.data.success) {
                setPaymentAddress(response.data.data.address);
                setQrCodeUrl(response.data.data.qrCodeUrl);
                setTransactionId(response.data.data.transactionId);
                setDepositDetails(response.data.data);
                setStep(2);
            } else {
                setError(response.data.message || 'Failed to create deposit');
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.response?.data?.error ||
                'Failed to create deposit'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCheckPayment = async () => {
        if (!transactionId) return;

        setCheckingPayment(true);
        setError(null);

        try {
            const response = await api.get(`/deposit/status/${transactionId}`);

            if (response.data.success) {
                const deposit = response.data.data;
                setDepositDetails(deposit);

                if (deposit.status === 'completed') {
                    await checkAuth();
                    setStep(3);
                } else if (deposit.status === 'failed' || deposit.status === 'cancelled') {
                    setError(`Deposit ${deposit.status}. Please try again.`);
                } else {
                    const statusMessage =
                        deposit.blockBeeStatus === 'pending_payment'
                            ? 'Waiting for payment...'
                            : deposit.blockBeeStatus === 'pending_confirmation'
                                ? 'Payment detected, waiting for confirmations...'
                                : `Status: ${deposit.status}`;
                    setError(statusMessage);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to check payment status');
        } finally {
            setCheckingPayment(false);
        }
    };

    const copyToClipboard = async (text) => {
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetDeposit = () => {
        setStep(1);
        setAmount('');
        setPaymentAddress(null);
        setQrCodeUrl(null);
        setTransactionId(null);
        setDepositDetails(null);
        setError(null);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-4">
                <View className="flex-row items-center gap-3 mb-2">
                    <Wallet size={28} color="#ea580c" />
                    <Text className="text-2xl font-bold text-white flex-1">Deposit Funds</Text>
                </View>
                <Text className="text-gray-400 text-sm">Add funds to your wallet</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-4 py-6 pb-24">
                    {/* Current Balance */}
                    {user && (
                        <View className="bg-gradient-to-r from-orange-600/20 to-orange-500/20 rounded-2xl p-6 mb-8 border border-orange-600/30">
                            <View className="flex-row items-center gap-3 mb-3">
                                <Wallet size={24} color="#ffffff" />
                                <Text className="text-lg font-semibold text-white">Current Balance</Text>
                            </View>
                            <Text className="text-4xl font-bold text-white">
                                ${parseFloat(user.walletBalance || 0).toFixed(2)}
                            </Text>
                        </View>
                    )}

                    {/* Error Alert */}
                    {error && (
                        <View className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-red-400 text-sm flex-1">{error}</Text>
                            <TouchableOpacity onPress={() => setError(null)}>
                                <X size={20} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Step 1: Amount and Crypto Selection */}
                    {step === 1 && (
                        <>
                            {/* Amount Input */}
                            <View className="bg-gray-800/40 rounded-2xl p-6 mb-6 border border-gray-700/30">
                                <Text className="text-xl font-semibold text-white mb-6">Deposit Amount</Text>

                                <View className="mb-6">
                                    <Text className="text-gray-400 text-sm font-medium mb-3">Amount (USD)</Text>
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
                                            className={`pl-12 pr-4 py-4 text-lg text-white rounded-2xl ${amountError
                                                    ? 'bg-red-500/20 border-2 border-red-500/30'
                                                    : 'bg-gray-900 border-2 border-gray-700'
                                                }`}
                                        />
                                    </View>
                                    {amountError && (
                                        <View className="flex-row items-center gap-2 mt-3">
                                            <AlertCircle size={16} color="#ef4444" />
                                            <Text className="text-sm text-red-400">{amountError}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Quick amount buttons */}
                                <View className="flex-row flex-wrap gap-3">
                                    {[10, 50, 100, 500, 1000].map((quickAmount) => (
                                        <TouchableOpacity
                                            key={quickAmount}
                                            onPress={() => {
                                                setAmount(quickAmount.toString());
                                                validateAmount(quickAmount.toString());
                                            }}
                                            className="flex-1 px-6 py-4 bg-gray-800/50 border border-gray-700 rounded-xl items-center"
                                        >
                                            <Text className="text-white font-semibold text-lg">${quickAmount}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/* Crypto Selection */}
                            <View className="bg-gray-800/40 rounded-2xl p-6 mb-8 border border-gray-700/30">
                                <Text className="text-xl font-semibold text-white mb-6">Select Cryptocurrency</Text>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-4">
                                    {cryptoOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setSelectedCrypto(option.value)}
                                            className={`p-6 rounded-2xl border-2 w-72 min-w-[280px] ${selectedCrypto === option.value
                                                    ? 'border-orange-500 bg-orange-500/10'
                                                    : 'border-gray-700 bg-gray-800/30'
                                                }`}
                                        >
                                            <Text className="font-bold text-white text-lg mb-2">{option.label}</Text>
                                            <Text className="text-gray-400 mb-4">{option.network}</Text>

                                            <View className="space-y-2">
                                                <View className="flex-row justify-between">
                                                    <Text className="text-xs text-gray-400">Fee:</Text>
                                                    <Text className="text-sm font-semibold text-green-400">
                                                        {option.fee}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-xs text-gray-400">Min deposit:</Text>
                                                    <Text className="text-sm font-semibold text-white">
                                                        ${option.minDeposit}
                                                    </Text>
                                                </View>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-xs text-gray-400">Processing:</Text>
                                                    <Text className="text-sm font-semibold text-white">
                                                        {option.processingTime}
                                                    </Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Continue Button */}
                            <TouchableOpacity
                                onPress={handleContinue}
                                disabled={loading || !amount || amountError}
                                className={`rounded-2xl py-5 items-center ${loading || !amount || amountError
                                        ? 'bg-gray-700/50'
                                        : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                    }`}
                            >
                                {loading ? (
                                    <View className="flex-row items-center gap-3">
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text className="text-white font-bold text-lg">Processing...</Text>
                                    </View>
                                ) : (
                                    <Text className="text-white font-bold text-lg">Continue to Payment</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Step 2: Payment Details */}
                    {step === 2 && paymentAddress && (
                        <View className="bg-gray-800/40 rounded-2xl p-6 border border-gray-700/30">
                            <View className="items-center mb-8">
                                <View className="w-20 h-20 bg-orange-500/20 rounded-2xl items-center justify-center mb-4">
                                    <Clock size={36} color="#ea580c" />
                                </View>
                                <Text className="text-3xl font-bold text-white mb-3">Send Payment</Text>
                                <Text className="text-gray-400 text-center text-lg">
                                    Send exactly <Text className="font-bold text-white">{amount} USD</Text> worth of{' '}
                                    <Text className="font-bold text-white">{selectedOption.label}</Text>
                                </Text>
                            </View>

                            {/* QR Code */}
                            {qrCodeUrl && (
                                <View className="items-center mb-8">
                                    <View className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                        <Image
                                            source={{ uri: qrCodeUrl }}
                                            style={{ width: 240, height: 240 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Payment Address */}
                            <View className="mb-8">
                                <Text className="text-gray-400 text-sm font-medium mb-4">Payment Address</Text>
                                <View className="flex-row gap-3">
                                    <View className="flex-1 px-4 py-4 bg-gray-900 border border-gray-700 rounded-2xl">
                                        <Text
                                            className="text-white text-xs font-mono"
                                            numberOfLines={2}
                                        >
                                            {paymentAddress}
                                        </Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => copyToClipboard(paymentAddress)}
                                        className="w-16 h-16 bg-gray-700/50 border border-gray-600 rounded-2xl items-center justify-center"
                                    >
                                        {copied ? (
                                            <Check size={24} color="#22c55e" />
                                        ) : (
                                            <Copy size={24} color="#9ca3af" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Transaction ID */}
                            <View className="mb-8 p-5 bg-gray-900/50 rounded-2xl border border-gray-700">
                                <Text className="text-gray-400 text-sm mb-2">Transaction ID</Text>
                                <Text className="font-mono text-xs text-white">{transactionId}</Text>
                            </View>

                            {/* Info Alert */}
                            <View className="p-5 bg-blue-500/10 border border-blue-500/30 rounded-2xl mb-8 flex-row items-start gap-3">
                                <Info size={20} color="#3b82f6" />
                                <View className="flex-1">
                                    <Text className="text-sm font-semibold text-blue-400 mb-3">Important:</Text>
                                    <Text className="text-xs text-blue-400 leading-5">
                                        • Send exactly the amount specified{'\n'}
                                        • Use the {selectedOption.network} network{'\n'}
                                        • Payment will be confirmed in {selectedOption.processingTime}{'\n'}
                                        • Do not send from an exchange directly
                                    </Text>
                                </View>
                            </View>

                            {/* Check Payment Button */}
                            <TouchableOpacity
                                onPress={handleCheckPayment}
                                disabled={checkingPayment}
                                className={`rounded-2xl py-5 items-center ${checkingPayment ? 'bg-gray-700/50' : 'bg-gradient-to-r from-orange-600 to-orange-500 shadow-lg'
                                    }`}
                            >
                                {checkingPayment ? (
                                    <View className="flex-row items-center gap-3">
                                        <ActivityIndicator size="small" color="#ffffff" />
                                        <Text className="text-white font-bold text-lg">Checking...</Text>
                                    </View>
                                ) : (
                                    <View className="flex-row items-center gap-3">
                                        <RefreshCw size={24} color="#ffffff" />
                                        <Text className="text-white font-bold text-lg">Check Payment Status</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            {/* Status Info */}
                            {depositDetails && (
                                <View className="mt-6 items-center">
                                    <Text className="text-sm text-gray-400">
                                        Status:{' '}
                                        <Text className="font-semibold capitalize text-white">
                                            {depositDetails.blockBeeStatus || depositDetails.status}
                                        </Text>
                                    </Text>
                                    {depositDetails.confirmations > 0 && (
                                        <Text className="text-sm text-gray-400 mt-2">
                                            Confirmations: {depositDetails.confirmations}/3
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && (
                        <View className="bg-gray-800/40 rounded-2xl p-8 items-center border border-gray-700/30">
                            <View className="w-24 h-24 bg-green-500/20 rounded-2xl items-center justify-center mb-6">
                                <CheckCircle size={48} color="#22c55e" />
                            </View>
                            <Text className="text-3xl font-bold text-white mb-4">Deposit Successful!</Text>
                            <Text className="text-gray-400 text-center text-lg mb-8">
                                Your deposit of <Text className="font-bold text-white">${amount}</Text> has been confirmed
                            </Text>

                            <View className="w-full p-6 bg-gray-900/50 rounded-2xl mb-8 border border-gray-700">
                                <View className="space-y-3">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400">Amount:</Text>
                                        <Text className="text-white font-bold text-xl">${amount}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400">Method:</Text>
                                        <Text className="text-white font-bold">{selectedOption.label}</Text>
                                    </View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-400">New Balance:</Text>
                                        <Text className="text-green-400 font-bold text-xl">
                                            ${parseFloat(user?.walletBalance || 0).toFixed(2)}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="gap-4 w-full">
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/dashboard')}
                                    className="bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl py-5 items-center shadow-lg"
                                >
                                    <Text className="text-white font-bold text-lg">Go to Dashboard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={resetDeposit}
                                    className="border-2 border-gray-700 rounded-2xl py-5 items-center bg-gray-800/50"
                                >
                                    <Text className="text-white font-bold text-lg">Make Another Deposit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Deposit;
