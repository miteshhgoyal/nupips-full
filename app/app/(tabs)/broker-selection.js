import React, { useState } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGTCFxAuth } from '@/context/gtcfxAuthContext';
import {
    TrendingUp,
    ArrowRight,
    CheckCircle,
    Info,
    ShieldCheck,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const BrokerSelection = () => {
    const router = useRouter();
    const { gtcAuthenticated, gtcUser } = useGTCFxAuth();
    const [selectedBroker, setSelectedBroker] = useState(null);

    const brokers = [
        {
            id: "gtcfx",
            name: "GTC FX",
            description: "Professional forex trading platform with advanced strategies",
            available: true,
            route: "/gtcfx/auth",
            features: [
                "Advanced Trading Strategies",
                "Real-time Profit Tracking",
                "Agent Commission System",
            ],
        },
    ];

    const handleBrokerSelect = (broker) => {
        if (broker.available) {
            setSelectedBroker(broker.id);
            router.push(broker.route);
        }
    };

    const gtcFxConnected = gtcAuthenticated && gtcUser;

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header - nupips-team style */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-3">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center p-2 bg-gray-800/50 rounded-xl active:bg-gray-800/70"
                    activeOpacity={0.9}
                >
                    <TrendingUp size={24} color="#ea580c" />
                    <Text className="text-white font-semibold text-base ml-3">Connect Broker</Text>
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-4 pb-24">
                    {/* Connection Status */}
                    {gtcFxConnected && (
                        <View className="mx-4 mb-6 bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                            <View className="flex-row items-center mb-2">
                                <View className="w-10 h-10 bg-green-500/20 rounded-full items-center justify-center mr-3">
                                    <CheckCircle size={20} color="#22c55e" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-white font-semibold text-base mb-1">GTC FX Connected</Text>
                                    <Text className="text-gray-400 text-sm">{gtcUser?.email}</Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Brokers */}
                    <View className="mx-4 mb-6">
                        {brokers.map((broker) => {
                            const isConnected = broker.id === "gtcfx" && gtcFxConnected;

                            return (
                                <TouchableOpacity
                                    key={broker.id}
                                    onPress={() => handleBrokerSelect(broker)}
                                    className={`bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6 ${selectedBroker === broker.id
                                        ? 'border-orange-500/30 bg-orange-500/10'
                                        : isConnected
                                            ? 'border-green-500/30 bg-green-500/10'
                                            : ''
                                        } active:bg-gray-800/60`}
                                    activeOpacity={0.95}
                                >
                                    {/* Status Badge */}
                                    <View className="absolute top-4 right-4 z-10">
                                        {isConnected ? (
                                            <View className="flex-row items-center bg-green-500/20 border border-green-500/30 px-3.5 py-2 rounded-xl">
                                                <CheckCircle size={16} color="#22c55e" />
                                                <Text className="text-green-400 text-sm font-semibold ml-2">Connected</Text>
                                            </View>
                                        ) : broker.available ? (
                                            <View className="flex-row items-center bg-blue-500/20 border border-blue-500/30 px-3.5 py-2 rounded-xl">
                                                <ShieldCheck size={16} color="#3b82f6" />
                                                <Text className="text-blue-400 text-sm font-semibold ml-2">Available</Text>
                                            </View>
                                        ) : (
                                            <View className="px-3.5 py-2 rounded-xl bg-gray-700/50">
                                                <Text className="text-gray-400 text-sm font-semibold">Coming Soon</Text>
                                            </View>
                                        )}
                                    </View>

                                    {/* Broker Logo */}
                                    <View className={`w-16 h-16 rounded-xl items-center justify-center mb-5 border ${broker.available
                                        ? 'bg-orange-500/20 border-orange-500/50'
                                        : 'bg-gray-700/50 border-gray-700/50'
                                        }`}>
                                        <TrendingUp size={24} color={broker.available ? "#ea580c" : "#6b7280"} />
                                    </View>

                                    {/* Broker Info */}
                                    <Text className="text-2xl font-bold text-white mb-3">{broker.name}</Text>
                                    <Text className="text-gray-400 text-base leading-relaxed mb-6">{broker.description}</Text>

                                    {/* Features */}
                                    <View className="mb-6">
                                        {broker.features.map((feature, index) => (
                                            <View key={index} className="flex-row items-start mb-3">
                                                <View className="w-5 h-5 bg-orange-500/20 border border-orange-500/40 rounded-full items-center justify-center mr-4 mt-0.5">
                                                    <CheckCircle size={14} color="#ea580c" />
                                                </View>
                                                <Text className="text-gray-300 text-sm flex-1 leading-5">{feature}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Connect Button */}
                                    {broker.available && (
                                        <TouchableOpacity
                                            onPress={() => handleBrokerSelect(broker)}
                                            className={`w-full py-4 px-6 rounded-xl flex-row items-center justify-center ${isConnected
                                                ? 'bg-green-500/90 active:bg-green-600/90 border border-green-500/30'
                                                : 'bg-orange-600 active:bg-orange-700 border border-orange-600/30'
                                                }`}
                                            activeOpacity={0.9}
                                        >
                                            <Text className="text-white font-semibold text-lg flex-1 text-center">
                                                {isConnected ? "Manage Connection" : "Connect Now"}
                                            </Text>
                                            <ArrowRight size={18} color="#ffffff" />
                                        </TouchableOpacity>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Why Connect Section */}
                    <View className="mx-4 bg-gray-800/40 border border-gray-700/30 rounded-xl p-6 mb-6">
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 bg-blue-500/20 border border-blue-500/30 rounded-xl items-center justify-center mr-4">
                                <Info size={20} color="#3b82f6" />
                            </View>
                            <Text className="text-xl font-bold text-white flex-1">Why Connect a Broker?</Text>
                        </View>
                        <View className="space-y-4">
                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/20 border border-blue-500/40 rounded-full items-center justify-center mr-4 mt-0.5">
                                    <CheckCircle size={14} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-base flex-1 leading-relaxed">Access professional trading strategies</Text>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/20 border border-blue-500/40 rounded-full items-center justify-center mr-4 mt-0.5">
                                    <CheckCircle size={14} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-base flex-1 leading-relaxed">Track your profit logs and performance in real-time</Text>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/20 border border-blue-500/40 rounded-full items-center justify-center mr-4 mt-0.5">
                                    <CheckCircle size={14} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-base flex-1 leading-relaxed">Manage subscriptions and automate trading</Text>
                            </View>
                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/20 border border-blue-500/40 rounded-full items-center justify-center mr-4 mt-0.5">
                                    <CheckCircle size={14} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-base flex-1 leading-relaxed">Earn agent commissions from referrals</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default BrokerSelection;
