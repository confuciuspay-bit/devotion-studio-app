import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PayFlow, type PayFlowKind } from "@/components/flows/PayFlow";
import {
  QrCode, Copy, Link2, Plus, Check, ChevronRight, Download, Share2,
  Settings2, Filter, Repeat, FileText, Receipt, LayoutGrid, Pause, Play, Trash2,
} from "lucide-react";
import { useApp, type PaymentRecord, type PaymentStatus, type Invoice } from "@/lib/store";
import { fmtTime } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { getChain } from "@/lib/chains";
import { toast } from "sonner";

export const Route = createFileRoute("/pay")({ component: PayPage });

const STATUS_LABEL: Record<PaymentStatus, string> = {
  INITIATED: "Awaiting", FUNDED: "Funded", LOCKED: "Locked",
  RELEASED: "Released", REFUNDED: "Refunded", EXPIRED: "Expired",
};

type Tab = "overview" | "payments" | "invoices" | "recurring" | "links";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "payments", label: "Payments", icon: Receipt },
  { id: "invoices", label: "Invoices", icon: FileText },
  { id: "recurring", label: "Recurring", icon: Repeat },
  { id: "links", label: "Links", icon: Link2 },
];

interface Subscription {
  id: string;
  name: string;          // plan name (e.g. "Pro plan")
  amountUsd: number;
  cadence: "weekly" | "monthly" | "yearly";
  token: string;
  active: boolean;
  subscribers: number;   // count of customers signed up via the link
  createdAt: number;
}

const SEED_SUBS: Subscription[] = [
  { id: "sub_001", name: "Pro plan", amountUsd: 49, cadence: "monthly", token: "USDC", active: true, subscribers: 128, createdAt: Date.now() - 21 * 86_400_000 },
  { id: "sub_002", name: "Enterprise", amountUsd: 1200, cadence: "monthly", token: "ZEC", active: true, subscribers: 6, createdAt: Date.now() - 60 * 86_400_000 },
  { id: "sub_003", name: "Newsletter", amountUsd: 19, cadence: "weekly", token: "USDT", active: false, subscribers: 42, createdAt: Date.now() - 90 * 86_400_000 },
];

