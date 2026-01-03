import React from "react";
import { View, Text } from "react-native";

const InfoCard = ({
  label,
  value,
  bgColor = "bg-black/30",
  textColor = "text-white",
  border,
}) => (
  <View className={`flex-1 ${bgColor} ${border || ""} rounded-xl p-5`}>
    <Text className="text-neutral-400 text-xs mb-2">{label}</Text>
    <Text className={`${textColor} text-2xl font-bold`}>{value}</Text>
  </View>
);

export default InfoCard;
