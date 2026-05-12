import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PayFlow, type PayFlowKind } from "@/components/flows/PayFlow";
import { QrCode, Copy, Link2, Plus, ChevronRight, Download, Share2, Settings2, Repeat, FileText, Receipt, LayoutGrid, Pause, Play, Trash2 } from "lucide-react";
import { useApp, type PaymentRecord, type PaymentStatus, type Invoice } from "@/lib/store";
import { fmtTime } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { getChain } from "@/lib/chains";
import { toast } from "sonner";

export const Route = createFileRoute("/pay")({ component: PayPage });

const STATUS_LABEL: Record<PaymentStatus, string> = {
  INITIATED: "awaiting", FUNDED: "funded", LOCKED: "locked",
  RELEASED: "released", REFUNDED: "refunded", EXPIRED: "expired",
};

const STATUS_COLOR: Record<PaymentStatus, string> = {
  INITIATED: "var(--text-tertiary)", FUNDED: "var(--accent)",
  LOCKED: "var(--status-warn)", RELEASED: "var(--status-ok)",
  REFUNDED: "var(--text-secondary)", EXPIRED: "var(--status-err)",
};

type Tab = "overview" | "payments" | "invoices" | "recurring" | "links";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "overview" },
  { id: "payments", label: "payments" },
  { id: "invoices", label: "invoices" },
  { id: "recurring", label: "recurring" },
  { id: "links", label: "links" },
];

interface Subscription {
  id: string;
  name: string;
  amountUsd: number;
  cadence: "weekly" | "monthly" | "yearly";
  token: string;
  active: boolean;
  subscribers: number;
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
    <div>
      <AppHeader subtitle="UmbraPay" />

