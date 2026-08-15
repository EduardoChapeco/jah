import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import {
  Clock,
  Calendar,
  User,
  Share2,
  Bookmark,
  ArrowLeft,
  Quote,
  Newspaper,
  ChevronRight,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getArticleDetail, type NewsArticleDTO, type SponsorDTO } from "@/services/news.functions";
import { NewsSponsorBanner } from "@/components/news/news-sponsor-banner";
import { NewsCommentsSection } from "@/components/news/news-comments-section";
import { recordAdTelemetry } from "@/services/telemetry.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/noticias/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.article ? `${loaderData.article.title} | JAH Notícias` : "Notícia | JAH" },
      { name: "description", content: loaderData?.article?.subtitle || "Notícia local no JAH." },
    ],
  }),
  loader: async ({ params }) => {
    const data = await getArticleDetail({ data: { slug: params.slug } }).catch(() => null);
    if (!data || !data.article) {
      throw notFound();
    }
    return data;
  },
  component: NoticiaDetailPage,
});

function NoticiaDetailPage() {
  const { article, sponsors, related } = Route.useLoaderData();
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollTrackedRefs = useRef<Set<number>>(new Set());

  // Rastreamento de progresso de scroll da página (25%, 50%, 75%, 100%)
  useEffect(() => {
    // 1. Grava telemetria de visualização única do artigo
    recordAdTelemetry({
      data: {
        store_id: article.store_id,
        article_id: article.id,
        event_type: "view_unique",
      },
    }).catch(() => {});

    // 2. Listener de Scroll
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) return;
      const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
      setScrollProgress(progress);

      // Marco de telemetria antifraude
      [25, 50, 75, 100].forEach((milestone) => {
        if (progress >= milestone && !scrollTrackedRefs.current.has(milestone)) {
          scrollTrackedRefs.current.add(milestone);
          recordAdTelemetry({
            data: {
              store_id: article.store_id,
              article_id: article.id,
              event_type: "scroll_depth",
              scroll_percentage: milestone,
            },
          }).catch(() => {});
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [article.id, article.store_id]);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link da notícia copiado!");
    }
  };

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Recente";

  const primarySponsor = sponsors[0];
  const secondarySponsor = sponsors[1] || sponsors[0];

  return (
    <div className="w-full relative">
      {/* ── Barra de Progresso de Leitura Sticky ── */}
      <div
        className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />

      <article className="max-w-3xl mx-auto space-y-8">
        {/* ── Breadcrumb de Navegação ── */}
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link to="/noticias" className="hover:text-foreground transition-colors">
            Notícias
          </Link>
          <ChevronRight className="size-3" />
          <span className="capitalize text-foreground font-bold">{article.category}</span>
        </div>

        {/* ── Cabeçalho Editorial da Matéria ── */}
        <header className="space-y-4">
          {article.kicker && (
            <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {article.kicker}
            </span>
          )}

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.15] font-display">
            {article.title}
          </h1>

          {article.subtitle && (
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed font-serif italic border-l-2 border-primary/40 pl-4 py-0.5">
              {article.subtitle}
            </p>
          )}

          {/* Linha de Metadados / Autor / Compartilhar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-b border-border/60 py-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {article.store_avatar ? (
                    <img
                      src={article.store_avatar}
                      alt={article.store_name}
                      className="size-full rounded-full object-cover"
                    />
                  ) : (
                    <Newspaper className="size-3.5" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{article.store_name || "Redação JAH"}</p>
                  {article.author_name && <p className="text-[10px]">Por {article.author_name}</p>}
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Calendar className="size-3.5" />
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-1.5 font-mono text-[11px]">
                <Clock className="size-3.5" />
                <span>{article.reading_time_minutes} min de leitura</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="rounded-xl font-bold text-xs gap-1.5"
            >
              <Share2 className="size-3.5" />
              <span>Compartilhar</span>
            </Button>
          </div>
        </header>

        {/* ── Capa Principal (Imagem ou Vídeo) ── */}
        {article.cover_media_url && (
          <div className="space-y-2">
            <div className="relative aspect-16/9 rounded-3xl overflow-hidden bg-muted shadow-sm">
              {article.cover_media_type === "video" ? (
                <video
                  src={article.cover_media_url}
                  autoPlay
                  controls
                  className="size-full object-cover"
                />
              ) : (
                <img
                  src={article.cover_media_url}
                  alt={article.title}
                  className="size-full object-cover"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Patrocinador Topo / Entrada ── */}
        {primarySponsor && (
          <NewsSponsorBanner
            sponsor={primarySponsor}
            articleId={article.id}
            placementType="news_top"
          />
        )}

        {/* ── Corpo do Artigo / Seções Estruturadas ── */}
        <div className="space-y-6 text-sm sm:text-base leading-relaxed text-foreground/90">
          {article.content_sections && article.content_sections.length > 0 ? (
            article.content_sections.map((section, idx) => {
              // Insere patrocinador no meio do artigo (após o 2º bloco)
              const showMidSponsor = idx === 1 && secondarySponsor;

              return (
                <div key={idx} className="space-y-4">
                  {section.type === "heading" && (
                    <h2 className="text-xl sm:text-2xl font-black text-foreground pt-4 tracking-tight">
                      {String(section.content)}
                    </h2>
                  )}

                  {section.type === "paragraph" && (
                    <p className="leading-relaxed whitespace-pre-line">{String(section.content)}</p>
                  )}

                  {section.type === "quote" && (
                    <blockquote className="my-6 p-5 rounded-2xl bg-muted/30 border-l-4 border-primary text-foreground font-serif italic text-base sm:text-lg flex items-start gap-3">
                      <Quote className="size-6 text-primary shrink-0 opacity-40" />
                      <div>
                        <p>{String(section.content)}</p>
                        {section.caption && (
                          <cite className="block mt-2 text-xs font-sans font-bold text-muted-foreground not-italic">
                            — {section.caption}
                          </cite>
                        )}
                      </div>
                    </blockquote>
                  )}

                  {section.type === "gallery" && Array.isArray(section.content) && (
                    <div className="grid grid-cols-2 gap-3 my-4">
                      {section.content.map((imgUrl, i) => (
                        <div
                          key={i}
                          className="aspect-4/3 rounded-2xl overflow-hidden bg-muted shadow-2xs"
                        >
                          <img
                            src={imgUrl}
                            alt="Galeria"
                            className="size-full object-cover hover:scale-105 transition-transform"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {showMidSponsor && (
                    <NewsSponsorBanner
                      sponsor={secondarySponsor}
                      articleId={article.id}
                      placementType="news_in_article"
                    />
                  )}
                </div>
              );
            })
          ) : (
            <p className="leading-relaxed">
              {article.subtitle || "Matéria completa publicada no portal de notícias."}
            </p>
          )}
        </div>

        {/* ── Tags / Assuntos Relacionados ── */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Comentários Reais & Likes Únicos ── */}
        <NewsCommentsSection articleId={article.id} />

        {/* ── Matérias Relacionadas ── */}
        {related && related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-border/80 space-y-4">
            <h3 className="text-lg font-black text-foreground">Leia Também</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  to="/noticias/$slug"
                  params={{ slug: rel.slug }}
                  className="flex gap-3 p-3 rounded-2xl border border-border/60 bg-card hover-elevate transition-all group"
                >
                  {rel.cover_media_url && (
                    <div className="size-20 rounded-xl overflow-hidden bg-muted shrink-0">
                      <img
                        src={rel.cover_media_url}
                        alt={rel.title}
                        className="size-full object-cover"
                      />
                    </div>
                  )}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-primary">
                      {rel.kicker || rel.category}
                    </span>
                    <h4 className="text-xs font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {rel.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
