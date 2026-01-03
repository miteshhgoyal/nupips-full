import React from "react";
import { View, Text } from "react-native";

const DetailRow = ({ label, value, valueColor = "text-white" }) => (
  <View className="flex-row justify-between py-3 border-t border-neutral-700">
    <Text className="text-neutral-400 text-sm">{label}</Text>
    <Text className={`${valueColor} font-semibold text-sm`}>{value}</Text>
  </View>
);

export default DetailRow;
