// Thin wrapper around @scure/bip39 for the onboarding flow.
import { generateMnemonic as scureGenerate, mnemonicToSeedSync as scureSeed } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";

export const bip39Wordlist = wordlist;

export function generateMnemonic(): string[] {
  return scureGenerate(wordlist, 128).split(" ");
}

export function mnemonicToSeedSync(mnemonic: string): Uint8Array {
  return scureSeed(mnemonic);
}

// Re-export for backward-compat with existing imports.
export { wordlist };
