import React, { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";

export function AmountInput({
  symbol,
  price,
  balance,
  onChange,
}: {
  symbol: string;
  price?: number;
  balance?: number;
  onChange: (v: { token: number; usd: number }) => void;
}) {
  const [mode, setMode] = useState<"token" | "usd">("usd");
  const [v, setV] = useState("");

  const n = Number(v) || 0;
  const usd = mode === "usd" ? n : (price ? n * price : 0);
  const token = mode === "token" ? n : (price ? n / price : 0);
  const balanceUsd = balance != null && price ? balance * price : undefined;

  const update = (next: string) => {
    setV(next);
    const num = Number(next) || 0;
    onChange({
      token: mode === "token" ? num : (price ? num / price : 0),
      usd: mode === "usd" ? num : (price ? num * price : 0),
    });
  };

  const setMax = () => {
    if (balance == null) return;
    if (mode === "token") update(String(balance));
    else if (price) update((balance * price).toFixed(2));
  };

  return (
    <View className="rounded-xl border border-border bg-white/3 p-5">
      <View className="flex-row items-baseline justify-center gap-2">
        <Text className="text-3xl font-mono font-semibold text-muted-foreground">
          {mode === "usd" ? "$" : ""}
        </Text>
        <TextInput
          autoFocus
          keyboardType="decimal-pad"
          value={v}
          onChangeText={(t) => update(t.replace(/[^\d.]/g, ""))}
          placeholder="0"
          placeholderTextColor="rgba(140,140,160,0.4)"
          className="w-36 text-center text-5xl font-mono font-semibold text-foreground"
          style={{ minWidth: 80 }}
        />
        <Text className="text-3xl font-mono font-semibold text-muted-foreground">
          {mode === "token" ? symbol : ""}
        </Text>
      </View>
      <Text className="text-center text-xs text-muted-foreground font-mono mt-2">
        ≈ {mode === "usd" ? `${token.toFixed(token < 1 ? 6 : 4)} ${symbol}` : `$${usd.toFixed(2)}`}
      </Text>
      <View className="mt-4 flex-row items-center justify-between">
        <Pressable onPress={() => setMode((m) => (m === "usd" ? "token" : "usd"))}>
          <Text className="text-xs text-primary font-medium">
            Switch to {mode === "usd" ? symbol : "USD"}
          </Text>
        </Pressable>
        {balance != null && (
          <View className="flex-row items-center gap-2">
            <Text className="text-[11px] text-muted-foreground font-mono">
              Bal: {balance.toFixed(balance < 1 ? 6 : 4)} {symbol}
              {balanceUsd ? ` · $${balanceUsd.toFixed(2)}` : ""}
            </Text>
            <Pressable onPress={setMax} className="px-2 py-0.5 rounded-md bg-primary/15">
              <Text className="text-[11px] text-primary font-semibold">MAX</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}
