import { useEffect, useState } from "react";
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
import { Copy, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export type VaultFlowKind = "withdraw" | "settings" | "address";

const ZEC_PRICE = 35;

const DELAYS = [
  { l: "now", v: 0 },
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
      setTimeout(() => {
        setStep(0); setCoin(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setRecipient(""); setDelay(0);
        setProgress([]); setRevealAddr(false);
      }, 300);
    }
  }, [open]);

  if (!kind) return <Sheet open={open} onClose={onClose} title=""><div /></Sheet>;

  const livePrice = coin ? prices.data?.[coin.id]?.usd ?? coin.price : undefined;
  const balanceUsd = vaultZec * ZEC_PRICE;

  const titles = {
    withdraw: ["withdraw — output asset", "output network", "amount", "recipient", "review", "processing"],
    settings: ["vault settings"],
    address: ["shielded address"],
  } as const;
  const title = kind === "withdraw" ? titles.withdraw[step] : titles[kind][0];
  const back = kind === "withdraw" && step > 0 ? () => setStep((s) => s - 1) : undefined;

  const finalize = async () => {
    if (!coin || !chain) return;
    setStep(5);
    const h = await fakeTxHash("payout" + Date.now());
    const steps: Step[] = [
      ...(delay > 0 ? [{ label: `privacy delay · ${DELAYS.find((d) => d.v === delay)?.l}`, status: "active" as const }] : []),
      { label: "z_sendmany · z-addr → t-addr", status: delay > 0 ? "pending" : "active" as const },
      { label: `streaming swap ZEC → ${coin.symbol} · ${vaultRouteLabel(chain)}`, status: "pending" as const },
      { label: `sending to ${shortAddr(recipient)}`, status: "pending" as const },
      { label: "settled", status: "pending" as const },
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
      {/* ADDRESS */}
      {kind === "address" && (
        <div className="space-y-4">
          <div
            className="px-3 py-3 text-[12px]"
            style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 4 }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="dot dot-ok" />
              <p className="font-medium" style={{ color: "var(--status-ok)" }}>per-merchant z-addr</p>
            </div>
            <p className="font-light" style={{ color: "var(--text-secondary)" }}>
              unique shielded address · never share publicly
            </p>
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <span className="label">address</span>
              <button
                onClick={() => setRevealAddr((v) => !v)}
                className="pressable flex items-center gap-1 text-[11px] transition-colors hover:opacity-80"
                style={{ color: "var(--accent)" }}
              >
                {revealAddr ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {revealAddr ? "hide" : "reveal"}
              </button>
            </div>
            <div className="px-4 py-3">
              <p
                className="text-[11px] leading-relaxed"
                style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", wordBreak: "break-all" }}
              >
                {revealAddr ? zAddr : zAddr.slice(0, 8) + "…" + zAddr.slice(-8)}
              </p>
            </div>
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(zAddr); toast.success("z-addr copied"); }}
            className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
          >
            <Copy className="size-3" /> copy address
          </button>
        </div>
      )}

      {/* SETTINGS */}
      {kind === "settings" && (
        <div className="space-y-4">
          <VaultToggle
            label="vault enabled"
            sub="when off, payments settle directly to wallet"
            value={vaultEnabled}
            onChange={(b) => useApp.setState({ vaultEnabled: b })}
          />
          <VaultToggle label="auto-payout" sub="payout to default address when balance > $10k" value={false} onChange={() => {}} />
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-dim)" }}>
              <p className="label mb-2">default privacy delay</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DELAYS.map((d) => (
                  <button
                    key={d.l}
                    onClick={() => toast.success(`Default set to ${d.l}`)}
                    className="pressable py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                    style={{ borderRadius: 4, border: "1px solid var(--border-default)", background: "var(--bg-base)", color: "var(--text-secondary)" }}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-4 py-3 text-[12px] space-y-2">
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>all-in fee</span>
                <span style={{ color: "var(--text-primary)" }}>2.00%</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>route</span>
                <span style={{ color: "var(--text-primary)" }}>Maya / THORChain</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--text-secondary)" }}>anonymity set</span>
                <span style={{ color: "var(--status-ok)" }}>4.9M ZEC</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WITHDRAW */}
      {kind === "withdraw" && step === 0 && (
        <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />
      )}
      {kind === "withdraw" && step === 1 && (
        <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />
      )}
      {kind === "withdraw" && step === 2 && coin && (
        <div className="space-y-4">
          <div className="px-4 py-3 text-center" style={{ background: "rgba(74,222,128,0.05)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 4 }}>
            <p className="label mb-1">vault balance</p>
            <p className="text-[15px]" style={{ color: "var(--status-ok)" }}>
              {vaultZec.toFixed(4)} ZEC · {fmtUsd(balanceUsd)}
            </p>
          </div>
          <AmountInput symbol={coin.symbol} price={livePrice} balance={balanceUsd / (livePrice || 1)} onChange={setAmount} />
          <div>
            <p className="label mb-2">privacy delay</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DELAYS.map((d) => (
                <button
                  key={d.l}
                  onClick={() => setDelay(d.v)}
                  className="pressable py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                  style={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: delay === d.v ? "var(--accent)" : "var(--border-default)",
                    background: delay === d.v ? "var(--accent-dim)" : "var(--bg-base)",
                    color: delay === d.v ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!amount.usd || amount.usd > balanceUsd}
            onClick={() => setStep(3)}
            className="btn-primary w-full py-2.5 disabled:opacity-40"
          >
            continue
          </button>
        </div>
      )}
      {kind === "withdraw" && step === 3 && (
        <div className="space-y-3">
          <p className="label">recipient address</p>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={`${chain?.addressPrefix ?? ""}…`}
            className="w-full"
            style={{ height: 36 }}
          />
          <button
            disabled={recipient.length < 10}
            onClick={() => setStep(4)}
            className="btn-primary w-full py-2.5 disabled:opacity-40"
          >
            review
          </button>
        </div>
      )}
      {kind === "withdraw" && step === 4 && coin && chain && (() => {
        const fee = vaultFee(amount.usd);
        const out = (amount.usd - fee.total) / (livePrice || 1);
        return (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">withdrawing</p>
              <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmtUsd(amount.usd)}</p>
              <p className="text-[11px] font-light mt-1" style={{ color: "var(--status-ok)" }}>
                → {out.toFixed(out < 1 ? 6 : 4)} {coin.symbol}
              </p>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <Row l="output" v={`${coin.symbol} · ${chain.name}`} />
              <Row l="to" v={<span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{shortAddr(recipient)}</span>} />
              <Row l="privacy delay" v={DELAYS.find((d) => d.v === delay)?.l ?? "now"} />
              <Row l="route" v={vaultRouteLabel(chain)} />
              <Row l="all-in fee" v={`${fmtUsd(fee.total)} · 2.00%`} />
              <Row l="you receive" v={fmtUsd(amount.usd - fee.total)} last />
            </div>
            <button onClick={finalize} className="btn-primary w-full py-2.5">confirm withdraw</button>
          </div>
        );
      })()}
      {kind === "withdraw" && step === 5 && (
        <div className="space-y-4">
          <StatusTimeline steps={progress} />
          {progress.every((s) => s.status === "done") && (
            <button onClick={onClose} className="btn-primary w-full py-2.5">done</button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function VaultToggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}
    >
      <button
        onClick={() => onChange(!value)}
        className="pressable mt-0.5 shrink-0 transition-colors"
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: value ? "var(--accent-dim)" : "var(--bg-raised)",
          border: `1px solid ${value ? "var(--accent)" : "var(--border-default)"}`,
          position: "relative",
        }}
        aria-pressed={value}
      >
        <span
          className="absolute top-0.5 transition-transform"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: value ? "var(--accent)" : "var(--text-tertiary)",
            transform: value ? "translateX(18px)" : "translateX(2px)",
          }}
        />
      </button>
      <div className="flex-1">
        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{label}</p>
        <p className="text-[11px] font-light mt-0.5" style={{ color: "var(--text-secondary)" }}>{sub}</p>
      </div>
    </div>
  );
}
