import React, { useState } from 'react';
import { View, TouchableOpacity, Text, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { useAuth } from '@/context/authContext';
import { Menu, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import {
    LayoutDashboard,
    TrendingUp,
    Wallet,
    Users,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ACTIVE_TAB_COLOR = '#ea580c';
const INACTIVE_TAB_COLOR = '#9ca3af';
const BACKGROUND_COLOR = '#ffffff';
const BORDER_COLOR = '#e5e7eb';

export default function TabsLayout() {
    const { user, logout } = useAuth();
    const router = useRouter();
    const screenWidth = Dimensions.get('window').width;

    const handleLogout = () => {
        logout();
        router.push('/(auth)/signin');
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header Section */}
            <View className="flex-row items-center justify-between px-4 py-4 bg-gradient-to-r from-white to-gray-50 border-b border-gray-200">
                <View className="flex-1">
                    <Text className="text-xl font-bold text-slate-900">
                        Nupips
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                        Welcome back, {user?.nickname || 'User'}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleLogout}
                    className="p-2 rounded-lg hover:bg-red-50"
                    activeOpacity={0.7}
                >
                    <LogOut size={24} color={ACTIVE_TAB_COLOR} />
                </TouchableOpacity>
            </View>

            {/* Main Content */}
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: ACTIVE_TAB_COLOR,
                    tabBarInactiveTintColor: INACTIVE_TAB_COLOR,
                    tabBarStyle: {
                        backgroundColor: BACKGROUND_COLOR,
                        borderTopWidth: 1,
                        borderTopColor: BORDER_COLOR,
                        height: 75,
                        paddingBottom: 8,
                        paddingTop: 8,
                        elevation: 8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 4,
                        letterSpacing: 0.3,
                    },
                    tabBarItemStyle: {
                        paddingVertical: 6,
                    },
                    animation: 'fade',
                }}
            >
                {/* Dashboard Tab */}
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ color, focused }) => (
                            <View className="items-center justify-center">
                                <LayoutDashboard
                                    size={focused ? 26 : 22}
                                    color={color}
                                    strokeWidth={focused ? 2.5 : 2}
                                />
                                {focused && (
                                    <View className="w-1 h-1 rounded-full mt-1"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </View>
                        ),
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{
                                fontSize: 11,
                                fontWeight: focused ? '700' : '600',
                                color: color,
                                marginTop: 2,
                            }}>
                                Dashboard
                            </Text>
                        ),
                    }}
                />

                {/* Strategies Tab */}
                <Tabs.Screen
                    name="strategies"
                    options={{
                        title: 'Strategies',
                        tabBarIcon: ({ color, focused }) => (
                            <View className="items-center justify-center">
                                <TrendingUp
                                    size={focused ? 26 : 22}
                                    color={color}
                                    strokeWidth={focused ? 2.5 : 2}
                                />
                                {focused && (
                                    <View className="w-1 h-1 rounded-full mt-1"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </View>
                        ),
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{
                                fontSize: 11,
                                fontWeight: focused ? '700' : '600',
                                color: color,
                                marginTop: 2,
                            }}>
                                Strategies
                            </Text>
                        ),
                    }}
                />

                {/* Portfolio Tab */}
                <Tabs.Screen
                    name="subscriptions"
                    options={{
                        title: 'Portfolio',
                        tabBarIcon: ({ color, focused }) => (
                            <View className="items-center justify-center">
                                <Wallet
                                    size={focused ? 26 : 22}
                                    color={color}
                                    strokeWidth={focused ? 2.5 : 2}
                                />
                                {focused && (
                                    <View className="w-1 h-1 rounded-full mt-1"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </View>
                        ),
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{
                                fontSize: 11,
                                fontWeight: focused ? '700' : '600',
                                color: color,
                                marginTop: 2,
                            }}>
                                Portfolio
                            </Text>
                        ),
                    }}
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            navigation.navigate('subscriptions');
                        },
                    })}
                />

                {/* Profit Logs - Hidden */}
                <Tabs.Screen
                    name="profit-logs"
                    options={{
                        href: null,
                    }}
                />

                {/* Unsubscribe - Hidden */}
                <Tabs.Screen
                    name="unsubscribe"
                    options={{
                        href: null,
                    }}
                />

                {/* Agent Tab */}
                <Tabs.Screen
                    name="members"
                    options={{
                        title: 'Agent',
                        tabBarIcon: ({ color, focused }) => (
                            <View className="items-center justify-center">
                                <Users
                                    size={focused ? 26 : 22}
                                    color={color}
                                    strokeWidth={focused ? 2.5 : 2}
                                />
                                {focused && (
                                    <View className="w-1 h-1 rounded-full mt-1"
                                        style={{ backgroundColor: color }}
                                    />
                                )}
                            </View>
                        ),
                        tabBarLabel: ({ focused, color }) => (
                            <Text style={{
                                fontSize: 11,
                                fontWeight: focused ? '700' : '600',
                                color: color,
                                marginTop: 2,
                            }}>
                                Agent
                            </Text>
                        ),
                    }}
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            navigation.navigate('members');
                        },
                    })}
                />

                {/* Commission - Hidden */}
                <Tabs.Screen
                    name="commission"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>
        </SafeAreaView>
    );
}
