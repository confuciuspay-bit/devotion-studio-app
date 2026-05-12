
# Merchant identity stack — full sweep

Goal: turn Umbra from a personal wallet shell into a merchant-operable app. Every sensitive surface gates behind a PIN, every merchant-facing screen carries the merchant's brand, and a real first-launch flow seeds an identity instead of pre-filled mock data.

## 1. First-launch onboarding (`/onboarding`)

A 5-step full-screen flow shown when `useApp.initialised === false`:

1. **Welcome** — Umbra brand, "Set up your merchant account" CTA.
2. **Generate seed** — 12-word BIP39 mnemonic via `@scure/bip39` (already in deps if present, else add). Show words in a 3×4 grid, "I've written them down" gate.
3. **Confirm seed** — pick 3 random word indices, fail-closed retry.
4. **Set 4-digit PIN** — uses existing `PinPad`. Confirm by re-entry. Hash with `pinHash()` already in `store.ts`, persist as `pinHashStored`.
5. **Merchant profile** — business name, legal name, country, website (optional), brand color picker (sets `--primary-merchant`), logo upload (data URL, optional → falls back to monogram). All optional except business name.

On finish: `init(seed, seedHex, zAddr)` + `setMerchant(...)` + `setPinHash(...)`. Redirect to `/`.

Routing: `__root.tsx` checks `initialised`; if false and current path isn't `/onboarding`, redirect there. Bottom nav hidden during onboarding.

## 2. Settings (`/settings`)

Reachable from a gear in `AppHeader` (currently absent — add). Sections:

- **Merchant** — edit business name, legal name, country, website, brand color, logo. Live preview chip.
- **Security** — Change PIN (PIN-gated), Biometric unlock toggle (uses WebAuthn if available, else simulated), Auto-lock timer (1m/5m/15m/never).
- **Backup** — Reveal seed (PIN-gated, blurred until tap-and-hold), Export encrypted JSON.
- **Privacy** — Tor routing toggle (visual), Hide balances toggle (already exists, surface here), Display currency (already exists, move here).
- **Network** — Mainnet / Testnet stub.
- **Danger zone** — Clear all data (PIN-gated → calls `resetAll`).

## 3. Merchant profile data model

Add to `src/lib/store.ts`:

```ts
interface MerchantProfile {
  businessName: string;
  legalName?: string;
  country?: string;          // ISO-3166
  website?: string;
  brandColor?: string;       // oklch or hex
  logoDataUrl?: string;
  createdAt: number;
}

// new state fields
merchant: MerchantProfile | null;
pinHashStored: string | null;
biometricsEnabled: boolean;
autoLockMinutes: number | "never";
torEnabled: boolean;
network: "mainnet" | "testnet";

// new actions
setMerchant(patch): void
setPinHash(hash): void
setSecurity(patch): void
```

Persist all of these in `partialize`.

## 4. Brand application

A `MerchantBrand` provider mounted in `__root.tsx`:
- Injects `--brand` CSS var from `merchant.brandColor` (falls back to current `--primary`).
- Replaces hard `--primary` use in merchant-facing surfaces (Pay header card, Stream header, Vault header, invoice/checkout) with `--brand`.
- `AppHeader` shows the merchant logo (or monogram from initials) + business name as the active subtitle's prefix.

Personal pages (Wallet, Markets, coin detail) keep the default Umbra violet.

## 5. PIN-gated reveal primitive

New `<PinGate onPass={...}>` component wrapping `PinPad`:
- Verifies entered PIN against `pinHashStored` via `pinHash()`.
- 5-attempt rate limit with cooldown (stored in memory).
- Shake animation on failure (`animate-shake` keyframe added to `styles.css`).

Wire it into:
- Vault → reveal z-addr (currently just shown).
- Spend → reveal PAN/CVV (PIN gate already partially exists; consolidate).
- Settings → Reveal seed.
- Settings → Change PIN, Clear all data.

If `biometricsEnabled` and WebAuthn available, attempt `navigator.credentials.get` first, fall back to PIN.

## 6. Auto-lock

`useAutoLock()` hook in `__root.tsx`:
- Tracks last user interaction (`pointerdown`, `keydown`, route change).
- After `autoLockMinutes`, sets `locked: true` in store.
- A `<LockScreen />` overlay (PIN entry) renders when locked. Solves "phone left on counter" merchant case.

## 7. Header gear + merchant chip

Update `src/components/AppHeader.tsx`:
- Left: merchant logo/monogram (tap → `/settings`).
- Center: existing subtitle.
- Right: existing currency/hide actions + new gear icon to `/settings`.

## 8. Hydration bug fix (Wallet `Recent activity`)

Root cause: `index.tsx` activity entries hardcode strings like `"2m"`, `"1h"`, `"Yesterday"` — fine — but `AllHistorySheet` and other timestamp renderers use `toLocaleDateString()` / relative-from-`Date.now()`, which differ between SSR (UTC, en-US) and client (locale + later tick). The error trace shows `04/05/2026` vs `5/4/2026` and `2m` vs `3m/4m`.

Fix:
- Replace all `new Date(ts).toLocaleDateString()` calls in `AllHistorySheet`, `pay.tsx`, `stream.tsx`, `vault.tsx`, `spend.tsx` with a stable `fmtAbs(ts)` helper that outputs `YYYY-MM-DD HH:mm` (locale-independent, deterministic).
- For relative times (`"2m"`, `"3h"`), gate behind a `useMounted()` hook so SSR renders an empty placeholder and client renders the value after hydration. Add `useMounted` to `src/lib/utils.ts`.

## 9. Files touched / created

Created:
- `src/routes/onboarding.tsx`
- `src/routes/settings.tsx`
- `src/components/PinGate.tsx`
- `src/components/LockScreen.tsx`
- `src/components/MerchantBrand.tsx`
- `src/lib/useMounted.ts`
- `src/lib/time.ts` (`fmtAbs`, `fmtRelative`)

Edited:
- `src/lib/store.ts` — merchant + security state and actions
- `src/routes/__root.tsx` — onboarding redirect, brand provider, lock screen, auto-lock
- `src/components/AppHeader.tsx` — logo + gear
- `src/components/AllHistorySheet.tsx` — `fmtAbs` + `useMounted`
- `src/routes/index.tsx` — relative-time hydration guard
- `src/routes/vault.tsx` — z-addr behind `PinGate`
- `src/routes/spend.tsx` — consolidate PAN reveal under `PinGate`
- `src/styles.css` — `--brand` token, `animate-shake` keyframe

## 10. Out of scope (future passes)

UmbraPay merchant-grade (refunds/webhooks/invoice PDF), CSV import & payslip PDFs, Apple Wallet provisioning, region whitelist, top-up funding picker. Tracked for a follow-up sweep.
