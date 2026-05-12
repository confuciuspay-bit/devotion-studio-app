import React from "react";
import { View, Text, Pressable } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Wallet, ChartLine, Store, Shield, CreditCard } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const tabs = [
  { to: "/", label: "Wallet", icon: Wallet },
  { to: "/markets", label: "Markets", icon: ChartLine },
  { to: "/pay", label: "Pay", icon: Store },
  { to: "/vault", label: "Vault", icon: Shield },
  { to: "/spend", label: "Spend", icon: CreditCard },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      className="absolute bottom-0 inset-x-0 z-30 px-3 pt-1.5"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View className="rounded-lg border border-border bg-card/90 px-1 py-1 flex-row items-center justify-between">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Pressable
              key={to}
              onPress={() => router.push(to)}
              className={`flex-1 flex-col items-center gap-0.5 px-1 py-2 rounded-md ${
                active ? "bg-primary/10" : ""
              }`}
            >
              <Icon
                size={17}
                color={active ? "#6366f1" : "#8c8ca0"}
                strokeWidth={active ? 2.2 : 1.7}
              />
              <Text className={`text-[10px] font-medium tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
