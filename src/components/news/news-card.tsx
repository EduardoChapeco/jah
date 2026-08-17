import { Link } from "@tanstack/react-router";
import { Clock, Eye, ArrowRight, Share2, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type NewsArticleDTO } from "@/services/news.functions";
import { toast } from "sonner";

export interface NewsCardProps {
  article: NewsArticleDTO;
  compact?: boolean;
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/noticias/${article.slug}`);
      toast.success("Link da notícia copiado!");
    }
  };

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      })
    : "Recente";

  return (
    <article className="group relative flex flex-col rounded-2xl border border-border/70 bg-card overflow-hidden shadow-xs hover-elevate transition-all duration-300">
      {/* ── 1. Imagem / Vídeo Full Bleed ── */}
      <Link
        to="/noticias/$slug"
        params={{ slug: article.slug }}
        className="relative aspect-16/10 w-full overflow-hidden bg-muted block"
      >
        {article.cover_media_url ? (
          article.cover_media_type === "video" ? (
            <video
              src={article.cover_media_url}
              autoPlay
              muted
              loop
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <img
              src={article.cover_media_url}
              alt={article.title}
              loading="lazy"
              className="size-full object-cover group-hover:scale-104 transition-transform duration-500"
            />
          )
        ) : (
          <div className="size-full flex items-center justify-center bg-muted/40 text-muted-foreground">
            <Newspaper className="size-10 opacity-30" />
          </div>
        )}

        {/* Badges Flutuantes sobre a Imagem */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {article.kicker ? (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-white border border-white/10 shadow-xs">
              {article.kicker}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 shadow-xs border border-white/10">
              <Clock className="size-2.5" />
              {article.reading_time_minutes || 3} min
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="size-7 rounded-full bg-black/70 backdrop-blur-md text-white hover:bg-black/90 border border-white/10 shadow-xs"
              title="Compartilhar notícia"
            >
              <Share2 className="size-3" />
            </Button>
          </div>
        </div>
      </Link>

      {/* ── 2. Conteúdo Editorial Conciso ── */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          {/* Autor & Data */}
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {article.store_avatar && (
              <img
                src={article.store_avatar}
                alt={article.store_name || "Autor"}
                className="size-4 rounded-full object-cover"
              />
            )}
            <span className="font-semibold text-foreground truncate max-w-[140px]">
              {article.store_name || article.author_name || "Redação"}
            </span>
            <span>•</span>
            <span>{formattedDate}</span>
          </div>

          {/* Título Principal */}
          <Link
            to="/noticias/$slug"
            params={{ slug: article.slug }}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="text-base font-bold tracking-tight text-foreground leading-snug line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* Subtítulo / Descrição Curta (1 a 2 linhas) */}
          {article.subtitle && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {article.subtitle}
            </p>
          )}
        </div>

        {/* ── 3. Rodapé ── */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Eye className="size-3.5 opacity-60" />
            <span>{article.views_count || 0} leituras</span>
          </div>

          <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-xs font-bold gap-1 group/btn hover:text-primary">
            <Link to="/noticias/$slug" params={{ slug: article.slug }}>
              <span>Ler Matéria</span>
              <ArrowRight className="size-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
