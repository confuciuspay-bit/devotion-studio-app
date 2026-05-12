import { Search, Loader2 } from "lucide-react";
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
    <div>
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-foreground/5 px-3 py-2 mb-3">
        <Search className="size-4 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search any of 14,000 coins…"
          className="bg-transparent outline-none text-sm flex-1 placeholder:text-muted-foreground"
        />
        {isFetching && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
      </div>
      <div className="rounded-2xl border border-border bg-card divide-y divide-border max-h-[55vh] overflow-y-auto">
        {list.map((c) => {
          const t = top?.find((x) => x.id === c.id);
          return (
            <button
              key={c.id}
              onClick={() => onPick({ ...c, price: t?.current_price ?? c.price })}
              className="w-full flex items-center gap-3 px-3 py-2.5 active:bg-foreground/5 text-left"
            >
              <CoinIcon src={c.image} symbol={c.symbol} size={32} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{c.name}</p>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
                  {c.symbol}
                </p>
              </div>
              {t && (
                <div className="text-right">
                  <p className="text-xs font-mono">{fmtUsd(t.current_price)}</p>
                  <p className={`text-[10px] font-mono ${(t.price_change_percentage_24h ?? 0) >= 0 ? "text-shield" : "text-destructive"}`}>
                    {fmtPct(t.price_change_percentage_24h)}
                  </p>
                </div>
              )}
            </button>
          );
        })}
        {!list.length && !isFetching && (
          <p className="text-center text-sm text-muted-foreground py-8">No matches</p>
        )}
      </div>
    </div>
  );
}
