import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { CoinIcon } from "@/components/CoinIcon";
import { Sparkline } from "@/components/Sparkline";
import { useMarkets, fmtPct, fmtCompact, DEFAULT_IDS } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { Search, Star, TrendingUp, Loader as Loader2 } from "lucide-react";

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

  const featured = (data ?? []).filter((c) => ["zcash", "bitcoin", "ethereum"].includes(c.id));

  return (
    <div className="animate-fade-in">
      <AppHeader subtitle="Markets" />

      {/* Featured cards */}
      <section className="px-5">
        <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 snap-x snap-mandatory scrollbar-none">
          {featured.map((c) => {
            const up = (c.price_change_percentage_24h ?? 0) >= 0;
            return (
              <Link
                key={c.id}
                to="/coin/$id"
                params={{ id: c.id }}
                className="snap-start shrink-0 w-[76%] rounded-lg border border-[rgba(255,255,255,0.06)] bg-card p-5 pressable transition"
              >
                <div className="flex items-center gap-3">
                  <CoinIcon src={c.image} symbol={c.symbol} size={38} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {c.symbol}
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                      up
                        ? "bg-[rgba(16,185,129,0.12)] text-success"
                        : "bg-[rgba(239,68,68,0.12)] text-destructive"
                    }`}
                  >
                    {fmtPct(c.price_change_percentage_24h)}
                  </span>
                </div>
                <p className="mt-4 text-2xl font-mono font-semibold tabular-nums text-foreground">
                  {fmt(c.current_price)}
                </p>
                <div className="mt-2">
                  <Sparkline data={c.sparkline_in_7d?.price ?? []} width={240} height={44} positive={up} />
                </div>
              </Link>
            );
          })}
          {isLoading &&
            [0, 1, 2].map((i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-[76%] h-40 rounded-lg border border-[rgba(255,255,255,0.06)] bg-card animate-pulse"
              />
            ))}
        </div>
      </section>

      {/* Search */}
      <section className="px-5 mt-4">
        <div className="flex items-center gap-2 rounded-md border border-[rgba(255,255,255,0.06)] bg-card px-3 py-2">
          <Search className="size-3.5 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search coins…"
            className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground text-foreground"
          />
        </div>

        {/* Tab pills */}
        <div className="mt-3 flex gap-1.5">
          {(["all", "watch", "gainers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium border transition pressable ${
                tab === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-[rgba(255,255,255,0.06)] hover:text-foreground"
              }`}
            >
              {t === "all" ? "All" : t === "watch" ? `Watchlist (${watch.length})` : "Top movers"}
            </button>
          ))}
        </div>
      </section>

      {/* List */}
      <section className="px-5 mt-3">
        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive mb-3">
            Couldn't load market data.
          </div>
        )}
        {isLoading && !data && (
          <div className="grid place-items-center py-12 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden">
          {list.map((c) => {
            const up = (c.price_change_percentage_24h ?? 0) >= 0;
            const starred = watch.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 px-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition">
                <button
                  onClick={(e) => { e.preventDefault(); toggleWatch(c.id); }}
                  className="p-1 -ml-1 transition pressable"
                  aria-label="Toggle watchlist"
                >
                  <Star
                    className={`size-3.5 ${starred ? "fill-primary text-primary" : "text-muted-foreground"}`}
                  />
                </button>
                <Link
                  to="/coin/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <CoinIcon src={c.image} symbol={c.symbol} size={34} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {c.symbol.toUpperCase()} · {fmtCompact(c.market_cap)}
                    </p>
                  </div>
                  <Sparkline data={c.sparkline_in_7d?.price ?? []} positive={up} />
                  <div className="text-right w-[70px]">
                    <p className="text-sm font-mono tabular-nums text-foreground">{fmt(c.current_price)}</p>
                    <p className={`text-[11px] font-mono ${up ? "text-success" : "text-destructive"}`}>
                      {fmtPct(c.price_change_percentage_24h)}
                    </p>
                  </div>
                </Link>
              </div>
            );
          })}
          {!isLoading && list.length === 0 && (
            <div className="py-10 text-center text-sm text-muted-foreground">
              <TrendingUp className="size-4 mx-auto mb-2 opacity-40" />
              {tab === "watch" ? "Tap the star to add coins to your watchlist." : "No matches."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
