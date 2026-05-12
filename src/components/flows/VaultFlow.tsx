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
import { Copy, Shield, Clock, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

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
      {/* ── ADDRESS ─────────────────────────────────────── */}
      {kind === "address" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)] p-4 flex items-start gap-3">
            <Shield className="size-4 text-success mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Per-merchant z-addr</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                A unique shielded address. Never share publicly — funds are visible to whoever holds the viewing key.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Address</p>
              <button
                onClick={() => setRevealAddr((v) => !v)}
                className="text-xs text-primary flex items-center gap-1 hover:opacity-80 transition"
              >
                {revealAddr ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {revealAddr ? "Hide" : "Reveal"}
              </button>
            </div>
            <p className="font-mono text-xs break-all leading-relaxed text-foreground">
              {revealAddr ? zAddr : zAddr.slice(0, 8) + "…" + zAddr.slice(-8)}
            </p>
          </div>
          <button
            onClick={() => { navigator.clipboard?.writeText(zAddr); toast.success("z-addr copied"); }}
            className="w-full pressable rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition"
          >
            <Copy className="size-4" /> Copy address
          </button>
        </div>
      )}

      {/* ── SETTINGS ────────────────────────────────────── */}
      {kind === "settings" && (
        <div className="space-y-3">
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
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-4">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2">Default privacy delay</p>
            <div className="grid grid-cols-3 gap-2">
              {DELAYS.map((d) => (
                <button
                  key={d.l}
                  onClick={() => toast.success(`Default set to ${d.l}`)}
                  className="pressable rounded-md border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)] py-2 text-xs text-foreground hover:bg-[rgba(255,255,255,0.07)] transition"
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-4 text-xs space-y-2">
            <p className="flex justify-between text-muted-foreground">
              <span>All-in fee</span><b className="text-foreground">2.00%</b>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>Route</span><b className="text-foreground">Maya / THORChain</b>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>Anonymity set</span><b className="text-success">4.9M ZEC</b>
            </p>
          </div>
        </div>
      )}

      {/* ── WITHDRAW ────────────────────────────────────── */}
      {kind === "withdraw" && step === 0 && (
        <CoinPicker onPick={(c) => { setCoin(c); setStep(1); }} />
      )}
      {kind === "withdraw" && step === 1 && (
        <ChainPicker coinId={coin?.id} onPick={(c) => { setChain(c); setStep(2); }} />
      )}
      {kind === "withdraw" && step === 2 && coin && (
        <div className="space-y-4">
          <div className="rounded-lg border border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.04)] p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Vault balance</p>
            <p className="text-success font-mono mt-0.5">ⓩ {vaultZec.toFixed(4)} · {fmtUsd(balanceUsd)}</p>
          </div>
          <AmountInput symbol={coin.symbol} price={livePrice} balance={balanceUsd / (livePrice || 1)} onChange={setAmount} />
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
              <Clock className="size-3" /> Privacy delay
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DELAYS.map((d) => (
                <button
                  key={d.l}
                  onClick={() => setDelay(d.v)}
                  className={`pressable rounded-md border py-2 text-xs transition ${delay === d.v ? "bg-primary text-primary-foreground border-primary" : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground"}`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!amount.usd || amount.usd > balanceUsd}
            onClick={() => setStep(3)}
            className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable disabled:opacity-50 hover:bg-primary/90 transition"
          >
            Continue
          </button>
        </div>
      )}
      {kind === "withdraw" && step === 3 && (
        <div className="space-y-3">
          <label className="text-xs text-muted-foreground">Recipient address</label>
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder={`${chain?.addressPrefix ?? ""}…`}
            className="w-full rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] px-4 py-3 text-sm font-mono outline-none focus:border-primary/50 transition text-foreground placeholder:text-muted-foreground"
          />
          <button
            disabled={recipient.length < 10}
            onClick={() => setStep(4)}
            className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable disabled:opacity-50 hover:bg-primary/90 transition"
          >
            Review
          </button>
        </div>
      )}
      {kind === "withdraw" && step === 4 && coin && chain && (() => {
        const fee = vaultFee(amount.usd);
        const out = (amount.usd - fee.total) / (livePrice || 1);
        return (
          <div className="space-y-4">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 text-center">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Withdrawing</p>
              <p className="text-3xl font-mono font-semibold mt-2 text-foreground">{fmtUsd(amount.usd)}</p>
              <p className="text-xs text-success font-mono mt-1">→ {out.toFixed(out < 1 ? 6 : 4)} {coin.symbol}</p>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
              <Row l="Output" v={`${coin.symbol} · ${chain.name}`} />
              <Row l="To" v={<span className="font-mono">{shortAddr(recipient)}</span>} />
              <Row l="Privacy delay" v={DELAYS.find((d) => d.v === delay)?.l ?? "Now"} />
              <Row l="Route" v={vaultRouteLabel(chain)} />
              <Row l="All-in fee" v={`${fmtUsd(fee.total)} · 2.00%`} />
              <Row l="You receive" v={fmtUsd(amount.usd - fee.total)} />
            </div>
            <button
              onClick={finalize}
              className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable flex items-center justify-center gap-2 hover:bg-primary/90 transition"
            >
              <Lock className="size-4" /> Slide to withdraw
            </button>
          </div>
        );
      })()}
      {kind === "withdraw" && step === 5 && (
        <div className="space-y-4">
          <StatusTimeline steps={progress} />
          {progress.every((s) => s.status === "done") && (
            <button
              onClick={onClose}
              className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable hover:bg-primary/90 transition"
            >
              Done
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

function VaultToggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-4 flex items-start gap-3">
      <button
        onClick={() => onChange(!value)}
        className={`mt-0.5 w-9 h-5 rounded-full p-0.5 transition ${value ? "bg-primary" : "bg-[rgba(255,255,255,0.12)]"}`}
        aria-pressed={value}
      >
        <span className={`block size-4 rounded-full bg-white transition-transform ${value ? "translate-x-4" : ""}`} />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
