import React, { useEffect } from "react";
import { View } from "react-native";
import { Slot, useRouter } from "expo-router";
import { useApp } from "@/lib/store";
import { BottomNav } from "@/components/BottomNav";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const initialised = useApp((s) => s.initialised);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!initialised) {
      router.replace("/onboarding");
    }
  }, [initialised]);

  return (
    <View className="flex-1 bg-background">
      <Slot />
      <BottomNav />
    </View>
  );
}
