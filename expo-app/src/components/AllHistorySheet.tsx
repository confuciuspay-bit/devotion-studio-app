import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ArrowDownLeft, ArrowUpRight, Repeat, Shield, FileText, Link2, Calendar, CreditCard, RefreshCw, Settings2, CircleAlert, Check, Clock } from "lucide-react-native";
import { DetailSheet } from "@/components/DetailSheet";
import { useMoney } from "@/lib/useMoney";
import { fmtTime } from "@/lib/markets";
import { historyFor, type HistoryEntry, type HistoryScope } from "@/lib/history";

interface Props {
  open: boolean;
  scope: HistoryScope;
  onClose: () => void;
  title?: string;
}

const KIND_ICON: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Receive: ArrowDownLeft, Send: ArrowUpRight, Swap: Repeat, Shield, Bridge: Repeat,
  Approve: Check, Invoice: FileText, Link: Link2, Recurring: RefreshCw, Refund: RefreshCw,
  QR: FileText, Webhook: Settings2, Batch: FileText, Schedule: Calendar, Recipient: FileText,
  Anchor: Shield, Distribute: ArrowUpRight, Edit: Settings2, Payout: ArrowUpRight,
  Rotate: RefreshCw, Settings: Settings2, Purchase: CreditCard, "Top-up": ArrowDownLeft,
  Decline: CircleAlert, ATM: CreditCard,
};

function HRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 gap-3">
      <Text className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{l}</Text>
      <Text className={`text-sm text-right text-foreground ${mono ? "font-mono" : ""}`}>{v}</Text>
    </View>
  );
}

export function AllHistorySheet({ open, scope, onClose, title = "All history" }: Props) {
  const { fmt, signed } = useMoney();
  const all = useMemo(() => historyFor(scope), [scope]);
  const kinds = useMemo(() => ["All", ...Array.from(new Set(all.map((h) => h.kind)))], [all]);
  const [filter, setFilter] = useState<string>("All");
  const [detail, setDetail] = useState<HistoryEntry | null>(null);

  const list = filter === "All" ? all : all.filter((h) => h.kind === filter);

  return (
    <>
      <DetailSheet open={open} onClose={onClose} title={title}>
        <View className="gap-3">
          {/* Filter pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-1 px-1">
            <View className="flex-row gap-1.5">
              {kinds.map((k) => {
                const active = filter === k;
                return (
                  <Pressable
                    key={k}
                    onPress={() => setFilter(k)}
                    className={`shrink-0 px-3 py-1.5 rounded-md border ${
                      active
                        ? "bg-foreground border-foreground"
                        : "bg-white/4 border-border"
                    }`}
                  >
                    <Text className={`text-[11px] font-medium ${active ? "text-background" : "text-muted-foreground"}`}>
                      {k}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View className="rounded-lg border border-border bg-card overflow-hidden">
            {list.length === 0 && (
              <Text className="p-8 text-center text-sm text-muted-foreground">No entries.</Text>
            )}
            {list.map((h, idx) => {
              const Icon = KIND_ICON[h.kind] ?? Clock;
              const incoming = h.amountUsd > 0;
              const failed = h.status === "failed";
              const scheduled = h.status === "scheduled";
              return (
                <Pressable
                  key={h.id}
                  onPress={() => setDetail(h)}
                  className={`flex-row items-center gap-3 px-4 py-3 ${idx < list.length - 1 ? "border-b border-border" : ""}`}
                >
                  <View
                    className={`w-8 h-8 rounded-md items-center justify-center shrink-0 ${
                      failed
                        ? "bg-destructive/10"
                        : scheduled
                        ? "bg-white/5"
                        : incoming
                        ? "bg-success/12"
                        : "bg-white/5"
                    }`}
                  >
                    <Icon
                      size={14}
                      color={failed ? "#ef4444" : incoming && !scheduled ? "#10b981" : "#8c8ca0"}
                    />
                  </View>
                  <View className="flex-1 min-w-0">
                    <Text className="text-sm text-foreground" numberOfLines={1}>{h.title}</Text>
                    <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
                      {h.subtitle} · {fmtTime(h.ts)}
                    </Text>
                  </View>
                  <View className="items-end shrink-0">
                    {h.amountUsd !== 0 && (
                      <Text
                        className={`text-sm font-mono tabular-nums ${
                          incoming ? "text-success" : failed ? "text-destructive line-through" : "text-foreground"
                        }`}
                      >
                        {signed(h.amountUsd)}
                      </Text>
                    )}
                    <Text className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {h.status}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </DetailSheet>

      <DetailSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <View className="gap-4">
            <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">{detail.kind}</Text>
              {detail.amountUsd !== 0 ? (
                <Text
                  className={`text-3xl font-mono font-semibold mt-2 tabular-nums ${
                    detail.amountUsd > 0 ? "text-success" : "text-foreground"
                  }`}
                >
                  {signed(detail.amountUsd)}
                </Text>
              ) : (
                <Text className="text-2xl font-medium mt-2 text-foreground">{detail.title}</Text>
              )}
              <Text className="text-[11px] text-muted-foreground mt-1">{detail.subtitle}</Text>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              <HRow l="When" v={fmtTime(detail.ts)} />
              <View className="border-t border-border">
                <HRow l="Status" v={detail.status} />
              </View>
              {detail.network && <View className="border-t border-border"><HRow l="Network" v={detail.network} /></View>}
              {typeof detail.fee === "number" && <View className="border-t border-border"><HRow l="Fee" v={fmt(detail.fee)} /></View>}
              {detail.counterparty && <View className="border-t border-border"><HRow l="Counterparty" v={detail.counterparty} mono /></View>}
              {detail.hash && <View className="border-t border-border"><HRow l="Hash" v={detail.hash} mono /></View>}
              {detail.note && <View className="border-t border-border"><HRow l="Note" v={detail.note} /></View>}
            </View>
          </View>
        )}
      </DetailSheet>
    </>
  );
}
