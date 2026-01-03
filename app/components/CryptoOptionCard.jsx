import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Check, Circle } from "lucide-react-native";

const CryptoOptionCard = ({ option, isSelected, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`flex-row items-center justify-between p-5 rounded-2xl border-2 mb-3 ${
      isSelected
        ? "bg-orange-500/10 border-orange-500"
        : "bg-neutral-900/40 border-neutral-800"
    }`}
    activeOpacity={0.7}
  >
    <View className="flex-row items-center flex-1">
      {/* Radio Button */}
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-4 ${
          isSelected ? "border-orange-500 bg-orange-500" : "border-neutral-600"
        }`}
      >
        {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-white font-bold text-base mb-1">
          {option.label}
        </Text>
        <Text className="text-neutral-500 text-xs">{option.network}</Text>
      </View>
    </View>

    {/* Fee Badge */}
    <View className="bg-green-500/15 px-3 py-1.5 rounded-lg">
      <Text className="text-green-400 text-xs font-bold">{option.fee}</Text>
    </View>
  </TouchableOpacity>
);

export default CryptoOptionCard;
