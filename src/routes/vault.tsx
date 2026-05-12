import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PinGate } from "@/components/PinGate";
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
  const { vaultZec, vaultActivity, hideBalances, pinHashStored } = useApp();
  const [open, setOpen] = useState<VaultActivity | null>(null);
  const [vfk, setVfk] = useState<VaultFlowKind | null>(null);
  const [shieldFlow, setShieldFlow] = useState(false);
  const [allHistory, setAllHistory] = useState(false);
  const [pinGate, setPinGate] = useState(false);
  const { fmt } = useMoney();

  const hidden = hideBalances;
  const balanceUsd = vaultZec * ZEC_PRICE;

  return (
    <div className="animate-fade-in">
      <AppHeader subtitle="UmbraVault" />

      {/* Vault balance card */}
      <section className="px-5">
        <div className="rounded-lg border border-[rgba(16,185,129,0.15)] bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-md bg-[rgba(16,185,129,0.12)] text-success grid place-items-center">
              <Shield className="size-4" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Shielded balance
              </p>
              <button
                onClick={() => (pinHashStored ? setPinGate(true) : setVfk("address"))}
                className="text-xs text-success font-mono flex items-center gap-1 hover:opacity-80 transition"
              >
                z-addr · per-merchant <KeyRound className="size-3" />
              </button>
            </div>
          </div>

          <h1 className="mt-5 text-3xl font-mono font-semibold tabular-nums text-foreground">
            <span className="text-success">ⓩ</span> {hidden ? "••••••" : vaultZec.toFixed(2)}{" "}
            <span className="text-muted-foreground text-xl">ZEC</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            ≈ {fmt(balanceUsd)} · 2.00% all-in
          </p>

          <div className="mt-6 grid grid-cols-3 gap-2">
            <button
              onClick={() => setShieldFlow(true)}
              className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-3 text-sm font-medium flex flex-col items-center gap-1.5 hover:bg-[rgba(255,255,255,0.07)] transition"
            >
              <Plus className="size-4 text-muted-foreground" /> Add
            </button>
            <button
              onClick={() => setVfk("withdraw")}
              className="pressable rounded-md bg-success text-black py-3 text-sm font-medium flex flex-col items-center gap-1.5 hover:opacity-90 transition"
            >
              <ArrowRight className="size-4" /> Withdraw
            </button>
            <button
              onClick={() => setVfk("settings")}
              className="pressable rounded-md bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] py-3 text-sm font-medium flex flex-col items-center gap-1.5 hover:bg-[rgba(255,255,255,0.07)] transition"
            >
              <Settings className="size-4 text-muted-foreground" /> Settings
            </button>
          </div>
        </div>
      </section>

      {/* Flow diagram */}
      <section className="px-5 mt-5">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">Per-payment flow</p>
        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card flex items-center overflow-hidden">
          {flow.map((f, i) => (
            <div key={f.l} className="flex items-center flex-1">
              <div className="flex-1 px-3 py-4">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Step {i + 1}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">{f.l}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{f.v}</p>
              </div>
              {i < flow.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground shrink-0" />}
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-5 mt-6 pb-32">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Activity</p>
          <button onClick={() => setAllHistory(true)} className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition pressable">
            All history <ChevronRight className="size-3" />
          </button>
        </div>

        {vaultActivity.length === 0 && (
          <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card p-8 text-center text-sm text-muted-foreground">
            No vault activity yet.
          </div>
        )}

        <div className="rounded-lg border border-[rgba(255,255,255,0.06)] bg-card divide-y divide-[rgba(255,255,255,0.04)] overflow-hidden">
          {vaultActivity.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpen(s)}
              className="pressable w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[rgba(255,255,255,0.02)] transition"
            >
              <div className="size-8 rounded-md bg-[rgba(16,185,129,0.12)] text-success grid place-items-center shrink-0">
                <Shield className="size-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">{fmtTime(s.ts)} · {s.kind === "shield" ? "Shield in" : "Payout"}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-mono mt-0.5">
                  <span className="text-foreground">{fmt(s.fromAmountUsd)}</span>
                  <ArrowRight className="size-3 text-muted-foreground" />
                  <span className="text-success">
                    {s.kind === "shield" ? `ⓩ ${s.zecAmount.toFixed(2)}` : (getChain(s.toChainId ?? "")?.shortName ?? "")}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-success flex items-center gap-1">
                  <Lock className="size-2.5" /> {s.status}
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <VaultFlow open={!!vfk} kind={vfk} onClose={() => setVfk(null)} />
      <WalletFlow open={shieldFlow} kind={shieldFlow ? "shield" : null} onClose={() => setShieldFlow(false)} />
      <AllHistorySheet open={allHistory} scope="vault" onClose={() => setAllHistory(false)} title="Vault history" />

      <DetailSheet open={pinGate} onClose={() => setPinGate(false)} title="Reveal z-address">
        <PinGate
          subtitle="PIN required to reveal shielded address"
          onPass={() => { setPinGate(false); setVfk("address"); }}
          onCancel={() => setPinGate(false)}
        />
      </DetailSheet>

      <DetailSheet open={!!open} onClose={() => setOpen(null)} title="Vault entry">
        {open && (
          <div className="space-y-4">
            <div className="rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-mono">
                <span className="text-foreground">{fmt(open.fromAmountUsd)}</span>
                <ArrowRight className="size-4 text-muted-foreground" />
                <span className="text-success">
                  {open.kind === "shield" ? `ⓩ ${open.zecAmount.toFixed(2)} ZEC` : (getChain(open.toChainId ?? "")?.shortName ?? "")}
                </span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Lock className="size-3 text-success" />
                <span className="text-xs font-mono text-success">{open.status}</span>
              </div>
            </div>
            <div className="rounded-lg border border-[rgba(255,255,255,0.06)] divide-y divide-[rgba(255,255,255,0.04)]">
              <VRow l="Time" v={fmtTime(open.ts)} />
              <VRow l="Kind" v={open.kind} />
              <VRow l="All-in fee" v={`${fmt(open.fee)} · 2.00%`} />
              <VRow l="Tx hash" v={short(open.hash)} mono />
              {open.toAddress && <VRow l="To" v={short(open.toAddress)} mono />}
            </div>
            {open.toChainId && (
              <a
                href={getChain(open.toChainId)?.explorerTx(open.hash) ?? "#"}
                target="_blank" rel="noopener"
                className="w-full pressable rounded-md bg-primary text-primary-foreground py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition"
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

function VRow({ l, v, mono }: { l: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{l}</span>
      <span className={`text-sm text-right text-foreground ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
