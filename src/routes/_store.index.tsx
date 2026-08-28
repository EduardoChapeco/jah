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

import { getModularSurfaceFeed } from "@/services/surface-cms.functions";
import { ModularSurfaceFeed } from "@/components/commerce/modular-surface-feed";
import { listPublicCategoryHubs } from "@/services/admin-hubs.functions";

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
    const [banners, hotpages, categoryHubs, modularFeed, stories, newsArticles, packages] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listHotpages({ data: { module: "home" } }).catch(() => []),
      listPublicCategoryHubs({ data: { module: "home" } }).catch(() => []),
      getModularSurfaceFeed({ data: { surfaceSlug: "home" } }).catch(() => ({ sections: [], allProducts: [] })),
      getFeedStories().catch(() => []),
      listPublicArticles({ data: { limit: 6 } }).catch(() => []),
      listPublicStorePackages().catch(() => []),
    ]);
    return { banners, hotpages, categoryHubs, modularFeed, stories, newsArticles, packages };
  },
  component: CommercialHomePage,
});

function CommercialHomePage() {
  const { banners, hotpages, categoryHubs, modularFeed, stories, newsArticles, packages } = Route.useLoaderData();

  const hasAnyCommercialData =
    banners.length > 0 ||
    hotpages.length > 0 ||
    (modularFeed.sections && modularFeed.sections.length > 0);

  // Build master categories strictly from the database (CMS truth)
  // Fallback to DEFAULT_MASTER_CATEGORIES only if the database has not been seeded/configured yet
  const categoriesList = categoryHubs && categoryHubs.length > 0
    ? categoryHubs.map((ch: HotpageDTO) => {
        const defaultMatch = DEFAULT_MASTER_CATEGORIES.find(c => c.slug === ch.slug);
        return {
          to: ch.target_route || `/${ch.slug}`,
          slug: ch.slug,
          label: ch.title,
          badge: ch.badge_label || undefined,
          icon_url: ch.custom_icon_url || ch.icon_url || undefined,
          icon: defaultMatch?.icon || Storefront,
        };
      })
    : DEFAULT_MASTER_CATEGORIES;

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

      {/* ── 5. Seções Dinâmicas & Modulares do CMS (Ofertas, Lojas, Grids, Bento) ── */}
      {modularFeed.sections && modularFeed.sections.length > 0 && (
        <ModularSurfaceFeed sections={modularFeed.sections} />
      )}

      {/* ── 6.5. Pacotes de Aulas, Treinos & Serviços com Desconto ── */}
      {packages && packages.length > 0 && (
        <section aria-label="Pacotes & Aulas em Destaque">
          <ServicePackagesRail packages={packages} />
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
        <section className="py-12 px-6 rounded-2xl border border-border/60 bg-card text-center space-y-4 max-w-xl mx-auto">
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
