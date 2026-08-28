import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Sparkle, Users, Camera, Tag, CircleNotch, WarningCircle, Plus } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { InlinePostComposer } from "@/components/community/inline-post-composer";
import { PostCreationDrawer } from "@/components/community/post-creation-drawer";
import { PostCard } from "@/components/community/post-card";
import { ThreadsFeedCard } from "@/components/social/threads-feed-card";
import { MomentsStatusPicker } from "@/components/social/moments-status-picker";
import { StoryRail } from "@/components/community/story-rail";
import { getMuralFeed, getFeedStories, type MuralFeedItem } from "@/services/social.functions";
import { getUserSession } from "@/services/auth.functions";

export const Route = createFileRoute("/_store/mural")({
  head: () => ({
    meta: [
      { title: "Feed da Comunidade — Wider" },
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
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [isMomentsPickerOpen, setIsMomentsPickerOpen] = useState(false);
  const [userStatus, setUserStatus] = useState<any>(null);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ["mural-feed"],
      queryFn: ({ pageParam }) =>
        getMuralFeed({ data: { limit: 15, cursor: pageParam as string | undefined } }),
      initialPageParam: undefined as string | undefined,
      initialData: firstPage ? { pages: [firstPage], pageParams: [undefined] } : undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
      staleTime: 0,
      refetchOnWindowFocus: true,
    });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const filteredItems = allItems.filter((item: MuralFeedItem) => {
    if (activeFeedTab === "moments") {
      return (item.media_urls && item.media_urls.length > 0) || item.location_name;
    }
    if (activeFeedTab === "classifieds") {
      return item.reference_type === "classified" || item.post_type === "classified";
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. Stories da Comunidade */}
      {stories && stories.length > 0 && (
        <section aria-label="Stories Locais" className="pb-1">
          <StoryRail stories={stories} />
        </section>
      )}

      {/* 2. Composer Inline de Publicação (Apenas Desktop — no Mobile o post é criado via Action Button/Drawer) */}
      <section aria-label="Criar Publicação" className="hidden sm:block">
        <InlinePostComposer session={session} />
      </section>

      {/* Post Creation Drawer Fullscreen */}
      <PostCreationDrawer
        open={isCreateDrawerOpen}
        onOpenChange={setIsCreateDrawerOpen}
        session={session}
      />

      {/* Modal de Status & Moments */}
      <MomentsStatusPicker
        open={isMomentsPickerOpen}
        onOpenChange={setIsMomentsPickerOpen}
        currentStatus={userStatus}
        onSave={(newSt) => setUserStatus(newSt)}
      />

      {/* 3. Filtros do Feed Social — Segmented Tabs estilo Apple / Threads */}
      <div className="sticky top-0 z-30 -mx-3 sm:mx-0 px-3 sm:px-0 py-2.5 bg-background/95 backdrop-blur-md border-b sm:border-none border-border/40 flex items-center justify-between gap-3">
        <div className="flex-1 max-w-lg flex items-center gap-1 p-1 bg-muted/60 rounded-2xl border border-border/40">
          <button
            onClick={() => setActiveFeedTab("for_you")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeFeedTab === "for_you"
                ? "bg-card text-foreground border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Sparkle size={14} weight={activeFeedTab === "for_you" ? "fill" : "bold"} className={activeFeedTab === "for_you" ? "text-primary" : ""} />
            <span>Pra Você</span>
          </button>

          <button
            onClick={() => setActiveFeedTab("following")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeFeedTab === "following"
                ? "bg-card text-foreground border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Users size={14} weight={activeFeedTab === "following" ? "fill" : "bold"} className={activeFeedTab === "following" ? "text-primary" : ""} />
            <span>Seguindo</span>
          </button>

          <button
            onClick={() => setActiveFeedTab("moments")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeFeedTab === "moments"
                ? "bg-card text-foreground border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Camera size={14} weight={activeFeedTab === "moments" ? "fill" : "bold"} className={activeFeedTab === "moments" ? "text-primary" : ""} />
            <span>Moments</span>
          </button>

          <button
            onClick={() => setActiveFeedTab("classifieds")}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              activeFeedTab === "classifieds"
                ? "bg-card text-foreground border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Tag size={14} weight={activeFeedTab === "classifieds" ? "fill" : "bold"} className={activeFeedTab === "classifieds" ? "text-primary" : ""} />
            <span>Desapegos</span>
          </button>
        </div>

        {/* Botão Definir Momento / Status Rápido */}
        <Button
          size="sm"
          variant="outline"
          className="h-10 px-3.5 rounded-2xl text-xs font-bold gap-1.5 shrink-0 cursor-pointer border-border/60 bg-card hover:bg-muted"
          onClick={() => setIsMomentsPickerOpen(true)}
          title="Definir seu status / humor atual no mapa e feed"
        >
          <span>{userStatus?.emoji || "⚡"}</span>
          <span className="hidden md:inline">{userStatus?.text || "Momento"}</span>
        </Button>
      </div>

      {/* 4. Lista do Feed Real do Supabase */}
      <section aria-label="Linha do Tempo" className="space-y-4">
        {filteredItems.map((item: any) => (
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
          <div className="py-16 text-center space-y-3 rounded-3xl border-0 bg-card/60 p-6">
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
