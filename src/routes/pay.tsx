import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { QrCode, Copy, Link2, Plus, Check, ChevronRight, Download, Share2 } from "lucide-react";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/pay")({ component: PayPage });

type Invoice = {
  id: string;
  merchant: string;
  amt: string;
  amtNum: number;
  chain: string;
  status: string;
  date: string;
  customer: string;
  ref: string;
};

const payments: Invoice[] = [
  {
    id: "INV-2041",
    merchant: "Loft Studio",
    amt: "$1,250.00",
    amtNum: 1250,
    chain: "ETH · stealth",
    status: "Funded",
    date: "Today 14:02",
    customer: "0x7a3f…91cE",
    ref: "PO-552",
  },
  {
    id: "INV-2040",
    merchant: "Aperture Co.",
    amt: "$340.00",
    amtNum: 340,
    chain: "Polygon · stealth",
    status: "Released",
    date: "Today 11:48",
    customer: "0x1d22…ff80",
    ref: "PO-549",
  },
  {
    id: "INV-2039",
    merchant: "Noir Press",
    amt: "$48.50",
    amtNum: 48.5,
    chain: "Arbitrum · stealth",
    status: "Released",
    date: "Yesterday",
    customer: "0xae90…2210",
    ref: "PO-545",
  },
];

function PayPage() {
  const [open, setOpen] = useState<Invoice | null>(null);

  return (
    <div>
      <AppHeader subtitle="UmbraPay · PSP" />
      <section className="px-5">
        <div className="rounded-3xl border border-border p-6 bg-[image:var(--gradient-card)] grain relative overflow-hidden">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            This month · gross
          </div>
          <h1 className="text-4xl font-display font-semibold mt-2 tabular-nums">
            $184,290<span className="text-muted-foreground">.00</span>
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-shield font-mono">FREE</span>
            <span className="text-muted-foreground">PSP fee · vault active</span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <button className="pressable bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold flex flex-col items-center gap-1">
              <Plus className="size-4" /> New
            </button>
            <button className="pressable bg-foreground/5 border border-border rounded-2xl py-3 text-sm font-medium flex flex-col items-center gap-1">
              <QrCode className="size-4" /> QR
            </button>
            <button className="pressable bg-foreground/5 border border-border rounded-2xl py-3 text-sm font-medium flex flex-col items-center gap-1">
              <Link2 className="size-4" /> Link
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Next stealth address
            </p>
            <span className="text-[10px] font-mono text-shield bg-shield/10 px-2 py-0.5 rounded-full">
              ERC-5564
            </span>
          </div>
          <p className="mt-2 font-mono text-sm break-all leading-relaxed">
            0x7a3f…91cE · st:0x9d…d2af
          </p>
          <div className="mt-3 flex gap-2">
            <button className="pressable flex-1 rounded-xl bg-foreground/5 border border-border py-2 text-xs font-medium flex items-center justify-center gap-1.5">
              <Copy className="size-3.5" /> Copy
            </button>
            <button className="pressable flex-1 rounded-xl bg-foreground/5 border border-border py-2 text-xs font-medium flex items-center justify-center gap-1.5">
              <QrCode className="size-3.5" /> Show QR
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Recent invoices</h2>
        <div className="space-y-2">
          {payments.map((p) => (
            <button
              key={p.id}
              onClick={() => setOpen(p)}
              className="w-full text-left pressable rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 active:bg-foreground/5"
            >
              <div className="size-9 rounded-xl bg-shield/15 text-shield grid place-items-center">
                <Check className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{p.merchant}</p>
                <p className="text-[11px] text-muted-foreground font-mono">
                  {p.id} · {p.chain}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-mono">{p.amt}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {p.status}
                </p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.id}>
        {open && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {open.merchant}
              </p>
              <p className="text-3xl font-display font-semibold mt-1 tabular-nums">{open.amt}</p>
              <span className="inline-block mt-2 text-[10px] font-mono text-shield bg-shield/10 px-2 py-0.5 rounded-full">
                {open.status}
              </span>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Date" v={open.date} />
              <Row l="Customer" v={open.customer} mono />
              <Row l="Reference" v={open.ref} mono />
              <Row l="Network" v={open.chain} />
              <Row l="PSP fee" v="$0.00 · waived" />
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                Settlement
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono">USDC</span>
                <span>→</span>
                <span className="text-shield font-mono">ZEC z-addr</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-xs font-medium flex flex-col items-center gap-1">
                <Download className="size-4" /> PDF
              </button>
              <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-xs font-medium flex flex-col items-center gap-1">
                <Share2 className="size-4" /> Share
              </button>
              <button className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-xs font-semibold">
                Refund
              </button>
            </div>
          </div>
        )}
      </DetailSheet>
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
