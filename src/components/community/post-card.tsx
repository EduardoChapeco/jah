import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  MapPin,
  MoreHorizontal,
  Calendar,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Utensils,
  Navigation,
  Tag,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MuralFeedItem } from "@/services/social.functions";
import { togglePostLike } from "@/services/social.functions";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ContentActionsMenu } from "@/components/common/content-actions-menu";

interface PostCardProps {
  item: MuralFeedItem;
  queryKey?: unknown[];
}

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  return (
    clean.endsWith(".mp4") ||
    clean.endsWith(".webm") ||
    clean.endsWith(".mov") ||
    clean.endsWith(".quicktime") ||
    clean.endsWith(".m4v") ||
    clean.endsWith(".ogg") ||
    clean.includes("video")
  );
}

export function PostCard({ item, queryKey = ["mural-feed"] }: PostCardProps) {
  const qc = useQueryClient();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  const toggleLike = useMutation({
    mutationFn: () => togglePostLike({ data: { post_id: item.id } }),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });
      const prev = qc.getQueryData(queryKey);
      qc.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        const patchItem = (it: MuralFeedItem) =>
          it.id === item.id
            ? {
                ...it,
                user_liked: !it.user_liked,
                likes_count: it.user_liked ? it.likes_count - 1 : it.likes_count + 1,
              }
            : it;
        if (Array.isArray(old)) return old.map(patchItem);
        if (old.pages) {
          return {
            ...old,
            pages: old.pages.map((page: any) => ({
              ...page,
              items: page.items.map(patchItem),
            })),
          };
        }
        return old;
      });
      return { prev };
    },
    onError: (_err: any, _vars: any, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey });
    },
  });

  const authorInitial = item.author.name?.charAt(0)?.toUpperCase() ?? "J";

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: item.author.name,
          text: item.content_text || "Confira este momento na JAH!",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
    }
  };

  const handleToggleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? "Publicação removida dos salvos" : "Publicação salva com sucesso!");
  };

  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-4 sm:p-5 transition-all hover:border-border/80">
      {/* ── 1. Header do Post ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={(item.author.is_store ? "/perfil-da-loja" : `/membro/${item.author.id}`) as any}
            className="shrink-0"
          >
            <Avatar className="size-10 rounded-xl border border-border hover:opacity-90 transition-opacity">
              <AvatarImage src={item.author.avatar_url ?? ""} alt={item.author.name} />
              <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
                {authorInitial}
              </AvatarFallback>
            </Avatar>
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                to={(item.author.is_store ? "/perfil-da-loja" : `/membro/${item.author.id}`) as any}
                className="text-sm font-bold text-foreground truncate hover:text-primary transition-colors"
              >
                {item.author.name}
              </Link>
              {item.author.is_store && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 h-4 font-semibold uppercase"
                >
                  Loja
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{formatRelativeTime(item.created_at)}</span>
              {item.location_name && (
                <>
                  <span>•</span>
                  <Link
                    to="/mapa"
                    className="flex items-center gap-0.5 text-primary hover:underline truncate"
                  >
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">{item.location_name}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <ContentActionsMenu
          entityType="post"
          entityId={item.id}
          isOwner={!!(item.author as any).is_current_user}
          canonicalUrl={`/post/${item.id}`}
          title={item.author.name}
          description={item.content_text || ""}
          mediaUrl={item.media_urls?.[0] || undefined}
        />
      </div>

      {/* ── 2. Conteúdo de Texto ─────────────────────────────────────── */}
      {item.content_text && (
        <p className="text-sm sm:text-base text-foreground whitespace-pre-wrap leading-relaxed mb-3">
          {item.content_text}
        </p>
      )}

      {/* ── 3. Renderização Específica por Tipo de Post ─────────────────── */}

      {/* TIPO: MOMENTO COM ATIVIDADE / ROTA */}
      {item.post_type === "moment" && item.metadata?.activity && (
        <div className="mb-3 p-3 rounded-xl border border-border bg-muted/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-medium">
            <Navigation className="size-4 text-primary" />
            <span>{item.metadata.activity}</span>
          </div>
          {item.metadata.distance && (
            <span className="font-bold text-foreground">{item.metadata.distance} km</span>
          )}
        </div>
      )}

      {/* TIPO: COMIDA & EXPERIÊNCIA (Foto principal + miniaturas) */}
      {item.post_type === "food" && item.media_urls.length > 1 ? (
        <div className="mb-3 grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
          <div className="col-span-2 aspect-square overflow-hidden rounded-lg bg-muted">
            {isVideoUrl(item.media_urls[0]) ? (
              <video
                src={item.media_urls[0]}
                controls
                playsInline
                className="size-full object-cover"
              />
            ) : (
              <img
                src={item.media_urls[0]}
                alt="Prato principal"
                className="size-full object-cover hover:scale-105 transition-transform"
                loading="lazy"
              />
            )}
          </div>
          <div className="flex flex-col gap-2">
            {item.media_urls.slice(1, 3).map((url, idx) => (
              <div key={idx} className="aspect-square overflow-hidden rounded-lg bg-muted">
                {isVideoUrl(url) ? (
                  <video src={url} controls playsInline className="size-full object-cover" />
                ) : (
                  <img
                    src={url}
                    alt={`Detalhe ${idx + 1}`}
                    className="size-full object-cover hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ) : item.post_type === "destination" && item.media_urls.length > 0 ? (
        /* TIPO: DESTINO / LUGAR EDITORIAL */
        <div className="relative mb-3 overflow-hidden rounded-xl border border-border aspect-[16/9] group">
          {isVideoUrl(item.media_urls[0]) ? (
            <video
              src={item.media_urls[0]}
              controls
              playsInline
              className="size-full object-cover"
            />
          ) : (
            <img
              src={item.media_urls[0]}
              alt={item.location_name || "Destino"}
              className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white pointer-events-auto">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                Destino Recomendado
              </span>
              <h4 className="text-lg font-bold leading-tight drop-shadow-md">
                {item.location_name || item.author.name}
              </h4>
            </div>
            <Button asChild size="sm" className="rounded-lg h-7 text-xs font-semibold">
              <Link to="/mapa">Ver no Mapa</Link>
            </Button>
          </div>
        </div>
      ) : item.layout_style === "carousel" && item.media_urls.length > 1 ? (
        /* TIPO: CARROSSEL COM BORDAS DEFINIDAS */
        <div className="relative mb-3 overflow-hidden rounded-xl border border-border bg-black aspect-square sm:aspect-[4/3] group">
          {isVideoUrl(item.media_urls[activeSlide]) ? (
            <video
              src={item.media_urls[activeSlide]}
              controls
              playsInline
              className="size-full object-contain"
            />
          ) : (
            <img
              src={item.media_urls[activeSlide]}
              alt={`Mídia ${activeSlide + 1}`}
              className="size-full object-contain"
              loading="lazy"
            />
          )}

          {/* Botões de Navegação */}
          {activeSlide > 0 && (
            <button
              onClick={() => setActiveSlide((prev) => prev - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}
          {activeSlide < item.media_urls.length - 1 && (
            <button
              onClick={() => setActiveSlide((prev) => prev + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {/* Badge Indicador de Slide */}
          <div className="absolute top-2 right-2 bg-black/70 text-white text-[11px] px-2 py-0.5 rounded-full font-mono">
            {activeSlide + 1}/{item.media_urls.length}
          </div>
        </div>
      ) : item.media_urls.length > 1 ? (
        /* TIPO: GRID DE FOTOS / VÍDEOS (2, 3, 4+) */
        <div className="mb-3 grid grid-cols-2 gap-1.5 overflow-hidden rounded-xl">
          {item.media_urls.slice(0, 4).map((url, idx) => (
            <div
              key={idx}
              className={`${
                item.media_urls.length === 3 && idx === 0
                  ? "col-span-2 aspect-video"
                  : "aspect-square"
              } overflow-hidden bg-muted`}
            >
              {isVideoUrl(url) ? (
                <video src={url} controls playsInline className="size-full object-cover" />
              ) : (
                <img
                  src={url}
                  alt={`Mídia ${idx + 1}`}
                  className="size-full object-cover hover:scale-105 transition-transform"
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      ) : item.media_urls.length === 1 ? (
        /* TIPO: MÍDIA ÚNICA (FOTO OU VÍDEO) */
        <div className="mb-3 overflow-hidden rounded-xl border border-border bg-black">
          {isVideoUrl(item.media_urls[0]) ? (
            <video
              src={item.media_urls[0]}
              controls
              playsInline
              preload="metadata"
              className="w-full max-h-[480px] object-contain"
            />
          ) : (
            <img
              src={item.media_urls[0]}
              alt="Mídia da publicação"
              className="w-full max-h-[480px] object-cover hover:scale-[1.01] transition-transform"
              loading="lazy"
            />
          )}
        </div>
      ) : null}

      {/* ── 4. Cards de Referência / Integração ───────────────────────── */}

      {/* Referência: Produto */}
      {item.reference_data && item.reference_type === "product" && (
        <Link
          to="/mercado"
          className="mb-3 flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
        >
          <div className="size-14 rounded-lg overflow-hidden bg-background border border-border shrink-0">
            {item.reference_data.images?.[0] ? (
              <img
                src={item.reference_data.images[0]}
                alt={item.reference_data.title}
                className="size-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <ShoppingBag className="size-6 text-muted-foreground m-auto mt-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
              Produto da Comunidade
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {item.reference_data.title}
            </p>
            <p className="text-xs font-semibold text-foreground/80 mt-0.5">
              {formatMoney(item.reference_data.price_cents)}
            </p>
          </div>
          <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-1" />
        </Link>
      )}

      {/* Referência: Evento */}
      {item.reference_data && item.reference_type === "event" && (
        <Link
          to="/agenda"
          className="mb-3 flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
        >
          <div className="size-14 rounded-lg bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0">
            <Calendar className="size-6 mb-0.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
              Evento Comunitário
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {item.reference_data.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Ver programação & ingressos</p>
          </div>
          <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-1" />
        </Link>
      )}

      {/* Referência: Classificado / Desapego */}
      {item.reference_data && item.reference_type === "classified" && item.reference_id && (
        <Link
          to={`/classificados/${item.reference_id}` as any}
          className="mb-3 flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors group"
        >
          <div className="size-14 rounded-lg overflow-hidden bg-background border border-border shrink-0 flex items-center justify-center">
            {item.reference_data.images?.[0] ? (
              <img
                src={item.reference_data.images[0]}
                alt={item.reference_data.title}
                className="size-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <Tag className="size-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase text-primary tracking-wider">
              Classificado da Comunidade
            </span>
            <p className="text-sm font-bold text-foreground truncate">
              {item.reference_data.title}
            </p>
            <p className="text-xs font-bold text-foreground/80 mt-0.5">
              {item.reference_data.price_cents
                ? formatMoney(item.reference_data.price_cents)
                : "A Combinar"}
            </p>
          </div>
          <ExternalLink className="size-4 text-muted-foreground group-hover:text-foreground shrink-0 mr-1" />
        </Link>
      )}

      {/* ── 5. Barra de Ações do Post ─────────────────────────────────── */}
      <div className="flex items-center justify-between pt-3 border-t border-border mt-auto text-muted-foreground">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Curtir */}
          <button
            onClick={() => toggleLike.mutate(undefined)}
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              item.user_liked
                ? "text-red-500 bg-red-500/10"
                : "hover:bg-muted hover:text-foreground"
            }`}
            aria-label="Curtir"
          >
            <Heart className={`size-4 ${item.user_liked ? "fill-current" : ""}`} />
            <span>{item.likes_count}</span>
          </button>

          {/* Comentar */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Comentar"
          >
            <MessageSquare className="size-4" />
            <span className="hidden sm:inline">Comentários</span>
          </button>

          {/* Compartilhar */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Compartilhar"
          >
            <Share2 className="size-4" />
          </button>
        </div>

        {/* Salvar */}
        <button
          onClick={handleToggleSave}
          className={`p-1.5 rounded-lg transition-colors ${
            isSaved ? "text-primary bg-primary/10" : "hover:bg-muted hover:text-foreground"
          }`}
          aria-label="Salvar publicação"
        >
          <Bookmark className={`size-4 ${isSaved ? "fill-current" : ""}`} />
        </button>
      </div>
    </article>
  );
}
