import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/context/authContext';
import './globals.css';

function MainLayout() {
    const { isAuthenticated, loading } = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) {

            return;
        }

        const currentPath = segments.join('/');


        const inAuthGroup = segments[0] === '(auth)';
        const inTabsGroup = segments[0] === '(tabs)';
        const isOnIndex = segments.length === 0 || segments[0] === 'index';

        if (isAuthenticated) {
            if (inAuthGroup || isOnIndex) {

                router.replace('/(tabs)/dashboard');
            }
        } else {
            if (!inAuthGroup) {

                router.replace('/(auth)/signin');
            }
        }
    }, [isAuthenticated, loading, segments]);

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
                    name="index"
                    options={{
                        headerShown: false,
                        animationEnabled: false,
                    }}
                />
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
