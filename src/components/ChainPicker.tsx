import { CoinIcon } from "./CoinIcon";
import { CHAINS } from "@/lib/chains";
import type { Chain } from "@/lib/chains";

export function ChainPicker({
  filter,
  onPick,
}: {
  filter?: (c: Chain) => boolean;
  onPick: (c: Chain) => void;
}) {
  const list = filter ? CHAINS.filter(filter) : CHAINS;
  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border max-h-[60vh] overflow-y-auto">
      {list.map((c) => (
        <button
          key={c.id}
          onClick={() => onPick(c)}
          className="w-full text-left flex items-center gap-3 px-3 py-3 active:bg-foreground/5"
        >
          <CoinIcon src={c.logo} symbol={c.shortName} size={30} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.name}</p>
            <p className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
              {c.kind} · {c.shortName}{c.shielded ? " · shielded" : ""}
            </p>
          </div>
          <p className="text-[10px] text-muted-foreground font-mono">
            ${c.fixedFeeUsd[0].toFixed(2)}
          </p>
        </button>
      ))}
    </div>
  );
}
