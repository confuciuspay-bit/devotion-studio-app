import { Link, useLocation } from "@tanstack/react-router";
import { Wallet, ChartLine as LineChart, Store, Shield, CreditCard } from "lucide-react";

const tabs = [
  { to: "/", label: "wallet", icon: Wallet },
  { to: "/markets", label: "markets", icon: LineChart },
  { to: "/pay", label: "pay", icon: Store },
  { to: "/vault", label: "vault", icon: Shield },
  { to: "/spend", label: "spend", icon: CreditCard },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-30"
      style={{
        paddingBottom: "max(env(safe-area-inset-bottom), 8px)",
        background: "var(--bg-base)",
        borderTop: "1px solid var(--border-dim)",
      }}
    >
      <div
        className="mx-auto max-w-md flex items-center justify-between px-2"
        style={{ height: 48 }}
      >
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="pressable flex-1 flex flex-col items-center gap-0.5 py-2 transition-colors"
              style={{ color: active ? "var(--text-primary)" : "var(--text-secondary)" }}
            >
              <Icon className="size-4" strokeWidth={active ? 1.8 : 1.4} />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  fontWeight: active ? 500 : 300,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
