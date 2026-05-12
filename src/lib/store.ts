// Zustand persisted store — single source of truth for the app

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type PaymentStatus = "INITIATED" | "FUNDED" | "LOCKED" | "RELEASED" | "REFUNDED" | "EXPIRED";
export type BatchStatus = "DRAFT" | "ANCHORED" | "SWAPPING" | "SHIELDED" | "DISTRIBUTING" | "COMPLETED";

export interface PaymentRecord {
  id: string;
  amountUsd: number;
  amountToken: number;
  token: string;          // symbol
  coinId: string;         // CoinGecko id
  chainId: string;
  address: string;
  expiresAt: number;
  createdAt: number;
  status: PaymentStatus;
  vault: boolean;
  feeUsd: number;
  customer?: string;
  reference?: string;
  hash?: string;
  webhookUrl?: string;
}

export interface Recipient {
  id: string;
  label: string;
  address: string;
  chainId: string;
  amountUsd: number;
  outToken: string;       // requested output symbol
  status?: "pending" | "swapping" | "shielded" | "sent";
}

export interface BatchRecord {
  id: string;
  name: string;
  mode: "standard-batch" | "standard-payroll" | "enhanced-batch" | "enhanced-payroll";
  recipients: Recipient[];
  totalUsd: number;
  feeUsd: number;
  createdAt: number;
  status: BatchStatus;
  hashV1?: string;        // pre-anchor
  hashV2?: string;        // post-distribution
  schedule?: "once" | "weekly" | "monthly";
  invoiceAnchor?: boolean;
}

export interface VaultActivity {
  id: string;
  kind: "shield" | "payout";
  fromCoinId?: string;
  fromChainId?: string;
  fromAmountUsd: number;
  zecAmount: number;
  toAddress?: string;
  toChainId?: string;
  toCoinId?: string;
  oneTimeTAddr?: string;
  hash: string;
  ts: number;
  fee: number;
  status: "swapping" | "shielded" | "completed";
}

export interface Holding {
  coinId: string;
  symbol: string;
  amount: number;
}

export interface CardTx {
  id: string;
  merchant: string;
  city: string;
  amountUsd: number;
  category: string;
  ts: number;
  fx?: { ccy: string; amount: number; rate: number };
  status: "settled" | "pending" | "declined";
  funding: "vault" | "wallet";
}

export interface CardSettings {
  frozen: boolean;
  online: boolean;
  contactless: boolean;
  atm: boolean;
  dailyLimit: number;
  monthlyLimit: number;
  pinHash?: string;       // SHA-256 of PIN
  applePayLinked: boolean;
}

export interface Contact {
  id: string;
  label: string;
  address: string;
  chainId: string;
}

export interface Invoice {
  id: string;
  number: string;
  recipient: string;
  amountUsd: number;
  hashV1: string;
  hashV2?: string;
  anchorTx?: string;
  ts: number;
}

interface AppState {
  // Identity
  seed: string[] | null;
  seedHex: string | null;
  initialised: boolean;

  // Wallet
  holdings: Holding[];
  watchlist: string[];   // coin ids
  contacts: Contact[];

  // Pay
  payments: PaymentRecord[];
  monthlyVolumeUsd: number;
  vaultEnabled: boolean;

  // Stream
  batches: BatchRecord[];
  invoices: Invoice[];

  // Vault
  vaultZec: number;
  vaultActivity: VaultActivity[];
  zAddr: string;

  // Card
  cardSettings: CardSettings;
  cardTxs: CardTx[];
  cardBalanceUsd: number;

  // UX
  hideBalances: boolean;
  displayCurrency: string;

  // actions
  init: (seed: string[], seedHex: string, zAddr: string) => void;
  setHolding: (h: Holding) => void;
  toggleWatch: (id: string) => void;
  addContact: (c: Contact) => void;
  removeContact: (id: string) => void;

  addPayment: (p: PaymentRecord) => void;
  updatePayment: (id: string, patch: Partial<PaymentRecord>) => void;

  addBatch: (b: BatchRecord) => void;
  updateBatch: (id: string, patch: Partial<BatchRecord>) => void;
  addInvoice: (i: Invoice) => void;

  shieldFunds: (entry: VaultActivity) => void;
  payoutFromVault: (entry: VaultActivity) => void;
  updateVaultActivity: (id: string, patch: Partial<VaultActivity>) => void;

