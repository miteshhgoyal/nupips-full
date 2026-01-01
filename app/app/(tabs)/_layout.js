import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { useGTCFxAuth } from '@/context/gtcfxAuthContext';
import {
    Home,
    Users,
    TrendingUp,
    User,
    MoreHorizontal,
    LayoutDashboard,
    Badge,
} from 'lucide-react-native';
import { useSegments } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVE_TAB_COLOR = '#ea580c';
const INACTIVE_TAB_COLOR = '#9ca3af';
const BAR_BG = '#111827';
const BAR_BORDER = '#374151';

const TAB_BAR_CONFIG = {
    paddingHorizontal: 12,
    bottomInset: 8,
    barHeight: 72,
    borderRadius: 24,
    itemMinWidth: 64,
    itemGap: 6,
};

function getTabConfig(gtcAuthenticated, gtcLoading) {
    const baseTabs = [
        { name: 'dashboard', label: 'Home', icon: Home },
        { name: 'nupips-team', label: 'Team', icon: Users },
        { name: 'nupips-incomes', label: 'Income', icon: TrendingUp },
        { name: 'profile', label: 'Profile', icon: User },
        { name: 'more', label: 'More', icon: MoreHorizontal },
    ];

    // Dynamic 6th tab: Broker → GTC FX when connected
    if (gtcLoading) {
        baseTabs.push({ name: 'broker-selection', label: 'Broker', icon: Badge });
    } else if (gtcAuthenticated) {
        baseTabs.push({ name: 'gtcfx', label: 'GTC FX', icon: LayoutDashboard });
    } else {
        baseTabs.push({ name: 'broker-selection', label: 'Broker', icon: Badge });
    }

    return baseTabs;
}

// FloatingTabBar remains exactly the same
function FloatingTabBar({ state, descriptors, navigation }) {
    const segments = useSegments();
    const { gtcAuthenticated, gtcLoading } = useGTCFxAuth();

    const isGtcfxNested = segments[0] === 'gtcfx' && segments.length > 1;

    if (isGtcfxNested) {
        return null;
    }

    const TAB_CONFIG = getTabConfig(gtcAuthenticated, gtcLoading);
    const { paddingHorizontal, bottomInset, barHeight, borderRadius, itemMinWidth, itemGap } = TAB_BAR_CONFIG;

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

                        return (
                            <TouchableOpacity
                                key={route.key}
                                accessibilityRole="button"
                                accessibilityState={isFocused ? { selected: true } : {}}
                                onPress={onPress}
                                activeOpacity={0.85}
                                style={{
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: itemMinWidth,
                                    paddingHorizontal: 8,
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
    return (
        <SafeAreaView className="flex-1 bg-gray-900" edges={['top']}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarShowLabel: false,
                    tabBarStyle: {
                        position: 'absolute',
                        height: 1,
                    },
                }}
                tabBar={(props) => <FloatingTabBar {...props} />}
            >
                {/* Core 5 Tabs - Always Visible */}
                <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
                <Tabs.Screen name="nupips-team" options={{ title: 'Team' }} />
                <Tabs.Screen name="nupips-incomes" options={{ title: 'Incomes' }} />

                {/* Dynamic Broker/GTC FX Tab */}
                <Tabs.Screen name="broker-selection" options={{ title: 'Broker' }} />
                <Tabs.Screen name="gtcfx" options={{ title: 'GTC FX' }} />

                <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
                <Tabs.Screen name="more" options={{ title: 'More' }} />

                {/* Hidden Screens */}
                <Tabs.Screen name="deposit" options={{ href: null }} />
                <Tabs.Screen name="withdrawal" options={{ href: null }} />
                <Tabs.Screen name="shop" options={{ href: null }} />
                <Tabs.Screen name="learn" options={{ href: null }} />
                <Tabs.Screen name="transfer" options={{ href: null }} />
                <Tabs.Screen name="transaction-history" options={{ href: null }} />
                <Tabs.Screen name="orders" options={{ href: null }} />
                <Tabs.Screen name="product-item" options={{ href: null }} />
                <Tabs.Screen name="place-order" options={{ href: null }} />
                <Tabs.Screen name="course-view" options={{ href: null }} />
                <Tabs.Screen name="lesson-view" options={{ href: null }} />
                <Tabs.Screen name="coming-soon" options={{ href: null }} />
            </Tabs>
        </SafeAreaView>
    );
}
