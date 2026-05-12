import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Star, ExternalLink, Loader as Loader2, ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
import { useCoin, useCoinChart, fmtUsd, fmtPct, fmtCompact } from "@/lib/markets";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";

export const Route = createFileRoute("/coin/$id")({
  component: CoinDetail,
});

const RANGES = [
  { d: 1, l: "1D" },
  { d: 7, l: "1W" },
  { d: 30, l: "1M" },
  { d: 90, l: "3M" },
  { d: 365, l: "1Y" },
];

function CoinDetail() {
  const { id } = Route.useParams();
  const { data: coin, isLoading } = useCoin(id);
  const [days, setDays] = useState(7);
  const { data: chart } = useCoinChart(id, days);

  const prices = chart?.prices.map((p) => p[1]) ?? [];
  const up = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;

  return (
    <div>
      <header className="px-5 pt-6 pb-2 flex items-center justify-between">
        <Link
          to="/markets"
          className="size-8 grid place-items-center rounded-md bg-card border border-[rgba(255,255,255,0.06)]"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          {coin && <CoinIcon src={coin.image.large} symbol={coin.symbol} size={24} />}
          <span className="font-sans font-medium">
            {coin?.name ?? "Loading…"}
          </span>
        </div>
        <button className="size-8 grid place-items-center rounded-md bg-card border border-[rgba(255,255,255,0.06)] text-muted-foreground">
          <Star className="size-4" />
        </button>
      </header>

      {isLoading || !coin ? (
        <div className="grid place-items-center py-20 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : (
        <>
          <section className="px-5 mt-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {coin.symbol.toUpperCase()} · USD
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h1 className="text-4xl font-mono font-semibold tabular-nums">
                {fmtUsd(coin.market_data.current_price.usd)}
              </h1>
            </div>
            <p
              className={`text-xs font-mono mt-1 ${(coin.market_data.price_change_percentage_24h ?? 0) >= 0 ? "text-success" : "text-destructive"}`}
            >
              {fmtPct(coin.market_data.price_change_percentage_24h)} · 24h
            </p>
          </section>

          <section className="px-5 mt-4">
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card p-3 relative overflow-hidden">
              <Sparkline data={prices} width={500} height={160} positive={up} />
              <div className="mt-3 flex gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r.d}
                    onClick={() => setDays(r.d)}
                    className={`flex-1 py-1.5 rounded-md text-[11px] font-medium transition ${
                      days === r.d
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="px-5 mt-5 grid grid-cols-3 gap-2">
            {[
              { l: "Send", i: ArrowUpRight },
              { l: "Receive", i: ArrowDownLeft },
              { l: "Swap", i: Repeat },
            ].map((a) => (
              <button
                key={a.l}
                className="rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-3 flex flex-col items-center gap-1 pressable hover:bg-[rgba(255,255,255,0.06)] transition"
              >
                <a.i className="size-4 text-primary" />
                <span className="text-[11px] font-medium">{a.l}</span>
              </button>
            ))}
          </section>

          <section className="px-5 mt-5">
            <h2 className="text-sm font-semibold mb-3">Stats</h2>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card p-4 grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
              <Stat l="Market cap" v={fmtUsd(coin.market_data.market_cap.usd, { maximumFractionDigits: 0 })} />
              <Stat l="Volume 24h" v={fmtCompact(coin.market_data.total_volume.usd)} />
              <Stat l="High 24h" v={fmtUsd(coin.market_data.high_24h.usd)} />
              <Stat l="Low 24h" v={fmtUsd(coin.market_data.low_24h.usd)} />
              <Stat l="Supply" v={fmtCompact(coin.market_data.circulating_supply)} />
              <Stat l="ATH" v={`${fmtUsd(coin.market_data.ath.usd)} · ${fmtPct(coin.market_data.ath_change_percentage.usd)}`} />
              <Stat l="7d" v={fmtPct(coin.market_data.price_change_percentage_7d)} />
              <Stat l="30d" v={fmtPct(coin.market_data.price_change_percentage_30d)} />
            </div>
          </section>

          {coin.description.en && (
            <section className="px-5 mt-5">
              <h2 className="text-sm font-semibold mb-2">About {coin.name}</h2>
              <p
                className="text-sm text-muted-foreground leading-relaxed line-clamp-6"
                dangerouslySetInnerHTML={{ __html: coin.description.en }}
              />
              {coin.links.homepage[0] && (
                <a
                  href={coin.links.homepage[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-3 text-xs text-primary"
                >
                  {new URL(coin.links.homepage[0]).hostname} <ExternalLink className="size-3" />
                </a>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
      <p className="text-sm font-mono tabular-nums mt-0.5">{v}</p>
    </div>
  );
}
