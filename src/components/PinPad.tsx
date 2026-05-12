import { useState } from "react";

export function PinPad({
  title = "Enter PIN",
  subtitle,
  onSubmit,
  onCancel,
}: {
  title?: string;
  subtitle?: string;
  onSubmit: (pin: string) => void;
  onCancel?: () => void;
}) {
  const [pin, setPin] = useState("");

  const press = (k: string) => {
    if (k === "<") return setPin((p) => p.slice(0, -1));
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) setTimeout(() => { onSubmit(next); setPin(""); }, 100);
  };

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}

      {/* PIN dots */}
      <div className="my-6 flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`size-2.5 rounded-full transition-colors ${
              pin.length > i
                ? "bg-primary"
                : "bg-[rgba(255,255,255,0.15)]"
            }`}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9"].map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="pressable rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] py-4 text-lg font-medium text-foreground hover:bg-[rgba(255,255,255,0.08)] transition"
          >
            {k}
          </button>
        ))}
        {onCancel ? (
          <button
            onClick={onCancel}
            className="rounded-md py-4 text-xs text-muted-foreground hover:text-foreground transition pressable"
          >
            Cancel
          </button>
        ) : <div />}
        <button
          onClick={() => press("0")}
          className="pressable rounded-md bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] py-4 text-lg font-medium text-foreground hover:bg-[rgba(255,255,255,0.08)] transition"
        >
          0
        </button>
        <button
          onClick={() => press("<")}
          className="pressable rounded-md py-4 text-base text-muted-foreground hover:text-foreground transition"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
