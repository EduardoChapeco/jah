import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useMemo } from "react";
import {
  Broom,
  Sparkle,
  Drop,
  HandSoap,
  Package,
  Buildings,
  Storefront,
  ShoppingBag,
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

type LimpezaSearch = z.infer<typeof SearchSchema>;

const LIMPEZA_DEPARTMENTS: FilterChipOption[] = [
  { id: "todos", label: "Tudo em Limpeza & Higiene", icon: Sparkle },
  { id: "pesada", label: "Limpeza Pesada & Pós-Obra", icon: Broom },
  { id: "lavanderia", label: "Lavanderia & Sabões", icon: Drop },
  { id: "cozinha", label: "Cozinha & Desengordurantes", icon: HandSoap },
  { id: "descartaveis", label: "Descartáveis & Embalagens", icon: Package },
  { id: "empresas", label: "Corporativo & Distribuidoras", icon: Buildings },
];

export const Route = createFileRoute("/_store/limpeza")({
  head: () => ({
    meta: [
      { title: "Produtos de Limpeza, Higiene & Descartáveis | Wider" },
      {
        name: "description",
        content:
          "Compre produtos de limpeza profissional, descartáveis, sabões, desinfetantes e itens de higiene nas melhores distribuidoras da sua cidade.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): LimpezaSearch => SearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async () => {
    const [banners, hotpages, marketplaceFeed] = await Promise.all([
      listActiveBanners({ data: { placement: "limpeza" } }).catch(() => []),
      listHotpages({ data: { module: "limpeza" } }).catch(() => []),
      getMarketplaceFeed({ data: { niche: "limpeza" } }).catch(() => null),
    ]);

    return {
      banners,
      hotpages,
      marketplaceFeed,
    };
  },
  component: LimpezaVerticalPage,
  pendingComponent: PageSkeleton,
});

function LimpezaVerticalPage() {
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

  const handleSearchChange = (q: string) => {
    navigate({
      search: (prev) => ({
        ...prev,
        q: q || undefined,
      }),
    });
  };

  const relevantHotpages = useMemo(() => {
    if (!hotpages) return [];
    return hotpages.filter(
      (hp) =>
        hp.module === "marketplace" ||
        hp.slug.includes("limpeza") ||
        hp.slug.includes("higiene") ||
        hp.slug.includes("descartavel"),
    );
  }, [hotpages]);

  const allProducts = useMemo(() => {
    if (!marketplaceFeed?.allProducts) return [];
    let list = marketplaceFeed.allProducts;
    if (search.q) {
      const qLower = search.q.toLowerCase();
      list = list.filter((p: any) => p.title.toLowerCase().includes(qLower));
    }
    return list;
  }, [marketplaceFeed, search.q]);

  const relevantStores = useMemo(() => {
    if (!marketplaceFeed?.sections) return [];
    const storeSection = marketplaceFeed.sections.find((s: any) => s.type === "store_rail");
    return storeSection?.items || [];
  }, [marketplaceFeed]);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Banners de Limpeza ── */}
      {banners && banners.length > 0 && (
        <section aria-label="Destaques de Limpeza">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 2. Hotpages de Limpeza & Higiene ── */}
      {relevantHotpages.length > 0 && (
        <section aria-label="Coleções de Limpeza">
          <HotpagesRail hotpages={relevantHotpages} basePath="/limpeza" />
        </section>
      )}

      {/* ── 3. Barra Canônica de Controle de Descoberta ── */}
      <DiscoveryControlBar
        search={search.q || ""}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar sabão, desinfetante, sacos de lixo, papel toalha..."
        categories={LIMPEZA_DEPARTMENTS}
        activeCategory={activeDepartment}
        onSelectCategory={handleDepartmentChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        resultsCount={allProducts.length}
      />

      {/* ── 4. Distribuidoras & Lojas de Limpeza ── */}
      {relevantStores.length > 0 && (
        <section aria-label="Distribuidoras de Limpeza">
          <HorizontalRail
            title="Distribuidoras & Lojas de Limpeza"
            hideHeader={true}
            actionTo="/buscar"
          >
            {relevantStores.map((store: any) => (
              <StoreCard key={store.id} {...store} />
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* ── 5. Grade / Feed de Produtos de Limpeza ── */}
      {allProducts.length === 0 ? (
        <EmptyState
          title="Nenhum produto de limpeza encontrado"
          description="Tente ajustar os termos de busca ou navegue pelos departamentos acima."
          action={
            <Button
              variant="outline"
              onClick={() => handleDepartmentChange("todos")}
              className="rounded-xl border-border"
            >
              Ver todos os produtos
            </Button>
          }
        />
      ) : viewMode === "list" ? (
        <section aria-label="Produtos de Limpeza">
          <div className="flex flex-col gap-3">
            {allProducts.map((product: any) => (
              <GroceryProductCard key={product.id} product={product} viewMode="list" />
            ))}
          </div>
        </section>
      ) : (
        <section aria-label="Produtos de Limpeza">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {allProducts.map((product: any) => (
              <GroceryProductCard key={product.id} product={product} viewMode="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
