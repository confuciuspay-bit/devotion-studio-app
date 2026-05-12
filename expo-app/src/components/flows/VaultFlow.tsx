import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import { Sheet } from "@/components/Sheet";
import { CoinPicker, type PickedCoin } from "@/components/CoinPicker";
import { ChainPicker } from "@/components/ChainPicker";
import { AmountInput } from "@/components/AmountInput";
import { StatusTimeline, type Step } from "@/components/StatusTimeline";
import { Row } from "@/components/Row";
import { type Chain, vaultRouteLabel } from "@/lib/chains";
import { useApp, type VaultActivity } from "@/lib/store";
import { fakeTxHash, shortAddr } from "@/lib/addresses";
import { vaultFee } from "@/lib/fees";
import { useSimplePrices, fmtUsd } from "@/lib/markets";
import { Shield, Clock, Lock, Eye, EyeOff } from "lucide-react-native";
import { toast } from "@/lib/toast";

export type VaultFlowKind = "withdraw" | "settings" | "address";

const ZEC_PRICE = 35;

const DELAYS = [
  { l: "Now", v: 0 },
  { l: "1 hour", v: 3600_000 },
  { l: "24 hours", v: 86_400_000 },
];

export function VaultFlow({ open, kind, onClose }: { open: boolean; kind: VaultFlowKind | null; onClose: () => void }) {
  const { vaultZec, zAddr, payoutFromVault, vaultEnabled } = useApp();

  const [step, setStep] = useState(0);
  const [coin, setCoin] = useState<PickedCoin | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [amount, setAmount] = useState({ token: 0, usd: 0 });
  const [recipient, setRecipient] = useState("");
  const [delay, setDelay] = useState(0);
  const [progress, setProgress] = useState<Step[]>([]);
  const [revealAddr, setRevealAddr] = useState(false);

  const prices = useSimplePrices(coin ? [coin.id] : []);

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0); setCoin(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setRecipient(""); setDelay(0);
        setProgress([]); setRevealAddr(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  if (!kind) return <Sheet open={open} onClose={onClose} title=""><View /></Sheet>;

  const livePrice = coin ? prices.data?.[coin.id]?.usd ?? coin.price : undefined;
  const balanceUsd = vaultZec * ZEC_PRICE;

  const titles = {
    withdraw: ["Withdraw — output asset", "Output network", "Amount", "Recipient", "Review", "Processing"],
    settings: ["Vault settings"],
    address: ["Shielded address"],
  } as const;
  const title = kind === "withdraw" ? titles.withdraw[step] : titles[kind][0];
  const back = kind === "withdraw" && step > 0 ? () => setStep((s) => s - 1) : undefined;

  const finalize = async () => {
    if (!coin || !chain) return;
    setStep(5);
    const h = await fakeTxHash("payout" + Date.now());
    const steps: Step[] = [
      ...(delay > 0 ? [{ label: `Privacy delay · ${DELAYS.find((d) => d.v === delay)?.l}`, status: "active" as const }] : []),
      { label: "z_sendmany · z-addr → t-addr", status: delay > 0 ? "pending" : "active" as const },
      { label: `Streaming swap ZEC → ${coin.symbol} · ${vaultRouteLabel(chain)}`, status: "pending" as const },
      { label: `Sending to ${shortAddr(recipient)}`, status: "pending" as const },
      { label: "Settled", status: "pending" as const },
    ];
    setProgress(steps);
    const advance = (i: number) =>
      setProgress((p) => p.map((s, k) => (k < i ? { ...s, status: "done" } : k === i ? { ...s, status: "active" } : s)));
    setTimeout(() => advance(1), delay > 0 ? 1500 : 800);
    setTimeout(() => advance(2), 2400);
    setTimeout(() => advance(3), 3600);
    setTimeout(() => {
      setProgress((p) => p.map((s) => ({ ...s, status: "done" })));
      const fee = vaultFee(amount.usd);
      const entry: VaultActivity = {
        id: `v${Date.now()}`,
        kind: "payout",
        toCoinId: coin.id, toChainId: chain.id,
        fromAmountUsd: amount.usd, zecAmount: amount.usd / ZEC_PRICE,
        toAddress: recipient,
        hash: h, ts: Date.now(), fee: fee.total, status: "completed",
      };
      payoutFromVault(entry);
      toast.success(`Payout of ${fmtUsd(amount.usd)} sent`);
    }, 5200);
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} onBack={back}>
      {/* ── ADDRESS ── */}
      {kind === "address" && (
        <View className="gap-4">
          <View className="rounded-lg border border-success/20 bg-success/4 p-4 flex-row items-start gap-3">
            <Shield size={16} color="#10b981" />
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">Per-merchant z-addr</Text>
              <Text className="text-[11px] text-muted-foreground mt-0.5">
                A unique shielded address. Never share publicly — funds are visible to whoever holds the viewing key.
              </Text>
            </View>
          </View>
          <View className="rounded-lg border border-border p-4 gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Address</Text>
              <Pressable onPress={() => setRevealAddr((v) => !v)} className="flex-row items-center gap-1">
                {revealAddr ? <EyeOff size={12} color="#6366f1" /> : <Eye size={12} color="#6366f1" />}
                <Text className="text-xs text-primary">{revealAddr ? "Hide" : "Reveal"}</Text>
              </Pressable>
            </View>
            <Text className="font-mono text-xs text-foreground leading-relaxed">
              {revealAddr ? zAddr : zAddr.slice(0, 8) + "…" + zAddr.slice(-8)}
            </Text>
          </View>
          <Pressable
            onPress={async () => { await Clipboard.setStringAsync(zAddr); toast.success("z-addr copied"); }}
            className="rounded-md bg-primary py-3 items-center"
          >
            <Text className="text-sm font-medium text-white">Copy address</Text>
          </Pressable>
        </View>
      )}

      {/* ── SETTINGS ── */}
      {kind === "settings" && (
        <View className="gap-3">
          <VaultToggle
            label="Vault enabled"
            sub="When off, payments settle directly to wallet."
            value={vaultEnabled}
            onChange={(b) => useApp.setState({ vaultEnabled: b })}
          />
          <VaultToggle
            label="Auto-payout"
            sub="Payout to default address when balance > $10k."
            value={false}
            onChange={() => {}}
          />
          <View className="rounded-lg border border-border p-4">
            <Text className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Default privacy delay</Text>
            <View className="flex-row gap-2">
              {DELAYS.map((d) => (
                <Pressable
                  key={d.l}
                  onPress={() => toast.success(`Default set to ${d.l}`)}
                  className="flex-1 rounded-md border border-border bg-white/4 py-2 items-center"
                >
                  <Text className="text-xs text-foreground">{d.l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View className="rounded-lg border border-border p-4 gap-2">
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">All-in fee</Text>
              <Text className="text-xs font-medium text-foreground">2.00%</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Route</Text>
              <Text className="text-xs font-medium text-foreground">Maya / THORChain</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-xs text-muted-foreground">Anonymity set</Text>
              <Text className="text-xs font-medium text-success">4.9M ZEC</Text>
            </View>
          </View>
        </View>
      )}

      {/* ── WITHDRAW ── */}
      {kind === "withdraw" && step === 0 && (
        <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />
      )}
      {kind === "withdraw" && step === 1 && (
        <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />
      )}
      {kind === "withdraw" && step === 2 && coin && (
        <View className="gap-4">
          <View className="rounded-lg border border-success/20 bg-success/4 p-3 items-center">
            <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Vault balance</Text>
            <Text className="text-success font-mono mt-0.5">ⓩ {vaultZec.toFixed(4)} · {fmtUsd(balanceUsd)}</Text>
          </View>
          <AmountInput symbol={coin.symbol} price={livePrice} balance={balanceUsd / (livePrice || 1)} onChange={setAmount} />
          <View>
            <View className="flex-row items-center gap-1 mb-2">
              <Clock size={12} color="#8c8ca0" />
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Privacy delay</Text>
            </View>
            <View className="flex-row gap-2">
              {DELAYS.map((d) => (
                <Pressable
                  key={d.l}
                  onPress={() => setDelay(d.v)}
                  className={`flex-1 rounded-md border py-2 items-center ${delay === d.v ? "bg-primary border-primary" : "bg-white/4 border-border"}`}
                >
                  <Text className={`text-xs ${delay === d.v ? "text-white" : "text-muted-foreground"}`}>{d.l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            disabled={!amount.usd || amount.usd > balanceUsd}
            onPress={() => setStep(3)}
            className="rounded-md bg-primary py-3 items-center disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-white">Continue</Text>
          </Pressable>
        </View>
      )}
      {kind === "withdraw" && step === 3 && (
        <View className="gap-3">
          <Text className="text-xs text-muted-foreground">Recipient address</Text>
          <TextInput
            value={recipient}
            onChangeText={setRecipient}
            placeholder={`${chain?.addressPrefix ?? ""}…`}
            placeholderTextColor="#8c8ca0"
            className="rounded-md bg-white/4 border border-border px-4 py-3 text-sm font-mono text-foreground"
          />
          <Pressable
            disabled={recipient.length < 10}
            onPress={() => setStep(4)}
            className="rounded-md bg-primary py-3 items-center disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-white">Review</Text>
          </Pressable>
        </View>
      )}
      {kind === "withdraw" && step === 4 && coin && chain && (() => {
        const fee = vaultFee(amount.usd);
        const out = (amount.usd - fee.total) / (livePrice || 1);
        return (
          <View className="gap-4">
            <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
              <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Withdrawing</Text>
              <Text className="text-3xl font-mono font-semibold mt-2 text-foreground">{fmtUsd(amount.usd)}</Text>
              <Text className="text-xs text-success font-mono mt-1">→ {out.toFixed(out < 1 ? 6 : 4)} {coin.symbol}</Text>
            </View>
            <View className="rounded-lg border border-border overflow-hidden">
              <Row l="Output" v={`${coin.symbol} · ${chain.name}`} />
              <View className="border-t border-border"><Row l="To" v={<Text className="font-mono text-foreground text-sm">{shortAddr(recipient)}</Text>} /></View>
              <View className="border-t border-border"><Row l="Privacy delay" v={DELAYS.find((d) => d.v === delay)?.l ?? "Now"} /></View>
              <View className="border-t border-border"><Row l="Route" v={vaultRouteLabel(chain)} /></View>
              <View className="border-t border-border"><Row l="All-in fee" v={`${fmtUsd(fee.total)} · 2.00%`} /></View>
              <View className="border-t border-border"><Row l="You receive" v={fmtUsd(amount.usd - fee.total)} /></View>
            </View>
            <Pressable onPress={finalize} className="rounded-md bg-primary py-3 flex-row items-center justify-center gap-2">
              <Lock size={16} color="white" />
              <Text className="text-sm font-medium text-white">Confirm withdraw</Text>
            </Pressable>
          </View>
        );
      })()}
      {kind === "withdraw" && step === 5 && (
        <View className="gap-4">
          <StatusTimeline steps={progress} />
          {progress.every((s) => s.status === "done") && (
            <Pressable onPress={onClose} className="rounded-md bg-primary py-3 items-center">
              <Text className="text-sm font-medium text-white">Done</Text>
            </Pressable>
          )}
        </View>
      )}
    </Sheet>
  );
}

function VaultToggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="rounded-lg border border-border p-4 flex-row items-start gap-3">
      <Pressable
        onPress={() => onChange(!value)}
        className={`mt-0.5 w-9 h-5 rounded-full p-0.5 ${value ? "bg-primary" : "bg-white/12"}`}
      >
        <View className={`w-4 h-4 rounded-full bg-white ${value ? "ml-4" : "ml-0"}`} style={{ transform: [{ translateX: value ? 0 : 0 }] }} />
      </Pressable>
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <Text className="text-[11px] text-muted-foreground mt-0.5">{sub}</Text>
      </View>
    </View>
  );
}
