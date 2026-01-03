import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const StatCard = ({ icon, label, value, trend, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-1 bg-neutral-900/50 rounded-2xl p-5"
  >
    <View className="flex-row items-center justify-between mb-3">
      {icon}
      {trend && (
        <View
          className={`px-2 py-1 rounded-lg ${trend > 0 ? "bg-green-500/20" : "bg-red-500/20"}`}
        >
          <Text
            className={`text-xs font-semibold ${trend > 0 ? "text-green-400" : "text-red-400"}`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </Text>
        </View>
      )}
    </View>
    <Text className="text-neutral-400 text-xs mb-2">{label}</Text>
    <Text className="text-white text-2xl font-bold">{value}</Text>
  </TouchableOpacity>
);

export default StatCard;
