import React from "react";
import { View, Text, TextInput } from "react-native";
import { AlertCircle } from "lucide-react-native";

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  icon: Icon,
  keyboardType = "default",
  ...props
}) => (
  <View className="mb-5">
    {label && (
      <Text className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
        {label}
      </Text>
    )}
    <View className="relative">
      {Icon && (
        <View className="absolute left-4 top-4 z-10">
          <Icon size={20} color="#9ca3af" />
        </View>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        keyboardType={keyboardType}
        className={`${Icon ? "pl-12" : "pl-4"} pr-4 py-4 text-lg font-semibold text-white rounded-xl border-2 ${
          error
            ? "bg-red-500/5 border-red-500"
            : "bg-black/30 border-neutral-700"
        }`}
        {...props}
      />
    </View>
    {error && (
      <View className="flex-row items-center mt-2.5">
        <AlertCircle size={14} color="#ef4444" style={{ marginRight: 6 }} />
        <Text className="text-xs text-red-400 font-medium">{error}</Text>
      </View>
    )}
  </View>
);

export default InputField;
