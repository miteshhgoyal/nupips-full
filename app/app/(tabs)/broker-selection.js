import React, { useState } from 'react';
import { View, Text, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useGTCFxAuth } from '@/context/gtcfxAuthContext';
import { TrendingUp, ArrowRight, CheckCircle, Info, ShieldCheck, ArrowLeft } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const BrokerSelection = () => {
    const router = useRouter();
    const { gtcAuthenticated, gtcUser } = useGTCFxAuth();
    const [selectedBroker, setSelectedBroker] = useState(null);

    const brokers = [
        {
            id: 'gtcfx',
            name: 'GTC FX',
            description: 'Professional forex trading platform with advanced strategies',
            available: true,
            route: '/gtcfx/auth',
            features: [
                'Advanced Trading Strategies',
                'Real-time Profit Tracking',
                'Agent Commission System',
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
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="mr-4 w-10 h-10 bg-neutral-900 rounded-xl items-center justify-center"
                            activeOpacity={0.7}
                        >
                            <ArrowLeft size={20} color="#fff" />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-2xl font-bold text-white">Broker</Text>
                            <Text className="text-sm text-neutral-400 mt-0.5">Connect trading accounts</Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Connection Status */}
                {gtcFxConnected && (
                    <View className="px-5 mt-5 mb-6">
                        <View className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                    <CheckCircle size={22} color="#22c55e" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-white mb-1">GTC FX Connected</Text>
                                    <Text className="text-neutral-400 text-sm">{gtcUser?.email}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Brokers List */}
                <View className="px-5 mb-6">
                    <Text className="text-lg font-bold text-white mb-4">Available Brokers</Text>

                    {brokers.map((broker) => {
                        const isConnected = broker.id === 'gtcfx' && gtcFxConnected;

                        return (
                            <TouchableOpacity
                                key={broker.id}
                                onPress={() => handleBrokerSelect(broker)}
                                className={`p-6 rounded-2xl border-2 mb-5 ${isConnected
                                        ? 'bg-green-500/5 border-green-500/30'
                                        : selectedBroker === broker.id
                                            ? 'bg-orange-500/5 border-orange-500'
                                            : 'bg-neutral-900/50 border-neutral-800'
                                    }`}
                                activeOpacity={0.7}
                            >
                                {/* Status Badge - Top Right */}
                                <View className="absolute top-5 right-5 z-10">
                                    {isConnected ? (
                                        <View className="flex-row items-center px-3 py-1.5 bg-green-500/15 border border-green-500/30 rounded-xl">
                                            <CheckCircle size={12} color="#22c55e" style={{ marginRight: 4 }} />
                                            <Text className="text-green-400 text-xs font-bold">Connected</Text>
                                        </View>
                                    ) : broker.available ? (
                                        <View className="flex-row items-center px-3 py-1.5 bg-blue-500/15 border border-blue-500/30 rounded-xl">
                                            <ShieldCheck size={12} color="#3b82f6" style={{ marginRight: 4 }} />
                                            <Text className="text-blue-400 text-xs font-bold">Available</Text>
                                        </View>
                                    ) : (
                                        <View className="px-3 py-1.5 bg-neutral-800 rounded-xl">
                                            <Text className="text-neutral-500 text-xs font-bold">Coming Soon</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Broker Logo */}
                                <View
                                    className={`w-16 h-16 rounded-2xl items-center justify-center mb-5 ${broker.available
                                            ? 'bg-orange-500/15 border border-orange-500/30'
                                            : 'bg-neutral-800 border border-neutral-700'
                                        }`}
                                >
                                    <TrendingUp size={28} color={broker.available ? '#ea580c' : '#6b7280'} />
                                </View>

                                {/* Broker Info */}
                                <Text className="text-2xl font-bold text-white mb-2">{broker.name}</Text>
                                <Text className="text-neutral-400 text-sm leading-6 mb-6">{broker.description}</Text>

                                {/* Features */}
                                <View className="mb-6 gap-3">
                                    {broker.features.map((feature, index) => (
                                        <View key={index} className="flex-row items-start">
                                            <View className="w-5 h-5 bg-orange-500/15 border border-orange-500/30 rounded-full items-center justify-center mr-3 mt-0.5">
                                                <CheckCircle size={12} color="#ea580c" />
                                            </View>
                                            <Text className="text-neutral-300 text-sm flex-1 leading-6">{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Connect Button */}
                                {broker.available && (
                                    <TouchableOpacity
                                        onPress={() => handleBrokerSelect(broker)}
                                        className={`py-4 px-4 rounded-2xl flex-row items-center justify-center ${isConnected ? 'bg-green-600' : 'bg-orange-500'
                                            }`}
                                        activeOpacity={0.7}
                                    >
                                        <Text className="text-white font-bold text-base flex-1 text-center">
                                            {isConnected ? 'Manage Connection' : 'Connect Now'}
                                        </Text>
                                        <ArrowRight size={20} color="#ffffff" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Why Connect Section */}
                <View className="px-5 mb-6">
                    <View className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800">
                        <View className="flex-row items-center mb-5">
                            <View className="w-12 h-12 bg-blue-500/15 rounded-xl items-center justify-center mr-4">
                                <Info size={22} color="#3b82f6" />
                            </View>
                            <Text className="text-lg font-bold text-white flex-1">Why Connect?</Text>
                        </View>

                        <View className="gap-4">
                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/15 border border-blue-500/30 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-neutral-300 text-sm flex-1 leading-6">
                                    Access professional trading strategies
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/15 border border-blue-500/30 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-neutral-300 text-sm flex-1 leading-6">
                                    Track profit logs and performance in real-time
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/15 border border-blue-500/30 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-neutral-300 text-sm flex-1 leading-6">
                                    Manage subscriptions and automate trading
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <View className="w-5 h-5 bg-blue-500/15 border border-blue-500/30 rounded-full items-center justify-center mr-3 mt-0.5">
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-neutral-300 text-sm flex-1 leading-6">
                                    Earn agent commissions from referrals
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default BrokerSelection;
