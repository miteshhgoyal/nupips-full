import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function AuthLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animationEnabled: false,
                    contentStyle: { backgroundColor: '#0a0a0a' }
                }}
            >
                <Stack.Screen
                    name="signin"
                    options={{ headerShown: false }}
                />
                <Stack.Screen
                    name="signup"
                    options={{ headerShown: false }}
                />
            </Stack>
        </>
    );
}