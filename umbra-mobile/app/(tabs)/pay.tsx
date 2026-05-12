import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, TextInput } from "react-native";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PayFlow, type PayFlowKind } from "@/components/flows/PayFlow";
import { QrCode, Link2, Plus, Check, ChevronRight, Repeat, FileText, Receipt, LayoutGrid } from "lucide-react-native";
import { useApp, type PaymentRecord, type PaymentStatus, type Invoice } from "@/lib/store";
import { fmtTime } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { getChain } from "@/lib/chains";
import { toast } from "@/lib/toast";
import * as Clipboard from "expo-clipboard";

const STATUS_LABEL: Record<PaymentStatus, string> = {
  INITIATED: "Awaiting", FUNDED: "Funded", LOCKED: "Locked",
  RELEASED: "Released", REFUNDED: "Refunded", EXPIRED: "Expired",
};

type Tab = "overview" | "payments" | "invoices" | "recurring";

function shortAddr(s: string) {
  if (!s) return "";
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
}

function PaymentList({ list, onOpen, fmt }: {
  list: PaymentRecord[];
  onOpen: (p: PaymentRecord) => void;
  fmt: (n: number, o?: Intl.NumberFormatOptions) => string;
}) {
  if (list.length === 0) {
    return (
      <View className="rounded-lg border border-border bg-card p-8 items-center">
        <Text className="text-sm text-muted-foreground">No payments yet.</Text>
      </View>
    );
  }
  return (
    <View className="gap-2">
      {list.map((p) => {
        const ch = getChain(p.chainId);
        return (
          <Pressable
            key={p.id}
            onPress={() => onOpen(p)}
            className="rounded-lg border border-border bg-card px-4 py-3 flex-row items-center gap-3"
          >
            <View className={`w-9 h-9 rounded-md items-center justify-center ${
              p.status === "RELEASED" ? "bg-success/15"
              : p.status === "FUNDED" ? "bg-primary/15"
              : p.status === "EXPIRED" || p.status === "REFUNDED" ? "bg-destructive/15"
              : "bg-white/5"
            }`}>
              <Check size={16} color={
                p.status === "RELEASED" ? "#10b981"
                : p.status === "FUNDED" ? "#6366f1"
                : p.status === "EXPIRED" || p.status === "REFUNDED" ? "#ef4444"
                : "#8c8ca0"
              } />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                {p.reference || p.customer || p.id}
              </Text>
              <Text className="text-[11px] text-muted-foreground font-mono" numberOfLines={1}>
                {p.id} · {p.token} · {ch?.shortName ?? p.chainId}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-mono text-foreground">{fmt(p.amountUsd)}</Text>
              <Text className="text-[10px] uppercase tracking-wider text-muted-foreground">{STATUS_LABEL[p.status]}</Text>
            </View>
            <ChevronRight size={16} color="#8c8ca0" />
          </Pressable>
        );
      })}
    </View>
  );
}

