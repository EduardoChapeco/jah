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
  Layers,
  Scissors,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

import { listUserFavorites, toggleFavorite } from "@/services/favorites.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/_store/conta/salvos")({
  head: () => ({ meta: [{ title: "Meus Itens Salvos & Favoritos | Waesy" }] }),
  loader: async () => {
    try {
      const initialFavorites = await listUserFavorites({
        data: { entityType: "all" as any },
      }).catch(() => []);
      return { initialFavorites: initialFavorites || [] };
    } catch (err) {
      console.error("[loader:_store.conta.salvos] Unhandled error:", err);
      return { initialFavorites: [] };
    }
  },
  component: SavedItemsPage,
});

const TYPE_TABS = [
  { id: "all", label: "Todos os Salvos", icon: Layers },
  { id: "product", label: "Produtos & Serviços", icon: ShoppingBag },
  { id: "classified", label: "Classificados", icon: Tag },
  { id: "event", label: "Eventos", icon: Calendar },
] as const;

function SavedItemsPage() {
  const { initialFavorites } = Route.useLoaderData() as { initialFavorites: any[] };
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>("all");

  const { data: favorites, isLoading } = useQuery({
    queryKey: ["user-favorites", selectedType],
    queryFn: async () => {
      try {
        const res = await listUserFavorites({
          data: {
            entityType: selectedType as any,
          },
        });
        return res || [];
      } catch (err) {
        console.error("[salvos] listUserFavorites error:", err);
        return [];
      }
    },
    initialData: selectedType === "all" ? initialFavorites : undefined,
    retry: 1,
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
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-24 px-4 sm:px-6">
      {/* ── 1. Apple HIG Minimalist Header ── */}
      <div className="flex items-center justify-between gap-4 border-b border-border/40 pb-5 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Salvos & Favoritos
            </h1>
            {favorites && favorites.length > 0 && (
              <Badge variant="secondary" className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                {favorites.length}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Acesse rapidamente seus produtos, serviços, classificados e eventos salvos.
          </p>
        </div>

        <Button
          asChild
          size="default"
          variant="outline"
          className="rounded-2xl h-11 px-5 text-sm font-semibold cursor-pointer"
        >
          <Link to="/mercado">Explorar Vitrines</Link>
        </Button>
      </div>

      {/* ── 2. Segmented Chips de Filtro por Categoria (Apple HIG) ── */}
      <div className="flex flex-wrap gap-2">
        {TYPE_TABS.map((tab) => {
          const isActive = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedType(tab.id)}
              className={`h-11 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? "bg-foreground text-background border-foreground shadow-xs"
                  : "bg-card text-muted-foreground hover:text-foreground border-border/60 hover:border-border"
              }`}
            >
              {tab.icon && <tab.icon className="size-4 shrink-0" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── 3. Grid de Itens Salvos ── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="size-7 animate-spin text-primary" />
          <p className="text-xs font-medium">Carregando seus itens salvos...</p>
        </div>
      ) : favorites && favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
          {favorites.map((fav: any) => {
            const item = fav.details;
            if (!item) return null;

            if (fav.entity_type === "classified") {
              const cover =
                (item.images && item.images.length > 0 ? item.images[0] : null) ||
                (item.media && item.media.length > 0 ? item.media[0] : null);

              return (
                <div
                  key={fav.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/70 shadow-xs hover:border-foreground/20 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                          <Tag className="size-8 stroke-[1.5]" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 text-[10px] uppercase font-bold rounded-full">
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
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-base font-black text-primary font-mono">
                          {item.price_cents ? formatMoney(item.price_cents) : "A Combinar"}
                        </span>
                        {item.location_name && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[130px]">
                            <MapPin className="size-3 text-primary shrink-0" />
                            {item.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 flex items-center justify-between gap-2 border-t border-border/40">
                    <Button
                      asChild
                      size="default"
                      variant="outline"
                      className="rounded-xl text-xs h-11 flex-1 font-semibold cursor-pointer"
                    >
                      <Link to="/classificados/$id" params={{ id: item.id }}>
                        <ExternalLink className="size-3.5 mr-1.5" />
                        <span>Ver Anúncio</span>
                      </Link>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(fav.entity_type, fav.entity_id)}
                      className="rounded-xl size-11 text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            }

            if (fav.entity_type === "product") {
              const isService = item.is_service === true;
              const cover = item.images && item.images.length > 0 ? item.images[0] : null;

              return (
                <div
                  key={fav.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/70 shadow-xs hover:border-foreground/20 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-muted overflow-hidden">
                      {cover ? (
                        <img src={cover} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/60">
                          {isService ? (
                            <Scissors className="size-8 stroke-[1.5]" />
                          ) : (
                            <ShoppingBag className="size-8 stroke-[1.5]" />
                          )}
                        </div>
                      )}
                      <Badge
                        variant={isService ? "default" : "secondary"}
                        className="absolute top-3 left-3 text-[10px] uppercase font-bold rounded-full"
                      >
                        {isService ? "Serviço" : "Produto"}
                      </Badge>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="text-sm font-bold text-foreground line-clamp-1">
                        {item.name}
                      </h3>
                      {isService && item.duration_minutes && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                          <Clock className="size-3 text-primary" />
                          {item.duration_minutes} min
                        </p>
                      )}
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-base font-black text-primary font-mono">
                          {formatMoney(item.price_cents)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 flex items-center justify-between gap-2 border-t border-border/40">
                    {isService ? (
                      <Button
                        asChild
                        size="default"
                        variant="outline"
                        className="rounded-xl text-xs h-11 flex-1 font-semibold cursor-pointer"
                      >
                        <Link to="/agendar/$id" params={{ id: item.id }}>
                          <ExternalLink className="size-3.5 mr-1.5" />
                          <span>Agendar Horário</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        size="default"
                        variant="outline"
                        className="rounded-xl text-xs h-11 flex-1 font-semibold cursor-pointer"
                      >
                        <Link to="/produto/$slug" params={{ slug: item.slug || item.id }}>
                          <ExternalLink className="size-3.5 mr-1.5" />
                          <span>Ver Produto</span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(fav.entity_type, fav.entity_id)}
                      className="rounded-xl size-11 text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            }

            if (fav.entity_type === "event") {
              return (
                <div
                  key={fav.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border/70 shadow-xs hover:border-foreground/20 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-video bg-muted overflow-hidden">
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
                        className="absolute top-3 left-3 text-[10px] uppercase font-bold bg-background rounded-full"
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
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-primary">
                          {new Date(item.event_date).toLocaleDateString("pt-BR")}
                        </span>
                        {item.location_name && (
                          <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[130px]">
                            <MapPin className="size-3 text-primary shrink-0" />
                            {item.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-muted/20 flex items-center justify-between gap-2 border-t border-border/40">
                    <Button
                      asChild
                      size="default"
                      variant="outline"
                      className="rounded-xl text-xs h-11 flex-1 font-semibold cursor-pointer"
                    >
                      <Link to="/evento/$id" params={{ id: item.id }}>
                        <ExternalLink className="size-3.5 mr-1.5" />
                        <span>Ver Ingressos</span>
                      </Link>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemove(fav.entity_type, fav.entity_id)}
                      className="rounded-xl size-11 text-destructive hover:bg-destructive/10 cursor-pointer shrink-0"
                      title="Remover dos salvos"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      ) : (
        <div className="border border-border/70 bg-card rounded-2xl p-12 sm:p-16 text-center space-y-4 shadow-xs">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Bookmark className="size-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h2 className="text-lg font-bold text-foreground">Nenhum item salvo ainda</h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Quando você encontrar um produto, classificado ou evento de seu interesse e clicar em salvar, ele ficará guardado aqui para fácil consulta.
            </p>
          </div>
          <Button asChild size="default" className="rounded-2xl h-11 px-6 text-sm font-bold gap-2 mt-2 shadow-xs cursor-pointer">
            <Link to="/mercado">
              <ShoppingBag className="size-4" />
              <span>Explorar Mercado Local</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
