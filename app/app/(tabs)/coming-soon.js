import React from 'react';
import {
    View,
    Text,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import {
    Code2,
    Zap,
    Rocket,
    Settings,
    AlertCircle,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const ComingSoon = () => {
    return (
        <SafeAreaView className="flex-1 bg-gradient-to-b from-gray-900 via-gray-900 to-black">
            <StatusBar style="light" />

            {/* Header */}
            <View className="bg-gray-800/40 border-b border-gray-800 px-4 py-4">
                <View className="flex-row items-center justify-center">
                    <Code2 size={28} color="#ea580c" />
                    <Text className="text-2xl font-light text-white ml-3">Development</Text>
                </View>
            </View>

            <View className="flex-1 px-6 justify-center items-center">
                {/* Main Icon */}
                <View className="w-48 h-48 bg-gray-800/50 border border-gray-700/30 rounded-3xl items-center justify-center mb-8 shadow-2xl shadow-black/50">
                    <Rocket size={64} color="#ea580c" />
                    <View className="w-24 h-24 bg-orange-600/30 border border-orange-600/50 rounded-2xl items-center justify-center mt-4">
                        <Zap size={32} color="#ffffff" />
                    </View>
                </View>

                {/* Title */}
                <Text className="text-4xl font-bold text-white text-center mb-4 px-8 leading-tight">
                    Coming Soon
                </Text>

                {/* Subtitle */}
                <Text className="text-xl font-light text-gray-300 text-center mb-8 px-12 leading-relaxed">
                    This feature is under active development and will be available soon.
                </Text>

                {/* Development Status */}
                <View className="bg-gray-900/70 border border-gray-700/50 rounded-2xl p-6 mb-8 w-full max-w-md">
                    <View className="flex-row items-center mb-4">
                        <View className="w-3 h-3 bg-orange-500 rounded-full mr-3" />
                        <Text className="text-lg font-semibold text-orange-400">Development Mode</Text>
                    </View>
                    <View className="space-y-3">
                        <View className="flex-row items-center">
                            <Settings size={18} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm ml-3">Backend APIs: In Progress</Text>
                        </View>
                        <View className="flex-row items-center">
                            <Zap size={18} color="#9ca3af" />
                            <Text className="text-gray-400 text-sm ml-3">UI Components: 80% Complete</Text>
                        </View>
                        <View className="flex-row items-center">
                            <AlertCircle size={18} color="#f59e0b" />
                            <Text className="text-gray-400 text-sm ml-3">Testing Phase: Active</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row w-full max-w-md space-x-4">
                    <TouchableOpacity
                        className="flex-1 bg-gray-800/60 border border-gray-700/50 rounded-xl py-5 items-center active:bg-gray-800/80"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-semibold text-lg">Watch Progress</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-orange-600 rounded-xl py-5 items-center active:bg-orange-700 shadow-lg shadow-orange-500/25"
                        activeOpacity={0.9}
                    >
                        <Text className="text-white font-bold text-lg">Notify Me</Text>
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View className="mt-12 pt-8 border-t border-gray-800">
                    <Text className="text-center text-gray-500 text-sm">
                        Stay tuned for the launch 🚀
                    </Text>
                    <Text className="text-center text-gray-600 text-xs mt-1">
                        Expected Q1 2026
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default ComingSoon;
