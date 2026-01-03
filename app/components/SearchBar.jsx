import React from "react";
import { View, TextInput } from "react-native";
import { Search } from "lucide-react-native";

const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Search for something",
}) => (
  <View className="bg-neutral-900/50 rounded-2xl px-4 py-3 flex-row items-center mb-5">
    <Search size={20} color="#737373" style={{ marginRight: 10 }} />
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#737373"
      className="flex-1 text-white text-base"
    />
  </View>
);

export default SearchBar;
