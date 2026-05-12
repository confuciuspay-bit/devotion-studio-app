import React, { useState } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { useApp, pinHash, type AutoLock } from "@/lib/store";
import { PinGate } from "@/components/PinGate";
import { PinPad } from "@/components/PinPad";
import { DetailSheet } from "@/components/DetailSheet";
import { ArrowLeft, ChevronRight, Shield, KeyRound, Eye, EyeOff, Trash2 } from "lucide-react-native";
import { toast } from "@/lib/toast";

const BRAND_PRESETS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Amber",   value: "#f59e0b" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Cyan",    value: "#06b6d4" },
  { name: "Slate",   value: "#64748b" },
  { name: "Blue",    value: "#3b82f6" },
];

const LOCK_OPTIONS: AutoLock[] = [1, 5, 15, "never"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="px-5 mt-6">
      <Text className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">{title}</Text>
      {children}
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-lg border border-border bg-card overflow-hidden">
      {children}
    </View>
  );
}

function RowButton({ icon: Icon, label, onPress }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 px-4 py-3.5">
      <Icon size={16} color="#8c8ca0" />
      <Text className="text-sm flex-1 text-foreground">{label}</Text>
      <ChevronRight size={16} color="#8c8ca0" />
    </Pressable>
  );
}

function RowToggle({ icon: Icon, label, checked, onChange }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <Icon size={16} color="#8c8ca0" />
      <Text className="text-sm flex-1 text-foreground">{label}</Text>
      <Switch
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: "rgba(255,255,255,0.12)", true: "#6366f1" }}
        thumbColor="white"
      />
    </View>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const merchant = useApp((s) => s.merchant);
  const setMerchant = useApp((s) => s.setMerchant);
  const setPinHashStored = useApp((s) => s.setPinHashStored);
  const seed = useApp((s) => s.seed);
  const biometricsEnabled = useApp((s) => s.biometricsEnabled);
  const autoLockMinutes = useApp((s) => s.autoLockMinutes);
  const torEnabled = useApp((s) => s.torEnabled);
  const setSecurity = useApp((s) => s.setSecurity);
  const resetAll = useApp((s) => s.resetAll);
  const setLocked = useApp((s) => s.setLocked);

  const [revealSeed, setRevealSeed] = useState<"gate" | "show" | null>(null);
  const [changePin, setChangePin] = useState<"gate" | "new" | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [wipeGate, setWipeGate] = useState(false);

  async function commitNewPin(pin: string) {
    if (!newPin) { setNewPin(pin); toast.success("Confirm new PIN"); }
    else if (pin === newPin) {
      const h = await pinHash(pin); setPinHashStored(h);
      toast.success("PIN updated"); setChangePin(null); setNewPin(null);
    } else {
      toast.error("PINs don't match"); setNewPin(null);
    }
  }

  return (
    <ScrollView className="flex-1 bg-background" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          className="w-8 h-8 items-center justify-center rounded-md border border-border bg-card"
        >
          <ArrowLeft size={16} color="#8c8ca0" />
        </Pressable>
        <Text className="text-base font-medium text-foreground">Settings</Text>
      </View>

      <Section title="Merchant">
        <Pressable className="rounded-lg border border-border bg-card p-4 flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-md items-center justify-center shrink-0"
            style={{ backgroundColor: merchant?.brandColor ?? BRAND_PRESETS[0].value }}
          >
            <Text className="text-white text-sm font-semibold">
              {(merchant?.businessName ?? "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
            </Text>
          </View>
          <View className="flex-1 min-w-0">
            <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
              {merchant?.businessName ?? "Set up merchant profile"}
            </Text>
            <Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
              {merchant?.website ?? merchant?.country ?? "Tap to edit"}
            </Text>
          </View>
          <ChevronRight size={16} color="#8c8ca0" />
        </Pressable>
      </Section>

      <Section title="Security">
        <Group>
          <RowButton icon={KeyRound} label="Change PIN" onPress={() => setChangePin("gate")} />
          <View className="border-t border-border">
            <RowToggle icon={Shield} label="Biometric unlock" checked={biometricsEnabled} onChange={(v) => setSecurity({ biometricsEnabled: v })} />
          </View>
          <View className="border-t border-border">
            <Pressable onPress={() => { setLocked(true); toast.success("Locked"); }} className="flex-row items-center gap-3 px-4 py-3.5">
              <Shield size={16} color="#8c8ca0" />
              <Text className="text-sm flex-1 text-foreground">Lock now</Text>
              <ChevronRight size={16} color="#8c8ca0" />
            </Pressable>
          </View>
        </Group>
      </Section>

      <Section title="Backup">
        <Group>
          <RowButton icon={Eye} label="Reveal recovery phrase" onPress={() => setRevealSeed("gate")} />
        </Group>
      </Section>

      <Section title="Privacy & network">
        <Group>
          <RowToggle icon={Shield} label="Tor routing" checked={torEnabled} onChange={(v) => setSecurity({ torEnabled: v })} />
        </Group>
      </Section>

      <Section title="Danger zone">
        <Pressable
          onPress={() => setWipeGate(true)}
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex-row items-center gap-3"
        >
          <Trash2 size={16} color="#ef4444" />
          <Text className="text-sm font-medium text-destructive flex-1">Clear all data</Text>
          <ChevronRight size={16} color="#ef4444" />
        </Pressable>
      </Section>

      {/* Reveal seed */}
      <DetailSheet open={!!revealSeed} onClose={() => setRevealSeed(null)} title="Recovery phrase">
        {revealSeed === "gate" && (
          <PinGate title="Confirm with PIN" subtitle="Required to reveal your seed" onPass={() => setRevealSeed("show")} onCancel={() => setRevealSeed(null)} />
        )}
        {revealSeed === "show" && seed && (
          <View className="gap-4">
            <View className="rounded-md bg-destructive/8 border border-destructive/20 p-3 flex-row gap-2">
              <Shield size={14} color="#ef4444" />
              <Text className="text-[11px] text-destructive flex-1">Never share these words. Anyone with them controls your funds.</Text>
            </View>
            <View className="rounded-lg border border-border bg-card p-3 flex-row flex-wrap gap-2">
              {seed.map((w, i) => (
                <View key={i} className="flex-row items-baseline gap-1.5 px-2 py-2 rounded-md bg-white/3">
                  <Text className="text-[10px] font-mono text-muted-foreground tabular-nums w-4">{i + 1}</Text>
                  <Text className="text-xs font-mono text-foreground">{w}</Text>
                </View>
              ))}
            </View>
            <Pressable onPress={() => setRevealSeed(null)} className="rounded-md bg-white/4 border border-border py-3 flex-row items-center justify-center gap-2">
              <EyeOff size={16} color="#8c8ca0" />
              <Text className="text-sm font-medium text-foreground">Hide</Text>
            </Pressable>
          </View>
        )}
      </DetailSheet>

      {/* Change PIN */}
      <DetailSheet open={!!changePin} onClose={() => { setChangePin(null); setNewPin(null); }} title="Change PIN">
        {changePin === "gate" && (
          <PinGate title="Confirm current PIN" onPass={() => setChangePin("new")} onCancel={() => setChangePin(null)} />
        )}
        {changePin === "new" && (
          <PinPad title={newPin ? "Confirm new PIN" : "Enter new PIN"} onSubmit={commitNewPin} onCancel={() => { setChangePin(null); setNewPin(null); }} />
        )}
      </DetailSheet>

      {/* Wipe */}
      <DetailSheet open={wipeGate} onClose={() => setWipeGate(false)} title="Clear all data">
        <PinGate
          title="This will erase everything"
          subtitle="Confirm with your PIN. Make sure you have your seed phrase."
          onPass={() => { resetAll(); setWipeGate(false); toast.success("All data cleared"); router.replace("/onboarding"); }}
          onCancel={() => setWipeGate(false)}
        />
      </DetailSheet>
    </ScrollView>
  );
}