function PayPage() {
  const { payments, monthlyVolumeUsd, vaultEnabled, updatePayment, invoices } = useApp((s) => s);
  const setVault = (b: boolean) => useApp.setState({ vaultEnabled: b });
  const { fmt } = useMoney();

  const [tab, setTab] = useState<Tab>("overview");
  const [open, setOpen] = useState<PaymentRecord | null>(null);
  const [openInvoice, setOpenInvoice] = useState<Invoice | null>(null);
  const [flow, setFlow] = useState<PayFlowKind | null>(null);
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  const [showSettings, setShowSettings] = useState(false);
  const [subs, setSubs] = useState<Subscription[]>(SEED_SUBS);
  const [allHistory, setAllHistory] = useState(false);

  const list = useMemo(
    () => (filter === "all" ? payments : payments.filter((p) => p.status === filter)),
    [payments, filter],
  );

  const stats = useMemo(() => {
    const released = payments.filter((p) => p.status === "RELEASED");
    const pending = payments.filter((p) => p.status === "INITIATED" || p.status === "FUNDED");
    return {
      releasedCount: released.length,
      releasedSum: released.reduce((s, p) => s + p.amountUsd, 0),
      pendingCount: pending.length,
      pendingSum: pending.reduce((s, p) => s + p.amountUsd, 0),
    };
  }, [payments]);

  return (
    <div className="animate-fade-in">
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
            {fmt(monthlyVolumeUsd, { maximumFractionDigits: 0 })}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="text-shield font-mono">
              {vaultEnabled ? "VAULT · 2.00% all-in" : "PSP · 0.50% per tx"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 stagger">
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

      {/* Sub-tabs */}
      <section className="px-5 mt-5">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pressable shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-medium ${
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-foreground/5 border-border text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Tab content */}
      <section className="px-5 mt-5 pb-32 animate-fade-in" key={tab}>
        {tab === "overview" && (
          <OverviewTab
            stats={stats}
            payments={payments.slice(0, 5)}
            invoiceCount={invoices.length}
            subCount={subs.filter((s) => s.active).length}
            onOpenPayment={setOpen}
            goTo={setTab}
            fmt={fmt}
          />
        )}

        {tab === "payments" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">All payments</h2>
              <div className="flex gap-1.5 text-[10px] uppercase tracking-wider">
                {(["all", "INITIATED", "FUNDED", "RELEASED"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className={`px-2 py-1 rounded-full border ${
                      filter === k
                        ? "bg-foreground text-background border-foreground"
                        : "bg-foreground/5 border-border text-muted-foreground"
                    }`}
                  >
                    {k === "all" ? "All" : STATUS_LABEL[k]}
                  </button>
                ))}
                <button className="px-2 py-1 rounded-full bg-foreground/5 border border-border text-muted-foreground">
                  <Filter className="size-3" />
                </button>
              </div>
            </div>
            <PaymentList list={list} onOpen={setOpen} fmt={fmt} />
          </>
        )}

        {tab === "invoices" && (
          <InvoicesTab invoices={invoices} fmt={fmt} onOpen={setOpenInvoice} onNew={() => setFlow("new")} />
        )}

        {tab === "recurring" && (
          <RecurringTab subs={subs} setSubs={setSubs} fmt={fmt} />
        )}

        {tab === "links" && (
          <LinksTab payments={payments} fmt={fmt} onNew={() => setFlow("link")} />
        )}
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
              <p className="text-3xl font-display font-semibold mt-1 tabular-nums">{fmt(open.amountUsd)}</p>
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
              <Row l="PSP fee" v={open.feeUsd ? fmt(open.feeUsd) : "$0.00 · waived"} />
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

      {/* Invoice detail */}
      <DetailSheet open={!!openInvoice} onClose={() => setOpenInvoice(null)} title={openInvoice?.number}>
        {openInvoice && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Invoice</p>
              <p className="text-3xl font-display font-semibold mt-1 tabular-nums">{fmt(openInvoice.amountUsd)}</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">{openInvoice.recipient}</p>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Issued" v={fmtTime(openInvoice.ts)} />
              <Row l="Hash v1" v={shortAddrLocal(openInvoice.hashV1)} mono />
              {openInvoice.hashV2 && <Row l="Hash v2" v={shortAddrLocal(openInvoice.hashV2)} mono />}
              {openInvoice.anchorTx && <Row l="Anchor" v={shortAddrLocal(openInvoice.anchorTx)} mono />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(openInvoice.hashV1); toast.success("Hash copied"); }}
                className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Copy className="size-4" /> Copy hash
              </button>
              <button
                onClick={() => toast.success("Invoice PDF ready")}
                className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Download className="size-4" /> PDF
              </button>
            </div>
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

/* ─────────────── Tab views ─────────────── */

function OverviewTab({
  stats, payments, invoiceCount, subCount, onOpenPayment, goTo, fmt,
}: {
  stats: { releasedCount: number; releasedSum: number; pendingCount: number; pendingSum: number };
  payments: PaymentRecord[];
  invoiceCount: number;
  subCount: number;
  onOpenPayment: (p: PaymentRecord) => void;
  goTo: (t: Tab) => void;
  fmt: (n: number, o?: Intl.NumberFormatOptions) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-2 stagger">
        <StatCard label="Released" value={fmt(stats.releasedSum, { maximumFractionDigits: 0 })} sub={`${stats.releasedCount} payments`} tone="shield" />
        <StatCard label="Pending" value={fmt(stats.pendingSum, { maximumFractionDigits: 0 })} sub={`${stats.pendingCount} awaiting`} />
        <StatCard label="Invoices" value={String(invoiceCount)} sub="anchored on-chain" onClick={() => goTo("invoices")} />
        <StatCard label="Recurring" value={String(subCount)} sub="active subs" onClick={() => goTo("recurring")} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent payments</h2>
          <button onClick={() => goTo("payments")} className="text-xs text-muted-foreground inline-flex items-center">
            See all <ChevronRight className="size-3" />
          </button>
        </div>
        <PaymentList list={payments} onOpen={onOpenPayment} fmt={fmt} compact />
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, tone, onClick,
}: { label: string; value: string; sub?: string; tone?: "shield"; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`pressable text-left rounded-2xl border border-border bg-card p-4 ${onClick ? "active:bg-foreground/5" : ""}`}
    >
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className={`text-xl font-display font-semibold mt-1 tabular-nums ${tone === "shield" ? "text-shield" : ""}`}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{sub}</p>}
    </Comp>
  );
}

