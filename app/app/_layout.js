import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/context/authContext';
import { GTCFxAuthProvider } from '@/context/gtcfxAuthContext';
import './globals.css';

function MainLayout() {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const rootSegment = segments[0];
        const inAuthGroup = rootSegment === '(auth)';
        const inTabsGroup = rootSegment === '(tabs)';
        const isOnIndex = segments.length === 0 || rootSegment === 'index';

        if (isAuthenticated) {
            if (inAuthGroup || isOnIndex) {
                router.replace('/(tabs)/dashboard');
            }
        } else {
            if (!inAuthGroup) {
                router.replace('/(auth)/signin');
            }
        }
    }, [isAuthenticated, loading, segments, router]);

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-900">
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <Stack screenOptions={{
                headerShown: false,
                animationEnabled: false,
                contentStyle: { backgroundColor: '#111827' }
            }}>
                <Stack.Screen
                    name="index"
                    options={{ headerShown: false, animationEnabled: false }}
                />
                <Stack.Screen
                    name="(auth)"
                    options={{ headerShown: false, animationEnabled: false }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false, animationEnabled: false }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <GTCFxAuthProvider>
                <MainLayout />
            </GTCFxAuthProvider>
        </AuthProvider>
    );
}
