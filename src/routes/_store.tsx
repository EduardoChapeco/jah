import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";
import { getCart, getGlobalCarts } from "@/services/cart.functions";
import { getActiveGlobalPopups } from "@/services/builder.functions";
import { useEffect } from "react";

import { PublicHeader } from "@/components/commerce/public-header";
import { PublicFooter } from "@/components/commerce/public-footer";
import { BottomNav } from "@/components/commerce/bottom-nav";
import { GlobalPopupRenderer } from "@/components/commerce/global-popup-renderer";
import { CartProvider, useCartContext } from "@/lib/cart-context";
import { CartSheet } from "@/components/commerce/cart-sheet";
import { ErrorState, UnconfiguredState } from "@/components/state/states";

export const Route = createFileRoute("/_store")({
  loader: async () => {
    try {
      const [menusRes, storeRes, carts, globalCarts, popupsRes] = await Promise.all([
        getNavigationMenus().catch(() => []),
        getPublicStoreSettings().catch(() => null),
        getCart().catch(() => null),
        getGlobalCarts().catch(() => []),
        getActiveGlobalPopups().catch(() => []),
      ]);
      return {
        menus: menusRes || [],
        store: storeRes || null,
        carts,
        globalCarts: globalCarts || [],
        popups: popupsRes || [],
      };
    } catch {
      return {
        menus: [],
        store: null,
        carts: null,
        globalCarts: [],
        popups: [],
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
  const { menus, store, carts, globalCarts, popups } = Route.useLoaderData() as any;
  const { initCart } = useCartContext();

  useEffect(() => {
    initCart(carts, globalCarts);
  }, [carts, globalCarts, initCart]);

  // Extract header and footer menus
  const headerMenu = menus.find((m: any) => m.handle === "header")?.items || [];
  const footerMenu = menus.find((m: any) => m.handle === "footer")?.items || [];

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
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicHeader
        menuItems={headerMenu}
        storeName={storeName}
        logoUrl={logoUrl}
        hideNameWithLogo={storeData?.settings?.hideNameWithLogo === true}
      />
      <main className="@container flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <PublicFooter menuItems={footerMenu} store={storeData} />
      <BottomNav storeType={storeData?.type} />
      <GlobalPopupRenderer popups={popups} />
      <CartSheet />
    </div>
  );
}
