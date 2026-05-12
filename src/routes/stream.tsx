import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Users, Plus, Shield, Calendar } from "lucide-react";

export const Route = createFileRoute("/stream")({ component: StreamPage });

const batches = [
  { name: "Engineering · M5", count: 14, total: "$48,200.00", mode: "Enhanced", date: "Mar 1" },
  { name: "Contractors · weekly", count: 6, total: "$8,940.00", mode: "Standard", date: "Feb 24" },
  { name: "Design · M4", count: 4, total: "$12,400.00", mode: "Enhanced", date: "Feb 1" },
];

function StreamPage() {
  return (
    <div>
      <AppHeader subtitle="UmbraStream · Payroll" />
      <section className="px-5">
        <div className="rounded-3xl border border-border p-6 bg-[image:var(--gradient-card)] grain">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Next batch</p>
          <h1 className="mt-2 text-3xl font-display font-semibold">Engineering · M5</h1>
          <p className="text-xs text-muted-foreground mt-1">Runs in 2 days · 14 recipients</p>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-foreground/5 border border-border py-3">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Total</p>
              <p className="text-sm font-mono mt-1">$48,200</p>
            </div>
            <div className="rounded-2xl bg-foreground/5 border border-border py-3">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Mode</p>
              <p className="text-sm mt-1 text-shield font-medium">Enhanced</p>
            </div>
            <div className="rounded-2xl bg-foreground/5 border border-border py-3">
              <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Fee</p>
              <p className="text-sm font-mono mt-1">1.75%</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button className="rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-1.5">
              <Plus className="size-4" /> New batch
            </button>
            <button className="rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-1.5">
              <Calendar className="size-4" /> Schedule
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Batches</h2>
        <div className="space-y-2">
          {batches.map((b, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card px-4 py-3.5 flex items-center gap-3">
              <div className={`size-10 rounded-xl grid place-items-center ${b.mode === "Enhanced" ? "bg-shield/15 text-shield" : "bg-secondary text-foreground"}`}>
                {b.mode === "Enhanced" ? <Shield className="size-4" /> : <Users className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.name}</p>
                <p className="text-[11px] text-muted-foreground">{b.count} recipients · {b.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{b.total}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{b.mode}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
