import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Sparkle, Users, Camera, Tag, CircleNotch, WarningCircle } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { InlinePostComposer } from "@/components/community/inline-post-composer";
import { PostCard } from "@/components/community/post-card";
import { StoryRail } from "@/components/community/story-rail";
import { getMuralFeed, getFeedStories, type MuralFeedItem } from "@/services/social.functions";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/mural")({
  head: () => ({
    meta: [
      { title: "Feed da Comunidade — JAH" },
      {
        name: "description",
        content: "Explore vivências, fotos, moments da rua e novidades de quem você segue na comunidade.",
      },
    ],
  }),
  loader: async () => {
    const [firstPage, stories, session] = await Promise.all([
      getMuralFeed({ data: { limit: 15 } }).catch(() => ({
        items: [],
        hasMore: false,
        nextCursor: null,
      })),
      getFeedStories().catch(() => []),
      getUserSession().catch(() => null),
    ]);
    return { firstPage, stories, session };
  },
  component: MuralPage,
});

function MuralPage() {
  const { firstPage, stories, session } = Route.useLoaderData();
  const [activeFeedTab, setActiveFeedTab] = useState<"for_you" | "following" | "moments" | "classifieds">(
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
    <div className="w-full max-w-2xl mx-auto space-y-6 pb-24">
      {/* 1. Stories da Comunidade */}
      {stories && stories.length > 0 && (
        <section aria-label="Stories Locais" className="pb-1">
          <StoryRail stories={stories} />
        </section>
      )}

      {/* 2. Composer Inline de Publicação (com proteção para visitantes) */}
      <section aria-label="Criar Publicação">
        <InlinePostComposer session={session} />
      </section>

      {/* 3. Filtros do Feed Social (Squircle Retangular) */}
      <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border">
        <button
          onClick={() => setActiveFeedTab("for_you")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFeedTab === "for_you"
              ? "bg-foreground text-background shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Sparkle size={14} weight="bold" />
          <span>Pra Você</span>
        </button>

        <button
          onClick={() => setActiveFeedTab("following")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFeedTab === "following"
              ? "bg-foreground text-background shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Users size={14} weight="bold" />
          <span>Seguindo</span>
        </button>

        <button
          onClick={() => setActiveFeedTab("moments")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFeedTab === "moments"
              ? "bg-foreground text-background shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Camera size={14} weight="bold" />
          <span>Moments</span>
        </button>

        <button
          onClick={() => setActiveFeedTab("classifieds")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeFeedTab === "classifieds"
              ? "bg-foreground text-background shadow-2xs font-bold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          <Tag size={14} weight="bold" />
          <span>Desapegos</span>
        </button>
      </div>

      {/* 4. Lista do Feed Real do Supabase */}
      <section aria-label="Linha do Tempo" className="space-y-4">
        {filteredItems.map((item) => (
          <PostCard key={item.id} item={item} session={session} />
        ))}

        {/* 5. Estado de Loading Contínuo / Infinito */}
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-6">
            <CircleNotch size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 6. Gatilho de Paginação Manual ou Automática */}
        {hasNextPage && !isFetchingNextPage && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => fetchNextPage()}
              className="rounded-xl font-bold text-xs"
            >
              Carregar mais publicações
            </Button>
          </div>
        )}

        {/* 7. Estado Vazio Honesto */}
        {!isLoading && filteredItems.length === 0 && (
          <div className="py-16 text-center space-y-3 rounded-3xl border border-dashed border-border bg-card/60 p-6">
            <p className="text-sm font-semibold text-foreground">
              Nenhuma publicação encontrada
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Seja o primeiro a compartilhar o que está acontecendo no seu bairro ou desapegar de um item!
            </p>
          </div>
        )}

        {isError && (
          <div className="py-8 text-center space-y-2">
            <WarningCircle size={20} className="text-destructive mx-auto" />
            <p className="text-xs text-destructive">
              Não foi possível carregar as publicações. Tente novamente mais tarde.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
