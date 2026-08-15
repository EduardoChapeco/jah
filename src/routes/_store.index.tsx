import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Flame,
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  Scissors,
  Briefcase,
  Plane,
  ArrowRight,
  ShieldCheck,
  Tag,
  Star,
  Plus,
  Compass,
} from "lucide-react";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { OfferCard } from "@/components/commerce/offer-card";
import { StoreCard } from "@/components/commerce/store-card";
import { StoryRail } from "@/components/community/story-rail";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { getFeedStories } from "@/services/social.functions";
import { Button } from "@/components/ui/button";

import { listPublicArticles, type NewsArticleDTO } from "@/services/news.functions";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "JAH — Marketplace & Descoberta Comercial da Comunidade" },
      {
        name: "description",
        content:
          "Explore ofertas relâmpago, gastronomia, marcas autorais, comércios locais e serviços na sua região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, marketFeed, stories, newsArticles] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listHotpages().catch(() => []),
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

  // Find real flash deals rail
  const flashOffersSection = marketFeed.sections?.find((s: any) => s.type === "flash_deal_rail");
  const flashProducts = flashOffersSection?.items || [];

  // Find real stores rail
  const storeSection = marketFeed.sections?.find((s: any) => s.type === "store_rail");
  const stores = storeSection?.items || [];

  // Find real catalog highlights rail
  const trendingSection = marketFeed.sections?.find((s: any) => s.type === "product_rail");
  const catalogProducts = trendingSection?.items || [];

  const hasAnyCommercialData =
    banners.length > 0 ||
    hotpages.length > 0 ||
    flashProducts.length > 0 ||
    stores.length > 0 ||
    catalogProducts.length > 0;

  return (
    <div className="w-full space-y-8">
      {/* ── 1. Top Banners Hero Carousel (100% Real do Supabase) ── */}
      {banners.length > 0 && (
        <section aria-label="Destaques Principais">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 2. Stories Rápidos de Lojas & Marcas da Comunidade ── */}
      {stories && stories.length > 0 && (
        <section aria-label="Stories Locais" className="py-1">
          <StoryRail stories={stories} />
        </section>
      )}

      {/* ── 3. Categorias / Hotpages Panorâmicas ── */}
      {hotpages.length > 0 && (
        <section className="space-y-3" aria-label="Categorias">
          <HotpagesRail hotpages={hotpages} />
        </section>
      )}

      {/* ── 4. Ofertas Relâmpago ── */}
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

      {/* ── 5. Lojas & Negócios ── */}
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

      {/* ── 6. Produtos Destaque ── */}
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

      {/* ── 6.5. Trilho de Notícias & Jornalismo Local ── */}
      {newsArticles && newsArticles.length > 0 && (
        <section aria-label="Notícias & Matérias da Região" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                Notícias
              </span>
              <span className="text-xs font-bold text-foreground">Acontecimentos & Matérias</span>
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

      {/* ── 7. Estado Inicial / Onboarding Honesto (Sem mocks) ── */}
      {!hasAnyCommercialData && newsArticles.length === 0 && (
        <section className="py-12 px-6 rounded-3xl border border-dashed border-border bg-card/60 text-center space-y-4 max-w-xl mx-auto">
          <div className="size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Store className="size-8" />
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
            <Button asChild className="w-full sm:w-auto rounded-2xl font-bold">
              <Link to="/criar-negocio">
                <Store className="size-4 mr-2" />
                Cadastrar Minha Loja
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full sm:w-auto rounded-2xl font-bold">
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
