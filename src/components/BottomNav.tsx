import { Link, useLocation } from "@tanstack/react-router";
import { Wallet, LineChart, Store, Shield, CreditCard } from "lucide-react";

const tabs = [
  { to: "/", label: "Wallet", icon: Wallet },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/pay", label: "Pay", icon: Store },
  { to: "/vault", label: "Vault", icon: Shield },
  { to: "/spend", label: "Spend", icon: CreditCard },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 px-3 pt-2"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
    >
      <div className="glass mx-auto max-w-md rounded-2xl border border-border/60 px-2 py-1.5 flex items-center justify-between">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-all active:scale-95 ${
                active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
