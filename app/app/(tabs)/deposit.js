import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    TouchableOpacity,
    Image,
} from 'react-native';
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
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

// Import Components
import InputField from '@/components/InputField';
import QuickAmountButton from '@/components/QuickAmountButton';
import CryptoOptionCard from '@/components/CryptoOptionCard';
import DetailRow from '@/components/DetailRow';

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

    const handleContinue = async () => {
        const isValid = await new Promise((resolve) => {
            setTimeout(() => {
                const valid = !amountError && amount && validateAmount(amount);
                resolve(valid);
            }, 100);
        });

        if (!isValid) return;

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

                const primaryQr = data.qrCodeUrl;
                const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
                    data.address
                )}&format=png&qzone=1`;

                setQrCodeUrl(primaryQr || fallbackQr);
                setQrLoaded(false);
                setQrError(false);
                setStep(2);
            } else {
                setError(response.data?.message || 'Failed to create deposit');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create deposit. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleQrError = () => {
        if (!qrError && paymentAddress) {
            const fallbackQr = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
                paymentAddress
            )}&format=png&qzone=1`;
            setQrCodeUrl(fallbackQr);
            setQrError(true);
            setQrLoaded(false);
        }
    };

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
                        <Text className="text-2xl font-bold text-white">Deposit Funds</Text>
                        <Text className="text-sm text-neutral-400 mt-0.5">Add funds to your wallet</Text>
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
                    <View className="mx-5 mt-6 mb-6">
                        <View className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-12 h-12 bg-orange-500/20 rounded-xl items-center justify-center mr-4">
                                        <Wallet size={22} color="#ea580c" />
                                    </View>
                                    <View>
                                        <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-1">
                                            Current Balance
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

                {/* Step 1: Amount Selection */}
                {step === 1 && (
                    <View className="px-5">
                        {/* Amount Input Card */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-5">
                            <Text className="text-xl font-bold text-white mb-5">Deposit Amount</Text>

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
                            <View className="flex-row gap-2 flex-wrap">
                                {[10, 50, 100, 500, 1000].map((quickAmount) => (
                                    <QuickAmountButton
                                        key={quickAmount}
                                        amount={quickAmount}
                                        isActive={parseFloat(amount) === quickAmount}
                                        onPress={() => handleQuickAmount(quickAmount)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Crypto Selection Card */}
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 mb-6">
                            <Text className="text-xl font-bold text-white mb-5">Select Cryptocurrency</Text>

                            <View className="gap-3">
                                {cryptoOptions.map((option) => (
                                    <CryptoOptionCard
                                        key={option.value}
                                        option={option}
                                        isSelected={selectedCrypto === option.value}
                                        onPress={() => setSelectedCrypto(option.value)}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Continue Button */}
                        <TouchableOpacity
                            onPress={handleContinue}
                            disabled={loading || !amount || !!amountError}
                            className={`rounded-xl py-5 items-center ${loading || !amount || !!amountError ? 'bg-neutral-800/50' : 'bg-orange-500'
                                }`}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <View className="flex-row items-center gap-3">
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text className="text-white font-bold text-lg">Processing...</Text>
                                </View>
                            ) : (
                                <Text className="text-white font-bold text-lg">Continue to Payment</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                )}

                {/* Step 2: Payment Instructions */}
                {step === 2 && paymentAddress && (
                    <View className="px-5">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                            {/* Header */}
                            <View className="items-center mb-7">
                                <View className="w-18 h-18 bg-orange-500/20 border border-orange-500/30 rounded-2xl items-center justify-center mb-4">
                                    <Clock size={32} color="#ea580c" />
                                </View>
                                <Text className="text-2xl font-bold text-white mb-2.5">Send Payment</Text>
                                <Text className="text-neutral-400 text-base text-center leading-6">
                                    Send exactly <Text className="font-bold text-white">${amount}</Text> worth of{'\n'}
                                    <Text className="font-bold text-white">{selectedOption?.label}</Text> to the address
                                    below
                                </Text>
                            </View>

                            {/* QR Code */}
                            <View className="items-center mb-6">
                                <View className="p-5 bg-white rounded-2xl">
                                    {!qrLoaded && (
                                        <View className="w-60 h-60 items-center justify-center bg-neutral-100 rounded-xl">
                                            <ActivityIndicator size="large" color="#ea580c" />
                                            <Text className="text-neutral-600 text-xs mt-3 font-medium">Loading QR Code...</Text>
                                        </View>
                                    )}
                                    <Image
                                        source={{ uri: qrCodeUrl }}
                                        className="w-60 h-60 rounded-xl"
                                        style={{ display: qrLoaded ? 'flex' : 'none' }}
                                        onLoad={() => setQrLoaded(true)}
                                        onError={handleQrError}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>

                            {/* Payment Address */}
                            <View className="mb-6">
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-3">
                                    Payment Address
                                </Text>
                                <View className="bg-black/40 border border-neutral-800 rounded-xl p-4">
                                    <View className="flex-row items-center justify-between">
                                        <Text
                                            className="text-white text-sm font-mono flex-1 mr-3 leading-5"
                                            numberOfLines={2}
                                        >
                                            {paymentAddress}
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => copyToClipboard(paymentAddress)}
                                            className={`p-2.5 rounded-xl ${copied ? 'bg-green-500/20 border border-green-500/30' : 'bg-neutral-800 border border-neutral-700'
                                                }`}
                                            activeOpacity={0.7}
                                        >
                                            {copied ? <Check size={20} color="#22c55e" /> : <Copy size={20} color="#9ca3af" />}
                                        </TouchableOpacity>
                                    </View>
                                    {copied && (
                                        <Text className="text-green-400 text-xs font-bold mt-2">
                                            Address copied to clipboard!
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Transaction ID */}
                            <View className="mb-6 p-4 bg-black/40 border border-neutral-800 rounded-xl">
                                <Text className="text-xs font-bold text-neutral-400 uppercase tracking-wide mb-2">
                                    Transaction ID
                                </Text>
                                <Text className="font-mono text-xs text-neutral-300 leading-5" numberOfLines={2}>
                                    {transactionId}
                                </Text>
                            </View>

                            {/* Important Info */}
                            <View className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl mb-6">
                                <View className="flex-row items-start">
                                    <Info size={20} color="#3b82f6" style={{ marginTop: 2, marginRight: 12 }} />
                                    <View className="flex-1">
                                        <Text className="text-blue-400 font-bold text-sm mb-2">
                                            Important Information
                                        </Text>
                                        <View className="gap-1.5">
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
                            <View className="gap-3">
                                <TouchableOpacity
                                    onPress={handleCheckPayment}
                                    disabled={checkingPayment}
                                    className={`py-5 rounded-xl items-center flex-row justify-center gap-2.5 ${checkingPayment ? 'bg-green-500/50' : 'bg-green-500'
                                        }`}
                                    activeOpacity={0.7}
                                >
                                    {checkingPayment ? (
                                        <>
                                            <ActivityIndicator size="small" color="#fff" />
                                            <Text className="text-white font-bold text-base">Checking Status...</Text>
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw size={20} color="#fff" style={{ marginRight: 4 }} />
                                            <Text className="text-white font-bold text-base">Check Payment Status</Text>
                                        </>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={resetDeposit}
                                    className="py-5 rounded-xl items-center bg-neutral-800 border border-neutral-700"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-neutral-300 font-bold text-base">
                                        Change Amount or Method
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Status Info */}
                            {depositDetails && (
                                <View className="mt-5 pt-5 border-t border-neutral-800">
                                    <Text className="text-center text-sm text-neutral-400 mb-2 font-bold uppercase tracking-wide">
                                        Current Status
                                    </Text>
                                    <Text className="text-center text-base font-bold text-white capitalize">
                                        {depositDetails.blockBeeStatus || depositDetails.status}
                                    </Text>
                                    {depositDetails.confirmations > 0 && (
                                        <Text className="text-center text-sm text-neutral-400 mt-2 font-medium">
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
                    <View className="px-5">
                        <View className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 items-center">
                            <View className="w-24 h-24 bg-green-500/20 border border-green-500/30 rounded-2xl items-center justify-center mb-5">
                                <CheckCircle size={52} color="#10b981" />
                            </View>

                            <Text className="text-3xl font-bold text-white mb-3 text-center">Deposit Successful!</Text>

                            <Text className="text-neutral-400 text-base mb-7 text-center leading-6">
                                ${amount} has been credited to your account
                            </Text>

                            {/* Details Card */}
                            <View className="w-full bg-black/40 border border-neutral-800 rounded-xl p-5 mb-8">
                                <DetailRow label="Amount Deposited" value={`$${amount}`} />
                                <DetailRow label="Payment Method" value={selectedOption?.label} />
                                <DetailRow
                                    label="New Balance"
                                    value={`$${parseFloat(user?.walletBalance || 0).toFixed(2)}`}
                                    valueColor="text-green-400"
                                />
                                <View className="pt-3 border-t border-neutral-800">
                                    <Text className="text-neutral-400 text-xs font-bold uppercase tracking-wide mb-2">
                                        Transaction ID
                                    </Text>
                                    <Text className="text-neutral-300 font-mono text-xs" numberOfLines={1}>
                                        {transactionId}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Buttons */}
                            <View className="w-full gap-3">
                                <TouchableOpacity
                                    onPress={resetDeposit}
                                    className="py-5 rounded-xl items-center bg-green-500"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-white font-bold text-lg">Make Another Deposit</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => router.back()}
                                    className="py-5 rounded-xl items-center bg-neutral-800 border border-neutral-700"
                                    activeOpacity={0.7}
                                >
                                    <Text className="text-neutral-300 font-bold text-base">Back to Wallet</Text>
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