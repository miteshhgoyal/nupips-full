import React from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useGTCFxAuth } from '@/context/gtcfxAuthContext';
import {
    LayoutDashboard,
    FileText,
    Users,
    X,
} from 'lucide-react-native';

const ACTIVE_TAB_COLOR = '#ea580c';
const INACTIVE_TAB_COLOR = '#9ca3af';
const BAR_BG = '#111827';
const BAR_BORDER = '#374151';

const GTCFX_TAB_CONFIG = {
    paddingHorizontal: 12,
    bottomInset: 8,
    barHeight: 72,
    borderRadius: 24,
    itemMinWidth: 72,
    itemGap: 6,
};

const GTCFX_TAB_BAR_ROUTES = [
    { name: 'index', label: 'Dashboard', icon: LayoutDashboard },
    { name: 'profit-logs', label: 'Profit', icon: FileText },
    { name: 'agent-members', label: 'Members', icon: Users },
];

function GtcfxFloatingTabBar({ state, descriptors, navigation }) {
    const router = useRouter();
    const { gtcAuthenticated } = useGTCFxAuth();
    const { paddingHorizontal, bottomInset, barHeight, borderRadius, itemMinWidth, itemGap } =
        GTCFX_TAB_CONFIG;

    const exitGtcfx = () => {
        router.navigate('/dashboard');
    };

    if (!gtcAuthenticated) {
        return null;
    }

    return (
        <View
            pointerEvents="box-none"
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0, // 👈 Above main tabs (higher z-index due to layout order)
                paddingBottom: bottomInset,
                paddingHorizontal,
                zIndex: 1000, // 👈 Ensure it's above main tabs
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
                    shadowOpacity: 0.45,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: -4 },
                    elevation: 20,
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
                        const config = GTCFX_TAB_BAR_ROUTES.find((t) => t.name === route.name);
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
                                <View>
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

                    {/* EXIT BUTTON */}
                    <TouchableOpacity
                        onPress={exitGtcfx}
                        activeOpacity={0.85}
                        style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: itemMinWidth,
                            paddingHorizontal: 8,
                        }}
                    >
                        <View>
                            <X size={24} color={ACTIVE_TAB_COLOR} strokeWidth={2.5} />
                        </View>
                        <Text
                            style={{
                                marginTop: 4,
                                fontSize: 10,
                                fontWeight: '800',
                                color: ACTIVE_TAB_COLOR,
                                textAlign: 'center',
                            }}
                            numberOfLines={1}
                        >
                            Exit
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </View>
    );
}

export default function GtcfxLayout() {
    const { gtcAuthenticated, gtcLoading } = useGTCFxAuth();

    if (gtcLoading) {
        return (
            <View className="flex-1 bg-gray-900 justify-center items-center">
                <Text className="text-white text-lg">Loading GTC FX...</Text>
            </View>
        );
    }

    if (!gtcAuthenticated) {
        return (
            <View className="flex-1 bg-gray-900 justify-center items-center px-6">
                <Text className="text-white text-xl font-bold text-center mb-4">
                    GTC FX Not Connected
                </Text>
                <Text className="text-gray-400 text-center text-base mb-8">
                    Connect your GTC FX account to access this section
                </Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        position: 'absolute',
                        height: 0,
                    },
                }}
                tabBar={(props) => <GtcfxFloatingTabBar {...props} />}
            >
                <Tabs.Screen name="index" options={{ title: 'GTC FX Dashboard' }} />
                <Tabs.Screen name="profit-logs" options={{ title: 'Profit Logs' }} />
                <Tabs.Screen name="agent-members" options={{ title: 'Agent Members' }} />

                <Tabs.Screen name="auth" options={{ presentation: 'modal', href: null }} />
                <Tabs.Screen name="dashboard" options={{ presentation: 'modal', href: null }} />
            </Tabs>
        </>
    );
}
