import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { useMarkets, fmtPct, fmtCompact, DEFAULT_IDS } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { Search, Star } from "lucide-react";

export const Route = createFileRoute("/markets")({
  component: MarketsPage,
  head: () => ({ meta: [{ title: "Markets — Umbra" }] }),
});

const WATCH_KEY = "umbra:watchlist";

function getWatch(): string[] {
  if (typeof window === "undefined") return ["zcash", "bitcoin", "ethereum"];
  try {
    return JSON.parse(localStorage.getItem(WATCH_KEY) || "") ?? ["zcash", "bitcoin", "ethereum"];
  } catch {
    return ["zcash", "bitcoin", "ethereum"];
  }
}

function MarketsPage() {
  const { data, isLoading, error } = useMarkets(DEFAULT_IDS);
  const { fmt } = useMoney();
  const [tab, setTab] = useState<"all" | "watch" | "gainers">("all");
  const [q, setQ] = useState("");
  const [watch, setWatch] = useState<string[]>(getWatch);

  const toggleWatch = (id: string) => {
    setWatch((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem(WATCH_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  let list = data ?? [];
  if (tab === "watch") list = list.filter((c) => watch.includes(c.id));
  if (tab === "gainers")
    list = [...list].sort(
      (a, b) => (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
    );
  if (q) {
    const Q = q.toLowerCase();
    list = list.filter(
      (c) => c.name.toLowerCase().includes(Q) || c.symbol.toLowerCase().includes(Q),
    );
  }

  return (
    <div className="animate-fade-in">
      <AppHeader subtitle="Markets" />

      {/* Search */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <div
          className="flex items-center gap-2 px-3"
          style={{
            background: "var(--bg-base)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            height: 36,
          }}
        >
          <Search className="size-3.5 shrink-0" style={{ color: "var(--text-tertiary)" }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search coins"
            className="bg-transparent outline-none flex-1 text-[13px]"
            style={{
              border: "none",
              height: "auto",
              padding: 0,
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Tab pills */}
        <div className="mt-3 flex gap-2">
          {(["all", "watch", "gainers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pressable px-3 py-1 text-[11px] uppercase tracking-widest transition-colors"
              style={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: tab === t ? "var(--accent)" : "var(--border-default)",
                background: tab === t ? "var(--accent-dim)" : "transparent",
                color: tab === t ? "var(--accent)" : "var(--text-secondary)",
                fontWeight: 300,
              }}
            >
              {t === "all" ? "all" : t === "watch" ? `watchlist (${watch.length})` : "top movers"}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div
        className="px-4 flex items-center"
        style={{ height: 36, borderBottom: "1px solid var(--border-dim)" }}
      >
        <div className="w-6" />
        <div className="w-6 mr-3" />
        <div className="flex-1">
          <span className="label">asset</span>
        </div>
        <div className="w-16 text-right mr-3">
          <span className="label">7d</span>
        </div>
        <div className="w-[72px] text-right">
          <span className="label">price</span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-3 text-[12px]" style={{ color: "var(--status-err)" }}>
          <span className="dot dot-err mr-1.5" />
          could not load market data
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && !data && (
        <div className="px-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 py-3"
              style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
            >
              <div className="size-6 rounded-full bg-[rgba(255,255,255,0.04)] animate-pulse" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 w-16 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
                <div className="h-2 w-10 bg-[rgba(255,255,255,0.03)] rounded animate-pulse" />
              </div>
              <div className="h-2.5 w-12 bg-[rgba(255,255,255,0.04)] rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* List */}
      <div className="px-4">
        {list.map((c) => {
          const up = (c.price_change_percentage_24h ?? 0) >= 0;
          const starred = watch.includes(c.id);
          return (
            <div
              key={c.id}
              className="flex items-center gap-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
              style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
            >
              <button
                onClick={(e) => { e.preventDefault(); toggleWatch(c.id); }}
                className="pressable w-6 flex items-center justify-center transition-colors"
                aria-label="Toggle watchlist"
              >
                <Star
                  className="size-3"
                  style={{
                    fill: starred ? "var(--accent)" : "none",
                    stroke: starred ? "var(--accent)" : "var(--text-tertiary)",
                  }}
                />
              </button>
              <Link
                to="/coin/$id"
                params={{ id: c.id }}
                className="flex items-center gap-3 flex-1 min-w-0"
                style={{ height: "100%" }}
              >
                <CoinIcon src={c.image} symbol={c.symbol} size={24} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-[var(--text-primary)]">{c.name}</p>
                  <p className="text-[11px] text-[var(--text-secondary)] font-light">
                    {c.symbol.toUpperCase()} · {fmtCompact(c.market_cap)}
                  </p>
                </div>
                <Sparkline data={c.sparkline_in_7d?.price ?? []} positive={up} width={48} height={18} />
                <div className="text-right w-[72px]">
                  <p className="text-[13px] text-[var(--text-primary)]">{fmt(c.current_price)}</p>
                  <p
                    className="text-[11px] font-light"
                    style={{ color: up ? "var(--status-ok)" : "var(--status-err)" }}
                  >
                    {fmtPct(c.price_change_percentage_24h)}
                  </p>
                </div>
              </Link>
            </div>
          );
        })}
        {!isLoading && list.length === 0 && (
          <div className="py-16 text-center">
            <p className="label">
              {tab === "watch" ? "star a coin to add to watchlist" : "no matches"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
