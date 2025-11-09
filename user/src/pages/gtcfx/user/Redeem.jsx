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
} from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../../services/api";

const UnsubscribePage = () => {
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
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-orange-600 animate-spin" />
          <p className="text-slate-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (error && subscriptions.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchSubscriptionsData();
            }}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet title="Unsubscribe from Strategies" />
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-orange-900">
            Manage Subscriptions
          </h1>
          <p className="text-slate-600 mt-2">
            Withdraw your funds from active strategy subscriptions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Subscriptions List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-orange-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-orange-50 border-b border-orange-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Select
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">
                        Strategy
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
                        Balance
                      </th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-slate-900">
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
                          className={`border-b border-slate-200 cursor-pointer transition ${
                            selectedSubscription === sub.id
                              ? "bg-orange-50"
                              : "hover:bg-slate-50"
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
                              className="w-4 h-4 text-orange-600"
                            />
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {sub.profile_photo && (
                                <img
                                  src={sub.profile_photo}
                                  alt={sub.strategy_name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium text-slate-900 line-clamp-1">
                                  {sub.strategy_name}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {sub.nickname}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <p className="font-semibold text-slate-900">
                              ${parseFloat(sub.balance || 0).toFixed(2)}
                            </p>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <p
                              className={`font-semibold ${
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
                <div className="text-center py-12">
                  <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">
                    No subscriptions available
                  </p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {subscriptions.length > 0 && (
              <div className="flex items-center justify-center gap-4 mt-4">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <span className="text-slate-600 text-sm">
                  Page {currentPage}
                </span>

                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={subscriptions.length < ITEMS_PER_PAGE}
                  className="p-2 border border-orange-300 rounded-lg hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Redeem Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-orange-200 shadow-sm p-6 sticky top-24 h-fit">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Unsubscribe & Redeem
              </h2>

              {redeemSuccess && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Unsubscribed Successfully!
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      Your funds have been redeemed.
                    </p>
                  </div>
                </div>
              )}

              {redeemError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{redeemError}</p>
                </div>
              )}

              {selectedSubData && (
                <form onSubmit={handleRedeem} className="space-y-4">
                  {/* Selected Subscription Info */}
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700 font-medium mb-2">
                      Selected
                    </p>
                    <p className="text-slate-900 font-semibold line-clamp-1">
                      {selectedSubData.strategy_name}
                    </p>
                    <p className="text-2xl font-bold text-orange-600 mt-2">
                      ${parseFloat(selectedSubData.balance || 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Available Balance
                    </p>
                  </div>

                  {/* Redeem Mode Toggle */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Withdrawal Mode
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 transition">
                        <input
                          type="radio"
                          name="redeemMode"
                          value="partial"
                          checked={redeemMode === "partial"}
                          onChange={(e) => setRedeemMode(e.target.value)}
                          disabled={redeeming}
                          className="w-4 h-4 text-orange-600"
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            Partial Withdrawal
                          </p>
                          <p className="text-xs text-slate-500">
                            Withdraw specific amount
                          </p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border border-orange-300 rounded-lg cursor-pointer hover:bg-orange-50 transition">
                        <input
                          type="radio"
                          name="redeemMode"
                          value="all"
                          checked={redeemMode === "all"}
                          onChange={(e) => setRedeemMode(e.target.value)}
                          disabled={redeeming}
                          className="w-4 h-4 text-orange-600"
                        />
                        <div>
                          <p className="font-medium text-slate-900">
                            Withdraw All
                          </p>
                          <p className="text-xs text-slate-500">
                            Withdraw entire balance & unsubscribe
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Amount Input (for partial) */}
                  {redeemMode === "partial" && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Withdrawal Amount
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={parseFloat(selectedSubData.balance || 0)}
                          value={redeemAmount}
                          onChange={(e) => setRedeemAmount(e.target.value)}
                          placeholder="0.00"
                          disabled={redeeming}
                          className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Max: $
                        {parseFloat(selectedSubData.balance || 0).toFixed(2)}
                      </p>
                    </div>
                  )}

                  {/* Fund Password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fund Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={fundPassword}
                        onChange={(e) => setFundPassword(e.target.value)}
                        placeholder="Enter fund password"
                        disabled={redeeming}
                        className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition disabled:bg-slate-100"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={redeeming || !selectedSubData}
                    className="w-full px-4 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {redeeming && <Loader className="w-4 h-4 animate-spin" />}
                    {redeeming ? "Processing..." : "Confirm Withdrawal"}
                  </button>

                  {/* Info Box */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-800">
                      <strong>Note:</strong> Withdrawing funds will unsubscribe
                      you from this strategy. You can resubscribe anytime.
                    </p>
                  </div>
                </form>
              )}

              {!selectedSubData && (
                <div className="text-center py-8">
                  <ArrowUpRight className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">
                    Select a subscription to manage
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

export default UnsubscribePage;
