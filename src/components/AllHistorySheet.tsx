import { useMemo, useState } from "react";
import { DetailSheet } from "@/components/DetailSheet";
import { useMoney } from "@/lib/useMoney";
import { fmtTime } from "@/lib/markets";
import { historyFor, type HistoryEntry, type HistoryScope } from "@/lib/history";
import { ArrowDownLeft, ArrowUpRight, Repeat, Shield, FileText, Link2, Calendar, CreditCard, RefreshCw, Settings2, CircleAlert as AlertCircle, Check, Clock } from "lucide-react";

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
          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
            {kinds.map((k) => {
              const active = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`pressable shrink-0 px-3 py-1.5 rounded-md border text-[11px] font-medium transition ${
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {k}
                </button>
              );
            })}
          </div>

          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden">
            {list.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No entries.</div>
            )}
            {list.map((h) => {
              const Icon = KIND_ICON[h.kind] ?? Clock;
              const incoming = h.amountUsd > 0;
              const failed = h.status === "failed";
              const scheduled = h.status === "scheduled";
              return (
                <button
                  key={h.id}
                  onClick={() => setDetail(h)}
                  className="pressable w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition"
                >
                  <div
                    className={`size-8 rounded-md grid place-items-center shrink-0 ${
                      failed
                        ? "bg-destructive/10 text-destructive"
                        : scheduled
                        ? "bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                        : incoming
                        ? "bg-[rgba(16,185,129,0.12)] text-success"
                        : "bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{h.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {h.subtitle} · {fmtTime(h.ts)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {h.amountUsd !== 0 && (
                      <p
                        className={`text-sm font-mono tabular-nums ${
                          incoming ? "text-success" : failed ? "text-destructive line-through" : "text-foreground"
                        }`}
                      >
                        {signed(h.amountUsd)}
                      </p>
                    )}
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      {h.status}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DetailSheet>

      <DetailSheet open={!!detail} onClose={() => setDetail(null)} title={detail?.title}>
        {detail && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{detail.kind}</p>
              {detail.amountUsd !== 0 ? (
                <p
                  className={`text-3xl font-mono font-semibold mt-2 tabular-nums ${
                    detail.amountUsd > 0 ? "text-success" : "text-foreground"
                  }`}
                >
                  {signed(detail.amountUsd)}
                </p>
              ) : (
                <p className="text-2xl font-medium mt-2 text-foreground">{detail.title}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">{detail.subtitle}</p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
              <HRow l="When" v={fmtTime(detail.ts)} />
              <HRow l="Status" v={detail.status} />
              {detail.network && <HRow l="Network" v={detail.network} />}
              {typeof detail.fee === "number" && <HRow l="Fee" v={fmt(detail.fee)} />}
              {detail.counterparty && <HRow l="Counterparty" v={detail.counterparty} mono />}
              {detail.hash && <HRow l="Hash" v={detail.hash} mono />}
              {detail.note && <HRow l="Note" v={detail.note} />}
            </div>
          </div>
        )}
      </DetailSheet>
    </>
  );
}

function HRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{l}</span>
      <span className={`text-sm text-right text-foreground ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
