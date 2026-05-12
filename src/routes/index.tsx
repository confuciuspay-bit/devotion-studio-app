import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { WalletFlow } from "@/components/flows/WalletFlow";
import { useMarkets, fmtPct } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Shield,
  ChevronRight,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/")({ component: WalletHome });

const HOLDINGS: Record<string, number> = {
  zcash: 142.5,
  bitcoin: 0.0612,
  ethereum: 1.84,
  "usd-coin": 8200,
  solana: 12.4,
};

type Activity = {
  id: string;
  t: string;
  s: string;
  usd: number;
  time: string;
  shield?: boolean;
  type: "shield" | "swap" | "payroll" | "receive";
  hash: string;
  network: string;
  fee: string;
};

const activity: Activity[] = [
  {
    id: "a1",
    t: "Shielded into vault",
    s: "via UmbraVault · ZEC",
    usd: 1250,
    time: "2m",
    shield: true,
    type: "shield",
    hash: "0x9f2c…ad11",
    network: "Zcash · Sapling",
    fee: "$0.0001",
  },
  {
    id: "a2",
    t: "Swap ETH → ZEC",
    s: "Streaming · 0.50%",
    usd: -1480,
    time: "1h",
    type: "swap",
    hash: "0x7b1e…cc24",
    network: "Maya Protocol",
    fee: "$1.42",
  },
  {
    id: "a3",
    t: "Payroll batch #218",
    s: "12 recipients · enhanced",
    usd: -9840,
    time: "Yesterday",
    type: "payroll",
    hash: "batch:00218",
    network: "Multi-chain",
    fee: "$172.20",
  },
];

