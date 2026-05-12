import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { DetailSheet } from "@/components/DetailSheet";
import { AllHistorySheet } from "@/components/AllHistorySheet";
import { PinGate } from "@/components/PinGate";
import { WalletFlow } from "@/components/flows/WalletFlow";
import { VaultFlow, type VaultFlowKind } from "@/components/flows/VaultFlow";
import { ArrowRight, ChevronRight, ExternalLink } from "lucide-react";
import { useApp, type VaultActivity } from "@/lib/store";
import { fmtTime } from "@/lib/markets";
import { useMoney } from "@/lib/useMoney";
import { getChain } from "@/lib/chains";

export const Route = createFileRoute("/vault")({ component: VaultPage });

const flow = [
  { l: "customer pays", v: "USDC · ETH" },
  { l: "swap to ZEC", v: "Maya · 10 bps" },
  { l: "shield z-addr", v: "per-merchant" },
  { l: "payout", v: "any currency" },
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

      {/* Balance */}
      <section className="px-4 py-5" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <p className="label mb-2">shielded balance</p>
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: "var(--text-primary)",
            letterSpacing: "0.02em",
          }}
        >
          {hidden ? "••••" : vaultZec.toFixed(2)}{" "}
          <span style={{ fontSize: 16, color: "var(--status-ok)" }}>ZEC</span>
        </p>
        <p className="text-[12px] font-light mt-1" style={{ color: "var(--text-secondary)" }}>
          ≈ {fmt(balanceUsd)} · 2.00% all-in
        </p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="dot dot-ok" />
          <button
            onClick={() => (pinHashStored ? setPinGate(true) : setVfk("address"))}
            className="pressable text-[11px] font-light transition-colors hover:opacity-80"
            style={{ color: "var(--status-ok)" }}
          >
            z-addr · per-merchant · view
          </button>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => setShieldFlow(true)}
            className="btn-ghost flex-1 py-2.5 text-[11px]"
          >
            add
          </button>
          <button
            onClick={() => setVfk("withdraw")}
            className="btn-primary flex-1 py-2.5 text-[11px]"
          >
            withdraw
          </button>
          <button
            onClick={() => setVfk("settings")}
            className="btn-ghost flex-1 py-2.5 text-[11px]"
          >
            settings
          </button>
        </div>
      </section>

      {/* Flow diagram */}
      <section className="px-4 py-4" style={{ borderBottom: "1px solid var(--border-dim)" }}>
        <p className="label mb-3">per-payment flow</p>
        <div className="flex items-center overflow-hidden">
          {flow.map((f, i) => (
            <div key={f.l} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <p className="label">{`step ${i + 1}`}</p>
                <p className="text-[12px] text-[var(--text-primary)] mt-0.5 truncate">{f.l}</p>
                <p className="text-[11px] font-light truncate" style={{ color: "var(--text-secondary)" }}>{f.v}</p>
              </div>
              {i < flow.length - 1 && (
                <ArrowRight className="size-3 mx-1 shrink-0" style={{ color: "var(--text-tertiary)" }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="px-4 py-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="label">activity</p>
          <button
            onClick={() => setAllHistory(true)}
            className="pressable flex items-center gap-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            all history <ChevronRight className="size-3" />
          </button>
        </div>

        {vaultActivity.length === 0 && (
          <div className="py-16 text-center">
            <p className="label">no vault activity yet</p>
          </div>
        )}

        {vaultActivity.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border-dim)" }}>
            {vaultActivity.map((s) => (
              <button
                key={s.id}
                onClick={() => setOpen(s)}
                className="pressable w-full text-left flex items-center gap-3 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                style={{ borderBottom: "1px solid var(--border-dim)", height: 44 }}
              >
                <span className="dot dot-ok shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-[var(--text-secondary)] font-light">{fmtTime(s.ts)} · {s.kind === "shield" ? "shield in" : "payout"}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[13px] text-[var(--text-primary)]">{fmt(s.fromAmountUsd)}</span>
                    <ArrowRight className="size-2.5" style={{ color: "var(--text-tertiary)" }} />
                    <span className="text-[13px]" style={{ color: "var(--status-ok)" }}>
                      {s.kind === "shield" ? `${s.zecAmount.toFixed(2)} ZEC` : (getChain(s.toChainId ?? "")?.shortName ?? "")}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] font-light" style={{ color: "var(--text-tertiary)" }}>
                  {s.status}
                </span>
              </button>
            ))}
          </div>
        )}
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
            <div
              className="p-5"
              style={{ background: "var(--bg-raised)", borderRadius: 4 }}
            >
              <div className="flex items-center justify-between text-[13px]">
                <span style={{ color: "var(--text-primary)" }}>{fmt(open.fromAmountUsd)}</span>
                <ArrowRight className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
                <span style={{ color: "var(--status-ok)" }}>
                  {open.kind === "shield" ? `${open.zecAmount.toFixed(2)} ZEC` : (getChain(open.toChainId ?? "")?.shortName ?? "")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="dot dot-ok" />
                <span className="text-[11px] font-light" style={{ color: "var(--status-ok)" }}>{open.status}</span>
              </div>
            </div>
            <div style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
              <VRow l="time" v={fmtTime(open.ts)} />
              <VRow l="kind" v={open.kind} />
              <VRow l="all-in fee" v={`${fmt(open.fee)} · 2.00%`} />
              <VRow l="tx hash" v={short(open.hash)} mono />
              {open.toAddress && <VRow l="to" v={short(open.toAddress)} mono last />}
              {!open.toAddress && <VRow l="tx hash" v={short(open.hash)} mono last />}
            </div>
            {open.toChainId && (
              <a
                href={getChain(open.toChainId)?.explorerTx(open.hash) ?? "#"}
                target="_blank" rel="noopener"
                className="btn-ghost w-full py-2.5 flex items-center justify-center gap-2"
              >
                explorer <ExternalLink className="size-3" />
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

function VRow({ l, v, mono, last }: { l: string; v: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <span className="label shrink-0">{l}</span>
      <span
        className="text-[12px] text-right text-[var(--text-primary)]"
        style={mono ? { fontFamily: "'JetBrains Mono', monospace" } : undefined}
      >
        {v}
      </span>
    </div>
  );
}
