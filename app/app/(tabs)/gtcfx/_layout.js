import React from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity } from 'react-native';
import {
    ArrowLeft,
    LayoutDashboard,
    TrendingUp,
    Users,
} from 'lucide-react-native';

export default function GtcfxLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: '#111827',
                    },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: 18,
                    },
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: '#111827',
                    },
                    animation: 'slide_from_right',
                    animationDuration: 250,
                }}
            >
                {/* Auth Screen */}
                <Stack.Screen
                    name="auth"
                    options={{
                        title: 'GTC FX Login',
                        headerLeft: () => null, // No back button on auth
                    }}
                />

                {/* Main Dashboard - Default Screen */}
                <Stack.Screen
                    name="dashboard"
                    options={{
                        headerShown: false,
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="p-2 ml-2"
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={24} color="#ffffff" />
                            </TouchableOpacity>
                        ),
                    }}
                />

                {/* Profit Logs */}
                <Stack.Screen
                    name="profit-logs"
                    options={{
                        title: 'Profit Logs',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="p-2 ml-2"
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={24} color="#ffffff" />
                            </TouchableOpacity>
                        ),
                    }}
                />

                {/* Agent Members */}
                <Stack.Screen
                    name="agent-members"
                    options={{
                        title: 'Agent Members',
                        headerLeft: () => (
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="p-2 ml-2"
                                activeOpacity={0.7}
                            >
                                <ArrowLeft size={24} color="#ffffff" />
                            </TouchableOpacity>
                        ),
                    }}
                />
            </Stack>
        </>
    );
}
