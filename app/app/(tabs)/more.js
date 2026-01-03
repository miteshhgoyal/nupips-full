import React from 'react';
import { View, Text, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGTCFxAuth } from '@/context/gtcfxAuthContext';
import {
    ArrowLeftRight,
    History,
    Package,
    Badge,
    LayoutDashboard,
    DollarSign,
    Users,
    TrendingUp,
    ShoppingBag,
    Book,
    ChevronRight,
    TrendingDown,
    Send,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const More = () => {
    const router = useRouter();
    const { gtcAuthenticated } = useGTCFxAuth();

    const QuickActionItem = ({ icon: Icon, label, onPress, iconBg, iconColor, isLast = false }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center justify-between py-4 px-5 ${!isLast ? 'border-b border-neutral-800' : ''
                }`}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center flex-1">
                <View
                    className={`w-12 h-12 rounded-xl items-center justify-center mr-4`}
                    style={{ backgroundColor: iconBg }}
                >
                    <Icon size={20} color={iconColor} />
                </View>
                <Text className="text-white font-semibold text-base">{label}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a]">
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-5 pt-5 pb-4 border-b border-neutral-800">
                <Text className="text-2xl font-bold text-white">More</Text>
                <Text className="text-sm text-neutral-400 mt-0.5">Quick access to all features</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-5 pb-24">
                    {/* Team & Earnings */}
                    <View className="px-5 mb-6">
                        <Text className="text-lg font-bold text-white mb-4">Team & Earnings</Text>
                        <View className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
                            <QuickActionItem
                                icon={Users}
                                label="Team"
                                onPress={() => router.push('/nupips-team')}
                                iconBg="#3b82f615"
                                iconColor="#3b82f6"
                            />
                            <QuickActionItem
                                icon={TrendingUp}
                                label="Income"
                                onPress={() => router.push('/nupips-incomes')}
                                iconBg="#22c55e15"
                                iconColor="#22c55e"
                                isLast
                            />
                        </View>
                    </View>

                    {/* Financial Actions */}
                    <View className="px-5 mb-6">
                        <Text className="text-lg font-bold text-white mb-4">Financial</Text>
                        <View className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
                            <QuickActionItem
                                icon={TrendingUp}
                                label="Deposit"
                                onPress={() => router.push('/deposit')}
                                iconBg="#22c55e15"
                                iconColor="#22c55e"
                            />
                            <QuickActionItem
                                icon={TrendingDown}
                                label="Withdraw"
                                onPress={() => router.push('/withdrawal')}
                                iconBg="#ef444415"
                                iconColor="#ef4444"
                            />
                            <QuickActionItem
                                icon={Send}
                                label="Transfer"
                                onPress={() => router.push('/transfer')}
                                iconBg="#ea580c15"
                                iconColor="#ea580c"
                            />
                            <QuickActionItem
                                icon={History}
                                label="Transaction History"
                                onPress={() => router.push('/transaction-history')}
                                iconBg="#06b6d415"
                                iconColor="#06b6d4"
                                isLast
                            />
                        </View>
                    </View>

                    {/* Shopping */}
                    <View className="px-5 mb-6">
                        <Text className="text-lg font-bold text-white mb-4">Shopping</Text>
                        <View className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
                            <QuickActionItem
                                icon={ShoppingBag}
                                label="Shop"
                                onPress={() => router.push('/shop')}
                                iconBg="#8b5cf615"
                                iconColor="#8b5cf6"
                            />
                            <QuickActionItem
                                icon={Package}
                                label="My Orders"
                                onPress={() => router.push('/orders')}
                                iconBg="#f59e0b15"
                                iconColor="#f59e0b"
                                isLast
                            />
                        </View>
                    </View>

                    {/* Trading */}
                    <View className="px-5 mb-6">
                        <Text className="text-lg font-bold text-white mb-4">Trading</Text>
                        <View className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
                            <QuickActionItem
                                icon={Badge}
                                label="Broker Selection"
                                onPress={() => router.push('/broker-selection')}
                                iconBg="#ea580c15"
                                iconColor="#ea580c"
                                isLast={!gtcAuthenticated}
                            />

                            {gtcAuthenticated && (
                                <>
                                    <QuickActionItem
                                        icon={LayoutDashboard}
                                        label="GTC FX Dashboard"
                                        onPress={() => router.push('/gtcfx/dashboard')}
                                        iconBg="#3b82f615"
                                        iconColor="#3b82f6"
                                    />
                                    <QuickActionItem
                                        icon={DollarSign}
                                        label="GTC FX Profit Logs"
                                        onPress={() => router.push('/gtcfx/profit-logs')}
                                        iconBg="#22c55e15"
                                        iconColor="#22c55e"
                                    />
                                    <QuickActionItem
                                        icon={Users}
                                        label="GTC FX Agent Members"
                                        onPress={() => router.push('/gtcfx/agent-members')}
                                        iconBg="#8b5cf615"
                                        iconColor="#8b5cf6"
                                        isLast
                                    />
                                </>
                            )}
                        </View>
                    </View>

                    {/* Learning */}
                    <View className="px-5 mb-6">
                        <Text className="text-lg font-bold text-white mb-4">Learning</Text>
                        <View className="bg-neutral-900/50 rounded-2xl border border-neutral-800 overflow-hidden">
                            <QuickActionItem
                                icon={Book}
                                label="Learn"
                                onPress={() => router.push('/learn')}
                                iconBg="#06b6d415"
                                iconColor="#06b6d4"
                                isLast
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default More;
