import { useQuery } from "@tanstack/react-query";

export type MarketCoin = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  sparkline_in_7d?: { price: number[] };
  total_volume: number;
};

export type CoinDetail = {
  id: string;
  symbol: string;
  name: string;
  image: { large: string };
  market_data: {
    current_price: { usd: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    market_cap: { usd: number };
    total_volume: { usd: number };
    high_24h: { usd: number };
    low_24h: { usd: number };
    circulating_supply: number;
    ath: { usd: number };
    ath_change_percentage: { usd: number };
  };
  description: { en: string };
  links: {
    homepage: string[];
    blockchain_site: string[];
  };
  categories: string[];
};

const CG = "https://api.coingecko.com/api/v3";

// Curated default list — privacy + majors + DeFi / L2s with real logos
export const DEFAULT_IDS = [
  "zcash",
  "bitcoin",
  "ethereum",
  "monero",
  "solana",
  "usd-coin",
  "tether",
  "chainlink",
  "uniswap",
  "aave",
  "arbitrum",
  "polygon-ecosystem-token",
  "optimism",
  "lido-dao",
  "cosmos",
];

export function useMarkets(ids: string[] = DEFAULT_IDS) {
  return useQuery({
    queryKey: ["markets", ids.join(",")],
    queryFn: async (): Promise<MarketCoin[]> => {
      const url = `${CG}/coins/markets?vs_currency=usd&ids=${ids.join(
        ",",
      )}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useCoin(id: string) {
  return useQuery({
    queryKey: ["coin", id],
    queryFn: async (): Promise<CoinDetail> => {
      const url = `${CG}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch coin");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}

export function useCoinChart(id: string, days = 7) {
  return useQuery({
    queryKey: ["chart", id, days],
    queryFn: async (): Promise<{ prices: [number, number][] }> => {
      const url = `${CG}/coins/${id}/market_chart?vs_currency=usd&days=${days}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch chart");
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function fmtUsd(n: number, opts: Intl.NumberFormatOptions = {}) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 1000 ? 0 : n >= 1 ? 2 : 6,
    ...opts,
  }).format(n);
}

export function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function fmtPct(n: number | undefined) {
  if (n === undefined || n === null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
