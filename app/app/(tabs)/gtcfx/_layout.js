import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function GtcfxLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    headerStyle: {
                        backgroundColor: '#0a0a0a',
                    },
                    headerTintColor: '#ffffff',
                    headerTitleStyle: {
                        fontWeight: 'bold',
                        fontSize: 18,
                    },
                    headerShadowVisible: false,
                    contentStyle: {
                        backgroundColor: '#0a0a0a',
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
                        headerShown: false,
                        headerLeft: () => null,
                    }}
                />

                {/* Main Dashboard */}
                <Stack.Screen
                    name="dashboard"
                    options={{
                        title: 'GTC FX Dashboard',
                        headerShown: false,
                    }}
                />

                {/* Profit Logs */}
                <Stack.Screen
                    name="profit-logs"
                    options={{
                        title: 'Profit Logs',
                        headerShown: false,
                    }}
                />

                {/* Agent Members */}
                <Stack.Screen
                    name="agent-members"
                    options={{
                        title: 'Agent Members',
                        headerShown: false,
                    }}
                />
            </Stack>
        </>
    );
}