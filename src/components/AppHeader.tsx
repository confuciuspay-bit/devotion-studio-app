import { Eye, EyeOff, Bell } from "lucide-react";
import { useState } from "react";

export function AppHeader({ subtitle }: { subtitle?: string }) {
  const [hidden, setHidden] = useState(false);
  return (
    <header className="px-5 pt-6 pb-3 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-foreground/95 grid place-items-center">
            <div className="size-3 rounded-full bg-background" />
          </div>
          <span className="font-display font-semibold tracking-tight text-lg">umbra</span>
        </div>
        {subtitle && (
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mt-2">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setHidden((v) => !v)}
          className="size-9 grid place-items-center rounded-full bg-card border border-border text-muted-foreground"
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
