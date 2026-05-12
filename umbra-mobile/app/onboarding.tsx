import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useApp, pinHash } from "@/lib/store";
import { PinPad } from "@/components/PinPad";
import { generateMnemonic, mnemonicToSeedSync } from "@/lib/bip39";
import { ChevronRight, Eye, EyeOff, Shield, Check, Sparkles, ArrowLeft } from "lucide-react-native";
import { toast } from "@/lib/toast";

type Step = "welcome" | "seed" | "confirm" | "pin" | "merchant" | "done";

const BRAND_PRESETS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Amber",   value: "#f59e0b" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Cyan",    value: "#06b6d4" },
  { name: "Slate",   value: "#64748b" },
  { name: "Blue",    value: "#3b82f6" },
];

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["welcome", "seed", "confirm", "pin", "merchant"];
  const idx = order.indexOf(step);
  return (
    <View className="flex-row gap-1.5">
      {order.map((s, i) => (
        <View
          key={s}
          className={`h-1 rounded-full ${i <= idx ? "bg-primary" : "bg-white/15"}`}
          style={{ width: i <= idx ? 24 : 12 }}
        />
      ))}
    </View>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const initialised = useApp((s) => s.initialised);
  const init = useApp((s) => s.init);
  const setMerchant = useApp((s) => s.setMerchant);
  const setPinHashStored = useApp((s) => s.setPinHashStored);

  useEffect(() => {
    if (initialised) router.replace("/");
  }, [initialised]);

  const [step, setStep] = useState<Step>("welcome");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [confirmIdxs, setConfirmIdxs] = useState<number[]>([]);
  const [confirmInputs, setConfirmInputs] = useState<string[]>(["", "", ""]);
  const [pin1, setPin1] = useState<string | null>(null);
  const [biz, setBiz] = useState("");
  const [brandColor, setBrandColor] = useState(BRAND_PRESETS[0].value);

  function generate() {
    const m = generateMnemonic();
    setMnemonic(m);
    setStep("seed");
  }

  function startConfirm() {
    const set = new Set<number>();
    while (set.size < 3) set.add(Math.floor(Math.random() * 12));
    setConfirmIdxs([...set].sort((a, b) => a - b));
    setConfirmInputs(["", "", ""]);
    setStep("confirm");
  }

  function checkConfirm() {
    const ok = confirmIdxs.every((idx, i) => confirmInputs[i].trim().toLowerCase() === mnemonic[idx]);
    if (!ok) {
      toast.error("Words don't match. Check your backup and try again.");
      return;
    }
    setStep("pin");
  }

  async function commitPin(pin: string) {
    if (!pin1) {
      setPin1(pin);
      toast.success("Enter the same PIN again to confirm");
    } else if (pin === pin1) {
      const h = await pinHash(pin);
      setPinHashStored(h);
      setStep("merchant");
    } else {
      setPin1(null);
      toast.error("PINs don't match. Try again.");
    }
  }

  async function finish() {
    if (!biz.trim()) {
      toast.error("Business name is required");
      return;
    }
    const seedBytes = mnemonicToSeedSync(mnemonic.join(" "));
    const seedHex = Array.from(seedBytes.slice(0, 32) as Uint8Array).map((b: number) => b.toString(16).padStart(2, "0")).join("");
    const zAddr = "zs1" + Array.from({ length: 75 }, (_, i) => "qpzry9x8gf2tvdw0s3jn54khce6mua7l"[(seedBytes[i % seedBytes.length] ?? i) % 32]).join("");

    init(mnemonic, seedHex, zAddr);
    setMerchant({
      businessName: biz.trim(),
      brandColor,
      createdAt: Date.now(),
    });
    toast.success("Welcome to Umbra");
    router.replace("/");
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-14 pb-3 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="w-6 h-6 rounded-md bg-primary items-center justify-center">
            <View className="w-2.5 h-2.5 rounded-full bg-white/90" />
          </View>
          <Text className="text-sm font-semibold tracking-tight text-foreground">umbra</Text>
        </View>
        <StepDots step={step} />
      </View>

      {step === "welcome" && (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="flex-1 items-center justify-center py-10">
            <View className="w-16 h-16 rounded-lg bg-primary/15 items-center justify-center mb-6">
              <Sparkles size={28} color="#6366f1" />
            </View>
            <Text className="text-3xl font-semibold tracking-tight text-foreground text-center">
              Set up your merchant account
            </Text>
            <Text className="mt-3 text-sm text-muted-foreground text-center">
              Umbra is a non-custodial, privacy-first PSP. Your seed never leaves this device.
            </Text>
            <View className="mt-8 gap-3 w-full">
              {[
                "Generate a 12-word recovery phrase",
                "Set a 4-digit PIN to lock the app",
                "Brand UmbraPay with your business",
              ].map((t) => (
                <View key={t} className="flex-row items-start gap-2">
                  <Check size={16} color="#10b981" />
                  <Text className="text-sm text-muted-foreground flex-1">{t}</Text>
                </View>
              ))}
            </View>
            <Pressable
              onPress={generate}
              className="mt-10 rounded-lg bg-primary py-4 w-full flex-row items-center justify-center gap-2"
            >
              <Text className="text-sm font-semibold text-white">Get started</Text>
              <ChevronRight size={16} color="white" />
            </Pressable>
          </View>
        </ScrollView>
      )}

      {step === "seed" && (
        <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <Pressable onPress={() => setStep("welcome")} className="self-start flex-row items-center gap-1 mb-4">
            <ArrowLeft size={14} color="#8c8ca0" />
            <Text className="text-xs text-muted-foreground">Back</Text>
          </Pressable>
          <Text className="text-xl font-semibold text-foreground">Your recovery phrase</Text>
          <Text className="mt-2 text-xs text-muted-foreground">
            Write these 12 words down on paper — in order. Anyone with them controls your funds.
          </Text>

          <View className="mt-5 relative rounded-lg border border-border bg-card p-4">
            <View className="flex-row flex-wrap gap-2">
              {mnemonic.map((w, i) => (
                <View key={i} className="flex-row items-baseline gap-1.5 px-2 py-2 rounded-lg bg-white/5" style={{ opacity: revealed ? 1 : 0 }}>
                  <Text className="text-[10px] font-mono text-muted-foreground tabular-nums w-4">{i + 1}</Text>
                  <Text className="text-sm font-mono text-foreground">{w}</Text>
                </View>
              ))}
            </View>
            {!revealed && (
              <Pressable
                onPress={() => setRevealed(true)}
                className="absolute inset-0 items-center justify-center"
              >
                <View className="flex-row items-center gap-2 px-4 py-2 rounded-full bg-background border border-border">
                  <Eye size={16} color="#6366f1" />
                  <Text className="text-sm font-medium text-primary">Tap to reveal</Text>
                </View>
              </Pressable>
            )}
          </View>

          {revealed && (
            <Pressable onPress={() => setRevealed(false)} className="self-end mt-2 flex-row items-center gap-1">
              <EyeOff size={12} color="#8c8ca0" />
              <Text className="text-[11px] text-muted-foreground">Hide</Text>
            </Pressable>
          )}

          <View className="mt-5 rounded-md bg-destructive/10 border border-destructive/30 p-3 flex-row gap-2">
            <Shield size={14} color="#ef4444" />
            <Text className="text-[11px] text-destructive flex-1">Never share these words. Umbra support will never ask for them.</Text>
          </View>

          <Pressable
            onPress={startConfirm}
            disabled={!revealed}
            className="mt-6 rounded-lg bg-primary py-4 items-center disabled:opacity-40"
          >
            <Text className="text-sm font-semibold text-white">I've written them down</Text>
          </Pressable>
        </ScrollView>
      )}

      {step === "confirm" && (
        <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <Pressable onPress={() => setStep("seed")} className="self-start flex-row items-center gap-1 mb-4">
            <ArrowLeft size={14} color="#8c8ca0" />
            <Text className="text-xs text-muted-foreground">Back</Text>
          </Pressable>
          <Text className="text-xl font-semibold text-foreground">Confirm your phrase</Text>
          <Text className="mt-2 text-xs text-muted-foreground">Type the requested words from your backup.</Text>
          <View className="mt-6 gap-3">
            {confirmIdxs.map((idx, i) => (
              <View key={idx}>
                <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">Word #{idx + 1}</Text>
                <TextInput
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={confirmInputs[i]}
                  onChangeText={(v) => {
                    const next = [...confirmInputs];
                    next[i] = v;
                    setConfirmInputs(next);
                  }}
                  className="mt-1 rounded-md bg-white/5 border border-border px-3 py-3 font-mono text-sm text-foreground"
                  placeholderTextColor="#8c8ca0"
                />
              </View>
            ))}
          </View>
          <Pressable
            onPress={checkConfirm}
            disabled={confirmInputs.some((x) => !x.trim())}
            className="mt-6 rounded-lg bg-primary py-4 items-center disabled:opacity-40"
          >
            <Text className="text-sm font-semibold text-white">Continue</Text>
          </Pressable>
        </ScrollView>
      )}

      {step === "pin" && (
        <View className="flex-1 justify-center px-6">
          <Text className="text-xl font-semibold text-center text-foreground mb-1">
            {pin1 ? "Confirm your PIN" : "Set a 4-digit PIN"}
          </Text>
          <Text className="text-xs text-muted-foreground text-center mb-6">
            Used to unlock the app and confirm sensitive actions.
          </Text>
          <PinPad key={pin1 ? "confirm" : "set"} onSubmit={commitPin} />
        </View>
      )}

      {step === "merchant" && (
        <ScrollView className="px-6" contentContainerStyle={{ paddingBottom: 40 }}>
          <Text className="text-xl font-semibold text-foreground">Brand your account</Text>
          <Text className="mt-2 text-xs text-muted-foreground">Customers will see this on checkout pages and invoices.</Text>

          <View className="mt-6 gap-3">
            <View>
              <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">Business name *</Text>
              <TextInput
                value={biz}
                onChangeText={setBiz}
                placeholder="Acme Inc."
                placeholderTextColor="#8c8ca0"
                className="mt-1 rounded-md bg-white/5 border border-border px-3 py-3 text-sm text-foreground"
              />
            </View>

            <View>
              <Text className="text-[11px] uppercase tracking-wider text-muted-foreground">Brand color</Text>
              <View className="mt-2 flex-row gap-2">
                {BRAND_PRESETS.map((c) => (
                  <Pressable
                    key={c.value}
                    onPress={() => setBrandColor(c.value)}
                    className={`w-9 h-9 rounded-md border-2 ${brandColor === c.value ? "border-white" : "border-transparent"}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </View>
            </View>
          </View>

          <Pressable onPress={finish} className="mt-8 rounded-lg bg-primary py-4 items-center">
            <Text className="text-sm font-semibold text-white">Open Umbra</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}
