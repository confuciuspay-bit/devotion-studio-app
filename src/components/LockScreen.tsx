import { PinGate } from "@/components/PinGate";
import { useApp } from "@/lib/store";
import { Lock } from "lucide-react";

export function LockScreen() {
  const locked = useApp((s) => s.locked);
  const merchant = useApp((s) => s.merchant);
  const setLocked = useApp((s) => s.setLocked);

  if (!locked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background grid place-items-center px-6 animate-fade-in">
      <div className="w-full max-w-xs">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="size-12 rounded-lg bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.06)] grid place-items-center">
            <Lock className="size-5 text-primary" />
          </div>
          <p className="text-base font-medium text-foreground mt-1">
            {merchant?.businessName ?? "Umbra"}
          </p>
          <p className="text-xs text-muted-foreground">App locked</p>
        </div>
        <PinGate title="Enter PIN to unlock" onPass={() => setLocked(false)} />
      </div>
    </div>
  );
}
