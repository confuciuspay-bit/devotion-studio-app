// Mock comprehensive history per panel domain.
// Each entry covers a real user action, used by AllHistorySheet.

export type HistoryScope = "wallet" | "pay" | "stream" | "vault" | "spend";

export interface HistoryEntry {
  id: string;
  scope: HistoryScope;
  kind: string;          // short type label, used as filter chip
  title: string;
  subtitle: string;
  amountUsd: number;     // signed (+ in / - out / 0 neutral)
  ts: number;            // ms
  status: "completed" | "pending" | "failed" | "scheduled";
  hash?: string;
  network?: string;
  fee?: number;
  counterparty?: string;
  note?: string;
}

const now = Date.now();
const day = 86_400_000;

function rid(p: string) {
  return p + "_" + Math.random().toString(36).slice(2, 8);
}
function hx() {
  return "0x" + Array.from({ length: 8 }, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("") + "…" +
         Array.from({ length: 4 }, () => "abcdef0123456789"[Math.floor(Math.random() * 16)]).join("");
}

export const HISTORY: HistoryEntry[] = [
  // ─────── Wallet ───────
  { id: rid("w"), scope: "wallet", kind: "Receive", title: "Received USDC",       subtitle: "From 0x7a3f…91cE",          amountUsd:  1250, ts: now -   2 * 60_000,  status: "completed", hash: hx(), network: "Ethereum",    fee: 1.20, counterparty: "0x7a3f…91cE" },
  { id: rid("w"), scope: "wallet", kind: "Send",    title: "Sent ETH",            subtitle: "To 0x9d2e…6f70",            amountUsd: -1480, ts: now -        1 * 3_600_000, status: "completed", hash: hx(), network: "Ethereum",    fee: 4.85, counterparty: "0x9d2e…6f70" },
  { id: rid("w"), scope: "wallet", kind: "Swap",    title: "Swap ETH → ZEC",      subtitle: "Maya · 0.50%",              amountUsd:    0, ts: now - 3 * 3_600_000, status: "completed", hash: hx(), network: "Maya",        fee: 1.42 },
  { id: rid("w"), scope: "wallet", kind: "Shield",  title: "Shielded into vault", subtitle: "via UmbraVault · ZEC",      amountUsd:    0, ts: now - 4 * 3_600_000, status: "completed", hash: hx(), network: "Zcash · Sapling", fee: 0.0001 },
  { id: rid("w"), scope: "wallet", kind: "Receive", title: "Received BTC",        subtitle: "From bc1q…m4ru",            amountUsd:   620, ts: now -  6 * 3_600_000, status: "completed", hash: hx(), network: "Bitcoin",     fee: 0.80 },
  { id: rid("w"), scope: "wallet", kind: "Send",    title: "Sent USDC",           subtitle: "To Treasury Safe",          amountUsd: -3200, ts: now -  1 * day,        status: "completed", hash: hx(), network: "Arbitrum",    fee: 0.18, counterparty: "Treasury Safe" },
  { id: rid("w"), scope: "wallet", kind: "Swap",    title: "Swap SOL → USDC",     subtitle: "Jupiter · 0.20%",           amountUsd:    0, ts: now -  1 * day - 2 * 3_600_000, status: "completed", hash: hx(), network: "Solana", fee: 0.06 },
  { id: rid("w"), scope: "wallet", kind: "Send",    title: "Sent XMR",            subtitle: "To 4Bx…vR8",                amountUsd:  -210, ts: now -  2 * day,        status: "failed",    hash: hx(), network: "Monero",      fee: 0.02 },
  { id: rid("w"), scope: "wallet", kind: "Receive", title: "Received ZEC",        subtitle: "From z-addr",               amountUsd:   480, ts: now -  3 * day,        status: "completed", hash: hx(), network: "Zcash",       fee: 0.0001 },
  { id: rid("w"), scope: "wallet", kind: "Approve", title: "Token approval",      subtitle: "USDC · Uniswap router",     amountUsd:    0, ts: now -  4 * day,        status: "completed", hash: hx(), network: "Ethereum",    fee: 2.10 },
  { id: rid("w"), scope: "wallet", kind: "Bridge",  title: "Bridge USDC",         subtitle: "Polygon → Arbitrum · CCTP", amountUsd:    0, ts: now -  5 * day,        status: "completed", hash: hx(), network: "CCTP",        fee: 0.30 },
  { id: rid("w"), scope: "wallet", kind: "Receive", title: "Received USDC",       subtitle: "Subscription · Pro plan",   amountUsd:    49, ts: now -  6 * day,        status: "completed", hash: hx(), network: "Polygon",     fee: 0.01 },
  { id: rid("w"), scope: "wallet", kind: "Send",    title: "Sent ETH",            subtitle: "Gas refill · cold wallet",  amountUsd:  -180, ts: now -  8 * day,        status: "completed", hash: hx(), network: "Ethereum",    fee: 1.90 },
  { id: rid("w"), scope: "wallet", kind: "Swap",    title: "Swap USDT → ZEC",     subtitle: "Maya · 0.50%",              amountUsd:    0, ts: now - 12 * day,        status: "completed", hash: hx(), network: "Maya",        fee: 0.95 },
  { id: rid("w"), scope: "wallet", kind: "Shield",  title: "Shielded BTC → ZEC",  subtitle: "via UmbraVault",            amountUsd:    0, ts: now - 18 * day,        status: "completed", hash: hx(), network: "Zcash · Sapling", fee: 4.10 },

  // ─────── Pay ───────
  { id: rid("p"), scope: "pay",   kind: "Invoice",  title: "Invoice INV-2041",     subtitle: "Funded · PO-552",          amountUsd:  1250, ts: now -  1 * 3_600_000, status: "pending",   counterparty: "0x7a3f…91cE", network: "Ethereum", fee: 25 },
  { id: rid("p"), scope: "pay",   kind: "Invoice",  title: "Invoice INV-2040",     subtitle: "Released · PO-549",        amountUsd:   340, ts: now -  2 * 3_600_000, status: "completed", counterparty: "0x1d22…ff80", network: "Polygon",  fee: 6.8, hash: hx() },
  { id: rid("p"), scope: "pay",   kind: "Link",     title: "Payment link paid",    subtitle: "Tip jar · @ankit",         amountUsd:    25, ts: now -  5 * 3_600_000, status: "completed", network: "Solana",   fee: 0.05, hash: hx() },
  { id: rid("p"), scope: "pay",   kind: "Recurring",title: "Subscription charged", subtitle: "Pro plan · USDC",          amountUsd:    49, ts: now -  1 * day,        status: "completed", counterparty: "alice@acme.io", network: "Polygon", fee: 0.05 },
  { id: rid("p"), scope: "pay",   kind: "Recurring",title: "Subscription charged", subtitle: "Enterprise · ZEC",         amountUsd:  1200, ts: now -  2 * day,        status: "completed", counterparty: "ops@cipher.co", network: "Zcash",   fee: 0.0001 },
  { id: rid("p"), scope: "pay",   kind: "Refund",   title: "Refund INV-2032",      subtitle: "Customer requested",       amountUsd:  -180, ts: now -  3 * day,        status: "completed", network: "Ethereum", fee: 1.20, hash: hx() },
  { id: rid("p"), scope: "pay",   kind: "QR",       title: "QR receive",           subtitle: "Coffee shop · USDC",       amountUsd:     8, ts: now -  3 * day - 2 * 3_600_000, status: "completed", network: "Polygon", fee: 0.01 },
  { id: rid("p"), scope: "pay",   kind: "Invoice",  title: "Invoice INV-2031",     subtitle: "Expired",                  amountUsd:   500, ts: now -  4 * day,        status: "failed",    counterparty: "0x4b88…22ee", network: "Ethereum" },
  { id: rid("p"), scope: "pay",   kind: "Webhook",  title: "Webhook delivered",    subtitle: "200 OK · payment.released", amountUsd:    0, ts: now -  4 * day,        status: "completed" },
  { id: rid("p"), scope: "pay",   kind: "Link",     title: "Payment link created", subtitle: "/pay/x9q…",                amountUsd:     0, ts: now -  5 * day,        status: "completed" },
  { id: rid("p"), scope: "pay",   kind: "Recurring",title: "Subscription cancelled", subtitle: "Newsletter · weekly",    amountUsd:     0, ts: now -  7 * day,        status: "completed", counterparty: "bob@startup.xyz" },
  { id: rid("p"), scope: "pay",   kind: "Invoice",  title: "Invoice INV-2018",     subtitle: "Released",                 amountUsd:  4200, ts: now - 14 * day,        status: "completed", counterparty: "0x9999…aaaa", network: "Ethereum", fee: 84, hash: hx() },
  { id: rid("p"), scope: "pay",   kind: "Refund",   title: "Refund INV-2010",      subtitle: "Partial · 50%",            amountUsd:  -120, ts: now - 21 * day,        status: "completed", network: "Polygon", fee: 0.04, hash: hx() },

  // ─────── Stream ───────
  { id: rid("s"), scope: "stream", kind: "Batch",    title: "Engineering · M5",     subtitle: "14 recipients · enhanced",  amountUsd: -48200, ts: now - 2 * day, status: "completed", network: "Multi-chain", fee: 843.78, hash: hx() },
  { id: rid("s"), scope: "stream", kind: "Batch",    title: "Contractors · weekly", subtitle: "6 recipients · standard",   amountUsd:  -8940, ts: now - 8 * day, status: "completed", network: "Polygon",     fee: 44.7,  hash: hx() },
  { id: rid("s"), scope: "stream", kind: "Batch",    title: "Design · M4",          subtitle: "4 recipients · enhanced",   amountUsd: -12400, ts: now - 35 * day, status: "completed", network: "Multi-chain", fee: 217,   hash: hx() },
  { id: rid("s"), scope: "stream", kind: "Schedule", title: "Engineering · M6",     subtitle: "Scheduled · runs in 2d",    amountUsd: -49100, ts: now + 2 * day,  status: "scheduled" },
  { id: rid("s"), scope: "stream", kind: "Recipient",title: "Recipient added",      subtitle: "Engineer 15 · z-addr",      amountUsd: 0,      ts: now - 1 * day,  status: "completed" },
  { id: rid("s"), scope: "stream", kind: "Recipient",title: "Recipient removed",    subtitle: "Contractor · Mara",         amountUsd: 0,      ts: now - 6 * day,  status: "completed" },
  { id: rid("s"), scope: "stream", kind: "Anchor",   title: "Invoice anchored",     subtitle: "Batch hash v1 → ETH",       amountUsd: 0,      ts: now - 35 * day, status: "completed", network: "Ethereum", fee: 3.40, hash: hx() },
  { id: rid("s"), scope: "stream", kind: "Distribute",title:"Distribution complete", subtitle: "All 14 recipients paid",    amountUsd: 0,      ts: now - 2 * day,  status: "completed", hash: hx() },
  { id: rid("s"), scope: "stream", kind: "Edit",    title: "Schedule changed",      subtitle: "Monthly · 1st → 15th",      amountUsd: 0,      ts: now - 10 * day, status: "completed" },
  { id: rid("s"), scope: "stream", kind: "Batch",   title: "Bonuses · Q1",          subtitle: "9 recipients · enhanced",   amountUsd: -22500, ts: now - 60 * day, status: "completed", network: "Multi-chain", fee: 393.75, hash: hx() },

  // ─────── Vault ───────
  { id: rid("v"), scope: "vault", kind: "Shield",   title: "Shield in",            subtitle: "USDC → ZEC · ETH",          amountUsd:  1250, ts: now -  1 * 3_600_000,   status: "completed", hash: hx(), network: "Zcash · Sapling", fee: 25 },
  { id: rid("v"), scope: "vault", kind: "Shield",   title: "Shield in",            subtitle: "USDT → ZEC · TRON",         amountUsd:   600, ts: now -  6 * 3_600_000,   status: "completed", hash: hx(), network: "Zcash · Sapling", fee: 12 },
  { id: rid("v"), scope: "vault", kind: "Payout",   title: "Payout",               subtitle: "ZEC → USDC · Polygon",      amountUsd:  -800, ts: now -  1 * day,         status: "completed", hash: hx(), network: "Polygon",          fee: 16 },
  { id: rid("v"), scope: "vault", kind: "Payout",   title: "Payout",               subtitle: "ZEC → ETH · Mainnet",       amountUsd:  -250, ts: now -  3 * day,         status: "completed", hash: hx(), network: "Ethereum",         fee: 5 },
  { id: rid("v"), scope: "vault", kind: "Rotate",   title: "Z-addr rotated",       subtitle: "Per-merchant · auto",       amountUsd:     0, ts: now -  4 * day,         status: "completed" },
  { id: rid("v"), scope: "vault", kind: "Shield",   title: "Shield in",            subtitle: "BTC → ZEC · BTC",           amountUsd:  4100, ts: now -  7 * day,         status: "completed", hash: hx(), network: "Zcash · Sapling", fee: 82 },
  { id: rid("v"), scope: "vault", kind: "Payout",   title: "Payout",               subtitle: "ZEC → XMR · Monero",        amountUsd:  -340, ts: now - 14 * day,         status: "completed", hash: hx(), network: "Monero",           fee: 6.80 },
  { id: rid("v"), scope: "vault", kind: "Settings", title: "Auto-shield enabled",  subtitle: "PSP · 2.00% all-in",        amountUsd:     0, ts: now - 30 * day,         status: "completed" },

  // ─────── Spend (card) ───────
  { id: rid("c"), scope: "spend", kind: "Purchase", title: "Rakuten",              subtitle: "Tokyo · ¥6,280 @ 149.16",    amountUsd:  -42.10, ts: now -  4 * 3_600_000, status: "completed", network: "Visa", note: "Funded by ZEC · shielded" },
  { id: rid("c"), scope: "spend", kind: "Purchase", title: "Lufthansa",            subtitle: "Online · €565 @ 1.083",      amountUsd: -612.00, ts: now -  1 * day,        status: "completed", network: "Visa", note: "Funded by ZEC · shielded" },
  { id: rid("c"), scope: "spend", kind: "Purchase", title: "Blue Bottle",          subtitle: "NYC · $",                    amountUsd:   -7.50, ts: now -  3 * day,        status: "completed", network: "Visa" },
  { id: rid("c"), scope: "spend", kind: "Top-up",   title: "Top up from Wallet",   subtitle: "ZEC · shielded",             amountUsd:  1000.00, ts: now -  3 * day,        status: "completed", network: "Internal" },
  { id: rid("c"), scope: "spend", kind: "Purchase", title: "Apple Store",          subtitle: "Cupertino · $",              amountUsd: -129.00, ts: now -  4 * day,        status: "completed", network: "Apple Pay" },
  { id: rid("c"), scope: "spend", kind: "Refund",   title: "Lufthansa refund",     subtitle: "Seat upgrade reversed",      amountUsd:   95.00,  ts: now -  5 * day,        status: "completed", network: "Visa" },
  { id: rid("c"), scope: "spend", kind: "Decline",  title: "Steam",                subtitle: "Declined · over daily limit", amountUsd: -240.00, ts: now -  6 * day,        status: "failed",    network: "Visa" },
  { id: rid("c"), scope: "spend", kind: "ATM",      title: "ATM withdrawal",       subtitle: "Berlin · €200 @ 1.083",      amountUsd: -216.60, ts: now -  9 * day,        status: "completed", network: "Visa", fee: 2.50 },
  { id: rid("c"), scope: "spend", kind: "Settings", title: "Card frozen",          subtitle: "User action",                amountUsd:    0,     ts: now - 10 * day,        status: "completed" },
  { id: rid("c"), scope: "spend", kind: "Settings", title: "Card unfrozen",        subtitle: "User action",                amountUsd:    0,     ts: now - 10 * day + 3 * 3_600_000, status: "completed" },
  { id: rid("c"), scope: "spend", kind: "Purchase", title: "Whole Foods",          subtitle: "Brooklyn · $",               amountUsd:  -84.30,  ts: now - 11 * day,        status: "completed", network: "Visa" },
  { id: rid("c"), scope: "spend", kind: "Top-up",   title: "Top up from Vault",    subtitle: "ZEC → USD",                  amountUsd:  500.00,  ts: now - 12 * day,        status: "completed", network: "Internal" },
  { id: rid("c"), scope: "spend", kind: "Purchase", title: "Uber",                 subtitle: "London · £24 @ 1.27",        amountUsd:  -30.48,  ts: now - 13 * day,        status: "completed", network: "Visa" },
];

export function historyFor(scope: HistoryScope): HistoryEntry[] {
  return HISTORY.filter((h) => h.scope === scope).sort((a, b) => b.ts - a.ts);
}
