// Wallet action flows: Receive, Send, Swap, Shield (in one file, multi-step state machines)

import { useEffect, useMemo, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { CoinPicker, type PickedCoin } from "@/components/CoinPicker";
import { ChainPicker } from "@/components/ChainPicker";
import { CoinIcon } from "@/components/CoinIcon";
import { AmountInput } from "@/components/AmountInput";
import { StatusTimeline, type Step } from "@/components/StatusTimeline";
import { QR } from "@/components/QR";
import { Row } from "@/components/Row";
import { CHAINS, getChain, vaultRouteLabel, type Chain } from "@/lib/chains";
import { useApp } from "@/lib/store";
import { deriveAddress, fakeTxHash, shortAddr } from "@/lib/addresses";
import { swapFee, vaultFee } from "@/lib/fees";
import { useSimplePrices, fmtUsd } from "@/lib/markets";
import { Copy, Share2, ExternalLink, ArrowRight, Repeat } from "lucide-react";
import { toast } from "sonner";

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

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0); setCoin(null); setCoinTo(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setRecipient(""); setAddress(""); setHash(""); setProgress([]);
      }, 300);
    }
  }, [open]);

  // Derive receive address when coin+chain known (receive flow)
  useEffect(() => {
    if (kind !== "receive" || !chain || !seedHex) return;
    deriveAddress(seedHex, chain).then((d) => setAddress(d.address));
  }, [kind, chain, seedHex]);

  if (!kind) return null;
  const titles: Record<FlowKind, string[]> = {
    receive: ["Receive — pick coin", "Pick chain", "Your address"],
    send:    ["Send — pick coin", "Pick chain", "Amount", "Recipient", "Confirm", "Sending…"],
    swap:    ["Swap from", "Swap to", "Amount", "Confirm", "Swapping…"],
    shield:  ["Shield — pick asset", "Pick chain", "Amount", "Confirm", "Shielding to vault…"],
  };
  const title = titles[kind][step] ?? "";

  const back = step > 0 ? () => setStep((s) => s - 1) : undefined;

  const userBalance = coin ? holdings.find((h) => h.coinId === coin.id)?.amount : undefined;
  const livePrice = coin ? prices.data?.[coin.id]?.usd ?? coin.price : undefined;

  // ── RECEIVE ──────────────────────────────────────────
  const renderReceive = () => {
    if (step === 0) return <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />;
    if (step === 1) return <ChainPicker onPick={(c) => { setChain(c); setStep(2); }} />;
    return (
      <div className="space-y-4">
        <div className="grid place-items-center">
          <QR value={`${chain!.symbol.toLowerCase()}:${address}`} size={210} />
        </div>
        <div className="rounded-2xl border border-border divide-y divide-border">
          <Row l="Coin" v={<span className="flex items-center gap-2 justify-end">{coin?.symbol}<CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={18} /></span>} />
          <Row l="Network" v={chain?.name ?? ""} />
          <Row l="Address" v={<span className="font-mono break-all text-[11px]">{address}</span>} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { navigator.clipboard?.writeText(address); toast.success("Address copied"); }}
            className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-2"
          >
            <Copy className="size-4" /> Copy
          </button>
          <button
            onClick={() => { navigator.share?.({ title: "My address", text: address }).catch(() => {}); }}
            className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Share2 className="size-4" /> Share
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground text-center">
          Send only {coin?.symbol} on {chain?.name}. Other assets will be lost.
        </p>
      </div>
    );
  };

  // ── SEND ─────────────────────────────────────────────
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
    if (step === 1) return <ChainPicker onPick={(c) => { setChain(c); setStep(2); }} />;
    if (step === 2) {
      return (
        <div className="space-y-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable disabled:opacity-50">
            Continue
          </button>
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="space-y-3">
          <label className="text-xs text-muted-foreground">Recipient address</label>
          <input
            value={recipient} onChange={(e) => setRecipient(e.target.value)}
            placeholder={`${chain?.addressPrefix ?? ""}…`}
            className="w-full rounded-2xl bg-foreground/5 border border-border px-4 py-3 text-sm font-mono outline-none focus:border-primary"
          />
          <button
            onClick={async () => {
              const d = await deriveAddress((seedHex ?? "demo") + "self", chain!);
              setRecipient(d.address);
            }}
            className="text-xs text-primary"
          >
            Use one of my addresses
          </button>
          <button disabled={recipient.length < 10} onClick={() => setStep(4)} className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable disabled:opacity-50">
            Review
          </button>
        </div>
      );
    }
    if (step === 4) {
      const fee = chain?.fixedFeeUsd[1] ?? 0;
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">You're sending</p>
            <p className="text-3xl font-display font-semibold tabular-nums mt-1">{amount.token.toFixed(amount.token < 1 ? 6 : 4)} {coin?.symbol}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">≈ {fmtUsd(amount.usd)}</p>
          </div>
          <div className="rounded-2xl border border-border divide-y divide-border">
            <Row l="To" v={<span className="font-mono">{shortAddr(recipient)}</span>} />
            <Row l="Network" v={chain?.name ?? ""} />
            <Row l="Network fee" v={`~$${fee.toFixed(2)}`} />
            <Row l="Total" v={fmtUsd(amount.usd + fee)} />
          </div>
          <button
            onClick={() => { addContact({ id: `c${Date.now()}`, label: shortAddr(recipient), address: recipient, chainId: chain!.id }); sendInit(); }}
            className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable"
          >
            Slide to send
          </button>
        </div>
      );
    }
    // Step 5 — sending
    const done = progress.every((s) => s.status === "done");
    return (
      <div className="space-y-4">
        <StatusTimeline steps={progress} />
        {done && (
          <>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Hash" v={<span className="font-mono">{shortAddr(hash, 8, 6)}</span>} />
              <Row l="Block" v={<span className="font-mono">21,182,{Math.floor(Math.random() * 999)}</span>} />
            </div>
            <a href={chain!.explorerTx(hash)} target="_blank" rel="noopener" className="w-full pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-2">
              View on explorer <ExternalLink className="size-3.5" />
            </a>
            <button onClick={onClose} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold pressable">Done</button>
          </>
        )}
      </div>
    );
  };

  // ── SWAP ─────────────────────────────────────────────
  const swapPrices = useSimplePrices(
    [coin?.id, coinTo?.id].filter((x): x is string => !!x),
  );

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
      return (
        <div className="space-y-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={28} />
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <CoinIcon src={coinTo?.image} symbol={coinTo?.symbol ?? ""} size={28} />
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground">You receive</p>
              {(() => {
                const fromUsd = amount.usd;
                const toPrice = swapPrices.data?.[coinTo!.id]?.usd ?? 1;
                const fee = swapFee(fromUsd);
                const out = (fromUsd - fee.total) / toPrice;
                return (
                  <p className="text-sm font-mono">
                    ≈ {out.toFixed(out < 1 ? 6 : 4)} {coinTo?.symbol}
                  </p>
                );
              })()}
            </div>
          </div>
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable disabled:opacity-50">
            Continue
          </button>
        </div>
      );
    }
    if (step === 3) {
      const fee = swapFee(amount.usd);
      const toPrice = swapPrices.data?.[coinTo!.id]?.usd ?? 1;
      const out = (amount.usd - fee.total) / toPrice;
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-foreground/5 border border-border p-5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2"><CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={32} /><div><p className="text-xs text-muted-foreground">From</p><p className="font-mono">{amount.token.toFixed(4)} {coin?.symbol}</p></div></div>
              <Repeat className="size-4 text-primary" />
              <div className="flex items-center gap-2"><div className="text-right"><p className="text-xs text-muted-foreground">To</p><p className="font-mono">{out.toFixed(4)} {coinTo?.symbol}</p></div><CoinIcon src={coinTo?.image} symbol={coinTo?.symbol ?? ""} size={32} /></div>
            </div>
          </div>
          <div className="rounded-2xl border border-border divide-y divide-border">
            <Row l="Rate" v={<span className="font-mono">1 {coin?.symbol} = {(livePrice && toPrice ? livePrice / toPrice : 0).toFixed(6)} {coinTo?.symbol}</span>} />
            <Row l="Spread" v={fee.label} />
            <Row l="Slippage" v="0.50% max" />
            <Row l="Route" v="Maya · ZEC bridge" />
          </div>
          <button onClick={swapInit} className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable">
            Slide to swap
          </button>
        </div>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <div className="space-y-4">
        <StatusTimeline steps={progress} />
        {done && (
          <button onClick={onClose} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold pressable">Done</button>
        )}
      </div>
    );
  };

  // ── SHIELD ───────────────────────────────────────────
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
          filter={(c) => c.toVault !== "bridge" || c.id === "tron"}
          onPick={(c) => { setChain(c); setStep(2); }}
        />
      );
    }
    if (step === 2) {
      return (
        <div className="space-y-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <div className="rounded-2xl border border-shield/30 bg-shield/5 p-4 text-xs">
            <p className="text-shield font-medium mb-1">UmbraVault · 2.00% all-in</p>
            <p className="text-muted-foreground">Funds transit one-time t-addr → ZEC z-addr. PSP free. Payout in any currency, any time.</p>
          </div>
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable disabled:opacity-50">
            Continue
          </button>
        </div>
      );
    }
    if (step === 3) {
      const fee = vaultFee(amount.usd);
      return (
        <div className="space-y-4">
          <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Shielding</p>
            <p className="text-3xl font-display font-semibold mt-1">{fmtUsd(amount.usd)}</p>
            <p className="text-xs text-shield font-mono mt-1">→ ⓩ {(amount.usd / 100).toFixed(4)} ZEC</p>
          </div>
          <div className="rounded-2xl border border-border divide-y divide-border">
            <Row l="From" v={`${coin?.symbol} · ${chain?.name}`} />
            <Row l="Route" v={chain ? vaultRouteLabel(chain) : "Maya"} />
            <Row l="All-in fee" v={`${fmtUsd(fee.total)} · 2.00%`} />
            <Row l="You receive in vault" v={fmtUsd(amount.usd - fee.total)} />
          </div>
          <button onClick={shieldInit} className="w-full rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold pressable">
            Shield now
          </button>
        </div>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <div className="space-y-4">
        <StatusTimeline steps={progress} />
        {done && (
          <button onClick={onClose} className="w-full rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold pressable">Done</button>
        )}
      </div>
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
