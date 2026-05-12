export function Row({ l, v, mono, last }: { l: string; v: React.ReactNode; mono?: boolean; last?: boolean }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 gap-3"
      style={!last ? { borderBottom: "1px solid var(--border-dim)" } : undefined}
    >
      <span className="label shrink-0">{l}</span>
      <span
        className="text-[12px] text-right truncate"
        style={{
          color: "var(--text-primary)",
          fontFamily: mono ? "'JetBrains Mono', monospace" : undefined,
        }}
      >
        {v}
      </span>
    </div>
  );
}
