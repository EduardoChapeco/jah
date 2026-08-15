import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";
import { getCart, getGlobalCarts } from "@/services/cart.functions";
import { getActiveGlobalPopups } from "@/services/builder.functions";
import { getUserSession } from "@/services/auth.functions";
import { useEffect } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { GlobalPopupRenderer } from "@/components/commerce/global-popup-renderer";
import { CartProvider, useCartContext } from "@/lib/cart-context";
import { ErrorState, UnconfiguredState } from "@/components/state/states";

export const Route = createFileRoute("/_store")({
  loader: async () => {
    try {
      const [menusRes, storeRes, carts, globalCarts, popupsRes, sessionRes] = await Promise.all([
        getNavigationMenus().catch(() => []),
        getPublicStoreSettings().catch(() => null),
        getCart().catch(() => null),
        getGlobalCarts().catch(() => []),
        getActiveGlobalPopups().catch(() => []),
        getUserSession().catch(() => null),
      ]);
      return {
        menus: menusRes || [],
        store: storeRes || null,
        carts,
        globalCarts: globalCarts || [],
        popups: popupsRes || [],
        session: sessionRes || null,
      };
    } catch {
      return {
        menus: [],
        store: null,
        carts: null,
        globalCarts: [],
        popups: [],
        session: null,
      };
    }
  },
  component: StoreLayoutWrapper,
  errorComponent: StoreRouteError,
});

function StoreRouteError({ error }: { error: Error }) {
  const message = error?.message ?? "";
  const isUnconfigured = message.includes("Supabase not configured");

  if (isUnconfigured) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20">
        <UnconfiguredState title="Loja em configuração" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <ErrorState title="Erro inesperado" />
    </div>
  );
}

function StoreLayoutWrapper() {
  return (
    <CartProvider>
      <StoreLayout />
    </CartProvider>
  );
}

function StoreLayout() {
  const { store, carts, globalCarts, popups, session } = Route.useLoaderData() as any;
  const { initCart } = useCartContext();

  useEffect(() => {
    initCart(carts, globalCarts);
  }, [carts, globalCarts, initCart]);

  const storeData = store?.data || store;
  const storeName = storeData?.name || "Jah";
  const logoUrl =
    storeData?.logoUrl || storeData?.settings?.logoUrl || storeData?.settings?.logo_url;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://jah.com.br";

  // JSON-LD Structured Data (Organization + WebSite with SearchAction)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: storeName,
        url: baseUrl,
        logo: logoUrl || `${baseUrl}/logo.png`,
        contactPoint: storeData?.contactPhone
          ? {
              "@type": "ContactPoint",
              telephone: storeData.contactPhone,
              contactType: "customer service",
            }
          : undefined,
      },
      {
        "@type": "WebSite",
        "@id": `${baseUrl}/#website`,
        url: baseUrl,
        name: storeName,
        publisher: { "@id": `${baseUrl}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${baseUrl}/buscar?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <AppShell session={session}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Outlet />
      <GlobalPopupRenderer popups={popups} />
    </AppShell>
  );
}
