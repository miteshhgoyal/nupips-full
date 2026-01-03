import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

const TabButton = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7} className="mr-6">
    <Text
      className={`font-semibold text-base pb-3 ${
        active ? "text-orange-500" : "text-neutral-500"
      }`}
    >
      {label}
    </Text>
    {active && <View className="h-1 bg-orange-500 rounded-full mt-1" />}
  </TouchableOpacity>
);

export default TabButton;
