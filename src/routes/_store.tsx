import { createFileRoute, Outlet, isRedirect } from "@tanstack/react-router";
import { getNavigationMenus, getPublicStoreSettings } from "@/services/cms.functions";
import { getPublicBrandSettings } from "@/services/master.functions";
import { getCart, getGlobalCarts } from "@/services/cart.functions";
import { getActiveGlobalPopups } from "@/services/builder.functions";
import { getUserSession } from "@/services/auth.functions";
import { useEffect } from "react";

import { AppShell } from "@/components/shell/app-shell";
import { GlobalPopupRenderer } from "@/components/commerce/global-popup-renderer";
import { AdminContextualBar } from "@/components/shell/admin-contextual-bar";
import { CartProvider, useCartContext } from "@/lib/cart-context";
import { ErrorState, UnconfiguredState } from "@/components/state/states";

export const Route = createFileRoute("/_store")({
  loader: async () => {
    try {
      const [menusRes, storeRes, brandRes, carts, globalCarts, popupsRes, sessionRes] = await Promise.all([
        getNavigationMenus().catch(() => []),
        getPublicStoreSettings().catch(() => null),
        getPublicBrandSettings().catch(() => null),
        getCart().catch(() => null),
        getGlobalCarts().catch(() => []),
        getActiveGlobalPopups().catch(() => []),
        getUserSession().catch(() => null),
      ]);
      return {
        menus: menusRes || [],
        store: storeRes || null,
        brand: brandRes || null,
        carts,
        globalCarts: globalCarts || [],
        popups: popupsRes || [],
        session: sessionRes || null,
      };
    } catch {
      return {
        menus: [],
        store: null,
        brand: null,
        carts: null,
        globalCarts: [],
        popups: [],
        session: null,
      };
    }
  },
  component: StoreLayout,
  errorComponent: StoreRouteError,
});

function StoreRouteError({ error }: { error: Error }) {
  if (isRedirect(error)) {
    throw error;
  }

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
      <ErrorState
        title="Página em Atualização"
        description="Não foi possível concluir o carregamento desta página no momento. Tente atualizar a página."
        onRetry={() => {
          if (typeof window !== "undefined") window.location.reload();
        }}
      />
    </div>
  );
}

function StoreLayout() {
  const { store, brand, carts, globalCarts, popups, session } = Route.useLoaderData() as any;
  const { initCart } = useCartContext();

  useEffect(() => {
    initCart(carts, globalCarts);
  }, [carts, globalCarts, initCart]);

  const storeData = store?.data || store;
  const storeName = brand?.platform_name || storeData?.name || "Wider";
  const logoUrl =
    brand?.logo_url ||
    storeData?.logoUrl ||
    storeData?.settings?.logoUrl ||
    storeData?.settings?.logo_url;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wider.com.br";

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
        contactPoint: (brand?.support_whatsapp || storeData?.contactPhone)
          ? {
              "@type": "ContactPoint",
              telephone: brand?.support_whatsapp || storeData.contactPhone,
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

  const brandSettings = {
    logo_url: brand?.logo_url || storeData?.logoUrl || storeData?.settings?.logoUrl || null,
    favicon_url: brand?.favicon_url || storeData?.faviconUrl || storeData?.settings?.faviconUrl || null,
    show_logo: brand?.show_logo !== false && storeData?.settings?.show_logo !== false,
    show_name: brand?.show_name !== false && storeData?.settings?.show_name !== false,
    platform_name: brand?.platform_name || storeData?.name || "Wider",
  };

  return (
    <AppShell session={session} brandSettings={brandSettings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Outlet />
      <GlobalPopupRenderer popups={popups} />
      <AdminContextualBar userRole={session?.role} />
    </AppShell>
  );
}
