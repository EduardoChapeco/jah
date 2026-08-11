/**
 * PostCard — Componente canonico do Feed da Comunidade JAH.
 *
 * Uso compartilhado por:
 *   - _store.index.tsx (Home / Feed principal)
 *   - _store.mural.tsx  (Rota /mural)
 *
 * Regras:
 *   - Usa apenas tokens de src/styles.css via Tailwind.
 *   - Timestamps relativos via formatRelativeTime (AGENTS.md).
 *   - Mutations passam por Server Functions (BFF); nunca Supabase direto.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageSquare, Share2, MoreHorizontal, ShoppingBag, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { MuralFeedItem } from "@/services/social.functions";
import { togglePostLike } from "@/services/social.functions";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";

interface PostCardProps {
  item: MuralFeedItem;
  /** queryKey a ser invalidado apos curtir/descurtir. Default: ["mural-feed"] */
  queryKey?: unknown[];
}

export function PostCard({ item, queryKey = ["mural-feed"] }: PostCardProps) {
  const qc = useQueryClient();

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

  const authorInitial = item.author.name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <Surface variant="zine" padding="md" className="flex flex-col hover-lift group">
      {/* Header: Autor + Timestamp */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar className="h-10 w-10 border-2 border-ink rounded-none shrink-0">
          <AvatarImage src={item.author.avatar_url ?? ""} alt={item.author.name} />
          <AvatarFallback className="font-mono bg-paper text-ink font-bold text-sm">
            {authorInitial}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-ink leading-none font-display text-base uppercase truncate flex items-center gap-2">
            {item.author.name}
            {item.author.is_store && (
              <Badge
                variant="default"
                className="text-[10px] bg-ink text-paper rounded-none px-1 py-0 leading-tight font-mono"
              >
                LOJA
              </Badge>
            )}
          </p>
          <p className="text-xs font-mono text-ink/50 mt-0.5">
            {formatRelativeTime(item.created_at)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-ink/40 hover:text-ink hover:bg-ink/10 shrink-0"
          aria-label="Mais opcoes"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      {/* Conteudo de texto */}
      {item.content_text && (
        <p className="font-serif text-ink mb-4 whitespace-pre-wrap leading-relaxed">
          {item.content_text}
        </p>
      )}

      {/* Midia principal */}
      {item.media_urls.length > 0 && (
        <div className="mb-4 -mx-4 md:mx-0 border-y-2 md:border-2 border-ink bg-black overflow-hidden">
          <img
            src={item.media_urls[0]}
            className="w-full max-h-96 object-contain"
            alt="Midia do post"
            loading="lazy"
          />
        </div>
      )}

      {/* Referencia: Produto */}
      {!item.media_urls.length && item.reference_data && item.reference_type === "product" && (
        <div className="mb-4 border-2 border-ink p-3 flex gap-4 items-center bg-paper/50 hover:bg-paper transition-colors cursor-pointer group/ref">
          <div className="size-16 bg-ink/10 shrink-0 border border-ink overflow-hidden">
            {item.reference_data.images?.[0] ? (
              <img
                src={item.reference_data.images[0]}
                className="w-full h-full object-cover group-hover/ref:scale-110 transition-transform"
                alt={item.reference_data.title}
              />
            ) : (
              <ShoppingBag className="size-6 text-ink/30 m-auto mt-5" />
            )}
          </div>
          <div className="min-w-0">
            <Badge variant="outline" className="mb-1 text-[10px] font-mono">PRODUTO</Badge>
            <p className="font-bold uppercase font-display leading-tight truncate">{item.reference_data.title}</p>
            <p className="font-mono text-sm text-ink/70">{formatMoney(item.reference_data.price_cents)}</p>
          </div>
        </div>
      )}

      {/* Referencia: Evento */}
      {!item.media_urls.length && item.reference_data && item.reference_type === "event" && (
        <div className="mb-4 border-2 border-ink p-3 flex gap-4 items-center bg-paper/50 hover:bg-paper transition-colors cursor-pointer group/ref">
          <div className="size-16 bg-ink text-paper shrink-0 flex flex-col items-center justify-center">
            <Calendar className="size-6 mb-1 opacity-80" />
          </div>
          <div className="min-w-0">
            <Badge variant="outline" className="mb-1 text-[10px] font-mono">EVENTO</Badge>
            <p className="font-bold uppercase font-display leading-tight truncate">{item.reference_data.title}</p>
            <p className="font-mono text-sm opacity-70">Ver detalhes</p>
          </div>
        </div>
      )}

      {/* Acoes */}
      <div className="flex items-center gap-4 pt-3 border-t border-ink/10 mt-auto">
        <button
          onClick={() => toggleLike.mutate(undefined)}
          disabled={toggleLike.isPending}
          aria-label={item.user_liked ? "Descurtir" : "Curtir"}
          className={`flex items-center gap-1.5 text-sm font-mono transition-colors disabled:opacity-50 ${item.user_liked ? "text-poster-red" : "text-ink/60 hover:text-ink"}`}
        >
          <Heart className={`size-5 ${item.user_liked ? "fill-current" : ""}`} />
          <span className="font-bold tabular-nums">{item.likes_count}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-mono text-ink/60 hover:text-ink transition-colors" aria-label="Comentar">
          <MessageSquare className="size-5" />
          <span className="font-bold">Comentar</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-mono text-ink/60 hover:text-ink ml-auto transition-colors" aria-label="Compartilhar">
          <Share2 className="size-5" />
        </button>
      </div>
    </Surface>
  );
}
