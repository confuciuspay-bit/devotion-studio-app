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
    if (next.length === 4) setTimeout(() => onSubmit(next), 120);
  };

  return (
    <div className="text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      <div className="my-5 flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`size-3 rounded-full border ${pin.length > i ? "bg-primary border-primary" : "border-foreground/30"}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {["1","2","3","4","5","6","7","8","9"].map((k) => (
          <button key={k} onClick={() => press(k)} className="pressable rounded-2xl bg-foreground/5 border border-border py-4 text-xl font-display font-medium">
            {k}
          </button>
        ))}
        {onCancel ? (
          <button onClick={onCancel} className="rounded-2xl py-4 text-xs text-muted-foreground">Cancel</button>
        ) : <div />}
        <button onClick={() => press("0")} className="pressable rounded-2xl bg-foreground/5 border border-border py-4 text-xl font-display font-medium">0</button>
        <button onClick={() => press("<")} className="pressable rounded-2xl py-4 text-base text-muted-foreground">⌫</button>
      </div>
    </div>
  );
}
