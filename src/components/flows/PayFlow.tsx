import { useEffect, useMemo, useState } from "react";
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
import { Copy, Share2, ExternalLink, Link2, QrCode, Check } from "lucide-react";
import { toast } from "sonner";

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
      setTimeout(() => {
        setStep(0); setCoin(null); setChain(null);
        setAmount({ token: 0, usd: 0 }); setReference(""); setCustomer("");
        setDescription(""); setVault(true); setWebhook(""); setCreated(null);
        setProgress([]);
      }, 300);
    }
  }, [open]);

  const target =
    focusPayment ??
    payments.find((p) => p.status === "INITIATED" || p.status === "FUNDED") ??
    payments[0] ??
    null;

  if (!kind) {
    return <Sheet open={open} onClose={onClose} title=""><div /></Sheet>;
  }

  const paymentLink = (p: PaymentRecord) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${p.id}`;

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
        <div className="space-y-4">
          <AmountInput symbol={coin.symbol} price={livePrice} onChange={setAmount} />
          <div>
            <p className="text-[11px] text-muted-foreground mb-2">Expires in</p>
            <div className="grid grid-cols-4 gap-2">
              {EXPIRIES.map((e) => (
                <button
                  key={e.l}
                  onClick={() => setExpiryMs(e.v)}
                  className={`pressable rounded-md border py-2 text-xs font-medium transition ${expiryMs === e.v ? "bg-primary text-primary-foreground border-primary" : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.06)] text-muted-foreground hover:text-foreground"}`}
                >
                  {e.l}
                </button>
              ))}
            </div>
          </div>
          <button
            disabled={!amount.usd}
            onClick={() => setStep(3)}
            className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable disabled:opacity-50 hover:bg-primary/90 transition"
          >
            Continue
          </button>
        </div>
      )}
      {kind === "new" && step === 3 && (
        <div className="space-y-3">
          <Field label="Reference" value={reference} onChange={setReference} placeholder="PO-552 / order #" />
          <Field label="Customer" value={customer} onChange={setCustomer} placeholder="name or 0x… address (optional)" />
          <Field label="Description" value={description} onChange={setDescription} placeholder="Invoice line / memo" />
          <Field label="Webhook URL" value={webhook} onChange={setWebhook} placeholder="https://… (optional)" mono />

          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] p-4 flex items-start gap-3">
            <button
              onClick={() => setVault((v) => !v)}
              className={`mt-0.5 size-5 rounded grid place-items-center border transition ${vault ? "bg-success border-success text-black" : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.08)]"}`}
              aria-pressed={vault}
            >
              {vault && <Check className="size-3.5" />}
            </button>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Settle to UmbraVault</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {vault
                  ? "2.00% all-in. PSP fee waived. Funds shielded into ZEC z-addr."
                  : `${(0.5).toFixed(2)}% PSP fee (min $0.05). Funds settle to wallet.`}
              </p>
              {!vaultEnabled && vault && (
                <p className="text-[11px] text-destructive mt-1">Vault disabled in settings — enable to use.</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep(4)}
            className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable hover:bg-primary/90 transition"
          >
            Review
          </button>
        </div>
      )}
      {kind === "new" && step === 4 && coin && chain && (
        <div className="space-y-4">
          <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Request</p>
            <p className="text-3xl font-mono font-semibold mt-2 tabular-nums text-foreground">{fmtUsd(amount.usd)}</p>
            <p className="text-xs text-muted-foreground font-mono mt-1">≈ {amount.token.toFixed(amount.token < 1 ? 6 : 4)} {coin.symbol}</p>
          </div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
            <Row l="Asset" v={<span className="flex items-center gap-1.5 justify-end"><CoinIcon src={coin.image} symbol={coin.symbol} size={16} /> {coin.symbol}</span>} />
            <Row l="Network" v={chain.name} />
            <Row l="Expires" v={fmtTime(Date.now() + expiryMs)} />
            <Row l="Settlement" v={vault ? "Vault · 2.00% all-in" : "Wallet · 0.50% PSP"} />
            {reference && <Row l="Reference" v={reference} />}
            {customer && <Row l="Customer" v={customer} />}
            {webhook && <Row l="Webhook" v={<span className="font-mono text-[10px] truncate max-w-[180px] inline-block">{webhook}</span>} />}
          </div>
          <button
            onClick={finalize}
            className="w-full rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium pressable hover:bg-primary/90 transition"
          >
            Create payment
          </button>
        </div>
      )}
      {kind === "new" && step === 5 && created && coin && chain && (
        <div className="space-y-4">
          <div className="grid place-items-center">
            <QR value={`${chain.symbol.toLowerCase()}:${created.address}?amount=${created.amountToken}`} size={200} />
          </div>
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
            <Row l="ID" v={created.id} mono />
            <Row l="Address" v={<span className="font-mono break-all text-[11px]">{created.address}</span>} />
            <Row l="Amount" v={`${created.amountToken.toFixed(4)} ${created.token}`} />
          </div>
          <StatusTimeline steps={progress} />
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { navigator.clipboard?.writeText(created.address); toast.success("Address copied"); }}
              className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-3 text-xs font-medium flex flex-col items-center gap-1 hover:bg-[rgba(255,255,255,0.07)] transition"
            >
              <Copy className="size-4" /> Address
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(paymentLink(created)); toast.success("Link copied"); }}
              className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-3 text-xs font-medium flex flex-col items-center gap-1 hover:bg-[rgba(255,255,255,0.07)] transition"
            >
              <Link2 className="size-4" /> Link
            </button>
            <button
              onClick={() => navigator.share?.({ title: created.id, text: paymentLink(created) }).catch(() => {})}
              className="pressable rounded-md bg-primary text-primary-foreground py-3 text-xs font-medium flex flex-col items-center gap-1 hover:bg-primary/90 transition"
            >
              <Share2 className="size-4" /> Share
            </button>
          </div>
          <button onClick={onClose} className="w-full text-sm text-muted-foreground pressable py-2 hover:text-foreground transition">
            Done
          </button>
        </div>
      )}
    </Sheet>
  );
}

