import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Tag,
  ShoppingBag,
  Calendar,
  MessageSquare,
  Trash2,
  ExternalLink,
  Loader2,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { listUserFavorites, toggleFavorite } from "@/services/favorites.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/_store/conta/salvos")({
  head: () => ({ meta: [{ title: "Meus Itens Salvos & Favoritos — JAH" }] }),
  component: SavedItemsPage,
});

const TYPE_TABS = [
  { id: "all", label: "Todos os Salvos", icon: Sparkles },
  { id: "classified", label: "Classificados", icon: Tag },
  { id: "product", label: "Produtos", icon: ShoppingBag },
  { id: "event", label: "Eventos", icon: Calendar },
] as const;

function SavedItemsPage() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["user-favorites", selectedType],
    queryFn: () =>
      listUserFavorites({
        data: {
          entityType: selectedType as any,
        },
      }),
  });

  const removeMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-favorites"] });
      queryClient.invalidateQueries({ queryKey: ["is-favorited"] });
      toast.success("Item removido dos favoritos.");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao remover item.");
    },
  });

  const handleRemove = (entityType: any, entityId: string) => {
    removeMutation.mutate({
      data: {
        entityType,
        entityId,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Bookmark className="size-5 text-primary" />
            <span>Itens Salvos & Favoritos</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe os anúncios, produtos, eventos e oportunidades que você salvou na comunidade.
          </p>
        </div>
      </div>

      {/* ── Tabs de Filtro por Categoria ────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedType(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedType === tab.id
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
            }`}
          >
            {tab.icon && <tab.icon className="size-3.5" />}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Lista de Favoritos ───────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs">Carregando itens salvos...</p>
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {favorites.map((fav: any) => {
            const item = fav.details;
            if (!item) return null;

            if (fav.entity_type === "classified") {
              const cover = item.images && item.images.length > 0 ? item.images[0] : null;

              return (
                <div
                  key={fav.id}
                  className="border border-border bg-card rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-muted border-b border-border overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                          <Tag className="size-8 stroke-[1.5]" />
                        </div>
                      )}
                      <Badge className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold">
                        Classificado
                      </Badge>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                      <div className="pt-2 flex items-baseline justify-between border-t border-border/60">
                        <span className="text-base font-black text-primary font-mono">
                          {item.price_cents ? formatMoney(item.price_cents) : "A Combinar"}
                        </span>
                        {item.location_name && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
                            <MapPin className="size-3 text-primary shrink-0" />
                            {item.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 flex-1"
                    >
                      <Link to="/classificados/$id" params={{ id: item.id }}>
                        <ExternalLink className="size-3 mr-1.5" />
                        <span>Ver Anúncio</span>
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(fav.entity_type, fav.entity_id)}
                      className="rounded-xl text-xs h-8 px-2.5 text-destructive hover:bg-destructive/10"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }

            if (fav.entity_type === "product") {
              const cover = item.images && item.images.length > 0 ? item.images[0] : null;

              return (
                <div
                  key={fav.id}
                  className="border border-border bg-card rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-muted border-b border-border overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                          <ShoppingBag className="size-8 stroke-[1.5]" />
                        </div>
                      )}
                      <Badge
                        variant="secondary"
                        className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold"
                      >
                        Produto
                      </Badge>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">
                        {item.name}
                      </h3>
                      <div className="pt-2 flex items-baseline justify-between border-t border-border/60">
                        <span className="text-base font-black text-primary font-mono">
                          {formatMoney(item.price_cents)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 flex-1"
                    >
                      <Link to="/produto/$slug" params={{ slug: item.slug }}>
                        <ExternalLink className="size-3 mr-1.5" />
                        <span>Ver Produto</span>
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(fav.entity_type, fav.entity_id)}
                      className="rounded-xl text-xs h-8 px-2.5 text-destructive hover:bg-destructive/10"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }

            if (fav.entity_type === "event") {
              return (
                <div
                  key={fav.id}
                  className="border border-border bg-card rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-muted border-b border-border overflow-hidden">
                      {item.cover_image ? (
                        <img
                          src={item.cover_image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                          <Calendar className="size-8 stroke-[1.5]" />
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold bg-background"
                      >
                        Evento
                      </Badge>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                      <div className="pt-2 flex items-baseline justify-between border-t border-border/60">
                        <span className="text-xs font-semibold text-primary">
                          {new Date(item.event_date).toLocaleDateString("pt-BR")}
                        </span>
                        {item.location_name && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 truncate max-w-[120px]">
                            <MapPin className="size-3 text-primary shrink-0" />
                            {item.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 border-t border-border flex items-center justify-between gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-8 flex-1"
                    >
                      <Link to="/evento/$id" params={{ id: item.id }}>
                        <ExternalLink className="size-3 mr-1.5" />
                        <span>Ver Ingressos</span>
                      </Link>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemove(fav.entity_type, fav.entity_id)}
                      className="rounded-xl text-xs h-8 px-2.5 text-destructive hover:bg-destructive/10"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border bg-card/60 rounded-2xl p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Bookmark className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Nenhum item salvo ainda</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Quando você encontrar um classificado, produto ou evento de seu interesse e clicar em
            "Salvar", ele ficará guardado aqui para fácil acesso.
          </p>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 mt-2">
            <Link to="/mercado">
              <ShoppingBag className="size-4" />
              <span>Explorar Mercado & Mural</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
