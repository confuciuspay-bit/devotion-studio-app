import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { Users, Plus, Shield, Calendar, ChevronRight, Play, Pencil } from "lucide-react";

export const Route = createFileRoute("/stream")({ component: StreamPage });

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
  { id: "b1", name: "Engineering · M5", count: 14, total: "$48,200.00", mode: "Enhanced", date: "Mar 1", fee: "1.75%", asset: "USDC → ZEC" },
  { id: "b2", name: "Contractors · weekly", count: 6, total: "$8,940.00", mode: "Standard", date: "Feb 24", fee: "0.50%", asset: "USDC" },
  { id: "b3", name: "Design · M4", count: 4, total: "$12,400.00", mode: "Enhanced", date: "Feb 1", fee: "1.75%", asset: "USDC → ZEC" },
];

function StreamPage() {
  const [open, setOpen] = useState<Batch | null>(null);
  const [allHistory, setAllHistory] = useState(false);

  return (
    <div>
      <AppHeader subtitle="UmbraStream · Payroll" />

      <section className="px-5">
        <div style={{ border: "1px solid var(--border-default)", borderRadius: 4, padding: 16 }}>
          <p className="label mb-1">next batch</p>
          <p className="text-[20px] font-medium mb-0.5" style={{ color: "var(--text-primary)" }}>Engineering · M5</p>
          <p className="text-[11px] font-light mb-4" style={{ color: "var(--text-secondary)" }}>runs in 2 days · 14 recipients</p>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <BatchStat l="total" v="$48,200" />
            <BatchStat l="mode" v="Enhanced" ok />
            <BatchStat l="fee" v="1.75%" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary py-2.5 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest">
              <Plus className="size-3.5" /> new batch
            </button>
            <button className="btn-ghost py-2.5 flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-widest">
              <Calendar className="size-3.5" /> schedule
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-5">
        <div className="flex items-center justify-between mb-3">
          <p className="label">batches</p>
          <button onClick={() => setAllHistory(true)} className="pressable flex items-center gap-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            all history <ChevronRight className="size-3" />
          </button>
        </div>
        <div style={{ borderTop: "1px solid var(--border-dim)" }}>
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpen(b)}
              className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              style={{ borderBottom: "1px solid var(--border-dim)", height: 52 }}
            >
              <span
                className="dot shrink-0"
                style={{ background: b.mode === "Enhanced" ? "var(--status-ok)" : "var(--text-tertiary)" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{b.name}</p>
                <p className="text-[11px] font-light" style={{ color: "var(--text-secondary)" }}>
                  {b.count} recipients · {b.date}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{b.total}</p>
                <p className="label">{b.mode.toLowerCase()}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">{open.count} recipients · {open.date}</p>
              <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{open.total}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span
                  className="dot"
                  style={{ background: open.mode === "Enhanced" ? "var(--status-ok)" : "var(--text-tertiary)" }}
                />
                <span className="text-[11px] font-light" style={{ color: open.mode === "Enhanced" ? "var(--status-ok)" : "var(--text-secondary)" }}>
                  {open.mode.toLowerCase()}
                </span>
              </div>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <SRow l="fee" v={open.fee} />
              <SRow l="settlement" v={open.asset} />
              <SRow l="schedule" v="monthly · 1st" />
              <SRow l="privacy" v={open.mode === "Enhanced" ? "z-addr per recipient" : "direct"} last />
            </div>
            <div>
              <p className="label mb-2">recipients</p>
              <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
                {Array.from({ length: Math.min(open.count, 5) }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3"
                    style={i < Math.min(open.count, 5) - 1 ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
                  >
                    <span className="dot" style={{ background: "var(--text-tertiary)" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>member {i + 1}</p>
                      <p className="text-[10px] font-light" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                        z-addr · zs1{Math.random().toString(36).slice(2, 8)}…
                      </p>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>
                      ${(Number(open.total.replace(/[^\d.]/g, "")) / open.count).toFixed(0)}
                    </p>
                  </div>
                ))}
              </div>
              {open.count > 5 && (
                <p className="label text-center mt-2">+ {open.count - 5} more</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost py-2.5 flex items-center justify-center gap-1.5 text-[11px]">
                <Pencil className="size-3.5" /> edit
              </button>
              <button className="btn-primary py-2.5 flex items-center justify-center gap-1.5 text-[11px]">
                <Play className="size-3.5" /> run now
              </button>
            </div>
          </div>
        )}
      </DetailSheet>

      <AllHistorySheet open={allHistory} scope="stream" onClose={() => setAllHistory(false)} title="Stream history" />
    </div>
  );
}

function BatchStat({ l, v, ok }: { l: string; v: string; ok?: boolean }) {
  return (
    <div className="px-3 py-2 text-center" style={{ border: "1px solid var(--border-dim)", borderRadius: 4 }}>
      <p className="label mb-1">{l}</p>
      <p className="text-[13px]" style={{ color: ok ? "var(--status-ok)" : "var(--text-primary)" }}>{v}</p>
    </div>
  );
}

function SRow({ l, v, last }: { l: string; v: string; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <span className="label shrink-0">{l}</span>
      <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{v}</span>
    </div>
  );
}

// Suppressing unused import warnings — kept for future use
const _unused = { Users, Shield };
