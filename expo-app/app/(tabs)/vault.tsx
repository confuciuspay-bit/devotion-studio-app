import React, { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PinGate } from "@/components/PinGate";
import { WalletFlow } from "@/components/flows/WalletFlow";
import { VaultFlow, type VaultFlowKind } from "@/components/flows/VaultFlow";
import { Shield, ArrowRight, Lock, ChevronRight, Plus, Settings, KeyRound } from "lucide-react-native";
import { useApp, type VaultActivity } from "@/lib/store";
import { fmtTime } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { getChain } from "@/lib/chains";

const flow = [
  { l: "Customer pays", v: "USDC · ETH" },
  { l: "Swap to ZEC", v: "Maya · 10 bps" },
  { l: "Shield to z-addr", v: "Per-merchant" },
  { l: "Payout", v: "Any currency" },
];

const ZEC_PRICE = 35;

function VRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 gap-3">
      <Text className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{l}</Text>
      <Text className={`text-sm text-right text-foreground ${mono ? "font-mono" : ""}`}>{v}</Text>
    </View>
  );
}

function short(s: string) {
  if (!s) return "";
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
}

export default function VaultPage() {
  const { vaultZec, vaultActivity, hideBalances, pinHashStored } = useApp();
  const [open, setOpen] = useState<VaultActivity | null>(null);
  const [vfk, setVfk] = useState<VaultFlowKind | null>(null);
  const [shieldFlow, setShieldFlow] = useState(false);
  const [allHistory, setAllHistory] = useState(false);
  const [pinGate, setPinGate] = useState(false);
  const { fmt } = useMoney();

  const hidden = hideBalances;
  const balanceUsd = vaultZec * ZEC_PRICE;

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
      <AppHeader />

      {/* Vault balance card */}
      <View className="px-5">
        <View className="rounded-lg border border-success/15 bg-card p-6">
          <View className="flex-row items-center gap-3">
            <View className="w-8 h-8 rounded-md bg-success/12 items-center justify-center">
              <Shield size={16} color="#10b981" />
            </View>
            <View>
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Shielded balance</Text>
              <Pressable
                onPress={() => (pinHashStored ? setPinGate(true) : setVfk("address"))}
                className="flex-row items-center gap-1"
              >
                <Text className="text-xs text-success font-mono">z-addr · per-merchant</Text>
                <KeyRound size={12} color="#10b981" />
              </Pressable>
            </View>
          </View>

          <Text className="mt-5 text-3xl font-mono font-semibold tabular-nums text-foreground">
            <Text className="text-success">ⓩ</Text>
            {" "}{hidden ? "••••••" : vaultZec.toFixed(2)}
            <Text className="text-muted-foreground text-xl"> ZEC</Text>
          </Text>
          <Text className="text-xs text-muted-foreground mt-1 font-mono">
            ≈ {fmt(balanceUsd)} · 2.00% all-in
          </Text>

          <View className="mt-6 flex-row gap-2">
            <Pressable
              onPress={() => setShieldFlow(true)}
              className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center gap-1.5"
            >
              <Plus size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">Add</Text>
            </Pressable>
            <Pressable
              onPress={() => setVfk("withdraw")}
              className="flex-1 rounded-md bg-success py-3 items-center gap-1.5"
            >
              <ArrowRight size={16} color="black" />
              <Text className="text-sm font-medium text-black">Withdraw</Text>
            </Pressable>
            <Pressable
              onPress={() => setVfk("settings")}
              className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center gap-1.5"
            >
              <Settings size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">Settings</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Flow diagram */}
      <View className="px-5 mt-5">
        <Text className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Per-payment flow</Text>
        <View className="rounded-lg border border-border bg-card flex-row overflow-hidden">
          {flow.map((f, i) => (
            <View key={f.l} className="flex-row items-center flex-1">
              <View className="flex-1 px-3 py-4">
                <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {i + 1}</Text>
                <Text className="text-xs font-medium text-foreground mt-0.5">{f.l}</Text>
                <Text className="text-[10px] text-muted-foreground font-mono">{f.v}</Text>
              </View>
              {i < flow.length - 1 && <ArrowRight size={14} color="#8c8ca0" />}
            </View>
          ))}
        </View>
      </View>

      {/* Activity */}
      <View className="px-5 mt-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Activity</Text>
          <Pressable onPress={() => setAllHistory(true)} className="flex-row items-center gap-0.5">
            <Text className="text-[11px] text-muted-foreground">All history</Text>
            <ChevronRight size={12} color="#8c8ca0" />
          </Pressable>
        </View>

        {vaultActivity.length === 0 && (
          <View className="rounded-lg border border-border bg-card p-8 items-center">
            <Text className="text-sm text-muted-foreground">No vault activity yet.</Text>
          </View>
        )}

        {vaultActivity.length > 0 && (
          <View className="rounded-lg border border-border bg-card overflow-hidden">
            {vaultActivity.map((s, idx) => (
              <Pressable
                key={s.id}
                onPress={() => setOpen(s)}
                className={`px-4 py-3 flex-row items-center gap-3 ${idx < vaultActivity.length - 1 ? "border-b border-border" : ""}`}
              >
                <View className="w-8 h-8 rounded-md bg-success/12 items-center justify-center shrink-0">
                  <Shield size={14} color="#10b981" />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-xs text-muted-foreground">{fmtTime(s.ts)} · {s.kind === "shield" ? "Shield in" : "Payout"}</Text>
                  <View className="flex-row items-center gap-2 mt-0.5">
                    <Text className="text-sm font-mono text-foreground">{fmt(s.fromAmountUsd)}</Text>
                    <ArrowRight size={12} color="#8c8ca0" />
                    <Text className="text-sm font-mono text-success">
                      {s.kind === "shield" ? `ⓩ ${s.zecAmount.toFixed(2)}` : (getChain(s.toChainId ?? "")?.shortName ?? "")}
                    </Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-2">
                  <View className="flex-row items-center gap-1">
                    <Lock size={10} color="#10b981" />
                    <Text className="text-[10px] font-mono text-success">{s.status}</Text>
                  </View>
                  <ChevronRight size={14} color="#8c8ca0" />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <VaultFlow open={!!vfk} kind={vfk} onClose={() => setVfk(null)} />
      <WalletFlow open={shieldFlow} kind={shieldFlow ? "shield" : null} onClose={() => setShieldFlow(false)} />
      <AllHistorySheet open={allHistory} scope="vault" onClose={() => setAllHistory(false)} title="Vault history" />

      <DetailSheet open={pinGate} onClose={() => setPinGate(false)} title="Reveal z-address">
        <PinGate
          subtitle="PIN required to reveal shielded address"
          onPass={() => { setPinGate(false); setVfk("address"); }}
          onCancel={() => setPinGate(false)}
        />
      </DetailSheet>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title="Vault entry">
        {open && (
          <View className="gap-4">
            <View className="rounded-lg bg-white/3 border border-border p-5 gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-mono text-foreground">{fmt(open.fromAmountUsd)}</Text>
                <ArrowRight size={16} color="#8c8ca0" />
                <Text className="text-sm font-mono text-success">
                  {open.kind === "shield" ? `ⓩ ${open.zecAmount.toFixed(2)} ZEC` : (getChain(open.toChainId ?? "")?.shortName ?? "")}
                </Text>
              </View>
              <View className="flex-row items-center justify-center gap-1.5">
                <Lock size={12} color="#10b981" />
                <Text className="text-xs font-mono text-success">{open.status}</Text>
              </View>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              <VRow l="Time" v={fmtTime(open.ts)} />
              <View className="border-t border-border"><VRow l="Kind" v={open.kind} /></View>
              <View className="border-t border-border"><VRow l="All-in fee" v={`${fmt(open.fee)} · 2.00%`} /></View>
              <View className="border-t border-border"><VRow l="Tx hash" v={short(open.hash)} mono /></View>
              {open.toAddress ? <View className="border-t border-border"><VRow l="To" v={short(open.toAddress)} mono /></View> : null}
            </View>
          </View>
        )}
      </DetailSheet>
    </ScrollView>
  );
}
