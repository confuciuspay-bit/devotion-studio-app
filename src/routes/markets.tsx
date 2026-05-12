import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { useMarkets, fmtUsd, fmtPct, fmtCompact, DEFAULT_IDS } from "@/lib/markets";
import { Search, Star, TrendingUp, Loader2 } from "lucide-react";

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
  const [tab, setTab] = useState<"all" | "watch" | "gainers">("all");
  const [q, setQ] = useState("");
  const [watch, setWatch] = useState<string[]>(getWatch);

  const toggleWatch = (id: string) => {
    setWatch((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(WATCH_KEY, JSON.stringify(next));
      } catch {}
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

  const featured = (data ?? []).filter((c) => ["zcash", "bitcoin", "ethereum"].includes(c.id));

  return (
    <div>
      <AppHeader subtitle="Markets" />

      {/* Featured carousel */}
      <section className="px-5">
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x snap-mandatory scrollbar-none">
          {featured.map((c) => {
            const up = (c.price_change_percentage_24h ?? 0) >= 0;
            return (
              <Link
                key={c.id}
                to="/coin/$id"
                params={{ id: c.id }}
                className="snap-start shrink-0 w-[78%] rounded-3xl border border-border bg-[image:var(--gradient-card)] p-5 grain relative overflow-hidden active:scale-[0.99] transition-transform"
              >
                <div className="flex items-center gap-3">
                  <CoinIcon src={c.image} symbol={c.symbol} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.name}</p>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {c.symbol}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${up ? "bg-shield/15 text-shield" : "bg-destructive/15 text-destructive"}`}
                  >
                    {fmtPct(c.price_change_percentage_24h)}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-display font-semibold tabular-nums">
                  {fmtUsd(c.current_price)}
                </p>
                <div className="mt-2">
                  <Sparkline data={c.sparkline_in_7d?.price ?? []} width={260} height={48} positive={up} />
                </div>
              </Link>
            );
          })}
          {isLoading &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[78%] h-44 rounded-3xl border border-border bg-card animate-pulse"
              />
            ))}
        </div>
      </section>

      {/* Search */}
      <section className="px-5 mt-3">
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search coins, symbols…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
          />
        </div>

        <div className="mt-3 flex gap-1.5">
          {(["all", "watch", "gainers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border"
              }`}
            >
              {t === "all" ? "All" : t === "watch" ? `Watchlist · ${watch.length}` : "Top movers"}
            </button>
          ))}
        </div>
      </section>

      {/* List */}
      <section className="px-5 mt-3">
        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load market data. Pull down to retry.
          </div>
        )}
        {isLoading && !data && (
          <div className="grid place-items-center py-12 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}
        <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
          {list.map((c) => {
            const up = (c.price_change_percentage_24h ?? 0) >= 0;
            const starred = watch.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 px-3 py-3 active:bg-foreground/5">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    toggleWatch(c.id);
                  }}
                  className="p-1 -m-1"
                  aria-label="Toggle watchlist"
                >
                  <Star
                    className={`size-4 ${starred ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                </button>
                <Link
                  to="/coin/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <CoinIcon src={c.image} symbol={c.symbol} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {c.symbol.toUpperCase()} · MC {fmtCompact(c.market_cap)}
                    </p>
                  </div>
                  <Sparkline data={c.sparkline_in_7d?.price ?? []} positive={up} />
                  <div className="text-right w-[72px]">
                    <p className="text-sm font-mono tabular-nums">{fmtUsd(c.current_price)}</p>
                    <p
                      className={`text-[11px] font-mono ${up ? "text-shield" : "text-destructive"}`}
                    >
                      {fmtPct(c.price_change_percentage_24h)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
          {!isLoading && list.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <TrendingUp className="size-5 mx-auto mb-2 opacity-50" />
              {tab === "watch" ? "Tap the star to add coins to your watchlist." : "No matches."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
