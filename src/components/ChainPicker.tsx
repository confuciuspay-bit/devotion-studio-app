import { CoinIcon } from "./CoinIcon";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/lib/chains";
import { useCoinChains } from "@/lib/coinChains";

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
        <p className="label">networks where this asset exists</p>
      )}
      <div
        className="max-h-[55vh] overflow-y-auto scrollbar-none"
        style={{ borderTop: "1px solid var(--border-dim)" }}
      >
        {isFetching && coinId && !list.length && (
          <div className="py-8 text-center">
            <span className="animate-pulse text-[var(--accent)]">_</span>
          </div>
        )}
        {!isFetching && coinId && !list.length && (
          <div className="py-16 text-center">
            <p className="label">no supported networks for this asset</p>
          </div>
        )}
        {list.map((c) => (
          <button
            key={c.id}
            onClick={() => onPick(c)}
            className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
          >
            <CoinIcon src={c.logo} symbol={c.shortName} size={22} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[var(--text-primary)] truncate">{c.name}</p>
              <p className="text-[11px] font-light uppercase" style={{ color: "var(--text-secondary)" }}>
                {c.kind} · {c.shortName}{c.shielded ? " · shielded" : ""}
              </p>
            </div>
            <p className="text-[11px] font-light" style={{ color: "var(--text-secondary)" }}>
              ${c.fixedFeeUsd[0].toFixed(2)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}
