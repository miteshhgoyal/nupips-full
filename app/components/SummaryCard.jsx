import React from "react";
import { View, Text, TouchableOpacity } from "react-native";

const SummaryCard = ({
  icon,
  label,
  value,
  valueColor = "text-white",
  bgColor,
  iconBgColor,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className={`flex-1 ${bgColor || "bg-neutral-900/50"} rounded-2xl p-4`}
  >
    <View
      className={`w-12 h-12 rounded-xl items-center justify-center mb-3 ${iconBgColor || "bg-neutral-800/30"}`}
    >
      {icon}
    </View>
    <Text className="text-neutral-400 text-xs mb-2">{label}</Text>
    <Text className={`${valueColor} text-xl font-bold`}>{value}</Text>
  </TouchableOpacity>
);

export default SummaryCard;
