import { CoinIcon } from "./CoinIcon";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/lib/chains";
import { useCoinChains } from "@/lib/coinChains";
import { Loader as Loader2 } from "lucide-react";

export function ChainPicker({
  coinId,
  filter,
  onPick,
}: {
  coinId?: string | null;
  filter?: (c: Chain) => boolean;
  onPick: (c: Chain) => void;
}) {
  const { data: coinChains, isFetching } = useCoinChains(coinId);

  let list: Chain[] = coinId ? coinChains ?? [] : CHAINS;
  if (filter) list = list.filter(filter);

  return (
    <div className="space-y-3">
      {coinId && (
        <p className="text-[11px] text-muted-foreground px-1">
          Networks where this asset exists
        </p>
      )}
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] max-h-[60vh] overflow-y-auto scrollbar-none">
        {isFetching && coinId && !list.length && (
          <div className="py-8 grid place-items-center text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
          </div>
        )}
        {!isFetching && coinId && !list.length && (
          <p className="text-center text-sm text-muted-foreground py-8 px-4">
            No supported networks for this asset.
          </p>
        )}
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="w-full text-left flex items-center gap-3 px-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition"
          >
            <CoinIcon src={c.logo} symbol={c.shortName} size={30} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{c.name}</p>
              <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
                {c.kind} · {c.shortName}
                {c.shielded ? " · shielded" : ""}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              ${c.fixedFeeUsd[0].toFixed(2)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
