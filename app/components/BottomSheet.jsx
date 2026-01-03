import React, { useEffect, useRef } from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
  PanResponder,
  Dimensions,
} from "react-native";

const { height } = Dimensions.get("window");

const BottomSheet = ({
  visible,
  onClose,
  children,
  height: sheetHeight = height * 0.6,
}) => {
  const translateY = useRef(new Animated.Value(sheetHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: sheetHeight,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, sheetHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={{
            transform: [{ translateY }],
            height: sheetHeight,
          }}
          className="bg-[#0f0f0f] rounded-t-3xl"
        >
          <View {...panResponder.panHandlers} className="items-center py-3">
            <View className="w-12 h-1.5 bg-neutral-700 rounded-full" />
          </View>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BottomSheet;
