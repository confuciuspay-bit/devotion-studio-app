import { Eye, EyeOff, Bell } from "lucide-react";
import { useApp } from "@/lib/store";

// `subtitle` is accepted but no longer rendered — we keep an empty margin instead.
export function AppHeader({ subtitle: _subtitle }: { subtitle?: string }) {
  const hidden = useApp((s) => s.hideBalances);
  const toggle = useApp((s) => s.toggleHideBalances);
  return (
    <header className="px-5 pt-6 pb-3 flex items-center justify-between">
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
