import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';

function Index() {
    return (
        <SafeAreaView className="flex-1 bg-[#0a0a0a] justify-center items-center">
            <StatusBar style="light" />
            <ActivityIndicator size="large" color="#ea580c" />
        </SafeAreaView>
    );
}

export default Index;