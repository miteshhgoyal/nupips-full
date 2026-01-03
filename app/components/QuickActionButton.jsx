import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const QuickActionButton = ({ icon, label, onPress, bgColor = "#ea580c20" }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="items-center flex-1"
  >
    <View
      className="w-14 h-14 rounded-3xl items-center justify-center mb-2"
      style={{ backgroundColor: bgColor }}
    >
      {icon}
    </View>
    <Text className="text-neutral-400 text-xs font-medium text-center">
      {label}
    </Text>
  </TouchableOpacity>
);

export default QuickActionButton;
