import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { CookieBanner } from "@/components/commerce/cookie-banner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getThemeSettings, getPublicStoreSettings } from "@/services/cms.functions";
import { themeInitScript } from "@/lib/theme";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Não foi possível carregar esta página. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const { getPublicPixels } = await import("@/services/integrations.functions");
      const [themeRes, storeRes, pixelsRes] = await Promise.all([
        getThemeSettings().catch(() => null),
        getPublicStoreSettings().catch(() => null),
        getPublicPixels().catch(() => []),
      ]);
      return {
        theme: themeRes || null,
        store: storeRes || null,
        pixels: pixelsRes || [],
      };
    } catch {
      return {
        theme: null,
        store: null,
        pixels: [],
      };
    }
  },
  head: ({ loaderData }) => {
    const storeRaw = (loaderData as any)?.store;
    const store = storeRaw?.data || storeRaw;
    const theme = (loaderData as any)?.theme;
    const storeName = store?.name || "Jah";

    const seoTitle = store?.seo_title || `${storeName} — Conforto e Estilo`;
    const seoDesc =
      store?.seo_description ||
      store?.description ||
      "Moda feminina contemporânea com conforto e estilo. Descubra a curadoria da Jah.";
    const seoKeywords = store?.seo_keywords || "";

    const metaTags = [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=5",
      },
      { title: seoTitle },
      {
        name: "description",
        content: seoDesc,
      },
      { name: "author", content: storeName },
      { name: "theme-color", content: theme?.background_color || "#f4f4f0" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { property: "og:title", content: seoTitle },
      {
        property: "og:description",
        content: seoDesc,
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ];

    if (seoKeywords) {
      metaTags.push({ name: "keywords", content: seoKeywords });
    }

    const faviconUrl =
      store?.faviconUrl ||
      store?.settings?.faviconUrl ||
      store?.settings?.favicon_url ||
      theme?.favicon_url ||
      theme?.faviconUrl ||
      "/favicon.ico";

    return {
      meta: metaTags,
      links: [
        { rel: "manifest", href: "/manifest.json" },
        { rel: "apple-touch-icon", href: "/icons/icon-192x192.png" },
        { rel: "stylesheet", href: appCss },
        { rel: "icon", href: faviconUrl },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: `https://fonts.googleapis.com/css2?family=${(theme?.font_body || "Inter").replace(/ /g, "+")}:wght@400;500;600;700&family=${(theme?.font_heading || "Oswald").replace(/ /g, "+")}:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700;800&display=swap`,
        },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const { theme, pixels } = Route.useLoaderData() as any;

  const metaPixel = pixels?.find((p: any) => p.provider === "meta_pixel")?.pixelId;
  const gaPixel = pixels?.find((p: any) => p.provider === "google_analytics")?.measurementId;

  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        {/* Script anti-FOUC: aplica classe .dark/.light antes do primeiro paint */}
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />

        {/* Inject Google Analytics if configured */}
        {gaPixel && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaPixel}`}></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaPixel}');
                `,
              }}
            />
          </>
        )}

        {/* Inject Meta Pixel if configured */}
        {metaPixel && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${metaPixel}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}
      </head>
      <body>
        {children}
        <CookieBanner />
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "@/components/ui/sonner";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.error("ServiceWorker registration failed: ", err);
        });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