  setCardSettings: (s: Partial<CardSettings>) => void;
  addCardTx: (t: CardTx) => void;
  topupCard: (usd: number) => void;
  toggleHideBalances: () => void;
  setDisplayCurrency: (c: string) => void;

  resetAll: () => void;
}

const DEFAULT_HOLDINGS: Holding[] = [
  { coinId: "zcash", symbol: "ZEC", amount: 142.5 },
  { coinId: "bitcoin", symbol: "BTC", amount: 0.0612 },
  { coinId: "ethereum", symbol: "ETH", amount: 1.84 },
  { coinId: "usd-coin", symbol: "USDC", amount: 8200 },
  { coinId: "solana", symbol: "SOL", amount: 12.4 },
  { coinId: "monero", symbol: "XMR", amount: 4.2 },
];

export const useApp = create<AppState>()(
  persist(
    (set) => ({
      seed: null,
      seedHex: null,
      initialised: false,
      holdings: DEFAULT_HOLDINGS,
      watchlist: ["zcash", "bitcoin", "ethereum", "monero"],
      contacts: [
        { id: "c1", label: "Personal cold wallet", address: "0x9d2e7c8b5a3f0e1d6b2a4c5e8f9a1b3c4d5e6f70", chainId: "ethereum" },
        { id: "c2", label: "Treasury Safe", address: "0x4f1c8e3a2b9d5e6f7a8b9c0d1e2f3a4b5c6d7e80", chainId: "arbitrum" },
      ],
      payments: [
        { id: "INV-2041", amountUsd: 1250, amountToken: 1250, token: "USDC", coinId: "usd-coin",
          chainId: "ethereum", address: "0x7a3f9c2e1b8d5f6a4c7e9b1d3f5a7c9e1b3d5f70",
          expiresAt: Date.now() + 86400000, createdAt: Date.now() - 3600_000,
          status: "FUNDED", vault: true, feeUsd: 25, customer: "0x7a3f…91cE", reference: "PO-552" },
        { id: "INV-2040", amountUsd: 340, amountToken: 340, token: "USDC", coinId: "usd-coin",
          chainId: "polygon", address: "0x1d22ff80a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d2",
          expiresAt: Date.now() + 86400000, createdAt: Date.now() - 7200_000,
          status: "RELEASED", vault: true, feeUsd: 6.8, customer: "0x1d22…ff80", reference: "PO-549",
          hash: "0xabcd1234ef567890abcdef1234567890abcdef12" },
      ],
      monthlyVolumeUsd: 184_290,
      vaultEnabled: true,

      batches: [
        { id: "b1", name: "Engineering · M5", mode: "enhanced-batch",
          recipients: Array.from({ length: 14 }, (_, i) => ({
            id: `r${i}`, label: `Engineer ${i + 1}`,
            address: "zs1" + Array.from({length: 75}, () => "qpzry9x8gf2tvdw0s3jn54khce6mua7l"[Math.floor(Math.random()*32)]).join(""),
            chainId: "zcash", amountUsd: 48200 / 14, outToken: "USDC",
          })),
          totalUsd: 48200, feeUsd: 48200 * 0.0175 + 0.28, createdAt: Date.now() - 2 * 86400000,
          status: "COMPLETED", schedule: "monthly", invoiceAnchor: true,
          hashV1: "0x" + "a".repeat(64), hashV2: "0x" + "b".repeat(64) },
      ],
      invoices: [],

      vaultZec: 1284.62,
      vaultActivity: [
        { id: "v1", kind: "shield", fromCoinId: "usd-coin", fromChainId: "ethereum",
          fromAmountUsd: 1250, zecAmount: 12.4, oneTimeTAddr: "t1abc123def456ghi789jkl012mno345pqr",
          hash: "0xa1c2ee44", ts: Date.now() - 3600_000, fee: 25, status: "completed" },
      ],
      zAddr: "zs1" + Array.from({length: 75}, (_, i) => "qpzry9x8gf2tvdw0s3jn54khce6mua7l"[i % 32]).join(""),

      cardSettings: {
        frozen: false, online: true, contactless: true, atm: true,
        dailyLimit: 5000, monthlyLimit: 50000, applePayLinked: false,
      },
      cardTxs: [
        { id: "t1", merchant: "Rakuten", city: "Tokyo", amountUsd: 42.10, category: "Shopping",
          ts: Date.now() - 4 * 3600_000, fx: { ccy: "JPY", amount: 6280, rate: 149.16 },
          status: "settled", funding: "vault" },
        { id: "t2", merchant: "Lufthansa", city: "Online", amountUsd: 612.00, category: "Travel",
          ts: Date.now() - 86400000, fx: { ccy: "EUR", amount: 565, rate: 1.083 },
          status: "settled", funding: "vault" },
        { id: "t3", merchant: "Blue Bottle", city: "NYC", amountUsd: 7.50, category: "Coffee",
          ts: Date.now() - 3 * 86400000, status: "settled", funding: "wallet" },
      ],
      cardBalanceUsd: 2184.30,
      hideBalances: false,
      displayCurrency: "USD",

      init: (seed, seedHex, zAddr) => set({ seed, seedHex, zAddr, initialised: true }),
      toggleHideBalances: () => set((s) => ({ hideBalances: !s.hideBalances })),
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),
      setHolding: (h) =>
        set((s) => {
          const idx = s.holdings.findIndex((x) => x.coinId === h.coinId);
          const next = [...s.holdings];
          if (idx >= 0) next[idx] = h;
          else next.push(h);
          return { holdings: next };
        }),
      toggleWatch: (id) =>
        set((s) => ({
          watchlist: s.watchlist.includes(id)
            ? s.watchlist.filter((x) => x !== id)
            : [...s.watchlist, id],
        })),
      addContact: (c) => set((s) => ({ contacts: [...s.contacts, c] })),
      removeContact: (id) => set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) })),

      addPayment: (p) =>
        set((s) => ({ payments: [p, ...s.payments], monthlyVolumeUsd: s.monthlyVolumeUsd + p.amountUsd })),
      updatePayment: (id, patch) =>
        set((s) => ({
          payments: s.payments.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        })),

      addBatch: (b) => set((s) => ({ batches: [b, ...s.batches] })),
      updateBatch: (id, patch) =>
        set((s) => ({ batches: s.batches.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
      addInvoice: (i) => set((s) => ({ invoices: [i, ...s.invoices] })),

      shieldFunds: (e) =>
        set((s) => ({
          vaultActivity: [e, ...s.vaultActivity],
          vaultZec: s.vaultZec + e.zecAmount,
        })),
      payoutFromVault: (e) =>
        set((s) => ({
          vaultActivity: [e, ...s.vaultActivity],
          vaultZec: Math.max(0, s.vaultZec - e.zecAmount),
        })),
      updateVaultActivity: (id, patch) =>
        set((s) => ({
          vaultActivity: s.vaultActivity.map((v) => (v.id === id ? { ...v, ...patch } : v)),
        })),

      setCardSettings: (patch) =>
        set((s) => ({ cardSettings: { ...s.cardSettings, ...patch } })),
      addCardTx: (t) =>
        set((s) => ({ cardTxs: [t, ...s.cardTxs], cardBalanceUsd: s.cardBalanceUsd - t.amountUsd })),
      topupCard: (usd) => set((s) => ({ cardBalanceUsd: s.cardBalanceUsd + usd })),

      resetAll: () =>
        set({
          seed: null, seedHex: null, initialised: false,
          holdings: DEFAULT_HOLDINGS, watchlist: ["zcash", "bitcoin", "ethereum"],
          payments: [], batches: [], invoices: [], vaultActivity: [], cardTxs: [],
          monthlyVolumeUsd: 0, vaultZec: 0, cardBalanceUsd: 0,
          cardSettings: { frozen: false, online: true, contactless: true, atm: true,
            dailyLimit: 5000, monthlyLimit: 50000, applePayLinked: false },
        }),
    }),
    {
      name: "umbra-app-v1",
      partialize: (s) => ({
        seed: s.seed, seedHex: s.seedHex, initialised: s.initialised,
        holdings: s.holdings, watchlist: s.watchlist, contacts: s.contacts,
        payments: s.payments, monthlyVolumeUsd: s.monthlyVolumeUsd, vaultEnabled: s.vaultEnabled,
        batches: s.batches, invoices: s.invoices,
        vaultZec: s.vaultZec, vaultActivity: s.vaultActivity, zAddr: s.zAddr,
        cardSettings: s.cardSettings, cardTxs: s.cardTxs, cardBalanceUsd: s.cardBalanceUsd,
        hideBalances: s.hideBalances, displayCurrency: s.displayCurrency,
      }),
    },
  ),
);

export async function pinHash(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("umbra-pin:" + pin));
  return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
}
