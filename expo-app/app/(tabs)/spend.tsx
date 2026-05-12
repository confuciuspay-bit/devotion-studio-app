import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PinGate } from "@/components/PinGate";
import { useApp } from "@/lib/store";
import { useMoney } from "@/lib/useMoney";
import { Snowflake, Wifi, Plus, EyeOff, Eye, ChevronRight, Lock, ShieldCheck } from "lucide-react-native";

type Tx = {
  id: string;
  m: string;
  c: string;
  usd: number;
  t: string;
  category: string;
  fx?: string;
  status: string;
};

const txns: Tx[] = [
  { id: "tx1", m: "Rakuten",     c: "Tokyo · ¥",         usd: -42.10,  t: "12:08",     category: "Shopping", fx: "¥6,280 @ 149.16",  status: "Settled" },
  { id: "tx2", m: "Lufthansa",   c: "Online · €",        usd: -612.00, t: "Yesterday", category: "Travel",   fx: "€565.00 @ 1.083",  status: "Settled" },
  { id: "tx3", m: "Blue Bottle", c: "NYC · $",           usd: -7.50,   t: "Mon",       category: "Coffee",                            status: "Settled" },
  { id: "tx4", m: "Top up",      c: "from Wallet · ZEC", usd: 1000,    t: "Mon",       category: "Funding",                           status: "Confirmed" },
];

const fullPan = "4291 7702 4118 8842";
const masked = "•••• •••• •••• 8842";

export default function SpendPage() {
  const [revealed, setRevealed] = useState(false);
  const [pinGate, setPinGate] = useState(false);
  const [openTx, setOpenTx] = useState<Tx | null>(null);
  const [allHistory, setAllHistory] = useState(false);
  const pinHashStored = useApp((s) => s.pinHashStored);
  const { fmt, signed, hidden } = useMoney();
  const balanceUsd = 2184.30;

  const tryReveal = () => {
    if (revealed) { setRevealed(false); return; }
    if (pinHashStored) setPinGate(true); else setRevealed(true);
  };

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
      <AppHeader />

      {/* Card */}
      <View className="px-5">
        <View className="rounded-2xl bg-card border border-border p-6 gap-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-6 h-6 rounded-md bg-primary items-center justify-center">
                <View className="w-2.5 h-2.5 rounded-full bg-white/90" />
              </View>
              <Text className="text-xs font-medium text-muted-foreground">Umbra Card</Text>
            </View>
            <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-md bg-success/10">
              <Wifi size={10} color="#10b981" />
              <Text className="text-[10px] text-success font-mono">Active</Text>
            </View>
          </View>

          <Text className="text-2xl font-mono tracking-[0.15em] text-foreground">
            {revealed ? fullPan : masked}
          </Text>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-[9px] uppercase tracking-widest text-muted-foreground">Balance</Text>
              <Text className="text-lg font-mono font-semibold text-foreground mt-0.5">
                {hidden ? "••••••" : `$${balanceUsd.toFixed(2)}`}
              </Text>
            </View>
            <Pressable
              onPress={tryReveal}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/5 border border-border"
            >
              {revealed ? <EyeOff size={14} color="#8c8ca0" /> : <Eye size={14} color="#8c8ca0" />}
              <Text className="text-xs text-muted-foreground">{revealed ? "Hide" : "Reveal"}</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View className="px-5 mt-3 flex-row gap-2">
        <Pressable className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center gap-1">
          <Snowflake size={16} color="#8c8ca0" />
          <Text className="text-xs font-medium text-foreground">Freeze</Text>
        </Pressable>
        <Pressable className="flex-1 rounded-md bg-primary py-3 items-center gap-1">
          <Plus size={16} color="white" />
          <Text className="text-xs font-medium text-white">Top up</Text>
        </Pressable>
      </View>

      {/* Privacy note */}
      <View className="px-5 mt-4">
        <View className="rounded-lg border border-success/20 bg-success/4 p-4 flex-row items-start gap-3">
          <ShieldCheck size={16} color="#10b981" />
          <View className="flex-1">
            <Text className="text-xs font-medium text-foreground">Privacy-preserving spend</Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              Card funded from shielded vault. Merchant sees Visa, not your crypto wallet.
            </Text>
          </View>
        </View>
      </View>

      {/* Transactions */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Transactions</Text>
          <Pressable onPress={() => setAllHistory(true)} className="flex-row items-center gap-0.5">
            <Text className="text-[11px] text-muted-foreground">All history</Text>
            <ChevronRight size={12} color="#8c8ca0" />
          </Pressable>
        </View>
        <View className="rounded-lg border border-border bg-card overflow-hidden">
          {txns.map((tx, idx) => (
            <Pressable
              key={tx.id}
              onPress={() => setOpenTx(tx)}
              className={`px-4 py-3 flex-row items-center gap-3 ${idx < txns.length - 1 ? "border-b border-border" : ""}`}
            >
              <View className={`w-8 h-8 rounded-md items-center justify-center shrink-0 ${tx.usd > 0 ? "bg-success/12" : "bg-white/5"}`}>
                {tx.usd > 0
                  ? <Plus size={14} color="#10b981" />
                  : <Lock size={14} color="#8c8ca0" />
                }
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm text-foreground" numberOfLines={1}>{tx.m}</Text>
                <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>{tx.c} · {tx.t}</Text>
              </View>
              <Text className={`text-sm font-mono tabular-nums ${tx.usd >= 0 ? "text-success" : "text-foreground"}`}>
                {tx.usd >= 0 ? "+" : ""}{tx.usd.toFixed(2)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <DetailSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.m}>
        {openTx && (
          <View className="gap-4">
            <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
              <Text className={`text-3xl font-mono font-semibold tabular-nums ${openTx.usd >= 0 ? "text-success" : "text-foreground"}`}>
                {openTx.usd >= 0 ? "+" : ""}${Math.abs(openTx.usd).toFixed(2)}
              </Text>
              <Text className="text-xs text-muted-foreground mt-1">{openTx.c}</Text>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              {[
                { l: "Merchant", v: openTx.m },
                { l: "Category", v: openTx.category },
                { l: "Time", v: openTx.t },
                { l: "Status", v: openTx.status },
                ...(openTx.fx ? [{ l: "FX", v: openTx.fx }] : []),
              ].map((row, idx) => (
                <View key={row.l} className={idx > 0 ? "border-t border-border" : ""}>
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">{row.l}</Text>
                    <Text className="text-sm text-foreground">{row.v}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </DetailSheet>

      <DetailSheet open={pinGate} onClose={() => setPinGate(false)} title="Reveal card">
        <PinGate
          subtitle="Enter PIN to reveal full card number"
          onPass={() => { setPinGate(false); setRevealed(true); }}
          onCancel={() => setPinGate(false)}
        />
      </DetailSheet>

      <AllHistorySheet open={allHistory} scope="spend" onClose={() => setAllHistory(false)} title="Spend history" />
    </ScrollView>
  );
}
