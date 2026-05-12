import { Link, useLocation } from "@tanstack/react-router";
import { Wallet, ChartLine as LineChart, Store, Shield, CreditCard } from "lucide-react";

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
      className="fixed bottom-0 inset-x-0 z-30 px-3 pt-1.5"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 10px)" }}
    >
      <div className="glass mx-auto max-w-md rounded-lg border border-[rgba(255,255,255,0.06)] px-1 py-1 flex items-center justify-between">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-2 rounded-md transition-all pressable ${
                active
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="size-[17px]" strokeWidth={active ? 2.2 : 1.7} />
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
