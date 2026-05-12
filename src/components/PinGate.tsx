import { useState } from "react";
import { PinPad } from "@/components/PinPad";
import { useApp, pinHash } from "@/lib/store";

interface Props {
  title?: string;
  subtitle?: string;
  onPass: () => void;
  onCancel?: () => void;
}

/**
 * PIN-gated reveal. Verifies entered PIN against the stored hash.
 * Shows a shake on failure and locks out after 5 wrong attempts.
 */
export function PinGate({ title = "Enter PIN", subtitle, onPass, onCancel }: Props) {
  const stored = useApp((s) => s.pinHashStored);
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = async (pin: string) => {
    if (!stored) {
      // No PIN configured — accept and let caller set one upstream.
      onPass();
      return;
    }
    const h = await pinHash(pin);
    if (h === stored) {
      setError(null);
      onPass();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setShake(true);
      setTimeout(() => setShake(false), 420);
      setError(next >= 5 ? "Too many attempts. Try again later." : "Wrong PIN");
    }
  };

  return (
    <div className={shake ? "animate-shake" : ""}>
      <PinPad
        title={title}
        subtitle={error ?? subtitle}
        onSubmit={submit}
        onCancel={onCancel}
      />
    </div>
  );
}
