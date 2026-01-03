import React from "react";
import { Text, TouchableOpacity } from "react-native";

const QuickAmountButton = ({ amount, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-1 py-3.5 rounded-2xl items-center min-w-[70px] ${
      isActive
        ? "bg-orange-500 shadow-lg"
        : "bg-neutral-900/50 border border-neutral-800"
    }`}
    activeOpacity={0.7}
    style={
      isActive
        ? {
            shadowColor: "#ea580c",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }
        : {}
    }
  >
    <Text
      className={`font-bold text-base ${isActive ? "text-white" : "text-neutral-400"}`}
    >
      ${amount}
    </Text>
  </TouchableOpacity>
);

export default QuickAmountButton;
