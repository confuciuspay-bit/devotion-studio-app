
# Umbra Mobile — Make Everything Functional

Goal: turn the existing visual shell into a fully interactive iPhone-optimized PWA where every button opens a real flow. Frontend-only with `localStorage` persistence; CoinGecko for live data. No real on-chain broadcast (the spec needs Tor RPC, zebrad, smart contracts — impossible inside a web app), but every flow simulates the spec lifecycle (`INITIATED → FUNDED → LOCKED → RELEASED`, fee math from `11_fees.md`, vault states, batch states).

---

## 1. Foundation

**Persistent store** — `src/lib/store.ts` (Zustand + localStorage)
- `wallets[]` (per chain, derived from one BIP39 seed generated on first launch via `@scure/bip39` + `@scure/bip32`)
- `watchlist[]`, `payments[]`, `invoices[]`, `batches[]`, `vaultBalance`, `vaultPayouts[]`, `cardSettings`, `merchant` (mock UBO profile)
- Actions update state and trigger simulated lifecycle transitions on timers (e.g. `INITIATED→FUNDED` after 8s).

**Coin universe** — `src/lib/markets.ts`
- New `useCoinSearch(q)` → CoinGecko `/search` (covers all ~14k coins).
- New `useTopMarkets(n=250, page)` → `/coins/markets` with pagination + infinite scroll.
- Cache logos by id; chain logos from CoinGecko `/asset_platforms`.

**Chain registry** — `src/lib/chains.ts`
Mirrors `01_architecture.md` table (EVM×10, Solana, BTC, TRON, TON, XMR, ZEC, Cosmos, XRP, LTC/BCH/DOGE) with: id, name, logo, native symbol, BIP44 path, address generator, explorer URL, required confirmations, fixed fee from `11_fees.md`.

**Fee engine** — `src/lib/fees.ts`
Implements `11_fees.md` exactly: PSP marginal tiers, vault 2% flat, stream 0.25/0.30% + per-recipient, swap 0.08–0.45% spread, card blended.

**UI primitives** — extend `DetailSheet` into a full sheet/router pattern (`AmountInput`, `ChainPicker`, `CoinPicker`, `AddressInput` with QR scan placeholder, `ConfirmStep`, `StatusStep`).

---

## 2. Wallet (`/`)

Every action button opens a multi-step sheet:

- **Receive** — pick coin → pick chain → generate fresh address (CREATE2-style deterministic for EVM, BIP44 derivation for non-EVM via `@scure/bip32`) → show QR (`qrcode` lib) + copy + share + "set amount". Address is real and chain-valid format.
- **Send** — coin → chain → recipient (paste/scan/contacts) → amount (with USD toggle, MAX, balance check) → fee preview from chain fixed-fee table → confirm → simulated broadcast with hash, lifecycle states, explorer link.
- **Swap** — from coin → to coin → amount → live CoinGecko quote + 0.50% spread (UmbraWallet rate) → route shown (Maya / THORChain / NEAR Intents per spec) → confirm → simulated streaming swap progress bar.
- **Shield** — pick asset → amount → quote (Maya `SWAP:ZEC.ZEC:...`) → "Send to Vault" → adds to vault balance, creates `vaultPayouts` history row.

Asset rows already clickable → coin detail page (already built, will be enriched with extra ranges 24h/7d/30d/1y already partially done).

Activity row sheet stays but now reads from real `payments[]` store with real hash + status transitions.

---

## 3. Markets (`/markets`)

- Replace fixed `DEFAULT_IDS` with **paginated top-250** infinite scroll.
- Search input debounced → CoinGecko `/search` → results with logo, then resolved to live price via `/simple/price`.
- Tabs: All · Watchlist · Gainers · Losers · New listings · DeFi · L2.
- Featured carousel rotates ZEC/BTC/ETH + top 24h gainer.
- Star toggle persists to store (already does, but global now).
- Tap row → coin detail (existing) with Buy/Swap/Send/Receive shortcuts wired to wallet sheets.

---

## 4. Pay (`/pay`) — UmbraPay PSP merchant view

