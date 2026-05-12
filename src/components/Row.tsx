export function Row({ l, v, mono }: { l: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-3">
      <span className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">{l}</span>
      <span className={`text-sm text-right text-foreground truncate ${mono ? "font-mono" : ""}`}>{v}</span>
    </div>
  );
}
