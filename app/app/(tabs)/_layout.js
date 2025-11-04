// app/(tabs)/_layout.js
import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
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

export default function TabsLayout() {
    const { user, logout } = useAuth();
    const router = useRouter();

    return (
        <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
                <TouchableOpacity onPress={() => router.push('/(menu)')}>
                    <Menu size={24} color="#374151" />
                </TouchableOpacity>
                <Text
                    className="text-lg font-semibold text-slate-900"
                    numberOfLines={1}
                >
                    {user?.email}
                </Text>
                <TouchableOpacity onPress={logout}>
                    <LogOut size={24} color="#ef4444" />
                </TouchableOpacity>
            </View>

            {/* Tabs - Only 4 main tabs visible */}
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: '#ea580c',
                    tabBarInactiveTintColor: '#9ca3af',
                    tabBarStyle: {
                        backgroundColor: '#ffffff',
                        borderTopWidth: 1,
                        borderTopColor: '#e5e7eb',
                        height: 70,
                        paddingBottom: 12,
                        paddingTop: 8,
                    },
                    tabBarLabelStyle: {
                        fontSize: 11,
                        fontWeight: '600',
                        marginTop: 4,
                    },
                }}
            >
                {/* Dashboard Tab */}
                <Tabs.Screen
                    name="dashboard"
                    options={{
                        title: 'Dashboard',
                        tabBarIcon: ({ color }) => (
                            <LayoutDashboard size={22} color={color} />
                        ),
                    }}
                />

                {/* Strategies Tab */}
                <Tabs.Screen
                    name="strategies"
                    options={{
                        title: 'Strategies',
                        tabBarIcon: ({ color }) => (
                            <TrendingUp size={22} color={color} />
                        ),
                    }}
                />

                {/* Portfolio Tab (Main) - subscriptions, profit-logs, unsubscribe hidden */}
                <Tabs.Screen
                    name="subscriptions"
                    options={{
                        title: 'Portfolio',
                        tabBarIcon: ({ color }) => (
                            <Wallet size={22} color={color} />
                        ),
                    }}
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            // Navigate to subscriptions main page
                            navigation.navigate('subscriptions');
                        },
                    })}
                />

                {/* Profit Logs - Hidden from tabs, access via subscriptions */}
                <Tabs.Screen
                    name="profit-logs"
                    options={{
                        href: null, // Hide from tab bar
                    }}
                />

                {/* Unsubscribe - Hidden from tabs, access via subscriptions */}
                <Tabs.Screen
                    name="unsubscribe"
                    options={{
                        href: null, // Hide from tab bar
                    }}
                />

                {/* Agent Tab (Main) - members, commission hidden */}
                <Tabs.Screen
                    name="members"
                    options={{
                        title: 'Agent',
                        tabBarIcon: ({ color }) => (
                            <Users size={22} color={color} />
                        ),
                    }}
                    listeners={({ navigation }) => ({
                        tabPress: (e) => {
                            // Navigate to members main page
                            navigation.navigate('members');
                        },
                    })}
                />

                {/* Commission - Hidden from tabs, access via members */}
                <Tabs.Screen
                    name="commission"
                    options={{
                        href: null, // Hide from tab bar
                    }}
                />
            </Tabs>
        </View>
    );
}
