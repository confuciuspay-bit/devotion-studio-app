import React, { useState } from "react";
import { View, Text, Pressable, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { useMarkets, fmtPct, fmtCompact, DEFAULT_IDS } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { Star, TrendingUp } from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WATCH_KEY = "umbra:watchlist";

const DEFAULT_WATCH = ["zcash", "bitcoin", "ethereum"];

export default function MarketsPage() {
  const router = useRouter();
  const { data, isLoading, error } = useMarkets(DEFAULT_IDS);
  const { fmt } = useMoney();
  const [tab, setTab] = useState<"all" | "watch" | "gainers">("all");
  const [q, setQ] = useState("");
  const [watch, setWatch] = useState<string[]>(DEFAULT_WATCH);

  const toggleWatch = (id: string) => {
    setWatch((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      AsyncStorage.setItem(WATCH_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  let list = data ?? [];
  if (tab === "watch") list = list.filter((c) => watch.includes(c.id));
  if (tab === "gainers") list = [...list].sort((a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
  if (q) {
    const Q = q.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(Q) || c.symbol.toLowerCase().includes(Q));
  }

  const featured = (data ?? []).filter((c) => ["zcash", "bitcoin", "ethereum"].includes(c.id));

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
      <AppHeader />

      {/* Featured cards */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5" contentContainerStyle={{ gap: 12, paddingRight: 20 }}>
          {featured.map((c) => {
            const up = (c.price_change_percentage_24h ?? 0) >= 0;
            return (
              <Pressable
                key={c.id}
                onPress={() => router.push(`/coin/${c.id}`)}
                className="w-64 rounded-lg border border-border bg-card p-5"
              >
                <View className="flex-row items-center gap-3">
                  <CoinIcon src={c.image} symbol={c.symbol} size={38} />
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{c.name}</Text>
                    <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">{c.symbol}</Text>
                  </View>
                  <View className={`px-1.5 py-0.5 rounded ${up ? "bg-success/12" : "bg-destructive/12"}`}>
                    <Text className={`text-[11px] font-mono ${up ? "text-success" : "text-destructive"}`}>
                      {fmtPct(c.price_change_percentage_24h)}
                    </Text>
                  </View>
                </View>
                <Text className="mt-4 text-2xl font-mono font-semibold tabular-nums text-foreground">
                  {fmt(c.current_price)}
                </Text>
                <View className="mt-2">
                  <Sparkline data={c.sparkline_in_7d?.price ?? []} width={220} height={44} positive={up} />
                </View>
              </Pressable>
            );
          })}
          {isLoading && [0, 1, 2].map((i) => (
            <View key={i} className="w-64 h-40 rounded-lg border border-border bg-card" />
          ))}
        </ScrollView>
      </View>

      {/* Search */}
      <View className="px-5 mt-4">
        <View className="flex-row items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search coins…"
            placeholderTextColor="#8c8ca0"
            className="bg-transparent text-sm flex-1 text-foreground"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
          <View className="flex-row gap-1.5">
            {(["all", "watch", "gainers"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md border ${tab === t ? "bg-primary border-primary" : "bg-card border-border"}`}
              >
                <Text className={`text-[11px] font-medium ${tab === t ? "text-white" : "text-muted-foreground"}`}>
                  {t === "all" ? "All" : t === "watch" ? `Watchlist (${watch.length})` : "Top movers"}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* List */}
      <View className="px-5 mt-3">
        {error && (
          <View className="rounded-md border border-destructive/20 bg-destructive/5 p-3 mb-3">
            <Text className="text-sm text-destructive">Couldn't load market data.</Text>
          </View>
        )}
        {isLoading && !data && (
          <View className="items-center py-12">
            <ActivityIndicator color="#8c8ca0" />
          </View>
        )}
        <View className="rounded-lg border border-border bg-card overflow-hidden">
          {list.map((c, idx) => {
            const up = (c.price_change_percentage_24h ?? 0) >= 0;
            const starred = watch.includes(c.id);
            return (
              <View key={c.id} className={`flex-row items-center gap-3 px-3 py-3 ${idx < list.length - 1 ? "border-b border-border" : ""}`}>
                <Pressable onPress={() => toggleWatch(c.id)} className="p-1 -ml-1">
                  <Star size={14} color={starred ? "#6366f1" : "#8c8ca0"} fill={starred ? "#6366f1" : "none"} />
                </Pressable>
                <Pressable
                  onPress={() => router.push(`/coin/${c.id}`)}
                  className="flex-row items-center gap-3 flex-1 min-w-0"
                >
                  <CoinIcon src={c.image} symbol={c.symbol} size={34} />
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{c.name}</Text>
                    <Text className="text-[11px] text-muted-foreground font-mono">
                      {c.symbol.toUpperCase()} · {fmtCompact(c.market_cap)}
                    </Text>
                  </View>
                  <Sparkline data={c.sparkline_in_7d?.price ?? []} positive={up} />
                  <View className="items-end w-[70px]">
                    <Text className="text-sm font-mono tabular-nums text-foreground">{fmt(c.current_price)}</Text>
                    <Text className={`text-[11px] font-mono ${up ? "text-success" : "text-destructive"}`}>
                      {fmtPct(c.price_change_percentage_24h)}
                    </Text>
                  </View>
                </Pressable>
              </View>
            );
          })}
          {!isLoading && list.length === 0 && (
            <View className="py-10 items-center gap-2">
              <TrendingUp size={16} color="#8c8ca0" />
              <Text className="text-sm text-muted-foreground">
                {tab === "watch" ? "Tap the star to add coins to your watchlist." : "No matches."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
