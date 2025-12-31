import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/authContext';
import {
    LogOut,
    LayoutDashboard,
    TrendingUp,
    Wallet,
    Users,
    Home,
    ShoppingBag,
    Book,
    DollarSign,
    ArrowLeftRight,
    History,
    User,
    Package,
    FileText,
    PlayCircle,
    Clock,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVE_TAB_COLOR = '#ea580c';
const INACTIVE_TAB_COLOR = '#9ca3af';
const BAR_BG = '#111827';
const BAR_BORDER = '#374151';

// layout config so you can tune it easily
const TAB_BAR_CONFIG = {
    paddingHorizontal: 12,
    bottomInset: 8,
    barHeight: 72,
    borderRadius: 24,
    itemMinWidth: 64,
    itemGap: 6,
};

// ALL TABS VISIBLE FOR TESTING
const TAB_CONFIG = [
    { name: 'dashboard', label: 'Home', icon: Home },
    { name: 'nupips-team', label: 'Team', icon: Users },
    { name: 'nupips-incomes', label: 'Income', icon: TrendingUp },
    { name: 'deposit', label: 'Deposit', icon: DollarSign },
    { name: 'withdrawal', label: 'Withdraw', icon: ArrowLeftRight },
    { name: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
    { name: 'transaction-history', label: 'History', icon: History },
    { name: 'shop', label: 'Shop', icon: ShoppingBag },
    { name: 'orders', label: 'Orders', icon: Package },
    { name: 'learn', label: 'Learn', icon: Book },
    { name: 'profile', label: 'Profile', icon: User },
];

function FloatingTabBar({ state, descriptors, navigation }) {
    const { paddingHorizontal, bottomInset, barHeight, borderRadius, itemMinWidth, itemGap } =
        TAB_BAR_CONFIG;

    return (
        <View
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                paddingBottom: bottomInset,
                paddingHorizontal,
            }}
        >
            <View
                style={{
                    backgroundColor: BAR_BG,
                    borderRadius,
                    borderWidth: 1,
                    borderColor: BAR_BORDER,
                    height: barHeight,
                    shadowColor: '#000',
                    shadowOpacity: 0.35,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: -2 },
                    elevation: 16,
                    overflow: 'hidden',
                    justifyContent: 'center',
                }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingHorizontal,
                        alignItems: 'center',
                        columnGap: itemGap,
                    }}
                    bounces={false}
                >
                    {state.routes.map((route, index) => {
                        const config = TAB_CONFIG.find((t) => t.name === route.name);
                        if (!config) return null;

                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;
                        const Icon = config.icon;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });
                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                onLongPress={onLongPress}
                                activeOpacity={0.85}
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: itemMinWidth,
                                    paddingHorizontal: 8,
                                }}
                            >
                                <View
                                    style={{
                                        backgroundColor: isFocused ? `${ACTIVE_TAB_COLOR}20` : 'transparent',
                                        borderRadius: 16,
                                        padding: isFocused ? 8 : 6,
                                        margin: isFocused ? 2 : 0,
                                    }}
                                >
                                    <Icon
                                        size={isFocused ? 26 : 22}
                                        color={isFocused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
                                        strokeWidth={isFocused ? 2.5 : 2}
                                    />
                                </View>
                                <Text
                                    style={{
                                        marginTop: 4,
                                        fontSize: 10,
                                        fontWeight: isFocused ? '800' : '600',
                                        color: isFocused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR,
                                        textAlign: 'center',
                                    }}
                                    numberOfLines={1}
                                >
                                    {config.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>
        </View>
    );
}

export default function TabsLayout() {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-gray-900" edges={['top']}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        position: 'absolute',
                        height: 0,
                    },
                }}
                tabBar={(props) => <FloatingTabBar {...props} />}
            >
                {/* ALL MAIN TABS - VISIBLE FOR TESTING */}
                <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
                <Tabs.Screen name="nupips-team" options={{ title: 'Nupips Team' }} />
                <Tabs.Screen name="nupips-incomes" options={{ title: 'Nupips Incomes' }} />
                <Tabs.Screen name="deposit" options={{ title: 'Deposit' }} />
                <Tabs.Screen name="withdrawal" options={{ title: 'Withdrawal' }} />
                <Tabs.Screen name="transfer" options={{ title: 'Transfer' }} />
                <Tabs.Screen name="transaction-history" options={{ title: 'Transaction History' }} />
                <Tabs.Screen name="shop" options={{ title: 'Shop' }} />
                <Tabs.Screen name="orders" options={{ title: 'Orders' }} />
                <Tabs.Screen name="learn" options={{ title: 'Learn' }} />
                <Tabs.Screen name="profile" options={{ title: 'Profile' }} />

                {/* HIDDEN SCREENS - Still accessible via navigation */}
                <Tabs.Screen
                    name="gtcfx"
                    options={{
                        href: null,
                        title: 'GTC FX'
                    }}
                />
                <Tabs.Screen
                    name="product-item"
                    options={{
                        href: null,
                        title: 'Product Details'
                    }}
                />
                <Tabs.Screen
                    name="place-order"
                    options={{
                        href: null,
                        title: 'Place Order'
                    }}
                />
                <Tabs.Screen
                    name="course-view"
                    options={{
                        href: null,
                        title: 'Course Details'
                    }}
                />
                <Tabs.Screen
                    name="lesson-view"
                    options={{
                        href: null,
                        title: 'Lesson View'
                    }}
                />
                <Tabs.Screen
                    name="coming-soon"
                    options={{
                        href: null,
                        title: 'Coming Soon'
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}
