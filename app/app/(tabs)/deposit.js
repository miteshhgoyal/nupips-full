import React, { useState, useEffect, useRef } from "react";
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
    X,
    ArrowLeft,
    TrendingUp,
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

    // Timeout refs
    const amountTimeoutRef = useRef(null);
    const quickAmountTimeoutRef = useRef(null);

    // Payment state
    const [step, setStep] = useState(1);
    const [paymentAddress, setPaymentAddress] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [copied, setCopied] = useState(false);
    const [depositDetails, setDepositDetails] = useState(null);
    const [qrLoaded, setQrLoaded] = useState(false);
    const [qrError, setQrError] = useState(false);

    const [checkingPayment, setCheckingPayment] = useState(false);

    const cryptoOptions = [
        {
            value: 'bep20/usdt',
            label: 'USDT (BEP20)',
            network: 'Binance Smart Chain',
            fee: '0%',
            minDeposit: 10,
            processingTime: '5-15 min',
        },
        {
            value: 'trc20/usdt',
            label: 'USDT (TRC20)',
            network: 'TRON',
            fee: '0%',
            minDeposit: 10,
            processingTime: '5-10 min',
        },
    ];

    const selectedOption = cryptoOptions.find((opt) => opt.value === selectedCrypto);

    // Validation logic
    const validateAmount = (testAmount) => {
        const numValue = parseFloat(testAmount);
        if (!testAmount || numValue <= 0 || isNaN(numValue)) {
            setAmountError('Please enter a valid amount');
            return false;
        }
        if (numValue < selectedOption?.minDeposit) {
            setAmountError(`Minimum deposit is $${selectedOption.minDeposit}`);
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

    // Continue handler with QR fallback
    const handleContinue = async () => {
        console.log('Continue clicked - amount:', amount, 'error:', amountError);

        const isValid = await new Promise((resolve) => {
            setTimeout(() => {
                const valid = !amountError && amount && validateAmount(amount);
                console.log('Validation result:', valid);
                resolve(valid);
            }, 100);
        });

        if (!isValid) {
            console.log('Validation failed - blocking navigation');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post('/deposit/create', {
                amount: parseFloat(amount),
                currency: 'USD',
                paymentMethod: 'blockbee-crypto',
                crypto: selectedCrypto,
            });

            if (response.data?.success && response.data.data) {
                const data = response.data.data;
                setPaymentAddress(data.address || '');
                setTransactionId(data.transactionId || '');
                setDepositDetails(data);

                // Set QR with fallback
                const primaryQr = data.qrCodeUrl;
                const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(data.address)}&format=png&qzone=1`;

                setQrCodeUrl(primaryQr || fallbackQr);
                setQrLoaded(false);
                setQrError(false);
                setStep(2);
            } else {
                setError(response.data?.message || 'Failed to create deposit');
            }
        } catch (err) {
            console.log('Deposit error:', err.response?.data);
            setError(err.response?.data?.message || 'Failed to create deposit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // QR fallback handler
    const handleQrError = () => {
        if (!qrError && paymentAddress) {
            console.log('QR load failed, using fallback...');
            const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(paymentAddress)}&format=png&qzone=1`;
            setQrCodeUrl(fallbackQr);
            setQrError(true);
            setQrLoaded(false);
        }
    };

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (amountTimeoutRef.current) clearTimeout(amountTimeoutRef.current);
            if (quickAmountTimeoutRef.current) clearTimeout(quickAmountTimeoutRef.current);
        };
    }, []);

    const handleCheckPayment = async () => {
        if (!transactionId) return;

        setCheckingPayment(true);
        setError(null);

        try {
            const response = await api.get(`/deposit/status/${transactionId}`);

            if (response.data?.success) {
                const deposit = response.data.data;
                setDepositDetails(deposit);

                if (deposit.status === 'completed') {
                    await checkAuth();
                    setStep(3);
                } else {
                    const statusMessage = deposit.blockBeeStatus === 'pending_payment'
                        ? 'Waiting for payment...'
                        : deposit.blockBeeStatus === 'pending_confirmation'
                            ? 'Payment detected, waiting for confirmations...'
                            : `Status: ${deposit.status}`;
                    setError(statusMessage);
                }
            }
        } catch (err) {
            setError('Failed to check payment status');
        } finally {
            setCheckingPayment(false);
        }
    };

    const copyToClipboard = async (text) => {
        if (!text) return;
        await Clipboard.setStringAsync(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetDeposit = () => {
        setStep(1);
        setAmount('');
        setAmountError('');
        setPaymentAddress('');
        setQrCodeUrl('');
        setTransactionId('');
        setDepositDetails(null);
        setError(null);
        setQrLoaded(false);
        setQrError(false);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-3 p-2 -ml-2"
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <ArrowLeft size={22} color="#ffffff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">Deposit Funds</Text>
                            <Text className="text-sm text-gray-400 mt-0.5">Add funds to your wallet</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Current Balance Card */}
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
                                            Current Balance
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
                                <Text className="text-red-400 text-sm font-medium leading-1">{error}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setError(null)} className="ml-2 p-1">
                                <X size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Step 1: Amount Selection */}
                {step === 1 && (
                    <View className="px-4">
                        {/* Amount Input Card */}
                        <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 mb-5">
                            <Text className="text-xl font-bold text-white mb-5">Deposit Amount</Text>

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
                                {[10, 50, 100, 500, 1000].map((quickAmount) => {
                                    const isActive = parseFloat(amount) === quickAmount;
                                    return (
                                        <TouchableOpacity
                                            key={quickAmount}
                                            onPress={() => handleQuickAmount(quickAmount)}
                                            style={{
                                                flex: 1,
                                                minWidth: 65,
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
                        </View>

                        {/* Crypto Selection Card */}
                        <View className="bg-gray-800/50 rounded-2xl p-5 border border-gray-700/50 mb-6">
                            <Text className="text-xl font-bold text-white mb-5">Select Cryptocurrency</Text>

                            <View style={{ gap: 12 }}>
                                {cryptoOptions.map((option) => {
                                    const isSelected = selectedCrypto === option.value;
                                    return (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => setSelectedCrypto(option.value)}
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
                                                    <Text className="text-gray-400 text-xs">Network Fee</Text>
                                                    <Text className="text-emerald-400 text-xs font-semibold">{option.fee}</Text>
                                                </View>
                                                <View className="flex-row justify-between">
                                                    <Text className="text-gray-400 text-xs">Min. Deposit</Text>
                                                    <Text className="text-white text-xs font-semibold">${option.minDeposit}</Text>
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
                        </View>

                        {/* Continue Button */}
                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={loading || !amount || !!amountError}
                            style={{
                                borderRadius: 14,
                                paddingVertical: 18,
                                alignItems: 'center',
                                backgroundColor: loading || !amount || !!amountError ? 'rgba(55,65,81,0.4)' : '#ea580c',
                                opacity: loading || !amount || !!amountError ? 0.5 : 1,
                            }}
                        >
                            {loading ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <ActivityIndicator size="small" color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                                        Processing...
                                    </Text>
                                </View>
                            ) : (
                                <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 16 }}>
                                    Continue to Payment
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 2: Payment Instructions */}
                {step === 2 && paymentAddress && (
                    <View className="px-4">
                        <View className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                            {/* Header */}
                            <View style={{ alignItems: 'center', marginBottom: 28 }}>
                                <View style={{
                                    width: 72,
                                    height: 72,
                                    backgroundColor: 'rgba(234,88,12,0.15)',
                                    borderRadius: 16,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                }}>
                                    <Clock size={32} color="#ea580c" />
                                </View>
                                <Text style={{ fontSize: 24, fontWeight: '700', color: '#ffffff', marginBottom: 10 }}>
                                    Send Payment
                                </Text>
                                <Text style={{ color: '#9ca3af', fontSize: 15, textAlign: 'center', lineHeight: 22 }}>
                                    Send exactly <Text style={{ fontWeight: '700', color: '#ffffff' }}>${amount}</Text> worth of{'\n'}
                                    <Text style={{ fontWeight: '700', color: '#ffffff' }}>{selectedOption?.label}</Text> to the address below
                                </Text>
                            </View>

                            {/* QR Code */}
                            <View style={{ alignItems: 'center', marginBottom: 24 }}>
                                <View style={{
                                    padding: 20,
                                    backgroundColor: '#ffffff',
                                    borderRadius: 20,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 4 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 8,
                                    elevation: 8,
                                }}>
                                    {!qrLoaded && (
                                        <View style={{
                                            width: 240,
                                            height: 240,
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: '#f3f4f6',
                                            borderRadius: 12,
                                        }}>
                                            <ActivityIndicator size="large" color="#ea580c" />
                                            <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 12 }}>
                                                Loading QR Code...
                                            </Text>
                                        </View>
                                    )}
                                    <Image
                                        source={{ uri: qrCodeUrl }}
                                        style={{
                                            width: 240,
                                            height: 240,
                                            borderRadius: 12,
                                            display: qrLoaded ? 'flex' : 'none',
                                        }}
                                        onLoad={() => {
                                            setQrLoaded(true);
                                            console.log('QR Code loaded successfully');
                                        }}
                                        onError={handleQrError}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>

                            {/* Payment Address */}
                            <View className="mb-6">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                                    Payment Address
                                </Text>
                                <View className="bg-gray-900/70 border border-gray-700 rounded-xl p-4">
                                    <View className="flex-row items-center justify-between">
                                        <Text
                                            className="text-white text-sm font-mono flex-1 mr-3"
                                            numberOfLines={2}
                                            style={{ lineHeight: 20 }}
                                        >
                                            {paymentAddress}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => copyToClipboard(paymentAddress)}
                                            style={{
                                                padding: 10,
                                                backgroundColor: copied ? 'rgba(34,197,94,0.15)' : 'rgba(55,65,81,0.5)',
                                                borderRadius: 10,
                                            }}
                                        >
                                            {copied ? (
                                                <Check size={20} color="#22c55e" />
                                            ) : (
                                                <Copy size={20} color="#9ca3af" />
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                    {copied && (
                                        <Text className="text-emerald-400 text-xs font-medium mt-2">
                                            Address copied to clipboard!
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Transaction ID */}
                            <View className="mb-6 p-4 bg-gray-900/40 rounded-xl border border-gray-700/50">
                                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                    Transaction ID
                                </Text>
                                <Text className="font-mono text-xs text-gray-300 leading-5" numberOfLines={2}>
                                    {transactionId}
                                </Text>
                            </View>

                            {/* Important Info */}
                            <View className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-6">
                                <View className="flex-row items-start">
                                    <Info size={20} color="#3b82f6" style={{ marginTop: 2, marginRight: 12 }} />
                                    <View className="flex-1">
                                        <Text className="text-blue-400 font-semibold text-sm mb-2">
                                            Important Information
                                        </Text>
                                        <View style={{ gap: 6 }}>
                                            <Text className="text-blue-300 text-xs leading-5">
                                                • Send exactly the amount specified above
                                            </Text>
                                            <Text className="text-blue-300 text-xs leading-5">
                                                • Use {selectedOption?.network} network only
                                            </Text>
                                            <Text className="text-blue-300 text-xs leading-5">
                                                • Confirmation time: {selectedOption?.processingTime}
                                            </Text>
                                            <Text className="text-blue-300 text-xs leading-5">
                                                • Do not send from exchange wallets
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={handleCheckPayment}
                                    disabled={checkingPayment}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: checkingPayment ? 'rgba(0, 158, 24,0.3)' : 'rgb(0, 158, 24)',
                                        flexDirection: 'row',
                                        justifyContent: 'center',
                                        gap: 10,
                                    }}
                                >
                                    {checkingPayment ? (
                                        <>
                                            <ActivityIndicator size="small" color="#ffffff" />
                                            <Text className="text-white font-bold text-base">
                                                Checking Status...
                                            </Text>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={20} color="#ffffff" />
                                            <Text className="text-white font-bold text-base">
                                                Check Payment Status
                                            </Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={resetDeposit}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(55,65,81,0.5)',
                                        borderWidth: 1,
                                        borderColor: '#374151',
                                    }}
                                >
                                    <Text className="text-gray-300 font-semibold text-base">
                                        Change Amount or Method
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Status Info */}
                            {depositDetails && (
                                <View className="mt-5 pt-5 border-t border-gray-700/50">
                                    <Text className="text-center text-sm text-gray-400 mb-2">
                                        Current Status
                                    </Text>
                                    <Text className="text-center text-base font-semibold text-white capitalize">
                                        {depositDetails.blockBeeStatus || depositDetails.status}
                                    </Text>
                                    {depositDetails.confirmations > 0 && (
                                        <Text className="text-center text-sm text-gray-400 mt-2">
                                            Confirmations: {depositDetails.confirmations}/3
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    </View>
                )}

                {/* Step 3: Success */}
                {step === 3 && (
                    <View className="px-4">
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
                                Deposit Successful!
                            </Text>

                            <Text style={{ color: '#9ca3af', fontSize: 16, marginBottom: 28, textAlign: 'center' }}>
                                ${amount} has been credited to your account
                            </Text>

                            {/* Details Card */}
                            <View className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-5 mb-8" style={{ gap: 12 }}>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">Amount Deposited</Text>
                                    <Text className="text-white font-bold text-sm">${amount}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">Payment Method</Text>
                                    <Text className="text-white font-semibold text-sm">{selectedOption?.label}</Text>
                                </View>
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-400 text-sm">New Balance</Text>
                                    <Text className="text-emerald-400 font-bold text-sm">
                                        ${parseFloat(user?.walletBalance || 0).toFixed(2)}
                                    </Text>
                                </View>
                                <View className="pt-3 border-t border-gray-700/50">
                                    <Text className="text-gray-400 text-xs mb-1">Transaction ID</Text>
                                    <Text className="text-gray-300 font-mono text-xs" numberOfLines={1}>
                                        {transactionId}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="w-full" style={{ gap: 12 }}>
                                <TouchableOpacity
                                    onPress={resetDeposit}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: '#10b981',
                                    }}
                                >
                                    <Text className="text-white font-bold text-base">
                                        Make Another Deposit
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    style={{
                                        paddingVertical: 16,
                                        borderRadius: 12,
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(55,65,81,0.5)',
                                        borderWidth: 1,
                                        borderColor: '#374151',
                                    }}
                                >
                                    <Text className="text-gray-300 font-semibold text-base">
                                        Back to Wallet
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default Deposit;