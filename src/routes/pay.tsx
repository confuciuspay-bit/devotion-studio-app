import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { QrCode, Copy, Link2, Plus, Check } from "lucide-react";

export const Route = createFileRoute("/pay")({ component: PayPage });

const payments = [
  { id: "INV-2041", merchant: "Loft Studio", amt: "$1,250.00", chain: "ETH · stealth", status: "Funded" },
  { id: "INV-2040", merchant: "Aperture Co.", amt: "$340.00", chain: "Polygon · stealth", status: "Released" },
  { id: "INV-2039", merchant: "Noir Press", amt: "$48.50", chain: "Arbitrum · stealth", status: "Released" },
];

function PayPage() {
  return (
    <div>
      <AppHeader subtitle="UmbraPay · PSP" />
      <section className="px-5">
        <div className="rounded-3xl border border-border p-6 bg-[image:var(--gradient-card)] grain relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">This month · gross</div>
          <h1 className="text-4xl font-display font-semibold mt-2 tabular-nums">$184,290<span className="text-muted-foreground">.00</span></h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-shield font-mono">FREE</span>
            <span className="text-muted-foreground">PSP fee · vault active</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <button className="bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold flex flex-col items-center gap-1">
              <Plus className="size-4" /> New
            </button>
            <button className="bg-foreground/5 border border-border rounded-2xl py-3 text-sm font-medium flex flex-col items-center gap-1">
              <QrCode className="size-4" /> QR
            </button>
            <button className="bg-foreground/5 border border-border rounded-2xl py-3 text-sm font-medium flex flex-col items-center gap-1">
              <Link2 className="size-4" /> Link
            </button>
          </div>
        </div>
      </section>

      {/* Stealth address */}
      <section className="px-5 mt-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Next stealth address</p>
            <span className="text-[10px] font-mono text-shield bg-shield/10 px-2 py-0.5 rounded-full">ERC-5564</span>
          </div>
          <p className="mt-2 font-mono text-sm break-all leading-relaxed">0x7a3f…91cE · st:0x9d…d2af</p>
          <div className="mt-3 flex gap-2">
            <button className="flex-1 rounded-xl bg-foreground/5 border border-border py-2 text-xs font-medium flex items-center justify-center gap-1.5">
              <Copy className="size-3.5" /> Copy
            </button>
            <button className="flex-1 rounded-xl bg-foreground/5 border border-border py-2 text-xs font-medium flex items-center justify-center gap-1.5">
              <QrCode className="size-3.5" /> Show QR
            </button>
          </div>
        </div>
      </section>

      {/* Recent invoices */}
      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Recent invoices</h2>
        <div className="space-y-2">
          {payments.map((p) => (
            <div key={p.id} className="rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3">
              <div className="size-9 rounded-xl bg-shield/15 text-shield grid place-items-center">
                <Check className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.merchant}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{p.id} · {p.chain}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{p.amt}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.status}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
