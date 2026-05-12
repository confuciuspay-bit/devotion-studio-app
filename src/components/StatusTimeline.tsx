import { Check, Circle, Loader2 } from "lucide-react";

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
              <div className="size-6 rounded-full bg-shield/20 text-shield grid place-items-center">
                <Check className="size-3.5" />
              </div>
            ) : s.status === "active" ? (
              <div className="size-6 rounded-full bg-primary/20 text-primary grid place-items-center">
                <Loader2 className="size-3.5 animate-spin" />
              </div>
            ) : (
              <div className="size-6 rounded-full bg-foreground/5 text-muted-foreground grid place-items-center">
                <Circle className="size-2 fill-current" />
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
