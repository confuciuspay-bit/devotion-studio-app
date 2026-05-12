import { PinGate } from "@/components/PinGate";
import { useApp } from "@/lib/store";
import { Lock } from "lucide-react";

/**
 * Full-screen lock overlay shown when `useApp.locked === true`.
 * Unlocked by entering the merchant PIN.
 */
export function LockScreen() {
  const locked = useApp((s) => s.locked);
  const merchant = useApp((s) => s.merchant);
  const setLocked = useApp((s) => s.setLocked);

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl grid place-items-center px-6 animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="size-14 rounded-2xl bg-foreground/5 border border-border grid place-items-center">
            <Lock className="size-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">App locked</p>
          <h2 className="text-lg font-display font-semibold">{merchant?.businessName ?? "Umbra"}</h2>
        </div>
        <PinGate title="Enter PIN to unlock" onPass={() => setLocked(false)} />
      </div>
    </div>
  );
}
