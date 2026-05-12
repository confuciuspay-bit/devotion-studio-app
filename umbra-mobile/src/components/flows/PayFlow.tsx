import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { Sheet } from "@/components/Sheet";
import { CoinPicker, type PickedCoin } from "@/components/CoinPicker";
import { ChainPicker } from "@/components/ChainPicker";
import { CoinIcon } from "@/components/CoinIcon";
import { AmountInput } from "@/components/AmountInput";
import { QR } from "@/components/QR";
import { Row } from "@/components/Row";
import { StatusTimeline, type Step } from "@/components/StatusTimeline";
import { type Chain } from "@/lib/chains";
import { useApp, type PaymentRecord } from "@/lib/store";
import { deriveAddress, fakeTxHash, shortAddr } from "@/lib/addresses";
import { useSimplePrices, fmtUsd, fmtTime } from "@/lib/markets";
import { Check, QrCode, Link2 } from "lucide-react-native";
import { toast } from "@/lib/toast";

export type PayFlowKind = "new" | "qr" | "link";

const EXPIRIES = [
  { l: "15 min", v: 15 * 60_000 },
  { l: "1 hour", v: 60 * 60_000 },
  { l: "1 day", v: 86_400_000 },
  { l: "7 days", v: 7 * 86_400_000 },
];

