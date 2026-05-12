import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Star, ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react-native";
import { useCoin, useCoinChart, fmtUsd, fmtPct, fmtCompact } from "@/lib/markets";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";

const RANGES = [
  { d: 1, l: "1D" },
  { d: 7, l: "1W" },
  { d: 30, l: "1M" },
  { d: 90, l: "3M" },
  { d: 365, l: "1Y" },
];

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <View>
      <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</Text>
      <Text className="text-sm font-mono tabular-nums mt-0.5 text-foreground">{v}</Text>
    </View>
  );
}

export default function CoinDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: coin, isLoading } = useCoin(id);
  const [days, setDays] = useState(7);
  const { data: chart } = useCoinChart(id, days);

  const prices = chart?.prices.map((p: [number, number]) => p[1]) ?? [];
  const up = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-2 flex-row items-center justify-between">
        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 items-center justify-center rounded-md bg-card border border-border"
        >
          <ArrowLeft size={16} color="#8c8ca0" />
        </Pressable>
        <View className="flex-row items-center gap-2">
          {coin && <CoinIcon src={coin.image.large} symbol={coin.symbol} size={24} />}
          <Text className="font-medium text-foreground">{coin?.name ?? "Loading…"}</Text>
        </View>
        <Pressable className="w-8 h-8 items-center justify-center rounded-md bg-card border border-border">
          <Star size={16} color="#8c8ca0" />
        </Pressable>
      </View>

      {isLoading || !coin ? (
        <View className="items-center py-20">
          <ActivityIndicator color="#8c8ca0" size="large" />
        </View>
      ) : (
        <>
          <View className="px-5 mt-2">
            <Text className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {coin.symbol.toUpperCase()} · USD
            </Text>
            <Text className="text-4xl font-mono font-semibold tabular-nums text-foreground mt-1">
              {fmtUsd(coin.market_data.current_price.usd)}
            </Text>
            <Text className={`text-xs font-mono mt-1 ${(coin.market_data.price_change_percentage_24h ?? 0) >= 0 ? "text-success" : "text-destructive"}`}>
              {fmtPct(coin.market_data.price_change_percentage_24h)} · 24h
            </Text>
          </View>

          <View className="px-5 mt-4">
            <View className="rounded-lg border border-border bg-card p-3">
              <Sparkline data={prices} width={340} height={160} positive={up} />
              <View className="mt-3 flex-row gap-1">
                {RANGES.map((r) => (
                  <Pressable
                    key={r.d}
                    onPress={() => setDays(r.d)}
                    className={`flex-1 py-1.5 rounded-md items-center ${days === r.d ? "bg-primary" : ""}`}
                  >
                    <Text className={`text-[11px] font-medium ${days === r.d ? "text-white" : "text-muted-foreground"}`}>
                      {r.l}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View className="px-5 mt-5 flex-row gap-2">
            {[
              { l: "Send", i: ArrowUpRight },
              { l: "Receive", i: ArrowDownLeft },
              { l: "Swap", i: Repeat },
            ].map((a) => (
              <Pressable
                key={a.l}
                className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center gap-1"
              >
                <a.i size={16} color="#6366f1" />
                <Text className="text-[11px] font-medium text-foreground">{a.l}</Text>
              </Pressable>
            ))}
          </View>

          <View className="px-5 mt-5">
            <Text className="text-sm font-semibold text-foreground mb-3">Stats</Text>
            <View className="rounded-lg border border-border bg-card p-4 flex-row flex-wrap gap-y-3 gap-x-4">
              <View className="w-[45%]"><Stat l="Market cap" v={fmtUsd(coin.market_data.market_cap.usd, { maximumFractionDigits: 0 })} /></View>
              <View className="w-[45%]"><Stat l="Volume 24h" v={fmtCompact(coin.market_data.total_volume.usd)} /></View>
              <View className="w-[45%]"><Stat l="High 24h" v={fmtUsd(coin.market_data.high_24h.usd)} /></View>
              <View className="w-[45%]"><Stat l="Low 24h" v={fmtUsd(coin.market_data.low_24h.usd)} /></View>
              <View className="w-[45%]"><Stat l="Supply" v={fmtCompact(coin.market_data.circulating_supply)} /></View>
              <View className="w-[45%]"><Stat l="7d" v={fmtPct(coin.market_data.price_change_percentage_7d)} /></View>
              <View className="w-[45%]"><Stat l="30d" v={fmtPct(coin.market_data.price_change_percentage_30d)} /></View>
            </View>
          </View>

          {coin.description.en ? (
            <View className="px-5 mt-5">
              <Text className="text-sm font-semibold text-foreground mb-2">About {coin.name}</Text>
              <Text className="text-sm text-muted-foreground leading-relaxed" numberOfLines={6}>
                {coin.description.en.replace(/<[^>]*>/g, "")}
              </Text>
              {coin.links.homepage[0] ? (
                <Pressable onPress={() => Linking.openURL(coin.links.homepage[0])} className="mt-3 flex-row items-center gap-1">
                  <Text className="text-xs text-primary">
                    {coin.links.homepage[0].replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
