import { useMemo, useState } from "react";
import { DetailSheet } from "@/components/DetailSheet";
import { useMoney } from "@/lib/useMoney";
import { fmtTime } from "@/lib/markets";
import { historyFor, type HistoryEntry, type HistoryScope } from "@/lib/history";
import {
  ArrowDownLeft, ArrowUpRight, Repeat, Shield, FileText, Link2, Calendar,
  CreditCard, RefreshCw, Settings2, AlertCircle, Check, Clock, ChevronRight,
} from "lucide-react";

interface Props {
  open: boolean;
  scope: HistoryScope;
  onClose: () => void;
  title?: string;
}

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Receive: ArrowDownLeft, Send: ArrowUpRight, Swap: Repeat, Shield, Bridge: Repeat,
  Approve: Check, Invoice: FileText, Link: Link2, Recurring: RefreshCw, Refund: RefreshCw,
  QR: FileText, Webhook: Settings2, Batch: FileText, Schedule: Calendar, Recipient: FileText,
  Anchor: Shield, Distribute: ArrowUpRight, Edit: Settings2, Payout: ArrowUpRight,
  Rotate: RefreshCw, Settings: Settings2, Purchase: CreditCard, "Top-up": ArrowDownLeft,
  Decline: AlertCircle, ATM: CreditCard,
};

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
        <div className="space-y-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
            {kinds.map((k) => {
              const active = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`pressable shrink-0 px-3 py-1.5 rounded-full border text-[11px] font-medium ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-foreground/5 border-border text-muted-foreground"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {list.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No entries.</div>
            )}
            {list.map((h) => {
              const Icon = KIND_ICON[h.kind] ?? Clock;
              const incoming = h.amountUsd > 0;
              const outgoing = h.amountUsd < 0;
              const failed = h.status === "failed";
              const scheduled = h.status === "scheduled";
              return (
                <button
                  key={h.id}
                  onClick={() => setDetail(h)}
                  className="pressable w-full text-left flex items-center gap-3 px-4 py-3 active:bg-foreground/5"
                >
                  <div
                    className={`size-9 rounded-xl grid place-items-center shrink-0 ${
                      failed
                        ? "bg-destructive/10 text-destructive"
                        : scheduled
                        ? "bg-foreground/5 text-muted-foreground"
                        : incoming
                        ? "bg-shield/15 text-shield"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{h.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {h.subtitle} · {fmtTime(h.ts)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {h.amountUsd !== 0 && (
                      <p
                        className={`text-sm font-mono tabular-nums ${
                          incoming ? "text-shield" : failed ? "text-destructive line-through" : ""
                        }`}
                      >
                        {signed(h.amountUsd)}
                      </p>
                    )}
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {h.status}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </DetailSheet>

      <DetailSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{detail.kind}</p>
              {detail.amountUsd !== 0 ? (
                <p
                  className={`text-3xl font-display font-semibold mt-1 tabular-nums ${
                    detail.amountUsd > 0 ? "text-shield" : ""
                  }`}
                >
                  {signed(detail.amountUsd)}
                </p>
              ) : (
                <p className="text-2xl font-display font-semibold mt-1">{detail.title}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{detail.subtitle}</p>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="When" v={fmtTime(detail.ts)} />
              <Row l="Status" v={detail.status} />
              {detail.network && <Row l="Network" v={detail.network} />}
              {typeof detail.fee === "number" && <Row l="Fee" v={fmt(detail.fee)} />}
              {detail.counterparty && <Row l="Counterparty" v={detail.counterparty} mono />}
              {detail.hash && <Row l="Hash" v={detail.hash} mono />}
              {detail.note && <Row l="Note" v={detail.note} />}
            </div>
          </div>
        )}
      </DetailSheet>
    </>
  );
}

function Row({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{l}</span>
      <span className={`text-sm text-right ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
