// Reusable bottom sheet (improved DetailSheet) with stepper support

import { useEffect } from "react";
import { X, ChevronLeft } from "lucide-react";

export function Sheet({
  open, onClose, title, onBack, children, padded = true,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  onBack?: () => void;
  children: React.ReactNode;
  padded?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[80] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl border-t border-x border-border bg-card shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        <div className="pt-2 pb-1 grid place-items-center">
          <div className="h-1 w-10 rounded-full bg-foreground/20" />
        </div>
        <div className="px-4 pt-1 pb-2 flex items-center gap-2">
          {onBack ? (
            <button onClick={onBack} className="size-8 grid place-items-center rounded-full bg-foreground/5 border border-border" aria-label="Back">
              <ChevronLeft className="size-4" />
            </button>
          ) : <div className="size-8" />}
          <h3 className="font-display font-semibold text-base flex-1 text-center">{title}</h3>
          <button onClick={onClose} className="size-8 grid place-items-center rounded-full bg-foreground/5 border border-border text-muted-foreground" aria-label="Close">
            <X className="size-4" />
          </button>
        </div>
        <div className={`${padded ? "px-5 pb-6" : ""} max-h-[80vh] overflow-y-auto overscroll-contain`}>
          {children}
        </div>
      </div>
    </div>
  );
}
