import { Check, Circle, Loader as Loader2 } from "lucide-react";

export interface Step {
  label: string;
  status: "pending" | "active" | "done";
  detail?: string;
}

export function StatusTimeline({ steps }: { steps: Step[] }) {
  return (
    <ol className="space-y-3">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {s.status === "done" ? (
              <div className="size-5 rounded bg-[rgba(16,185,129,0.15)] text-success grid place-items-center">
                <Check className="size-3" />
              </div>
            ) : s.status === "active" ? (
              <div className="size-5 rounded bg-primary/15 text-primary grid place-items-center">
                <Loader2 className="size-3 animate-spin" />
              </div>
            ) : (
              <div className="size-5 rounded bg-[rgba(255,255,255,0.04)] text-muted-foreground grid place-items-center">
                <Circle className="size-1.5 fill-current" />
              </div>
            )}
          </div>
          <div className="flex-1 pt-0.5">
            <p className={`text-sm ${s.status === "pending" ? "text-muted-foreground" : "font-medium"}`}>{s.label}</p>
            {s.detail && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{s.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
