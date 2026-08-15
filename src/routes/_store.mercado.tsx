import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import {
  SlidersHorizontal,
  SquaresFour,
  ListDashes,
  Sparkle,
  MagnifyingGlass,
  Storefront,
  MapPin,
  Flame,
  ForkKnife,
  TShirt,
  Heartbeat,
  Coffee,
  Key,
  Scissors,
  Wrench,
  CaretRight,
} from "@phosphor-icons/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EmptyState, UnconfiguredState } from "@/components/state/states";
import { ProductGrid } from "@/components/commerce/product-grid";
import { PageSkeleton } from "@/components/state/loading";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { OfferCard } from "@/components/commerce/offer-card";
import { StoreCard } from "@/components/commerce/store-card";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import {
  listPublishedProducts,
  listPublishedCategories,
  listAvailableAttributes,
} from "@/services/catalog.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import type { ProductListResult, CategoryDTO } from "@/types/catalog";
import { formatMoney } from "@/lib/money";

// ─── Search Schema & View Modes ───────────────────────────────────────────────
const SearchSchema = z.object({
  view: z.enum(["feed", "grid", "list"]).default("feed").optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "in_stock"]).default("newest").optional(),
  niche: z.string().optional(),
  categoria: z.string().optional(),
  minCents: z.number().int().min(0).optional(),
  maxCents: z.number().int().min(0).optional(),
  atributos: z.record(z.string()).optional(),
});

type CatalogSearch = z.infer<typeof SearchSchema>;

const SORT_LABELS: Record<string, string> = {
  newest: "Mais recentes",
  price_asc: "Menor preço",
  price_desc: "Maior preço",
  in_stock: "Em estoque",
};

const CATEGORIES_TAXONOMY = [
  { label: "Tudo", icon: Sparkle, niche: undefined },
  { label: "Ofertas", icon: Flame, niche: "ofertas" },
  { label: "Gastronomia", icon: ForkKnife, niche: "gastronomia" },
  { label: "Mercado & Horti", icon: Storefront, niche: "mercado" },
  { label: "Farmácia", icon: Heartbeat, niche: "farmacia" },
  { label: "Moda & Roupas", icon: TShirt, niche: "moda" },
  { label: "Conveniência", icon: Coffee, niche: "conveniencia" },
  { label: "Pet Shop", icon: Heartbeat, niche: "pet" },
  { label: "Beleza & Cosméticos", icon: Scissors, niche: "beleza" },
  { label: "Eletrônicos & Casa", icon: Sparkle, niche: "eletronicos" },
];

export const Route = createFileRoute("/_store/mercado")({
  head: () => ({
    meta: [
      { title: "Mercado Central & Descoberta | JAH" },
      {
        name: "description",
        content:
          "Explore o Mercado da JAH: ofertas relâmpago, gastronomia, marcas autorais e comércio local.",
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
          niche: search.niche === "ofertas" ? undefined : search.niche,
          sort: search.sort ?? "newest",
          minCents: search.minCents,
          maxCents: search.maxCents,
          attributes: search.atributos,
          limit: 24,
        },
      }),
      listPublishedCategories(),
      listAvailableAttributes(),
      getMarketplaceFeed({ data: { niche: search.niche } }),
      listActiveBanners({ data: { placement: "mercado" } }).catch(() => []),
      listHotpages({ data: { module: "mercado" } }).catch(() => []),
    ]);

    return {
      products: productsRes,
      categories: categoriesRes || [],
      availableAttributes: attributesRes || [],
      feed: feedRes,
      banners: bannersRes || [],
      hotpages: hotpagesRes || [],
    };
  },
  pendingComponent: PageSkeleton,
  component: MarketplacePage,
});

