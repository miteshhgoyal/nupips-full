import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function GtcfxLayout() {
    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {
                        backgroundColor: '#111827' // gray-900
                    },
                    animation: 'slide_from_right',
                    animationDuration: 250,
                }}
            >
                <Stack.Screen
                    name="auth"
                    options={{
                        title: 'GTC FX Authentication',
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="dashboard"
                    options={{
                        title: 'GTC FX Dashboard',
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="profit-logs"
                    options={{
                        title: 'Profit Logs',
                        presentation: 'card',
                    }}
                />
                <Stack.Screen
                    name="agent-members"
                    options={{
                        title: 'Agent Members',
                        presentation: 'card',
                    }}
                />
            </Stack>
        </>
    );
}
