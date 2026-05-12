import { Search, Loader as Loader2 } from "lucide-react";
import { useState } from "react";
import { CoinIcon } from "./CoinIcon";
import { useCoinSearch, useTopMarkets, fmtUsd, fmtPct } from "@/lib/markets";

export interface PickedCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  price?: number;
}

export function CoinPicker({ onPick }: { onPick: (c: PickedCoin) => void }) {
  const [q, setQ] = useState("");
  const { data: top } = useTopMarkets(1, 50);
  const { data: search, isFetching } = useCoinSearch(q);

  const list: PickedCoin[] = q.trim().length
    ? (search ?? []).slice(0, 30).map((s) => ({
        id: s.id, symbol: s.symbol, name: s.name, image: s.large,
      }))
    : (top ?? []).map((c) => ({
        id: c.id, symbol: c.symbol.toUpperCase(), name: c.name, image: c.image, price: c.current_price,
      }));

  return (
    <div className="space-y-3">
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
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search"
          style={{ border: "none", height: "auto", padding: 0, background: "transparent", outline: "none" }}
          className="flex-1 text-[13px]"
        />
        {isFetching && (
          <span className="animate-pulse text-[10px]" style={{ color: "var(--accent)" }}>_</span>
        )}
      </div>
      <div
        className="max-h-[55vh] overflow-y-auto scrollbar-none"
        style={{ borderTop: "1px solid var(--border-dim)" }}
      >
        {list.map((c) => {
          const t = top?.find((x) => x.id === c.id);
          return (
            <button
              key={c.id}
              onClick={() => onPick({ ...c, price: t?.current_price ?? c.price })}
              className="pressable w-full flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors text-left"
              style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
            >
              <CoinIcon src={c.image} symbol={c.symbol} size={22} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[var(--text-primary)] truncate">{c.name}</p>
                <p className="text-[11px] font-light uppercase" style={{ color: "var(--text-secondary)" }}>
                  {c.symbol}
                </p>
              </div>
              {t && (
                <div className="text-right">
                  <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{fmtUsd(t.current_price)}</p>
                  <p
                    className="text-[11px] font-light"
                    style={{ color: (t.price_change_percentage_24h ?? 0) >= 0 ? "var(--status-ok)" : "var(--status-err)" }}
                  >
                    {fmtPct(t.price_change_percentage_24h)}
                  </p>
                </div>
              )}
            </button>
          );
        })}
        {!list.length && !isFetching && (
          <div className="py-16 text-center">
            <p className="label">no matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
