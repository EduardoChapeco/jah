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
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { getFeedStories } from "@/services/social.functions";
import { Button } from "@/components/ui/button";

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
    const [banners, hotpages, marketFeed, stories] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listHotpages().catch(() => []),
      getMarketplaceFeed().catch(() => ({ sections: [], allProducts: [] })),
      getFeedStories().catch(() => []),
    ]);
    return { banners, hotpages, marketFeed, stories };
  },
  component: CommercialHomePage,
});

function CommercialHomePage() {
  const { banners, hotpages, marketFeed, stories } = Route.useLoaderData();

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
    <div className="w-full space-y-8 sm:space-y-12">
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
        <section className="space-y-4" aria-label="Categorias em Destaque">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <Sparkles className="size-5 text-primary" />
                <span>Explorar por Categoria</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Navegue pelas principais áreas de consumo e serviços da comunidade
              </p>
            </div>
            <Link
              to="/mercado"
              className="text-xs sm:text-sm font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>Ver todas</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {/* Grid Panorâmico de Hotpages Ampliadas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {hotpages.map((hp) => {
              const showTitle = hp.show_title !== false;
              const showOverlay = hp.show_overlay !== false && (showTitle || hp.badge_label);

              return (
                <Link
                  key={hp.id}
                  to="/mercado"
                  search={{ niche: hp.slug }}
                  className="group relative flex flex-col justify-end aspect-16/10 sm:aspect-4/3 w-full rounded-2xl sm:rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs hover-elevate transition-all duration-300"
                >
                  {/* Cover Image */}
                  {hp.cover_image_url ? (
                    <img
                      src={hp.cover_image_url}
                      alt={hp.title}
                      className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 size-full bg-linear-to-br from-primary/20 to-muted flex items-center justify-center">
                      <Tag className="size-8 text-muted-foreground/40" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  {showOverlay && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
                  )}

                  {/* Content Container */}
                  <div className="relative p-3 sm:p-4 z-10 space-y-1">
                    {hp.show_badge !== false && hp.badge_label && (
                      <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-xs">
                        {hp.badge_label}
                      </span>
                    )}

                    {showTitle && (
                      <h3 className="text-xs sm:text-sm font-black text-white line-clamp-1 drop-shadow-xs">
                        {hp.title}
                      </h3>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 4. Trilho de Ofertas Relâmpago Reais ── */}
      {flashProducts.length > 0 && (
        <section aria-label="Ofertas Relâmpago">
          <HorizontalRail
            title="⚡ Ofertas Relâmpago na Sua Região"
            badge="Tempo Limitado"
            subtitle="Preços promocionais com contagem regressiva em tempo real"
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

      {/* ── 5. Lojas & Negócios Reais Cadastrados ── */}
      {stores.length > 0 && (
        <section aria-label="Comércios Locais em Destaque">
          <HorizontalRail
            title="🏪 Lojas & Negócios Locais"
            badge="Compre do Bairro"
            subtitle="Conheça negócios e produtores cadastrados na sua região"
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

      {/* ── 6. Produtos Destaque Reais ── */}
      {catalogProducts.length > 0 && (
        <section aria-label="Produtos em Destaque">
          <HorizontalRail
            title="🛍️ Destaques do Catálogo"
            badge="Disponível"
            subtitle="Itens adicionados recentemente pelos lojistas"
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

      {/* ── 7. Estado Inicial / Onboarding Honesto (Sem mocks) ── */}
      {!hasAnyCommercialData && (
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

      {/* ── 8. Banner de Conversão Comercial: Venda no JAH ── */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-900 via-zinc-800 to-black text-white p-6 sm:p-10 lg:p-12 border border-border shadow-md">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold uppercase tracking-wider text-emerald-400 border border-white/15">
            <Store className="size-3.5" />
            <span>Ecossistema para Empreendedores</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Venda seus produtos, serviços e desapegos para milhares de pessoas.
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Tenha seu próprio catálogo digital, frente de caixa PDV, links de entrega com motoboy e gestão integrada sem taxas abusivas.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild size="lg" className="rounded-2xl font-bold bg-primary text-primary-foreground shadow-md hover:scale-105 active:scale-95 transition-all">
              <Link to="/criar-negocio">
                Criar Minha Loja Grátis
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link to="/conta/classificados/novo">
                Publicar Classificado Avulso
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
