// Currency-amount input with USD/token toggle & MAX
import { useState } from "react";

export function AmountInput({
  symbol,
  price,
  balance,
  onChange,
}: {
  symbol: string;
  price?: number;        // USD per token
  balance?: number;      // in token units
  onChange: (v: { token: number; usd: number }) => void;
}) {
  const [mode, setMode] = useState<"token" | "usd">("usd");
  const [v, setV] = useState("");

  const n = Number(v) || 0;
  const usd = mode === "usd" ? n : (price ? n * price : 0);
  const token = mode === "token" ? n : (price ? n / price : 0);
  const balanceUsd = balance != null && price ? balance * price : undefined;

  const update = (next: string) => {
    setV(next);
    const num = Number(next) || 0;
    onChange({
      token: mode === "token" ? num : (price ? num / price : 0),
      usd: mode === "usd" ? num : (price ? num * price : 0),
    });
  };

  const setMax = () => {
    if (balance == null) return;
    if (mode === "token") update(String(balance));
    else if (price) update((balance * price).toFixed(2));
  };

  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-5">
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-3xl font-mono font-semibold text-muted-foreground">
          {mode === "usd" ? "$" : ""}
        </span>
        <input
          autoFocus
          inputMode="decimal"
          value={v}
          onChange={(e) => update(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0"
          className="bg-transparent outline-none w-1/2 text-center text-5xl font-mono font-semibold tabular-nums placeholder:text-muted-foreground/40"
        />
        <span className="text-3xl font-mono font-semibold text-muted-foreground">
          {mode === "token" ? symbol : ""}
        </span>
      </div>
      <p className="text-center text-xs text-muted-foreground font-mono mt-2">
        ≈ {mode === "usd" ? `${token.toFixed(token < 1 ? 6 : 4)} ${symbol}` : `$${usd.toFixed(2)}`}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setMode((m) => (m === "usd" ? "token" : "usd"))}
          className="text-xs text-primary font-medium"
        >
          Switch to {mode === "usd" ? symbol : "USD"}
        </button>
        {balance != null && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>
              Bal: {balance.toFixed(balance < 1 ? 6 : 4)} {symbol}
              {balanceUsd ? ` · $${balanceUsd.toFixed(2)}` : ""}
            </span>
            <button onClick={setMax} className="px-2 py-0.5 rounded-md bg-primary/15 text-primary font-semibold">
              MAX
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
