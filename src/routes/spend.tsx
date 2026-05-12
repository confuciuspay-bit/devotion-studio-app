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
  Plus,
  EyeOff,
  Eye,
  ChevronRight,
  Copy,
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

      {/* Card */}
      <section className="px-4 py-5" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div
          className="p-4"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            aspectRatio: "1.586 / 1",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                fontWeight: 400,
                color: "var(--text-primary)",
              }}
            >
              umbra
            </span>
            <span className="label" style={{ color: "var(--text-tertiary)" }}>visa</span>
          </div>

          {/* PAN */}
          <div className="absolute inset-x-4 bottom-4">
            <button
              onClick={tryReveal}
              className="pressable w-full text-left transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                letterSpacing: "0.15em",
                color: "var(--text-primary)",
              }}
            >
              {revealed ? fullPan : masked}
            </button>
            <div className="mt-3 flex items-end justify-between">
              <div className="flex gap-5">
                <div>
                  <p className="label">exp</p>
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {revealed ? "08/29" : "••/••"}
                  </p>
                </div>
                <div>
                  <p className="label">cvv</p>
                  <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                    {revealed ? "418" : "•••"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="dot dot-ok" />
                <span className="text-[11px] font-light" style={{ color: "var(--status-ok)" }}>shielded</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={tryReveal}
            className="pressable flex items-center gap-1.5 text-[12px] font-light transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            {revealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            {revealed ? "hide details" : "reveal details"}
          </button>
          <button
            onClick={() => setOpenWallet(true)}
            className="pressable text-[12px] font-light transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            add to wallet
          </button>
        </div>

        {/* Balance + actions */}
        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="label mb-1">available</p>
            <p className="text-[22px]" style={{ color: "var(--text-primary)", fontWeight: 400 }}>
              {hidden ? "•••••" : fmt(balanceUsd)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="pressable flex items-center justify-center transition-colors"
              style={{
                width: 36,
                height: 36,
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 4,
                color: "var(--text-secondary)",
              }}
            >
              <Snowflake className="size-3.5" />
            </button>
            <button
              className="btn-primary flex items-center gap-1.5 px-4"
              style={{ height: 36 }}
            >
              <Plus className="size-3" /> top up
            </button>
          </div>
        </div>
      </section>

      {/* Transactions */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label">transactions</p>
          <button
            onClick={() => setAllHistory(true)}
            className="pressable flex items-center gap-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            all history <ChevronRight className="size-3" />
          </button>
        </div>
        <div style={{ borderTop: "1px solid var(--border-dim)" }}>
          {txns.map((tx) => {
            const incoming = tx.usd > 0;
            return (
              <button
                key={tx.id}
                onClick={() => setOpenTx(tx)}
                className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
              >
                <span
                  className="dot shrink-0"
                  style={{ background: incoming ? "var(--status-ok)" : "var(--text-tertiary)" }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)] truncate">{tx.m}</p>
                  <p className="text-[11px] font-light" style={{ color: "var(--text-secondary)" }}>
                    {tx.c} · {tx.t}
                  </p>
                </div>
                <p
                  className="text-[13px]"
                  style={{ color: incoming ? "var(--status-ok)" : "var(--text-primary)" }}
                >
                  {signed(tx.usd)}
                </p>
                <ChevronRight className="size-3" style={{ color: "var(--text-tertiary)" }} />
              </button>
            );
          })}
        </div>
      </section>

      {/* Transaction detail */}
      <DetailSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.m}>
        {openTx && (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">{openTx.category.toLowerCase()}</p>
              <p
                className="text-[22px]"
                style={{ color: openTx.usd > 0 ? "var(--status-ok)" : "var(--text-primary)" }}
              >
                {signed(openTx.usd)}
              </p>
              <p className="text-[12px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>
                {openTx.c}
              </p>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <SRow l="when" v={openTx.t} />
              <SRow l="status" v={openTx.status} />
              {openTx.fx && <SRow l="fx" v={openTx.fx} mono />}
              <SRow l="funded by" v="ZEC · shielded" />
              <SRow l="card" v="•••• 8842" mono last />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost py-2.5 text-[11px]">dispute</button>
              <button className="btn-ghost py-2.5 text-[11px]">categorize</button>
            </div>
          </div>
        )}
      </DetailSheet>

      {/* Add to wallet */}
      <DetailSheet open={openWallet} onClose={() => setOpenWallet(false)} title="Add to Apple Wallet">
        <div className="space-y-4">
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <SRow l="card" v="•••• 8842" mono />
            <SRow l="funding" v="ZEC · shielded" />
            <SRow l="region" v="worldwide" last />
          </div>
          <a
            href="/umbra-card.pkpass"
            download
            className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-[12px]"
          >
            <AppleLogo /> add to apple wallet
          </a>
          <button
            onClick={() => navigator.clipboard?.writeText(fullPan)}
            className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2 text-[12px]"
          >
            <Copy className="size-3" /> copy card number
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

function SRow({ l, v, mono, last }: { l: string; v: string; mono?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <span className="label">{l}</span>
      <span
        className="text-[12px] text-[var(--text-primary)]"
        style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
      >
        {v}
      </span>
    </div>
  );
}

function AppleLogo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.23-1.18 3.06-.83.92-2.18 1.62-3.27 1.54-.13-1.13.43-2.32 1.16-3.08.82-.86 2.22-1.5 3.29-1.52zM20.5 17.06c-.55 1.27-.81 1.84-1.51 2.96-.98 1.55-2.36 3.49-4.07 3.5-1.52.02-1.91-.99-3.97-.98-2.06.01-2.49 1-4.01.98-1.7-.02-3.01-1.77-3.99-3.32C.16 16.04-.32 11.16 1.42 8.62c1.23-1.79 3.18-2.83 5.01-2.83 1.86 0 3.03 1.02 4.57 1.02 1.49 0 2.4-1.02 4.55-1.02 1.62 0 3.34.88 4.57 2.41-4.02 2.2-3.36 7.94.38 8.86z" />
    </svg>
  );
}
