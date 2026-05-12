import React from "react";
import { View, Text, Modal } from "react-native";
import { Lock } from "lucide-react-native";
import { PinGate } from "@/components/PinGate";
import { useApp } from "@/lib/store";

export function LockScreen() {
  const locked = useApp((s) => s.locked);
  const merchant = useApp((s) => s.merchant);
  const setLocked = useApp((s) => s.setLocked);

  return (
    <Modal visible={locked} transparent={false} animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-background items-center justify-center px-6">
        <View className="w-full max-w-xs">
          <View className="items-center mb-8 gap-2">
            <View className="w-12 h-12 rounded-xl bg-white/5 border border-border items-center justify-center">
              <Lock size={20} color="#6366f1" />
            </View>
            <Text className="text-base font-medium text-foreground mt-1">
              {merchant?.businessName ?? "Umbra"}
            </Text>
            <Text className="text-xs text-muted-foreground">App locked</Text>
          </View>
          <PinGate title="Enter PIN to unlock" onPass={() => setLocked(false)} />
        </View>
      </View>
    </Modal>
  );
}
