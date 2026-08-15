import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Loader2,
  AlertCircle,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  Flame,
  Tag,
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  Scissors,
  Briefcase,
  Plane,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlinePostComposer } from "@/components/community/inline-post-composer";
import { PostCard } from "@/components/community/post-card";
import { StoryRail } from "@/components/community/story-rail";
import { ThumbnailPreviewRail } from "@/components/community/thumbnail-preview-rail";
import { SuggestedFriendsBlock } from "@/components/community/suggested-friends-block";
import { FeedBannerBlock } from "@/components/community/feed-banner-block";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { OfferCard } from "@/components/commerce/offer-card";
import { StoreCard } from "@/components/commerce/store-card";
import { getMuralFeed, getFeedStories, getSuggestedFriends } from "@/services/social.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { getMarketplaceFeed } from "@/services/marketplace.functions";

export const Route = createFileRoute("/_store/")({
  head: () => ({
    meta: [
      { title: "JAH — Plataforma Comunitária de Comércio, Cultura & Descoberta" },
      {
        name: "description",
        content:
          "Explore ofertas locais, gastronomia, marcas autorais, eventos e classificados da sua comunidade.",
      },
    ],
  }),
  loader: async () => {
    const [firstPage, stories, suggestedFriends, banners, hotpages, marketFeed] = await Promise.all(
      [
        getMuralFeed({ data: { limit: 15 } }).catch(() => ({
          items: [],
          hasMore: false,
          nextCursor: null,
        })),
        getFeedStories().catch(() => []),
        getSuggestedFriends().catch(() => []),
        listActiveBanners({ data: { placement: "home" } }).catch(() => []),
        listHotpages().catch(() => []),
        getMarketplaceFeed().catch(() => ({ sections: [], allProducts: [] })),
      ],
    );
    return { firstPage, stories, suggestedFriends, banners, hotpages, marketFeed };
  },
  component: HomePage,
});

