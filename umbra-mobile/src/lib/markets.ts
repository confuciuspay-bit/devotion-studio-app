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
  links: { homepage: string[]; blockchain_site: string[] };
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

export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "CNY", "HKD", "SGD",
  "INR", "KRW", "BRL", "MXN", "ZAR", "AED", "SEK", "NOK", "DKK", "PLN",
  "TRY", "RUB", "THB", "IDR", "NZD", "ILS",
] as const;

const FX_FALLBACK: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, JPY: 149, CHF: 0.88, CAD: 1.36, AUD: 1.51,
  CNY: 7.24, HKD: 7.82, SGD: 1.34, INR: 83.2, KRW: 1335, BRL: 4.95, MXN: 17.1,
  ZAR: 18.7, AED: 3.67, SEK: 10.5, NOK: 10.6, DKK: 6.85, PLN: 4.0, TRY: 32.5,
  RUB: 92, THB: 35.5, IDR: 15600, NZD: 1.65, ILS: 3.7,
};

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

export function useFxRate(target: string) {
  return useQuery({
    queryKey: ["fx", target],
    enabled: target !== "USD",
    queryFn: async (): Promise<number> => {
      try {
        const url = `${CG}/simple/price?ids=tether&vs_currencies=${target.toLowerCase()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("fx failed");
        const j = await res.json();
        const rate = j?.tether?.[target.toLowerCase()];
        return typeof rate === "number" && rate > 0 ? rate : (FX_FALLBACK[target] ?? 1);
      } catch {
        return FX_FALLBACK[target] ?? 1;
      }
    },
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
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

export function fmtMoney(usd: number, ccy: string, rate: number, opts: Intl.NumberFormatOptions = {}) {
  const v = usd * rate;
  const abs = Math.abs(v);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: abs >= 1000 ? 0 : abs >= 1 ? 2 : 6,
    ...opts,
  }).format(v);
}

export function fmtSigned(usd: number, ccy: string, rate: number, opts: Intl.NumberFormatOptions = {}) {
  const v = usd * rate;
  const sign = v >= 0 ? "+" : "-";
  const abs = Math.abs(v);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: ccy,
    maximumFractionDigits: abs >= 1000 ? 2 : abs >= 1 ? 2 : 6,
    minimumFractionDigits: 2,
    ...opts,
  }).format(abs);
  return `${sign}${formatted}`;
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

export { fmtAbs as fmtTime } from "./time";
