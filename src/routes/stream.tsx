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
  {
    id: "b1",
    name: "Engineering · M5",
    count: 14,
    total: "$48,200.00",
    mode: "Enhanced",
    date: "Mar 1",
    fee: "1.75%",
    asset: "USDC → ZEC",
  },
  {
    id: "b2",
    name: "Contractors · weekly",
    count: 6,
    total: "$8,940.00",
    mode: "Standard",
    date: "Feb 24",
    fee: "0.50%",
    asset: "USDC",
  },
  {
    id: "b3",
    name: "Design · M4",
    count: 4,
    total: "$12,400.00",
    mode: "Enhanced",
    date: "Feb 1",
    fee: "1.75%",
    asset: "USDC → ZEC",
  },
];

function StreamPage() {
  const [open, setOpen] = useState<Batch | null>(null);
  const [allHistory, setAllHistory] = useState(false);
  return (
    <div>
      <AppHeader subtitle="UmbraStream · Payroll" />
      <section className="px-5">
        <div className="rounded-3xl border border-border p-6 bg-[image:var(--gradient-card)] grain">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Next batch</p>
          <h1 className="mt-2 text-3xl font-display font-semibold">Engineering · M5</h1>
          <p className="text-xs text-muted-foreground mt-1">Runs in 2 days · 14 recipients</p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Stat l="Total" v="$48,200" />
            <Stat l="Mode" v="Enhanced" highlight />
            <Stat l="Fee" v="1.75%" />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-1.5">
              <Plus className="size-4" /> New batch
            </button>
            <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-1.5">
              <Calendar className="size-4" /> Schedule
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Batches</h2>
        <div className="space-y-2">
          {batches.map((b) => (
            <button
              key={b.id}
              onClick={() => setOpen(b)}
              className="pressable w-full text-left rounded-2xl border border-border bg-card px-4 py-3.5 flex items-center gap-3 active:bg-foreground/5"
            >
              <div
                className={`size-10 rounded-xl grid place-items-center ${b.mode === "Enhanced" ? "bg-shield/15 text-shield" : "bg-secondary text-foreground"}`}
              >
                {b.mode === "Enhanced" ? <Shield className="size-4" /> : <Users className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {b.count} recipients · {b.date}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{b.total}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.mode}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.name}>
        {open && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {open.count} recipients · {open.date}
              </p>
              <p className="text-3xl font-display font-semibold mt-1 tabular-nums">{open.total}</p>
              <span
                className={`inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded-full ${open.mode === "Enhanced" ? "bg-shield/15 text-shield" : "bg-foreground/5 text-muted-foreground"}`}
              >
                {open.mode}
              </span>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Fee" v={open.fee} />
              <Row l="Settlement" v={open.asset} />
              <Row l="Schedule" v="Monthly · 1st" />
              <Row l="Privacy" v={open.mode === "Enhanced" ? "z-addr per recipient" : "Direct"} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Recipients
              </p>
              <div className="rounded-2xl border border-border divide-y divide-border">
                {Array.from({ length: Math.min(open.count, 5) }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="size-8 rounded-full bg-secondary grid place-items-center text-[11px] font-mono">
                      {String.fromCharCode(65 + i)}
                      {String.fromCharCode(70 + i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">Member {i + 1}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        z-addr · zs1{Math.random().toString(36).slice(2, 8)}…
                      </p>
                    </div>
                    <p className="text-sm font-mono">${(Number(open.total.replace(/[^\d.]/g, "")) / open.count).toFixed(0)}</p>
                  </div>
                ))}
              </div>
              {open.count > 5 && (
                <p className="text-[11px] text-muted-foreground mt-2 text-center">
                  + {open.count - 5} more
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-1.5">
                <Pencil className="size-4" /> Edit
              </button>
              <button className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-1.5">
                <Play className="size-4" /> Run now
              </button>
            </div>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}

function Stat({ l, v, highlight }: { l: string; v: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl bg-foreground/5 border border-border py-3">
      <p className="text-[10px] uppercase text-muted-foreground tracking-wider">{l}</p>
      <p className={`text-sm mt-1 ${highlight ? "text-shield font-medium" : "font-mono"}`}>{v}</p>
    </div>
  );
}

function Row({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground">{l}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
