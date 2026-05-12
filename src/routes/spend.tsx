import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PinGate } from "@/components/PinGate";
import { useApp } from "@/lib/store";
import { useMoney } from "@/lib/useMoney";
import {
  Snowflake,
  Wifi,
  Plus,
  EyeOff,
  Eye,
  ChevronRight,
  Copy,
  Lock,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/spend")({ component: SpendPage });

type Tx = {
  id: string;
  m: string;
  c: string;
  usd: number;
  t: string;
  category: string;
  fx?: string;
  status: string;
};

const txns: Tx[] = [
  { id: "tx1", m: "Rakuten",     c: "Tokyo · ¥",          usd: -42.10,  t: "12:08",     category: "Shopping", fx: "¥6,280 @ 149.16",  status: "Settled" },
  { id: "tx2", m: "Lufthansa",   c: "Online · €",         usd: -612.00, t: "Yesterday", category: "Travel",   fx: "€565.00 @ 1.083",  status: "Settled" },
  { id: "tx3", m: "Blue Bottle", c: "NYC · $",            usd: -7.50,   t: "Mon",       category: "Coffee",                              status: "Settled" },
  { id: "tx4", m: "Top up",      c: "from Wallet · ZEC",  usd: 1000,    t: "Mon",       category: "Funding",                             status: "Confirmed" },
];

const fullPan = "4291 7702 4118 8842";
const masked = "•••• •••• •••• 8842";

function SpendPage() {
  const [revealed, setRevealed] = useState(false);
  const [pinGate, setPinGate] = useState(false);
  const [openTx, setOpenTx] = useState<Tx | null>(null);
  const [openWallet, setOpenWallet] = useState(false);
  const [allHistory, setAllHistory] = useState(false);
  const pinHashStored = useApp((s) => s.pinHashStored);
  const { fmt, signed, hidden } = useMoney();
  const balanceUsd = 2184.30;

  const tryReveal = () => {
    if (revealed) { setRevealed(false); return; }
    if (pinHashStored) setPinGate(true); else setRevealed(true);
  };

  return (
    <div className="animate-fade-in">
      <AppHeader subtitle="UmbraSpend · Card" />

      <section className="px-5">
        {/* Card surface */}
        <div
          className="relative aspect-[1.586/1] rounded-lg p-5 overflow-hidden border border-[rgba(255,255,255,0.08)]"
          style={{ background: "linear-gradient(160deg, #1a1a28, #0f0f18)" }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-5 rounded bg-white/90 grid place-items-center">
                <div className="size-2 rounded-full bg-[#0a0a0f]" />
              </div>
              <span className="text-sm font-medium text-white/90">umbra</span>
            </div>
            <Wifi className="size-4 text-white/50 -rotate-90" />
          </div>

          {/* PAN / details at bottom */}
          <div className="absolute inset-x-5 bottom-5">
            <button
              onClick={tryReveal}
              className="font-mono text-base tracking-[0.15em] block w-full text-left text-white pressable"
            >
              {revealed ? fullPan : masked}
            </button>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex gap-4">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">Exp</p>
                  <p className="text-xs font-mono text-white/80">{revealed ? "08/29" : "••/••"}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/40">CVV</p>
                  <p className="text-xs font-mono text-white/80">{revealed ? "418" : "•••"}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-white/60 tracking-widest">VISA</span>
            </div>
          </div>
        </div>

        {/* Card actions */}
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <button
            onClick={tryReveal}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition pressable"
          >
            {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {revealed ? "Hide details" : "Reveal card details"}
          </button>
          <span className="text-muted-foreground font-mono flex items-center gap-1">
            <Lock className="size-3" /> Face ID required
          </span>
        </div>

        <button
          onClick={() => setOpenWallet(true)}
          className="mt-4 w-full rounded-md bg-black text-white py-3 text-sm font-medium flex items-center justify-center gap-2 border border-white/10 pressable hover:bg-white/5 transition"
        >
          <AppleLogo />
          Add to Apple Wallet
        </button>

        {/* Balance + actions */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Available</p>
            <p className="text-2xl font-mono font-semibold mt-1.5 tabular-nums text-foreground">
              {hidden ? "•••••" : fmt(balanceUsd)}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="pressable size-9 rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] grid place-items-center text-muted-foreground hover:text-foreground transition">
              <Snowflake className="size-4" />
            </button>
            <button className="pressable h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5 hover:bg-primary/90 transition">
              <Plus className="size-3.5" /> Top up
            </button>
          </div>
        </div>
      </section>

      {/* Transactions */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Transactions</p>
          <button onClick={() => setAllHistory(true)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition pressable">
            All history <ChevronRight className="size-3" />
          </button>
        </div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden">
          {txns.map((tx) => {
            const incoming = tx.usd > 0;
            return (
              <button
                key={tx.id}
                onClick={() => setOpenTx(tx)}
                className="pressable w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition"
              >
                <div
                  className={`size-8 rounded-md grid place-items-center text-xs font-semibold shrink-0 ${
                    incoming
                      ? "bg-[rgba(16,185,129,0.12)] text-success"
                      : "bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                  }`}
                >
                  {tx.m.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{tx.m}</p>
                  <p className="text-[11px] text-muted-foreground">{tx.c} · {tx.t}</p>
                </div>
                <p className={`text-sm font-mono tabular-nums ${incoming ? "text-success" : "text-foreground"}`}>
                  {signed(tx.usd)}
                </p>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>

      {/* Transaction detail */}
      <DetailSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.m}>
        {openTx && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{openTx.category}</p>
              <p className={`text-3xl font-mono font-semibold mt-2 tabular-nums ${openTx.usd > 0 ? "text-success" : "text-foreground"}`}>
                {signed(openTx.usd)}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">{openTx.c}</p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
              <SRow l="When" v={openTx.t} />
              <SRow l="Status" v={openTx.status} />
              {openTx.fx && <SRow l="FX" v={openTx.fx} mono />}
              <SRow l="Funded by" v="ZEC · shielded" />
              <SRow l="Card" v="•••• 8842" mono />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-2.5 text-sm font-medium hover:bg-[rgba(255,255,255,0.07)] transition">
                Dispute
              </button>
              <button className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-2.5 text-sm font-medium hover:bg-[rgba(255,255,255,0.07)] transition">
                Categorize
              </button>
            </div>
          </div>
        )}
      </DetailSheet>

      {/* Apple Wallet */}
      <DetailSheet open={openWallet} onClose={() => setOpenWallet(false)} title="Add to Apple Wallet">
        <div className="space-y-4">
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card p-4 flex items-start gap-3">
            <div className="size-9 rounded-md bg-[rgba(16,185,129,0.12)] grid place-items-center">
              <ShieldCheck className="size-4 text-success" />
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Provision Umbra Card</p>
              <p className="text-muted-foreground text-xs mt-1">
                Card number is tokenized — your real PAN never leaves the secure enclave.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
            <SRow l="Card" v="•••• 8842" mono />
            <SRow l="Funding" v="ZEC · shielded" />
            <SRow l="Region" v="Worldwide" />
          </div>
          <a
            href="/umbra-card.pkpass"
            download
            className="w-full rounded-md bg-black text-white py-3 text-sm font-medium flex items-center justify-center gap-2 border border-white/10 pressable"
          >
            <AppleLogo />
            Add to Apple Wallet
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(fullPan)}
            className="w-full pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-2.5 text-xs font-medium flex items-center justify-center gap-2 hover:bg-[rgba(255,255,255,0.07)] transition"
          >
            <Copy className="size-3.5" /> Copy card number
          </button>
        </div>
      </DetailSheet>

      <AllHistorySheet open={allHistory} scope="spend" onClose={() => setAllHistory(false)} title="Card history" />

      <DetailSheet open={pinGate} onClose={() => setPinGate(false)} title="Reveal card details">
        <PinGate
          subtitle="PIN required to reveal PAN & CVV"
          onPass={() => { setPinGate(false); setRevealed(true); }}
          onCancel={() => setPinGate(false)}
        />
      </DetailSheet>
    </div>
  );
}

function SRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{l}</span>
      <span className={`text-sm text-foreground ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}

function AppleLogo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.18 3.06-.83.92-2.18 1.62-3.27 1.54-.13-1.13.43-2.32 1.16-3.08.82-.86 2.22-1.5 3.29-1.52zM20.5 17.06c-.55 1.27-.81 1.84-1.51 2.96-.98 1.55-2.36 3.49-4.07 3.5-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49 1-4.01.98-1.7-.02-3.01-1.77-3.99-3.32C.16 16.04-.32 11.16 1.42 8.62c1.23-1.79 3.18-2.83 5.01-2.83 1.86 0 3.03 1.02 4.57 1.02 1.49 0 2.4-1.02 4.55-1.02 1.62 0 3.34.88 4.57 2.41-4.02 2.2-3.36 7.94.38 8.86z" />
    </svg>
  );
}
