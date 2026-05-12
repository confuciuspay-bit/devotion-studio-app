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
      <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{title}</p>
      {subtitle && (
        <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>{subtitle}</p>
      )}

      {/* PIN dots */}
      <div className="my-6 flex justify-center gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="transition-colors"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: pin.length > i ? "var(--accent)" : "var(--text-tertiary)",
            }}
          />
        ))}
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9"].map((k) => (
          <button
            key={k}
            onClick={() => press(k)}
            className="pressable py-4 text-[18px] font-light transition-colors hover:bg-[rgba(255,255,255,0.03)]"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: 4,
              color: "var(--text-primary)",
            }}
          >
            {k}
          </button>
        ))}
        {onCancel ? (
          <button
            onClick={onCancel}
            className="pressable py-4 text-[11px] uppercase tracking-widest transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            cancel
          </button>
        ) : <div />}
        <button
          onClick={() => press("0")}
          className="pressable py-4 text-[18px] font-light transition-colors hover:bg-[rgba(255,255,255,0.03)]"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: 4,
            color: "var(--text-primary)",
          }}
        >
          0
        </button>
        <button
          onClick={() => press("<")}
          className="pressable py-4 text-[16px] transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
