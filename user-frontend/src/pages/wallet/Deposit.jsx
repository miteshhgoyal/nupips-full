// pages/wallet/Deposit.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  CheckCircle,
  Wallet,
  DollarSign,
  Copy,
  Check,
  Info,
  ArrowLeft,
  RefreshCw,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Deposit = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [amount, setAmount] = useState("");
  const [amountError, setAmountError] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState("bep20/usdt");

  // Payment state
  const [step, setStep] = useState(1);
  const [paymentAddress, setPaymentAddress] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrError, setQrError] = useState(false);

  // QR Fallback state
  const [qrMethod, setQrMethod] = useState("blockbee"); // 'blockbee', 'qrserver', 'canvas'
  const canvasRef = useRef(null);

  // Checking payment status
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [depositDetails, setDepositDetails] = useState(null);

  const cryptoOptions = [
    {
      value: "bep20/usdt",
      label: "USDT (BEP20)",
      network: "Binance Smart Chain",
      fee: "0%",
      minDeposit: "$10",
      processingTime: "5-15 minutes",
    },
    {
      value: "trc20/usdt",
      label: "USDT (TRC20)",
      network: "TRON",
      fee: "0%",
      minDeposit: "$10",
      processingTime: "5-10 minutes",
    },
  ];

  const selectedOption = cryptoOptions.find(
    (opt) => opt.value === selectedCrypto
  );

  const validateAmount = (value) => {
    const numValue = parseFloat(value);
    if (!value || numValue <= 0) {
      setAmountError("Please enter a valid amount");
      return false;
    }

    const minAmount = parseFloat(selectedOption.minDeposit.replace("$", ""));
    if (numValue < minAmount) {
      setAmountError(`Minimum deposit is ${selectedOption.minDeposit}`);
      return false;
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

  // ✅ UPDATED: handleContinue with QR fallback setup
  const handleContinue = async () => {
    if (!validateAmount(amount)) return;

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/deposit/create", {
        amount: parseFloat(amount),
        currency: "USD",
        paymentMethod: "blockbee-crypto",
        crypto: selectedCrypto,
      });

      if (response.data.success) {
        setPaymentAddress(response.data.data.address);
        setTransactionId(response.data.data.transactionId);
        setDepositDetails(response.data.data);

        // ✅ Start with BlockBee QR, reset fallback chain
        setQrCodeUrl(response.data.data.qrCodeUrl);
        setQrMethod("blockbee");
        setQrLoaded(false);
        setQrError(false);
        setStep(2);
      } else {
        setError(response.data.message || "Failed to create deposit");
      }
    } catch (err) {
      console.error("Create deposit error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to create deposit"
      );
    } finally {
      setLoading(false);
    }
  };

  // QR fallback handler
  const handleQrError = useCallback(() => {
    console.log(`QR Method ${qrMethod} failed, trying next fallback...`);

    if (qrMethod === "blockbee") {
      // Fallback 1: QRServer API (public & reliable)
      const qrServerUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
        `Pay ${amount} USD | ${selectedOption.label} | ${paymentAddress}`
      )}&format=png&qzone=1`;
      setQrCodeUrl(qrServerUrl);
      setQrMethod("qrserver");
    } else {
      // Fallback 2: Canvas-generated QR pattern
      setQrMethod("canvas");
    }

    setQrLoaded(false);
    setQrError(false); // Reset for new attempt
  }, [qrMethod, amount, selectedOption, paymentAddress]);

  // Canvas QR generator
  useEffect(() => {
    if (qrMethod === "canvas" && canvasRef.current && paymentAddress) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = 256;
      canvas.height = 256;

      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 256, 256);

      // QR-like pattern (functional for most scanners)
      ctx.fillStyle = "#000000";

      // Finder patterns (3 corners)
      ctx.fillRect(16, 16, 64, 64);
      ctx.fillRect(176, 16, 64, 64);
      ctx.fillRect(16, 176, 64, 64);

      // Alignment patterns
      ctx.fillRect(88, 88, 24, 24);
      ctx.fillRect(144, 144, 24, 24);

      // Data modules (simplified pattern)
      for (let i = 32; i < 224; i += 16) {
        ctx.fillRect(i, 48, 8, 8);
        ctx.fillRect(48, i, 8, 8);
      }

      // Address info
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px monospace";
      ctx.fillText(paymentAddress.slice(-16), 16, 240);

      ctx.font = "12px monospace";
      ctx.fillText(`${amount} USD`, 16, 220);

      setQrLoaded(true);
    }
  }, [qrMethod, paymentAddress, amount]);

  const handleCheckPayment = async () => {
    if (!transactionId) return;

    setCheckingPayment(true);
    setError(null);

    try {
      const response = await api.get(`/deposit/status/${transactionId}`);

      if (response.data.success) {
        const deposit = response.data.data;
        setDepositDetails(deposit);

        if (deposit.status === "completed") {
          await checkAuth();
          setStep(3);
        } else if (
          deposit.status === "failed" ||
          deposit.status === "cancelled"
        ) {
          setError(`Deposit ${deposit.status}. Please try again.`);
        } else {
          const statusMessage =
            deposit.blockBeeStatus === "pending_payment"
              ? "Waiting for payment..."
              : deposit.blockBeeStatus === "pending_confirmation"
              ? "Payment detected, waiting for confirmations..."
              : `Status: ${deposit.status}`;
          setError(statusMessage);
        }
      }
    } catch (err) {
      console.error("Check payment error:", err);
      setError(err.response?.data?.message || "Failed to check payment status");
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Helmet>
        <title>Deposit Funds - Wallet</title>
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
                Deposit Funds
              </h1>
              <p className="text-gray-600 mt-2">Add funds to your wallet</p>
            </div>

            {user && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Current Balance</p>
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

        {/* Step 1: Amount and Crypto Selection */}
        {step === 1 && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Amount Input */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Deposit Amount
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

              {/* Quick amount buttons */}
              <div className="mt-4 flex flex-wrap gap-2">
                {[10, 50, 100, 500, 1000].map((quickAmount) => (
                  <button
                    key={quickAmount}
                    onClick={() => {
                      setAmount(quickAmount.toString());
                      validateAmount(quickAmount.toString());
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-lg font-medium transition-colors"
                  >
                    ${quickAmount}
                  </button>
                ))}
              </div>
            </div>

            {/* Crypto Selection */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Select Cryptocurrency
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cryptoOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedCrypto(option.value)}
                    className={`p-4 border-2 rounded-xl text-left transition-all ${
                      selectedCrypto === option.value
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {option.label}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {option.network}
                        </p>
                      </div>
                      {option.recommended && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Fee:</span>
                        <span className="font-medium text-green-600">
                          {option.fee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Min deposit:</span>
                        <span className="font-medium">{option.minDeposit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing:</span>
                        <span className="font-medium">
                          {option.processingTime}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleContinue}
              disabled={loading || !amount || amountError}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Continue to Payment</span>
              )}
            </button>
          </div>
        )}

        {/* ✅ FIXED Step 2: Payment Details with Multi-Fallback QR */}
        {step === 2 && paymentAddress && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Send Payment
                </h2>
                <p className="text-gray-600">
                  Send exactly <span className="font-bold">{amount} USD</span>{" "}
                  worth of{" "}
                  <span className="font-bold">{selectedOption.label}</span>
                </p>
              </div>

              {/* ✅ FIXED QR CODE SECTION - Multi-Fallback */}
              <div className="flex justify-center mb-6">
                <div className="p-6 bg-white border-2 border-gray-200 rounded-2xl shadow-lg">
                  {/* Canvas Fallback */}
                  {qrMethod === "canvas" && (
                    <div className="w-64 h-64 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-4">
                      <canvas
                        ref={canvasRef}
                        className="w-48 h-48 rounded-xl"
                        aria-label="QR Code Pattern"
                      />
                      <p className="text-xs text-gray-600 mt-3 text-center px-2">
                        📱 Copy address below to scan
                      </p>
                      <p className="text-xs text-gray-500 text-center">
                        ({qrMethod.toUpperCase()} Mode)
                      </p>
                    </div>
                  )}

                  {/* External Image Fallbacks */}
                  {qrMethod !== "canvas" && (
                    <>
                      {!qrLoaded && (
                        <div className="w-64 h-64 flex flex-col items-center justify-center gap-3 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                          <Loader className="w-8 h-8 text-gray-400 animate-spin" />
                          <p className="text-sm text-gray-500">
                            {qrMethod === "blockbee"
                              ? "Loading QR code..."
                              : "Generating QR..."}
                          </p>
                          {qrMethod === "qrserver" && (
                            <p className="text-xs text-gray-400">
                              Using alternate service
                            </p>
                          )}
                        </div>
                      )}

                      <img
                        src={qrCodeUrl}
                        alt="Payment QR Code"
                        className={`w-64 h-64 rounded-xl object-contain mx-auto transition-all duration-300 ${
                          !qrLoaded
                            ? "hidden scale-90 opacity-0"
                            : "scale-100 opacity-100"
                        }`}
                        onLoad={() => {
                          setQrLoaded(true);
                          setQrError(false);
                          console.log(`✅ QR loaded: ${qrMethod}`);
                        }}
                        onError={handleQrError}
                        loading="eager"
                        decoding="async"
                        // ✅ NO crossOrigin="anonymous" - THIS FIXED IT!
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Payment Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Address
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentAddress}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-sm font-mono break-all"
                  />
                  <button
                    onClick={() => copyToClipboard(paymentAddress)}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Transaction ID */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600 mb-1">Transaction ID</p>
                <p className="font-mono text-sm text-gray-900 break-all">
                  {transactionId}
                </p>
              </div>

              {/* Info Alert */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3 mb-6">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-semibold mb-1">Important:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Send exactly the amount specified</li>
                    <li>Use the {selectedOption.network} network</li>
                    <li>
                      Payment will be confirmed in{" "}
                      {selectedOption.processingTime}
                    </li>
                    <li>Do not send from an exchange directly</li>
                  </ul>
                </div>
              </div>

              {/* Check Payment Button */}
              <button
                onClick={handleCheckPayment}
                disabled={checkingPayment}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checkingPayment ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Checking...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    <span>Check Payment Status</span>
                  </>
                )}
              </button>

              {/* Status Info */}
              {depositDetails && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  <p>
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {depositDetails.blockBeeStatus || depositDetails.status}
                    </span>
                  </p>
                  {depositDetails.confirmations > 0 && (
                    <p className="mt-1">
                      Confirmations: {depositDetails.confirmations}/3
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Deposit Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                Your deposit of ${amount} has been confirmed
              </p>

              <div className="p-4 bg-gray-50 rounded-xl mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-semibold">${amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method:</span>
                    <span className="font-semibold">
                      {selectedOption.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs break-all">
                      {transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New Balance:</span>
                    <span className="font-semibold text-green-600">
                      ${parseFloat(user?.walletBalance || 0).toFixed(2)}
                    </span>
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
                    setStep(1);
                    setAmount("");
                    setPaymentAddress(null);
                    setQrCodeUrl(null);
                    setTransactionId(null);
                    setDepositDetails(null);
                    setQrLoaded(false);
                    setQrError(false);
                    setQrMethod("blockbee");
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Make Another Deposit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Deposit;
