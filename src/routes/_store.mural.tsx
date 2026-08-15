import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ChevronDown, MessageSquare, PenSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";
import { getMuralFeed, type MuralFeedItem } from "@/services/social.functions";

export const Route = createFileRoute("/_store/mural")({
  head: () => ({ meta: [{ title: "Mural — JAH" }] }),
  loader: async () => {
    const firstPage = await getMuralFeed({ data: { limit: 18 } });
    return { firstPage };
  },
  component: MuralPage,
});

function MuralPage() {
  const { firstPage } = Route.useLoaderData();
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["mural-feed"],
      queryFn: ({ pageParam }) =>
        getMuralFeed({ data: { limit: 18, cursor: pageParam as string | undefined } }),
      initialPageParam: undefined as string | undefined,
      initialData: firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
      staleTime: 60_000,
    });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-24">
      {/* Barra de ação compacta — sem título editorial */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border py-3 flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-muted-foreground">Feed</span>
        <Button size="sm" variant="default" onClick={() => alert("Modal de publicação em breve")}>
          <PenSquare className="size-4 mr-2" />
          Publicar
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground/40" />
        </div>
      )}

      {/* Erro real — não converte em empty state */}
      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Não foi possível carregar o feed.</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
        </div>
      )}

      {/* Empty state simples — sem cartaz, sem retórica */}
      {!isLoading && !isError && allItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhuma publicação ainda.</p>
          <Button size="sm" variant="outline" onClick={() => alert("Modal de publicação em breve")}>
            Criar primeira publicação
          </Button>
        </div>
      )}

      {/* Feed */}
      {!isLoading && !isError && allItems.length > 0 && (
        <div className="space-y-4">
          {allItems.map((item: MuralFeedItem) => (
            <PostCard key={item.id} item={item} queryKey={["mural-feed"]} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="text-muted-foreground text-xs"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="size-3 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="size-3 mr-2" />
                )}
                Carregar mais
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
