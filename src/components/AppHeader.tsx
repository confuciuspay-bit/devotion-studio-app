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
    <header className="px-5 pt-5 pb-3 flex items-center justify-between">
      {/* Wordmark */}
      <div className="flex items-center gap-2">
        <div className="size-6 rounded-md bg-primary grid place-items-center">
          <div className="size-2.5 rounded-full bg-white/90" />
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">umbra</span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Currency picker */}
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-7 px-2 flex items-center gap-1 rounded-md border border-[rgba(255,255,255,0.06)] bg-card text-[11px] font-mono text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.12)] transition pressable"
            aria-label="Display currency"
          >
            {ccy}
            <ChevronDown className="size-2.5" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-1 z-50 w-28 max-h-64 overflow-y-auto rounded-lg border border-[rgba(255,255,255,0.08)] bg-popover shadow-xl animate-scale-in scrollbar-none">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCcy(c); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono transition-colors hover:bg-white/5 ${c === ccy ? "text-primary" : "text-muted-foreground"}`}
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
          className="size-7 grid place-items-center rounded-md border border-[rgba(255,255,255,0.06)] bg-card text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.12)] transition pressable"
          aria-label="Toggle balance visibility"
        >
          {hidden ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>

        {/* Settings */}
        <Link
          to="/settings"
          className="size-7 grid place-items-center rounded-md border border-[rgba(255,255,255,0.06)] bg-card text-muted-foreground hover:text-foreground hover:border-[rgba(255,255,255,0.12)] transition pressable"
          aria-label="Settings"
        >
          <Settings className="size-3.5" />
        </Link>
      </div>
    </header>
  );
}
