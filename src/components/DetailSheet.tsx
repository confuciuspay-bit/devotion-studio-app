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
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-200 ${open ? "opacity-100" : "opacity-0"}`}
      />

      {/* Panel */}
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-md rounded-t-lg border-t border-x border-[rgba(255,255,255,0.06)] bg-card transition-transform duration-200 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 96px)" }}
      >
        {/* Handle */}
        <div className="pt-3 pb-1 grid place-items-center">
          <div className="h-[3px] w-8 rounded-full bg-[rgba(255,255,255,0.12)]" />
        </div>

        {/* Header */}
        <div className="px-5 pt-1 pb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="size-7 grid place-items-center rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div className="px-5 pb-6 max-h-[75vh] overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
