export interface FeeBreakdown {
  pct: number;
  fixed: number;
  total: number;
  net: number;
  rate: number;
  label: string;
}

const PSP_TIERS: Array<[number, number]> = [
  [100_000, 0.0070],
  [500_000, 0.0065],
  [2_000_000, 0.0060],
  [10_000_000, 0.0055],
  [30_000_000, 0.0050],
  [75_000_000, 0.0047],
  [200_000_000, 0.0045],
  [Infinity, 0.0040],
];

export function pspFee(amountUsd: number, monthlyVolumeUsd: number, fixedUsd: number): FeeBreakdown {
  let remaining = amountUsd;
  let used = monthlyVolumeUsd;
  let pct = 0;
  let lastRate = 0;
  for (const [cap, rate] of PSP_TIERS) {
    if (remaining <= 0) break;
    const room = Math.max(0, cap - used);
    const slice = Math.min(remaining, room);
    pct += slice * rate;
    used += slice;
    remaining -= slice;
    lastRate = rate;
  }
  const total = pct + fixedUsd;
  return { pct, fixed: fixedUsd, total, net: amountUsd - total, rate: lastRate,
    label: `PSP · ${(lastRate * 100).toFixed(2)}% + $${fixedUsd.toFixed(2)}` };
}

export function vaultFee(amountUsd: number): FeeBreakdown {
  const total = amountUsd * 0.02;
  return { pct: total, fixed: 0, total, net: amountUsd - total, rate: 0.02,
    label: "Vault · 2.00% all-in" };
}

export function streamFee(amountUsd: number, recipients: number, mode: "standard-batch" | "standard-payroll" | "enhanced-batch" | "enhanced-payroll"): FeeBreakdown {
  const cfg = {
    "standard-batch":   { rate: 0.0025, per: 0.02 },
    "standard-payroll": { rate: 0.0030, per: 0.05 },
    "enhanced-batch":   { rate: 0.0175, per: 0.02 },
    "enhanced-payroll": { rate: 0.0180, per: 0.05 },
  }[mode];
  const pct = amountUsd * cfg.rate;
  const fixed = recipients * cfg.per;
  const total = pct + fixed;
  return { pct, fixed, total, net: amountUsd - total, rate: cfg.rate,
    label: `${mode.startsWith("enhanced") ? "Enhanced" : "Standard"} · ${(cfg.rate * 100).toFixed(2)}% + $${cfg.per}/recipient` };
}

export function swapFee(amountUsd: number): FeeBreakdown {
  const rate = amountUsd > 50_000 ? 0.0008 : amountUsd > 5_000 ? 0.0025 : 0.0050;
  const pct = amountUsd * rate;
  return { pct, fixed: 0, total: pct, net: amountUsd - pct, rate,
    label: `Swap · ${(rate * 100).toFixed(2)}% spread` };
}

export function cardFee(amountUsd: number, foreignFx: boolean): FeeBreakdown {
  const interchange = amountUsd * 0.008;
  const fx = foreignFx ? amountUsd * 0.006 : 0;
  const load = amountUsd * 0.003;
  const total = interchange + fx + load;
  return { pct: total, fixed: 0, total, net: amountUsd - total, rate: 0.0379,
    label: `Card · ${foreignFx ? "FX " : ""}${(((interchange + fx + load) / amountUsd) * 100).toFixed(2)}%` };
}
