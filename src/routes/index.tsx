import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { DetailSheet } from "@/components/DetailSheet";
import { WalletFlow } from "@/components/flows/WalletFlow";
import { useMarkets, fmtUsd, fmtPct, maskValue } from "@/lib/markets";
import { useApp } from "@/lib/store";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Shield,
  Sparkles,
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
  v: string;
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
    v: "+ $1,250.00",
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
    v: "− 0.42 ETH",
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
    v: "− $9,840.00",
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
  const hidden = useApp((s) => s.hideBalances);
  const mask = (s: string) => (hidden ? maskValue(s) : s);

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
    <div className="relative">
      <AppHeader subtitle="Wallet" />

      <section className="px-5 pt-2">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-[image:var(--gradient-card)] p-6 ring-eclipse grain">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Shield className="size-3.5 text-shield" /> Total balance · shielded
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h1 className="text-5xl font-semibold text-gradient-eclipse font-display tabular-nums">
              {total ? mask(fmtUsd(total, { maximumFractionDigits: 0 })) : "—"}
            </h1>
          </div>
          <div className="mt-1 h-4" aria-hidden />

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
                className="pressable flex flex-col items-center gap-1.5 rounded-2xl bg-foreground/5 hover:bg-foreground/10 transition py-3 border border-border/60"
              >
                <Icon className="size-4 text-primary" />
                <span className="text-[11px] font-medium">{l}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="rounded-2xl border border-shield/30 p-4 flex items-start gap-3 bg-[image:var(--gradient-shield)]">
          <div className="size-9 grid place-items-center rounded-xl bg-shield/15 text-shield shrink-0">
            <Sparkles className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Anonymity set: 4.9M ZEC</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your last 7 receives transited the shielded pool. On-chain link broken.
            </p>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-tight">Assets</h2>
          <Link to="/markets" className="text-xs text-muted-foreground flex items-center">
            Markets <ChevronRight className="size-3" />
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {assets.map((a) => {
            const up = a.chg >= 0;
            return (
              <Link
                key={a.id}
                to="/coin/$id"
                params={{ id: a.id }}
                className="flex items-center gap-3 px-4 py-3.5 active:bg-foreground/5"
              >
                <CoinIcon src={a.image} symbol={a.symbol} size={36} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{a.symbol}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {hidden ? "•••" : a.qty.toLocaleString()} · {a.name}
                  </p>
                </div>
                <Sparkline data={a.spark} positive={up} width={56} height={22} />
                <div className="text-right w-[78px]">
                  <p className="text-sm font-mono tabular-nums">{mask(fmtUsd(a.value))}</p>
                  <p className={`text-[11px] font-mono ${up ? "text-shield" : "text-destructive"}`}>
                    {fmtPct(a.chg)}
                  </p>
                </div>
              </Link>
            );
          })}
          {!assets.length &&
            [0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 px-4 py-3.5 animate-pulse">
                <div className="h-full w-full bg-foreground/5 rounded-lg" />
              </div>
            ))}
        </div>
      </section>

      <section className="px-5 mt-6">
        <h2 className="text-sm font-semibold tracking-tight mb-3">Recent activity</h2>
        <div className="space-y-2">
          {activity.map((a) => (
            <button
              key={a.id}
              onClick={() => setOpenTx(a)}
              className="w-full text-left rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 active:bg-foreground/5 pressable"
            >
              <div
                className={`size-9 rounded-xl grid place-items-center ${a.shield ? "bg-shield/15 text-shield" : "bg-secondary text-muted-foreground"}`}
              >
                {a.shield ? <Shield className="size-4" /> : <Repeat className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{a.t}</p>
                <p className="text-[11px] text-muted-foreground">
                  {a.s} · {a.time}
                </p>
              </div>
              <p className="text-sm font-mono tabular-nums">{mask(a.v)}</p>
              <ChevronRight className="size-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </section>

      <DetailSheet
        open={!!openTx}
        onClose={() => setOpenTx(null)}
        title={openTx?.t}
      >
        {openTx && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-3xl font-display font-semibold tabular-nums">{openTx.v}</p>
              <p className="text-xs text-muted-foreground mt-1">{openTx.s}</p>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Network" v={openTx.network} />
              <Row l="Fee" v={openTx.fee} />
              <Row l="Hash" v={openTx.hash} mono />
              <Row l="Time" v={openTx.time + " ago"} />
              <Row l="Status" v="Confirmed · shielded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium pressable">
                Copy hash
              </button>
              <button className="rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold pressable">
                View on explorer
              </button>
            </div>
          </div>
        )}
      </DetailSheet>

      <WalletFlow open={!!flow} kind={flow} onClose={() => setFlow(null)} />
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
