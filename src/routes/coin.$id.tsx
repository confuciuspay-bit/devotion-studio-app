import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Star, ExternalLink, ArrowDownLeft, ArrowUpRight, Repeat } from "lucide-react";
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
    <div className="animate-fade-in">
      <header
        className="px-4 flex items-center justify-between"
        style={{ height: 48, borderBottom: "1px solid var(--border-dim)" }}
      >
        <Link
          to="/markets"
          className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-2">
          {coin && <CoinIcon src={coin.image.large} symbol={coin.symbol} size={20} />}
          <span className="text-[14px] font-medium text-[var(--text-primary)]">
            {coin?.name ?? <span className="animate-pulse text-[var(--accent)]">_</span>}
          </span>
        </div>
        <button className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <Star className="size-4" />
        </button>
      </header>

      {isLoading || !coin ? (
        <div className="flex items-center justify-center py-20">
          <span className="animate-pulse text-[var(--accent)] text-[18px]">_</span>
        </div>
      ) : (
        <>
          <section className="px-4 py-5" style={{ borderBottom: "1px solid var(--border-dim)" }}>
            <p className="label mb-2">{coin.symbol.toUpperCase()} · USD</p>
            <p
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: "var(--text-primary)",
                letterSpacing: "0.02em",
              }}
            >
              {fmtUsd(coin.market_data.current_price.usd)}
            </p>
            <p
              className="text-[12px] font-light mt-1"
              style={{ color: (coin.market_data.price_change_percentage_24h ?? 0) >= 0 ? "var(--status-ok)" : "var(--status-err)" }}
            >
              {fmtPct(coin.market_data.price_change_percentage_24h)} · 24h
            </p>
          </section>

          <section className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
            <div
              className="p-3"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: 4,
              }}
            >
              <Sparkline data={prices} width={500} height={140} positive={up} />
              <div className="mt-3 flex gap-1">
                {RANGES.map((r) => (
                  <button
                    key={r.d}
                    onClick={() => setDays(r.d)}
                    className="pressable flex-1 py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                    style={{
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: days === r.d ? "var(--accent)" : "transparent",
                      background: days === r.d ? "var(--accent-dim)" : "transparent",
                      color: days === r.d ? "var(--accent)" : "var(--text-secondary)",
                      fontWeight: days === r.d ? 400 : 300,
                    }}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="px-4 py-4 flex gap-2" style={{ borderBottom: "1px solid var(--border-dim)" }}>
            {[
              { l: "send", i: ArrowUpRight },
              { l: "receive", i: ArrowDownLeft },
              { l: "swap", i: Repeat },
            ].map((a) => (
              <button
                key={a.l}
                className="pressable flex-1 py-3 flex flex-col items-center gap-1.5 transition-colors"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 4,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-focus)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border-default)")}
              >
                <a.i className="size-3.5" style={{ color: "var(--accent)" }} />
                <span className="label" style={{ textTransform: "lowercase" }}>{a.l}</span>
              </button>
            ))}
          </section>

          <section className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
            <p className="label mb-3">stats</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-0">
              <Stat l="market cap" v={fmtUsd(coin.market_data.market_cap.usd, { maximumFractionDigits: 0 })} />
              <Stat l="volume 24h" v={fmtCompact(coin.market_data.total_volume.usd)} />
              <Stat l="high 24h" v={fmtUsd(coin.market_data.high_24h.usd)} />
              <Stat l="low 24h" v={fmtUsd(coin.market_data.low_24h.usd)} />
              <Stat l="supply" v={fmtCompact(coin.market_data.circulating_supply)} />
              <Stat l="ath" v={`${fmtUsd(coin.market_data.ath.usd)}`} />
              <Stat l="7d" v={fmtPct(coin.market_data.price_change_percentage_7d)} up={(coin.market_data.price_change_percentage_7d ?? 0) >= 0} />
              <Stat l="30d" v={fmtPct(coin.market_data.price_change_percentage_30d)} up={(coin.market_data.price_change_percentage_30d ?? 0) >= 0} />
            </div>
          </section>

          {coin.description.en && (
            <section className="px-4 py-4">
              <p className="label mb-2">about {coin.name.toLowerCase()}</p>
              <p
                className="text-[13px] font-light leading-relaxed line-clamp-6"
                style={{ color: "var(--text-secondary)" }}
                dangerouslySetInnerHTML={{ __html: coin.description.en }}
              />
              {coin.links.homepage[0] && (
                <a
                  href={coin.links.homepage[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pressable inline-flex items-center gap-1 mt-3 text-[12px] transition-colors hover:opacity-80"
                  style={{ color: "var(--accent)" }}
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

function Stat({ l, v, up }: { l: string; v: string; up?: boolean }) {
  return (
    <div className="py-2.5" style={{ borderBottom: "1px solid var(--border-dim)" }}>
      <p className="label">{l}</p>
      <p
        className="text-[13px] mt-0.5"
        style={{
          color: up === undefined ? "var(--text-primary)" : up ? "var(--status-ok)" : "var(--status-err)",
        }}
      >
        {v}
      </p>
    </div>
  );
}
