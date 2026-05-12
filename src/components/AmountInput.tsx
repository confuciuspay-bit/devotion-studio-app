import { useState } from "react";

export function AmountInput({
  symbol,
  price,
  balance,
  onChange,
}: {
  symbol: string;
  price?: number;
  balance?: number;
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
    <div
      className="p-4"
      style={{
        background: "var(--bg-raised)",
        border: "1px solid var(--border-default)",
        borderRadius: 4,
      }}
    >
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[22px]" style={{ color: "var(--text-secondary)" }}>
          {mode === "usd" ? "$" : ""}
        </span>
        <input
          autoFocus
          inputMode="decimal"
          value={v}
          onChange={(e) => update(e.target.value.replace(/[^\d.]/g, ""))}
          placeholder="0"
          className="bg-transparent w-1/2 text-center"
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: "var(--text-primary)",
            outline: "none",
            border: "none",
            height: "auto",
            padding: 0,
            letterSpacing: "-0.01em",
          }}
        />
        <span className="text-[22px]" style={{ color: "var(--text-secondary)" }}>
          {mode === "token" ? symbol : ""}
        </span>
      </div>
      <p className="text-center text-[11px] font-light mt-2" style={{ color: "var(--text-secondary)" }}>
        ≈ {mode === "usd" ? `${token.toFixed(token < 1 ? 6 : 4)} ${symbol}` : `$${usd.toFixed(2)}`}
      </p>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setMode((m) => (m === "usd" ? "token" : "usd"))}
          className="pressable text-[12px] transition-colors hover:opacity-80"
          style={{ color: "var(--accent)" }}
        >
          switch to {mode === "usd" ? symbol : "USD"}
        </button>
        {balance != null && (
          <div className="flex items-center gap-2 text-[11px] font-light" style={{ color: "var(--text-secondary)" }}>
            <span>
              bal: {balance.toFixed(balance < 1 ? 6 : 4)} {symbol}
              {balanceUsd ? ` · $${balanceUsd.toFixed(2)}` : ""}
            </span>
            <button
              onClick={setMax}
              className="pressable px-1.5 py-0.5 text-[11px] uppercase tracking-widest transition-colors"
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent)",
                borderRadius: 4,
                color: "var(--accent)",
              }}
            >
              max
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
