import { useMemo, useState } from "react";
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
        <div className="space-y-4">
          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {kinds.map((k) => {
              const active = filter === k;
              return (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className="pressable shrink-0 px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors"
                  style={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: active ? "var(--accent)" : "var(--border-default)",
                    background: active ? "var(--accent-dim)" : "transparent",
                    color: active ? "var(--accent)" : "var(--text-secondary)",
                    fontWeight: 300,
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid var(--border-dim)" }}>
            {list.length === 0 && (
              <div className="py-16 text-center">
                <p className="label">no entries</p>
              </div>
            )}
            {list.map((h) => {
              const incoming = h.amountUsd > 0;
              const failed = h.status === "failed";
              return (
                <button
                  key={h.id}
                  onClick={() => setDetail(h)}
                  className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
                >
                  <span
                    className="dot shrink-0"
                    style={{
                      background: failed
                        ? "var(--status-err)"
                        : incoming
                        ? "var(--status-ok)"
                        : "var(--text-tertiary)",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-[var(--text-primary)] truncate">{h.title}</p>
                    <p className="text-[11px] font-light truncate" style={{ color: "var(--text-secondary)" }}>
                      {h.subtitle} · {fmtTime(h.ts)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {h.amountUsd !== 0 && (
                      <p
                        className="text-[12px]"
                        style={{
                          color: incoming
                            ? "var(--status-ok)"
                            : failed
                            ? "var(--status-err)"
                            : "var(--text-primary)",
                          textDecoration: failed ? "line-through" : undefined,
                        }}
                      >
                        {signed(h.amountUsd)}
                      </p>
                    )}
                    <p className="label">{h.status}</p>
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
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">{detail.kind.toLowerCase()}</p>
              {detail.amountUsd !== 0 ? (
                <p
                  className="text-[22px]"
                  style={{ color: detail.amountUsd > 0 ? "var(--status-ok)" : "var(--text-primary)" }}
                >
                  {signed(detail.amountUsd)}
                </p>
              ) : (
                <p className="text-[18px] font-medium" style={{ color: "var(--text-primary)" }}>
                  {detail.title}
                </p>
              )}
              <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>
                {detail.subtitle}
              </p>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <HRow l="when" v={fmtTime(detail.ts)} />
              <HRow l="status" v={detail.status} />
              {detail.network && <HRow l="network" v={detail.network} />}
              {typeof detail.fee === "number" && <HRow l="fee" v={fmt(detail.fee)} />}
              {detail.counterparty && <HRow l="counterparty" v={detail.counterparty} mono />}
              {detail.hash && <HRow l="hash" v={detail.hash} mono />}
              {detail.note && <HRow l="note" v={detail.note} last />}
              {!detail.note && !detail.hash && detail.network && <HRow l="network" v={detail.network} last />}
            </div>
          </div>
        )}
      </DetailSheet>
    </>
  );
}

function HRow({ l, v, mono, last }: { l: string; v: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <span className="label shrink-0">{l}</span>
      <span
        className="text-[12px] text-right"
        style={{
          color: "var(--text-primary)",
          fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
        }}
      >
        {v}
      </span>
    </div>
  );
}