- **Create payment** FAB → sheet: amount (USD or token) → coin/chain picker → expiry (1h/24h/7d) → vault toggle (shows fee breakdown 2% flat vs 0.50% PSP) → "Create" → returns payment with deterministic address + QR + share link → status auto-progresses INITIATED→FUNDED→LOCKED→RELEASED.
- Payment list shows real `payments[]`, filter chips (All/Active/Completed/Refunded/Expired), tap → detail sheet with full lifecycle timeline, hash, fee breakdown, refund button (manual REFUNDED), copy address, view on explorer.
- Header KPIs computed live (volume today, fees, active count).
- "Refund", "Resend webhook", "Copy link" buttons all wired.

---

## 5. Stream (`/stream`) — UmbraStream payroll/batch

- **New batch** sheet: choose mode (Standard batch / Standard payroll / **Enhanced ZEC vault**) → add recipients (paste CSV or add manually: address, chain, output token, amount, label) → fee math live (0.25 + $0.02·N or 1.75% enhanced per spec) → invoice anchoring toggle → review → "Execute" → status timeline (Hash v1 → Swapping → Shielded → Hash v2 → Distributed).
- Batch detail sheet: per-recipient status, copy hash, download payslip PDF (jsPDF, generated client-side with dual-hash proof).
- Invoice anchoring page: paste invoice → SHA-256 hash → "Anchor" → fake tx hash + verifiable URL.

---

## 6. Vault (`/vault`) — UmbraVault ZEC shielded

- Header: anonymity set (live ZEC shielded supply via CoinGecko), merchant z-addr (masked, reveal on biometric prompt), shielded balance.
- **Payout** sheet: pick output coin/chain → amount → recipient address → privacy delay (None/1h/24h/random) → fee 2% flat shown → confirm → simulated z_sendmany with progress (Quote → Streaming swap → Sent).
- **Add funds** opens Wallet → Shield flow.
- Transit log: list of recent shield-ins + payouts, each with detail sheet showing one-time t-addr, swap route, ZEC amount, payout details.

---

## 7. Spend (`/spend`) — UmbraSpend card

- Card flip animation; **Reveal** button uses a 4-digit PIN gate (set on first reveal, stored hashed in localStorage) to show PAN/CVV/exp.
- **Add to Apple Wallet** — generate a `.pkpass`-styled link (real `web+pkpass:` href + `apple-wallet-add` button styled). Since we can't sign a real .pkpass, button shows a sheet explaining provisioning + opens `https://wallet.apple.com/add` deep link with mock data.
- Controls: Freeze, Limits (daily/monthly sliders → persisted), Online/Contactless/ATM toggles, Region whitelist multi-select, Replace card, Report lost.
- Top-up sheet: pick funding source (Vault / Wallet asset) → amount → fee blended per spec → confirm.
- Transactions list: clickable, detail sheet with merchant, MCC, FX rate, dispute button.

---

## 8. Cross-cutting

- **Bottom nav**: 5 tabs — Wallet · Markets · Pay · Stream · Vault. Spend moved to a swipe-in "More" drawer accessible from Wallet header (keeps 5 visible per iOS HIG).
- **Haptic feedback** on every press via `navigator.vibrate(8)`.
- **Toasts** via existing `sonner`.
- **Onboarding** (first launch): generate seed → "Back up your 12 words" → confirm 3 random words → set 4-digit PIN → land on Wallet.
- **Settings** route (gear icon in header): seed export (PIN-gated), PIN change, network (mainnet/testnet stub), Tor toggle (visual), language, clear data.

---

## Technical notes

New deps: `zustand`, `qrcode`, `@scure/bip39`, `@scure/bip32`, `@noble/secp256k1`, `bs58`, `jspdf`, `framer-motion` (sheet transitions). All run in browser, no Node-only deps.

No smart contract calls, no Tor, no zebrad — every "broadcast" is a setTimeout state machine matching the spec's lifecycle exactly. UI/UX is indistinguishable from a real client.

Files added (~25): `lib/{store,chains,fees,addresses,qr,pdf}.ts`, `components/sheets/{AmountInput,ChainPicker,CoinPicker,AddressInput,Confirm,StatusTimeline,PinPad}.tsx`, `components/flows/{Send,Receive,Swap,Shield,CreatePayment,NewBatch,Payout,Topup,RevealCard}.tsx`, `routes/{settings,onboarding}.tsx`, plus refactors to all 5 existing routes.

Estimated complexity: large (~3500 LOC). Worth implementing in one pass since flows share primitives.
