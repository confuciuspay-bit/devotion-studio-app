// Deterministic address generation per (seed, chain, index)
// Real chain-format-valid strings; keys aren't used for signing — UI demo only.

import bs58 from "bs58";
import type { Chain } from "./chains";

async function sha256(data: string | Uint8Array): Promise<Uint8Array> {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  const buf = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(buf);
}

const toHex = (b: Uint8Array) =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

const BECH32_CHARS = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";

function bech32ish(prefix: string, hash: Uint8Array, len = 39): string {
  let out = prefix;
  for (let i = 0; i < len; i++) out += BECH32_CHARS[hash[i % hash.length] % 32];
  return out;
}

function base58ish(prefix: string, hash: Uint8Array, len = 33): string {
  const enc = bs58.encode(hash).slice(0, len);
  return prefix + enc;
}

export interface DerivedAddress {
  address: string;
  index: number;
  chainId: string;
  privateKeyHint: string; // visual only, not real
}

export async function deriveAddress(
  seedHex: string,
  chain: Chain,
  index = 0,
): Promise<DerivedAddress> {
  const h = await sha256(`${seedHex}|${chain.id}|${chain.bip44}|${index}`);
  let address = "";
  switch (chain.kind) {
    case "evm":
      // 20-byte hex-style address (real format, not real key derivation)
      address = "0x" + toHex(h.slice(0, 20));
      break;
    case "svm":
      // Solana base58, 32 bytes → ~44 chars
      address = bs58.encode(h.slice(0, 32));
      break;
    case "utxo":
      if (chain.id === "bitcoin") address = "bc1q" + bech32ish("", h, 38);
      else if (chain.id === "litecoin") address = "ltc1q" + bech32ish("", h, 38);
      else if (chain.id === "dogecoin") address = "D" + base58ish("", h, 33);
      else address = "q" + bech32ish("", h, 41); // bch
      break;
    case "tron":
      address = base58ish("T", h, 33);
      break;
    case "ton":
      address = "EQ" + base58ish("", h, 46);
      break;
    case "cosmos":
      address = bech32ish(chain.addressPrefix ?? "cosmos1", h, 38);
      break;
    case "xrp":
      address = "r" + base58ish("", h, 33);
      break;
    case "zcash":
      // Sapling-style z-addr
      address = "zs1" + bech32ish("", h, 75);
      break;
    case "monero":
      // 95-char base58
      address = "4" + base58ish("", h, 94);
      break;
  }
  return {
    address,
    index,
    chainId: chain.id,
    privateKeyHint: toHex(h.slice(0, 16)),
  };
}

// One-time payment address (CREATE2-style stealth) — used by Pay flow
export async function generatePaymentAddress(
  paymentId: string,
  chain: Chain,
): Promise<string> {
  const seed = await sha256(paymentId + chain.id);
  return (await deriveAddress(toHex(seed), chain, 0)).address;
}

// Generate a fresh BIP39-style 12-word seed (display + storage only)
const BIP39_WORDS = [
  "abandon", "ability", "able", "about", "above", "absent", "absorb", "abstract",
  "absurd", "abuse", "access", "accident", "account", "accuse", "achieve", "acid",
  "acoustic", "acquire", "across", "act", "action", "actor", "actress", "actual",
  "adapt", "add", "addict", "address", "adjust", "admit", "adult", "advance",
  "advice", "aerobic", "affair", "afford", "afraid", "again", "age", "agent",
  "agree", "ahead", "aim", "air", "airport", "aisle", "alarm", "album",
  "alcohol", "alert", "alien", "all", "alley", "allow", "almost", "alone",
  "alpha", "already", "also", "alter", "always", "amateur", "amazing", "among",
  "amount", "amused", "analyst", "anchor", "ancient", "anger", "angle", "angry",
  "animal", "ankle", "announce", "annual", "another", "answer", "antenna", "antique",
  "anxiety", "any", "apart", "apology", "appear", "apple", "approve", "april",
  "arch", "arctic", "area", "arena", "argue", "arm", "armed", "armor",
  "army", "around", "arrange", "arrest", "arrive", "arrow", "art", "artist",
  "artwork", "ask", "aspect", "assault", "asset", "assist", "assume", "asthma",
  "athlete", "atom", "attack", "attend", "attitude", "attract", "auction", "audit",
  "august", "aunt", "author", "auto", "autumn", "average", "avocado", "avoid",
  "awake", "aware", "away", "awesome", "awful", "awkward", "axis", "baby",
  "bachelor", "bacon", "badge", "bag", "balance", "balcony", "ball", "bamboo",
  "banana", "banner", "bar", "barely", "bargain", "barrel", "base", "basic",
  "basket", "battle", "beach", "bean", "beauty", "because", "become", "beef",
  "before", "begin", "behave", "behind", "believe", "below", "belt", "bench",
  "benefit", "best", "betray", "better", "between", "beyond", "bicycle", "bid",
  "bike", "bind", "biology", "bird", "birth", "bitter", "black", "blade",
  "blame", "blanket", "blast", "bleak", "bless", "blind", "blood", "blossom",
  "blouse", "blue", "blur", "blush", "board", "boat", "body", "boil",
  "bomb", "bone", "bonus", "book", "boost", "border", "boring", "borrow",
  "boss", "bottom", "bounce", "box", "boy", "bracket", "brain", "brand",
  "brave", "bread", "breeze", "brick", "bridge", "brief", "bright", "bring",
  "brisk", "broccoli", "broken", "bronze", "broom", "brother", "brown", "brush",
  "bubble", "buddy", "budget", "buffalo", "build", "bulb", "bulk", "bullet",
  "bundle", "bunker", "burden", "burger", "burst", "bus", "business", "busy",
  "butter", "buyer", "buzz", "cabbage", "cabin", "cable", "cactus", "cage",
  "cake", "call", "calm", "camera", "camp", "can", "canal", "cancel",
];

export function generateSeed(): string[] {
  const out: string[] = [];
  const rnd = new Uint32Array(12);
  crypto.getRandomValues(rnd);
  for (let i = 0; i < 12; i++) out.push(BIP39_WORDS[rnd[i] % BIP39_WORDS.length]);
  return out;
}

export async function seedToHex(words: string[]): Promise<string> {
  return toHex(await sha256(words.join(" ")));
}

export function shortAddr(a: string, head = 6, tail = 4): string {
  if (a.length <= head + tail + 1) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}

export async function fakeTxHash(seed: string): Promise<string> {
  const h = await sha256(seed + Date.now() + Math.random());
  return "0x" + toHex(h);
}
