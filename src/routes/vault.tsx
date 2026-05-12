import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { Shield, ArrowRight, Lock, ChevronRight } from "lucide-react";
import { useApp } from "@/lib/store";
import { maskValue } from "@/lib/markets";

export const Route = createFileRoute("/vault")({ component: VaultPage });

const flow = [
  { l: "Customer pays", v: "USDC · ETH" },
  { l: "Swap to ZEC", v: "Maya · 10 bps" },
  { l: "Shield to z-addr", v: "Per-merchant" },
  { l: "Payout", v: "Any currency" },
];

type Settled = {
  d: string;
  in: string;
  out: string;
  fee: string;
  inAsset: string;
  rate: string;
  block: string;
  hash: string;
};

const settled: Settled[] = [
  {
    d: "Today 14:02",
    in: "$1,250.00 USDC",
    out: "12.4 ZEC → z-addr",
    fee: "$25.00",
    inAsset: "USDC · Ethereum",
    rate: "1 ZEC = $100.81",
    block: "21,182,442",
    hash: "0xa1c2…ee44",
  },
  {
    d: "Today 11:48",
    in: "$340.00 USDT",
    out: "3.4 ZEC → z-addr",
    fee: "$6.80",
    inAsset: "USDT · Polygon",
    rate: "1 ZEC = $100.00",
    block: "21,182,200",
    hash: "0xb3d4…7710",
  },
  {
    d: "Yesterday",
    in: "$8,400.00 USDC",
    out: "83.2 ZEC → z-addr",
    fee: "$168.00",
    inAsset: "USDC · Arbitrum",
    rate: "1 ZEC = $100.96",
    block: "21,180,011",
    hash: "0xc5e6…2298",
  },
];

function VaultPage() {
  const [open, setOpen] = useState<Settled | null>(null);
  const hidden = useApp((s) => s.hideBalances);

  return (
    <div>
      <AppHeader subtitle="UmbraVault" />
      <section className="px-5">
        <div className="relative rounded-3xl border border-shield/30 p-6 bg-[image:var(--gradient-shield)] grain overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-shield/15 text-shield grid place-items-center">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Shielded balance
              </p>
              <p className="text-xs text-shield font-mono">z-addr · per-merchant</p>
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-display font-semibold tabular-nums">
            <span className="text-shield">ⓩ</span> 1,284.62{" "}
            <span className="text-muted-foreground text-2xl">ZEC</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">≈ $43,617.49 · 2.00% all-in</p>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button className="pressable rounded-2xl bg-shield text-background py-3 text-sm font-semibold">
              Withdraw
            </button>
            <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium">
              Settings
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-5">
        <h2 className="text-sm font-semibold mb-3">Per-payment flow</h2>
        <div className="rounded-2xl border border-border bg-card p-2">
          {flow.map((f, i) => (
            <div key={f.l} className="flex items-center">
              <div className="flex-1 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Step {i + 1}
                </p>
                <p className="text-sm font-medium">{f.l}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{f.v}</p>
              </div>
              {i < flow.length - 1 && <ArrowRight className="size-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Recently settled</h2>
        <div className="space-y-2">
          {settled.map((s, i) => (
            <button
              key={i}
              onClick={() => setOpen(s)}
              className="pressable w-full text-left rounded-2xl border border-border bg-card p-4 active:bg-foreground/5"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">{s.d}</p>
                <span className="text-[10px] font-mono text-shield flex items-center gap-1">
                  <Lock className="size-3" /> shielded
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm font-mono">
                <span>{s.in}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="text-shield">{s.out}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground font-mono">Fee {s.fee}</p>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title="Vault settlement">
        {open && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-mono">
                <span>{open.in}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="text-shield">{open.out}</span>
              </div>
              <p className="text-center text-[10px] font-mono text-shield bg-shield/10 px-2 py-1 rounded-full inline-block w-full">
                <Lock className="size-3 inline mr-1" /> Shielded · per-merchant z-addr
              </p>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Time" v={open.d} />
              <Row l="Source" v={open.inAsset} />
              <Row l="Rate" v={open.rate} mono />
              <Row l="All-in fee" v={`${open.fee} · 2.00%`} />
              <Row l="Block" v={open.block} mono />
              <Row l="Tx hash" v={open.hash} mono />
            </div>
            <button className="w-full pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold">
              View on explorer
            </button>
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