export default function PayPage() {
  const { payments, monthlyVolumeUsd, vaultEnabled, updatePayment, invoices } = useApp((s) => s);
  const { fmt } = useMoney();

  const [tab, setTab] = useState<Tab>("overview");
  const [open, setOpen] = useState<PaymentRecord | null>(null);
  const [flow, setFlow] = useState<PayFlowKind | null>(null);
  const [allHistory, setAllHistory] = useState(false);

  const stats = useMemo(() => {
    const released = payments.filter((p) => p.status === "RELEASED");
    const pending = payments.filter((p) => p.status === "INITIATED" || p.status === "FUNDED");
    return {
      releasedCount: released.length,
      releasedSum: released.reduce((s, p) => s + p.amountUsd, 0),
      pendingCount: pending.length,
      pendingSum: pending.reduce((s, p) => s + p.amountUsd, 0),
    };
  }, [payments]);

  const TABS = [
    { id: "overview" as Tab, label: "Overview", icon: LayoutGrid },
    { id: "payments" as Tab, label: "Payments", icon: Receipt },
    { id: "invoices" as Tab, label: "Invoices", icon: FileText },
    { id: "recurring" as Tab, label: "Recurring", icon: Repeat },
  ];

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 120 }}>
      <AppHeader />

      <View className="px-5">
        <View className="rounded-lg border border-border bg-card p-6">
          <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">This month · gross</Text>
          <Text className="text-4xl font-mono font-semibold mt-2 tabular-nums text-foreground">
            {fmt(monthlyVolumeUsd, { maximumFractionDigits: 0 })}
          </Text>
          <Text className="text-xs text-success font-mono mt-1">
            {vaultEnabled ? "VAULT · 2.00% all-in" : "PSP · 0.50% per tx"}
          </Text>

          <View className="mt-5 flex-row gap-2">
            <Pressable
              onPress={() => setFlow("new")}
              className="flex-1 bg-primary rounded-md py-3 items-center gap-1"
            >
              <Plus size={16} color="white" />
              <Text className="text-sm font-medium text-white">New</Text>
            </Pressable>
            <Pressable
              onPress={() => setFlow("qr")}
              className="flex-1 bg-white/4 border border-border rounded-md py-3 items-center gap-1"
            >
              <QrCode size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">QR</Text>
            </Pressable>
            <Pressable
              onPress={() => setFlow("link")}
              className="flex-1 bg-white/4 border border-border rounded-md py-3 items-center gap-1"
            >
              <Link2 size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">Link</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="px-5 mt-5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  className={`flex-row items-center gap-1.5 px-3 py-1.5 rounded-md border ${
                    active ? "bg-foreground border-foreground" : "bg-white/4 border-border"
                  }`}
                >
                  <Icon size={12} color={active ? "#0a0a14" : "#8c8ca0"} />
                  <Text className={`text-[11px] font-medium ${active ? "text-background" : "text-muted-foreground"}`}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setAllHistory(true)}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-white/4"
            >
              <Text className="text-[11px] font-medium text-muted-foreground">History</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      <View className="px-5 mt-5">
        {tab === "overview" && (
          <View className="gap-6">
            <View className="flex-row flex-wrap gap-2">
              {[
                { label: "Released", value: fmt(stats.releasedSum, { maximumFractionDigits: 0 }), sub: `${stats.releasedCount} payments`, tone: "success" },
                { label: "Pending", value: fmt(stats.pendingSum, { maximumFractionDigits: 0 }), sub: `${stats.pendingCount} awaiting`, tone: "" },
                { label: "Invoices", value: String(invoices.length), sub: "anchored on-chain", tone: "" },
              ].map((card) => (
                <View key={card.label} className="flex-1 min-w-[45%] rounded-lg border border-border bg-card p-4">
                  <Text className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{card.label}</Text>
                  <Text className={`text-xl font-mono font-semibold mt-1 tabular-nums ${card.tone === "success" ? "text-success" : "text-foreground"}`}>
                    {card.value}
                  </Text>
                  {card.sub && <Text className="text-[11px] text-muted-foreground mt-0.5 font-mono">{card.sub}</Text>}
                </View>
              ))}
            </View>
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-sm font-semibold text-foreground">Recent payments</Text>
                <Pressable onPress={() => setTab("payments")} className="flex-row items-center">
                  <Text className="text-xs text-muted-foreground">See all</Text>
                  <ChevronRight size={12} color="#8c8ca0" />
                </Pressable>
              </View>
              <PaymentList list={payments.slice(0, 5)} onOpen={setOpen} fmt={fmt} />
            </View>
          </View>
        )}

        {tab === "payments" && (
          <View>
            <Text className="text-sm font-semibold text-foreground mb-3">All payments</Text>
            <PaymentList list={payments} onOpen={setOpen} fmt={fmt} />
          </View>
        )}

        {tab === "invoices" && (
          <View className="items-center py-12 gap-2">
            <FileText size={24} color="#8c8ca0" />
            <Text className="text-sm text-muted-foreground text-center">
              No invoices yet. Anchored invoices appear here with on-chain hash proof.
            </Text>
          </View>
        )}

        {tab === "recurring" && (
          <View className="items-center py-12 gap-2">
            <Repeat size={24} color="#8c8ca0" />
            <Text className="text-sm text-muted-foreground text-center">
              No subscription links yet.
            </Text>
            <Pressable className="mt-2 flex-row items-center gap-1 px-3 py-1.5 rounded-md bg-primary">
              <Plus size={14} color="white" />
              <Text className="text-xs font-semibold text-white">New link</Text>
            </Pressable>
          </View>
        )}
      </View>

      <PayFlow open={!!flow} kind={flow} onClose={() => setFlow(null)} />
      <AllHistorySheet open={allHistory} scope="pay" onClose={() => setAllHistory(false)} title="Pay history" />

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.id}>
        {open && (
          <View className="gap-4">
            <View className="rounded-lg bg-white/5 border border-border p-5 items-center">
              <Text className="text-xs uppercase tracking-wider text-muted-foreground">
                {open.reference || "Payment"}
              </Text>
              <Text className="text-3xl font-mono font-semibold mt-1 tabular-nums text-foreground">{fmt(open.amountUsd)}</Text>
              <View className="mt-2 px-2 py-0.5 rounded-md bg-success/10">
                <Text className="text-[10px] font-mono text-success">{STATUS_LABEL[open.status]}</Text>
              </View>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              {[
                { l: "Created", v: fmtTime(open.createdAt) },
                { l: "Expires", v: fmtTime(open.expiresAt) },
                ...(open.customer ? [{ l: "Customer", v: open.customer }] : []),
                { l: "Network", v: getChain(open.chainId)?.name ?? open.chainId },
                { l: "Address", v: shortAddr(open.address) },
                { l: "PSP fee", v: open.feeUsd ? fmt(open.feeUsd) : "$0.00 · waived" },
              ].map((row, idx) => (
                <View key={row.l} className={idx > 0 ? "border-t border-border" : ""}>
                  <View className="flex-row items-center justify-between px-4 py-3 gap-3">
                    <Text className="text-xs text-muted-foreground shrink-0">{row.l}</Text>
                    <Text className="text-sm text-right text-foreground">{row.v}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={async () => { await Clipboard.setStringAsync(open.address); toast.success("Address copied"); }}
                className="flex-1 rounded-lg bg-white/5 border border-border py-3 items-center gap-1"
              >
                <Text className="text-xs font-medium text-foreground">Copy Address</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (open.status === "RELEASED") {
                    updatePayment(open.id, { status: "REFUNDED" });
                    toast.success("Refund initiated");
                  } else {
                    updatePayment(open.id, { status: "EXPIRED" });
                    toast("Payment cancelled");
                  }
                  setOpen(null);
                }}
                className="flex-1 rounded-lg bg-primary py-3 items-center"
              >
                <Text className="text-xs font-semibold text-white">{open.status === "RELEASED" ? "Refund" : "Cancel"}</Text>
              </Pressable>
            </View>
          </View>
        )}
      </DetailSheet>
    </ScrollView>
  );
}
