import React from 'react';
import {
    View,
    Text,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
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
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const More = () => {
    const router = useRouter();
    const { gtcAuthenticated } = useGTCFxAuth();

    const QuickActionItem = ({ icon: Icon, label, onPress, isLast = false }) => (
        <TouchableOpacity
            onPress={onPress}
            className={`flex-row items-center justify-between py-4 px-4 ${!isLast ? 'border-b border-gray-800' : ''} active:bg-gray-800/50`}
            activeOpacity={0.8}
        >
            <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-orange-600/20 border border-orange-600/40 rounded-xl items-center justify-center mr-4">
                    <Icon size={20} color="#ea580c" />
                </View>
                <Text className="text-white font-semibold text-base">{label}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/50 border-b border-gray-800 px-6 py-4">
                <Text className="text-2xl font-bold text-white">More</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="py-6 pb-20">
                    {/* Team & Earnings */}
                    <View className="mx-4 mb-8">
                        <Text className="text-lg font-bold text-gray-300 mb-6 px-2">Team & Earnings</Text>
                        <View className="bg-gray-800/30 rounded-2xl overflow-hidden">
                            <QuickActionItem
                                icon={Users}
                                label="Team"
                                onPress={() => router.push('/nupips-team')}
                            />
                            <QuickActionItem
                                icon={TrendingUp}
                                label="Income"
                                onPress={() => router.push('/nupips-incomes')}
                                isLast
                            />
                        </View>
                    </View>

                    {/* Financial Actions */}
                    <View className="mx-4 mb-8">
                        <Text className="text-lg font-bold text-gray-300 mb-6 px-2">Financial</Text>
                        <View className="bg-gray-800/30 rounded-2xl overflow-hidden">
                            <QuickActionItem
                                icon={DollarSign}
                                label="Deposit"
                                onPress={() => router.push('/deposit')}
                            />
                            <QuickActionItem
                                icon={ArrowLeftRight}
                                label="Withdraw"
                                onPress={() => router.push('/withdrawal')}
                            />
                            <QuickActionItem
                                icon={ArrowLeftRight}
                                label="Transfer"
                                onPress={() => router.push('/transfer')}
                            />
                            <QuickActionItem
                                icon={History}
                                label="Transaction History"
                                onPress={() => router.push('/transaction-history')}
                                isLast
                            />
                        </View>
                    </View>

                    {/* Shopping */}
                    <View className="mx-4 mb-8">
                        <Text className="text-lg font-bold text-gray-300 mb-6 px-2">Shopping</Text>
                        <View className="bg-gray-800/30 rounded-2xl overflow-hidden">
                            <QuickActionItem
                                icon={ShoppingBag}
                                label="Shop"
                                onPress={() => router.push('/shop')}
                            />
                            <QuickActionItem
                                icon={Package}
                                label="My Orders"
                                onPress={() => router.push('/orders')}
                                isLast
                            />
                        </View>
                    </View>

                    {/* Trading */}
                    <View className="mx-4 mb-8">
                        <Text className="text-lg font-bold text-gray-300 mb-6 px-2">Trading</Text>
                        <View className="bg-gray-800/30 rounded-2xl overflow-hidden">
                            <QuickActionItem
                                icon={Badge}
                                label="Broker Selection"
                                onPress={() => router.push('/broker-selection')}
                                isLast={!gtcAuthenticated}
                            />

                            {gtcAuthenticated && (
                                <>
                                    <QuickActionItem
                                        icon={LayoutDashboard}
                                        label="GTC FX Dashboard"
                                        onPress={() => router.push('/gtcfx/dashboard')}
                                    />
                                    <QuickActionItem
                                        icon={DollarSign}
                                        label="GTC FX Profit Logs"
                                        onPress={() => router.push('/gtcfx/profit-logs')}
                                    />
                                    <QuickActionItem
                                        icon={Users}
                                        label="GTC FX Agent Members"
                                        onPress={() => router.push('/gtcfx/agent-members')}
                                        isLast
                                    />
                                </>
                            )}
                        </View>
                    </View>

                    {/* Learning */}
                    <View className="mx-4 mb-8">
                        <Text className="text-lg font-bold text-gray-300 mb-6 px-2">Learning</Text>
                        <View className="bg-gray-800/30 rounded-2xl overflow-hidden">
                            <QuickActionItem
                                icon={Book}
                                label="Learn"
                                onPress={() => router.push('/learn')}
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
