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
  Flame,
} from "@phosphor-icons/react";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { OfferCard } from "@/components/commerce/offer-card";
import { StoreCard } from "@/components/commerce/store-card";
import { StoryRail } from "@/components/community/story-rail";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { MasterHeroCards } from "@/components/commerce/master-hero-cards";
import { HitsLeadCard } from "@/components/commerce/hits-lead-card";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages, type HotpageDTO } from "@/services/hotpage.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";
import { getFeedStories } from "@/services/social.functions";
import { Button } from "@/components/ui/button";

import { listPublicArticles, type NewsArticleDTO } from "@/services/news.functions";
import { NewsCard } from "@/components/news/news-card";
import { ServicePackagesRail } from "@/components/commerce/service-packages-rail";
import { listPublicStorePackages } from "@/services/service-packages.functions";

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
  { to: "/ofertas", slug: "ofertas", label: "Ofertas Relâmpago", icon: Flame, badge: "Até 60% OFF" },
  { to: "/gastronomia", slug: "gastronomia", label: "Delivery & Gastronomia", icon: ForkKnife, badge: "Comida" },
  { to: "/mercado", slug: "mercado", label: "Mercado & Hortifrúti", icon: Storefront, badge: "Essencial" },
  { to: "/farmacia", slug: "farmacia", label: "Farmácia & Saúde", icon: Heartbeat, badge: "Saúde" },
  { to: "/bebidas", slug: "bebidas", label: "Bebidas & Adega", icon: Coffee, badge: "Bebidas" },
  { to: "/acougue", slug: "acougue", label: "Açougue & Carnes", icon: Flame, badge: "Churrasco" },
  { to: "/eletronicos", slug: "eletronicos", label: "Eletrônicos & Tech", icon: Storefront, badge: "Tech" },
  { to: "/moda", slug: "moda", label: "Roupas & Moda", icon: TShirt },
  { to: "/casa", slug: "casa", label: "Casa & Móveis", icon: Storefront },
  { to: "/pet", slug: "pet", label: "Pet Shop", icon: Heartbeat, badge: "Pets" },
  { to: "/construcao", slug: "construcao", label: "Construção & Casa", icon: Storefront },
  { to: "/limpeza", slug: "limpeza", label: "Limpeza & Higiene", icon: Storefront },
  { to: "/livros", slug: "livros", label: "Livraria & Papelaria", icon: Storefront },
  { to: "/servicos", slug: "servicos", label: "Serviços & Obras", icon: Briefcase },
  { to: "/imoveis", slug: "imoveis", label: "Imóveis & Moradia", icon: Key },
  { to: "/beleza", slug: "beleza", label: "Beleza & Barbearias", icon: Scissors, badge: "Beleza" },
  { to: "/doacoes", slug: "doacoes", label: "Doações & Solidariedade", icon: Heartbeat, badge: "Social" },
  { to: "/classificados", slug: "classificados", label: "Classificados", icon: Tag },
  { to: "/agenda", slug: "agenda", label: "Eventos", icon: CalendarDots },
  { to: "/turismo", slug: "turismo", label: "Turismo", icon: AirplaneTilt, badge: "Lazer" },
  { to: "/empregos", slug: "empregos", label: "Empregos", icon: Briefcase, badge: "Vagas" },
  { to: "/diretorio", slug: "diretorio", label: "Diretório Local", icon: Compass },
  { to: "/mobilidade", slug: "mobilidade", label: "Mobilidade", icon: CarProfile },
];

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "Wider — Super App Comunitário" },
      {
        name: "description",
        content:
          "Explore mercado, farmácia, gastronomia, empregos, eventos culturais, mobilidade e classificados na sua região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, marketFeed, stories, newsArticles, packages] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listHotpages({ data: { module: "home" } }).catch(() => []),
      getMarketplaceFeed().catch(() => ({ sections: [], allProducts: [] })),
      getFeedStories().catch(() => []),
      listPublicArticles({ data: { limit: 6 } }).catch(() => []),
      listPublicStorePackages().catch(() => []),
    ]);
    return { banners, hotpages, marketFeed, stories, newsArticles, packages };
  },
  component: CommercialHomePage,
});

function CommercialHomePage() {
  const { banners, hotpages, marketFeed, stories, newsArticles, packages } = Route.useLoaderData();

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
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Top Big Squircle Master Cards & Category Rail (Estilo iFood) ── */}
      <section aria-label="Acesso Rápido Master">
        <MasterHeroCards customCategories={categoriesList} hotpages={hotpages} />
      </section>

      {/* ── 2. Top Banners Hero Carousel (100% Real do Supabase) ── */}
      {banners.length > 0 && (
        <section aria-label="Destaques Principais">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 3. Stories Rápidos de Lojas & Membros Locais ── */}
      {stories && stories.length > 0 && (
        <section aria-label="Stories Locais" className="py-1">
          <StoryRail stories={stories} />
        </section>
      )}

      {/* ── 4. Categorias / Hotpages Panorâmicas Clean ── */}
      {hotpages.length > 0 && (
        <section aria-label="Coleções & Hotpages">
          <HotpagesRail hotpages={hotpages} cleanMode={true} />
        </section>
      )}

      {/* ── 5. Ofertas Relâmpago com Card Líder Limpo ── */}
      {flashProducts.length > 0 && (
        <section aria-label="Ofertas Relâmpago">
          <HorizontalRail
            title="Ofertas Relâmpago"
            hideHeader={true}
            leadCard={
              <HitsLeadCard
                actionTo="/ofertas"
                gradient="from-red-600 via-orange-600 to-amber-600"
                ariaLabel="Ofertas Relâmpago"
              />
            }
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
            hideHeader={true}
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

      {/* ── 6.5. Pacotes de Aulas, Treinos & Serviços com Desconto ── */}
      {packages && packages.length > 0 && (
        <section aria-label="Pacotes & Aulas em Destaque">
          <ServicePackagesRail packages={packages} />
        </section>
      )}

      {/* ── 7. Produtos em Destaque ── */}
      {catalogProducts.length > 0 && (
        <section aria-label="Produtos em Destaque">
          <HorizontalRail
            title="Destaques do Catálogo"
            hideHeader={true}
            leadCard={
              <HitsLeadCard
                actionTo="/mercado"
                gradient="from-indigo-600 via-purple-600 to-pink-600"
                ariaLabel="Produtos em Destaque"
              />
            }
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
          {/* Seção sem título visível — link sutil "Ver todas" alinhado à direita */}
          <div className="flex justify-end">
            <Button asChild variant="ghost" size="sm" className="font-semibold text-xs text-muted-foreground hover:text-foreground">
              <Link to="/noticias">Ver todas as notícias</Link>
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
        <section className="py-12 px-6 rounded-3xl border-0 bg-card/60 text-center space-y-4 max-w-xl mx-auto">
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
