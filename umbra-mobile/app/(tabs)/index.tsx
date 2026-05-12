import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { WalletFlow } from "@/components/flows/WalletFlow";
import { useMarkets, fmtPct } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { ArrowDownLeft, ArrowUpRight, Repeat, Shield, ChevronRight, Lock } from "lucide-react-native";

const HOLDINGS: Record<string, number> = {
  zcash: 142.5,
  bitcoin: 0.0612,
  ethereum: 1.84,
  "usd-coin": 8200,
  solana: 12.4,
};

type Activity = {
  id: string;
  t: string;
  s: string;
  usd: number;
  time: string;
  shield?: boolean;
  type: "shield" | "swap" | "payroll" | "receive";
  hash: string;
  network: string;
  fee: string;
};

const activity: Activity[] = [
  { id: "a1", t: "Shielded into vault", s: "via UmbraVault · ZEC", usd: 1250, time: "2m", shield: true, type: "shield", hash: "0x9f2c…ad11", network: "Zcash · Sapling", fee: "$0.0001" },
  { id: "a2", t: "Swap ETH → ZEC", s: "Streaming · 0.50%", usd: -1480, time: "1h", type: "swap", hash: "0x7b1e…cc24", network: "Maya Protocol", fee: "$1.42" },
  { id: "a3", t: "Payroll batch #218", s: "12 recipients · enhanced", usd: -9840, time: "Yesterday", type: "payroll", hash: "batch:00218", network: "Multi-chain", fee: "$172.20" },
];

function TxRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3">
      <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">{l}</Text>
      <Text className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{v}</Text>
    </View>
  );
}

