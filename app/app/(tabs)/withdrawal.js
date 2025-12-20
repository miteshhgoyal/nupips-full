import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Modal,
} from "react-native";
import { useAuth } from "@/context/authContext";
import api from "@/services/api";
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
} from "lucide-react-native";

// ============================================
// FEATURE FLAGS - Toggle features here
// ============================================
const FEATURES = {
    BANK_TRANSFER_ENABLED: false, // Set to true to enable bank transfer
};
// ============================================

const Withdrawal = ({ navigation }) => {
    const { user, checkAuth } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [amount, setAmount] = useState("");
    const [amountError, setAmountError] = useState("");
    const [withdrawalMethod, setWithdrawalMethod] = useState("crypto");
    const [selectedCrypto, setSelectedCrypto] = useState("bep20/usdt");

    // Crypto details
    const [walletAddress, setWalletAddress] = useState("");
    const [walletNetwork, setWalletNetwork] = useState("");

    // Bank details (only used when BANK_TRANSFER_ENABLED is true)
    const [bankName, setBankName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [accountHolder, setAccountHolder] = useState("");
    const [ifscCode, setIfscCode] = useState("");

    // Success state
    const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
    const [withdrawalDetails, setWithdrawalDetails] = useState(null);

    const cryptoOptions = [
        {
            value: "bep20/usdt",
            label: "USDT (BEP20)",
            network: "Binance Smart Chain",
            fee: "0.5%",
            minWithdrawal: "$10",
            processingTime: "1-24 hours",
        },
        {
            value: "trc20/usdt",
            label: "USDT (TRC20)",
            network: "TRON",
            fee: "0.5%",
            minWithdrawal: "$10",
            processingTime: "1-24 hours",
        },
    ];

    const selectedOption = cryptoOptions.find(
        (opt) => opt.value === selectedCrypto
    );

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
            setAmountError("Please enter a valid amount");
            return false;
        }

        if (numValue > (user?.walletBalance || 0)) {
            setAmountError("Insufficient balance");
            return false;
        }

        if (selectedOption) {
            const minAmount = parseFloat(
                selectedOption.minWithdrawal.replace("$", "")
            );
            if (numValue < minAmount) {
                setAmountError(`Minimum withdrawal is ${selectedOption.minWithdrawal}`);
                return false;
            }
        }

        setAmountError("");
        return true;
    };

    const handleAmountChange = (value) => {
        setAmount(value);
        if (value) {
            validateAmount(value);
        } else {
            setAmountError("");
        }
    };

    const handleWithdraw = async () => {
        if (!validateAmount(amount)) return;

        // Validate crypto details
        if (withdrawalMethod === "crypto") {
            if (!walletAddress.trim()) {
                setError("Please enter your wallet address");
                return;
            }
            if (!walletNetwork.trim()) {
                setError("Please select network");
                return;
            }
        }

        // Validate bank details (only if feature enabled)
        if (
            FEATURES.BANK_TRANSFER_ENABLED &&
            withdrawalMethod === "bank_transfer"
        ) {
            if (!bankName.trim() || !accountNumber.trim() || !accountHolder.trim()) {
                setError("Please fill in all bank details");
                return;
            }
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                amount: parseFloat(amount),
                currency: "USD",
                withdrawalMethod:
                    withdrawalMethod === "crypto" ? "blockbee-crypto" : "bank_transfer",
            };

            if (withdrawalMethod === "crypto") {
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

            const response = await api.post("/withdrawal/create", payload);

            if (response.data.success) {
                setWithdrawalDetails(response.data.data);
                setWithdrawalSuccess(true);
                await checkAuth();
            } else {
                setError(response.data.message || "Failed to create withdrawal");
            }
        } catch (err) {
            console.error("Withdrawal error:", err);
            setError(err.response?.data?.message || "Failed to process withdrawal");
        } finally {
            setLoading(false);
        }
    };

    if (withdrawalSuccess && withdrawalDetails) {
        return (
            <SafeAreaView className="flex-1 bg-gray-900">
                <ScrollView className="flex-1">
                    <View className="mx-4 my-8">
                        <View className="bg-gray-800 rounded-xl p-8 border border-gray-700 shadow-sm text-center">
                            <View className="w-20 h-20 bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} color="#22c55e" />
                            </View>
                            <Text className="text-2xl font-bold text-white mb-2">
                                Withdrawal Submitted!
                            </Text>
                            <Text className="text-gray-400 mb-6">
                                Your withdrawal request has been submitted for processing
                            </Text>

                            <View className="p-4 bg-gray-900 rounded-xl mb-6 text-left">
                                <View className="space-y-2 text-sm">
                                    <View className="flex justify-between">
                                        <Text className="text-gray-400">Amount:</Text>
                                        <Text className="font-semibold text-white">${amount}</Text>
                                    </View>
                                    <View className="flex justify-between">
                                        <Text className="text-gray-400">Fee:</Text>
                                        <Text className="font-semibold text-red-500">
                                            -${calculateFee().toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex justify-between border-t pt-2">
                                        <Text className="text-gray-400">Net Amount:</Text>
                                        <Text className="font-semibold text-green-500">
                                            ${calculateNetAmount().toFixed(2)}
                                        </Text>
                                    </View>
                                    <View className="flex justify-between">
                                        <Text className="text-gray-400">Method:</Text>
                                        <Text className="font-semibold text-white capitalize">
                                            {withdrawalMethod === "crypto"
                                                ? selectedOption.label
                                                : "Bank Transfer"}
                                        </Text>
                                    </View>
                                    <View className="flex justify-between">
                                        <Text className="text-gray-400">Status:</Text>
                                        <Text className="px-2 py-1 bg-yellow-900 text-yellow-300 text-xs font-semibold rounded-full">
                                            Pending
                                        </Text>
                                    </View>
                                    <View className="flex justify-between">
                                        <Text className="text-gray-400">Transaction ID:</Text>
                                        <Text className="font-mono text-xs text-white">
                                            {withdrawalDetails.transactionId}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="p-4 bg-blue-900 border border-blue-700 rounded-xl mb-6">
                                <View className="flex items-start gap-3 text-sm text-blue-300">
                                    <Info size={20} color="#60a5fa" />
                                    <View>
                                        <Text className="font-semibold mb-1">Processing Time:</Text>
                                        <Text>
                                            Your withdrawal will be processed within{" "}
                                            {selectedOption?.processingTime || "24-48 hours"}. You'll
                                            be notified once it's completed.
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View className="space-y-3">
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("Dashboard")}
                                    className="w-full py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                                >
                                    <Text className="text-white text-center">Go to Dashboard</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        setWithdrawalSuccess(false);
                                        setWithdrawalDetails(null);
                                        setAmount("");
                                        setWalletAddress("");
                                    }}
                                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
                                >
                                    <Text className="text-white text-center">Make Another Withdrawal</Text>
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
            <ScrollView className="flex-1">
                <View className="mx-4 my-8">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="flex flex-row items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
                    >
                        <ArrowLeft size={20} color="#9ca3af" />
                        <Text className="text-base">Back</Text>
                    </TouchableOpacity>

                    <View className="flex flex-row justify-between mb-6">
                        <View>
                            <Text className="text-3xl font-bold text-white flex flex-row items-center gap-3">
                                <Wallet size={32} color="#f97316" />
                                <Text>Withdraw Funds</Text>
                            </Text>
                            <Text className="text-gray-400 mt-2">Withdraw funds from your wallet</Text>
                        </View>
                        {user && (
                            <View className="text-right">
                                <Text className="text-sm text-gray-400">Available Balance</Text>
                                <Text className="text-2xl font-bold text-white">
                                    ${parseFloat(user.walletBalance || 0).toFixed(2)}
                                </Text>
                            </View>
                        )}
                    </View>

                    {error && (
                        <View className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl flex flex-row items-start gap-3">
                            <AlertCircle size={20} color="#ef4444" />
                            <Text className="text-sm text-red-400 flex-1">{error}</Text>
                        </View>
                    )}

                    <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm mb-6">
                        <Text className="text-xl font-bold text-white mb-6">Withdrawal Method</Text>
                        <View
                            className={`grid grid-cols-1 ${FEATURES.BANK_TRANSFER_ENABLED ? "md:grid-cols-2" : ""
                                } gap-4`}
                        >
                            <TouchableOpacity
                                onPress={() => setWithdrawalMethod("crypto")}
                                className={`p-6 border-2 rounded-xl text-left transition-all ${withdrawalMethod === "crypto"
                                        ? "border-orange-500 bg-orange-900"
                                        : "border-gray-700 hover:border-gray-600"
                                    }`}
                            >
                                <Bitcoin size={32} color="#f97316" />
                                <Text className="font-semibold text-white mb-1">Cryptocurrency</Text>
                                <Text className="text-sm text-gray-400">
                                    Fast and secure crypto withdrawal
                                </Text>
                            </TouchableOpacity>

                            {FEATURES.BANK_TRANSFER_ENABLED && (
                                <TouchableOpacity
                                    onPress={() => setWithdrawalMethod("bank_transfer")}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${withdrawalMethod === "bank_transfer"
                                            ? "border-orange-500 bg-orange-900"
                                            : "border-gray-700 hover:border-gray-600"
                                        }`}
                                >
                                    <Building2 size={32} color="#3b82f6" />
                                    <Text className="font-semibold text-white mb-1">Bank Transfer</Text>
                                    <Text className="text-sm text-gray-400">
                                        Direct bank account transfer
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm mb-6">
                        <Text className="text-xl font-bold text-white mb-6">Withdrawal Amount</Text>
                        <View>
                            <Text className="text-sm font-medium text-gray-400 mb-2">Amount (USD)</Text>
                            <View className="relative">
                                <DollarSign size={20} color="#9ca3af" className="absolute left-4 top-1/2 -translate-y-1/2" />
                                <TextInput
                                    value={amount}
                                    onChangeText={handleAmountChange}
                                    placeholder="Enter amount"
                                    keyboardType="decimal-pad"
                                    className={`w-full pl-12 pr-4 py-4 text-lg border rounded-xl ${amountError
                                            ? "border-red-700 bg-red-900"
                                            : "border-gray-700 bg-gray-900"
                                        } text-white`}
                                />
                            </View>
                            {amountError && (
                                <View className="mt-2 flex flex-row items-center gap-1">
                                    <AlertCircle size={16} color="#ef4444" />
                                    <Text className="text-sm text-red-400">{amountError}</Text>
                                </View>
                            )}
                        </View>

                        {amount && !amountError && selectedOption && (
                            <View className="mt-4 p-4 bg-gray-900 rounded-xl space-y-2 text-sm">
                                <View className="flex justify-between">
                                    <Text className="text-gray-400">Withdrawal Amount:</Text>
                                    <Text className="font-semibold text-white">${amount}</Text>
                                </View>
                                <View className="flex justify-between">
                                    <Text className="text-gray-400">Fee ({selectedOption.fee}):</Text>
                                    <Text className="font-semibold text-red-500">
                                        -${calculateFee().toFixed(2)}
                                    </Text>
                                </View>
                                <View className="flex justify-between border-t pt-2">
                                    <Text className="text-gray-400 font-medium">Net Amount:</Text>
                                    <Text className="font-bold text-green-500">
                                        ${calculateNetAmount().toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {withdrawalMethod === "crypto" && (
                        <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm mb-6">
                            <Text className="text-xl font-bold text-white mb-6">Cryptocurrency Details</Text>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-400 mb-2">Select Cryptocurrency</Text>
                                <View className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {cryptoOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            onPress={() => {
                                                setSelectedCrypto(option.value);
                                                setWalletNetwork(option.network);
                                            }}
                                            className={`p-4 border-2 rounded-xl text-left transition-all ${selectedCrypto === option.value
                                                    ? "border-orange-500 bg-orange-900"
                                                    : "border-gray-700 hover:border-gray-600"
                                                }`}
                                        >
                                            <Text className="font-semibold text-white text-sm mb-1">
                                                {option.label}
                                            </Text>
                                            <Text className="text-xs text-gray-400">{option.network}</Text>
                                            <Text className="text-xs text-gray-500 mt-1">
                                                Min: {option.minWithdrawal}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                            <View className="mb-4">
                                <Text className="text-sm font-medium text-gray-400 mb-2">Wallet Address</Text>
                                <TextInput
                                    value={walletAddress}
                                    onChangeText={(text) => setWalletAddress(text)}
                                    placeholder="Enter your wallet address"
                                    className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                                />
                            </View>
                            <View>
                                <Text className="text-sm font-medium text-gray-400 mb-2">Network</Text>
                                <TextInput
                                    value={walletNetwork}
                                    editable={false}
                                    className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-800 text-white"
                                />
                            </View>
                        </View>
                    )}

                    {FEATURES.BANK_TRANSFER_ENABLED &&
                        withdrawalMethod === "bank_transfer" && (
                            <View className="bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-sm mb-6">
                                <Text className="text-xl font-bold text-white mb-6">Bank Account Details</Text>
                                <View className="space-y-4">
                                    <View>
                                        <Text className="text-sm font-medium text-gray-400 mb-2">Bank Name</Text>
                                        <TextInput
                                            value={bankName}
                                            onChangeText={(text) => setBankName(text)}
                                            placeholder="Enter bank name"
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-medium text-gray-400 mb-2">Account Number</Text>
                                        <TextInput
                                            value={accountNumber}
                                            onChangeText={(text) => setAccountNumber(text)}
                                            placeholder="Enter account number"
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-medium text-gray-400 mb-2">Account Holder Name</Text>
                                        <TextInput
                                            value={accountHolder}
                                            onChangeText={(text) => setAccountHolder(text)}
                                            placeholder="Enter account holder name"
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                                        />
                                    </View>
                                    <View>
                                        <Text className="text-sm font-medium text-gray-400 mb-2">IFSC Code (Optional)</Text>
                                        <TextInput
                                            value={ifscCode}
                                            onChangeText={(text) => setIfscCode(text)}
                                            placeholder="Enter IFSC code"
                                            className="w-full px-4 py-3 border border-gray-700 rounded-xl bg-gray-900 text-white"
                                        />
                                    </View>
                                </View>
                            </View>
                        )}

                    <TouchableOpacity
                        onPress={handleWithdraw}
                        disabled={loading || !amount || amountError}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex flex-row items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <ActivityIndicator size="small" color="#ffffff" />
                                <Text className="text-white">Processing...</Text>
                            </>
                        ) : (
                            <Text className="text-white">Submit Withdrawal Request</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Withdrawal;
