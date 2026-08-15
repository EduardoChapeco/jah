import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  Eye,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Share2,
  Newspaper,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { type NewsArticleDTO } from "@/services/news.functions";
import { toast } from "sonner";

export interface NewsCardProps {
  article: NewsArticleDTO;
  compact?: boolean;
}

export function NewsCard({ article, compact = false }: NewsCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <article className="group relative flex flex-col rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs hover-elevate transition-all duration-300">
      {/* ── 1. Header do Portal / Jornal ── */}
      <div className="p-4 pb-3 flex items-center justify-between gap-3 border-b border-border/40">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            {article.store_avatar ? (
              <img
                src={article.store_avatar}
                alt={article.store_name}
                className="size-full rounded-full object-cover"
              />
            ) : (
              <Newspaper className="size-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-foreground truncate">
              {article.store_name || "Portal de Notícias"}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {article.author_name ? `Por ${article.author_name} · ` : ""}
              {formattedDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {article.kicker && (
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              {article.kicker}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShare}
            className="size-7 rounded-full text-muted-foreground hover:text-foreground"
            title="Compartilhar notícia"
          >
            <Share2 className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* ── 2. Imagem / Vídeo de Capa ── */}
      {article.cover_media_url && (
        <Link
          to="/noticias/$slug"
          params={{ slug: article.slug }}
          className="relative aspect-16/9 w-full overflow-hidden bg-muted block"
        >
          {article.cover_media_type === "video" ? (
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
              className="size-full object-cover group-hover:scale-103 transition-transform duration-500"
            />
          )}
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono text-white flex items-center gap-1 shadow-xs">
            <Clock className="size-3" />
            <span>{article.reading_time_minutes} min</span>
          </div>
        </Link>
      )}

      {/* ── 3. Conteúdo Principal ── */}
      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
        <div className="space-y-1.5">
          <Link
            to="/noticias/$slug"
            params={{ slug: article.slug }}
            className="block group-hover:text-primary transition-colors"
          >
            <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground leading-snug line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {/* Subtítulo / Lead com expansão inline estilo WhatsApp */}
          {article.subtitle && (
            <div className="text-xs text-muted-foreground leading-relaxed">
              <p className={isExpanded ? "" : "line-clamp-2"}>{article.subtitle}</p>
              {article.subtitle.length > 90 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                >
                  <span>{isExpanded ? "Recolher resumo" : "Ver mais (resumo)"}</span>
                  {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── 4. Rodapé & Ações ── */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              <span>{article.views_count} lidas</span>
            </span>
          </div>

          <Button asChild size="sm" className="rounded-xl font-bold gap-1.5 text-xs">
            <Link to="/noticias/$slug" params={{ slug: article.slug }}>
              <span>Ler Matéria</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
