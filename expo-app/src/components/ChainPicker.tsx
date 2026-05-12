import React from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { CoinIcon } from "./CoinIcon";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/lib/chains";
import { useCoinChains } from "@/lib/coinChains";

export function ChainPicker({
  coinId,
  filter,
  onPick,
}: {
  coinId?: string | null;
  filter?: (c: Chain) => boolean;
  onPick: (c: Chain) => void;
}) {
  const { data: coinChains, isFetching } = useCoinChains(coinId);

  let list: Chain[] = coinId ? coinChains ?? [] : CHAINS;
  if (filter) list = list.filter(filter);

  return (
    <View className="gap-3">
      {coinId && (
        <Text className="text-[11px] text-muted-foreground px-1">
          Networks where this asset exists
        </Text>
      )}
      <ScrollView
        className="rounded-lg border border-border bg-card"
        style={{ maxHeight: 380 }}
        showsVerticalScrollIndicator={false}
      >
        {isFetching && coinId && !list.length && (
          <View className="py-8 items-center">
            <ActivityIndicator size="small" color="#8c8ca0" />
          </View>
        )}
        {!isFetching && coinId && !list.length && (
          <Text className="text-center text-sm text-muted-foreground py-8 px-4">
            No supported networks for this asset.
          </Text>
        )}
        {list.map((c, idx) => (
          <Pressable
            key={c.id}
            onPress={() => onPick(c)}
            className={`flex-row items-center gap-3 px-3 py-3 ${idx < list.length - 1 ? "border-b border-border" : ""}`}
          >
            <CoinIcon src={c.logo} symbol={c.shortName} size={30} />
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-medium text-foreground">{c.name}</Text>
              <Text className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                {c.kind} · {c.shortName}
                {c.shielded ? " · shielded" : ""}
              </Text>
            </View>
            <Text className="text-[10px] text-muted-foreground font-mono">
              ${c.fixedFeeUsd[0].toFixed(2)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
