import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import { Sheet } from "@/components/Sheet";
import { CoinPicker, type PickedCoin } from "@/components/CoinPicker";
import { ChainPicker } from "@/components/ChainPicker";
import { CoinIcon } from "@/components/CoinIcon";
import { AmountInput } from "@/components/AmountInput";
import { StatusTimeline, type Step } from "@/components/StatusTimeline";
import { QR } from "@/components/QR";
import { Row } from "@/components/Row";
import { CHAINS, vaultRouteLabel, type Chain } from "@/lib/chains";
import { useApp } from "@/lib/store";
import { deriveAddress, fakeTxHash, shortAddr } from "@/lib/addresses";
import { swapFee, vaultFee } from "@/lib/fees";
import { useSimplePrices, fmtUsd } from "@/lib/markets";
import { ArrowRight, Repeat } from "lucide-react-native";
import { toast } from "@/lib/toast";

type FlowKind = "receive" | "send" | "swap" | "shield";

export function WalletFlow({ open, kind, onClose }: { open: boolean; kind: FlowKind | null; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [coin, setCoin] = useState<PickedCoin | null>(null);
  const [coinTo, setCoinTo] = useState<PickedCoin | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [amount, setAmount] = useState({ token: 0, usd: 0 });
  const [recipient, setRecipient] = useState("");
  const [address, setAddress] = useState("");
  const [hash, setHash] = useState("");
  const [progress, setProgress] = useState<Step[]>([]);

  const { seedHex, holdings, shieldFunds, addContact } = useApp();
  const prices = useSimplePrices(coin ? [coin.id] : []);
  const swapPrices = useSimplePrices([coin?.id, coinTo?.id].filter((x): x is string => !!x));

  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep(0); setCoin(null); setCoinTo(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setRecipient(""); setAddress(""); setHash(""); setProgress([]);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (kind !== "receive" || !chain || !seedHex) return;
    deriveAddress(seedHex, chain).then((d) => setAddress(d.address));
  }, [kind, chain, seedHex]);

  const titles: Record<FlowKind, string[]> = {
    receive: ["Receive — pick coin", "Pick chain", "Your address"],
    send:    ["Send — pick coin", "Pick chain", "Amount", "Recipient", "Confirm", "Sending…"],
    swap:    ["Swap from", "Swap to", "Amount", "Confirm", "Swapping…"],
    shield:  ["Shield — pick asset", "Pick chain", "Amount", "Confirm", "Shielding to vault…"],
  };

  if (!kind) return <Sheet open={open} onClose={onClose} title=""><View /></Sheet>;

  const title = titles[kind][step] ?? "";
  const back = step > 0 ? () => setStep((s) => s - 1) : undefined;
  const userBalance = coin ? holdings.find((h) => h.coinId === coin.id)?.amount : undefined;
  const livePrice = coin ? prices.data?.[coin.id]?.usd ?? coin.price : undefined;

  // ── RECEIVE ──
  const renderReceive = () => {
    if (step === 0) return <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />;
    if (step === 1) return <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />;
    return (
      <View className="gap-4">
        <View className="items-center">
          <QR value={`${chain!.symbol.toLowerCase()}:${address}`} size={210} />
        </View>
        <View className="rounded-lg border border-border overflow-hidden">
          <Row l="Coin" v={
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-foreground">{coin?.symbol}</Text>
              <CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={18} />
            </View>
          } />
          <View className="border-t border-border"><Row l="Network" v={chain?.name ?? ""} /></View>
          <View className="border-t border-border"><Row l="Address" v={<Text className="font-mono text-[11px] text-foreground">{address}</Text>} /></View>
        </View>
        <View className="flex-row gap-2">
          <Pressable
            onPress={async () => { await Clipboard.setStringAsync(address); toast.success("Address copied"); }}
            className="flex-1 rounded-md bg-white/4 border border-border py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-sm font-medium text-foreground">Copy</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              const canShare = await Sharing.isAvailableAsync();
              if (canShare) await Sharing.shareAsync(address);
            }}
            className="flex-1 rounded-md bg-primary py-3 flex-row items-center justify-center gap-2"
          >
            <Text className="text-sm font-medium text-white">Share</Text>
          </Pressable>
        </View>
        <Text className="text-[11px] text-muted-foreground text-center">
          Send only {coin?.symbol} on {chain?.name}. Other assets will be lost.
        </Text>
      </View>
    );
  };

  // ── SEND ──
  const sendInit = async () => {
    setStep(5);
    const h = await fakeTxHash(coin!.id + recipient);
    setHash(h);
    const baseSteps: Step[] = [
      { label: "Signing transaction", status: "active" },
      { label: "Broadcasting to network", status: "pending" },
      { label: `Confirming · ${chain!.confirmations} blocks`, status: "pending" },
      { label: "Confirmed", status: "pending" },
    ];
    setProgress(baseSteps);
    const advance = (i: number) =>
      setProgress((p) => p.map((s, k) => (k < i ? { ...s, status: "done" } : k === i ? { ...s, status: "active" } : s)));
    setTimeout(() => advance(1), 800);
    setTimeout(() => advance(2), 2000);
    setTimeout(() => setProgress((p) => p.map((s) => ({ ...s, status: "done" }))), 4500);
  };

  const renderSend = () => {
    if (step === 0) return <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />;
    if (step === 1) return <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />;
    if (step === 2) {
      return (
        <View className="gap-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <Pressable
            disabled={!amount.usd}
            onPress={() => setStep(3)}
            className="rounded-md bg-primary py-3 items-center opacity-100 disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-white">Continue</Text>
          </Pressable>
        </View>
      );
    }
    if (step === 3) {
      return (
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
            onPress={async () => {
              const d = await deriveAddress((seedHex ?? "demo") + "self", chain!);
              setRecipient(d.address);
            }}
          >
            <Text className="text-xs text-primary">Use one of my addresses</Text>
          </Pressable>
          <Pressable
            disabled={recipient.length < 10}
            onPress={() => setStep(4)}
            className="rounded-md bg-primary py-3 items-center disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-white">Review</Text>
          </Pressable>
        </View>
      );
    }
    if (step === 4) {
      const fee = chain?.fixedFeeUsd[1] ?? 0;
      return (
        <View className="gap-4">
          <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
            <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">You're sending</Text>
            <Text className="text-3xl font-mono font-semibold tabular-nums mt-2 text-foreground">
              {amount.token.toFixed(amount.token < 1 ? 6 : 4)} {coin?.symbol}
            </Text>
            <Text className="text-xs text-muted-foreground font-mono mt-1">≈ {fmtUsd(amount.usd)}</Text>
          </View>
          <View className="rounded-lg border border-border overflow-hidden">
            <Row l="To" v={<Text className="font-mono text-foreground text-sm">{shortAddr(recipient)}</Text>} />
            <View className="border-t border-border"><Row l="Network" v={chain?.name ?? ""} /></View>
            <View className="border-t border-border"><Row l="Network fee" v={`~$${fee.toFixed(2)}`} /></View>
            <View className="border-t border-border"><Row l="Total" v={fmtUsd(amount.usd + fee)} /></View>
          </View>
          <Pressable
            onPress={() => {
              addContact({ id: `c${Date.now()}`, label: shortAddr(recipient), address: recipient, chainId: chain!.id });
              sendInit();
            }}
            className="rounded-md bg-primary py-3 items-center"
          >
            <Text className="text-sm font-medium text-white">Confirm send</Text>
          </Pressable>
        </View>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <View className="gap-4">
        <StatusTimeline steps={progress} />
        {done && (
          <>
            <View className="rounded-lg border border-border overflow-hidden">
              <Row l="Hash" v={<Text className="font-mono text-foreground text-sm">{shortAddr(hash, 8, 6)}</Text>} />
              <View className="border-t border-border">
                <Row l="Block" v={<Text className="font-mono text-foreground text-sm">21,182,{Math.floor(Math.random() * 999)}</Text>} />
              </View>
            </View>
            <Pressable onPress={onClose} className="rounded-md bg-primary py-3 items-center">
              <Text className="text-sm font-medium text-white">Done</Text>
            </Pressable>
          </>
        )}
      </View>
    );
  };

  // ── SWAP ──
  const swapInit = () => {
    setStep(4);
    const steps: Step[] = [
      { label: "Quote locked", status: "done" },
      { label: "Routing via " + (chain ? vaultRouteLabel(chain) : "Maya Protocol"), status: "active" },
      { label: "Streaming swap", status: "pending" },
      { label: "Settled", status: "pending" },
    ];
    setProgress(steps);
    setTimeout(() => setProgress((p) => p.map((s, k) => k < 2 ? { ...s, status: "done" } : k === 2 ? { ...s, status: "active" } : s)), 1500);
    setTimeout(() => setProgress((p) => p.map((s) => ({ ...s, status: "done" }))), 4000);
  };

  const renderSwap = () => {
    if (step === 0) return <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />;
    if (step === 1) return <CoinPicker onPick={(c) => { setCoinTo(c); setStep(2); }} />;
    if (step === 2) {
      const toPrice = swapPrices.data?.[coinTo!.id]?.usd ?? 1;
      const fee = swapFee(amount.usd);
      const out = (amount.usd - fee.total) / toPrice;
      return (
        <View className="gap-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <View className="rounded-lg border border-border bg-card p-4 flex-row items-center gap-3">
            <CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={28} />
            <ArrowRight size={14} color="#8c8ca0" />
            <CoinIcon src={coinTo?.image} symbol={coinTo?.symbol ?? ""} size={28} />
            <View className="flex-1 items-end">
              <Text className="text-xs text-muted-foreground">You receive</Text>
              <Text className="text-sm font-mono text-foreground">
                ≈ {out.toFixed(out < 1 ? 6 : 4)} {coinTo?.symbol}
              </Text>
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
      );
    }
    if (step === 3) {
      const fee = swapFee(amount.usd);
      const toPrice = swapPrices.data?.[coinTo!.id]?.usd ?? 1;
      const out = (amount.usd - fee.total) / toPrice;
      return (
        <View className="gap-4">
          <View className="rounded-lg bg-white/3 border border-border p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={32} />
                <View>
                  <Text className="text-xs text-muted-foreground">From</Text>
                  <Text className="font-mono text-foreground">{amount.token.toFixed(4)} {coin?.symbol}</Text>
                </View>
              </View>
              <Repeat size={16} color="#6366f1" />
              <View className="flex-row items-center gap-2">
                <View className="items-end">
                  <Text className="text-xs text-muted-foreground">To</Text>
                  <Text className="font-mono text-foreground">{out.toFixed(4)} {coinTo?.symbol}</Text>
                </View>
                <CoinIcon src={coinTo?.image} symbol={coinTo?.symbol ?? ""} size={32} />
              </View>
            </View>
          </View>
          <View className="rounded-lg border border-border overflow-hidden">
            <Row l="Spread" v={fee.label} />
            <View className="border-t border-border"><Row l="Slippage" v="0.50% max" /></View>
            <View className="border-t border-border"><Row l="Route" v="Maya · ZEC bridge" /></View>
          </View>
          <Pressable onPress={swapInit} className="rounded-md bg-primary py-3 items-center">
            <Text className="text-sm font-medium text-white">Confirm swap</Text>
          </Pressable>
        </View>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <View className="gap-4">
        <StatusTimeline steps={progress} />
        {done && (
          <Pressable onPress={onClose} className="rounded-md bg-primary py-3 items-center">
            <Text className="text-sm font-medium text-white">Done</Text>
          </Pressable>
        )}
      </View>
    );
  };

  // ── SHIELD ──
  const shieldInit = async () => {
    setStep(4);
    const steps: Step[] = [
      { label: "Generating one-time t-addr", status: "active", detail: "t1abc…" },
      { label: "Streaming swap to ZEC · Maya", status: "pending" },
      { label: "Shielding into z-addr (z_sendmany)", status: "pending" },
      { label: "Shielded — anonymity set joined", status: "pending" },
    ];
    setProgress(steps);
    const h = await fakeTxHash("shield" + coin!.id);
    const tAddr = "t1" + Math.random().toString(36).slice(2, 18).padEnd(33, "x");
    const id = `v${Date.now()}`;
    const zec = amount.usd / 100;
    setTimeout(() => setProgress((p) => p.map((s, k) => k < 1 ? { ...s, status: "done" } : k === 1 ? { ...s, status: "active" } : s)), 800);
    setTimeout(() => setProgress((p) => p.map((s, k) => k < 2 ? { ...s, status: "done" } : k === 2 ? { ...s, status: "active" } : s)), 2200);
    setTimeout(() => {
      setProgress((p) => p.map((s) => ({ ...s, status: "done" })));
      shieldFunds({
        id, kind: "shield", fromCoinId: coin!.id, fromChainId: chain!.id,
        fromAmountUsd: amount.usd, zecAmount: zec, oneTimeTAddr: tAddr,
        hash: h, ts: Date.now(), fee: amount.usd * 0.02, status: "completed",
      });
      toast.success(`Shielded ${zec.toFixed(2)} ZEC into vault`);
    }, 4200);
  };

  const renderShield = () => {
    if (step === 0) return <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />;
    if (step === 1) {
      return (
        <ChainPicker
          coinId={coin?.id}
          filter={(c) => c.toVault !== "bridge" || c.id === "tron"}
          onPick={(c) => { setChain(c); setStep(2); }}
        />
      );
    }
    if (step === 2) {
      return (
        <View className="gap-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <View className="rounded-lg border border-success/20 bg-success/4 p-4">
            <Text className="text-success font-medium text-xs mb-1">UmbraVault · 2.00% all-in</Text>
            <Text className="text-muted-foreground text-xs">Funds transit one-time t-addr → ZEC z-addr. PSP free. Payout in any currency, any time.</Text>
          </View>
          <Pressable
            disabled={!amount.usd}
            onPress={() => setStep(3)}
            className="rounded-md bg-primary py-3 items-center disabled:opacity-50"
          >
            <Text className="text-sm font-medium text-white">Continue</Text>
          </Pressable>
        </View>
      );
    }
    if (step === 3) {
      const fee = vaultFee(amount.usd);
      return (
        <View className="gap-4">
          <View className="rounded-lg bg-white/3 border border-border p-5 items-center">
            <Text className="text-[11px] uppercase tracking-widest text-muted-foreground">Shielding</Text>
            <Text className="text-3xl font-mono font-semibold mt-2 text-foreground">{fmtUsd(amount.usd)}</Text>
            <Text className="text-xs text-success font-mono mt-1">→ ⓩ {(amount.usd / 100).toFixed(4)} ZEC</Text>
          </View>
          <View className="rounded-lg border border-border overflow-hidden">
            <Row l="From" v={`${coin?.symbol} · ${chain?.name}`} />
            <View className="border-t border-border"><Row l="Route" v={chain ? vaultRouteLabel(chain) : "Maya"} /></View>
            <View className="border-t border-border"><Row l="All-in fee" v={`${fmtUsd(fee.total)} · 2.00%`} /></View>
            <View className="border-t border-border"><Row l="You receive in vault" v={fmtUsd(amount.usd - fee.total)} /></View>
          </View>
          <Pressable onPress={shieldInit} className="rounded-md bg-primary py-3 items-center">
            <Text className="text-sm font-medium text-white">Shield now</Text>
          </Pressable>
        </View>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <View className="gap-4">
        <StatusTimeline steps={progress} />
        {done && (
          <Pressable onPress={onClose} className="rounded-md bg-primary py-3 items-center">
            <Text className="text-sm font-medium text-white">Done</Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title={title} onBack={back}>
      {kind === "receive" && renderReceive()}
      {kind === "send" && renderSend()}
      {kind === "swap" && renderSwap()}
      {kind === "shield" && renderShield()}
    </Sheet>
  );
}
