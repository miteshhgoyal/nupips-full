import React, { useEffect, useRef } from 'react';
import { Stack, useSegments, useRouter } from 'expo-router';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/context/authContext';
import './globals.css';

function MainLayout() {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();
    const lastRoute = useRef(null);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        // Determine target route
        let targetRoute = null;
        if (isAuthenticated && inAuthGroup) {
            targetRoute = '/(tabs)/dashboard';
        } else if (!isAuthenticated && !inAuthGroup) {
            targetRoute = '/(auth)/signin';
        }

        // Only navigate if route actually needs to change
        if (targetRoute && lastRoute.current !== targetRoute) {
            lastRoute.current = targetRoute;
            router.replace(targetRoute);
        }
    }, [isAuthenticated, loading]); // REMOVED segments

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#ea580c" />
            </View>
        );
    }

    return (
        <>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen
                    name="(auth)"
                    options={{
                        headerShown: false,
                        animationEnabled: false,
                    }}
                />
                <Stack.Screen
                    name="(tabs)"
                    options={{
                        headerShown: false,
                        animationEnabled: false,
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <AuthProvider>
            <MainLayout />
        </AuthProvider>
    );
}
