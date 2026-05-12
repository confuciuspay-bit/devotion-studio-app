import { PinGate } from "@/components/PinGate";
import { useApp } from "@/lib/store";
import { Lock } from "lucide-react";

export function LockScreen() {
  const locked = useApp((s) => s.locked);
  const merchant = useApp((s) => s.merchant);
  const setLocked = useApp((s) => s.setLocked);

  if (!locked) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center px-6 animate-fade-in"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-10 gap-2">
          <Lock className="size-5" style={{ color: "var(--text-tertiary)" }} />
          <p className="text-[15px] font-medium" style={{ color: "var(--text-primary)", marginTop: 8 }}>
            {merchant?.businessName ?? "umbra"}
          </p>
          <p className="text-[12px] font-light" style={{ color: "var(--text-secondary)" }}>app locked</p>
        </div>
        <PinGate title="Enter PIN to unlock" onPass={() => setLocked(false)} />
      </div>
    </div>
  );
}
