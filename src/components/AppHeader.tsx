import { Eye, EyeOff, Bell, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { SUPPORTED_CURRENCIES } from "@/lib/markets";

export function AppHeader({ subtitle: _subtitle }: { subtitle?: string }) {
  const hidden = useApp((s) => s.hideBalances);
  const toggle = useApp((s) => s.toggleHideBalances);
  const ccy = useApp((s) => s.displayCurrency);
  const setCcy = useApp((s) => s.setDisplayCurrency);
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-50 px-5 pt-6 pb-3 flex items-center justify-between animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-foreground/95 grid place-items-center">
            <div className="size-3 rounded-full bg-background" />
          </div>
          <span className="font-display font-semibold tracking-tight text-lg">umbra</span>
        </div>
        <div className="mt-2 h-[11px]" aria-hidden />
      </div>
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 px-2.5 flex items-center gap-1 rounded-full bg-card border border-border text-xs font-mono text-muted-foreground active:scale-95 transition pressable"
            aria-label="Display currency"
          >
            {ccy}
            <ChevronDown className="size-3" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
              <div className="absolute right-0 mt-1 z-50 w-32 max-h-72 overflow-y-auto rounded-2xl border border-border bg-popover shadow-2xl animate-scale-in">
                {SUPPORTED_CURRENCIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCcy(c); setOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-foreground/5 ${c === ccy ? "text-primary" : ""}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <button
          onClick={toggle}
          className="size-9 grid place-items-center rounded-full bg-card border border-border text-muted-foreground active:scale-95 transition"
          aria-label="Toggle balance visibility"
        >
          {hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        <button className="size-9 grid place-items-center rounded-full bg-card border border-border text-muted-foreground relative">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
        </button>
      </div>
    </header>
  );
}