function HomePage() {
  const { firstPage, stories, suggestedFriends, banners, hotpages, marketFeed } =
    Route.useLoaderData();
  const [activeFeedTab, setActiveFeedTab] = useState<"for_you" | "moments" | "classifieds">(
    "for_you",
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
    queryKey: ["mural-feed"],
    queryFn: async ({ pageParam = 0 }) => {
      return await getMuralFeed({ data: { cursor: pageParam as string | undefined, limit: 15 } });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    initialData: {
      pages: [firstPage],
      pageParams: [undefined],
    },
  });

  const allPosts = data?.pages.flatMap((page) => page.items) || [];

  const filteredPosts = allPosts.filter((item) => {
    if (activeFeedTab === "moments") {
      return (item.media_urls && item.media_urls.length > 0) || item.location_name;
    }
    if (activeFeedTab === "classifieds") {
      return item.reference_type === "classified";
    }
    return true;
  });

  const RightAsideWidgets = (
    <div className="space-y-6">
      {/* Widget do Mapa Social */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Moments na Cidade</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Ao Vivo
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Veja momentos publicados por pessoas e locais em tempo real no mapa interativo.
        </p>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full rounded-xl text-xs font-semibold"
        >
          <Link to="/mapa">
            Abrir Mapa Social
            <ArrowRight className="size-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>

      {/* Widget de Próximos Eventos */}
      <div className="rounded-3xl border border-border bg-card p-5 space-y-3.5 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Agenda Cultural</h3>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Shows, feiras de artesanato, exposições e eventos gastronômicos na sua região.
        </p>

        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full rounded-xl text-xs font-semibold"
        >
          <Link to="/agenda">
            Ver Agenda Completa
            <ArrowRight className="size-3.5 ml-1.5" />
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full space-y-8">
      {/* ── 1. Top Universal Banner Hero ────────────────────────── */}
      {banners && banners.length > 0 && <BannerHeroCarousel banners={banners} className="w-full" />}

      {/* ── 2. Hotpages & Categorias Grid/Rail (Estilo iFood / Pinterest) ── */}
      {hotpages && hotpages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Destaques & Hotpages da Cidade</span>
            </h2>
            <Link to="/mercado" className="text-xs text-primary font-bold hover:underline">
              Ver tudo →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {hotpages.map((hp) => (
              <Link
                key={hp.id}
                to="/mercado"
                search={{ categoria: hp.slug }}
                className="group relative flex flex-col justify-end p-3 rounded-2xl overflow-hidden aspect-4/3 sm:aspect-square bg-muted border border-border/80 hover:border-primary/50 shadow-xs hover-elevate transition-all select-none"
              >
                {/* Background Image */}
                {hp.cover_image_url && (
                  <img
                    src={hp.cover_image_url}
                    alt={hp.title}
                    className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Badge */}
                {hp.badge_label && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-2xs z-10">
                    {hp.badge_label}
                  </span>
                )}

                {/* Title */}
                <div className="relative z-10 text-white space-y-0.5">
                  <h3 className="text-xs sm:text-sm font-bold leading-tight line-clamp-1 group-hover:text-amber-300 transition-colors">
                    {hp.title}
                  </h3>
                  {hp.description && (
                    <p className="text-[10px] text-zinc-300 line-clamp-1 hidden sm:block">
                      {hp.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. Rail de Ofertas Relâmpago (Se houver produtos) ──── */}
      {marketFeed?.allProducts && marketFeed.allProducts.length > 0 && (
        <div className="pt-2">
          <HorizontalRail
            title="⚡ Ofertas Relâmpago na Sua Região"
            subtitle="Preços promocionais com estoque limitado disponíveis para entrega rápida"
            badge="Até 40% OFF"
            actionLabel="Ver todas"
            onAction={() => (window.location.href = "/mercado?niche=ofertas")}
          >
            {marketFeed.allProducts.slice(0, 6).map((product: any) => (
              <OfferCard key={product.id} {...product} />
            ))}
          </HorizontalRail>
        </div>
      )}

      {/* ── 4. Feed Central & Mural da Comunidade ────────────────── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full pt-4 border-t border-border/60">
        {/* Feed Social Central */}
        <div className="w-full max-w-[620px] space-y-6 mx-auto">
          {/* Feed Sub-Header Tabs */}
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <button
              onClick={() => setActiveFeedTab("for_you")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeFeedTab === "for_you"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Para Você
            </button>
            <button
              onClick={() => setActiveFeedTab("moments")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFeedTab === "moments"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Flame className="size-3.5 text-amber-500" />
              <span>Momentos</span>
            </button>
            <button
              onClick={() => setActiveFeedTab("classifieds")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                activeFeedTab === "classifieds"
                  ? "bg-foreground text-background font-bold shadow-2xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Tag className="size-3.5 text-primary" />
              <span>Classificados</span>
            </button>
          </div>

          {/* Stories Bar */}
          {stories && stories.length > 0 && <StoryRail stories={stories} />}

          {/* Composer inline */}
          <InlinePostComposer />

          {/* Status Loading/Error */}
          {(status as string) === "pending" && (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Carregando feed da comunidade...</p>
            </div>
          )}

          {status === "error" && (
            <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
              <AlertCircle className="size-8 text-destructive mx-auto" />
              <h3 className="font-bold text-foreground text-sm">
                Não foi possível carregar o feed
              </h3>
              <p className="text-xs text-muted-foreground">
                Verifique sua conexão e tente novamente.
              </p>
            </div>
          )}

          {/* Feed List com blocos editoriais intercalados */}
          <div className="space-y-6">
            {filteredPosts.map((post, idx) => (
              <div key={post.id} className="space-y-6">
                <PostCard item={post} />

                {idx === 2 && (
                  <FeedBannerBlock
                    title="Descubra Sabores Autorais da Cidade"
                    subtitle="Explore pratos especiais e cafés artesanais entregues na sua porta."
                    badge="JAH Gastronomia"
                    actionLabel="Explorar Menu"
                    actionHref="/mercado?niche=gastronomia"
                  />
                )}

                {idx === 5 && allPosts.length > 0 && <ThumbnailPreviewRail items={allPosts} />}

                {idx === 9 && suggestedFriends && suggestedFriends.length > 0 && (
                  <SuggestedFriendsBlock friends={suggestedFriends} />
                )}
              </div>
            ))}

            {filteredPosts.length === 0 && status === "success" && (
              <div className="py-16 text-center space-y-3 bg-muted/20 rounded-3xl border border-border p-8">
                <Sparkles className="size-8 text-muted-foreground/40 mx-auto" />
                <h3 className="font-bold text-foreground text-sm">
                  Nenhum post encontrado nesta aba
                </h3>
                <p className="text-xs text-muted-foreground">
                  Seja a primeira pessoa a compartilhar um momento ou anúncio na comunidade!
                </p>
              </div>
            )}
          </div>

          {/* Infinite Scroll trigger */}
          {hasNextPage && (
            <div className="pt-6 pb-12 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-full px-6 text-xs font-semibold"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Carregando mais...
                  </>
                ) : (
                  "Carregar mais publicações"
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Coluna Lateral de Descobertas e Widgets */}
        <aside className="hidden xl:block w-[320px] shrink-0 sticky top-20 self-start space-y-6">
          {RightAsideWidgets}
        </aside>
      </div>
    </div>
  );
}
