// app/index.js
import { ActivityIndicator, View, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Index() {
    return (
        <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
            <StatusBar barStyle="light-content" backgroundColor="#111827" />
            <ActivityIndicator size="large" color="#ea580c" />
        </SafeAreaView>
    );
}

export default Index;
