export interface Step {
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

export function StatusTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-1 shrink-0">
            <span
              className="dot"
              style={{
                background:
                  s.status === "done"
                    ? "var(--status-ok)"
                    : s.status === "active"
                    ? "var(--accent)"
                    : "var(--text-tertiary)",
                opacity: s.status === "active" ? 1 : undefined,
              }}
            />
          </div>
          <div className="flex-1">
            <p
              className="text-[13px]"
              style={{
                color:
                  s.status === "pending"
                    ? "var(--text-tertiary)"
                    : "var(--text-primary)",
                fontWeight: s.status === "active" ? 500 : 400,
              }}
            >
              {s.label}
            </p>
            {s.detail && (
              <p className="text-[11px] font-light mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {s.detail}
              </p>
            )}
          </div>
          {s.status === "active" && (
            <span className="animate-pulse text-[var(--accent)] text-[13px] mt-0.5">_</span>
          )}
        </li>
      ))}
    </ol>
  );
}