function WalletHome() {
  const { data } = useMarkets();
  const [openTx, setOpenTx] = useState<Activity | null>(null);
  const [flow, setFlow] = useState<"receive" | "send" | "swap" | "shield" | null>(null);
  const [allHistory, setAllHistory] = useState(false);
  const { fmt, signed, hidden } = useMoney();

  const assets = useMemo(() => {
    if (!data) return [];
    return Object.entries(HOLDINGS)
      .map(([id, qty]) => {
        const m = data.find((x) => x.id === id);
        if (!m) return null;
        return {
          id,
          symbol: m.symbol.toUpperCase(),
          name: m.name,
          image: m.image,
          qty,
          value: qty * m.current_price,
          chg: m.price_change_percentage_24h ?? 0,
          spark: m.sparkline_in_7d?.price ?? [],
        };
      })
      .filter(Boolean) as Array<{
      id: string;
      symbol: string;
      name: string;
      image: string;
      qty: number;
      value: number;
      chg: number;
      spark: number[];
    }>;
  }, [data]);

  const total = assets.reduce((s, a) => s + a.value, 0);

  return (
    <div className="animate-fade-in">
      <AppHeader subtitle="Wallet" />

      {/* Balance */}
      <section className="px-4 pt-6 pb-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <p className="label mb-2">total balance</p>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 400,
            fontSize: 28,
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
          }}
        >
          {total ? fmt(total, { maximumFractionDigits: 0 }) : <span className="animate-pulse text-[var(--accent)]">_</span>}
        </p>

        {/* Status indicator */}
        <div className="mt-3 flex items-center gap-1.5">
          <span className="dot dot-ok" />
          <span className="text-[12px] text-[var(--text-secondary)] font-light">
            anonymity set 4.9M ZEC · link broken
          </span>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-2">
          {([
            { i: ArrowDownLeft, l: "receive", k: "receive" as const },
            { i: ArrowUpRight, l: "send", k: "send" as const },
            { i: Repeat, l: "swap", k: "swap" as const },
            { i: Shield, l: "shield", k: "shield" as const },
          ]).map(({ i: Icon, l, k }) => (
            <button
              key={l}
              onClick={() => setFlow(k)}
              className="pressable flex-1 flex flex-col items-center gap-1.5 py-3 transition-colors"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 4,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
            >
              <Icon className="size-3.5" style={{ color: "var(--accent)" }} />
              <span className="label" style={{ textTransform: "lowercase", letterSpacing: "0.04em" }}>{l}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Assets */}
      <section className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="label">assets</p>
          <Link
            to="/markets"
            className="pressable flex items-center gap-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            markets <ChevronRight className="size-3" />
          </Link>
        </div>
        <div style={{ borderTop: "1px solid var(--border-dim)" }}>
          {assets.map((a) => {
            const up = a.chg >= 0;
            return (
              <Link
                key={a.id}
                to="/coin/$id"
                params={{ id: a.id }}
                className="pressable flex items-center gap-3 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
                style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
              >
                <CoinIcon src={a.image} symbol={a.symbol} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)]">{a.symbol}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-light">
                    {hidden ? "•••" : a.qty.toLocaleString()} · {a.name}
                  </p>
                </div>
                <Sparkline data={a.spark} positive={up} width={52} height={18} />
                <div className="text-right w-[72px]">
                  <p className="text-[13px] text-[var(--text-primary)]">{fmt(a.value)}</p>
                  <p
                    className="text-[11px]"
                    style={{ color: up ? "var(--status-ok)" : "var(--status-err)" }}
                  >
                    {fmtPct(a.chg)}
                  </p>
                </div>
              </Link>
            );
          })}
          {!assets.length &&
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-3"
                style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
              >
                <div className="size-6 rounded-full bg-[rgba(255,255,255,0.04)] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 w-14 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
                  <div className="h-2 w-20 bg-[rgba(255,255,255,0.03)] rounded animate-pulse" />
                </div>
                <div className="h-2.5 w-12 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
              </div>
            ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-4 pb-4" style={{ borderTop: "1px solid var(--border-dim)" }}>
        <div className="flex items-center justify-between py-3">
          <p className="label">recent activity</p>
          <button
            onClick={() => setAllHistory(true)}
            className="pressable flex items-center gap-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            all history <ChevronRight className="size-3" />
          </button>
        </div>
        <div style={{ borderTop: "1px solid var(--border-dim)" }}>
          {activity.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpenTx(a)}
              className="pressable w-full text-left flex items-center gap-3 py-3 transition-colors hover:bg-[rgba(255,255,255,0.02)]"
              style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
            >
              <span
                className="dot shrink-0"
                style={{
                  background: a.shield ? "var(--status-ok)" : "var(--text-tertiary)",
                  width: 4,
                  height: 4,
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[var(--text-primary)] truncate">{a.t}</p>
                <p className="text-[11px] text-[var(--text-secondary)] font-light">
                  {a.s} · {a.time}
                </p>
              </div>
              <p
                className="text-[13px]"
                style={{ color: a.usd >= 0 ? "var(--status-ok)" : "var(--text-primary)" }}
              >
                {signed(a.usd)}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Transaction detail */}
      <DetailSheet open={!!openTx} onClose={() => setOpenTx(null)} title={openTx?.t}>
        {openTx && (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p
                className="text-[22px]"
                style={{ color: openTx.usd >= 0 ? "var(--status-ok)" : "var(--text-primary)" }}
              >
                {signed(openTx.usd)}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] font-light mt-1">{openTx.s}</p>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <TxRow l="network" v={openTx.network} />
              <TxRow l="fee" v={openTx.fee} />
              <TxRow l="hash" v={openTx.hash} mono />
              <TxRow l="time" v={openTx.time + " ago"} />
              <TxRow l="status" v="confirmed · shielded" last />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="btn-ghost py-2.5 text-[12px] uppercase tracking-widest">
                copy hash
              </button>
              <button className="btn-primary py-2.5 text-[12px]">
                explorer
              </button>
            </div>
          </div>
        )}
      </DetailSheet>

      <WalletFlow open={!!flow} kind={flow} onClose={() => setFlow(null)} />
      <AllHistorySheet open={allHistory} scope="wallet" onClose={() => setAllHistory(false)} title="Wallet history" />
    </div>
  );
}

function TxRow({ l, v, mono, last }: { l: string; v: string; mono?: boolean; last?: boolean }) {
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
