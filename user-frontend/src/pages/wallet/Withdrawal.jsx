// pages/wallet/Withdrawal.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  CheckCircle,
  Wallet,
  DollarSign,
  ArrowLeft,
  Info,
  Building2,
  Bitcoin,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Withdrawal = () => {
  const navigate = useNavigate();
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

  // Bank details
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
      minWithdrawal: "$20",
      processingTime: "1-24 hours",
    },
    {
      value: "trc20/usdt",
      label: "USDT (TRC20)",
      network: "TRON",
      fee: "0.5%",
      minWithdrawal: "$20",
      processingTime: "1-24 hours",
    },
    {
      value: "erc20/usdt",
      label: "USDT (ERC20)",
      network: "Ethereum",
      fee: "1%",
      minWithdrawal: "$100",
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

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    if (value) {
      validateAmount(value);
    } else {
      setAmountError("");
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

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

    // Validate bank details
    if (withdrawalMethod === "bank_transfer") {
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
      } else {
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

        // Refresh user data
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
      <>
        <Helmet>
          <title>Withdrawal Successful - Wallet</title>
        </Helmet>

        <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Withdrawal Submitted!
              </h2>
              <p className="text-gray-600 mb-6">
                Your withdrawal request has been submitted for processing
              </p>

              <div className="p-4 bg-gray-50 rounded-xl mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">${amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee:</span>
                    <span className="font-semibold text-red-600">
                      -${calculateFee().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">Net Amount:</span>
                    <span className="font-semibold text-green-600">
                      ${calculateNetAmount().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-semibold capitalize">
                      {withdrawalMethod === "crypto"
                        ? selectedOption.label
                        : "Bank Transfer"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">
                      Pending
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs">
                      {withdrawalDetails.transactionId}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                <div className="flex items-start gap-3 text-sm text-blue-700">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-semibold mb-1">Processing Time:</p>
                    <p>
                      Your withdrawal will be processed within{" "}
                      {selectedOption?.processingTime || "24-48 hours"}. You'll
                      be notified once it's completed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setWithdrawalSuccess(false);
                    setWithdrawalDetails(null);
                    setAmount("");
                    setWalletAddress("");
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Make Another Withdrawal
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Withdraw Funds - Wallet</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-orange-600" />
                Withdraw Funds
              </h1>
              <p className="text-gray-600 mt-2">
                Withdraw funds from your wallet
              </p>
            </div>

            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${parseFloat(user.walletBalance || 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleWithdraw} className="max-w-4xl mx-auto space-y-6">
          {/* Withdrawal Method */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Withdrawal Method
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setWithdrawalMethod("crypto")}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  withdrawalMethod === "crypto"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Bitcoin className="w-8 h-8 text-orange-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  Cryptocurrency
                </h3>
                <p className="text-sm text-gray-600">
                  Fast and secure crypto withdrawal
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWithdrawalMethod("bank_transfer")}
                className={`p-6 border-2 rounded-xl text-left transition-all ${
                  withdrawalMethod === "bank_transfer"
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Building2 className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">
                  Bank Transfer
                </h3>
                <p className="text-sm text-gray-600">
                  Direct bank account transfer
                </p>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Withdrawal Amount
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className={`w-full pl-12 pr-4 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    amountError
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                />
              </div>
              {amountError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {amountError}
                </p>
              )}
            </div>

            {/* Fee calculation */}
            {amount && !amountError && selectedOption && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Withdrawal Amount:</span>
                  <span className="font-semibold">${amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Fee ({selectedOption.fee}):
                  </span>
                  <span className="font-semibold text-red-600">
                    -${calculateFee().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-700 font-medium">Net Amount:</span>
                  <span className="font-bold text-green-600">
                    ${calculateNetAmount().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Crypto Details */}
          {withdrawalMethod === "crypto" && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Cryptocurrency Details
              </h2>

              {/* Select Crypto */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Cryptocurrency
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {cryptoOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSelectedCrypto(option.value);
                        setWalletNetwork(option.network);
                      }}
                      className={`p-4 border-2 rounded-xl text-left transition-all ${
                        selectedCrypto === option.value
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <h3 className="font-semibold text-gray-900 text-sm mb-1">
                        {option.label}
                      </h3>
                      <p className="text-xs text-gray-600">{option.network}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Min: {option.minWithdrawal}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Wallet Address */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Enter your wallet address"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-mono text-sm"
                />
              </div>

              {/* Network */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Network
                </label>
                <input
                  type="text"
                  value={walletNetwork}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-700"
                />
              </div>
            </div>
          )}

          {/* Bank Details */}
          {withdrawalMethod === "bank_transfer" && (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Bank Account Details
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Enter bank name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="Enter account holder name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IFSC Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="Enter IFSC code"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !amount || amountError}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Submit Withdrawal Request</span>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default Withdrawal;
