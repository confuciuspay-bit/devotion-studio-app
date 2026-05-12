import React, { useState } from "react";
import { View } from "react-native";
import { PinPad } from "@/components/PinPad";
import { useApp, pinHash } from "@/lib/store";

interface Props {
  title?: string;
  subtitle?: string;
  onPass: () => void;
  onCancel?: () => void;
}

export function PinGate({ title = "Enter PIN", subtitle, onPass, onCancel }: Props) {
  const stored = useApp((s) => s.pinHashStored);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const submit = async (pin: string) => {
    if (!stored) {
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
      setError(next >= 5 ? "Too many attempts. Try again later." : "Wrong PIN");
    }
  };

  return (
    <View>
      <PinPad
        title={title}
        subtitle={error ?? subtitle}
        onSubmit={submit}
        onCancel={onCancel}
      />
    </View>
  );
}
