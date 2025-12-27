import React, { useState } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Send,
  DollarSign,
  User,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

const Transfer = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form
  const [amount, setAmount] = useState("");
  const [receiverIdentifier, setReceiverIdentifier] = useState("");
  const [note, setNote] = useState("");
  const [amountError, setAmountError] = useState("");

  // Search
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  // Result
  const [transferResult, setTransferResult] = useState(null);

  // Validate amount
  const validateAmount = (value) => {
    const numValue = parseFloat(value);

    if (!value || numValue <= 0) {
      setAmountError("Please enter a valid amount");
      return false;
    }

    if (numValue > (user?.walletBalance || 0)) {
      setAmountError(
        `Insufficient balance. Available: $${(user?.walletBalance || 0).toFixed(
          2
        )}`
      );
      return false;
    }

    if (numValue < 1) {
      setAmountError("Minimum transfer is $1");
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

  // Search users
  const handleSearchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(
        `/transfer/search/users?query=${encodeURIComponent(query)}`
      );
      if (response.data.success) {
        setSearchResults(response.data.data);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  };

  const handleReceiverChange = (e) => {
    const value = e.target.value;
    setReceiverIdentifier(value);
    setError("");
    handleSearchUsers(value);
  };

  const selectUser = (selectedUser) => {
    setReceiverIdentifier(selectedUser.username);
    setSearchResults([]);
  };

  // Submit
  const handleTransfer = async (e) => {
    e.preventDefault();

    if (!validateAmount(amount)) return;

    if (!receiverIdentifier.trim()) {
      setError("Please enter receiver username or email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/transfer/create", {
        amount: parseFloat(amount),
        receiverIdentifier: receiverIdentifier.trim(),
        note: note.trim(),
      });

      if (response.data.success) {
        setTransferResult(response.data.data);
        setSuccess(true);
        await checkAuth();
      } else {
        setError(response.data.message || "Transfer failed");
      }
    } catch (err) {
      console.error("Transfer error:", err);
      setError(err.response?.data?.message || "Failed to process transfer");
    } finally {
      setLoading(false);
    }
  };

  if (success && transferResult) {
    return (
      <>
        <Helmet>
          <title>Transfer Successful - Wallet</title>
        </Helmet>
        <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Transfer Successful!
              </h2>
              <p className="text-gray-600 mb-6">
                You sent ${transferResult.amount.toFixed(2)} to{" "}
                {transferResult.receiver.username}
              </p>
              <div className="p-4 bg-gray-50 rounded-xl mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-semibold">
                      ${transferResult.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">To</span>
                    <span className="font-semibold">
                      {transferResult.receiver.username}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-600">New Balance</span>
                    <span className="font-semibold text-green-600">
                      ${transferResult.newBalance.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="w-full py-3 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setTransferResult(null);
                    setAmount("");
                    setReceiverIdentifier("");
                    setNote("");
                  }}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                >
                  Make Another Transfer
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
        <title>Transfer Funds - Wallet</title>
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
                <Send className="w-8 h-8 text-orange-600" />
                Transfer Funds
              </h1>
              <p className="text-gray-600 mt-2">
                Transfer money to another user instantly
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

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleTransfer} className="max-w-4xl mx-auto space-y-6">
          {/* Receiver */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Recipient</h2>
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={receiverIdentifier}
                  onChange={handleReceiverChange}
                  placeholder="Enter username or email"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                />
                {searching && (
                  <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => selectUser(u)}
                      className="w-full p-3 hover:bg-gray-50 text-left border-b last:border-b-0 transition-colors"
                    >
                      <p className="font-medium text-gray-900">{u.name}</p>
                      <p className="text-sm text-gray-600">@{u.username}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Amount</h2>
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

            {/* Quick amounts */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[10, 50, 100, 500, 1000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  type="button"
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

          {/* Note */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Note (Optional)
            </h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              maxLength="200"
              rows="3"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">
              {note.length}/200 characters
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !amount || amountError || !receiverIdentifier}
            className="w-full py-4 bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Transfer Money</span>
              </>
            )}
          </button>
        </form>
      </div>
    </>
  );
};

export default Transfer;
