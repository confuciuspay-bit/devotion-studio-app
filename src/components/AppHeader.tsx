import { Eye, EyeOff, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { SUPPORTED_CURRENCIES } from "@/lib/markets";

export function AppHeader({ subtitle: _subtitle }: { subtitle?: string }) {
  const hidden = useApp((s) => s.hideBalances);
  const toggle = useApp((s) => s.toggleHideBalances);
  const ccy = useApp((s) => s.displayCurrency);
  const setCcy = useApp((s) => s.setDisplayCurrency);
  const [open, setOpen] = useState(false);

  return (
    <header
      className="px-4 flex items-center justify-between"
      style={{ height: 48, borderBottom: "1px solid var(--border-dim)" }}
    >
      {/* Wordmark — text only */}
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 400,
          fontSize: 15,
          color: "var(--text-primary)",
          letterSpacing: "0.02em",
        }}
      >
        umbra
      </span>

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Currency picker */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="pressable flex items-center gap-1 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            style={{ letterSpacing: "0.02em" }}
            aria-label="Display currency"
          >
            {ccy}
            <ChevronDown className="size-3" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div
                className="absolute right-0 mt-2 z-50 w-28 max-h-64 overflow-y-auto animate-scale-in scrollbar-none"
                style={{
                  background: "var(--bg-overlay)",
                  border: "1px solid var(--border-default)",
                  borderRadius: 4,
                }}
              >
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCcy(c); setOpen(false); }}
                    className="pressable w-full text-left px-3 py-2 text-[12px] transition-colors hover:bg-[rgba(255,255,255,0.03)]"
                    style={{
                      color: c === ccy ? "var(--accent)" : "var(--text-secondary)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Balance toggle */}
        <button
          onClick={toggle}
          className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Toggle balance visibility"
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          aria-label="Settings"
        >
          <Settings className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}
