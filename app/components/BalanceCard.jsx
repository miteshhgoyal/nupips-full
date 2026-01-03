import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff, MoreVertical } from "lucide-react-native";

const BalanceCard = ({
  balance,
  balanceVisible,
  onToggleVisibility,
  onMorePress,
  cardHolder,
  userId,
}) => (
  <View className="px-5 mb-6">
    <View className="rounded-3xl overflow-hidden" style={{ height: 200 }}>
      <LinearGradient
        colors={["#ea580c", "#c2410c", "#9a3412"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1 p-6 justify-between"
      >
        <View className="flex-row justify-between items-start">
          <View>
            <Text className="text-white/70 text-sm mb-2">Total Balance</Text>
            <View className="flex-row items-center">
              {balanceVisible ? (
                <Text className="text-white text-4xl font-bold">
                  ${balance}
                </Text>
              ) : (
                <Text className="text-white text-4xl font-bold">••••••</Text>
              )}
              <TouchableOpacity
                onPress={onToggleVisibility}
                className="ml-3 p-1"
                activeOpacity={0.7}
              >
                {balanceVisible ? (
                  <Eye size={20} color="#fff" />
                ) : (
                  <EyeOff size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={onMorePress}
            className="bg-white/20 rounded-xl p-2"
            activeOpacity={0.7}
          >
            <MoreVertical size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between items-end">
          <View>
            <Text className="text-white/60 text-xs mb-1">ACCOUNT HOLDER</Text>
            <Text className="text-white text-sm font-semibold">
              {cardHolder}
            </Text>
          </View>
          <View>
            <Text className="text-white/60 text-xs mb-1">ID</Text>
            <Text className="text-white text-sm font-semibold">#{userId}</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  </View>
);

export default BalanceCard;
