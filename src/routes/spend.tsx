import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
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
  a: string;
  t: string;
  in?: boolean;
  category: string;
  fx?: string;
  status: string;
};

const txns: Tx[] = [
  {
    id: "tx1",
    m: "Rakuten",
    c: "Tokyo · ¥",
    a: "− $42.10",
    t: "12:08",
    category: "Shopping",
    fx: "¥6,280 @ 149.16",
    status: "Settled",
  },
  {
    id: "tx2",
    m: "Lufthansa",
    c: "Online · €",
    a: "− $612.00",
    t: "Yesterday",
    category: "Travel",
    fx: "€565.00 @ 1.083",
    status: "Settled",
  },
  {
    id: "tx3",
    m: "Blue Bottle",
    c: "NYC · $",
    a: "− $7.50",
    t: "Mon",
    category: "Coffee",
    status: "Settled",
  },
  {
    id: "tx4",
    m: "Top up",
    c: "from Wallet · ZEC",
    a: "+ $1,000.00",
    t: "Mon",
    in: true,
    category: "Funding",
    status: "Confirmed",
  },
];

function SpendPage() {
  const [revealed, setRevealed] = useState(false);
  const [openTx, setOpenTx] = useState<Tx | null>(null);
  const [openWallet, setOpenWallet] = useState(false);
  const fullPan = "4291 7702 4118 8842";
  const masked = "•••• •••• •••• 8842";

  return (
    <div>
      <AppHeader subtitle="UmbraSpend · Card" />

      <section className="px-5">
        <div
          className="relative aspect-[1.586/1] rounded-3xl p-6 overflow-hidden border border-border grain"
          style={{
            background:
              "radial-gradient(140% 100% at 0% 0%, oklch(0.30 0.06 85 / 0.55), transparent 60%), linear-gradient(160deg, oklch(0.20 0.012 270), oklch(0.10 0.015 280))",
          }}
        >
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
            <button
              onClick={() => setRevealed((v) => !v)}
              className="font-mono text-lg tracking-[0.18em] block w-full text-left pressable"
            >
              {revealed ? fullPan : masked}
            </button>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    Exp
                  </p>
                  <p className="text-sm font-mono">{revealed ? "08/29" : "••/••"}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    CVV
                  </p>
                  <p className="text-sm font-mono">{revealed ? "418" : "•••"}</p>
                </div>
              </div>
              <span className="text-xs font-display font-semibold text-foreground/80">VISA</span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px]">
          <button
            onClick={() => setRevealed((v) => !v)}
            className="flex items-center gap-1.5 text-muted-foreground pressable"
          >
            {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {revealed ? "Hide details" : "Reveal card details"}
          </button>
          <span className="text-muted-foreground font-mono flex items-center gap-1">
            <Lock className="size-3" /> Face ID required
          </span>
        </div>

        {/* Apple Wallet */}
        <button
          onClick={() => setOpenWallet(true)}
          className="mt-4 w-full rounded-2xl bg-black text-white py-3.5 text-sm font-semibold flex items-center justify-center gap-2 border border-white/10 pressable"
        >
          <AppleLogo />
          Add to Apple Wallet
        </button>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Available
            </p>
            <p className="text-3xl font-display font-semibold mt-1 tabular-nums">
              $2,184<span className="text-muted-foreground">.30</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button className="pressable size-10 rounded-full bg-foreground/5 border border-border grid place-items-center">
              <Snowflake className="size-4" />
            </button>
            <button className="pressable h-10 px-4 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-1.5">
              <Plus className="size-4" /> Top up
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold mb-3">Transactions</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {txns.map((tx) => (
            <button
              key={tx.id}
              onClick={() => setOpenTx(tx)}
              className="pressable w-full text-left flex items-center gap-3 px-4 py-3.5 active:bg-foreground/5"
            >
              <div
                className={`size-10 rounded-full grid place-items-center text-xs font-semibold ${tx.in ? "bg-shield/15 text-shield" : "bg-secondary text-foreground"}`}
              >
                {tx.m.slice(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{tx.m}</p>
                <p className="text-[11px] text-muted-foreground">
                  {tx.c} · {tx.t}
                </p>
              </div>
              <p className={`text-sm font-mono ${tx.in ? "text-shield" : ""}`}>{tx.a}</p>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <DetailSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.m}>
        {openTx && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {openTx.category}
              </p>
              <p className={`text-3xl font-display font-semibold mt-1 tabular-nums ${openTx.in ? "text-shield" : ""}`}>
                {openTx.a}
              </p>
              <p className="text-[11px] font-mono text-muted-foreground mt-1">{openTx.c}</p>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="When" v={openTx.t} />
              <Row l="Status" v={openTx.status} />
              {openTx.fx && <Row l="FX" v={openTx.fx} mono />}
              <Row l="Funded by" v="ZEC · shielded" />
              <Row l="Card" v="•••• 8842" mono />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium">
                Dispute
              </button>
              <button className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium">
                Categorize
              </button>
            </div>
          </div>
        )}
      </DetailSheet>

      <DetailSheet
        open={openWallet}
        onClose={() => setOpenWallet(false)}
        title="Add to Apple Wallet"
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 flex items-start gap-3">
            <div className="size-10 rounded-xl bg-foreground/5 grid place-items-center">
              <ShieldCheck className="size-5 text-shield" />
            </div>
            <div className="text-sm">
              <p className="font-semibold">Provision Umbra Card</p>
              <p className="text-muted-foreground text-xs mt-1">
                A signed pass will be added to Apple Wallet for tap-to-pay. Card number is
                tokenized — your real PAN never leaves the secure enclave.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border divide-y divide-border">
            <Row l="Card" v="•••• 8842" mono />
            <Row l="Funding" v="ZEC · shielded" />
            <Row l="Region" v="Worldwide" />
          </div>

          <a
            href="/umbra-card.pkpass"
            download
            className="w-full rounded-2xl bg-black text-white py-3.5 text-sm font-semibold flex items-center justify-center gap-2 border border-white/10 pressable"
          >
            <AppleLogo />
            Add to Apple Wallet
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(fullPan)}
            className="w-full pressable rounded-2xl bg-foreground/5 border border-border py-3 text-xs font-medium flex items-center justify-center gap-2"
          >
            <Copy className="size-3.5" /> Copy card number
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            On iPhone, this opens the Wallet app. On other devices, save the .pkpass and import it
            in Wallet on your iPhone.
          </p>
        </div>
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

function AppleLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.18 3.06-.83.92-2.18 1.62-3.27 1.54-.13-1.13.43-2.32 1.16-3.08.82-.86 2.22-1.5 3.29-1.52zM20.5 17.06c-.55 1.27-.81 1.84-1.51 2.96-.98 1.55-2.36 3.49-4.07 3.5-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49 1-4.01.98-1.7-.02-3.01-1.77-3.99-3.32C.16 16.04-.32 11.16 1.42 8.62c1.23-1.79 3.18-2.83 5.01-2.83 1.86 0 3.03 1.02 4.57 1.02 1.49 0 2.4-1.02 4.55-1.02 1.62 0 3.34.88 4.57 2.41-4.02 2.2-3.36 7.94.38 8.86z" />
    </svg>
  );
}
