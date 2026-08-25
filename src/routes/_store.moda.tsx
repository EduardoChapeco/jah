import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useMemo } from "react";
import {
  TShirt,
  Sparkle,
  ShoppingBag,
  Storefront,
  Clock,
  MapPin,
  ArrowRight,
  Handbag,
  Sunglasses,
  Footprints,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { PageSkeleton } from "@/components/state/loading";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { StoreCard } from "@/components/commerce/store-card";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";
import { GroceryProductCard } from "@/components/commerce/grocery-product-card";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";

const SearchSchema = z.object({
  q: z.string().optional(),
  view: z.enum(["feed", "grid", "list"]).default("feed").optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "in_stock"]).default("newest").optional(),
  categoria: z.string().optional(),
});

type ModaSearch = z.infer<typeof SearchSchema>;

const MODA_DEPARTMENTS: FilterChipOption[] = [
  { id: "todos", label: "Tudo", icon: Sparkle },
  { id: "feminina", label: "Moda Feminina", icon: TShirt },
  { id: "masculina", label: "Moda Masculina", icon: TShirt },
  { id: "calcados", label: "Calçados & Tênis", icon: Footprints },
  { id: "acessorios", label: "Bolsas & Acessórios", icon: Handbag },
  { id: "fitness", label: "Fitness & Praia", icon: Sparkle },
  { id: "infantil", label: "Infantil & Kids", icon: ShoppingBag },
];

export const Route = createFileRoute("/_store/moda")({
  head: () => ({
    meta: [
      { title: "Moda, Roupas, Calçados & Acessórios | Wider" },
      {
        name: "description",
        content:
          "Descubra as últimas tendências em roupas, calçados, bolsas e acessórios das boutiques e lojas locais da sua cidade.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): ModaSearch =>
    SearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async () => {
    const [banners, hotpages, marketplaceFeed] = await Promise.all([
      listActiveBanners({ data: { placement: "moda" } }).catch(() => []),
      listHotpages({ data: { module: "moda" } }).catch(() => []),
      getMarketplaceFeed({ data: { niche: "moda" } }).catch(() => null),
    ]);

    return {
      banners,
      hotpages,
      marketplaceFeed,
    };
  },
  component: ModaVerticalPage,
  pendingComponent: PageSkeleton,
});

function ModaVerticalPage() {
  const { banners, hotpages, marketplaceFeed } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const [activeDepartment, setActiveDepartment] = useState(search.categoria || "todos");
  const [viewMode, setViewMode] = useState<ViewModeType>(search.view || "feed");

  const handleDepartmentChange = (depId: string) => {
    setActiveDepartment(depId);
    navigate({
      search: (prev) => ({
        ...prev,
        categoria: depId === "todos" ? undefined : depId,
      }),
    });
  };

  const handleViewModeChange = (mode: ViewModeType) => {
    setViewMode(mode);
    navigate({
      search: (prev) => ({
        ...prev,
        view: mode === "feed" ? undefined : mode,
      }),
    });
  };

  // Filtragem de produtos de moda
  const filteredProducts = useMemo(() => {
    const allProducts = marketplaceFeed?.allProducts || [];
    return allProducts.filter((p: any) => {
      const titleLower = p.title.toLowerCase();
      const descLower = (p.description || "").toLowerCase();
      const tags = (p.tags || []).map((t: string) => t.toLowerCase());

      const isFashionItem =
        titleLower.includes("camiseta") ||
        titleLower.includes("vestido") ||
        titleLower.includes("calça") ||
        titleLower.includes("tênis") ||
        titleLower.includes("sapato") ||
        titleLower.includes("bolsa") ||
        titleLower.includes("moletom") ||
        titleLower.includes("jaqueta") ||
        titleLower.includes("óculos") ||
        titleLower.includes("bermuda") ||
        titleLower.includes("short") ||
        titleLower.includes("biquíni") ||
        titleLower.includes("relógio") ||
        tags.some((t: string) =>
          ["moda", "roupas", "calçados", "acessórios", "estilo", "boutique"].includes(t),
        );

      if (activeDepartment === "todos") return isFashionItem || allProducts.length <= 10;
      if (activeDepartment === "feminina")
        return titleLower.includes("vestido") || titleLower.includes("feminina") || titleLower.includes("blusa") || titleLower.includes("saia");
      if (activeDepartment === "masculina")
        return titleLower.includes("camiseta") || titleLower.includes("masculina") || titleLower.includes("bermuda") || titleLower.includes("polo");
      if (activeDepartment === "calcados")
        return titleLower.includes("tênis") || titleLower.includes("sapato") || titleLower.includes("sandália") || titleLower.includes("bota");
      if (activeDepartment === "acessorios")
        return titleLower.includes("bolsa") || titleLower.includes("cinto") || titleLower.includes("óculos") || titleLower.includes("relógio");
      if (activeDepartment === "fitness")
        return titleLower.includes("legging") || titleLower.includes("top") || titleLower.includes("biquíni") || titleLower.includes("treino");
      if (activeDepartment === "infantil")
        return titleLower.includes("infantil") || titleLower.includes("kids") || titleLower.includes("bebê");
      return true;
    });
  }, [marketplaceFeed, activeDepartment]);

  // Lojas de moda
  const fashionStores = useMemo(() => {
    const storeSection = marketplaceFeed?.sections?.find((s: any) => s.type === "store_rail");
    const stores = storeSection?.items || [];
    return stores.filter((s: any) => {
      const type = (s.type || "").toLowerCase();
      const name = (s.name || "").toLowerCase();
      return (
        type.includes("moda") ||
        type.includes("roupa") ||
        type.includes("calçado") ||
        type.includes("boutique") ||
        name.includes("moda") ||
        name.includes("boutique") ||
        name.includes("store") ||
        name.includes("calçados")
      );
    });
  }, [marketplaceFeed]);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Banners de Moda ── */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners de Moda">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 2. Hotpages / Campanhas ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Coleções de Moda">
          <HotpagesRail hotpages={hotpages} />
        </section>
      )}

      {/* ── 3. Discovery Control Bar ── */}
      <DiscoveryControlBar
        search={search.q || ""}
        onSearchChange={(q) => navigate({ search: (prev) => ({ ...prev, q }) })}
        searchPlaceholder="Buscar vestidos, camisetas, calçados, bolsas, jaquetas..."
        categories={MODA_DEPARTMENTS}
        activeCategory={activeDepartment}
        onSelectCategory={handleDepartmentChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        resultsCount={filteredProducts.length}
      />

      {/* ── 4. Lojas em Destaque ── */}
      {fashionStores.length > 0 && (
        <section aria-label="Boutiques & Lojas Locais">
          <HorizontalRail title="Boutiques & Lojas Locais" hideHeader={true}>
            {fashionStores.map((store: any) => (
              <StoreCard key={store.id} {...store} />
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* ── 5. Vitrine de Roupas & Calçados ── */}
      <section aria-label="Vitrine de Roupas & Calçados">
        {filteredProducts.length === 0 ? (
          <div className="py-12 text-center bg-card rounded-3xl  p-6 ">
            <EmptyState
              title="Nenhuma peça de roupa encontrada"
              description="Tente selecionar outro departamento ou busque por marcas e tamanhos."
            />
          </div>
        ) : viewMode === "list" ? (
          <div className="flex flex-col gap-3">
            {filteredProducts.map((product: any) => (
              <GroceryProductCard key={product.id} product={product} viewMode="list" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filteredProducts.map((product: any) => (
              <GroceryProductCard key={product.id} product={product} viewMode="grid" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
