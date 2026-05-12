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
  Lock,
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

      {/* Balance card */}
      <section className="px-5 pt-2">
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card p-6">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Total balance
          </p>
          <h1 className="mt-2 text-4xl font-semibold text-foreground font-mono tabular-nums">
            {total ? fmt(total, { maximumFractionDigits: 0 }) : "—"}
          </h1>

          {/* Actions */}
          <div className="mt-6 grid grid-cols-4 gap-2">
            {([
              { i: ArrowDownLeft, l: "Receive", k: "receive" as const },
              { i: ArrowUpRight, l: "Send", k: "send" as const },
              { i: Repeat, l: "Swap", k: "swap" as const },
              { i: Shield, l: "Shield", k: "shield" as const },
            ]).map(({ i: Icon, l, k }) => (
              <button
                key={l}
                onClick={() => setFlow(k)}
                className="pressable flex flex-col items-center gap-1.5 rounded-md bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.06)] py-3 transition"
              >
                <Icon className="size-4 text-primary" />
                <span className="text-[11px] font-medium text-foreground">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Shielded status */}
      <section className="px-5 mt-3">
        <div className="rounded-lg border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)] p-4 flex items-center gap-3">
          <div className="size-1.5 rounded-full bg-success shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground">Anonymity set: 4.9M ZEC</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Last 7 receives transited the shielded pool. On-chain link broken.
            </p>
          </div>
          <Lock className="size-3.5 text-success shrink-0" />
        </div>
      </section>

      {/* Assets */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Assets</p>
          <Link to="/markets" className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition pressable">
            Markets <ChevronRight className="size-3" />
          </Link>
        </div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden">
          {assets.map((a) => {
            const up = a.chg >= 0;
            return (
              <Link
                key={a.id}
                to="/coin/$id"
                params={{ id: a.id }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition"
              >
                <CoinIcon src={a.image} symbol={a.symbol} size={34} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.symbol}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {hidden ? "•••" : a.qty.toLocaleString()} · {a.name}
                  </p>
                </div>
                <Sparkline data={a.spark} positive={up} width={52} height={20} />
                <div className="text-right w-[76px]">
                  <p className="text-sm font-mono tabular-nums text-foreground">{fmt(a.value)}</p>
                  <p className={`text-[11px] font-mono ${up ? "text-success" : "text-destructive"}`}>
                    {fmtPct(a.chg)}
                  </p>
                </div>
              </Link>
            );
          })}
          {!assets.length &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[58px] px-4 py-3 flex items-center gap-3">
                <div className="size-[34px] rounded-full bg-[rgba(255,255,255,0.05)] animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" />
                  <div className="h-2.5 w-24 bg-[rgba(255,255,255,0.03)] rounded animate-pulse" />
                </div>
                <div className="h-3 w-14 bg-[rgba(255,255,255,0.05)] rounded animate-pulse" />
              </div>
            ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Recent activity</p>
          <button onClick={() => setAllHistory(true)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition pressable">
            All history <ChevronRight className="size-3" />
          </button>
        </div>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden">
          {activity.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpenTx(a)}
              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.02)] transition pressable"
            >
              <div
                className={`size-8 rounded-md grid place-items-center shrink-0 ${
                  a.shield
                    ? "bg-[rgba(16,185,129,0.12)] text-success"
                    : "bg-[rgba(255,255,255,0.05)] text-muted-foreground"
                }`}
              >
                {a.shield ? <Shield className="size-3.5" /> : <Repeat className="size-3.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{a.t}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.s} · {a.time}
                </p>
              </div>
              <p className={`text-sm font-mono tabular-nums ${a.usd >= 0 ? "text-success" : "text-foreground"}`}>
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
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 text-center">
              <p className={`text-3xl font-mono font-semibold tabular-nums ${openTx.usd >= 0 ? "text-success" : "text-foreground"}`}>
                {signed(openTx.usd)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{openTx.s}</p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
              <TxRow l="Network" v={openTx.network} />
              <TxRow l="Fee" v={openTx.fee} />
              <TxRow l="Hash" v={openTx.hash} mono />
              <TxRow l="Time" v={openTx.time + " ago"} />
              <TxRow l="Status" v="Confirmed · shielded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-2.5 text-sm font-medium pressable hover:bg-[rgba(255,255,255,0.07)] transition">
                Copy hash
              </button>
              <button className="rounded-md bg-primary text-primary-foreground py-2.5 text-sm font-medium pressable hover:bg-primary/90 transition">
                View on explorer
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

function TxRow({ l, v, mono }: { l: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground">{l}</span>
      <span className={`text-sm ${mono ? "font-mono" : ""} text-foreground`}>{v}</span>
    </div>
  );
}
