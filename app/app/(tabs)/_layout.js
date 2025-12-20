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
    Book
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVE_TAB_COLOR = '#ea580c';
const INACTIVE_TAB_COLOR = '#9ca3af';
const BAR_BG = '#111827';
const BAR_BORDER = '#374151';

// layout config so you can tune it easily
const TAB_BAR_CONFIG = {
    paddingHorizontal: 16,
    bottomInset: 8,
    barHeight: 68,
    borderRadius: 24,
    itemMinWidth: 72,
    itemGap: 8,
};

const TAB_CONFIG = [
    { name: 'dashboard', label: 'Dashboard', icon: Home },
    { name: 'nupips-team', label: 'Team', icon: Users },
    { name: 'shop', label: 'Shop', icon: ShoppingBag },
    { name: 'learn', label: 'Learn', icon: Book },
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
                                }}
                            >
                                <Icon
                                    size={isFocused ? 26 : 22}
                                    color={isFocused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR}
                                    strokeWidth={isFocused ? 2.5 : 2}
                                />
                                <Text
                                    style={{
                                        marginTop: 4,
                                        fontSize: 11,
                                        fontWeight: isFocused ? '700' : '600',
                                        color: isFocused ? ACTIVE_TAB_COLOR : INACTIVE_TAB_COLOR,
                                    }}
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
        <SafeAreaView className="flex-1 bg-gray-900">
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
                {/* Main Tab Screens */}
                <Tabs.Screen
                    name="dashboard"
                    options={{ title: 'Dashboard' }}
                />
                <Tabs.Screen
                    name="nupips-team"
                    options={{ title: 'Nupips Team' }}
                />
                <Tabs.Screen
                    name="shop"
                    options={{ title: 'Shop' }}
                />
                <Tabs.Screen
                    name="learn"
                    options={{ title: 'Learn' }}
                />

                {/* GTC FX Folder - Group Layout */}
                <Tabs.Screen
                    name="gtcfx"
                    options={{
                        href: null,
                        title: 'GTC FX'
                    }}
                />

                {/* Wallet/Finance Screens (Hidden from tab bar) */}
                <Tabs.Screen
                    name="nupips-incomes"
                    options={{
                        href: null,
                        title: 'Nupips Incomes'
                    }}
                />
                <Tabs.Screen
                    name="deposit"
                    options={{
                        href: null,
                        title: 'Deposit'
                    }}
                />
                <Tabs.Screen
                    name="withdrawal"
                    options={{
                        href: null,
                        title: 'Withdrawal'
                    }}
                />
                <Tabs.Screen
                    name="transfer"
                    options={{
                        href: null,
                        title: 'Internal Transfer'
                    }}
                />
                <Tabs.Screen
                    name="transaction-history"
                    options={{
                        href: null,
                        title: 'Transaction History'
                    }}
                />

                {/* Profile Screen */}
                <Tabs.Screen
                    name="profile"
                    options={{
                        href: null,
                        title: 'Profile'
                    }}
                />

                {/* Shop Related Screens (Hidden) */}
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
                    name="orders"
                    options={{
                        href: null,
                        title: 'My Orders'
                    }}
                />

                {/* Learn Related Screens (Hidden) */}
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

                {/* Coming Soon Screen */}
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