function MarketplacePage() {
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const currentView = search.view || "feed";

  const setViewMode = (mode: "feed" | "grid" | "list") => {
    navigate({
      to: Route.fullPath,
      search: (s: Record<string, any>) => ({ ...s, view: mode }),
    });
  };

  return (
    <div className="w-full space-y-8">
      {/* ── 1. Top Universal Banner Hero (Apenas se houver banners ativos) ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── 1.5. Hotpages & Categorias Visuais ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias em Destaque">
          <HotpagesRail hotpages={hotpages} activeSlug={search.niche} />
        </section>
      )}

      {/* ── 2. Category Cards Bar (Cards Gordinhos Squircle) ── */}
      <section aria-label="Categorias do Mercado" className="space-y-2">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none w-full px-0.5">
          {CATEGORIES_TAXONOMY.map((item) => {
            const Icon = item.icon;
            const isSelected =
              item.niche === search.niche || (!item.niche && !search.niche && !search.categoria);

            return (
              <button
                key={item.label}
                type="button"
                onClick={() =>
                  navigate({
                    to: Route.fullPath,
                    search: (s: Record<string, any>) => ({
                      ...s,
                      niche: item.niche,
                      categoria: undefined,
                    }),
                  })
                }
                className={`min-w-[104px] sm:min-w-[114px] h-[94px] sm:h-[100px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all group ${
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-xs font-bold scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/30 shadow-2xs"
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isSelected ? "bg-background/20 text-background" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon size={20} weight={isSelected ? "fill" : "bold"} />
                </div>
                <span className="text-xs font-bold text-center leading-tight line-clamp-1">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Toolbar: View Mode Switcher & Ordenação ───────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-1 border-t border-border/60">
        <div className="flex items-center gap-2">
          {/* View Mode Switcher (Feed / Grid / List) */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            <button
              onClick={() => setViewMode("feed")}
              title="Modo Feed (Descoberta)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === "feed"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkle size={14} weight="bold" />
              <span className="hidden sm:inline">Descoberta</span>
            </button>

            <button
              onClick={() => setViewMode("grid")}
              title="Modo Grid (Catálogo denso)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === "grid"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <SquaresFour size={14} weight="bold" />
              <span className="hidden sm:inline">Grade</span>
            </button>

            <button
              onClick={() => setViewMode("list")}
              title="Modo Lista (Comparativo)"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                currentView === "list"
                  ? "bg-background text-foreground shadow-2xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ListDashes size={14} weight="bold" />
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>

          <span className="text-xs font-mono text-muted-foreground pl-2 hidden md:inline">
            {result.status === "ok" ? `${result.data.length} itens encontrados` : ""}
          </span>
        </div>

        {/* Sort Chips */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
            {Object.entries(SORT_LABELS).map(([val, label]) => (
              <button
                key={val}
                onClick={() =>
                  navigate({
                    to: Route.fullPath,
                    search: (s: Record<string, any>) => ({
                      ...s,
                      sort: val as CatalogSearch["sort"],
                    }),
                  })
                }
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  (search.sort ?? "newest") === val
                    ? "bg-background text-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. RENDERIZAÇÃO CONFORME O VIEW MODE ──────────────────── */}

      {/* MODE 1: FEED DE DESCOBERTA NARRATIVA E RAILS HORIZONTAIS */}
      {currentView === "feed" && (
        <div className="space-y-10">
          {/* Rail 1: Ofertas Relâmpago */}
          {feed.allProducts.filter((p: any) => p.has_flash_offer).length > 0 && (
            <HorizontalRail
              title="Ofertas Relâmpago"
              badge="Tempo Limitado"
              actionLabel="Ver todas as ofertas"
              onAction={() => setViewMode("grid")}
            >
              {feed.allProducts
                .filter((p: any) => p.has_flash_offer)
                .map((product: any) => (
                  <OfferCard key={product.id} {...product} />
                ))}
            </HorizontalRail>
          )}

          {/* Rail 2: Lojas & Produtores Locais */}
          {(feed?.sections?.find((s: any) => s.type === "store_rail")?.items?.length ?? 0) > 0 && (
            <HorizontalRail
              title="Lojas & Produtores da Comunidade"
              actionLabel="Ver diretório"
              onAction={() => navigate({ to: "/diretorio" })}
            >
              {(feed?.sections?.find((s: any) => s.type === "store_rail")?.items || []).map(
                (store: any) => (
                  <StoreCard key={store.id} {...store} />
                ),
              )}
            </HorizontalRail>
          )}

          {/* Grade de Lançamentos na Base do Feed */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Lançamentos da Comunidade
            </h2>

            {result.status === "ok" && <ProductGrid result={result} />}
            {result.status === "empty" && (
              <div className="py-16 text-center space-y-3 bg-muted/10 rounded-3xl border border-dashed border-border p-8">
                <EmptyState title="Nenhum produto publicado nesta categoria ainda." />
                <div className="pt-2">
                  <Button asChild size="sm" className="rounded-xl font-bold">
                    <Link to="/criar-negocio">Cadastrar Primeira Loja</Link>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: GRID DENSO */}
      {currentView === "grid" && (
        <div>
          {result.status === "unconfigured" && <UnconfiguredState />}
          {result.status === "empty" && (
            <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
              <EmptyState title="Nenhum produto encontrado nesta categoria" />
            </div>
          )}
          {result.status === "ok" && <ProductGrid result={result} />}
        </div>
      )}

      {/* MODE 3: LISTA COMPARATIVA */}
      {currentView === "list" && (
        <div className="space-y-3">
          {result.status === "ok" &&
            result.data.map((p: any) => (
              <div
                key={p.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all gap-4 shadow-2xs"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <Link
                    to="/produto/$slug"
                    params={{ slug: p.slug }}
                    className="size-16 rounded-xl bg-muted overflow-hidden shrink-0"
                  >
                    <img
                      src={p.coverUrl || p.media?.[0]?.url || "/banner-placeholder.png"}
                      alt={p.title}
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="space-y-1 min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      {p.category?.name || "Geral"}
                    </span>
                    <Link to="/produto/$slug" params={{ slug: p.slug }}>
                      <h3 className="text-sm font-bold text-foreground hover:text-primary transition-colors truncate">
                        {p.title}
                      </h3>
                    </Link>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-border/40">
                  <div className="text-right">
                    <span className="text-base font-black text-primary font-mono block">
                      {formatMoney(p.priceCents)}
                    </span>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="rounded-xl font-bold bg-primary text-primary-foreground text-xs h-9 px-4"
                  >
                    <Link to="/produto/$slug" params={{ slug: p.slug }}>
                      Ver Produto
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