      <section className="px-5">
        <div style={{ border: "1px solid var(--border-default)", borderRadius: 4, padding: "16px" }}>
          <div className="flex items-center justify-between mb-1">
            <p className="label">this month · gross</p>
            <button
              onClick={() => setShowSettings(true)}
              className="pressable"
              style={{ color: "var(--text-secondary)" }}
              aria-label="PSP settings"
            >
              <Settings2 className="size-3.5" />
            </button>
          </div>
          <p className="text-[28px]" style={{ color: "var(--text-primary)" }}>
            {fmt(monthlyVolumeUsd, { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] font-light mt-0.5" style={{ color: vaultEnabled ? "var(--status-ok)" : "var(--text-secondary)" }}>
            {vaultEnabled ? "vault · 2.00% all-in" : "PSP · 0.50% per tx"}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              onClick={() => setFlow("new")}
              className="btn-primary py-2.5 flex flex-col items-center gap-1 text-[11px] uppercase tracking-widest"
            >
              <Plus className="size-3.5" /> new
            </button>
            <button
              onClick={() => setFlow("qr")}
              className="btn-ghost py-2.5 flex flex-col items-center gap-1 text-[11px] uppercase tracking-widest"
            >
              <QrCode className="size-3.5" /> QR
            </button>
            <button
              onClick={() => setFlow("link")}
              className="btn-ghost py-2.5 flex flex-col items-center gap-1 text-[11px] uppercase tracking-widest"
            >
              <Link2 className="size-3.5" /> link
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="pressable shrink-0 px-2.5 py-1 text-[11px] uppercase tracking-widest transition-colors"
                style={{
                  borderRadius: 4,
                  border: "1px solid",
                  borderColor: active ? "var(--accent)" : "var(--border-default)",
                  background: active ? "var(--accent-dim)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  fontWeight: 300,
                }}
              >
                {t.label}
              </button>
            );
          })}
          <button
            onClick={() => setAllHistory(true)}
            className="pressable shrink-0 px-2.5 py-1 text-[11px] uppercase tracking-widest"
            style={{
              borderRadius: 4,
              border: "1px solid var(--border-default)",
              color: "var(--text-secondary)",
              fontWeight: 300,
            }}
          >
            history
          </button>
        </div>
      </section>

      <section className="px-5 mt-4 pb-32" key={tab}>
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
              <p className="label">all payments</p>
              <div className="flex gap-1.5">
                {(["all", "INITIATED", "FUNDED", "RELEASED"] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    className="pressable px-2 py-1 text-[10px] uppercase tracking-widest"
                    style={{
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: filter === k ? "var(--accent)" : "var(--border-default)",
                      background: filter === k ? "var(--accent-dim)" : "transparent",
                      color: filter === k ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {k === "all" ? "all" : STATUS_LABEL[k]}
                  </button>
                ))}
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
      <AllHistorySheet open={allHistory} scope="pay" onClose={() => setAllHistory(false)} title="Pay history" />

      {/* Payment detail */}
      <DetailSheet open={!!open} onClose={() => setOpen(null)} title={open?.id}>
        {open && (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">{open.reference || "payment"}</p>
              <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmt(open.amountUsd)}</p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="dot" style={{ background: STATUS_COLOR[open.status] }} />
                <span className="text-[11px] font-light" style={{ color: STATUS_COLOR[open.status] }}>
                  {STATUS_LABEL[open.status]}
                </span>
              </div>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <PayRow l="created" v={fmtTime(open.createdAt)} />
              <PayRow l="expires" v={fmtTime(open.expiresAt)} />
              {open.customer && <PayRow l="customer" v={open.customer} mono />}
              <PayRow l="network" v={getChain(open.chainId)?.name ?? open.chainId} />
              <PayRow l="address" v={shortAddrLocal(open.address)} mono />
              <PayRow l="fee" v={open.feeUsd ? fmt(open.feeUsd) : "$0.00 · waived"} />
              {open.hash && <PayRow l="hash" v={shortAddrLocal(open.hash)} mono />}
              <PayRow l="settlement" v={open.vault ? "ZEC z-addr" : "wallet"} last />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(open.address); toast.success("Address copied"); }}
                className="btn-ghost py-2.5 flex flex-col items-center gap-1 text-[11px]"
              >
                <Copy className="size-3.5" /> copy
              </button>
              <button
                onClick={() => navigator.share?.({ title: open.id, text: `${window.location.origin}/pay/${open.id}` }).catch(() => {})}
                className="btn-ghost py-2.5 flex flex-col items-center gap-1 text-[11px]"
              >
                <Share2 className="size-3.5" /> share
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
                className="btn-primary py-2.5 text-[11px]"
              >
                {open.status === "RELEASED" ? "refund" : "cancel"}
              </button>
            </div>
            {open.hash && (
              <a
                href={getChain(open.chainId)?.explorerTx(open.hash) ?? "#"}
                target="_blank" rel="noopener"
                className="w-full btn-ghost py-2.5 flex items-center justify-center gap-2 text-[11px]"
              >
                explorer <Download className="size-3 rotate-180" />
              </a>
            )}
          </div>
        )}
      </DetailSheet>

      {/* Invoice detail */}
      <DetailSheet open={!!openInvoice} onClose={() => setOpenInvoice(null)} title={openInvoice?.number}>
        {openInvoice && (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">invoice</p>
              <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmt(openInvoice.amountUsd)}</p>
              <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>{openInvoice.recipient}</p>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <PayRow l="issued" v={fmtTime(openInvoice.ts)} />
              <PayRow l="hash v1" v={shortAddrLocal(openInvoice.hashV1)} mono />
              {openInvoice.hashV2 && <PayRow l="hash v2" v={shortAddrLocal(openInvoice.hashV2)} mono />}
              {openInvoice.anchorTx && <PayRow l="anchor" v={shortAddrLocal(openInvoice.anchorTx)} mono last />}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(openInvoice.hashV1); toast.success("Hash copied"); }}
                className="btn-ghost py-2.5 flex items-center justify-center gap-2 text-[11px]"
              >
                <Copy className="size-3.5" /> copy hash
              </button>
              <button
                onClick={() => toast.success("Invoice PDF ready")}
                className="btn-primary py-2.5 flex items-center justify-center gap-2 text-[11px]"
              >
                <Download className="size-3.5" /> PDF
              </button>
            </div>
          </div>
        )}
      </DetailSheet>

      {/* PSP settings */}
      <DetailSheet open={showSettings} onClose={() => setShowSettings(false)} title="PSP settings">
        <div className="space-y-4">
          <SettingsToggle
            label="auto-shield to vault"
            sub="2.00% all-in. funds settle as ZEC into a per-merchant z-addr."
            value={vaultEnabled}
            onChange={setVault}
          />
          <SettingsToggle
            label="email receipts"
            sub="send a receipt PDF to the customer when payment is released."
            value={true}
            onChange={() => {}}
          />
          <SettingsToggle
            label="webhook signing"
            sub="HMAC-SHA256 signed callbacks (umbra-signature header)."
            value={true}
            onChange={() => {}}
          />
          <div style={{ border: "1px solid var(--border-default)", borderRadius: 4, padding: "12px 16px" }}>
            <p className="label mb-2">API key</p>
            <p className="text-[11px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", wordBreak: "break-all" }}>
              umb_live_••••••••••••••rk2A
            </p>
            <button
              onClick={() => { navigator.clipboard?.writeText("umb_live_demo_rk2A"); toast.success("API key copied"); }}
              className="pressable mt-2 text-[11px]"
              style={{ color: "var(--accent)" }}
            >
              copy
            </button>
          </div>
        </div>
      </DetailSheet>
    </div>
  );
}

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
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="released" value={fmt(stats.releasedSum, { maximumFractionDigits: 0 })} sub={`${stats.releasedCount} payments`} ok />
        <StatCard label="pending" value={fmt(stats.pendingSum, { maximumFractionDigits: 0 })} sub={`${stats.pendingCount} awaiting`} />
        <StatCard label="invoices" value={String(invoiceCount)} sub="anchored on-chain" onClick={() => goTo("invoices")} />
        <StatCard label="recurring" value={String(subCount)} sub="active subs" onClick={() => goTo("recurring")} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="label">recent payments</p>
          <button onClick={() => goTo("payments")} className="pressable flex items-center gap-0.5 text-[11px]" style={{ color: "var(--text-secondary)" }}>
            all <ChevronRight className="size-3" />
          </button>
        </div>
        <PaymentList list={payments} onOpen={onOpenPayment} fmt={fmt} compact />
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, ok, onClick,
}: { label: string; value: string; sub?: string; ok?: boolean; onClick?: () => void }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className="pressable text-left"
      style={{ border: "1px solid var(--border-default)", borderRadius: 4, padding: "12px 14px" }}
    >
      <p className="label mb-1">{label}</p>
      <p className="text-[18px]" style={{ color: ok ? "var(--status-ok)" : "var(--text-primary)" }}>{value}</p>
      {sub && <p className="text-[11px] font-light mt-0.5" style={{ color: "var(--text-secondary)" }}>{sub}</p>}
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
      <div className="py-10 text-center">
        <p className="label">no payments yet</p>
      </div>
    );
  }
  return (
    <div style={{ borderTop: "1px solid var(--border-dim)" }}>
      {list.map((p) => {
        const ch = getChain(p.chainId);
        return (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
          >
            <span className="dot shrink-0" style={{ background: STATUS_COLOR[p.status] }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{p.reference || p.customer || p.id}</p>
              <p className="text-[11px] font-light truncate" style={{ color: "var(--text-secondary)" }}>
                {p.id} · {p.token} · {ch?.shortName ?? p.chainId}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{fmt(p.amountUsd)}</p>
              {!compact && <p className="label">{STATUS_LABEL[p.status]}</p>}
            </div>
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
        <p className="label">invoices</p>
        <button onClick={onNew} className="btn-primary px-3 py-1.5 flex items-center gap-1 text-[11px]">
          <Plus className="size-3" /> new
        </button>
      </div>
      {invoices.length === 0 && (
        <div className="py-10 text-center">
          <p className="label">no invoices yet</p>
          <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>anchored invoices appear here with on-chain hash proof</p>
        </div>
      )}
      <div style={{ borderTop: "1px solid var(--border-dim)" }}>
        {invoices.map((i) => (
          <button
            key={i.id}
            onClick={() => onOpen(i)}
            className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
          >
            <span className="dot shrink-0" style={{ background: "var(--text-tertiary)" }} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{i.number}</p>
              <p className="text-[11px] font-light truncate" style={{ color: "var(--text-secondary)" }}>{i.recipient} · {fmtTime(i.ts)}</p>
            </div>
            <p className="text-[12px] shrink-0" style={{ color: "var(--text-primary)" }}>{fmt(i.amountUsd)}</p>
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
    if (!name.trim() || !amt || amt <= 0) { toast.error("Plan name and amount required"); return; }
    const next: Subscription = {
      id: "sub_" + Math.random().toString(36).slice(2, 8),
      name: name.trim(), amountUsd: amt, cadence, token,
      active: true, subscribers: 0, createdAt: Date.now(),
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
  const remove = (id: string) => { setSubs(subs.filter((s) => s.id !== id)); toast("Subscription removed"); };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label">recurring</p>
        <button onClick={() => { reset(); setOpen(true); }} className="btn-primary px-3 py-1.5 flex items-center gap-1 text-[11px]">
          <Plus className="size-3" /> new link
        </button>
      </div>
      {subs.length === 0 && (
        <div className="py-10 text-center">
          <p className="label">no subscription links</p>
        </div>
      )}
      <div style={{ borderTop: "1px solid var(--border-dim)" }}>
        {subs.map((s) => {
          const link = subLink(s);
          return (
            <div key={s.id} style={{ borderBottom: "1px solid var(--border-dim)", padding: "12px 0" }}>
              <div className="flex items-center gap-3">
                <span className="dot shrink-0" style={{ background: s.active ? "var(--status-ok)" : "var(--text-tertiary)" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{s.name}</p>
                  <p className="text-[11px] font-light truncate" style={{ color: "var(--text-secondary)" }}>
                    {fmt(s.amountUsd)} · {s.cadence} · {s.token} · {s.subscribers} subs
                  </p>
                </div>
                <button onClick={() => toggle(s.id)} className="pressable" style={{ color: "var(--text-secondary)" }} aria-label={s.active ? "Pause" : "Resume"}>
                  {s.active ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                </button>
                <button onClick={() => remove(s.id)} className="pressable" style={{ color: "var(--status-err)" }} aria-label="Remove">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2 pl-5">
                <p className="flex-1 text-[11px] font-light truncate" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>{link}</p>
                <button onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }} className="pressable" style={{ color: "var(--text-tertiary)" }}>
                  <Copy className="size-3" />
                </button>
                <button onClick={() => navigator.share?.({ title: s.name, text: link }).catch(() => {})} className="pressable" style={{ color: "var(--text-tertiary)" }}>
                  <Share2 className="size-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <DetailSheet open={open} onClose={() => { setOpen(false); reset(); }} title={created ? "subscription link" : "new subscription link"}>
        {!created ? (
          <div className="space-y-3">
            <SubField label="plan name" value={name} onChange={setName} placeholder="Pro plan" />
            <SubField label="amount (USD)" value={amount} onChange={setAmount} placeholder="49" />
            <div>
              <p className="label mb-2">billing cadence</p>
              <div className="grid grid-cols-3 gap-1.5">
                {(["weekly", "monthly", "yearly"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCadence(c)}
                    className="pressable py-1.5 text-[11px] uppercase tracking-widest"
                    style={{
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: cadence === c ? "var(--accent)" : "var(--border-default)",
                      background: cadence === c ? "var(--accent-dim)" : "var(--bg-base)",
                      color: cadence === c ? "var(--accent)" : "var(--text-secondary)",
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="label mb-2">settlement token</p>
              <div className="grid grid-cols-4 gap-1.5">
                {["USDC", "USDT", "ZEC", "ETH"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setToken(t)}
                    className="pressable py-1.5 text-[11px]"
                    style={{
                      borderRadius: 4,
                      border: "1px solid",
                      borderColor: token === t ? "var(--accent)" : "var(--border-default)",
                      background: token === t ? "var(--accent-dim)" : "var(--bg-base)",
                      color: token === t ? "var(--accent)" : "var(--text-secondary)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] font-light" style={{ color: "var(--text-secondary)" }}>
              customers subscribe themselves through the hosted link. no customer info needed up front.
            </p>
            <button onClick={create} className="btn-primary w-full py-2.5">generate link</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-5 text-center" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <p className="label mb-2">{created.name}</p>
              <p className="text-[22px]" style={{ color: "var(--text-primary)" }}>{fmt(created.amountUsd)}</p>
              <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>
                {created.cadence} · {created.token}
              </p>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4, padding: "12px 16px" }}>
              <p className="label mb-1">hosted subscription link</p>
              <p className="text-[11px] font-light" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)", wordBreak: "break-all" }}>{subLink(created)}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(subLink(created)); toast.success("Link copied"); }}
                className="btn-ghost py-2.5 flex items-center justify-center gap-2 text-[11px]"
              >
                <Copy className="size-3.5" /> copy
              </button>
              <button
                onClick={() => navigator.share?.({ title: created.name, text: subLink(created) }).catch(() => {})}
                className="btn-primary py-2.5 flex items-center justify-center gap-2 text-[11px]"
              >
                <Share2 className="size-3.5" /> share
              </button>
            </div>
            <button onClick={() => { setOpen(false); reset(); }} className="w-full pressable py-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
              done
            </button>
          </div>
        )}
      </DetailSheet>
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
        <p className="label">hosted checkout links</p>
        <button onClick={onNew} className="btn-primary px-3 py-1.5 flex items-center gap-1 text-[11px]">
          <Plus className="size-3" /> new
        </button>
      </div>
      {payments.length === 0 && (
        <div className="py-10 text-center">
          <p className="label">no links yet</p>
          <p className="text-[11px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>generate a payment to share its hosted link</p>
        </div>
      )}
      <div style={{ borderTop: "1px solid var(--border-dim)" }}>
        {payments.map((p) => {
          const link = `${origin}/pay/${p.id}`;
          return (
            <div key={p.id} style={{ borderBottom: "1px solid var(--border-dim)", padding: "12px 0" }}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-[13px]" style={{ color: "var(--text-primary)" }}>{p.reference || p.id}</p>
                <p className="text-[12px]" style={{ color: "var(--text-primary)" }}>{fmt(p.amountUsd)}</p>
              </div>
              <p className="text-[11px] font-light mb-2" style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)", wordBreak: "break-all" }}>{link}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => { navigator.clipboard?.writeText(link); toast.success("Link copied"); }}
                  className="btn-ghost flex-1 py-1.5 flex items-center justify-center gap-1 text-[11px]"
                >
                  <Copy className="size-3" /> copy
                </button>
                <button
                  onClick={() => navigator.share?.({ title: p.id, text: link }).catch(() => {})}
                  className="btn-primary flex-1 py-1.5 flex items-center justify-center gap-1 text-[11px]"
                >
                  <Share2 className="size-3" /> share
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SettingsToggle({ label, sub, value, onChange }: { label: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-start gap-3 px-4 py-3"
      style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}
    >
      <button
        onClick={() => onChange(!value)}
        className="pressable mt-0.5 shrink-0 transition-colors"
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: value ? "var(--accent-dim)" : "var(--bg-raised)",
          border: `1px solid ${value ? "var(--accent)" : "var(--border-default)"}`,
          position: "relative",
        }}
        aria-pressed={value}
      >
        <span
          className="absolute top-0.5 transition-transform"
          style={{
            width: 14, height: 14, borderRadius: "50%",
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

function SubField({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full"
        style={{ height: 36 }}
      />
    </div>
  );
}

function PayRow({ l, v, mono, last }: { l: string; v: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <span className="label shrink-0">{l}</span>
      <span
        className="text-[12px] text-right truncate"
        style={{ color: "var(--text-primary)", fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}
      >
        {v}
      </span>
    </div>
  );
}

function shortAddrLocal(s: string) {
  if (!s) return "";
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s;
}
