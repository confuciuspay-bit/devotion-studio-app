import bs58 from "bs58";
import * as ExpoCrypto from "expo-crypto";
import type { Chain } from "./chains";

const toHex = (b: Uint8Array) =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");

async function sha256(data: string): Promise<Uint8Array> {
  const hex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    data,
  );
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

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
  privateKeyHint: string;
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
      address = "0x" + toHex(h.slice(0, 20));
      break;
    case "svm":
      address = bs58.encode(h.slice(0, 32));
      break;
    case "utxo":
      if (chain.id === "bitcoin") address = "bc1q" + bech32ish("", h, 38);
      else if (chain.id === "litecoin") address = "ltc1q" + bech32ish("", h, 38);
      else if (chain.id === "dogecoin") address = "D" + base58ish("", h, 33);
      else address = "q" + bech32ish("", h, 41);
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
      address = "zs1" + bech32ish("", h, 75);
      break;
    case "monero":
      address = "4" + base58ish("", h, 94);
      break;
  }
  return { address, index, chainId: chain.id, privateKeyHint: toHex(h.slice(0, 16)) };
}

export async function fakeTxHash(seed: string): Promise<string> {
  const hex = await ExpoCrypto.digestStringAsync(
    ExpoCrypto.CryptoDigestAlgorithm.SHA256,
    seed + Date.now() + Math.random(),
  );
  return "0x" + hex;
}

export function shortAddr(a: string, head = 6, tail = 4): string {
  if (a.length <= head + tail + 1) return a;
  return `${a.slice(0, head)}…${a.slice(-tail)}`;
}
