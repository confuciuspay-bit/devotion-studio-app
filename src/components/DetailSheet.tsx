import { useEffect } from "react";
import { X } from "lucide-react";

export function DetailSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
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
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-3xl border-t border-x border-border bg-card shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        <div className="pt-2 pb-1 grid place-items-center">
          <div className="h-1 w-10 rounded-full bg-foreground/20" />
        </div>
        <div className="px-5 pt-2 pb-2 flex items-center justify-between">
          <h3 className="font-display font-semibold text-base">{title}</h3>
          <button
            onClick={onClose}
            className="size-8 grid place-items-center rounded-full bg-foreground/5 border border-border text-muted-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 pb-6 max-h-[75vh] overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}
