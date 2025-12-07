import { Stack } from 'expo-router';

export default function GtcfxLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: '#111827' }
            }}
        >
            <Stack.Screen name="auth" options={{ title: 'Authentication' }} />
            <Stack.Screen name="dashboard" options={{ title: 'Dashboard' }} />
            <Stack.Screen name="profit-logs" options={{ title: 'Profit Logs' }} />
            <Stack.Screen name="agent-members" options={{ title: 'Agent Members' }} />
        </Stack>
    );
}
