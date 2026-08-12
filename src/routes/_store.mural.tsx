import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, ChevronDown, MessageSquare, PenTool } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";
import { getMuralFeed, type MuralFeedItem } from "@/services/social.functions";

export const Route = createFileRoute("/_store/mural")({
  head: () => ({ meta: [{ title: "Mural — JAH Comunidade" }] }),
  // SSR loader: primeira página vem do servidor para que o Google indexe conteúdo real
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
      // Popula a primeira página com os dados do loader SSR (sem segunda fetch)
      initialData: firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
      staleTime: 60_000,
    });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="container max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-10">
      <PageHeader
        eyebrow="Comunidade"
        title="Mural"
        actions={
          <Button
            asChild
            className="bg-primary text-primary-foreground rounded-md font-bold font-mono tracking-wider shadow-sm"
          >
            <Link to="/workspace/mural/novo">
              <PenTool className="size-4 mr-2" />
              Novo Post
            </Link>
          </Button>
        }
      />

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-20">
          <Loader2 className="size-10 animate-spin text-foreground/30" />
        </div>
      )}

      {/* Erro */}
      {isError && (
        <Surface variant="default" padding="lg" className="flex items-center gap-4 text-primary">
          <AlertCircle className="size-8 shrink-0" />
          <div>
            <p className="font-display text-xl uppercase font-bold">Erro ao carregar o Mural</p>
            <p className="font-sans text-muted-foreground text-sm text-foreground/70">
              Tente novamente em instantes.
            </p>
          </div>
        </Surface>
      )}

      {/* Vazio */}
      {!isLoading && !isError && allItems.length === 0 && (
        <div className="relative rotate-1 transition-all duration-300">
          <Surface
            variant="default"
            padding="lg"
            className="text-center py-20 flex flex-col items-center justify-center"
          >
            <div className="size-20 rounded-full border border-border border-dashed flex items-center justify-center mb-6">
              <MessageSquare className="size-10 text-foreground/30" />
            </div>
            <h2 className="font-display text-4xl uppercase tracking-tighter mb-3">Muro Limpo</h2>
            <p className="font-sans text-muted-foreground text-foreground/70 max-w-md mx-auto mb-6">
              O feed está vazio. Seja o primeiro a publicar algo interessante!
            </p>
            <Button
              asChild
              variant="default"
              className="bg-primary text-primary-foreground border border-border shadow-sm"
            >
              <Link to="/workspace/mural/novo">Criar Publicação</Link>
            </Button>
          </Surface>
        </div>
      )}

      {/* Feed */}
      {!isLoading && !isError && allItems.length > 0 && (
        <div className="space-y-6">
          {allItems.map((item: MuralFeedItem) => (
            <PostCard key={item.id} item={item} queryKey={["mural-feed"]} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-8 pb-10">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="border border-border font-mono uppercase text-xs tracking-wider"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <ChevronDown className="size-4 mr-2" />
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
