import { useApp } from "@/lib/store";
import { fmtMoney, fmtSigned, maskValue, useFxRate } from "@/lib/markets";

export function useMoney() {
  const ccy = useApp((s) => s.displayCurrency);
  const hidden = useApp((s) => s.hideBalances);
  const { data: rate = 1 } = useFxRate(ccy);

  const fmt = (usd: number, opts?: Intl.NumberFormatOptions) => {
    const out = fmtMoney(usd, ccy, rate, opts);
    return hidden ? maskValue(out) : out;
  };
  const signed = (usd: number, opts?: Intl.NumberFormatOptions) => {
    const out = fmtSigned(usd, ccy, rate, opts);
    return hidden ? maskValue(out) : out;
  };
  const fx = (usd: number) => usd * rate;
  return { ccy, rate, hidden, fmt, signed, fx, mask: (s: string) => (hidden ? maskValue(s) : s) };
}
