import React from "react";
import { View, Text } from "react-native";
import { Check, Circle, Loader } from "lucide-react-native";

export interface Step {
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

export function StatusTimeline({ steps }: { steps: Step[] }) {
  return (
    <View className="gap-3">
      {steps.map((s, i) => (
        <View key={i} className="flex-row items-start gap-3">
          <View className="mt-0.5 shrink-0">
            {s.status === "done" ? (
              <View className="w-5 h-5 rounded bg-success/15 items-center justify-center">
                <Check size={12} color="#10b981" />
              </View>
            ) : s.status === "active" ? (
              <View className="w-5 h-5 rounded bg-primary/15 items-center justify-center">
                <Loader size={12} color="#6366f1" />
              </View>
            ) : (
              <View className="w-5 h-5 rounded bg-white/4 items-center justify-center">
                <Circle size={6} color="#8c8ca0" fill="#8c8ca0" />
              </View>
            )}
          </View>
          <View className="flex-1 pt-0.5">
            <Text className={`text-sm ${s.status === "pending" ? "text-muted-foreground" : "font-medium text-foreground"}`}>
              {s.label}
            </Text>
            {s.detail && (
              <Text className="text-[11px] text-muted-foreground font-mono mt-0.5">{s.detail}</Text>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
