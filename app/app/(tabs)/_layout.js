import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { LogOut, LayoutDashboard, TrendingUp, Wallet, Users } from 'lucide-react-native';
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
    itemGap: 8, // <== change this for spacing between tabs
};

const TAB_CONFIG = [
    { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'strategies', label: 'Strategies', icon: TrendingUp },
    { name: 'subscriptions', label: 'Portfolio', icon: Wallet },
    { name: 'members', label: 'Agent', icon: Users },
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

    // const handleLogout = async () => {
    //   await logout();
    //   router.push('/(auth)/signin');
    // };

    return (
        <SafeAreaView className="flex-1 bg-gray-900">
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        position: 'absolute',
                        height: 0, // hide default bar but keep layout
                    },
                }}
                tabBar={(props) => <FloatingTabBar {...props} />}
            >
                <Tabs.Screen
                    name="dashboard"
                    options={{ title: 'Dashboard' }}
                />
                <Tabs.Screen
                    name="strategies"
                    options={{ title: 'Strategies' }}
                />
                <Tabs.Screen
                    name="subscriptions"
                    options={{ title: 'Portfolio' }}
                    listeners={({ navigation }) => ({
                        tabPress: () => {
                            navigation.navigate('subscriptions');
                        },
                    })}
                />
                <Tabs.Screen
                    name="profit-logs"
                    options={{ href: null }}
                />
                <Tabs.Screen
                    name="unsubscribe"
                    options={{ href: null }}
                />
                <Tabs.Screen
                    name="members"
                    options={{ title: 'Agent' }}
                    listeners={({ navigation }) => ({
                        tabPress: () => {
                            navigation.navigate('members');
                        },
                    })}
                />
                <Tabs.Screen
                    name="commission"
                    options={{ href: null }}
                />
            </Tabs>
        </SafeAreaView>
    );
}
