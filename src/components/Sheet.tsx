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
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 transition-opacity duration-150 ${open ? "opacity-100" : "opacity-0"}`}
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(2px)" }}
      />

      {/* Panel */}
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-md transition-transform duration-200 ease-out ${open ? "translate-y-0" : "translate-y-full"}`}
        style={{
          background: "var(--bg-surface)",
          borderTop: "1px solid var(--border-default)",
          borderLeft: "1px solid var(--border-default)",
          borderRight: "1px solid var(--border-default)",
          borderRadius: "4px 4px 0 0",
          paddingBottom: "calc(env(safe-area-inset-bottom) + 88px)",
        }}
      >
        {/* Handle */}
        <div className="pt-3 pb-1 grid place-items-center">
          <div
            style={{
              height: 2,
              width: 32,
              borderRadius: 1,
              background: "var(--text-tertiary)",
            }}
          />
        </div>

        {/* Header */}
        <div
          className="px-4 pt-2 pb-3 flex items-center gap-2"
          style={{ borderBottom: "1px solid var(--border-dim)" }}
        >
          {onBack ? (
            <button
              onClick={onBack}
              className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Back"
            >
              <ChevronLeft className="size-4" />
            </button>
          ) : <div className="w-4" />}
          <h3
            className="flex-1 text-center text-[13px] font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Close"
          >
            <X className="size-3.5" />
          </button>
        </div>

        <div
          className={`${padded ? "px-4 pb-6 pt-4" : ""} max-h-[80vh] overflow-y-auto overscroll-contain scrollbar-none`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
