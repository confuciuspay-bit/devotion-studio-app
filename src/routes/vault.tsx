import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { WalletFlow } from "@/components/flows/WalletFlow";
import { VaultFlow, type VaultFlowKind } from "@/components/flows/VaultFlow";
import { Shield, ArrowRight, Lock, ChevronRight, Plus, Settings, KeyRound, ExternalLink } from "lucide-react";
import { useApp, type VaultActivity } from "@/lib/store";
import { fmtTime } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { getChain } from "@/lib/chains";

export const Route = createFileRoute("/vault")({ component: VaultPage });

const flow = [
  { l: "Customer pays", v: "USDC · ETH" },
  { l: "Swap to ZEC", v: "Maya · 10 bps" },
  { l: "Shield to z-addr", v: "Per-merchant" },
  { l: "Payout", v: "Any currency" },
];

const ZEC_PRICE = 35;

function VaultPage() {
  const { vaultZec, vaultActivity, hideBalances } = useApp();
  const [open, setOpen] = useState<VaultActivity | null>(null);
  const [vfk, setVfk] = useState<VaultFlowKind | null>(null);
  const [shieldFlow, setShieldFlow] = useState(false);
  const [allHistory, setAllHistory] = useState(false);
  const { fmt } = useMoney();

  const hidden = hideBalances;
  const balanceUsd = vaultZec * ZEC_PRICE;

  return (
    <div className="animate-fade-in">
      <AppHeader subtitle="UmbraVault" />
      <section className="px-5">
        <div className="relative rounded-3xl border border-shield/30 p-6 bg-[image:var(--gradient-shield)] grain overflow-hidden">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-shield/15 text-shield grid place-items-center">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Shielded balance
              </p>
              <button
                onClick={() => setVfk("address")}
                className="text-xs text-shield font-mono flex items-center gap-1"
              >
                z-addr · per-merchant <KeyRound className="size-3" />
              </button>
            </div>
          </div>
          <h1 className="mt-4 text-4xl font-display font-semibold tabular-nums">
            <span className="text-shield">ⓩ</span> {hidden ? "••••••" : vaultZec.toFixed(2)}{" "}
            <span className="text-muted-foreground text-2xl">ZEC</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            ≈ {fmt(balanceUsd)} · 2.00% all-in
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2 stagger">
            <button
              onClick={() => setShieldFlow(true)}
              className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex flex-col items-center gap-1"
            >
              <Plus className="size-4" /> Add
            </button>
            <button
              onClick={() => setVfk("withdraw")}
              className="pressable rounded-2xl bg-shield text-background py-3 text-sm font-semibold flex flex-col items-center gap-1"
            >
              <ArrowRight className="size-4" /> Withdraw
            </button>
            <button
              onClick={() => setVfk("settings")}
              className="pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex flex-col items-center gap-1"
            >
              <Settings className="size-4" /> Settings
            </button>
          </div>
        </div>
      </section>

      <section className="px-5 mt-5">
        <h2 className="text-sm font-semibold mb-3">Per-payment flow</h2>
        <div className="rounded-2xl border border-border bg-card p-2">
          {flow.map((f, i) => (
            <div key={f.l} className="flex items-center">
              <div className="flex-1 px-3 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Step {i + 1}
                </p>
                <p className="text-sm font-medium">{f.l}</p>
                <p className="text-[11px] text-muted-foreground font-mono">{f.v}</p>
              </div>
              {i < flow.length - 1 && <ArrowRight className="size-4 text-muted-foreground mx-1" />}
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 mt-6 pb-32">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Activity</h2>
          <button onClick={() => setAllHistory(true)} className="text-xs text-muted-foreground flex items-center pressable">
            All history <ChevronRight className="size-3" />
          </button>
        </div>
        <div className="space-y-2 stagger">
          {vaultActivity.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
              No vault activity yet.
            </div>
          )}
          {vaultActivity.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpen(s)}
              className="pressable w-full text-left rounded-2xl border border-border bg-card p-4 active:bg-foreground/5"
            >
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground">{fmtTime(s.ts)} · {s.kind === "shield" ? "Shield in" : "Payout"}</p>
                <span className="text-[10px] font-mono text-shield flex items-center gap-1">
                  <Lock className="size-3" /> {s.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm font-mono">
                <span>{fmt(s.fromAmountUsd)}</span>
                <ArrowRight className="size-3.5 text-muted-foreground" />
                <span className="text-shield">
                  {s.kind === "shield"
                    ? `ⓩ ${s.zecAmount.toFixed(2)}`
                    : `${getChain(s.toChainId ?? "")?.shortName ?? ""}`}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <p className="text-[11px] text-muted-foreground font-mono">Fee {fmt(s.fee)}</p>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <VaultFlow open={!!vfk} kind={vfk} onClose={() => setVfk(null)} />
      <WalletFlow open={shieldFlow} kind={shieldFlow ? "shield" : null} onClose={() => setShieldFlow(false)} />

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title="Vault entry">
        {open && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-foreground/5 border border-border p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-mono">
                <span>{fmt(open.fromAmountUsd)}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="text-shield">
                  {open.kind === "shield" ? `ⓩ ${open.zecAmount.toFixed(2)} ZEC` : (getChain(open.toChainId ?? "")?.shortName ?? "")}
                </span>
              </div>
              <p className="text-center text-[10px] font-mono text-shield bg-shield/10 px-2 py-1 rounded-full inline-block w-full">
                <Lock className="size-3 inline mr-1" /> {open.status}
              </p>
            </div>
            <div className="rounded-2xl border border-border divide-y divide-border">
              <Row l="Time" v={fmtTime(open.ts)} />
              <Row l="Kind" v={open.kind} />
              <Row l="All-in fee" v={`${fmt(open.fee)} · 2.00%`} />
              <Row l="Tx hash" v={short(open.hash)} mono />
              {open.toAddress && <Row l="To" v={short(open.toAddress)} mono />}
            </div>
            {open.toChainId && (
              <a
                href={getChain(open.toChainId)?.explorerTx(open.hash) ?? "#"}
                target="_blank" rel="noopener"
                className="w-full pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold flex items-center justify-center gap-2"
              >
                View on explorer <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        )}
      </DetailSheet>
    </div>
  );
}

function short(s: string) {
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
