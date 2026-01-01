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
    ArrowLeft,
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

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-700/50 px-5 py-4">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="flex-row items-center mb-2"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                >
                    <ArrowLeft size={22} color="#ffffff" style={{ marginRight: 12 }} />
                    <View>
                        <Text className="text-2xl font-bold text-white">Connect Broker</Text>
                        <Text className="text-sm text-gray-400 mt-0.5">Link your trading accounts</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                {/* Connection Status */}
                {gtcFxConnected && (
                    <View className="mx-4 mt-5 mb-6">
                        <View className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6">
                            <View className="flex-row items-center">
                                <View className="w-12 h-12 bg-green-500/20 rounded-xl items-center justify-center mr-4">
                                    <CheckCircle size={22} color="#22c55e" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-base font-bold text-white mb-1">GTC FX Connected</Text>
                                    <Text className="text-gray-400 text-sm">{gtcUser?.email}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}

                {/* Brokers List */}
                <View className="px-4 mb-6">
                    <Text className="text-xl font-bold text-white mb-4">Available Brokers</Text>

                    {brokers.map((broker) => {
                        const isConnected = broker.id === "gtcfx" && gtcFxConnected;

                        return (
                            <TouchableOpacity
                                key={broker.id}
                                onPress={() => handleBrokerSelect(broker)}
                                style={{
                                    padding: 24,
                                    borderRadius: 16,
                                    borderWidth: 2,
                                    marginBottom: 20,
                                    backgroundColor: isConnected
                                        ? 'rgba(34,197,94,0.05)'
                                        : selectedBroker === broker.id
                                            ? 'rgba(234,88,12,0.08)'
                                            : 'rgba(31,41,55,0.3)',
                                    borderColor: isConnected
                                        ? 'rgba(34,197,94,0.2)'
                                        : selectedBroker === broker.id
                                            ? '#ea580c'
                                            : '#374151',
                                }}
                                activeOpacity={0.8}
                            >
                                {/* Status Badge - Top Right */}
                                <View style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
                                    {isConnected ? (
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            backgroundColor: 'rgba(34,197,94,0.15)',
                                            borderWidth: 1.5,
                                            borderColor: 'rgba(34,197,94,0.3)',
                                            borderRadius: 8,
                                        }}>
                                            <CheckCircle size={14} color="#22c55e" style={{ marginRight: 6 }} />
                                            <Text style={{ color: '#4ade80', fontSize: 11, fontWeight: '700' }}>
                                                Connected
                                            </Text>
                                        </View>
                                    ) : broker.available ? (
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            backgroundColor: 'rgba(59,130,246,0.15)',
                                            borderWidth: 1.5,
                                            borderColor: 'rgba(59,130,246,0.3)',
                                            borderRadius: 8,
                                        }}>
                                            <ShieldCheck size={14} color="#3b82f6" style={{ marginRight: 6 }} />
                                            <Text style={{ color: '#60a5fa', fontSize: 11, fontWeight: '700' }}>
                                                Available
                                            </Text>
                                        </View>
                                    ) : (
                                        <View style={{
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            backgroundColor: 'rgba(75,85,99,0.5)',
                                            borderRadius: 8,
                                        }}>
                                            <Text style={{ color: '#9ca3af', fontSize: 11, fontWeight: '700' }}>
                                                Coming Soon
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* Broker Logo */}
                                <View style={{
                                    width: 64,
                                    height: 64,
                                    borderRadius: 12,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 20,
                                    backgroundColor: broker.available ? 'rgba(234,88,12,0.15)' : 'rgba(75,85,99,0.5)',
                                    borderWidth: 1.5,
                                    borderColor: broker.available ? 'rgba(234,88,12,0.3)' : 'rgba(75,85,99,0.3)',
                                }}>
                                    <TrendingUp size={28} color={broker.available ? "#ea580c" : "#6b7280"} />
                                </View>

                                {/* Broker Info */}
                                <Text className="text-2xl font-bold text-white mb-3">{broker.name}</Text>
                                <Text className="text-gray-400 text-sm leading-6 mb-6">{broker.description}</Text>

                                {/* Features */}
                                <View className="mb-6" style={{ gap: 12 }}>
                                    {broker.features.map((feature, index) => (
                                        <View key={index} className="flex-row items-start">
                                            <View style={{
                                                width: 20,
                                                height: 20,
                                                backgroundColor: 'rgba(234,88,12,0.15)',
                                                borderWidth: 1.5,
                                                borderColor: 'rgba(234,88,12,0.3)',
                                                borderRadius: 10,
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: 12,
                                                marginTop: 2,
                                            }}>
                                                <CheckCircle size={12} color="#ea580c" />
                                            </View>
                                            <Text className="text-gray-300 text-sm flex-1 leading-5">{feature}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Connect Button */}
                                {broker.available && (
                                    <TouchableOpacity
                                        onPress={() => handleBrokerSelect(broker)}
                                        style={{
                                            paddingVertical: 16,
                                            borderRadius: 12,
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isConnected ? '#10b981' : '#ea580c',
                                            gap: 10,
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text className="text-white font-bold text-base flex-1 text-center">
                                            {isConnected ? "Manage Connection" : "Connect Now"}
                                        </Text>
                                        <ArrowRight size={20} color="#ffffff" />
                                    </TouchableOpacity>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Why Connect Section */}
                <View className="px-4 mb-6">
                    <View className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                        <View className="flex-row items-center mb-5">
                            <View className="w-12 h-12 bg-blue-500/20 rounded-xl items-center justify-center mr-4">
                                <Info size={22} color="#3b82f6" />
                            </View>
                            <Text className="text-xl font-bold text-white flex-1">Why Connect a Broker?</Text>
                        </View>

                        <View style={{ gap: 16 }}>
                            <View className="flex-row items-start">
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(59,130,246,0.3)',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                    marginTop: 2,
                                }}>
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-sm flex-1 leading-6">
                                    Access professional trading strategies
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(59,130,246,0.3)',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                    marginTop: 2,
                                }}>
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-sm flex-1 leading-6">
                                    Track your profit logs and performance in real-time
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(59,130,246,0.3)',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                    marginTop: 2,
                                }}>
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-sm flex-1 leading-6">
                                    Manage subscriptions and automate trading
                                </Text>
                            </View>

                            <View className="flex-row items-start">
                                <View style={{
                                    width: 20,
                                    height: 20,
                                    backgroundColor: 'rgba(59,130,246,0.15)',
                                    borderWidth: 1.5,
                                    borderColor: 'rgba(59,130,246,0.3)',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginRight: 12,
                                    marginTop: 2,
                                }}>
                                    <CheckCircle size={12} color="#3b82f6" />
                                </View>
                                <Text className="text-gray-300 text-sm flex-1 leading-6">
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