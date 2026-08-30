import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useMemo } from "react";
import {
  ForkKnife,
  Pizza,
  Hamburger,
  Coffee,
  Fish,
  Cookie,
  Flame,
  Sparkle,
  Clock,
  MapPin,
  Storefront,
  ArrowRight,
  ShoppingBag,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { PageSkeleton } from "@/components/state/loading";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { ContextualStoriesRail } from "@/components/stories/contextual-stories-rail";
import { StoreCard } from "@/components/commerce/store-card";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";
import { GroceryProductCard } from "@/components/commerce/grocery-product-card";
import { getModularSurfaceFeed } from "@/services/surface-cms.functions";
import { ModularSurfaceFeed } from "@/components/commerce/modular-surface-feed";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { resolveNicheDepartments } from "@/lib/niche-helpers";

const SearchSchema = z.object({
  q: z.string().optional(),
  view: z.enum(["feed", "grid", "list"]).default("feed").optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "in_stock"]).default("newest").optional(),
  categoria: z.string().optional(),
});

type GastronomiaSearch = z.infer<typeof SearchSchema>;

const GASTRONOMIA_DEPARTMENTS: FilterChipOption[] = [
  { id: "todos", label: "Tudo", emoji: "🍽️", icon: Sparkle },
  { id: "burgers", label: "Burgers & Sandubas", emoji: "🍔", icon: Hamburger },
  { id: "pizzas", label: "Pizzas & Massas", emoji: "🍕", icon: Pizza },
  { id: "oriental", label: "Sushi & Oriental", emoji: "🍣", icon: Fish },
  { id: "marmitas", label: "Marmitas & Almoço", emoji: "🍱", icon: ForkKnife },
  { id: "churrasco", label: "Carnes & Grelhados", emoji: "🥩", icon: Flame },
  { id: "doces", label: "Cafés & Sobremesas", emoji: "🍰", icon: Coffee },
];

export const Route = createFileRoute("/_store/gastronomia")({
  head: () => ({
    meta: [
      { title: "Gastronomia & Delivery de Restaurantes | Wider" },
      {
        name: "description",
        content:
          "Peça burgers artesanais, pizzas, sushi, marmitas e pratos executivos dos melhores restaurantes e chefs da cidade.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): GastronomiaSearch =>
    SearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async () => {
    const [banners, hotpages, marketplaceFeed] = await Promise.all([
      listActiveBanners({ data: { placement: "gastronomia" } }).catch(() => []),
      listHotpages({ data: { module: "gastronomia" } }).catch(() => []),
      getModularSurfaceFeed({ data: { surfaceSlug: "gastronomia" } }).catch(() => ({ sections: [], allProducts: [] })),
    ]);

    return {
      banners,
      hotpages,
      marketplaceFeed,
    };
  },
  component: GastronomiaVerticalPage,
  pendingComponent: PageSkeleton,
});

function GastronomiaVerticalPage() {
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

  // Filtragem de pratos e produtos gastronômicos
  const filteredProducts = useMemo(() => {
    const allProducts = marketplaceFeed?.allProducts || [];
    return allProducts.filter((p: any) => {
      const titleLower = p.title.toLowerCase();
      const descLower = (p.description || "").toLowerCase();
      const tags = (p.tags || []).map((t: string) => t.toLowerCase());

      const isFoodItem =
        titleLower.includes("burger") ||
        titleLower.includes("hambúrguer") ||
        titleLower.includes("pizza") ||
        titleLower.includes("sushi") ||
        titleLower.includes("marmita") ||
        titleLower.includes("prato") ||
        titleLower.includes("porção") ||
        titleLower.includes("batata") ||
        titleLower.includes("lanche") ||
        titleLower.includes("pastel") ||
        titleLower.includes("sobremesa") ||
        titleLower.includes("torta") ||
        titleLower.includes("bolo") ||
        titleLower.includes("café") ||
        tags.some((t: string) =>
          ["restaurante", "gastronomia", "comida", "delivery", "lanche", "pizza", "burger"].includes(t),
        );

      if (activeDepartment === "todos") return isFoodItem || allProducts.length <= 10;
      if (activeDepartment === "burgers")
        return titleLower.includes("burger") || titleLower.includes("hambúrguer") || titleLower.includes("artesanal");
      if (activeDepartment === "pizzas")
        return titleLower.includes("pizza") || titleLower.includes("calzone") || titleLower.includes("massa");
      if (activeDepartment === "oriental")
        return titleLower.includes("sushi") || titleLower.includes("temaki") || titleLower.includes("sashimi") || titleLower.includes("yakisoba");
      if (activeDepartment === "marmitas")
        return titleLower.includes("marmita") || titleLower.includes("executivo") || titleLower.includes("prato feito");
      if (activeDepartment === "churrasco")
        return titleLower.includes("picanha") || titleLower.includes("grelhado") || titleLower.includes("costela");
      if (activeDepartment === "doces")
        return titleLower.includes("doce") || titleLower.includes("torta") || titleLower.includes("café") || titleLower.includes("sobremesa");
      return true;
    });
  }, [marketplaceFeed, activeDepartment]);

  // Restaurantes parceiros
  const restaurantStores = useMemo(() => {
    const storeSection = marketplaceFeed?.sections?.find((s: any) => s.type === "store_rail");
    const stores = storeSection?.items || [];
    return stores.filter((s: any) => {
      const type = (s.type || "").toLowerCase();
      const name = (s.name || "").toLowerCase();
      return (
        type.includes("restaurante") ||
        type.includes("lanchonete") ||
        type.includes("pizzaria") ||
        type.includes("hamburgueria") ||
        type.includes("gastronomia") ||
        name.includes("restaurante") ||
        name.includes("burger") ||
        name.includes("pizza") ||
        name.includes("bistrô") ||
        name.includes("café")
      );
    });
  }, [marketplaceFeed]);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Banners de Gastronomia ── */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners de Gastronomia">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 1.5. Stories de Gastronomia & Delivery ── */}
      <ContextualStoriesRail niche="gastronomia" className="py-1" />

      {/* ── 2. Hotpages por Turno / Almoço / Jantar ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Coleções de Gastronomia">
          <HotpagesRail hotpages={hotpages} />
        </section>
      )}

      {/* ── 3. Discovery Control Bar ── */}
      <DiscoveryControlBar
        search={search.q || ""}
        onSearchChange={(q) => navigate({ search: (prev) => ({ ...prev, q }) })}
        searchPlaceholder="Buscar pratos, pizzas, burgers, sobremesas..."
        categories={GASTRONOMIA_DEPARTMENTS}
        activeCategory={activeDepartment}
        onSelectCategory={handleDepartmentChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        resultsCount={filteredProducts.length}
      />

      {/* ── 4. Renderização do Feed Modular ou Grade Filtrada ── */}
      {viewMode === "feed" ? (
        <div className="space-y-8">
          {marketplaceFeed?.sections && marketplaceFeed.sections.length > 0 ? (
            <ModularSurfaceFeed sections={marketplaceFeed.sections} />
          ) : (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Nenhuma seção ativa no momento.
            </div>
          )}
        </div>
      ) : (
        <section aria-label="Pratos & Lanches em Destaque" className="w-full">
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="Nenhum prato encontrado"
              description="Tente escolher outro tipo de culinária ou busque por restaurantes específicos."
            />
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
      )}
    </div>
  );
}