function Field({
  label, value, onChange, placeholder, mono,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] px-4 py-3 text-sm outline-none focus:border-primary/50 transition text-foreground placeholder:text-muted-foreground ${mono ? "font-mono text-xs" : ""}`}
      />
    </div>
  );
}

function QrFlow({ target }: { target: PaymentRecord | null }) {
  if (!target) return <Empty kind="qr" />;
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{target.id}</p>
        <p className="text-2xl font-mono font-semibold tabular-nums mt-0.5 text-foreground">{fmtUsd(target.amountUsd)}</p>
        <p className="text-[11px] text-muted-foreground">{target.token} · {target.chainId}</p>
      </div>
      <div className="grid place-items-center">
        <QR value={`${target.token.toLowerCase()}:${target.address}?amount=${target.amountToken}`} size={220} />
      </div>
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
        <Row l="Address" v={<span className="font-mono break-all text-[11px]">{target.address}</span>} />
        <Row l="Status" v={target.status} />
      </div>
      <button
        onClick={() => { navigator.clipboard?.writeText(target.address); toast.success("Address copied"); }}
        className="w-full pressable rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition"
      >
        <Copy className="size-4" /> Copy address
      </button>
    </div>
  );
}

function LinkFlow({
  target, buildLink,
}: { target: PaymentRecord | null; buildLink: (p: PaymentRecord) => string }) {
  if (!target) return <Empty kind="link" />;
  const link = buildLink(target);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4">
        <p className="text-[11px] text-muted-foreground mb-1">Hosted checkout link</p>
        <p className="font-mono text-xs break-all text-foreground">{link}</p>
      </div>
      <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
        <Row l="Invoice" v={target.id} mono />
        <Row l="Amount" v={fmtUsd(target.amountUsd)} />
        <Row l="Status" v={target.status} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }}
          className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[rgba(255,255,255,0.07)] transition"
        >
          <Copy className="size-4" /> Copy
        </button>
        <button
          onClick={() => navigator.share?.({ title: target.id, text: link }).catch(() => {})}
          className="pressable rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition"
        >
          <Share2 className="size-4" /> Share
        </button>
      </div>
    </div>
  );
}

function Empty({ kind }: { kind: "qr" | "link" }) {
  return (
    <div className="py-12 text-center text-sm text-muted-foreground space-y-2">
      <div className="mx-auto size-10 grid place-items-center rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)]">
        {kind === "qr" ? <QrCode className="size-4" /> : <Link2 className="size-4" />}
      </div>
      <p>No active payment yet.</p>
      <p className="text-xs">Tap <b>+ New</b> to create one.</p>
    </div>
  );
}
