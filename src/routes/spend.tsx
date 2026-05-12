import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Snowflake, Wifi, Plus, EyeOff } from "lucide-react";

export const Route = createFileRoute("/spend")({ component: SpendPage });

const txns = [
  { m: "Rakuten", c: "Tokyo · ¥", a: "− $42.10", t: "12:08" },
  { m: "Lufthansa", c: "Online · €", a: "− $612.00", t: "Yesterday" },
  { m: "Blue Bottle", c: "NYC · $", a: "− $7.50", t: "Mon" },
  { m: "Top up", c: "from Wallet · ZEC", a: "+ $1,000.00", t: "Mon", in: true },
];

function SpendPage() {
  return (
    <div>
      <AppHeader subtitle="UmbraSpend · Card" />

      {/* Card */}
      <section className="px-5">
        <div className="relative aspect-[1.586/1] rounded-3xl p-6 overflow-hidden border border-border grain"
          style={{
            background:
              "radial-gradient(140% 100% at 0% 0%, oklch(0.30 0.06 85 / 0.55), transparent 60%), linear-gradient(160deg, oklch(0.20 0.012 270), oklch(0.10 0.015 280))",
          }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-md bg-foreground/95 grid place-items-center">
                <div className="size-2.5 rounded-full bg-background" />
              </div>
              <span className="font-display font-semibold">umbra</span>
            </div>
            <Wifi className="size-5 text-foreground/70 -rotate-90" />
          </div>
          <div className="absolute inset-x-6 bottom-6">
            <p className="font-mono text-lg tracking-[0.18em]">•••• •••• •••• 4291</p>
            <div className="mt-3 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Anonymous</p>
                <p className="text-sm font-mono">wallet 0x7a…91cE</p>
              </div>
              <span className="text-xs font-display font-semibold text-foreground/80">VISA</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Available</p>
            <p className="text-3xl font-display font-semibold mt-1 tabular-nums">$2,184<span className="text-muted-foreground">.30</span></p>
          </div>
          <div className="flex gap-2">
            <button className="size-10 rounded-full bg-foreground/5 border border-border grid place-items-center"><EyeOff className="size-4" /></button>
            <button className="size-10 rounded-full bg-foreground/5 border border-border grid place-items-center"><Snowflake className="size-4" /></button>
            <button className="h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
              <Plus className="size-4" /> Top up
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Transactions</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {txns.map((tx, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <div className={`size-10 rounded-full grid place-items-center text-xs font-semibold ${tx.in ? "bg-shield/15 text-shield" : "bg-secondary text-foreground"}`}>
                {tx.m.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.m}</p>
                <p className="text-[11px] text-muted-foreground">{tx.c} · {tx.t}</p>
              </div>
              <p className={`text-sm font-mono ${tx.in ? "text-shield" : ""}`}>{tx.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