export function PayFlow({
  open, kind, onClose, focusPayment,
}: {
  open: boolean;
  kind: PayFlowKind | null;
  onClose: () => void;
  focusPayment?: PaymentRecord | null;
}) {
  const { payments, addPayment, seedHex, vaultEnabled } = useApp();

  const [step, setStep] = useState(0);
  const [coin, setCoin] = useState<PickedCoin | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [amount, setAmount] = useState({ token: 0, usd: 0 });
  const [reference, setReference] = useState("");
  const [customer, setCustomer] = useState("");
  const [description, setDescription] = useState("");
  const [expiryMs, setExpiryMs] = useState(EXPIRIES[1].v);
  const [vault, setVault] = useState(true);
  const [webhook, setWebhook] = useState("");
  const [created, setCreated] = useState<PaymentRecord | null>(null);
  const [progress, setProgress] = useState<Step[]>([]);

  const prices = useSimplePrices(coin ? [coin.id] : []);
  const livePrice = coin ? prices.data?.[coin.id]?.usd ?? coin.price : undefined;

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0); setCoin(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setReference(""); setCustomer("");
        setDescription(""); setVault(true); setWebhook(""); setCreated(null);
        setProgress([]);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const target =
    focusPayment ??
    payments.find((p) => p.status === "INITIATED" || p.status === "FUNDED") ??
    payments[0] ??
    null;

  if (!kind) return <Sheet open={open} onClose={onClose} title=""><View /></Sheet>;

  const paymentLink = (p: PaymentRecord) => `https://umbra.app/pay/${p.id}`;

  const titles = ["New payment — asset", "Network", "Amount", "Details", "Review", "Live"];
  const title =
    kind === "new" ? titles[step]
    : kind === "qr" ? "Payment QR"
    : "Share payment link";
  const back = kind === "new" && step > 0 ? () => setStep((s) => s - 1) : undefined;

  const finalize = async () => {
    setStep(5);
    if (!coin || !chain) return;
    const addr = await deriveAddress((seedHex ?? "merchant") + coin.id + Date.now(), chain);
    const id = "INV-" + (2042 + payments.length).toString();
    const psp = vault ? 0 : Math.max(0.05, amount.usd * 0.005);
    const rec: PaymentRecord = {
      id, amountUsd: amount.usd, amountToken: amount.token,
      token: coin.symbol, coinId: coin.id, chainId: chain.id, address: addr.address,
      expiresAt: Date.now() + expiryMs, createdAt: Date.now(),
      status: "INITIATED", vault, feeUsd: psp,
      customer: customer || undefined, reference: reference || undefined,
      webhookUrl: webhook || undefined,
    };
    addPayment(rec);
    setCreated(rec);
    const steps: Step[] = [
      { label: "Address generated", status: "done", detail: shortAddr(addr.address) },
      { label: "Listening for funding", status: "active" },
      { label: vault ? "Shielding to vault z-addr" : "Settling to wallet", status: "pending" },
      { label: "Released", status: "pending" },
    ];
    setProgress(steps);
    setTimeout(async () => {
      const h = await fakeTxHash(addr.address);
      setProgress((p) => p.map((s, k) => (k < 2 ? { ...s, status: "done" } : k === 2 ? { ...s, status: "active" } : s)));
      useApp.getState().updatePayment(id, { status: "FUNDED", hash: h });
    }, 2200);
    setTimeout(() => {
      setProgress((p) => p.map((s) => ({ ...s, status: "done" })));
      useApp.getState().updatePayment(id, { status: "RELEASED" });
    }, 5500);
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} onBack={back}>
      {kind === "qr" && <QrFlow target={target} />}
      {kind === "link" && <LinkFlow target={target} buildLink={paymentLink} />}

      {kind === "new" && step === 0 && (
        <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />
      )}
      {kind === "new" && step === 1 && (
        <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />
      )}
      {kind === "new" && step === 2 && coin && (
        <View className="gap-4">
          <AmountInput symbol={coin.symbol} price={livePrice} onChange={setAmount} />
          <View>
            <Text className="text-[11px] text-muted-foreground mb-2">Expires in</Text>
            <View className="flex-row gap-2">
              {EXPIRIES.map((e) => (
                <Pressable
                  key={e.l}
                  onPress={() => setExpiryMs(e.v)}
                  className={`flex-1 rounded-md border py-2 items-center ${expiryMs === e.v ? "bg-primary border-primary" : "bg-white/4 border-border"}`}
                >
                  <Text className={`text-xs font-medium ${expiryMs === e.v ? "text-white" : "text-muted-foreground"}`}>{e.l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            disabled={!amount.usd}
            onPress={() => setStep(3)}
            className="rounded-md bg-primary py-3 items-center disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-white">Continue</Text>
          </Pressable>
        </View>
      )}
      {kind === "new" && step === 3 && (
        <View className="gap-3">
          <Field label="Reference" value={reference} onChange={setReference} placeholder="PO-552 / order #" />
          <Field label="Customer" value={customer} onChange={setCustomer} placeholder="name or 0x… address (optional)" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="Invoice line / memo" />
          <Field label="Webhook URL" value={webhook} onChange={setWebhook} placeholder="https://… (optional)" mono />

          <View className="rounded-lg border border-border p-4 flex-row items-start gap-3">
            <Pressable
              onPress={() => setVault((v) => !v)}
              className={`mt-0.5 w-5 h-5 rounded items-center justify-center border ${vault ? "bg-success border-success" : "bg-white/5 border-white/8"}`}
            >
              {vault && <Check size={14} color="black" />}
            </Pressable>
            <View className="flex-1">
              <Text className="text-sm font-medium text-foreground">Settle to UmbraVault</Text>
              <Text className="text-[11px] text-muted-foreground mt-0.5">
                {vault
                  ? "2.00% all-in. PSP fee waived. Funds shielded into ZEC z-addr."
                  : "0.50% PSP fee (min $0.05). Funds settle to wallet."}
              </Text>
              {!vaultEnabled && vault && (
                <Text className="text-[11px] text-destructive mt-1">Vault disabled in settings — enable to use.</Text>
              )}
            </View>
          </View>

          <Pressable onPress={() => setStep(4)} className="rounded-md bg-primary py-3 items-center">
            <Text className="text-sm font-medium text-white">Review</Text>
          </Pressable>
        </View>
      )}
      {kind === "new" && step === 4 && coin && chain && (
        <View className="gap-4">
          <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
            <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Request</Text>
            <Text className="text-3xl font-mono font-semibold mt-2 tabular-nums text-foreground">{fmtUsd(amount.usd)}</Text>
            <Text className="text-xs text-muted-foreground font-mono mt-1">≈ {amount.token.toFixed(amount.token < 1 ? 6 : 4)} {coin.symbol}</Text>
          </View>
          <View className="rounded-lg border border-border overflow-hidden">
            <Row l="Asset" v={
              <View className="flex-row items-center gap-1.5">
                <CoinIcon src={coin.image} symbol={coin.symbol} size={16} />
                <Text className="text-sm text-foreground">{coin.symbol}</Text>
              </View>
            } />
            <View className="border-t border-border"><Row l="Network" v={chain.name} /></View>
            <View className="border-t border-border"><Row l="Expires" v={fmtTime(Date.now() + expiryMs)} /></View>
            <View className="border-t border-border"><Row l="Settlement" v={vault ? "Vault · 2.00% all-in" : "Wallet · 0.50% PSP"} /></View>
            {reference ? <View className="border-t border-border"><Row l="Reference" v={reference} /></View> : null}
            {customer ? <View className="border-t border-border"><Row l="Customer" v={customer} /></View> : null}
          </View>
          <Pressable onPress={finalize} className="rounded-md bg-primary py-3 items-center">
            <Text className="text-sm font-medium text-white">Create payment</Text>
          </Pressable>
        </View>
      )}
      {kind === "new" && step === 5 && created && coin && chain && (
        <View className="gap-4">
          <View className="items-center">
            <QR value={`${chain.symbol.toLowerCase()}:${created.address}?amount=${created.amountToken}`} size={200} />
          </View>
          <View className="rounded-lg border border-border overflow-hidden">
            <Row l="ID" v={created.id} />
            <View className="border-t border-border"><Row l="Address" v={<Text className="font-mono text-[11px] text-foreground">{created.address}</Text>} /></View>
            <View className="border-t border-border"><Row l="Amount" v={`${created.amountToken.toFixed(4)} ${created.token}`} /></View>
          </View>
          <StatusTimeline steps={progress} />
          <View className="flex-row gap-2">
            <Pressable
              onPress={async () => { await Clipboard.setStringAsync(created.address); toast.success("Address copied"); }}
              className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center"
            >
              <Text className="text-xs font-medium text-foreground">Copy Address</Text>
            </Pressable>
            <Pressable
              onPress={async () => { await Clipboard.setStringAsync(paymentLink(created)); toast.success("Link copied"); }}
              className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center"
            >
              <Text className="text-xs font-medium text-foreground">Copy Link</Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) await Sharing.shareAsync(paymentLink(created));
              }}
              className="flex-1 rounded-md bg-primary py-3 items-center"
            >
              <Text className="text-xs font-medium text-white">Share</Text>
            </Pressable>
          </View>
          <Pressable onPress={onClose}>
            <Text className="text-sm text-muted-foreground text-center py-2">Done</Text>
          </Pressable>
        </View>
      )}
    </Sheet>
  );
}

