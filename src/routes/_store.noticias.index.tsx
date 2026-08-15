import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Newspaper,
  Flame,
  Search,
  SlidersHorizontal,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";
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
      { title: "Notícias & Editorial | JAH" },
      {
        name: "description",
        content: "Acompanhe as últimas notícias, reportagens e destaques da sua região no JAH.",
      },
    ],
  }),
  loader: async () => {
    const [articles, banners, hotpages] = await Promise.all([
      listPublicArticles({ data: { limit: 30 } }).catch(() => []),
      listActiveBanners({ data: { placement: "noticias" } }).catch(() => []),
      listHotpages({ data: { module: "noticias" } }).catch(() => []),
    ]);
    return { articles, banners, hotpages };
  },
  component: NoticiasFeedPage,
});

const CATEGORIES = [
  { id: "todas", label: "Todas" },
  { id: "cidade", label: "Cidade & Região" },
  { id: "politica", label: "Política" },
  { id: "economia", label: "Economia & Negócios" },
  { id: "cultura", label: "Cultura & Lazer" },
  { id: "esportes", label: "Esportes" },
  { id: "tecnologia", label: "Inovação" },
];

function NoticiasFeedPage() {
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
        limit: 30,
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
        limit: 30,
      },
    }).catch(() => []);
    setArticles(updated);
    setIsSearching(false);
  };

  const featuredArticle = articles[0];
  const gridArticles = articles.slice(1);

  return (
    <div className="w-full space-y-8">
      {/* ── 1. Banners no Portal de Notícias ── */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners e Anúncios">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* ── 1.5. Hotpages & Categorias Visuais ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias">
          <HotpagesRail hotpages={hotpages} />
        </section>
      )}

      {/* ── 2. Barra Superior Editorial & Busca ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground">
            Notícias
          </span>
          <span className="text-xs text-muted-foreground font-mono">Cobertura em Tempo Real</span>
        </div>

        {/* Busca Rápida de Notícias */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:w-72">
          <Input
            placeholder="Buscar matérias..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl h-10 bg-card text-xs"
          />
          <Button type="submit" size="icon" className="h-10 w-10 rounded-2xl shrink-0 font-bold">
            <Search className="size-4" />
          </Button>
        </form>
      </div>

      {/* ── Categorias & Editorias Chips ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => handleFilterCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Manchete Principal em Destaque ── */}
      {featuredArticle && !searchQuery && (
        <section className="relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-md group hover-elevate transition-all">
          <Link
            to="/noticias/$slug"
            params={{ slug: featuredArticle.slug }}
            className="grid grid-cols-1 lg:grid-cols-12 min-h-[360px]"
          >
            {featuredArticle.cover_media_url && (
              <div className="lg:col-span-7 relative aspect-16/9 lg:aspect-auto overflow-hidden bg-muted">
                <img
                  src={featuredArticle.cover_media_url}
                  alt={featuredArticle.title}
                  className="size-full object-cover group-hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 lg:hidden pointer-events-none" />
              </div>
            )}

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {featuredArticle.kicker || "Manchete Principal"}
                  </span>
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {featuredArticle.reading_time_minutes} min de leitura
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors">
                  {featuredArticle.title}
                </h2>

                {featuredArticle.subtitle && (
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {featuredArticle.subtitle}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  {featuredArticle.store_name || "Redação JAH"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  <span>Ler Matéria Completa</span>
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Grid de Notícias ── */}
      {articles.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/50 space-y-3">
          <Newspaper className="size-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-base font-bold text-foreground">Nenhuma notícia encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não há publicações cadastradas para o filtro selecionado no momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(searchQuery ? articles : gridArticles).map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
