import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ActivityIndicator, ScrollView } from "react-native";
import { Search } from "lucide-react-native";
import { CoinIcon } from "./CoinIcon";
import { useCoinSearch, useTopMarkets, fmtUsd, fmtPct } from "@/lib/markets";

export interface PickedCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price?: number;
}

export function CoinPicker({ onPick }: { onPick: (c: PickedCoin) => void }) {
  const [q, setQ] = useState("");
  const { data: top } = useTopMarkets(1, 50);
  const { data: search, isFetching } = useCoinSearch(q);

  const list: PickedCoin[] = q.trim().length
    ? (search ?? []).slice(0, 30).map((s) => ({
        id: s.id, symbol: s.symbol, name: s.name, image: s.large,
      }))
    : (top ?? []).map((c) => ({
        id: c.id, symbol: c.symbol.toUpperCase(), name: c.name, image: c.image, price: c.current_price,
      }));

  return (
    <View>
      <View className="flex-row items-center gap-2 rounded-md border border-border bg-white/4 px-3 py-2 mb-3">
        <Search size={14} color="#8c8ca0" />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search coins…"
          placeholderTextColor="#8c8ca0"
          className="flex-1 text-sm text-foreground bg-transparent"
          autoFocus
        />
        {isFetching && <ActivityIndicator size="small" color="#8c8ca0" />}
      </View>

      <ScrollView
        className="rounded-xl border border-border bg-card"
        style={{ maxHeight: 380 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {list.map((c, idx) => {
          const t = top?.find((x) => x.id === c.id);
          return (
            <Pressable
              key={c.id}
              onPress={() => onPick({ ...c, price: t?.current_price ?? c.price })}
              className={`flex-row items-center gap-3 px-3 py-2.5 ${idx < list.length - 1 ? "border-b border-border" : ""}`}
            >
              <CoinIcon src={c.image} symbol={c.symbol} size={30} />
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-foreground">{c.name}</Text>
                <Text className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
                  {c.symbol}
                </Text>
              </View>
              {t && (
                <View className="items-end">
                  <Text className="text-xs font-mono text-foreground">{fmtUsd(t.current_price)}</Text>
                  <Text className={`text-[10px] font-mono ${(t.price_change_percentage_24h ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
                    {fmtPct(t.price_change_percentage_24h)}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
        {!list.length && !isFetching && (
          <Text className="text-center text-sm text-muted-foreground py-8">No matches</Text>
        )}
      </ScrollView>
    </View>
  );
}
