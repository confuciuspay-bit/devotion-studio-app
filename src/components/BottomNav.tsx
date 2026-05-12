import { Link, useLocation } from "@tanstack/react-router";
import { Wallet, Store, Shield, Send, CreditCard } from "lucide-react";

const tabs = [
  { to: "/", label: "Wallet", icon: Wallet },
  { to: "/pay", label: "Pay", icon: Store },
  { to: "/vault", label: "Vault", icon: Shield },
  { to: "/stream", label: "Stream", icon: Send },
  { to: "/spend", label: "Spend", icon: CreditCard },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 px-3 pb-3 pt-2">
      <div className="glass mx-auto max-w-md rounded-2xl border border-border/60 px-2 py-1.5 flex items-center justify-between">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-2 rounded-xl transition-all ${
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
