import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  NewspaperClipping,
  Flame,
  MagnifyingGlass,
  ArrowRight,
  Sparkle,
  Lightning,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublicArticles, type NewsArticleDTO } from "@/services/news.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { NewsCard } from "@/components/news/news-card";

export const Route = createFileRoute("/_store/noticias/")({
  head: () => ({
    meta: [
      { title: "Notícias & Jornalismo Local | JAH" },
      {
        name: "description",
        content: "Acompanhe as últimas notícias, urgências, reportagens e coberturas locais no JAH.",
      },
    ],
  }),
  loader: async () => {
    const [articles, banners, hotpages] = await Promise.all([
      listPublicArticles({ data: { limit: 40 } }).catch(() => []),
      listActiveBanners({ data: { placement: "noticias" } }).catch(() => []),
      listHotpages({ data: { module: "noticias" } }).catch(() => []),
    ]);
    return { articles, banners, hotpages };
  },
  component: NoticiasFeedPage,
});

const CATEGORIES = [
  { id: "todas", label: "Todas as Notícias" },
  { id: "urgente", label: "Última Hora" },
  { id: "cidade", label: "Cidade & Região" },
  { id: "cultura", label: "Cultura & Lazer" },
  { id: "economia", label: "Economia & Negócios" },
  { id: "esportes", label: "Esportes" },
  { id: "politica", label: "Política" },
  { id: "tecnologia", label: "Inovação" },
];

export function NoticiasFeedPage() {
  const { articles: initialArticles, banners, hotpages } = Route.useLoaderData();
  const [articles, setArticles] = useState<NewsArticleDTO[]>(initialArticles || []);
  const [selectedCategory, setSelectedCategory] = useState("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleFilterCategory = async (cat: string) => {
    setSelectedCategory(cat);
    setIsSearching(true);
    const updated = await listPublicArticles({
      data: {
        category: cat === "todas" ? undefined : cat,
        query: searchQuery || undefined,
        limit: 40,
      },
    }).catch(() => []);
    setArticles(updated);
    setIsSearching(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    const updated = await listPublicArticles({
      data: {
        category: selectedCategory === "todas" ? undefined : selectedCategory,
        query: searchQuery || undefined,
        limit: 40,
      },
    }).catch(() => []);
    setArticles(updated);
    setIsSearching(false);
  };

  const featuredArticle = articles[0];
  const breakingNews = articles.filter(
    (a) => a.is_breaking || a.category === "urgente" || a.kicker?.toLowerCase().includes("urgente"),
  );
  const cultureArticles = articles.filter((a) => a.category === "cultura");
  const economyArticles = articles.filter((a) => a.category === "economia");
  const gridArticles = articles.slice(1);

  return (
    <div className="w-full space-y-8 pb-12">
      {/* ── 1. Banners no Portal de Notícias ── */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners e Anúncios">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 2. Barra Superior Editorial & Busca ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background">
            Notícias
          </span>
          <span className="text-xs text-muted-foreground font-mono">Cobertura em Tempo Real</span>
        </div>

        {/* Busca Rápida de Notícias */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-80">
          <Input
            placeholder="Buscar matérias, autores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl h-10 bg-card text-xs border-border"
          />
          <Button type="submit" size="icon" className="h-10 w-10 rounded-xl shrink-0 font-bold">
            <MagnifyingGlass size={16} weight="bold" />
          </Button>
        </form>
      </div>

      {/* ── 3. Categorias & Editorias Chips (Squircle Retangular Gordinho) ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleFilterCategory(cat.id)}
              className={`h-11 px-5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border cursor-pointer shrink-0 flex items-center justify-center ${
                isSelected
                  ? "bg-foreground text-background border-foreground font-semibold shadow-xs scale-102"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── 3.5. Hotpages & Coleções Visuais de Notícias ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Coleções de Notícias">
          <HotpagesRail
            hotpages={hotpages}
            activeSlug={selectedCategory}
            onSelect={(slug) => handleFilterCategory(slug)}
            cleanMode={true}
          />
        </section>
      )}

      {/* ── 4. Plantão & Notícias de Última Hora (Trilho Horizontal de Destaque) ── */}
      {breakingNews.length > 0 && !searchQuery && (
        <section aria-label="Plantão de Notícias" className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-red-600 animate-ping" />
            <Lightning size={16} weight="fill" className="text-foreground" />
            <h2 className="text-sm font-bold text-foreground tracking-tight uppercase font-mono">
              Plantão & Última Hora
            </h2>
          </div>

          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {breakingNews.map((article) => (
              <div key={article.id} className="min-w-[280px] sm:min-w-[340px] shrink-0">
                <NewsCard article={article} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 5. Manchete Principal em Destaque ── */}
      {featuredArticle && !searchQuery && (
        <section className="relative rounded-3xl overflow-hidden border border-border bg-card shadow-xs group hover-elevate transition-all">
          <Link
            to="/noticias/$slug"
            params={{ slug: featuredArticle.slug }}
            className="grid grid-cols-1 lg:grid-cols-12 min-h-[340px]"
          >
            {featuredArticle.cover_media_url && (
              <div className="lg:col-span-7 relative aspect-16/9 lg:aspect-auto overflow-hidden bg-muted">
                <img
                  src={featuredArticle.cover_media_url}
                  alt={featuredArticle.title}
                  className="size-full object-cover group-hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 lg:hidden pointer-events-none" />
              </div>
            )}

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background">
                    {featuredArticle.kicker || "Manchete Principal"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {featuredArticle.reading_time_minutes} min de leitura
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-tight group-hover:opacity-80 transition-opacity">
                  {featuredArticle.title}
                </h2>

                {featuredArticle.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {featuredArticle.subtitle}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {featuredArticle.store_name || "Redação JAH"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <span>Ler Matéria</span>
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── 6. Carrossel Editorial de Cultura & Lazer ── */}
      {cultureArticles.length > 0 && !searchQuery && (
        <section aria-label="Cultura & Lazer" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Cultura & Lazer na Cidade
            </h2>
            <button
              onClick={() => handleFilterCategory("cultura")}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Ver mais
            </button>
          </div>
          <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
            {cultureArticles.map((article) => (
              <div key={article.id} className="min-w-[280px] sm:min-w-[320px] shrink-0">
                <NewsCard article={article} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 7. Grade Geral de Notícias ── */}
      {articles.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/50 space-y-3">
          <Newspaper className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Nenhuma notícia encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não há publicações cadastradas para o filtro selecionado no momento.
          </p>
        </div>
      ) : (
        <section aria-label="Todas as Notícias" className="space-y-4">
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            Todas as Matérias
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(searchQuery ? articles : gridArticles).map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
