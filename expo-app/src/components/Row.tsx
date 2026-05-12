import React from "react";
import { View, Text } from "react-native";

export function Row({ l, v, mono }: { l: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 gap-3">
      <Text className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{l}</Text>
      {typeof v === "string" ? (
        <Text
          className={`text-sm text-right text-foreground flex-1 ${mono ? "font-mono" : ""}`}
          numberOfLines={2}
        >
          {v}
        </Text>
      ) : (
        <View className="flex-1 items-end">{v}</View>
      )}
    </View>
  );
}
