import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { ArrowDownLeft, ArrowUpRight, Repeat, Shield, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({ component: WalletHome });

const assets = [
  { sym: "ZEC", name: "Zcash · shielded", amount: "142.50", value: "$4,832.10", chg: "+2.4%", shield: true },
  { sym: "ETH", name: "Ethereum", amount: "1.84", value: "$5,124.88", chg: "+0.8%" },
  { sym: "USDC", name: "USD Coin · earning 4.8%", amount: "8,200.00", value: "$8,200.00", chg: "0.00%", yield: true },
  { sym: "BTC", name: "Bitcoin", amount: "0.0612", value: "$4,210.00", chg: "-1.2%" },
];

const activity = [
  { t: "Shielded into vault", s: "via UmbraVault · ZEC", v: "+ $1,250.00", time: "2m", shield: true },
  { t: "Swap ETH → ZEC", s: "Streaming · 0.50%", v: "− 0.42 ETH", time: "1h" },
  { t: "Payroll batch #218", s: "12 recipients · enhanced", v: "− $9,840.00", time: "Yesterday" },
];

function WalletHome() {
  return (
    <div className="relative">
      <AppHeader subtitle="Wallet" />

      {/* Balance hero */}
      <section className="px-5 pt-2">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-[image:var(--gradient-card)] p-6 ring-eclipse grain">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Shield className="size-3.5 text-shield" /> Total balance · shielded
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h1 className="text-5xl font-semibold text-gradient-eclipse font-display tabular-nums">$22,367</h1>
            <span className="text-2xl text-muted-foreground font-display">.98</span>
          </div>
          <div className="mt-1 text-xs text-shield font-mono">+ $284.30 today · +1.28%</div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {[
              { i: ArrowDownLeft, l: "Receive" },
              { i: ArrowUpRight, l: "Send" },
              { i: Repeat, l: "Swap" },
              { i: Shield, l: "Shield" },
            ].map(({ i: Icon, l }) => (
              <button key={l} className="flex flex-col items-center gap-1.5 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition py-3 border border-border/60">
                <Icon className="size-4 text-primary" />
                <span className="text-[11px] font-medium">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy banner */}
      <section className="px-5 mt-4">
        <div className="rounded-2xl border border-shield/30 p-4 flex items-start gap-3 bg-[image:var(--gradient-shield)]">
          <div className="size-9 grid place-items-center rounded-xl bg-shield/15 text-shield shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Anonymity set: 4.9M ZEC</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your last 7 receives transited the shielded pool. On-chain link broken.</p>
          </div>
        </div>
      </section>

      {/* Assets */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-tight">Assets</h2>
          <button className="text-xs text-muted-foreground flex items-center">All chains <ChevronRight className="size-3" /></button>
        </div>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {assets.map((a) => (
            <div key={a.sym} className="flex items-center gap-3 px-4 py-3.5">
              <div className={`size-10 rounded-full grid place-items-center font-mono text-[11px] font-semibold ${
                a.shield ? "bg-shield/15 text-shield ring-shield" : a.yield ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"
              }`}>{a.sym}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{a.sym}</p>
                  {a.yield && <TrendingUp className="size-3 text-primary" />}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">{a.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono tabular-nums">{a.value}</p>
                <p className={`text-[11px] font-mono ${a.chg.startsWith("+") ? "text-shield" : a.chg.startsWith("-") ? "text-destructive" : "text-muted-foreground"}`}>{a.chg}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold tracking-tight mb-3">Recent activity</h2>
        <div className="space-y-2">
          {activity.map((a, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
              <div className={`size-9 rounded-xl grid place-items-center ${a.shield ? "bg-shield/15 text-shield" : "bg-secondary text-muted-foreground"}`}>
                {a.shield ? <Shield className="size-4" /> : <Repeat className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.t}</p>
                <p className="text-[11px] text-muted-foreground">{a.s} · {a.time}</p>
              </div>
              <p className="text-sm font-mono tabular-nums">{a.v}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
