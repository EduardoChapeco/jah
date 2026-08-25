import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState, useMemo } from "react";
import {
  Sparkle,
  Flame,
  Storefront,
  ForkKnife,
  Coffee,
  Heartbeat,
  Clock,
  ShieldCheck,
  Truck,
  ArrowRight,
  Package,
  Broom,
  Tag,
  CheckCircle,
  CalendarCheck,
  ShoppingBag,
  MagnifyingGlass,
  SlidersHorizontal,
  MapPin,
  Leaf,
  Grains,
  Drop,
  Buildings,
} from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { PageSkeleton } from "@/components/state/loading";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { OfferCard } from "@/components/commerce/offer-card";
import { StoreCard } from "@/components/commerce/store-card";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";
import { GroceryProductCard } from "@/components/commerce/grocery-product-card";
import {
  listPublishedProducts,
  listPublishedCategories,
  listAvailableAttributes,
} from "@/services/catalog.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import type { ProductCardDTO } from "@/types/catalog";
import { formatMoney } from "@/lib/money";

// ─── Search Schema & View Modes ───────────────────────────────────────────────
const SearchSchema = z.object({
  q: z.string().optional(),
  view: z.enum(["feed", "grid", "list"]).default("grid").optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "in_stock"]).default("newest").optional(),
  niche: z.string().optional(),
  categoria: z.string().optional(),
  loja: z.string().optional(),
  dieta: z.string().optional(),
  minCents: z.number().int().min(0).optional(),
  maxCents: z.number().int().min(0).optional(),
  atributos: z.record(z.string()).optional(),
});

type CatalogSearch = z.infer<typeof SearchSchema>;

// ─── Departamentos e Corredores do Supermercado ──────────────────────────────
const SUPERMARKET_DEPARTMENTS: FilterChipOption[] = [
  { id: "todos", label: "Tudo", emoji: "🛒", icon: Sparkle },
  { id: "tabloide", label: "Tabloide da Semana", emoji: "⚡️", icon: Flame, badge: "Economia" },
  { id: "hortifruti", label: "Hortifrúti & Feira", emoji: "🥦", icon: Storefront },
  { id: "carnes", label: "Açougue & Carnes", emoji: "🥩", icon: ForkKnife },
  { id: "padaria", label: "Padaria & Frios", emoji: "🍞", icon: Coffee },
  { id: "laticinios", label: "Laticínios & Queijos", emoji: "🧀", icon: Storefront },
  { id: "bebidas", label: "Bebidas & Adega", emoji: "🍻", icon: Package },
  { id: "mercearia", label: "Mercearia & Despensa", emoji: "🥫", icon: Package },
  { id: "limpeza", label: "Limpeza & Lavanderia", emoji: "🧼", icon: Broom },
  { id: "higiene", label: "Higiene & Cuidados", emoji: "🧴", icon: Heartbeat },
  { id: "congelados", label: "Congelados & Prontos", emoji: "🧊", icon: Package },
  { id: "pet", label: "Pet Shop & Ração", emoji: "🐾", icon: Heartbeat },
];

const DIETARY_FILTERS = [
  { id: "todos", label: "Todos os Itens" },
  { id: "organico", label: "Orgânicos & Locais", icon: Leaf },
  { id: "sem_gluten", label: "Sem Glúten", icon: Grains },
  { id: "sem_lactose", label: "Sem Lactose", icon: Drop },
  { id: "oferta_relampago", label: "Ofertas da Semana", icon: Flame },
];