export default function WalletHome() {
  const router = useRouter();
  const { data } = useMarkets();
  const [openTx, setOpenTx] = useState<Activity | null>(null);
  const [flow, setFlow] = useState<"receive" | "send" | "swap" | "shield" | null>(null);
  const [allHistory, setAllHistory] = useState(false);
  const { fmt, signed, hidden } = useMoney();

  const assets = useMemo(() => {
    if (!data) return [];
    return Object.entries(HOLDINGS)
      .map(([id, qty]) => {
        const m = data.find((x) => x.id === id);
        if (!m) return null;
        return {
          id,
          symbol: m.symbol.toUpperCase(),
          name: m.name,
          image: m.image,
          qty,
          value: qty * m.current_price,
          chg: m.price_change_percentage_24h ?? 0,
          spark: m.sparkline_in_7d?.price ?? [],
        };
      })
      .filter(Boolean) as Array<{ id: string; symbol: string; name: string; image: string; qty: number; value: number; chg: number; spark: number[] }>;
  }, [data]);

  const total = assets.reduce((s, a) => s + a.value, 0);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
      <AppHeader />

      {/* Balance card */}
      <View className="px-5 pt-2">
        <View className="rounded-lg border border-border bg-card p-6">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Total balance</Text>
          <Text className="mt-2 text-4xl font-semibold text-foreground font-mono tabular-nums">
            {total ? fmt(total, { maximumFractionDigits: 0 }) : "—"}
          </Text>

          <View className="mt-6 flex-row gap-2">
            {([
              { icon: ArrowDownLeft, l: "Receive", k: "receive" as const },
              { icon: ArrowUpRight, l: "Send", k: "send" as const },
              { icon: Repeat, l: "Swap", k: "swap" as const },
              { icon: Shield, l: "Shield", k: "shield" as const },
            ]).map(({ icon: Icon, l, k }) => (
              <Pressable
                key={l}
                onPress={() => setFlow(k)}
                className="flex-1 flex-col items-center gap-1.5 rounded-md bg-white/4 border border-border py-3"
              >
                <Icon size={16} color="#6366f1" />
                <Text className="text-[11px] font-medium text-foreground">{l}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      {/* Shielded status */}
      <View className="px-5 mt-3">
        <View className="rounded-lg border border-success/20 bg-success/4 p-4 flex-row items-center gap-3">
          <View className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
          <View className="flex-1 min-w-0">
            <Text className="text-xs font-medium text-foreground">Anonymity set: 4.9M ZEC</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">Last 7 receives transited the shielded pool. On-chain link broken.</Text>
          </View>
          <Lock size={14} color="#10b981" />
        </View>
      </View>

      {/* Assets */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Assets</Text>
          <Pressable onPress={() => router.push("/markets")} className="flex-row items-center gap-0.5">
            <Text className="text-[11px] text-muted-foreground">Markets</Text>
            <ChevronRight size={12} color="#8c8ca0" />
          </Pressable>
        </View>
        <View className="rounded-lg border border-border bg-card overflow-hidden">
          {assets.map((a, idx) => {
            const up = a.chg >= 0;
            return (
              <Pressable
                key={a.id}
                onPress={() => router.push(`/coin/${a.id}`)}
                className={`flex-row items-center gap-3 px-4 py-3 ${idx < assets.length - 1 ? "border-b border-border" : ""}`}
              >
                <CoinIcon src={a.image} symbol={a.symbol} size={34} />
                <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-foreground">{a.symbol}</Text>
                  <Text className="text-[11px] text-muted-foreground">
                    {hidden ? "•••" : a.qty.toLocaleString()} · {a.name}
                  </Text>
                </View>
                <Sparkline data={a.spark} positive={up} width={52} height={20} />
                <View className="items-end w-20">
                  <Text className="text-sm font-mono tabular-nums text-foreground">{fmt(a.value)}</Text>
                  <Text className={`text-[11px] font-mono ${up ? "text-success" : "text-destructive"}`}>
                    {fmtPct(a.chg)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {!assets.length && [0, 1, 2, 3].map((i) => (
            <View key={i} className="h-[58px] px-4 py-3 flex-row items-center gap-3">
              <View className="w-[34px] h-[34px] rounded-full bg-white/5" />
              <View className="flex-1 gap-1.5">
                <View className="h-3 w-16 bg-white/5 rounded" />
                <View className="h-2.5 w-24 bg-white/3 rounded" />
              </View>
              <View className="h-3 w-14 bg-white/5 rounded" />
            </View>
          ))}
        </View>
      </View>

      {/* Activity */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Recent activity</Text>
          <Pressable onPress={() => setAllHistory(true)} className="flex-row items-center gap-0.5">
            <Text className="text-[11px] text-muted-foreground">All history</Text>
            <ChevronRight size={12} color="#8c8ca0" />
          </Pressable>
        </View>
        <View className="rounded-lg border border-border bg-card overflow-hidden">
          {activity.map((a, idx) => (
            <Pressable
              key={a.id}
              onPress={() => setOpenTx(a)}
              className={`px-4 py-3 flex-row items-center gap-3 ${idx < activity.length - 1 ? "border-b border-border" : ""}`}
            >
              <View className={`w-8 h-8 rounded-md items-center justify-center shrink-0 ${a.shield ? "bg-success/12" : "bg-white/5"}`}>
                {a.shield ? <Shield size={14} color="#10b981" /> : <Repeat size={14} color="#8c8ca0" />}
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm text-foreground" numberOfLines={1}>{a.t}</Text>
                <Text className="text-[11px] text-muted-foreground">{a.s} · {a.time}</Text>
              </View>
              <Text className={`text-sm font-mono tabular-nums ${a.usd >= 0 ? "text-success" : "text-foreground"}`}>
                {signed(a.usd)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <DetailSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.t}>
        {openTx && (
          <View className="gap-4">
            <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
              <Text className={`text-3xl font-mono font-semibold tabular-nums ${openTx.usd >= 0 ? "text-success" : "text-foreground"}`}>
                {signed(openTx.usd)}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">{openTx.s}</Text>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              <TxRow l="Network" v={openTx.network} />
              <View className="border-t border-border"><TxRow l="Fee" v={openTx.fee} /></View>
              <View className="border-t border-border"><TxRow l="Hash" v={openTx.hash} mono /></View>
              <View className="border-t border-border"><TxRow l="Time" v={openTx.time + " ago"} /></View>
              <View className="border-t border-border"><TxRow l="Status" v="Confirmed · shielded" /></View>
            </View>
          </View>
        )}
      </DetailSheet>

      <WalletFlow open={!!flow} kind={flow} onClose={() => setFlow(null)} />
      <AllHistorySheet open={allHistory} scope="wallet" onClose={() => setAllHistory(false)} title="Wallet history" />
    </ScrollView>
  );
}
