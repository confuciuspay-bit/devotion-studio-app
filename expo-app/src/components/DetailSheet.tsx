import React, { useEffect, useRef } from "react";
import {
  View,
  Modal,
  Animated,
  TouchableWithoutFeedback,
  ScrollView,
  Pressable,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";

interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function DetailSheet({ open, onClose, title, children }: DetailSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(600)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (open) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, damping: 20, stiffness: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 600, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [open]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1">
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View className="absolute inset-0 bg-black/70" style={{ opacity }} />
        </TouchableWithoutFeedback>

        <Animated.View
          className="absolute inset-x-0 bottom-0 bg-card rounded-t-2xl border-t border-x border-border"
          style={{ transform: [{ translateY }], paddingBottom: insets.bottom + 80 }}
        >
          <View className="pt-3 pb-1 items-center">
            <View className="h-[3px] w-8 rounded-full bg-white/12" />
          </View>

          <View className="px-5 pt-1 pb-3 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground flex-1">{title}</Text>
            <Pressable
              onPress={onClose}
              className="w-7 h-7 items-center justify-center rounded-md bg-white/4 border border-border"
            >
              <X size={14} color="#8c8ca0" />
            </Pressable>
          </View>

          <ScrollView
            className="px-5"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 580 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
