import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";

const ActionSheetItem = ({
  icon,
  title,
  subtitle,
  bgColor,
  iconColor,
  onPress,
}) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-neutral-900/50 rounded-2xl p-5 mb-3"
    activeOpacity={0.7}
  >
    <View className="rounded-xl p-3 mr-4" style={{ backgroundColor: bgColor }}>
      {icon}
    </View>
    <View className="flex-1">
      <Text className="text-white font-semibold text-lg mb-1">{title}</Text>
      <Text className="text-neutral-400 text-sm">{subtitle}</Text>
    </View>
    <ChevronRight size={20} color="#737373" />
  </TouchableOpacity>
);

export default ActionSheetItem;
