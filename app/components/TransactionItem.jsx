import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const TransactionItem = ({ icon, title, subtitle, amount, type, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center justify-between py-4 px-4 bg-neutral-900/40 rounded-2xl mb-3"
  >
    <View className="flex-row items-center flex-1">
      <View
        className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
          type === "deposit"
            ? "bg-green-500/15"
            : type === "withdrawal"
              ? "bg-red-500/15"
              : "bg-cyan-500/15"
        }`}
      >
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-white font-semibold text-base mb-1">{title}</Text>
        <Text className="text-neutral-500 text-sm">{subtitle}</Text>
      </View>
    </View>
    <View className="items-end">
      <Text
        className={`text-base font-bold ${
          type === "deposit"
            ? "text-green-400"
            : type === "withdrawal"
              ? "text-red-400"
              : "text-white"
        }`}
      >
        {amount}
      </Text>
    </View>
  </TouchableOpacity>
);

export default TransactionItem;
