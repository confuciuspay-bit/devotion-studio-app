import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useApp, pinHash, type AutoLock } from "@/lib/store";
import { PinGate } from "@/components/PinGate";
import { PinPad } from "@/components/PinPad";
import { DetailSheet } from "@/components/DetailSheet";
import {
  ArrowLeft, ChevronRight, Shield, KeyRound, Eye, EyeOff,
  Trash2, Globe, Network, Lock, Building2, Upload,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const BRAND_PRESETS = [
  { name: "Violet",  value: "#7c3aed" },
  { name: "Emerald", value: "#10b981" },
  { name: "Amber",   value: "#f59e0b" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Cyan",    value: "#06b6d4" },
  { name: "Slate",   value: "#64748b" },
];

const LOCK_OPTIONS: AutoLock[] = [1, 5, 15, "never"];

function SettingsPage() {
  const router = useRouter();
  const merchant = useApp((s) => s.merchant);
  const setMerchant = useApp((s) => s.setMerchant);
  const setPinHashStored = useApp((s) => s.setPinHashStored);
  const seed = useApp((s) => s.seed);
  const biometricsEnabled = useApp((s) => s.biometricsEnabled);
  const autoLockMinutes = useApp((s) => s.autoLockMinutes);
  const torEnabled = useApp((s) => s.torEnabled);
  const network = useApp((s) => s.network);
  const setSecurity = useApp((s) => s.setSecurity);
  const resetAll = useApp((s) => s.resetAll);
  const setLocked = useApp((s) => s.setLocked);

  const [editMerchant, setEditMerchant] = useState(false);
  const [revealSeed, setRevealSeed] = useState<"gate" | "show" | null>(null);
  const [changePin, setChangePin] = useState<"gate" | "new" | "confirm" | null>(null);
  const [newPin, setNewPin] = useState<string | null>(null);
  const [wipeGate, setWipeGate] = useState(false);

  const [biz, setBiz] = useState(merchant?.businessName ?? "");
  const [legal, setLegal] = useState(merchant?.legalName ?? "");
  const [country, setCountry] = useState(merchant?.country ?? "");
  const [website, setWebsite] = useState(merchant?.website ?? "");
  const [brandColor, setBrandColor] = useState(merchant?.brandColor ?? BRAND_PRESETS[0].value);
  const [logoDataUrl, setLogoDataUrl] = useState(merchant?.logoDataUrl);

  function saveMerchant() {
    if (!biz.trim()) { toast.error("Business name is required"); return; }
    setMerchant({
      businessName: biz.trim(),
      legalName: legal.trim() || undefined,
      country: country.trim() || undefined,
      website: website.trim() || undefined,
      brandColor, logoDataUrl,
    });
    toast.success("Merchant profile updated");
    setEditMerchant(false);
  }

  function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    if (f.size > 500_000) { toast.error("Logo must be < 500KB"); return; }
    const r = new FileReader(); r.onload = () => setLogoDataUrl(r.result as string); r.readAsDataURL(f);
  }

  async function commitNewPin(pin: string) {
    if (!newPin) { setNewPin(pin); toast.success("Confirm new PIN"); }
    else if (pin === newPin) {
      const h = await pinHash(pin); setPinHashStored(h);
      toast.success("PIN updated"); setChangePin(null); setNewPin(null);
    } else {
      toast.error("PINs don't match"); setNewPin(null);
    }
  }

  return (
    <div className="animate-fade-in pb-24">
      <header
        className="px-4 flex items-center gap-3"
        style={{ height: 48, borderBottom: "1px solid var(--border-dim)" }}
      >
        <button
          onClick={() => router.history.back()}
          className="pressable text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">settings</h1>
      </header>

      <Sect title="merchant">
        <button
          onClick={() => setEditMerchant(true)}
          className="pressable w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
          style={{ borderBottom: "1px solid var(--border-dim)" }}
        >
          <div
            className="size-8 grid place-items-center overflow-hidden relative shrink-0"
            style={{ backgroundColor: merchant?.brandColor ?? BRAND_PRESETS[0].value, borderRadius: 4 }}
          >
            {merchant?.logoDataUrl ? (
              <img src={merchant.logoDataUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="text-white text-[11px] font-medium">
                {(merchant?.businessName ?? "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] text-[var(--text-primary)] truncate">
              {merchant?.businessName ?? "set up merchant profile"}
            </p>
            <p className="text-[11px] font-light text-[var(--text-secondary)] truncate">
              {merchant?.website ?? merchant?.country ?? "tap to edit"}
            </p>
          </div>
          <ChevronRight className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </Sect>

      <Sect title="security">
        <Group>
          <RowBtn icon={KeyRound} label="change PIN" onClick={() => setChangePin("gate")} />
          <RowToggle icon={Shield} label="biometric unlock" checked={biometricsEnabled} onChange={(v) => setSecurity({ biometricsEnabled: v })} />
          <RowSel icon={Lock} label="auto-lock" value={String(autoLockMinutes)} options={LOCK_OPTIONS.map((o) => ({ label: o === "never" ? "never" : `${o} min`, value: String(o) }))} onChange={(v) => setSecurity({ autoLockMinutes: v === "never" ? "never" : (Number(v) as AutoLock) })} />
          <RowBtn icon={Lock} label="lock now" onClick={() => { setLocked(true); toast.success("Locked"); }} last />
        </Group>
      </Sect>

      <Sect title="backup">
        <Group>
          <RowBtn icon={Eye} label="reveal recovery phrase" onClick={() => setRevealSeed("gate")} last />
        </Group>
      </Sect>

      <Sect title="privacy & network">
        <Group>
          <RowToggle icon={Globe} label="tor routing" checked={torEnabled} onChange={(v) => setSecurity({ torEnabled: v })} />
          <RowSel icon={Network} label="network" value={network} options={[{ label: "mainnet", value: "mainnet" }, { label: "testnet", value: "testnet" }]} onChange={(v) => setSecurity({ network: v as "mainnet" | "testnet" })} last />
        </Group>
      </Sect>

      <Sect title="danger zone">
        <button
          onClick={() => setWipeGate(true)}
          className="pressable w-full flex items-center gap-3 px-4 py-3 transition-colors"
          style={{
            border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 4,
            color: "var(--status-err)",
          }}
        >
          <Trash2 className="size-3.5" />
          <span className="text-[13px] flex-1 text-left">clear all data</span>
          <ChevronRight className="size-3.5 opacity-50" />
        </button>
      </Sect>

      {/* Edit merchant */}
      <DetailSheet open={editMerchant} onClose={() => setEditMerchant(false)} title="Merchant profile">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
            <label
              className="size-9 grid place-items-center cursor-pointer overflow-hidden relative"
              style={{ backgroundColor: brandColor, borderRadius: 4 }}
            >
              {logoDataUrl ? (
                <img src={logoDataUrl} className="absolute inset-0 size-full object-cover" alt="" />
              ) : (
                <Building2 className="size-3.5 text-white/90" />
              )}
              <input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
              <span
                className="absolute -bottom-0.5 -right-0.5 size-4 rounded-sm grid place-items-center"
                style={{ background: "var(--text-primary)", color: "var(--bg-base)" }}
              >
                <Upload className="size-2" />
              </span>
            </label>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[var(--text-primary)] truncate">{biz || "your business"}</p>
              <p className="text-[11px] font-light text-[var(--text-secondary)]">{website || "—"}</p>
            </div>
          </div>
          <FormInput label="business name *" value={biz} onChange={setBiz} />
          <FormInput label="legal name" value={legal} onChange={setLegal} />
          <div className="grid grid-cols-2 gap-3">
            <FormInput label="country" value={country} onChange={setCountry} />
            <FormInput label="website" value={website} onChange={setWebsite} />
          </div>
          <div>
            <p className="label mb-2">brand color</p>
            <div className="flex gap-2">
              {BRAND_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setBrandColor(c.value)}
                  className="pressable size-7 transition-all"
                  style={{
                    backgroundColor: c.value,
                    borderRadius: 4,
                    border: `2px solid ${brandColor === c.value ? "var(--text-primary)" : "transparent"}`,
                  }}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
          <button
            onClick={saveMerchant}
            className="btn-primary w-full py-2.5"
          >
            save changes
          </button>
        </div>
      </DetailSheet>

      {/* Reveal seed */}
      <DetailSheet open={!!revealSeed} onClose={() => setRevealSeed(null)} title="Recovery phrase">
        {revealSeed === "gate" && (
          <PinGate title="Confirm with PIN" subtitle="Required to reveal your seed" onPass={() => setRevealSeed("show")} onCancel={() => setRevealSeed(null)} />
        )}
        {revealSeed === "show" && seed && (
          <div>
            <div
              className="p-3 flex gap-2 mb-4 text-[12px]"
              style={{
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 4,
                color: "var(--status-err)",
              }}
            >
              <Shield className="size-3.5 shrink-0 mt-0.5" />
              <span>Never share these words. Anyone with them controls your funds.</span>
            </div>
            <div
              className="grid grid-cols-3 gap-1.5 p-3"
              style={{ background: "var(--bg-raised)", borderRadius: 4 }}
            >
              {seed.map((w, i) => (
                <div
                  key={i}
                  className="flex items-baseline gap-1.5 px-2 py-1.5"
                  style={{ background: "var(--bg-surface)", borderRadius: 4 }}
                >
                  <span
                    className="text-[10px] tabular-nums"
                    style={{ color: "var(--text-tertiary)", width: 14 }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[12px] text-[var(--text-primary)]">{w}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setRevealSeed(null)}
              className="btn-ghost w-full mt-4 py-2.5 flex items-center justify-center gap-2"
            >
              <EyeOff className="size-3" /> hide
            </button>
          </div>
        )}
      </DetailSheet>

      {/* Change PIN */}
      <DetailSheet open={!!changePin} onClose={() => { setChangePin(null); setNewPin(null); }} title="Change PIN">
        {changePin === "gate" && (
          <PinGate title="Confirm current PIN" onPass={() => setChangePin("new")} onCancel={() => setChangePin(null)} />
        )}
        {(changePin === "new" || changePin === "confirm") && (
          <PinPad title={newPin ? "Confirm new PIN" : "Enter new PIN"} onSubmit={commitNewPin} onCancel={() => { setChangePin(null); setNewPin(null); }} />
        )}
      </DetailSheet>

      {/* Wipe */}
      <DetailSheet open={wipeGate} onClose={() => setWipeGate(false)} title="Clear all data">
        <PinGate
          title="This will erase everything"
          subtitle="Confirm with your PIN. Make sure you have your seed phrase."
          onPass={() => { resetAll(); setWipeGate(false); toast.success("All data cleared"); router.navigate({ to: "/onboarding" }); }}
          onCancel={() => setWipeGate(false)}
        />
      </DetailSheet>
    </div>
  );
}

function Sect({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 mt-6">
      <p className="label mb-2">{title}</p>
      {children}
    </section>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ border: "1px solid var(--border-default)", borderRadius: 4, overflow: "hidden" }}>
      {children}
    </div>
  );
}

function RowBtn({ icon: Icon, label, onClick, last }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="pressable w-full flex items-center gap-3 px-4 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <Icon className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
      <span className="text-[13px] flex-1 text-left text-[var(--text-primary)]">{label}</span>
      <ChevronRight className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
    </button>
  );
}

function RowToggle({ icon: Icon, label, checked, onChange }: { icon: React.ComponentType<{ className?: string }>; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ borderBottom: "1px solid var(--border-dim)" }}
    >
      <Icon className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
      <span className="text-[13px] flex-1 text-[var(--text-primary)]">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className="pressable relative transition-colors"
        style={{
          width: 36,
          height: 20,
          borderRadius: 10,
          background: checked ? "var(--accent-dim)" : "var(--bg-raised)",
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-default)"}`,
        }}
      >
        <span
          className="absolute top-0.5 transition-transform"
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: checked ? "var(--accent)" : "var(--text-tertiary)",
            transform: checked ? "translateX(18px)" : "translateX(2px)",
          }}
        />
      </button>
    </div>
  );
}

function RowSel({ icon: Icon, label, value, options, onChange, last }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void; last?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <Icon className="size-3.5" style={{ color: "var(--text-tertiary)" }} />
      <span className="text-[13px] flex-1 text-[var(--text-primary)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[12px]"
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border-default)",
          borderRadius: 4,
          padding: "3px 8px",
          color: "var(--text-secondary)",
          height: "auto",
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: "var(--bg-overlay)" }}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
        style={{ height: 36 }}
      />
    </div>
  );
}
