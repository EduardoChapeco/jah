import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, AlertCircle, Sparkles, Flame, Tag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlinePostComposer } from "@/components/community/inline-post-composer";
import { PostCard } from "@/components/community/post-card";
import { StoryRail } from "@/components/community/story-rail";
import { getMuralFeed, getFeedStories, type MuralFeedItem } from "@/services/social.functions";

export const Route = createFileRoute("/_store/mural")({
  head: () => ({
    meta: [
      { title: "Mural da Comunidade — JAH" },
      {
        name: "description",
        content: "Compartilhe vivências, fotos, moments da rua e converse com a sua comunidade.",
      },
    ],
  }),
  loader: async () => {
    const [firstPage, stories] = await Promise.all([
      getMuralFeed({ data: { limit: 15 } }).catch(() => ({
        items: [],
        hasMore: false,
        nextCursor: null,
      })),
      getFeedStories().catch(() => []),
    ]);
    return { firstPage, stories };
  },
  component: MuralPage,
});

function MuralPage() {
  const { firstPage, stories } = Route.useLoaderData();
  const [activeFeedTab, setActiveFeedTab] = useState<"for_you" | "moments" | "classifieds">(
    "for_you",
  );

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["mural-feed"],
      queryFn: ({ pageParam }) =>
        getMuralFeed({ data: { limit: 15, cursor: pageParam as string | undefined } }),
      initialPageParam: undefined as string | undefined,
      initialData: firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
      staleTime: 30_000,
    });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const filteredItems = allItems.filter((item: MuralFeedItem) => {
    if (activeFeedTab === "moments") {
      return (item.media_urls && item.media_urls.length > 0) || item.location_name;
    }
    if (activeFeedTab === "classifieds") {
      return item.reference_type === "classified";
    }
    return true;
  });

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 pb-24">
      {/* 1. Stories da Comunidade */}
      {stories && stories.length > 0 && (
        <section aria-label="Stories Locais">
          <StoryRail stories={stories} />
        </section>
      )}

      {/* 2. Composer Inline de Publicação */}
      <section aria-label="Criar Publicação">
        <InlinePostComposer />
      </section>

      {/* 3. Filtros do Feed Social */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/50 rounded-2xl border border-border/60">
        <button
          onClick={() => setActiveFeedTab("for_you")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeFeedTab === "for_you"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="size-3.5" />
          <span>Para Você</span>
        </button>

        <button
          onClick={() => setActiveFeedTab("moments")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeFeedTab === "moments"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className="size-3.5" />
          <span>Moments da Rua</span>
        </button>

        <button
          onClick={() => setActiveFeedTab("classifieds")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
            activeFeedTab === "classifieds"
              ? "bg-card text-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tag className="size-3.5" />
          <span>Desapegos</span>
        </button>
      </div>

      {/* 4. Stream de Posts */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground/40" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
          <AlertCircle className="size-5 shrink-0" />
          <div>
            <p className="font-medium">Não foi possível carregar as publicações do mural.</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              Verifique sua conexão e tente novamente.
            </p>
          </div>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-3xl p-8 bg-card">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-bold text-foreground">Nenhuma publicação nesta aba ainda.</p>
          <p className="text-xs text-muted-foreground max-w-sm">
            Seja o primeiro a compartilhar uma foto, momento cultural ou desapego com a comunidade.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredItems.length > 0 && (
        <div className="space-y-4">
          {filteredItems.map((item: MuralFeedItem) => (
            <PostCard key={item.id} item={item} queryKey={["mural-feed"]} />
          ))}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="rounded-2xl text-xs font-bold"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="size-3.5 animate-spin mr-2" />
                ) : (
                  "Carregar mais publicações"
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
