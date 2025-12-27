// pages/user/BrokerSelection.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, ArrowRight, CheckCircle, Info } from "lucide-react";
import { useGTCFxAuth } from "../../contexts/GTCFxAuthContext";

const BrokerSelection = () => {
  const navigate = useNavigate();
  const { gtcAuthenticated, gtcUser } = useGTCFxAuth();
  const [selectedBroker, setSelectedBroker] = useState(null);

  const brokers = [
    {
      id: "gtcfx",
      name: "GTC FX",
      logo: null, // Add logo URL if available
      description:
        "Professional forex trading platform with advanced strategies",
      available: true,
      route: "/gtcfx/auth",
      features: [
        "Advanced Trading Strategies",
        "Real-time Profit Tracking",
        "Agent Commission System",
      ],
    },
    // {
    //   id: "broker2",
    //   name: "Broker 2",
    //   logo: null,
    //   description: "Coming soon - More brokers will be available",
    //   available: false,
    //   route: null,
    //   features: ["Multiple Assets", "Low Fees", "Fast Execution"],
    // },
    // {
    //   id: "broker3",
    //   name: "Broker 3",
    //   logo: null,
    //   description: "Coming soon - Expand your trading options",
    //   available: false,
    //   route: null,
    //   features: ["Copy Trading", "AI Signals", "Portfolio Management"],
    // },
  ];

  const handleBrokerSelect = (broker) => {
    if (broker.available) {
      setSelectedBroker(broker.id);
      // Small delay for visual feedback
      setTimeout(() => {
        navigate(broker.route);
      }, 300);
    }
  };

  // Check if GTC FX is already connected
  const gtcFxConnected = gtcAuthenticated && gtcUser;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg mb-6">
            <TrendingUp className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Connect Your Broker
          </h1>
          <p className="text-gray-600 text-lg">
            Select a broker to connect and start trading
          </p>
        </div>

        {/* Connection Status Banner (if already connected) */}
        {gtcFxConnected && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900">GTC FX Connected</p>
                <p className="text-sm text-green-700">
                  You are currently connected to GTC FX as {gtcUser.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Broker Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          {brokers.map((broker) => {
            const isConnected = broker.id === "gtcfx" && gtcFxConnected;

            return (
              <div
                key={broker.id}
                className={`relative rounded-2xl border-2 transition-all ${
                  broker.available
                    ? "border-gray-200 hover:border-orange-500 hover:shadow-xl bg-white"
                    : "border-gray-200 bg-gray-50 opacity-70"
                } ${
                  selectedBroker === broker.id
                    ? "border-orange-500 bg-orange-50 shadow-xl scale-[1.02]"
                    : ""
                } ${isConnected ? "border-green-500 bg-green-50" : ""}`}
              >
                <div className="p-6">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {isConnected ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold border border-green-300">
                        <CheckCircle className="w-3 h-3" />
                        Connected
                      </span>
                    ) : broker.available ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                        <CheckCircle className="w-3 h-3" />
                        Available
                      </span>
                    ) : (
                      <span className="inline-flex px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {/* Broker Logo */}
                  <div
                    className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-md mb-4 transition-transform ${
                      broker.available
                        ? "bg-linear-to-br from-orange-500 to-orange-600 hover:scale-110"
                        : "bg-gray-300"
                    }`}
                  >
                    {broker.logo ? (
                      <img
                        src={broker.logo}
                        alt={broker.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <TrendingUp
                        className={`w-8 h-8 ${
                          broker.available ? "text-white" : "text-gray-500"
                        }`}
                      />
                    )}
                  </div>

                  {/* Broker Info */}
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {broker.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 min-h-[40px]">
                    {broker.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {broker.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <CheckCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Connect Button */}
                  {broker.available && (
                    <button
                      onClick={() => handleBrokerSelect(broker)}
                      disabled={!broker.available}
                      className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-between group ${
                        isConnected
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-linear-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md hover:shadow-lg"
                      }`}
                    >
                      <span>
                        {isConnected ? "Manage Connection" : "Connect Now"}
                      </span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  {!broker.available && (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-200 text-gray-500 rounded-xl font-semibold cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {/* Why Connect */}
          <div className="p-6 bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                Why Connect a Broker?
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Access professional trading strategies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Track your profit logs and performance in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Manage subscriptions and automate trading</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Earn agent commissions from referrals</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Why Connect */}
          {/* <div className="p-6 bg-linear-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                Why Connect a Broker?
              </h3>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Access professional trading strategies</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Track your profit logs and performance in real-time</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Manage subscriptions and automate trading</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <span>Earn agent commissions from referrals</span>
              </li>
            </ul>
          </div> */}

          {/* Coming Soon */}
          {/* <div className="p-6 bg-linear-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">
                More Brokers Coming
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              We're constantly expanding our broker partnerships to give you
              more options and flexibility in your trading journey.
            </p>
            <div className="bg-white/60 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Stay tuned for:</p>
              <ul className="space-y-1 text-xs">
                <li>• Multiple broker integrations</li>
                <li>• Advanced portfolio management</li>
                <li>• Cross-broker analytics</li>
                <li>• Unified trading dashboard</li>
              </ul>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default BrokerSelection;
