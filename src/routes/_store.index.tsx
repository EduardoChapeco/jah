import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Storefront,
  ForkKnife,
  Scissors,
  Briefcase,
  AirplaneTilt,
  Tag,
  Compass,
  Heartbeat,
  Coffee,
  TShirt,
  Key,
  CarProfile,
  CalendarDots,
  Sparkle,
  ArrowRight,
} from "@phosphor-icons/react";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { OfferCard } from "@/components/commerce/offer-card";
import { StoreCard } from "@/components/commerce/store-card";
import { StoryRail } from "@/components/community/story-rail";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages, type HotpageDTO } from "@/services/hotpage.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { getFeedStories } from "@/services/social.functions";
import { Button } from "@/components/ui/button";

import { listPublicArticles, type NewsArticleDTO } from "@/services/news.functions";
import { NewsCard } from "@/components/news/news-card";

// ── Categorias Master Estilo iFood / Super App do Dia a Dia ──
interface MasterCategoryItem {
  to: string;
  label: string;
  icon: any;
  badge?: string;
  icon_url?: string;
  slug?: string;
}

const DEFAULT_MASTER_CATEGORIES: MasterCategoryItem[] = [
  { to: "/mercado?niche=mercado", slug: "mercado", label: "Mercado", icon: Storefront, badge: "Essencial" },
  { to: "/mercado?niche=farmacia", slug: "farmacia", label: "Farmácia", icon: Heartbeat, badge: "Saúde" },
  { to: "/mercado?niche=gastronomia", slug: "gastronomia", label: "Delivery", icon: ForkKnife, badge: "Comida" },
  { to: "/mercado?niche=conveniencia", slug: "conveniencia", label: "Bebidas", icon: Coffee },
  { to: "/mercado?niche=moda", slug: "moda", label: "Roupas & Moda", icon: TShirt },
  { to: "/mercado?niche=aluguel", slug: "aluguel", label: "Alugue", icon: Key },
  { to: "/empregos", slug: "empregos", label: "Empregos", icon: Briefcase, badge: "Vagas" },
  { to: "/agenda", slug: "agenda", label: "Eventos", icon: CalendarDots },
  { to: "/mobilidade", slug: "mobilidade", label: "Mobilidade", icon: CarProfile },
  { to: "/classificados", slug: "classificados", label: "Classificados", icon: Tag },
  { to: "/mercado?niche=beleza", slug: "beleza", label: "Beleza", icon: Scissors },
  { to: "/diretorio", slug: "diretorio", label: "Serviços", icon: Compass },
];

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "JAH — Super App Comunitário" },
      {
        name: "description",
        content:
          "Explore mercado, farmácia, gastronomia, empregos, eventos culturais, mobilidade e classificados na sua região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, marketFeed, stories, newsArticles] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listHotpages({ data: { module: "home" } }).catch(() => []),
      getMarketplaceFeed().catch(() => ({ sections: [], allProducts: [] })),
      getFeedStories().catch(() => []),
      listPublicArticles({ data: { limit: 6 } }).catch(() => []),
    ]);
    return { banners, hotpages, marketFeed, stories, newsArticles };
  },
  component: CommercialHomePage,
});

