    // pages/gtcfx/user/Unsubscribe.jsx
import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import {
  Loader,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Lock,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ArrowUpRight,
  LogOut,
  Activity,
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../services/gtcfxApi";

const GTCFxUnsubscribe = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subscriptionIdFromUrl = searchParams.get("subscription");

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Redeem form state
  const [selectedSubscription, setSelectedSubscription] = useState(
    subscriptionIdFromUrl ? parseInt(subscriptionIdFromUrl) : null
  );
  const [redeemMode, setRedeemMode] = useState("partial");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [fundPassword, setFundPassword] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemError, setRedeemError] = useState("");
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchSubscriptionsData();
  }, [currentPage]);

  const fetchSubscriptionsData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post("/subscribe_list", {
        page: currentPage,
        page_size: ITEMS_PER_PAGE,
      });

      if (response.data.code === 200) {
        setSubscriptions(response.data.data.list || []);
      } else {
        setError(response.data.message || "Failed to fetch subscriptions");
      }
    } catch (err) {
      console.error("Fetch subscriptions error:", err);
      setError(
        err.response?.data?.message || "Network error. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (e) => {
    e.preventDefault();
    setRedeemError("");
    setRedeeming(true);

    const subscription = subscriptions.find(
      (sub) => sub.id === selectedSubscription
    );

    if (!subscription) {
      setRedeemError("Please select a subscription");
      setRedeeming(false);
      return;
    }

    if (!fundPassword) {
      setRedeemError("Fund password is required");
      setRedeeming(false);
      return;
    }

    if (redeemMode === "partial") {
      if (!redeemAmount) {
        setRedeemError("Redeem amount is required");
        setRedeeming(false);
        return;
      }

      const amount = parseFloat(redeemAmount);
      const balance = parseFloat(subscription.balance || 0);

      if (isNaN(amount) || amount <= 0) {
        setRedeemError("Please enter a valid amount");
        setRedeeming(false);
        return;
      }

      if (amount > balance) {
        setRedeemError(
          `Amount exceeds available balance of $${balance.toFixed(2)}`
        );
        setRedeeming(false);
        return;
      }
    }

    try {
      const payload = {
        copy_id: selectedSubscription,
        fund_password: fundPassword,
        is_all: redeemMode === "all" ? 1 : 0,
      };

      if (redeemMode === "partial") {
        payload.amount = parseFloat(redeemAmount);
      }

      const response = await api.post("/redeem_pamm", payload);

      if (
        response.data.code === 200 ||
        Object.keys(response.data).length === 0
      ) {
        setRedeemSuccess(true);
        setRedeemAmount("");
        setFundPassword("");

        setTimeout(() => {
          fetchSubscriptionsData();
          setRedeemSuccess(false);
        }, 2000);
      } else {
        setRedeemError(response.data.message || "Redeem failed");
      }
    } catch (err) {
      console.error("Redeem error:", err);
      setRedeemError(
        err.response?.data?.message || "Redeem failed. Please try again."
      );
    } finally {
      setRedeeming(false);
    }
  };

  const selectedSubData = subscriptions.find(
    (sub) => sub.id === selectedSubscription
  );

  if (loading && currentPage === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Failed to Load Subscriptions
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchSubscriptionsData();
            }}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Unsubscribe - GTC FX</title>
      </Helmet>

      <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LogOut className="w-8 h-8 text-orange-600" />
            Manage Subscriptions
          </h1>
          <p className="text-gray-600 mt-2">
            Withdraw your funds from active strategy subscriptions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Select
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Strategy
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Balance
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        Profit/Loss
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => {
                      const profit = parseFloat(sub.total_profit || 0);

                      return (
                        <tr
                          key={sub.id}
                          onClick={() => setSelectedSubscription(sub.id)}
                          className={`border-b border-gray-100 cursor-pointer transition-colors ${
                            selectedSubscription === sub.id
                              ? "bg-orange-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="radio"
                              name="subscription"
                              value={sub.id}
                              checked={selectedSubscription === sub.id}
                              onChange={(e) =>
                                setSelectedSubscription(
                                  parseInt(e.target.value)
                                )
                              }
                              className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                            />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {sub.profile_photo ? (
                                <img
                                  src={sub.profile_photo}
                                  alt={sub.strategy_name}
                                  className="w-12 h-12 rounded-xl object-cover shadow-sm"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                                  <Activity className="w-6 h-6 text-orange-600" />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-gray-900 line-clamp-1">
                                  {sub.strategy_name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {sub.nickname}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <p className="font-bold text-gray-900">
                              ${parseFloat(sub.balance || 0).toFixed(2)}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <p
                              className={`font-bold ${
                                profit >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              ${profit.toFixed(2)}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Empty State */}
              {subscriptions.length === 0 && !loading && (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Subscriptions Available
                  </h3>
                  <p className="text-gray-600">
                    You don't have any active subscriptions
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {subscriptions.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>

                <span className="text-gray-600 text-sm font-medium">
                  Page {currentPage}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={subscriptions.length < ITEMS_PER_PAGE}
                  className="p-3 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-200 transition-all"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Redeem Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-orange-600" />
                Withdraw Funds
              </h2>

              {redeemSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-800">
                      Withdrawal Successful!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Your funds have been redeemed
                    </p>
                  </div>
                </div>
              )}

              {redeemError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-800">
                    {redeemError}
                  </p>
                </div>
              )}

              {selectedSubData ? (
                <form onSubmit={handleRedeem} className="space-y-5">
                  {/* Selected Subscription Info */}
                  <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl">
                    <p className="text-sm text-orange-700 font-semibold mb-2">
                      Selected Strategy
                    </p>
                    <p className="text-gray-900 font-bold line-clamp-1 mb-3">
                      {selectedSubData.strategy_name}
                    </p>
                    <p className="text-3xl font-bold text-orange-600">
                      ${parseFloat(selectedSubData.balance || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      Available Balance
                    </p>
                  </div>

                  {/* Redeem Mode Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Withdrawal Mode
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                        <input
                          type="radio"
                          name="redeemMode"
                          value="partial"
                          checked={redeemMode === "partial"}
                          onChange={(e) => setRedeemMode(e.target.value)}
                          disabled={redeeming}
                          className="w-4 h-4 text-orange-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            Partial Withdrawal
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Withdraw a specific amount and keep subscription
                            active
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50">
                        <input
                          type="radio"
                          name="redeemMode"
                          value="all"
                          checked={redeemMode === "all"}
                          onChange={(e) => setRedeemMode(e.target.value)}
                          disabled={redeeming}
                          className="w-4 h-4 text-orange-600 mt-0.5"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            Withdraw All & Unsubscribe
                          </p>
                          <p className="text-xs text-gray-600 mt-1">
                            Withdraw entire balance and end subscription
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Amount Input (for partial) */}
                  {redeemMode === "partial" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Withdrawal Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={parseFloat(selectedSubData.balance || 0)}
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={redeeming}
                          className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Maximum: $
                        {parseFloat(selectedSubData.balance || 0).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Fund Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fund Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="password"
                        value={fundPassword}
                        onChange={(e) => setFundPassword(e.target.value)}
                        placeholder="Enter your fund password"
                        disabled={redeeming}
                        className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={redeeming || !selectedSubData}
                    className="w-full px-4 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {redeeming && <Loader className="w-5 h-5 animate-spin" />}
                    {redeeming ? "Processing..." : "Confirm Withdrawal"}
                  </button>

                  {/* Info Box */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 leading-relaxed">
                      ⚠️ <strong>Important:</strong> Withdrawing all funds will
                      unsubscribe you from this strategy. You can resubscribe
                      anytime.
                    </p>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ArrowUpRight className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">
                    Select a subscription to withdraw funds
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GTCFxUnsubscribe;
