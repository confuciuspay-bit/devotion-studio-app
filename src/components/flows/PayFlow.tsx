import { useEffect, useState } from "react";
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
import { Copy, Share2, Link2, QrCode, Check } from "lucide-react";
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

  if (!kind) return <Sheet open={open} onClose={onClose} title=""><div /></Sheet>;

  const paymentLink = (p: PaymentRecord) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/pay/${p.id}`;

  const titles = ["new payment — asset", "network", "amount", "details", "review", "live"];
  const title =
    kind === "new" ? titles[step]
    : kind === "qr" ? "payment QR"
    : "share payment link";
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
      { label: "address generated", status: "done", detail: shortAddr(addr.address) },
      { label: "listening for funding", status: "active" },
      { label: vault ? "shielding to vault z-addr" : "settling to wallet", status: "pending" },
      { label: "released", status: "pending" },
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
            <p className="label mb-2">expires in</p>
            <div className="grid grid-cols-4 gap-1.5">
              {EXPIRIES.map((e) => (
                <button
                  key={e.l}
                  onClick={() => setExpiryMs(e.v)}
                  className="pressable py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                  style={{
                    borderRadius: 4,
                    border: "1px solid",
                    borderColor: expiryMs === e.v ? "var(--accent)" : "var(--border-default)",
                    background: expiryMs === e.v ? "var(--accent-dim)" : "var(--bg-base)",
                    color: expiryMs === e.v ? "var(--accent)" : "var(--text-secondary)",
                  }}
                >
                  {e.l}
                </button>
              ))}
            </div>
          </div>
          <button disabled={!amount.usd} onClick={() => setStep(3)} className="btn-primary w-full py-2.5 disabled:opacity-40">
            continue
          </button>
        </div>
      )}
      {kind === "new" && step === 3 && (
        <div className="space-y-3">
          <Field label="reference" value={reference} onChange={setReference} placeholder="PO-552 / order #" />
          <Field label="customer" value={customer} onChange={setCustomer} placeholder="name or 0x… (optional)" />
          <Field label="description" value={description} onChange={setDescription} placeholder="invoice line / memo" />
          <Field label="webhook URL" value={webhook} onChange={setWebhook} placeholder="https://… (optional)" mono />

          <div className="flex items-start gap-3 px-4 py-3" style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <button
              onClick={() => setVault((v) => !v)}
              className="pressable mt-0.5 shrink-0 transition-colors"
              style={{
                width: 18,
                height: 18,
                borderRadius: 4,
                border: `1px solid ${vault ? "var(--status-ok)" : "var(--border-default)"}`,
                background: vault ? "rgba(74,222,128,0.15)" : "var(--bg-base)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-pressed={vault}
            >
              {vault && <Check className="size-3" style={{ color: "var(--status-ok)" }} />}
            </button>
            <div className="flex-1">
              <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                settle to UmbraVault
              </p>
              <p className="text-[11px] font-light mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {vault
                  ? "2.00% all-in · PSP fee waived · funds shielded into ZEC z-addr"
                  : "0.50% PSP fee (min $0.05) · funds settle to wallet"}
              </p>
              {!vaultEnabled && vault && (
                <p className="text-[11px] mt-1" style={{ color: "var(--status-err)" }}>
                  vault disabled in settings — enable to use
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setStep(4)} className="btn-primary w-full py-2.5">review</button>
        </div>
      )}
      {kind === "new" && step === 4 && coin && chain && (
        <div className="space-y-4">
          <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
            <p className="label mb-2">request</p>
            <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmtUsd(amount.usd)}</p>
            <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>
              ≈ {amount.token.toFixed(amount.token < 1 ? 6 : 4)} {coin.symbol}
            </p>
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <Row l="asset" v={<span className="flex items-center gap-1.5 justify-end"><CoinIcon src={coin.image} symbol={coin.symbol} size={14} /> {coin.symbol}</span>} />
            <Row l="network" v={chain.name} />
            <Row l="expires" v={fmtTime(Date.now() + expiryMs)} />
            <Row l="settlement" v={vault ? "vault · 2.00% all-in" : "wallet · 0.50% PSP"} />
            {reference && <Row l="reference" v={reference} />}
            {customer && <Row l="customer" v={customer} />}
            {webhook && <Row l="webhook" v={<span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }} className="truncate max-w-[180px] inline-block">{webhook}</span>} last={!reference && !customer && !webhook} />}
          </div>
          <button onClick={finalize} className="btn-primary w-full py-2.5">create payment</button>
        </div>
      )}
      {kind === "new" && step === 5 && created && coin && chain && (
        <div className="space-y-4">
          <div className="grid place-items-center">
            <QR value={`${chain.symbol.toLowerCase()}:${created.address}?amount=${created.amountToken}`} size={200} />
          </div>
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
            <Row l="ID" v={created.id} mono />
            <Row l="address" v={<span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, wordBreak: "break-all" }}>{created.address}</span>} />
            <Row l="amount" v={`${created.amountToken.toFixed(4)} ${created.token}`} last />
          </div>
          <StatusTimeline steps={progress} />
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => { navigator.clipboard?.writeText(created.address); toast.success("Address copied"); }}
              className="btn-ghost py-3 flex flex-col items-center gap-1 text-[11px]"
            >
              <Copy className="size-3.5" /> address
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(paymentLink(created)); toast.success("Link copied"); }}
              className="btn-ghost py-3 flex flex-col items-center gap-1 text-[11px]"
            >
              <Link2 className="size-3.5" /> link
            </button>
            <button
              onClick={() => navigator.share?.({ title: created.id, text: paymentLink(created) }).catch(() => {})}
              className="btn-primary py-3 flex flex-col items-center gap-1 text-[11px]"
            >
              <Share2 className="size-3.5" /> share
            </button>
          </div>
          <button
            onClick={onClose}
            className="pressable w-full py-2 text-[12px] text-center transition-colors"
            style={{ color: "var(--text-secondary)" }}
          >
            done
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
      <p className="label mb-1.5">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
        style={{
          height: 36,
          fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
          fontSize: mono ? 11 : undefined,
        }}
      />
    </div>
  );
}

function QrFlow({ target }: { target: PaymentRecord | null }) {
  if (!target) return <Empty kind="qr" />;
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="label mb-1">{target.id}</p>
        <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmtUsd(target.amountUsd)}</p>
        <p className="text-[11px] font-light" style={{ color: "var(--text-secondary)" }}>
          {target.token} · {target.chainId}
        </p>
      </div>
      <div className="grid place-items-center">
        <QR value={`${target.token.toLowerCase()}:${target.address}?amount=${target.amountToken}`} size={200} />
      </div>
      <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
        <Row l="address" v={<span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, wordBreak: "break-all" }}>{target.address}</span>} />
        <Row l="status" v={target.status.toLowerCase()} last />
      </div>
      <button
        onClick={() => { navigator.clipboard?.writeText(target.address); toast.success("Address copied"); }}
        className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
      >
        <Copy className="size-3" /> copy address
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
      <div className="px-3 py-3" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
        <p className="label mb-1">hosted checkout link</p>
        <p
          className="text-[11px] leading-relaxed"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", wordBreak: "break-all" }}
        >
          {link}
        </p>
      </div>
      <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
        <Row l="invoice" v={target.id} mono />
        <Row l="amount" v={fmtUsd(target.amountUsd)} />
        <Row l="status" v={target.status.toLowerCase()} last />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }}
          className="btn-ghost py-2.5 flex items-center justify-center gap-2"
        >
          <Copy className="size-3" /> copy
        </button>
        <button
          onClick={() => navigator.share?.({ title: target.id, text: link }).catch(() => {})}
          className="btn-primary py-2.5 flex items-center justify-center gap-2"
        >
          <Share2 className="size-3" /> share
        </button>
      </div>
    </div>
  );
}

function Empty({ kind }: { kind: "qr" | "link" }) {
  return (
    <div className="py-16 text-center">
      <p className="label mb-2">no active payment</p>
      <p className="text-[12px] font-light" style={{ color: "var(--text-secondary)" }}>
        {kind === "qr" ? "create a payment to show its QR" : "create a payment to share a link"}
      </p>
    </div>
  );
}
