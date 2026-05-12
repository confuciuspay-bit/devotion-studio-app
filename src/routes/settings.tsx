import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
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
  { name: "Violet",  value: "oklch(0.68 0.22 295)" },
  { name: "Emerald", value: "oklch(0.72 0.18 155)" },
  { name: "Amber",   value: "oklch(0.78 0.16 70)" },
  { name: "Rose",    value: "oklch(0.70 0.20 15)" },
  { name: "Cyan",    value: "oklch(0.74 0.14 220)" },
  { name: "Slate",   value: "oklch(0.66 0.04 260)" },
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

  // merchant edit local state
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
    <div className="animate-fade-in pb-32">
      <header className="px-5 pt-6 pb-3 flex items-center gap-3">
        <button onClick={() => router.history.back()} className="size-9 grid place-items-center rounded-full bg-card border border-border pressable">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-lg font-display font-semibold">Settings</h1>
      </header>

      {/* Merchant */}
      <Section title="Merchant">
        <button onClick={() => setEditMerchant(true)} className="w-full pressable rounded-2xl border border-border bg-card p-4 flex items-center gap-3 active:bg-foreground/5">
          <div className="size-12 rounded-xl grid place-items-center overflow-hidden relative shrink-0" style={{ backgroundColor: merchant?.brandColor ?? "oklch(0.68 0.22 295)" }}>
            {merchant?.logoDataUrl ? (
              <img src={merchant.logoDataUrl} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <span className="text-background font-display font-semibold">
                {(merchant?.businessName ?? "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{merchant?.businessName ?? "Set up merchant profile"}</p>
            <p className="text-[11px] text-muted-foreground truncate">{merchant?.website ?? merchant?.country ?? "Tap to edit"}</p>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      </Section>

      {/* Security */}
      <Section title="Security">
        <Group>
          <RowButton icon={KeyRound} label="Change PIN" onClick={() => setChangePin("gate")} />
          <RowToggle icon={Shield} label="Biometric unlock" checked={biometricsEnabled} onChange={(v) => setSecurity({ biometricsEnabled: v })} />
          <RowSelect icon={Lock} label="Auto-lock" value={String(autoLockMinutes)} options={LOCK_OPTIONS.map((o) => ({ label: o === "never" ? "Never" : `${o} min`, value: String(o) }))} onChange={(v) => setSecurity({ autoLockMinutes: v === "never" ? "never" : (Number(v) as AutoLock) })} />
          <RowButton icon={Lock} label="Lock now" onClick={() => { setLocked(true); toast.success("Locked"); }} />
        </Group>
      </Section>

      {/* Backup */}
      <Section title="Backup">
        <Group>
          <RowButton icon={Eye} label="Reveal recovery phrase" onClick={() => setRevealSeed("gate")} />
        </Group>
      </Section>

      {/* Privacy */}
      <Section title="Privacy & network">
        <Group>
          <RowToggle icon={Globe} label="Tor routing" checked={torEnabled} onChange={(v) => setSecurity({ torEnabled: v })} />
          <RowSelect icon={Network} label="Network" value={network} options={[{ label: "Mainnet", value: "mainnet" }, { label: "Testnet", value: "testnet" }]} onChange={(v) => setSecurity({ network: v as "mainnet" | "testnet" })} />
        </Group>
      </Section>

      {/* Danger */}
      <Section title="Danger zone">
        <button onClick={() => setWipeGate(true)} className="w-full pressable rounded-2xl border border-destructive/40 bg-destructive/10 p-4 flex items-center gap-3 text-destructive">
          <Trash2 className="size-4" />
          <span className="text-sm font-medium flex-1 text-left">Clear all data</span>
        </button>
      </Section>

      {/* Edit merchant sheet */}
      <DetailSheet open={editMerchant} onClose={() => setEditMerchant(false)} title="Merchant profile">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-2xl border border-border bg-card">
            <label className="size-12 rounded-xl grid place-items-center cursor-pointer overflow-hidden relative" style={{ backgroundColor: brandColor }}>
              {logoDataUrl ? <img src={logoDataUrl} className="absolute inset-0 size-full object-cover" alt="" /> : <Building2 className="size-5 text-background" />}
              <input type="file" accept="image/*" onChange={onLogoUpload} className="hidden" />
              <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-foreground text-background grid place-items-center"><Upload className="size-3" /></span>
            </label>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{biz || "Your business"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{website || "—"}</p>
            </div>
          </div>
          <Input label="Business name *" value={biz} onChange={setBiz} />
          <Input label="Legal name" value={legal} onChange={setLegal} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Country" value={country} onChange={setCountry} />
            <Input label="Website" value={website} onChange={setWebsite} />
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Brand color</label>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {BRAND_PRESETS.map((c) => (
                <button key={c.value} onClick={() => setBrandColor(c.value)} className={`aspect-square rounded-xl border-2 ${brandColor === c.value ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: c.value }} aria-label={c.name} />
              ))}
            </div>
          </div>
          <button onClick={saveMerchant} className="w-full pressable rounded-2xl bg-primary text-primary-foreground py-3 text-sm font-semibold">Save</button>
        </div>
      </DetailSheet>

      {/* Reveal seed sheet */}
      <DetailSheet open={!!revealSeed} onClose={() => setRevealSeed(null)} title="Recovery phrase">
        {revealSeed === "gate" && (
          <PinGate title="Confirm with PIN" subtitle="Required to reveal your seed" onPass={() => setRevealSeed("show")} onCancel={() => setRevealSeed(null)} />
        )}
        {revealSeed === "show" && seed && (
          <div>
            <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-[11px] text-destructive flex gap-2 mb-4">
              <Shield className="size-3.5 shrink-0 mt-0.5" />
              <span>Never share these words. Anyone with them controls your funds.</span>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-card p-3">
              {seed.map((w, i) => (
                <div key={i} className="flex items-baseline gap-1.5 px-2 py-2 rounded-lg bg-foreground/5">
                  <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-4">{i + 1}</span>
                  <span className="text-sm font-mono">{w}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setRevealSeed(null)} className="mt-4 w-full pressable rounded-2xl bg-foreground/5 border border-border py-3 text-sm font-medium flex items-center justify-center gap-2">
              <EyeOff className="size-4" /> Hide
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-5 mt-6">
      <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">{children}</div>;
}

function RowButton({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full pressable flex items-center gap-3 px-4 py-3.5 active:bg-foreground/5">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm flex-1 text-left">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}

function RowToggle({ icon: Icon, label, checked, onChange }: { icon: React.ComponentType<{ className?: string }>; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      <button onClick={() => onChange(!checked)} className={`relative w-10 h-6 rounded-full transition ${checked ? "bg-primary" : "bg-foreground/15"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${checked ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

function RowSelect({ icon: Icon, label, value, options, onChange }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 text-muted-foreground" />
      <span className="text-sm flex-1">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm border border-border rounded-lg px-2 py-1 focus:outline-none">
        {options.map((o) => <option key={o.value} value={o.value} className="bg-card">{o.label}</option>)}
      </select>
    </div>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl bg-foreground/5 border border-border px-3 py-3 text-sm focus:outline-none focus:border-primary" />
    </div>
  );
}