export const Route = createFileRoute("/_store/mercado")({
  head: () => ({
    meta: [
      { title: "Mercado — Supermercados & Mercearias da Região | Wider" },
      {
        name: "description",
        content:
          "Feed completo e unificado de todos os supermercados, atacados, açougues e hortifrútis da região. Compare ofertas e faça compras online com entrega agendada ou retirada express.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): CatalogSearch => SearchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ location }) => {
    const search = location.search as CatalogSearch;
    const [productsRes, categoriesRes, attributesRes, feedRes, bannersRes, hotpagesRes] = await Promise.all([
      listPublishedProducts({
        data: {
          categorySlug: search.categoria,
          niche: search.niche === "tabloide" || search.niche === "todos" ? undefined : search.niche,
          sort: search.sort ?? "newest",
          minCents: search.minCents,
          maxCents: search.maxCents,
          attributes: search.atributos,
          limit: 60,
        },
      }).catch(() => ({ status: "ok" as const, data: [] as ProductCardDTO[] })),
      listPublishedCategories().catch(() => []),
      listAvailableAttributes().catch(() => []),
      getMarketplaceFeed({ data: { niche: search.niche || "mercado" } }).catch(() => ({ sections: [], allProducts: [] })),
      listActiveBanners({ data: { placement: "mercado" } }).catch(() => []),
      listHotpages({ data: { module: "mercado" } }).catch(() => []),
    ]);

    return {
      products: productsRes || { status: "ok", data: [] },
      categories: categoriesRes || [],
      availableAttributes: attributesRes || [],
      feed: feedRes || { sections: [], allProducts: [] },
      banners: bannersRes || [],
      hotpages: hotpagesRes || [],
    };
  },
  pendingComponent: PageSkeleton,
  component: SupermarketMasterPage,
});

function SupermarketMasterPage() {
  const {
    products: result,
    categories,
    availableAttributes,
    feed,
    banners,
    hotpages,
  } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const currentView = (search.view || "grid") as ViewModeType;
  const [localSearch, setLocalSearch] = useState(search.q || "");
  const [selectedDietary, setSelectedDietary] = useState(search.dieta || "todos");
  const [selectedStore, setSelectedStore] = useState<string>(search.loja || "todos");

  const handleSearchSubmit = (val: string) => {
    setLocalSearch(val);
    navigate({
      to: Route.fullPath,
      search: (s: Record<string, any>) => ({
        ...s,
        q: val || undefined,
      }),
    });
  };

  const handleSelectDepartment = (deptId: string) => {
    navigate({
      to: Route.fullPath,
      search: (s: Record<string, any>) => ({
        ...s,
        niche: deptId === "todos" ? undefined : deptId,
        categoria: undefined,
      }),
    });
  };

  const handleViewModeChange = (mode: ViewModeType) => {
    navigate({
      to: Route.fullPath,
      search: (s: Record<string, any>) => ({ ...s, view: mode }),
    });
  };

  const allProducts: ProductCardDTO[] =
    result.status === "ok" && result.data.length > 0
      ? result.data
      : (feed.allProducts || []).map((p: any) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          brand: p.store_name,
          priceCents: p.price_cents,
          compareAtCents: p.original_price_cents,
          coverUrl: p.cover_image,
          coverAlt: p.title,
          isOutOfStock: false,
          attributes: {},
        }));

  // Lista dinâmica de todos os supermercados parceiros presentes no catálogo
  const availableStores = useMemo(() => {
    const storesSet = new Set<string>();
    allProducts.forEach((p: any) => {
      const name = p.store_name || p.storeName || p.brand;
      if (name) storesSet.add(name);
    });
    return Array.from(storesSet);
  }, [allProducts]);

  // Filtragem multi-loja e preferências
  const displayedProducts = useMemo(() => {
    return allProducts.filter((prod: any) => {
      // Filtro por supermercado / empório parceiro
      if (selectedStore !== "todos") {
        const storeName = prod.store_name || prod.storeName || prod.brand;
        if (storeName !== selectedStore) return false;
      }

      // Filtro de busca textual
      if (localSearch.trim()) {
        const q = localSearch.toLowerCase().trim();
        const matchesTitle = prod.title?.toLowerCase().includes(q);
        const matchesBrand = prod.brand?.toLowerCase().includes(q);
        const matchesStore = prod.store_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesBrand && !matchesStore) return false;
      }

      // Filtro de ofertas da semana
      if (selectedDietary === "oferta_relampago") {
        return prod.compareAtCents && prod.compareAtCents > prod.priceCents;
      }

      return true;
    });
  }, [allProducts, localSearch, selectedDietary, selectedStore]);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Top Banners do Mercado ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── 3. Seletor de Supermercados Parceiros (Multi-Store Filter) ── */}
      {availableStores.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Buildings size={14} weight="bold" className="text-primary" />
              <span>Filtrar por Supermercado Parceiro</span>
            </span>

            {selectedStore !== "todos" && (
              <button
                type="button"
                onClick={() => setSelectedStore("todos")}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
              >
                Ver todos os mercados
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedStore("todos")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedStore === "todos"
                  ? "bg-foreground text-background "
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted "
              }`}
            >
              Todos os Supermercados
            </button>

            {availableStores.map((store) => (
              <button
                key={store}
                type="button"
                onClick={() => setSelectedStore(store)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  selectedStore === store
                    ? "bg-foreground text-background "
                    : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted "
                }`}
              >
                <Storefront size={14} weight="bold" />
                <span>{store}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. Hotpages Promocionais Contextuais ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias em Destaque">
          <HotpagesRail hotpages={hotpages} activeSlug={search.niche} />
        </section>
      )}

      {/* ── 5. Barra de Controle de Descoberta (Busca + Corredores + Modos) ── */}
      <DiscoveryControlBar
        search={localSearch}
        onSearchChange={handleSearchSubmit}
        searchPlaceholder="Buscar carnes, hortifrúti, arroz, laticínios, limpeza..."
        categories={SUPERMARKET_DEPARTMENTS.map((dept) => {
          const match = hotpages?.find((hp) => hp.slug === dept.id);
          return {
            ...dept,
            icon_url: match?.custom_icon_url || match?.icon_url || dept.icon_url,
          };
        })}
        activeCategory={search.niche || "todos"}
        onSelectCategory={handleSelectDepartment}
        viewMode={currentView}
        onViewModeChange={handleViewModeChange}
        allowedViewModes={["feed", "grid", "list"]}
        resultsCount={displayedProducts.length}
      />

      {/* ── 6. Filtros Especiais de Dieta & Estilo de Vida (Pills) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DIETARY_FILTERS.map((f) => {
          const isSelected = selectedDietary === f.id;
          const Icon = f.icon;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedDietary(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-foreground text-background "
                  : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted "
              }`}
            >
              {Icon && <Icon size={14} weight="bold" />}
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 7. Renderização Conforme o Modo de Visualização ── */}

      {/* MODE 1: FEED DE CORREDORES VIRTUAIS & ENCARTE DIGITAL */}
      {currentView === "feed" && (
        <div className="space-y-10">
          {/* Encarte de Ofertas da Semana Unificado */}
          {feed.allProducts && feed.allProducts.filter((p: any) => p.has_flash_offer).length > 0 && (
            <HorizontalRail
              title="Tabloide de Ofertas da Semana"
              hideHeader={true}
            >
              {feed.allProducts
                .filter((p: any) => p.has_flash_offer)
                .map((product: any) => (
                  <OfferCard key={product.id} {...product} />
                ))}
            </HorizontalRail>
          )}

          {/* Supermercados e Mercearias Parceiras */}
          {(feed?.sections?.find((s: any) => s.type === "store_rail")?.items?.length ?? 0) > 0 && (
            <HorizontalRail
              title="Supermercados, Mercearias & Empórios Locais"
              hideHeader={true}
            >
              {(feed?.sections?.find((s: any) => s.type === "store_rail")?.items || []).map(
                (store: any) => (
                  <StoreCard key={store.id} {...store} />
                ),
              )}
            </HorizontalRail>
          )}

          {/* Gôndola de Produtos Multi-Supermercados */}
          <div className="space-y-4 pt-4 ">
            <div className="flex items-center justify-end">
              <span className="text-xs text-muted-foreground font-mono font-bold">
                {displayedProducts.length} itens encontrados
              </span>
            </div>

            {displayedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {displayedProducts.map((prod) => (
                  <GroceryProductCard key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center space-y-3 bg-muted/10 rounded-3xl border-0 p-8">
                <EmptyState title="Nenhum produto encontrado neste corredor ou supermercado." />
                <div className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setLocalSearch("");
                      setSelectedDietary("todos");
                      setSelectedStore("todos");
                      handleSelectDepartment("todos");
                    }}
                    className="rounded-xl font-bold text-xs"
                  >
                    Ver todos os supermercados
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: GRADE DENSA MULTI-SUPERMERCADOS */}
      {currentView === "grid" && (
        <div>
          {displayedProducts.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl  p-8">
              <EmptyState title="Nenhum item encontrado nos supermercados" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {displayedProducts.map((prod) => (
                <GroceryProductCard key={prod.id} product={prod} viewMode="grid" />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: LISTA ESTILO CONFERÊNCIA DE COMPRAS (LARGURA MÁXIMA) */}
      {currentView === "list" && (
        <div className="space-y-3 w-full">
          {displayedProducts.length === 0 ? (
            <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl  p-8">
              <EmptyState title="Nenhum item encontrado nos supermercados" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 w-full">
              {displayedProducts.map((prod) => (
                <GroceryProductCard key={prod.id} product={prod} viewMode="list" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