function Field({
  label, value, onChange, placeholder, mono,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <View>
      <Text className="text-[11px] text-muted-foreground mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#8c8ca0"
        className={`rounded-md bg-white/4 border border-border px-4 py-3 text-sm text-foreground ${mono ? "font-mono" : ""}`}
      />
    </View>
  );
}

function QrFlow({ target }: { target: PaymentRecord | null }) {
  if (!target) return <Empty kind="qr" />;
  return (
    <View className="gap-4">
      <View className="items-center">
        <Text className="text-xs text-muted-foreground">{target.id}</Text>
        <Text className="text-2xl font-mono font-semibold tabular-nums mt-0.5 text-foreground">{fmtUsd(target.amountUsd)}</Text>
        <Text className="text-[11px] text-muted-foreground">{target.token} · {target.chainId}</Text>
      </View>
      <View className="items-center">
        <QR value={`${target.token.toLowerCase()}:${target.address}?amount=${target.amountToken}`} size={220} />
      </View>
      <View className="rounded-lg border border-border overflow-hidden">
        <Row l="Address" v={<Text className="font-mono text-[11px] text-foreground">{target.address}</Text>} />
        <View className="border-t border-border"><Row l="Status" v={target.status} /></View>
      </View>
      <Pressable
        onPress={async () => { await Clipboard.setStringAsync(target.address); toast.success("Address copied"); }}
        className="rounded-md bg-primary py-3 items-center"
      >
        <Text className="text-sm font-medium text-white">Copy address</Text>
      </Pressable>
    </View>
  );
}

function LinkFlow({ target, buildLink }: { target: PaymentRecord | null; buildLink: (p: PaymentRecord) => string }) {
  if (!target) return <Empty kind="link" />;
  const link = buildLink(target);
  return (
    <View className="gap-4">
      <View className="rounded-lg border border-border bg-white/3 p-4">
        <Text className="text-[11px] text-muted-foreground mb-1">Hosted checkout link</Text>
        <Text className="font-mono text-xs text-foreground">{link}</Text>
      </View>
      <View className="rounded-lg border border-border overflow-hidden">
        <Row l="Invoice" v={target.id} />
        <View className="border-t border-border"><Row l="Amount" v={fmtUsd(target.amountUsd)} /></View>
        <View className="border-t border-border"><Row l="Status" v={target.status} /></View>
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={async () => { await Clipboard.setStringAsync(link); toast.success("Link copied"); }}
          className="flex-1 rounded-md bg-white/4 border border-border py-3 items-center"
        >
          <Text className="text-sm font-medium text-foreground">Copy</Text>
        </Pressable>
        <Pressable
          onPress={async () => {
            const canShare = await Sharing.isAvailableAsync();
            if (canShare) await Sharing.shareAsync(link);
          }}
          className="flex-1 rounded-md bg-primary py-3 items-center"
        >
          <Text className="text-sm font-medium text-white">Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Empty({ kind }: { kind: "qr" | "link" }) {
  return (
    <View className="py-12 items-center gap-2">
      <View className="w-10 h-10 items-center justify-center rounded-md bg-white/4 border border-border">
        {kind === "qr" ? <QrCode size={16} color="#8c8ca0" /> : <Link2 size={16} color="#8c8ca0" />}
      </View>
      <Text className="text-sm text-muted-foreground">No active payment yet.</Text>
      <Text className="text-xs text-muted-foreground">Tap + New to create one.</Text>
    </View>
  );
}
