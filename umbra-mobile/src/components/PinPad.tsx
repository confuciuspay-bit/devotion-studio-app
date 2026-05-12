import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";

export function PinPad({
  title = "Enter PIN",
  subtitle,
  onSubmit,
  onCancel,
}: {
  title?: string;
  subtitle?: string;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
}) {
  const [pin, setPin] = useState("");

  const press = (k: string) => {
    if (k === "<") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        onSubmit(next);
        setPin("");
      }, 100);
    }
  };

  return (
    <View className="items-center">
      <Text className="text-sm font-medium text-foreground">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-muted-foreground mt-1">{subtitle}</Text>
      )}

      {/* PIN dots */}
      <View className="my-6 flex-row justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            className={`w-2.5 h-2.5 rounded-full ${pin.length > i ? "bg-primary" : "bg-white/15"}`}
          />
        ))}
      </View>

      {/* Keypad */}
      <View className="w-full" style={{ gap: 8 }}>
        {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, ri) => (
          <View key={ri} className="flex-row gap-2">
            {row.map((k) => (
              <Pressable
                key={k}
                onPress={() => press(k)}
                className="flex-1 rounded-md bg-white/5 border border-border py-4 items-center"
              >
                <Text className="text-lg font-medium text-foreground">{k}</Text>
              </Pressable>
            ))}
          </View>
        ))}
        <View className="flex-row gap-2">
          {onCancel ? (
            <Pressable
              onPress={onCancel}
              className="flex-1 rounded-md py-4 items-center"
            >
              <Text className="text-xs text-muted-foreground">Cancel</Text>
            </Pressable>
          ) : (
            <View className="flex-1" />
          )}
          <Pressable
            onPress={() => press("0")}
            className="flex-1 rounded-md bg-white/5 border border-border py-4 items-center"
          >
            <Text className="text-lg font-medium text-foreground">0</Text>
          </Pressable>
          <Pressable
            onPress={() => press("<")}
            className="flex-1 rounded-md py-4 items-center"
          >
            <Text className="text-base text-muted-foreground">⌫</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
