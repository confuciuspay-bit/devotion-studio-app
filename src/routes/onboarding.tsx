import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useApp, pinHash } from "@/lib/store";
import { PinPad } from "@/components/PinPad";
import { generateMnemonic, mnemonicToSeedSync, wordlist as bip39Wordlist } from "@/lib/bip39";
import { ChevronRight, Eye, EyeOff, Shield, Check, Sparkles, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

type Step = "welcome" | "seed" | "confirm" | "pin" | "merchant" | "done";

const BRAND_PRESETS = [
  { name: "Violet",   value: "oklch(0.68 0.22 295)" },
  { name: "Emerald",  value: "oklch(0.72 0.18 155)" },
  { name: "Amber",    value: "oklch(0.78 0.16 70)" },
  { name: "Rose",     value: "oklch(0.70 0.20 15)" },
  { name: "Cyan",     value: "oklch(0.74 0.14 220)" },
  { name: "Slate",    value: "oklch(0.66 0.04 260)" },
];

function OnboardingPage() {
  const router = useRouter();
  const initialised = useApp((s) => s.initialised);
  const init = useApp((s) => s.init);
  const setMerchant = useApp((s) => s.setMerchant);
  const setPinHashStored = useApp((s) => s.setPinHashStored);

  // Already onboarded — bounce to home.
  useEffect(() => {
    if (initialised) router.navigate({ to: "/" });
  }, [initialised, router]);

  const [step, setStep] = useState<Step>("welcome");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  // Confirm 3 random word indices
  const [confirmIdxs, setConfirmIdxs] = useState<number[]>([]);
  const [confirmInputs, setConfirmInputs] = useState<string[]>(["", "", ""]);

  // PIN
  const [pin1, setPin1] = useState<string | null>(null);

  // Merchant
  const [biz, setBiz] = useState("");
  const [legal, setLegal] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [brandColor, setBrandColor] = useState(BRAND_PRESETS[0].value);
  const [logoDataUrl, setLogoDataUrl] = useState<string | undefined>();

  function generate() {
    const m = generateMnemonic();
    setMnemonic(m);
    setStep("seed");
  }

  function startConfirm() {
    // pick 3 distinct random indices
    const set = new Set<number>();
    while (set.size < 3) set.add(Math.floor(Math.random() * 12));
    setConfirmIdxs([...set].sort((a, b) => a - b));
    setConfirmInputs(["", "", ""]);
    setStep("confirm");
  }

  function checkConfirm() {
    const ok = confirmIdxs.every((idx, i) => confirmInputs[i].trim().toLowerCase() === mnemonic[idx]);
    if (!ok) {
      toast.error("Words don't match. Check your backup and try again.");
      return;
    }
    setStep("pin");
  }

  async function commitPin(pin: string) {
    if (!pin1) {
      setPin1(pin);
      toast.success("Enter the same PIN again to confirm");
    } else if (pin === pin1) {
      const h = await pinHash(pin);
      setPinHashStored(h);
      setStep("merchant");
    } else {
      setPin1(null);
      toast.error("PINs don't match. Try again.");
    }
  }

  async function finish() {
    if (!biz.trim()) {
      toast.error("Business name is required");
      return;
    }
    // derive a stub seedHex + zAddr from mnemonic
    const seedBytes = mnemonicToSeedSync(mnemonic.join(" "));
    const seedHex = Array.from(seedBytes.slice(0, 32) as Uint8Array).map((b: number) => b.toString(16).padStart(2, "0")).join("");
    const zAddr = "zs1" + Array.from({ length: 75 }, (_, i) => "qpzry9x8gf2tvdw0s3jn54khce6mua7l"[(seedBytes[i % seedBytes.length] ?? i) % 32]).join("");

    init(mnemonic, seedHex, zAddr);
    setMerchant({
      businessName: biz.trim(),
      legalName: legal.trim() || undefined,
      country: country.trim() || undefined,
      website: website.trim() || undefined,
      brandColor,
      logoDataUrl,
      createdAt: Date.now(),
    });
    toast.success("Welcome to Umbra");
    router.navigate({ to: "/" });
  }

  function onLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      toast.error("Logo must be smaller than 500KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 bg-background">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <div className="size-7 rounded-lg bg-foreground/95 grid place-items-center">
            <div className="size-3 rounded-full bg-background" />
          </div>
          <span className="font-display font-semibold tracking-tight text-lg">umbra</span>
        </div>
        <StepDots step={step} />
      </header>

      {step === "welcome" && (
        <Welcome onNext={generate} />
      )}
      {step === "seed" && (
        <SeedView
          mnemonic={mnemonic}
          revealed={revealed}
          onReveal={() => setRevealed((v) => !v)}
          onBack={() => setStep("welcome")}
          onNext={startConfirm}
        />
      )}
      {step === "confirm" && (
        <ConfirmView
          idxs={confirmIdxs}
          inputs={confirmInputs}
          setInputs={setConfirmInputs}
          onBack={() => setStep("seed")}
          onNext={checkConfirm}
        />
      )}
      {step === "pin" && (
        <div className="flex-1 flex flex-col justify-center max-w-sm w-full mx-auto">
          <h2 className="text-xl font-display font-semibold text-center mb-1">
            {pin1 ? "Confirm your PIN" : "Set a 4-digit PIN"}
          </h2>
          <p className="text-xs text-muted-foreground text-center mb-6">
            Used to unlock the app and confirm sensitive actions.
          </p>
          <PinPad key={pin1 ? "confirm" : "set"} onSubmit={commitPin} />
        </div>
      )}
      {step === "merchant" && (
        <MerchantView
          biz={biz} setBiz={setBiz}
          legal={legal} setLegal={setLegal}
          country={country} setCountry={setCountry}
          website={website} setWebsite={setWebsite}
          brandColor={brandColor} setBrandColor={setBrandColor}
          logoDataUrl={logoDataUrl} onLogoUpload={onLogoUpload}
          onFinish={finish}
        />
      )}
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  const order: Step[] = ["welcome", "seed", "confirm", "pin", "merchant"];
  const idx = order.indexOf(step);
  return (
    <div className="flex gap-1.5">
      {order.map((s, i) => (
        <div
          key={s}
          className={`h-1 rounded-full transition-all ${i <= idx ? "w-6 bg-primary" : "w-3 bg-foreground/15"}`}
        />
      ))}
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center text-center max-w-sm mx-auto animate-fade-in">
      <div className="size-16 mx-auto rounded-2xl bg-primary/15 text-primary grid place-items-center mb-6">
        <Sparkles className="size-7" />
      </div>
      <h1 className="text-3xl font-display font-semibold tracking-tight">
        Set up your merchant account
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Umbra is a non-custodial, privacy-first PSP. Your seed never leaves this device.
      </p>
      <ul className="mt-8 space-y-3 text-left text-sm">
        {[
          "Generate a 12-word recovery phrase",
          "Set a 4-digit PIN to lock the app",
          "Brand UmbraPay with your business",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <Check className="size-4 text-shield mt-0.5 shrink-0" />
            <span className="text-muted-foreground">{t}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onNext}
        className="mt-10 pressable rounded-2xl bg-primary text-primary-foreground py-4 text-sm font-semibold flex items-center justify-center gap-2"
      >
        Get started <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

function SeedView({
  mnemonic, revealed, onReveal, onBack, onNext,
}: {
  mnemonic: string[]; revealed: boolean;
  onReveal: () => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full animate-fade-in">
      <button onClick={onBack} className="self-start text-xs text-muted-foreground flex items-center gap-1 mb-4 pressable">
        <ArrowLeft className="size-3.5" /> Back
      </button>
      <h2 className="text-xl font-display font-semibold">Your recovery phrase</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Write these 12 words down on paper — in order. Anyone with them controls your funds.
      </p>

      <div className="mt-5 relative rounded-2xl border border-border bg-card p-4">
        <div className={`grid grid-cols-3 gap-2 ${revealed ? "" : "blur-md select-none"}`}>
          {mnemonic.map((w, i) => (
            <div key={i} className="flex items-baseline gap-1.5 px-2 py-2 rounded-lg bg-foreground/5">
              <span className="text-[10px] font-mono text-muted-foreground tabular-nums w-4">{i + 1}</span>
              <span className="text-sm font-mono">{w}</span>
            </div>
          ))}
        </div>
        {!revealed && (
          <button
            onClick={onReveal}
            className="absolute inset-0 grid place-items-center text-sm font-medium text-primary"
          >
            <span className="flex items-center gap-2 pressable px-4 py-2 rounded-full bg-background border border-border">
              <Eye className="size-4" /> Tap to reveal
            </span>
          </button>
        )}
      </div>

      {revealed && (
        <button
          onClick={onReveal}
          className="self-end mt-2 text-[11px] text-muted-foreground flex items-center gap-1"
        >
          <EyeOff className="size-3" /> Hide
        </button>
      )}

      <div className="mt-5 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-[11px] text-destructive flex gap-2">
        <Shield className="size-3.5 shrink-0 mt-0.5" />
        <span>Never share these words. Umbra support will never ask for them.</span>
      </div>

      <button
        onClick={onNext}
        disabled={!revealed}
        className="mt-auto pressable rounded-2xl bg-primary text-primary-foreground py-4 text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none"
      >
        I've written them down
      </button>
    </div>
  );
}

function ConfirmView({
  idxs, inputs, setInputs, onBack, onNext,
}: {
  idxs: number[]; inputs: string[];
  setInputs: (i: string[]) => void; onBack: () => void; onNext: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full animate-fade-in">
      <button onClick={onBack} className="self-start text-xs text-muted-foreground flex items-center gap-1 mb-4 pressable">
        <ArrowLeft className="size-3.5" /> Back
      </button>
      <h2 className="text-xl font-display font-semibold">Confirm your phrase</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Type the requested words from your backup.
      </p>
      <div className="mt-6 space-y-3">
        {idxs.map((idx, i) => (
          <div key={idx}>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Word #{idx + 1}
            </label>
            <input
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={inputs[i]}
              onChange={(e) => {
                const next = [...inputs];
                next[i] = e.target.value;
                setInputs(next);
              }}
              className="mt-1 w-full rounded-xl bg-foreground/5 border border-border px-3 py-3 font-mono text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={inputs.some((x) => !x.trim())}
        className="mt-auto pressable rounded-2xl bg-primary text-primary-foreground py-4 text-sm font-semibold disabled:opacity-40 disabled:pointer-events-none"
      >
        Continue
      </button>
    </div>
  );
}

function MerchantView(props: {
  biz: string; setBiz: (s: string) => void;
  legal: string; setLegal: (s: string) => void;
  country: string; setCountry: (s: string) => void;
  website: string; setWebsite: (s: string) => void;
  brandColor: string; setBrandColor: (s: string) => void;
  logoDataUrl?: string; onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFinish: () => void;
}) {
  const initials = (props.biz || "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full animate-fade-in pb-6">
      <h2 className="text-xl font-display font-semibold">Brand your account</h2>
      <p className="mt-2 text-xs text-muted-foreground">
        Customers will see this on checkout pages and invoices.
      </p>

      <div className="mt-6 flex items-center gap-3 p-4 rounded-2xl border border-border bg-card">
        <label className="size-12 rounded-xl grid place-items-center cursor-pointer overflow-hidden relative" style={{ backgroundColor: props.brandColor }}>
          {props.logoDataUrl ? (
            <img src={props.logoDataUrl} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="text-background font-display font-semibold text-base">{initials}</span>
          )}
          <input type="file" accept="image/*" onChange={props.onLogoUpload} className="hidden" />
          <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-foreground text-background grid place-items-center">
            <Upload className="size-3" />
          </span>
        </label>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{props.biz || "Your business"}</p>
          <p className="text-[11px] text-muted-foreground truncate">{props.website || "umbrapay.preview"}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <Field label="Business name" value={props.biz} onChange={props.setBiz} placeholder="Acme Inc." required />
        <Field label="Legal name" value={props.legal} onChange={props.setLegal} placeholder="Acme Holdings LLC" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country" value={props.country} onChange={props.setCountry} placeholder="US" />
          <Field label="Website" value={props.website} onChange={props.setWebsite} placeholder="acme.com" />
        </div>
        <div>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Brand color</label>
          <div className="mt-2 grid grid-cols-6 gap-2">
            {BRAND_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => props.setBrandColor(c.value)}
                className={`aspect-square rounded-xl border-2 transition ${props.brandColor === c.value ? "border-foreground" : "border-transparent"}`}
                style={{ backgroundColor: c.value }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={props.onFinish}
        className="mt-8 pressable rounded-2xl bg-primary text-primary-foreground py-4 text-sm font-semibold"
      >
        Open Umbra
      </button>
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, required,
}: {
  label: string; value: string; onChange: (s: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl bg-foreground/5 border border-border px-3 py-3 text-sm focus:outline-none focus:border-primary"
      />
    </div>
  );
}
