import { useEffect, useState } from "react";
import { Sheet } from "@/components/Sheet";
import { CoinPicker, type PickedCoin } from "@/components/CoinPicker";
import { ChainPicker } from "@/components/ChainPicker";
import { CoinIcon } from "@/components/CoinIcon";
import { AmountInput } from "@/components/AmountInput";
import { StatusTimeline, type Step } from "@/components/StatusTimeline";
import { QR } from "@/components/QR";
import { Row } from "@/components/Row";
import { vaultRouteLabel, type Chain } from "@/lib/chains";
import { useApp } from "@/lib/store";
import { deriveAddress, fakeTxHash, shortAddr } from "@/lib/addresses";
import { swapFee, vaultFee } from "@/lib/fees";
import { useSimplePrices, fmtUsd } from "@/lib/markets";
import { Copy, Share2, ExternalLink, ArrowRight } from "lucide-react";
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
  const swapPrices = useSimplePrices([coin?.id, coinTo?.id].filter((x): x is string => !!x));

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(0); setCoin(null); setCoinTo(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setRecipient(""); setAddress(""); setHash(""); setProgress([]);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (kind !== "receive" || !chain || !seedHex) return;
    deriveAddress(seedHex, chain).then((d) => setAddress(d.address));
  }, [kind, chain, seedHex]);

  const titles: Record<FlowKind, string[]> = {
    receive: ["receive — coin", "network", "your address"],
    send:    ["send — coin", "network", "amount", "recipient", "review", "sending"],
    swap:    ["swap from", "swap to", "amount", "review", "swapping"],
    shield:  ["shield — asset", "network", "amount", "review", "shielding"],
  };

  if (!kind) return <Sheet open={open} onClose={onClose} title=""><div /></Sheet>;
  const title = titles[kind][step] ?? "";
  const back = step > 0 ? () => setStep((s) => s - 1) : undefined;

  const userBalance = coin ? holdings.find((h) => h.coinId === coin.id)?.amount : undefined;
  const livePrice = coin ? prices.data?.[coin.id]?.usd ?? coin.price : undefined;

  const renderReceive = () => {
    if (step === 0) return <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />;
    if (step === 1) return <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />;
    return (
      <div className="space-y-4">
        <div className="grid place-items-center">
          <QR value={`${chain!.symbol.toLowerCase()}:${address}`} size={200} />
        </div>
        <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
          <Row l="coin" v={<span className="flex items-center gap-2 justify-end">{coin?.symbol}<CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={16} /></span>} />
          <Row l="network" v={chain?.name ?? ""} />
          <Row l="address" v={<span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, wordBreak: "break-all" }}>{address}</span>} last />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { navigator.clipboard?.writeText(address); toast.success("Address copied"); }}
            className="btn-ghost py-2.5 flex items-center justify-center gap-2"
          >
            <Copy className="size-3" /> copy
          </button>
          <button
            onClick={() => { navigator.share?.({ title: "My address", text: address }).catch(() => {}); }}
            className="btn-primary py-2.5 flex items-center justify-center gap-2"
          >
            <Share2 className="size-3" /> share
          </button>
        </div>
        <p className="text-[11px] font-light text-center" style={{ color: "var(--text-tertiary)" }}>
          send only {coin?.symbol} on {chain?.name} · other assets will be lost
        </p>
      </div>
    );
  };

  const sendInit = async () => {
    setStep(5);
    const h = await fakeTxHash(coin!.id + recipient);
    setHash(h);
    const baseSteps: Step[] = [
      { label: "signing transaction", status: "active" },
      { label: "broadcasting to network", status: "pending" },
      { label: `confirming · ${chain!.confirmations} blocks`, status: "pending" },
      { label: "confirmed", status: "pending" },
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
        <div className="space-y-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="btn-primary w-full py-2.5 disabled:opacity-40">
            continue
          </button>
        </div>
      );
    }
    if (step === 3) {
      return (
        <div className="space-y-3">
          <p className="label">recipient address</p>
          <input
            value={recipient} onChange={(e) => setRecipient(e.target.value)}
            placeholder={`${chain?.addressPrefix ?? ""}…`}
            className="w-full"
            style={{ height: 36 }}
          />
          <button
            onClick={async () => {
              const d = await deriveAddress((seedHex ?? "demo") + "self", chain!);
              setRecipient(d.address);
            }}
            className="pressable text-[12px] transition-colors hover:opacity-80"
            style={{ color: "var(--accent)" }}
          >
            use one of my addresses
          </button>
          <button disabled={recipient.length < 10} onClick={() => setStep(4)} className="btn-primary w-full py-2.5 disabled:opacity-40">
            review
          </button>
        </div>
      );
    }
    if (step === 4) {
      const fee = chain?.fixedFeeUsd[1] ?? 0;
      return (
        <div className="space-y-4">
          <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
            <p className="label mb-2">you're sending</p>
            <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>
              {amount.token.toFixed(amount.token < 1 ? 6 : 4)} {coin?.symbol}
            </p>
            <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>
              ≈ {fmtUsd(amount.usd)}
            </p>
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <Row l="to" v={<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{shortAddr(recipient)}</span>} />
            <Row l="network" v={chain?.name ?? ""} />
            <Row l="network fee" v={`~$${fee.toFixed(2)}`} />
            <Row l="total" v={fmtUsd(amount.usd + fee)} last />
          </div>
          <button
            onClick={() => { addContact({ id: `c${Date.now()}`, label: shortAddr(recipient), address: recipient, chainId: chain!.id }); sendInit(); }}
            className="btn-primary w-full py-2.5"
          >
            confirm send
          </button>
        </div>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <div className="space-y-4">
        <StatusTimeline steps={progress} />
        {done && (
          <>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <Row l="hash" v={<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{shortAddr(hash, 8, 6)}</span>} last />
            </div>
            <a href={chain!.explorerTx(hash)} target="_blank" rel="noopener" className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2">
              explorer <ExternalLink className="size-3" />
            </a>
            <button onClick={onClose} className="btn-primary w-full py-2.5">done</button>
          </>
        )}
      </div>
    );
  };

  const swapInit = () => {
    setStep(4);
    const steps: Step[] = [
      { label: "quote locked", status: "done" },
      { label: "routing via " + (chain ? vaultRouteLabel(chain) : "Maya Protocol"), status: "active" },
      { label: "streaming swap", status: "pending" },
      { label: "settled", status: "pending" },
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
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
            <CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={22} />
            <ArrowRight className="size-3" style={{ color: "var(--text-tertiary)" }} />
            <CoinIcon src={coinTo?.image} symbol={coinTo?.symbol ?? ""} size={22} />
            <div className="flex-1 text-right">
              <p className="label">you receive</p>
              {(() => {
                const fromUsd = amount.usd;
                const toPrice = swapPrices.data?.[coinTo!.id]?.usd ?? 1;
                const fee = swapFee(fromUsd);
                const out = (fromUsd - fee.total) / toPrice;
                return (
                  <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>
                    ≈ {out.toFixed(out < 1 ? 6 : 4)} {coinTo?.symbol}
                  </p>
                );
              })()}
            </div>
          </div>
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="btn-primary w-full py-2.5 disabled:opacity-40">
            continue
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
          <div className="p-5" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
            <div className="flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <CoinIcon src={coin?.image} symbol={coin?.symbol ?? ""} size={22} />
                <div>
                  <p className="label">from</p>
                  <p style={{ color: "var(--text-primary)" }}>{amount.token.toFixed(4)} {coin?.symbol}</p>
                </div>
              </div>
              <ArrowRight className="size-3" style={{ color: "var(--text-tertiary)" }} />
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className="label">to</p>
                  <p style={{ color: "var(--text-primary)" }}>{out.toFixed(4)} {coinTo?.symbol}</p>
                </div>
                <CoinIcon src={coinTo?.image} symbol={coinTo?.symbol ?? ""} size={22} />
              </div>
            </div>
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <Row l="rate" v={`1 ${coin?.symbol} = ${(livePrice && toPrice ? livePrice / toPrice : 0).toFixed(6)} ${coinTo?.symbol}`} mono />
            <Row l="spread" v={fee.label} />
            <Row l="slippage" v="0.50% max" />
            <Row l="route" v="Maya · ZEC bridge" last />
          </div>
          <button onClick={swapInit} className="btn-primary w-full py-2.5">confirm swap</button>
        </div>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <div className="space-y-4">
        <StatusTimeline steps={progress} />
        {done && <button onClick={onClose} className="btn-primary w-full py-2.5">done</button>}
      </div>
    );
  };

  const shieldInit = async () => {
    setStep(4);
    const steps: Step[] = [
      { label: "generating one-time t-addr", status: "active" },
      { label: "streaming swap to ZEC · Maya", status: "pending" },
      { label: "shielding into z-addr (z_sendmany)", status: "pending" },
      { label: "shielded — anonymity set joined", status: "pending" },
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
        <div className="space-y-4">
          <AmountInput symbol={coin!.symbol} price={livePrice} balance={userBalance} onChange={setAmount} />
          <div className="px-3 py-3 text-[12px]" style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 4 }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="dot dot-ok" />
              <p className="font-medium" style={{ color: "var(--status-ok)" }}>UmbraVault · 2.00% all-in</p>
            </div>
            <p className="font-light" style={{ color: "var(--text-secondary)" }}>
              funds transit one-time t-addr → ZEC z-addr · payout in any currency, any time
            </p>
          </div>
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="btn-primary w-full py-2.5 disabled:opacity-40">
            continue
          </button>
        </div>
      );
    }
    if (step === 3) {
      const fee = vaultFee(amount.usd);
      return (
        <div className="space-y-4">
          <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
            <p className="label mb-2">shielding</p>
            <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmtUsd(amount.usd)}</p>
            <p className="text-[11px] font-light mt-1" style={{ color: "var(--status-ok)" }}>
              → {(amount.usd / 100).toFixed(4)} ZEC
            </p>
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <Row l="from" v={`${coin?.symbol} · ${chain?.name}`} />
            <Row l="route" v={chain ? vaultRouteLabel(chain) : "Maya"} />
            <Row l="all-in fee" v={`${fmtUsd(fee.total)} · 2.00%`} />
            <Row l="vault receives" v={fmtUsd(amount.usd - fee.total)} last />
          </div>
          <button onClick={shieldInit} className="btn-primary w-full py-2.5">shield now</button>
        </div>
      );
    }
    const done = progress.every((s) => s.status === "done");
    return (
      <div className="space-y-4">
        <StatusTimeline steps={progress} />
        {done && <button onClick={onClose} className="btn-primary w-full py-2.5">done</button>}
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
