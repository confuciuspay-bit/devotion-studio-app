import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Umbra" },
      { name: "theme-color", content: "#0a0a14" },
      { title: "Umbra — Privacy-First Crypto Wallet" },
      { name: "description", content: "Non-custodial multi-chain wallet with ZEC shielded payments, vault settlement, payroll and crypto cards." },
      { name: "author", content: "Umbra Protocol" },
      { property: "og:title", content: "Umbra — Privacy-First Crypto Wallet" },
      { property: "og:description", content: "Non-custodial. No KYC. ZEC shielded by default." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { BottomNav } from "@/components/BottomNav";
import { LockScreen } from "@/components/LockScreen";
import { MerchantBrand } from "@/components/MerchantBrand";
import { useApp } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const mounted = useMounted();
  const initialised = useApp((s) => s.initialised);
  const locked = useApp((s) => s.locked);
  const setLocked = useApp((s) => s.setLocked);
  const autoLock = useApp((s) => s.autoLockMinutes);
  const navigate = useNavigate();
  const location = useRouterState({ select: (s) => s.location });

  // Onboarding gate
  useEffect(() => {
    if (!mounted) return;
    if (!initialised && location.pathname !== "/onboarding") {
      navigate({ to: "/onboarding" });
    }
  }, [mounted, initialised, location.pathname, navigate]);

  // Auto-lock timer
  useEffect(() => {
    if (!mounted || !initialised || autoLock === "never") return;
    let last = Date.now();
    const bump = () => { last = Date.now(); };
    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((e) => document.addEventListener(e, bump));
    const id = window.setInterval(() => {
      if (Date.now() - last > (autoLock as number) * 60_000) setLocked(true);
    }, 5_000);
    return () => {
      events.forEach((e) => document.removeEventListener(e, bump));
      window.clearInterval(id);
    };
  }, [mounted, initialised, autoLock, setLocked]);

  const isOnboarding = location.pathname === "/onboarding";

  return (
    <QueryClientProvider client={queryClient}>
      <MerchantBrand />
      <div className={`mx-auto max-w-md min-h-dvh relative ${isOnboarding ? "" : "pb-28"}`}>
        {mounted ? <Outlet /> : <div className="min-h-dvh" />}
      </div>
      {mounted && !isOnboarding && initialised && <BottomNav />}
      {mounted && initialised && <LockScreen />}
    </QueryClientProvider>
  );
}
