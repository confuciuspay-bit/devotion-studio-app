// Deterministic, locale-independent time helpers — safe for SSR.
// Use fmtRelative ONLY inside components gated by useMounted().

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function pad(n: number) { return n.toString().padStart(2, "0"); }

/** Locale-independent absolute time, e.g. "Apr 12 · 14:08". */
export function fmtAbs(ts: number) {
  const d = new Date(ts);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** Locale-independent date-only, e.g. "Apr 12, 2026". */
export function fmtDate(ts: number) {
  const d = new Date(ts);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

/** Relative-from-now string. NOT SSR-safe — gate behind useMounted(). */
export function fmtRelative(ts: number, now = Date.now()) {
  const diff = now - ts;
  if (diff < 60_000) return "now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h`;
  if (diff < 7 * 86400_000) return `${Math.floor(diff / 86400_000)}d`;
  return fmtDate(ts);
}
