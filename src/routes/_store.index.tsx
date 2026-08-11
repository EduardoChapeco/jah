import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { PostCard } from "@/components/community/post-card";
import { PublishSheet } from "@/components/commerce/publish-sheet";
import { getMuralFeed, type MuralFeedItem } from "@/services/social.functions";

export const Route = createFileRoute("/_store/")(
{
  head: () => ({ meta: [{ title: "JAH Comunidade" }] }),
  // SSR loader: primeira pagina vem do servidor (SEO + performance)
  loader: async () => {
    const firstPage = await getMuralFeed({ data: { limit: 20 } });
    return { firstPage };
  },
  component: Home,
}
);

function Home() {
  const { firstPage } = Route.useLoaderData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length >= 2) {
      navigate({ to: "/buscar", search: { q } });
    }
  };

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["mural-feed"],
    queryFn: ({ pageParam }) =>
      getMuralFeed({ data: { limit: 20, cursor: pageParam as string | undefined } }),
    initialPageParam: undefined as string | undefined,
    initialData: firstPage
      ? { pages: [firstPage], pageParams: [undefined] }
      : undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 60_000,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-background bg-noise pb-20">
      {/* Barra de busca — form funcional, navega para /buscar */}
      <form
        onSubmit={handleSearch}
        className="sticky top-0 z-30 bg-secondary px-4 py-4 border-b-4 border-ink shadow-md flex items-center gap-3"
      >
        <div className="flex-1 flex items-center bg-paper border-4 border-ink shadow-hard px-4 py-3 hover-lift">
          <Search className="size-6 text-ink mr-3 shrink-0" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(e as any)}
            placeholder="BUSCAR EVENTOS, CLASSIFICADOS, MERCADORIAS..."
            className="bg-transparent border-none outline-none w-full text-ink placeholder:text-ink/50 font-mono text-sm md:text-base font-bold uppercase tracking-wider"
          />
        </div>
        {/* Botão de localização → Diretório */}
        <Link to="/diretorio">
          <Button
            type="button"
            variant="default"
            size="icon"
            title="Explorar Diretório"
            className="shrink-0 w-14 h-14 bg-directory-yellow text-ink hover:bg-directory-yellow/90"
          >
            <MapPin className="size-6" />
          </Button>
        </Link>
      </form>

      <div className="p-4 md:p-8 space-y-10 max-w-2xl mx-auto w-full mt-4">
        {/* Cabecalho do Mural */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b-4 border-ink pb-6">
          <h1 className="text-display text-5xl md:text-7xl text-ink leading-none">
            MURAL DA <br />
            <span className="text-poster-red">COMUNIDADE</span>
          </h1>
          <PublishSheet />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="size-10 animate-spin text-ink/30" />
          </div>
        )}

        {/* Erro */}
        {isError && (
          <Surface variant="zine" padding="lg" className="flex items-center gap-4 text-poster-red">
            <AlertCircle className="size-8 shrink-0" />
            <div>
              <p className="font-display text-xl uppercase font-bold">Erro ao carregar o Mural</p>
              <p className="font-serif text-sm text-ink/70">Tente novamente em instantes.</p>
            </div>
          </Surface>
        )}

        {/* Vazio */}
        {!isLoading && !isError && allItems.length === 0 && (
          <div className="relative rotate-1 hover:rotate-0 transition-all duration-300">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-32 h-10 bg-paper/80 backdrop-blur-sm border-2 border-ink/20 -rotate-3 z-10 shadow-sm" />
            <Surface
              variant="zine"
              padding="lg"
              className="text-center relative bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]"
            >
              <div className="absolute -right-6 -top-6 rotate-12">
                <div className="stamp-badge text-2xl px-4 py-2 border-4 shadow-hard">VAZIO</div>
              </div>
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="size-24 rounded-full border-4 border-ink border-dashed flex items-center justify-center mb-6">
                  <MessageSquare className="size-10 text-ink/40" />
                </div>
                <h2 className="font-display text-4xl mb-3 uppercase tracking-tighter">
                  O Silencio das Ruas
                </h2>
                <p className="font-serif text-lg text-ink/80 max-w-md mx-auto mb-8">
                  Nenhuma publicacao encontrada. Seja o primeiro a colar um cartaz, anunciar uma mercadoria ou divulgar um evento.
                </p>
                <Button asChild className="bg-ink text-paper text-lg border-2 border-ink shadow-hard">
                  <Link to="/entrar">Entrar para publicar</Link>
                </Button>
              </div>
            </Surface>
          </div>
        )}

        {/* Feed de Posts */}
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
                  className="border-2 border-ink font-mono uppercase text-xs tracking-wider"
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
    </div>
  );
}
