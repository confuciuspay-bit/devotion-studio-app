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

export type SearchResult = {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
};

const CG = "https://api.coingecko.com/api/v3";

export const DEFAULT_IDS = [
  "zcash", "bitcoin", "ethereum", "monero", "solana",
  "usd-coin", "tether", "chainlink", "uniswap", "aave",
  "arbitrum", "polygon-ecosystem-token", "optimism", "lido-dao", "cosmos",
];

// Top markets by market cap, paginated
export function useTopMarkets(page = 1, perPage = 100) {
  return useQuery({
    queryKey: ["topMarkets", page, perPage],
    queryFn: async (): Promise<MarketCoin[]> => {
      const url = `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true&price_change_percentage=24h,7d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch top markets");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useMarkets(ids: string[] = DEFAULT_IDS) {
  return useQuery({
    queryKey: ["markets", ids.join(",")],
    queryFn: async (): Promise<MarketCoin[]> => {
      if (!ids.length) return [];
      const url = `${CG}/coins/markets?vs_currency=usd&ids=${ids.join(",")}&order=market_cap_desc&sparkline=true&price_change_percentage=24h,7d`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function useCoinSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    enabled: query.trim().length >= 1,
    queryFn: async (): Promise<SearchResult[]> => {
      const res = await fetch(`${CG}/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("search failed");
      const j = await res.json();
      return j.coins as SearchResult[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useSimplePrices(ids: string[]) {
  return useQuery({
    queryKey: ["simple", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<Record<string, { usd: number; usd_24h_change?: number }>> => {
      const url = `${CG}/simple/price?ids=${ids.join(",")}&vs_currencies=usd&include_24hr_change=true`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("simple/price failed");
      return res.json();
    },
    staleTime: 30_000,
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

// Trending coins
export function useTrending() {
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => {
      const res = await fetch(`${CG}/search/trending`);
      if (!res.ok) throw new Error("trending failed");
      return (await res.json()) as { coins: { item: SearchResult }[] };
    },
    staleTime: 5 * 60_000,
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

export function maskValue(s: string) {
  return s.replace(/[\d.,]/g, "•");
}

export function fmtCompact(n: number) {
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(n);
}

export function fmtPct(n: number | undefined) {
  if (n === undefined || n === null) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

export function fmtTime(ts: number) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`;
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}d`;
  return d.toLocaleDateString();
}
