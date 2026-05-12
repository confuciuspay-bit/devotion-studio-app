// Map a CoinGecko coin id to the chains where it actually exists.
// - Native coins are mapped explicitly to their L1 (and bridged variants when relevant).
// - Tokens are resolved via CoinGecko's `platforms` field on /coins/{id}.

import { useQuery } from "@tanstack/react-query";
import { CHAINS, type Chain, type ChainId } from "./chains";

const CG = "https://api.coingecko.com/api/v3";

// Native coin id -> chains where you can hold this exact asset.
// (For native L1 coins, only the native chain.)
const NATIVE: Record<string, ChainId[]> = {
  bitcoin: ["bitcoin"],
  ethereum: ["ethereum", "arbitrum", "base", "optimism", "zksync", "linea", "scroll"], // ETH (incl. L2s)
  solana: ["solana"],
  monero: ["monero"],
  zcash: ["zcash"],
  litecoin: ["litecoin"],
  "bitcoin-cash": ["bitcoin-cash"],
  dogecoin: ["dogecoin"],
  tron: ["tron"],
  "the-open-network": ["ton"],
  cosmos: ["cosmos"],
  osmosis: ["osmosis"],
  "injective-protocol": ["injective"],
  ripple: ["xrp"],
  binancecoin: ["bnb"],
  "matic-network": ["polygon"],
  "avalanche-2": ["avalanche"],
};

// CoinGecko platform key -> our ChainId
const PLATFORM_MAP: Record<string, ChainId> = {
  ethereum: "ethereum",
  "arbitrum-one": "arbitrum",
  "optimistic-ethereum": "optimism",
  base: "base",
  "binance-smart-chain": "bnb",
  "polygon-pos": "polygon",
  "avalanche": "avalanche",
  "zksync": "zksync",
  linea: "linea",
  scroll: "scroll",
  solana: "solana",
  tron: "tron",
  "the-open-network": "ton",
  "cosmos": "cosmos",
  osmosis: "osmosis",
  injective: "injective",
  "ripple": "xrp",
};

interface PlatformsResp {
  id: string;
  platforms?: Record<string, string>;
}

async function fetchPlatforms(id: string): Promise<string[]> {
  const url = `${CG}/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const j = (await res.json()) as PlatformsResp;
  return Object.keys(j.platforms ?? {}).filter((k) => k.length > 0);
}

export function useCoinChains(coinId: string | null | undefined) {
  return useQuery({
    queryKey: ["coinChains", coinId],
    enabled: !!coinId,
    staleTime: 30 * 60_000,
    queryFn: async (): Promise<Chain[]> => {
      if (!coinId) return [];
      // Native coin?
      if (NATIVE[coinId]) {
        const ids = new Set(NATIVE[coinId]);
        return CHAINS.filter((c) => ids.has(c.id));
      }
      // Token: fetch platforms
      const platforms = await fetchPlatforms(coinId);
      const ids = new Set<ChainId>();
      for (const p of platforms) {
        const m = PLATFORM_MAP[p];
        if (m) ids.add(m);
      }
      // Fallback: if no platforms recognised but coin id matches a chain native, use native.
      if (!ids.size) {
        const c = CHAINS.find((x) => x.nativeCoinId === coinId || x.id === coinId);
        if (c) ids.add(c.id);
      }
      return CHAINS.filter((c) => ids.has(c.id));
    },
  });
}
