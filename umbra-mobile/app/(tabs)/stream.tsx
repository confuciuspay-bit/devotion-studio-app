import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { Users, Plus, Shield, Calendar, ChevronRight, Play, Pencil } from "lucide-react-native";

type Batch = {
  id: string;
  name: string;
  count: number;
  total: string;
  mode: string;
  date: string;
  fee: string;
  asset: string;
};

const batches: Batch[] = [
  { id: "b1", name: "Engineering · M5",    count: 14, total: "$48,200.00", mode: "Enhanced", date: "Mar 1",  fee: "1.75%", asset: "USDC → ZEC" },
  { id: "b2", name: "Contractors · weekly", count: 6,  total: "$8,940.00",  mode: "Standard", date: "Feb 24", fee: "0.50%", asset: "USDC" },
  { id: "b3", name: "Design · M4",          count: 4,  total: "$12,400.00", mode: "Enhanced", date: "Feb 1",  fee: "1.75%", asset: "USDC → ZEC" },
];

export default function StreamPage() {
  const [open, setOpen] = useState<Batch | null>(null);
  const [allHistory, setAllHistory] = useState(false);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
      <AppHeader />

      {/* Stats */}
      <View className="px-5">
        <View className="rounded-lg border border-border bg-card p-6">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">UmbraStream · Payroll</Text>
          <Text className="text-4xl font-mono font-semibold mt-2 tabular-nums text-foreground">$69,540</Text>
          <Text className="text-xs text-muted-foreground mt-1 font-mono">24 recipients · 3 batches</Text>

          <View className="mt-5 flex-row gap-2">
            <Pressable className="flex-1 bg-primary rounded-md py-3 items-center gap-1">
              <Plus size={16} color="white" />
              <Text className="text-sm font-medium text-white">New batch</Text>
            </Pressable>
            <Pressable className="flex-1 bg-white/4 border border-border rounded-md py-3 items-center gap-1">
              <Users size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">Recipients</Text>
            </Pressable>
            <Pressable
              onPress={() => setAllHistory(true)}
              className="flex-1 bg-white/4 border border-border rounded-md py-3 items-center gap-1"
            >
              <Calendar size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">History</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Mode callout */}
      <View className="px-5 mt-4">
        <View className="rounded-lg border border-success/20 bg-success/4 p-4 flex-row items-start gap-3">
          <Shield size={16} color="#10b981" />
          <View className="flex-1">
            <Text className="text-xs font-medium text-foreground">Enhanced privacy mode available</Text>
            <Text className="text-[11px] text-muted-foreground mt-0.5">
              Payroll routed through ZEC shielded pool. Recipients receive any asset. 1.75% all-in.
            </Text>
          </View>
        </View>
      </View>

      {/* Batches */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Recent batches</Text>
          <Pressable className="flex-row items-center gap-0.5">
            <Text className="text-[11px] text-muted-foreground">See all</Text>
            <ChevronRight size={12} color="#8c8ca0" />
          </Pressable>
        </View>
        <View className="gap-2">
          {batches.map((b) => (
            <Pressable
              key={b.id}
              onPress={() => setOpen(b)}
              className="rounded-lg border border-border bg-card px-4 py-3 flex-row items-center gap-3"
            >
              <View className={`w-9 h-9 rounded-md items-center justify-center ${b.mode === "Enhanced" ? "bg-success/12" : "bg-white/5"}`}>
                <Users size={16} color={b.mode === "Enhanced" ? "#10b981" : "#8c8ca0"} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-sm font-medium text-foreground" numberOfLines={1}>{b.name}</Text>
                <Text className="text-[11px] text-muted-foreground font-mono">
                  {b.count} recipients · {b.date} · {b.mode}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-sm font-mono text-foreground">{b.total}</Text>
                <Text className="text-[10px] text-muted-foreground font-mono">{b.fee}</Text>
              </View>
              <ChevronRight size={16} color="#8c8ca0" />
            </Pressable>
          ))}
        </View>
      </View>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <View className="gap-4">
            <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Batch total</Text>
              <Text className="text-3xl font-mono font-semibold mt-2 text-foreground">{open.total}</Text>
              <Text className="text-xs text-muted-foreground mt-1">{open.count} recipients</Text>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              {[
                { l: "Date", v: open.date },
                { l: "Mode", v: open.mode },
                { l: "Asset", v: open.asset },
                { l: "Fee", v: open.fee },
              ].map((row, idx) => (
                <View key={row.l} className={idx > 0 ? "border-t border-border" : ""}>
                  <View className="flex-row items-center justify-between px-4 py-3">
                    <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">{row.l}</Text>
                    <Text className="text-sm text-foreground">{row.v}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="flex-row gap-2">
              <Pressable className="flex-1 rounded-md bg-white/4 border border-border py-3 flex-row items-center justify-center gap-2">
                <Pencil size={14} color="#8c8ca0" />
                <Text className="text-sm font-medium text-foreground">Edit</Text>
              </Pressable>
              <Pressable className="flex-1 rounded-md bg-primary py-3 flex-row items-center justify-center gap-2">
                <Play size={14} color="white" />
                <Text className="text-sm font-medium text-white">Run again</Text>
              </Pressable>
            </View>
          </View>
        )}
      </DetailSheet>

      <AllHistorySheet open={allHistory} scope="stream" onClose={() => setAllHistory(false)} title="Payroll history" />
    </ScrollView>
  );
}