function PaymentList({
  list, onOpen, fmt, compact,
}: {
  list: PaymentRecord[];
  onOpen: (p: PaymentRecord) => void;
  fmt: (n: number, o?: Intl.NumberFormatOptions) => string;
  compact?: boolean;
}) {
  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
        No payments yet.
      </div>
    );
  }
  return (
    <div className="space-y-2 stagger">
      {list.map((p) => {
        const ch = getChain(p.chainId);
        return (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
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
              <p className="text-sm font-mono">{fmt(p.amountUsd)}</p>
              {!compact && (
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {STATUS_LABEL[p.status]}
                </p>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        );
      })}
    </div>
  );
}

function InvoicesTab({
  invoices, fmt, onOpen, onNew,
}: {
  invoices: Invoice[];
  fmt: (n: number, o?: Intl.NumberFormatOptions) => string;
  onOpen: (i: Invoice) => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Invoices</h2>
        <button
          onClick={onNew}
          className="pressable inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>
      {invoices.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          <FileText className="size-6 mx-auto mb-2 opacity-60" />
          No invoices yet. Anchored invoices appear here with on-chain hash proof.
        </div>
      )}
      <div className="space-y-2 stagger">
        {invoices.map((i) => (
          <button
            key={i.id}
            onClick={() => onOpen(i)}
            className="w-full text-left pressable rounded-2xl border border-border bg-card px-4 py-3 flex items-center gap-3"
          >
            <div className="size-9 rounded-xl grid place-items-center bg-foreground/5 text-muted-foreground">
              <FileText className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{i.number}</p>
              <p className="text-[11px] text-muted-foreground font-mono truncate">{i.recipient} · {fmtTime(i.ts)}</p>
            </div>
            <p className="text-sm font-mono">{fmt(i.amountUsd)}</p>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

function RecurringTab({
  subs, setSubs, fmt,
}: {
  subs: Subscription[];
  setSubs: (s: Subscription[]) => void;
  fmt: (n: number, o?: Intl.NumberFormatOptions) => string;
}) {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<Subscription | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<Subscription["cadence"]>("monthly");
  const [token, setToken] = useState("USDC");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const subLink = (s: Subscription) => `${origin}/subscribe/${s.id}`;

  const reset = () => { setName(""); setAmount(""); setCadence("monthly"); setToken("USDC"); setCreated(null); };
  const create = () => {
    const amt = parseFloat(amount);
    if (!name.trim() || !amt || amt <= 0) {
      toast.error("Plan name and amount required");
      return;
    }
    const next: Subscription = {
      id: "sub_" + Math.random().toString(36).slice(2, 8),
      name: name.trim(),
      amountUsd: amt,
      cadence,
      token,
      active: true,
      subscribers: 0,
      createdAt: Date.now(),
    };
    setSubs([next, ...subs]);
    setCreated(next);
    toast.success("Subscription link created");
  };

  const toggle = (id: string) => {
    const s = subs.find((x) => x.id === id);
    setSubs(subs.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));
    toast(s?.active ? "Paused" : "Resumed");
  };
  const remove = (id: string) => {
    setSubs(subs.filter((s) => s.id !== id));
    toast("Subscription removed");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Recurring</h2>
        <button
          onClick={() => { reset(); setOpen(true); }}
          className="pressable inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Plus className="size-3.5" /> New link
        </button>
      </div>
      {subs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          No subscription links.
        </div>
      )}
      <div className="space-y-2 stagger">
        {subs.map((s) => {
          const link = subLink(s);
          return (
            <div
              key={s.id}
              className="rounded-2xl border border-border bg-card px-4 py-3 space-y-2"
            >
              <div className="flex items-center gap-3">
                <div className={`size-9 rounded-xl grid place-items-center ${s.active ? "bg-shield/15 text-shield" : "bg-foreground/5 text-muted-foreground"}`}>
                  <Repeat className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    {fmt(s.amountUsd)} · {s.cadence} · {s.token} · {s.subscribers} subs
                  </p>
                </div>
                <button
                  onClick={() => toggle(s.id)}
                  className="pressable size-8 grid place-items-center rounded-full bg-foreground/5 border border-border"
                  aria-label={s.active ? "Pause" : "Resume"}
                >
                  {s.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
                <button
                  onClick={() => remove(s.id)}
                  className="pressable size-8 grid place-items-center rounded-full bg-foreground/5 border border-border text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <p className="flex-1 font-mono text-[11px] text-muted-foreground truncate">{link}</p>
                <button
                  onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }}
                  className="pressable size-7 grid place-items-center rounded-full bg-foreground/5 border border-border"
                  aria-label="Copy link"
                >
                  <Copy className="size-3" />
                </button>
                <button
                  onClick={() => navigator.share?.({ title: s.name, text: link }).catch(() => {})}
                  className="pressable size-7 grid place-items-center rounded-full bg-foreground/5 border border-border"
                  aria-label="Share link"
                >
                  <Share2 className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DetailSheet open={open} onClose={() => { setOpen(false); reset(); }} title={created ? "Subscription link" : "New subscription link"}>
        {!created ? (
          <div className="space-y-3">
            <Field label="Plan name" value={name} onChange={setName} placeholder="Pro plan" />
            <Field label="Amount (USD)" value={amount} onChange={setAmount} placeholder="49" />
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">Billing cadence</p>
              <div className="grid grid-cols-3 gap-2">
                {(["weekly", "monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCadence(c)}
                    className={`pressable rounded-xl border py-2 text-xs font-medium capitalize ${cadence === c ? "bg-primary text-primary-foreground border-primary" : "bg-foreground/5 border-border"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">Settlement token</p>
              <div className="grid grid-cols-4 gap-2">
                {["USDC", "USDT", "ZEC", "ETH"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setToken(t)}
                    className={`pressable rounded-xl border py-2 text-xs font-mono ${token === t ? "bg-primary text-primary-foreground border-primary" : "bg-foreground/5 border-border"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Customers subscribe themselves through the hosted link. No customer info needed up front.
            </p>
            <button
              onClick={create}
              className="w-full pressable rounded-2xl bg-primary text-primary-foreground py-3.5 text-sm font-semibold"
            >
              Generate link
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 text-center">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{created.name}</p>
              <p className="text-3xl font-display font-semibold mt-1 tabular-nums">{fmt(created.amountUsd)}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-mono">
                {created.cadence} · {created.token}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-foreground/5 p-4">
              <p className="text-[11px] text-muted-foreground mb-1">Hosted subscription link</p>
              <p className="font-mono text-xs break-all">{subLink(created)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(subLink(created)); toast.success("Link copied"); }}
                className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-2"
              >
                <Copy className="size-4" /> Copy
              </button>
              <button
                onClick={() => navigator.share?.({ title: created.name, text: subLink(created) }).catch(() => {})}
                className="pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                <Share2 className="size-4" /> Share
              </button>
            </div>
            <button
              onClick={() => { setOpen(false); reset(); }}
              className="w-full text-sm text-muted-foreground pressable py-2"
            >
              Done
            </button>
          </div>
        )}
      </DetailSheet>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[11px] text-muted-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl bg-foreground/5 border border-border px-4 py-3 text-sm outline-none focus:border-primary"
      />
    </div>
  );
}

function LinksTab({
  payments, fmt, onNew,
}: {
  payments: PaymentRecord[];
  fmt: (n: number, o?: Intl.NumberFormatOptions) => string;
  onNew: () => void;
}) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Hosted checkout links</h2>
        <button
          onClick={onNew}
          className="pressable inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
        >
          <Plus className="size-3.5" /> New
        </button>
      </div>
      {payments.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          <Link2 className="size-6 mx-auto mb-2 opacity-60" />
          Generate a payment to share its hosted link.
        </div>
      )}
      <div className="space-y-2 stagger">
        {payments.map((p) => {
          const link = `${origin}/pay/${p.id}`;
          return (
            <div key={p.id} className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{p.reference || p.id}</p>
                <p className="text-sm font-mono">{fmt(p.amountUsd)}</p>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground break-all">{link}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }}
                  className="pressable flex-1 rounded-xl bg-foreground/5 border border-border py-2 text-xs font-medium inline-flex items-center justify-center gap-1"
                >
                  <Copy className="size-3.5" /> Copy
                </button>
                <button
                  onClick={() => navigator.share?.({ title: p.id, text: link }).catch(() => {})}
                  className="pressable flex-1 rounded-xl bg-primary text-primary-foreground py-2 text-xs font-semibold inline-flex items-center justify-center gap-1"
                >
                  <Share2 className="size-3.5" /> Share
                </button>
              </div>
            </div>
          );
        })}
      </div>
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
