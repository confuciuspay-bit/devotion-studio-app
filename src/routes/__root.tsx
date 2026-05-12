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
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="label mb-4">404</p>
        <h1 className="text-[18px] font-medium text-[var(--text-primary)]">page not found</h1>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          The page you're looking for doesn't exist.
        </p>
        <div className="mt-8">
          <Link to="/" className="btn-primary">go home</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <p className="label mb-4">error</p>
        <h1 className="text-[18px] font-medium text-[var(--text-primary)]">something went wrong</h1>
        <p className="mt-2 text-[13px] text-[var(--text-secondary)]">
          Try refreshing or head back home.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-primary"
          >
            try again
          </button>
          <a href="/" className="btn-ghost">go home</a>
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
      { property: "og:description", content: "Non-custodial multi-chain wallet with ZEC shielded payments, vault settlement, payroll and crypto cards." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Umbra — Privacy-First Crypto Wallet" },
      { name: "twitter:description", content: "Non-custodial multi-chain wallet with ZEC shielded payments, vault settlement, payroll and crypto cards." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7e888cb6-51a3-4f0b-b600-d55d633dde8e/id-preview-d84087ff--42f5142a-e8ea-40ce-b634-5964bf97b1ea.lovable.app-1778585092374.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7e888cb6-51a3-4f0b-b600-d55d633dde8e/id-preview-d84087ff--42f5142a-e8ea-40ce-b634-5964bf97b1ea.lovable.app-1778585092374.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&display=swap" },
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

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-md min-h-dvh pb-24 relative animate-fade-in">
        <Outlet />
      </div>
      <BottomNav />
    </QueryClientProvider>
  );
}