function CommercialHomePage() {
  const { banners, hotpages, marketFeed, stories, newsArticles } = Route.useLoaderData();

  // Real flash deals rail
  const flashOffersSection = marketFeed.sections?.find((s: any) => s.type === "flash_deal_rail");
  const flashProducts = flashOffersSection?.items || [];

  // Real stores rail
  const storeSection = marketFeed.sections?.find((s: any) => s.type === "store_rail");
  const stores = storeSection?.items || [];

  // Real catalog highlights rail
  const trendingSection = marketFeed.sections?.find((s: any) => s.type === "product_rail");
  const catalogProducts = trendingSection?.items || [];

  const hasAnyCommercialData =
    banners.length > 0 ||
    hotpages.length > 0 ||
    flashProducts.length > 0 ||
    stores.length > 0 ||
    catalogProducts.length > 0;

  // Build master categories merging with database custom icons if configured
  const categoriesList = DEFAULT_MASTER_CATEGORIES.map((cat) => {
    const match = hotpages.find((hp: HotpageDTO) => hp.slug === cat.slug);
    return {
      ...cat,
      icon_url: match?.custom_icon_url || match?.icon_url || undefined,
    };
  });

  return (
    <div className="w-full space-y-8 pb-10">
      {/* ── 1. Top Banners Hero Carousel (100% Real do Supabase) ── */}
      {banners.length > 0 && (
        <section aria-label="Destaques Principais">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 2. Stories Rápidos de Lojas & Membros Locais ── */}
      {stories && stories.length > 0 && (
        <section aria-label="Stories Locais" className="py-1">
          <StoryRail stories={stories} />
        </section>
      )}

      {/* ── 3. Categorias Master Diárias Estilo iFood (com Suporte a Upload Customizado) ── */}
      <section aria-label="Acesso Rápido Master" className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkle size={16} weight="fill" className="text-foreground" />
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            Categorias em Destaque
          </h2>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none w-full px-0.5">
          {categoriesList.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.label}
                to={cat.to as any}
                className="min-w-[104px] sm:min-w-[114px] h-[94px] sm:h-[100px] p-3 rounded-2xl border border-border bg-card hover:bg-muted/70 hover:border-foreground/30 flex flex-col items-center justify-between transition-all select-none group cursor-pointer shrink-0 shadow-2xs active:scale-[0.98]"
              >
                <div className="relative size-9 sm:size-10 rounded-xl bg-muted flex items-center justify-center text-foreground group-hover:scale-110 transition-transform overflow-hidden">
                  {cat.icon_url ? (
                    <img
                      src={cat.icon_url}
                      alt={cat.label}
                      className="size-5 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Icon size={20} weight="bold" />
                  )}
                  {cat.badge && (
                    <span className="absolute -top-1.5 -right-1 px-1 py-0.2 text-[8px] font-mono font-bold uppercase rounded-sm bg-foreground text-background">
                      {cat.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-bold text-center text-foreground line-clamp-1 leading-tight">
                  {cat.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── 4. Categorias / Hotpages Panorâmicas Clean (Sem poluição de texto) ── */}
      {hotpages.length > 0 && (
        <section className="space-y-3" aria-label="Coleções & Hotpages">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Explorar Coleções Locais
            </h2>
            <Link
              to="/mercado"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver tudo
            </Link>
          </div>
          <HotpagesRail hotpages={hotpages} cleanMode={true} />
        </section>
      )}

      {/* ── 5. Ofertas Relâmpago ── */}
      {flashProducts.length > 0 && (
        <section aria-label="Ofertas Relâmpago">
          <HorizontalRail
            title="Ofertas Relâmpago"
            badge="Tempo Limitado"
            actionLabel="Ver todas as ofertas"
            actionTo="/mercado?niche=ofertas"
          >
            {flashProducts.map((product: any) => (
              <OfferCard
                key={product.id}
                id={product.id}
                title={product.title}
                slug={product.slug}
                store_name={product.store_name}
                price_cents={product.price_cents}
                original_price_cents={product.original_price_cents}
                discount_percent={product.discount_percent}
                mechanic_label={product.mechanic_label}
                ends_at={product.ends_at}
                has_flash_offer={product.has_flash_offer}
                cover_image={product.cover_image || "/banner-placeholder.png"}
                selling_unit={product.selling_unit || "un"}
                in_stock={product.in_stock}
              />
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* ── 6. Lojas & Negócios Locais ── */}
      {stores.length > 0 && (
        <section aria-label="Comércios Locais em Destaque">
          <HorizontalRail
            title="Lojas & Negócios Locais"
            badge="Compre do Bairro"
            actionLabel="Ver diretório completo"
            actionTo="/diretorio"
          >
            {stores.map((store: any) => (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                slug={store.slug}
                avatar_url={store.avatar_url}
                banner_url={store.banner_url}
                category={store.category}
                rating={store.rating}
                review_count={store.review_count}
                distance_km={store.distance_km}
                is_open={store.is_open}
                delivery_time_min={store.delivery_time_min}
              />
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* ── 7. Produtos em Destaque ── */}
      {catalogProducts.length > 0 && (
        <section aria-label="Produtos em Destaque">
          <HorizontalRail
            title="Destaques do Catálogo"
            badge="Disponível"
            actionLabel="Explorar catálogo"
            actionTo="/mercado"
          >
            {catalogProducts.map((prod: any) => (
              <OfferCard
                key={prod.id}
                id={prod.id}
                title={prod.title}
                slug={prod.slug}
                store_name={prod.store_name}
                price_cents={prod.price_cents}
                original_price_cents={prod.original_price_cents}
                discount_percent={prod.discount_percent}
                mechanic_label={prod.mechanic_label}
                ends_at={prod.ends_at}
                has_flash_offer={prod.has_flash_offer}
                cover_image={prod.cover_image || "/banner-placeholder.png"}
                selling_unit={prod.selling_unit || "un"}
                in_stock={prod.in_stock}
              />
            ))}
          </HorizontalRail>
        </section>
      )}

      {/* ── 8. Trilho de Notícias & Jornalismo Local ── */}
      {newsArticles && newsArticles.length > 0 && (
        <section aria-label="Notícias & Matérias da Região" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background">
                Notícias
              </span>
              <span className="text-xs font-bold text-foreground">Últimos Acontecimentos</span>
            </div>
            <Button asChild variant="ghost" size="sm" className="font-bold text-xs">
              <Link to="/noticias">Ver todas</Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {newsArticles.slice(0, 3).map((article: NewsArticleDTO) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {/* ── 9. Estado Inicial / Onboarding Honesto (Sem mocks) ── */}
      {!hasAnyCommercialData && newsArticles.length === 0 && (
        <section className="py-12 px-6 rounded-3xl border border-dashed border-border bg-card/60 text-center space-y-4 max-w-xl mx-auto">
          <div className="size-16 rounded-2xl bg-muted text-foreground flex items-center justify-center mx-auto">
            <Storefront size={32} weight="bold" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">
              Marketplace em Expansão na sua Região
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Nenhuma loja ou produto foi publicado nesta localidade ainda. Você pode ser o primeiro lojista ou produtor a abrir seu catálogo digital.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="w-full sm:w-auto rounded-xl font-bold">
              <Link to="/criar-negocio">
                <Storefront size={16} weight="bold" className="mr-2" />
                Cadastrar Minha Loja
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-xl font-bold">
              <Link to="/workspace">
                Painel do Lojista
              </Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
