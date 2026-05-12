import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { PayFlow, type PayFlowKind } from "@/components/flows/PayFlow";
import { QrCode, Copy, Link2, Plus, Check, ChevronRight, Download, Share2, Settings2, Filter } from "lucide-react";
import { useApp, type PaymentRecord, type PaymentStatus } from "@/lib/store";
import { fmtUsd, fmtTime, maskValue } from "@/lib/markets";
import { getChain } from "@/lib/chains";
import { toast } from "sonner";

export const Route = createFileRoute("/pay")({ component: PayPage });

const STATUS_LABEL: Record<PaymentStatus, string> = {
  INITIATED: "Awaiting", FUNDED: "Funded", LOCKED: "Locked",
  RELEASED: "Released", REFUNDED: "Refunded", EXPIRED: "Expired",
};

function PayPage() {
  const { payments, monthlyVolumeUsd, vaultEnabled, hideBalances, updatePayment } = useApp((s) => s);
  const setVault = (b: boolean) => useApp.setState({ vaultEnabled: b });
  const hidden = hideBalances;

  const [open, setOpen] = useState<PaymentRecord | null>(null);
  const [flow, setFlow] = useState<PayFlowKind | null>(null);
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [showSettings, setShowSettings] = useState(false);

  const list = useMemo(
    () => (filter === "all" ? payments : payments.filter((p) => p.status === filter)),
    [payments, filter],
  );

  const fmt = (s: string) => (hidden ? maskValue(s) : s);

  return (
    <div>
      <AppHeader subtitle="UmbraPay" />
      <section className="px-5">
        <div className="rounded-3xl border border-border p-6 bg-[image:var(--gradient-card)] grain relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              This month · gross
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="size-7 rounded-full bg-foreground/5 border border-border grid place-items-center"
              aria-label="PSP settings"
            >
              <Settings2 className="size-3.5" />
            </button>
          </div>
          <h1 className="text-4xl font-display font-semibold mt-2 tabular-nums">
            {fmt(fmtUsd(monthlyVolumeUsd, { maximumFractionDigits: 0 }))}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-shield font-mono">
              {vaultEnabled ? "VAULT · 2.00% all-in" : "PSP · 0.50% per tx"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <button
              onClick={() => setFlow("new")}
              className="pressable bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold flex flex-col items-center gap-1"
            >
              <Plus className="size-4" /> New
            </button>
            <button
              onClick={() => setFlow("qr")}
              className="pressable bg-foreground/5 border border-border rounded-2xl py-3 text-sm font-medium flex flex-col items-center gap-1"
            >
              <QrCode className="size-4" /> QR
            </button>
            <button
              onClick={() => setFlow("link")}
              className="pressable bg-foreground/5 border border-border rounded-2xl py-3 text-sm font-medium flex flex-col items-center gap-1"
            >
              <Link2 className="size-4" /> Link
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Payments</h2>
          <div className="flex gap-1.5 text-[10px] uppercase tracking-wider">
            {(["all", "INITIATED", "FUNDED", "RELEASED"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-2 py-1 rounded-full border ${filter === k ? "bg-foreground text-background border-foreground" : "bg-foreground/5 border-border text-muted-foreground"}`}
              >
                {k === "all" ? "All" : STATUS_LABEL[k]}
              </button>
            ))}
            <button className="px-2 py-1 rounded-full bg-foreground/5 border border-border text-muted-foreground">
              <Filter className="size-3" />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {list.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              No payments yet. Tap <b>+ New</b> to create one.
            </div>
          )}
          {list.map((p) => {
            const ch = getChain(p.chainId);
            return (
              <button
                key={p.id}
                onClick={() => setOpen(p)}
                className="w-full text-left pressable rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3 active:bg-foreground/5"
              >
                <div className={`size-9 rounded-xl grid place-items-center ${
                  p.status === "RELEASED" ? "bg-shield/15 text-shield"
                  : p.status === "FUNDED" ? "bg-primary/15 text-primary"
                  : p.status === "EXPIRED" || p.status === "REFUNDED" ? "bg-destructive/15 text-destructive"
                  : "bg-foreground/5 text-muted-foreground"
                }`}>
                  <Check className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.reference || p.customer || p.id}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {p.id} · {p.token} · {ch?.shortName ?? p.chainId}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono">{fmt(fmtUsd(p.amountUsd))}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {STATUS_LABEL[p.status]}
                  </p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </section>

      <PayFlow open={!!flow} kind={flow} onClose={() => setFlow(null)} />

      {/* Payment detail */}
      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.id}>
        {open && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {open.reference || "Payment"}
              </p>
              <p className="text-3xl font-display font-semibold mt-1 tabular-nums">{fmt(fmtUsd(open.amountUsd))}</p>
              <span className="inline-block mt-2 text-[10px] font-mono text-shield bg-shield/10 px-2 py-0.5 rounded-full">
                {STATUS_LABEL[open.status]}
              </span>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Created" v={fmtTime(open.createdAt)} />
              <Row l="Expires" v={fmtTime(open.expiresAt)} />
              {open.customer && <Row l="Customer" v={open.customer} mono />}
              <Row l="Network" v={getChain(open.chainId)?.name ?? open.chainId} />
              <Row l="Address" v={shortAddrLocal(open.address)} mono />
              <Row l="PSP fee" v={open.feeUsd ? fmtUsd(open.feeUsd) : "$0.00 · waived"} />
              {open.hash && <Row l="Hash" v={shortAddrLocal(open.hash)} mono />}
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Settlement</p>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono">{open.token}</span>
                <span>→</span>
                <span className="text-shield font-mono">
                  {open.vault ? "ZEC z-addr" : "Wallet"}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(open.address); toast.success("Address copied"); }}
                className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-xs font-medium flex flex-col items-center gap-1"
              >
                <Copy className="size-4" /> Address
              </button>
              <button
                onClick={() => navigator.share?.({ title: open.id, text: `${window.location.origin}/pay/${open.id}` }).catch(() => {})}
                className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-xs font-medium flex flex-col items-center gap-1"
              >
                <Share2 className="size-4" /> Share
              </button>
              <button
                onClick={() => {
                  if (open.status === "RELEASED") {
                    updatePayment(open.id, { status: "REFUNDED" });
                    toast.success("Refund initiated");
                  } else if (open.status === "INITIATED" || open.status === "FUNDED") {
                    updatePayment(open.id, { status: "EXPIRED" });
                    toast("Payment cancelled");
                  }
                  setOpen(null);
                }}
                className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-xs font-semibold"
              >
                {open.status === "RELEASED" ? "Refund" : "Cancel"}
              </button>
            </div>
            {open.hash && (
              <a
                href={getChain(open.chainId)?.explorerTx(open.hash) ?? "#"}
                target="_blank" rel="noopener"
                className="w-full pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-2"
              >
                View on explorer <Download className="size-3.5 rotate-180" />
              </a>
            )}
          </div>
        )}
      </DetailSheet>

      {/* PSP settings */}
      <DetailSheet open={showSettings} onClose={() => setShowSettings(false)} title="PSP settings">
        <div className="space-y-4">
          <Toggle
            label="Auto-shield to vault"
            sub="2.00% all-in. Funds settle as ZEC into a per-merchant z-addr."
            value={vaultEnabled}
            onChange={setVault}
          />
          <Toggle
            label="Email receipts"
            sub="Send a receipt PDF to the customer when payment is released."
            value={true}
            onChange={() => {}}
          />
          <Toggle
            label="Webhook signing"
            sub="HMAC-SHA256 signed callbacks (umbra-signature header)."
            value={true}
            onChange={() => {}}
          />
          <div className="rounded-2xl border border-border p-4 space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">API key</p>
            <p className="font-mono text-xs break-all">umb_live_••••••••••••••rk2A</p>
            <button
              onClick={() => { navigator.clipboard?.writeText("umb_live_demo_rk2A"); toast.success("API key copied"); }}
              className="text-xs text-primary"
            >
              Copy
            </button>
          </div>
        </div>
      </DetailSheet>
    </div>
  );
}

function Toggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-border p-4 flex items-start gap-3">
      <button
        onClick={() => onChange(!value)}
        className={`mt-0.5 w-9 h-5 rounded-full p-0.5 transition ${value ? "bg-primary" : "bg-foreground/15"}`}
        aria-pressed={value}
      >
        <span className={`block size-4 rounded-full bg-background transition-transform ${value ? "translate-x-4" : ""}`} />
      </button>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function shortAddrLocal(s: string) {
  if (!s) return "";
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
}

function Row({ l, v, mono }: { l: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{l}</span>
      <span className={`text-sm text-right ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
