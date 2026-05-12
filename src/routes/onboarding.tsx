import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useApp, pinHash } from "@/lib/store";
import { PinPad } from "@/components/PinPad";
import { generateMnemonic, mnemonicToSeedSync } from "@/lib/bip39";
import { Eye, EyeOff, Shield, ArrowLeft, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/onboarding")({ component: OnboardingPage });

type Step = "welcome" | "seed" | "confirm" | "pin" | "merchant" | "done";

const BRAND_PRESETS = [
  { name: "Emerald", value: "#10b981" },
  { name: "Amber",   value: "#f59e0b" },
  { name: "Rose",    value: "#f43f5e" },
  { name: "Cyan",    value: "#06b6d4" },
  { name: "Slate",   value: "#64748b" },
  { name: "Zinc",    value: "#71717a" },
];

function OnboardingPage() {
  const router = useRouter();
  const initialised = useApp((s) => s.initialised);
  const init = useApp((s) => s.init);
  const setMerchant = useApp((s) => s.setMerchant);
  const setPinHashStored = useApp((s) => s.setPinHashStored);

  useEffect(() => {
    if (initialised) router.navigate({ to: "/" });
  }, [initialised, router]);

  const [step, setStep] = useState<Step>("welcome");
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [revealed, setRevealed] = useState(false);

  const [confirmIdxs, setConfirmIdxs] = useState<number[]>([]);
  const [confirmInputs, setConfirmInputs] = useState<string[]>(["", "", ""]);

  const [pin1, setPin1] = useState<string | null>(null);

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
    const set = new Set<number>();
    while (set.size < 3) set.add(Math.floor(Math.random() * 12));
    setConfirmIdxs([...set].sort((a, b) => a - b));
    setConfirmInputs(["", "", ""]);
    setStep("confirm");
  }

  function checkConfirm() {
    const ok = confirmIdxs.every((idx, i) => confirmInputs[i].trim().toLowerCase() === mnemonic[idx]);
    if (!ok) { toast.error("Words don't match. Check your backup and try again."); return; }
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
    if (!biz.trim()) { toast.error("Business name is required"); return; }
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
    if (file.size > 500_000) { toast.error("Logo must be smaller than 500KB"); return; }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10" style={{ background: "var(--bg-base)" }}>
      <header className="flex items-center justify-between mb-10">
        <span className="text-[13px] font-medium tracking-[0.15em] uppercase" style={{ color: "var(--text-primary)" }}>
          umbra
        </span>
        <StepDots step={step} />
      </header>

      {step === "welcome" && <Welcome onNext={generate} />}
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
          <p className="text-[18px] font-medium text-center mb-1" style={{ color: "var(--text-primary)" }}>
            {pin1 ? "confirm your PIN" : "set a 4-digit PIN"}
          </p>
          <p className="text-[11px] font-light text-center mb-8" style={{ color: "var(--text-secondary)" }}>
            used to unlock the app and confirm sensitive actions
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
    <div className="flex gap-1.5 items-center">
      {order.map((s, i) => (
        <div
          key={s}
          className="transition-all"
          style={{
            height: 4,
            borderRadius: 2,
            width: i <= idx ? 20 : 8,
            background: i <= idx ? "var(--accent)" : "var(--bg-raised)",
          }}
        />
      ))}
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
      <p className="text-[24px] font-medium mb-2" style={{ color: "var(--text-primary)" }}>
        set up your account
      </p>
      <p className="text-[13px] font-light mb-8" style={{ color: "var(--text-secondary)" }}>
        umbra is a non-custodial, privacy-first PSP. your seed never leaves this device.
      </p>
      <div className="space-y-3 mb-10">
        {[
          "generate a 12-word recovery phrase",
          "set a 4-digit PIN to lock the app",
          "brand UmbraPay with your business",
        ].map((t) => (
          <div key={t} className="flex items-center gap-3">
            <span className="dot" style={{ background: "var(--status-ok)", flexShrink: 0 }} />
            <span className="text-[12px] font-light" style={{ color: "var(--text-secondary)" }}>{t}</span>
          </div>
        ))}
      </div>
      <button onClick={onNext} className="btn-primary w-full py-3">
        get started
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
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
      <button onClick={onBack} className="pressable self-start flex items-center gap-1 text-[11px] mb-6" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="size-3" /> back
      </button>
      <p className="text-[18px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>your recovery phrase</p>
      <p className="text-[12px] font-light mb-5" style={{ color: "var(--text-secondary)" }}>
        write these 12 words down on paper — in order. anyone with them controls your funds.
      </p>

      <div className="relative mb-4" style={{ border: "1px solid var(--border-default)", borderRadius: 4, padding: 16 }}>
        <div className={`grid grid-cols-3 gap-2 ${revealed ? "" : "blur-md select-none"}`}>
          {mnemonic.map((w, i) => (
            <div key={i} className="flex items-baseline gap-1.5 px-2 py-2" style={{ background: "var(--bg-raised)", borderRadius: 4 }}>
              <span className="text-[10px] tabular-nums w-4 shrink-0" style={{ color: "var(--text-tertiary)" }}>{i + 1}</span>
              <span className="text-[12px]" style={{ color: "var(--text-primary)" }}>{w}</span>
            </div>
          ))}
        </div>
        {!revealed && (
          <button
            onClick={onReveal}
            className="absolute inset-0 grid place-items-center"
          >
            <span className="pressable flex items-center gap-2 px-4 py-2 text-[12px]" style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-default)", borderRadius: 4, color: "var(--accent)" }}>
              <Eye className="size-3.5" /> tap to reveal
            </span>
          </button>
        )}
      </div>

      {revealed && (
        <button onClick={onReveal} className="self-end mb-3 pressable flex items-center gap-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
          <EyeOff className="size-3" /> hide
        </button>
      )}

      <div className="flex gap-2 mb-6 px-3 py-3" style={{ background: "rgba(248,113,113,0.05)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 4 }}>
        <Shield className="size-3.5 shrink-0 mt-0.5" style={{ color: "var(--status-err)" }} />
        <span className="text-[11px] font-light" style={{ color: "var(--status-err)" }}>
          never share these words. umbra support will never ask for them.
        </span>
      </div>

      <button
        onClick={onNext}
        disabled={!revealed}
        className="mt-auto btn-primary w-full py-3 disabled:opacity-40"
      >
        i've written them down
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
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full">
      <button onClick={onBack} className="pressable self-start flex items-center gap-1 text-[11px] mb-6" style={{ color: "var(--text-secondary)" }}>
        <ArrowLeft className="size-3" /> back
      </button>
      <p className="text-[18px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>confirm your phrase</p>
      <p className="text-[12px] font-light mb-6" style={{ color: "var(--text-secondary)" }}>
        type the requested words from your backup
      </p>
      <div className="space-y-4 mb-6">
        {idxs.map((idx, i) => (
          <div key={idx}>
            <p className="label mb-1.5">word #{idx + 1}</p>
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
              className="w-full"
              style={{ height: 36 }}
            />
          </div>
        ))}
      </div>
      <button
        onClick={onNext}
        disabled={inputs.some((x) => !x.trim())}
        className="mt-auto btn-primary w-full py-3 disabled:opacity-40"
      >
        continue
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
  const initials = useMemo(
    () => (props.biz || "U").trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase(),
    [props.biz],
  );

  return (
    <div className="flex-1 flex flex-col max-w-sm mx-auto w-full pb-6">
      <p className="text-[18px] font-medium mb-1" style={{ color: "var(--text-primary)" }}>brand your account</p>
      <p className="text-[12px] font-light mb-5" style={{ color: "var(--text-secondary)" }}>
        customers will see this on checkout pages and invoices
      </p>

      <div className="flex items-center gap-3 px-4 py-3 mb-5" style={{ border: "1px solid var(--border-default)", borderRadius: 4 }}>
        <label className="shrink-0 grid place-items-center cursor-pointer overflow-hidden relative" style={{ width: 40, height: 40, borderRadius: 4, backgroundColor: props.brandColor }}>
          {props.logoDataUrl ? (
            <img src={props.logoDataUrl} alt="" className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="text-[13px] font-medium" style={{ color: "#fff" }}>{initials}</span>
          )}
          <input type="file" accept="image/*" onChange={props.onLogoUpload} className="hidden" />
          <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center" style={{ width: 16, height: 16, borderRadius: "50%", background: "var(--text-primary)" }}>
            <Upload className="size-2.5" style={{ color: "var(--bg-base)" }} />
          </span>
        </label>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>{props.biz || "your business"}</p>
          <p className="text-[11px] font-light truncate" style={{ color: "var(--text-secondary)" }}>{props.website || "umbrapay.preview"}</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <MField label="business name *" value={props.biz} onChange={props.setBiz} placeholder="Acme Inc." />
        <MField label="legal name" value={props.legal} onChange={props.setLegal} placeholder="Acme Holdings LLC" />
        <div className="grid grid-cols-2 gap-3">
          <MField label="country" value={props.country} onChange={props.setCountry} placeholder="US" />
          <MField label="website" value={props.website} onChange={props.setWebsite} placeholder="acme.com" />
        </div>
        <div>
          <p className="label mb-2">brand color</p>
          <div className="grid grid-cols-6 gap-2">
            {BRAND_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => props.setBrandColor(c.value)}
                className="pressable aspect-square transition"
                style={{
                  borderRadius: 4,
                  backgroundColor: c.value,
                  border: `2px solid ${props.brandColor === c.value ? "var(--text-primary)" : "transparent"}`,
                }}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
      </div>

      <button onClick={props.onFinish} className="mt-auto btn-primary w-full py-3">
        open umbra
      </button>
    </div>
  );
}

function MField({
  label, value, onChange, placeholder,
}: {
  label: string; value: string; onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <p className="label mb-1.5">{label}</p>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
        style={{ height: 36 }}
      />
    </div>
  );
}
