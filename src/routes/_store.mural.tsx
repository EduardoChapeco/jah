import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  Tag,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Megaphone,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMuralFeed, type MuralFeedItem } from "@/services/social.functions";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";

// ──────────────────────────────────────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────────────────────────────────────

const FilterSchema = z.object({
  tipo: z.enum(["classified", "event", "ad"]).optional(),
  categoria: z.string().optional(),
});

export const Route = createFileRoute("/_store/mural")({
  head: () => ({ meta: [{ title: "Mural — JAH Comunidade" }] }),
  validateSearch: FilterSchema,
  component: MuralPage,
});

// ──────────────────────────────────────────────────────────────────────────────
// Labels
// ──────────────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  job: "Vagas",
  job_offer: "Trabalho",
  sale: "À Venda",
  trade: "Troca",
  service: "Serviço",
  real_estate: "Imóvel",
  vehicle: "Veículo",
  event: "Evento",
  donation: "Doação",
};

const TYPE_FILTER_OPTIONS = [
  { key: undefined, label: "Tudo" },
  { key: "event" as const, label: "Eventos" },
  { key: "classified" as const, label: "Classificados" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Cards por tipo
// ──────────────────────────────────────────────────────────────────────────────

function ClassifiedCard({ item }: { item: Extract<MuralFeedItem, { type: "classified" }> }) {
  return (
    <Surface
      variant="yellow-pages"
      padding="md"
      className="flex flex-col justify-between h-full hover-lift group"
    >
      {/* Imagem — primeiro item do array */}
      {item.images?.[0] && (
        <div className="mb-3 overflow-hidden border-2 border-ink">
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      <div className="flex items-start justify-between mb-2 gap-2">
        <span className="bg-ink text-paper text-xs font-mono uppercase px-2 py-0.5 font-bold shrink-0">
          {CATEGORY_LABELS[item.category] ?? item.category}
        </span>
        <span className="font-mono text-xs text-ink/50 shrink-0">{formatDate(item.created_at)}</span>
      </div>

      <h3 className="font-display text-xl uppercase tracking-tight text-ink mb-2 leading-tight">
        {item.title}
      </h3>

      <p className="font-serif text-sm text-ink/75 line-clamp-3 mb-3 flex-1">{item.content}</p>

      <div className="flex flex-wrap items-center gap-2 border-t-2 border-ink/10 pt-3 mt-auto">
        {item.price_cents !== null && item.price_cents !== undefined ? (
          <span className="font-mono text-base font-bold text-ink">
            {formatMoney(item.price_cents)}
            {item.negotiable && (
              <span className="text-xs font-normal text-ink/50 ml-1">· negociável</span>
            )}
          </span>
        ) : (
          <span className="text-xs text-ink/50 font-mono">À combinar</span>
        )}
        {item.condition && (
          <Badge variant="outline" className="text-xs border-ink/30 text-ink/60 capitalize">
            {item.condition === "new" ? "Novo" : item.condition === "used" ? "Usado" : "Recondicionado"}
          </Badge>
        )}
        {item.location_text && (
          <span className="flex items-center gap-1 text-xs text-ink/50 font-mono ml-auto">
            <MapPin className="size-3" />
            {item.location_text}
          </span>
        )}
      </div>
    </Surface>
  );
}

function EventCard({ item }: { item: Extract<MuralFeedItem, { type: "event" }> }) {
  const eventDate = new Date(item.event_date);
  const day = eventDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  const time = eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link to="/evento/$id" params={{ id: item.id }} className="block group">
      <Surface variant="zine" padding="none" className="flex overflow-hidden hover-lift">
        {/* Data em destaque vertical */}
        <div className="bg-ink text-paper flex flex-col items-center justify-center px-4 py-5 shrink-0 min-w-[72px]">
          <span className="font-mono text-xs uppercase opacity-70">
            {day.split(" ")[1]}
          </span>
          <span className="font-display text-3xl font-black leading-none">
            {day.split(" ")[0]}
          </span>
          <span className="font-mono text-xs opacity-70 mt-1">{time}</span>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 p-4">
          {item.cover_image && (
            <img
              src={item.cover_image}
              alt={item.title}
              className="w-full h-28 object-cover mb-3 border border-ink/10 group-hover:opacity-90 transition-opacity"
            />
          )}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge
              variant="secondary"
              className={`text-xs chip-status ${item.is_free ? "bg-ink text-paper" : "bg-directory-yellow text-ink"}`}
            >
              {item.is_free ? "Gratuito" : "Pago"}
            </Badge>
            {item.tags?.slice(0, 2).map((t) => (
              <Badge key={t} variant="outline" className="text-xs border-ink/30 chip-status">
                {t}
              </Badge>
            ))}
          </div>
          <h3 className="font-display text-lg uppercase tracking-tight text-ink leading-tight mb-1 group-hover:underline">
            {item.title}
          </h3>
          {(item.location || item.address) && (
            <p className="flex items-center gap-1 text-xs text-ink/60 font-mono">
              <MapPin className="size-3 shrink-0" />
              {item.location || item.address}
            </p>
          )}
          {item.description && (
            <p className="text-sm text-ink/70 font-serif line-clamp-2 mt-1">{item.description}</p>
          )}
        </div>
      </Surface>
    </Link>
  );
}

function AdCard({ item }: { item: Extract<MuralFeedItem, { type: "ad" }> }) {
  return (
    <a
      href={item.target_url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Surface variant="flat" padding="md" className="border-2 border-dashed border-ink/20 hover:border-ink/60 transition-colors">
        <div className="flex items-center gap-2 mb-2 text-ink/40">
          <Megaphone className="size-3" />
          <span className="font-mono text-xs uppercase">Anúncio</span>
        </div>
        {item.image_url && (
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-32 object-cover mb-3 rounded-none"
          />
        )}
        <h3 className="font-display text-lg uppercase tracking-tight text-ink leading-tight group-hover:underline">
          {item.title}
        </h3>
        {item.body && (
          <p className="text-sm text-ink/70 font-serif line-clamp-2 mt-1">{item.body}</p>
        )}
        <span className="flex items-center gap-1 text-xs text-ink/50 font-mono mt-2">
          <ExternalLink className="size-3" />
          Saiba mais
        </span>
      </Surface>
    </a>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Feed dispatcher
// ──────────────────────────────────────────────────────────────────────────────

function FeedItemCard({ item }: { item: MuralFeedItem }) {
  if (item.type === "classified") return <ClassifiedCard item={item} />;
  if (item.type === "event") return <EventCard item={item} />;
  if (item.type === "ad") return <AdCard item={item} />;
  return null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────

function MuralPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeType, setActiveType] = useState<"classified" | "event" | "ad" | undefined>(
    search.tipo,
  );

  const types: ("classified" | "event" | "ad")[] = activeType
    ? [activeType]
    : ["classified", "event", "ad"];

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["mural-feed", activeType],
    queryFn: ({ pageParam }) =>
      getMuralFeed({
        data: {
          limit: 18,
          types,
          cursor: pageParam as string | undefined,
        },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    staleTime: 60_000,
  });

  const allItems = data?.pages.flatMap((p) => p.items) ?? [];

  const handleTypeFilter = (tipo: typeof activeType) => {
    setActiveType(tipo);
    navigate({ search: tipo ? { tipo } : {} });
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-20 space-y-10">
      <PageHeader
        eyebrow="Comunidade"
        title="Mural"
        description="Eventos, classificados e serviços da comunidade — tudo em um só lugar."
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 border-b-2 border-ink pb-4">
        {TYPE_FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={label}
            onClick={() => handleTypeFilter(key)}
            className={`border-2 px-3 py-1 font-mono text-xs uppercase font-bold transition-colors ${
              activeType === key
                ? "bg-ink text-paper border-ink"
                : "border-ink text-ink hover:bg-ink hover:text-paper"
            }`}
          >
            {label}
          </button>
        ))}
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
          <Surface variant="zine" padding="lg" className="text-center py-20 flex flex-col items-center justify-center">
            <div className="size-20 rounded-full border-4 border-ink border-dashed flex items-center justify-center mb-6">
              <Tag className="size-10 text-ink/30" />
            </div>
            <h2 className="font-display text-4xl uppercase tracking-tighter mb-3">Muro Vazio</h2>
            <p className="font-serif text-ink/70 max-w-md mx-auto mb-6">
              Nenhum classificado ou evento publicado ainda. Faça login e publique o primeiro!
            </p>
            <Button asChild variant="default" className="bg-ink text-paper border-2 border-ink shadow-hard">
              <Link to="/entrar">Entrar para anunciar</Link>
            </Button>
          </Surface>
        </div>
      )}

      {/* Feed */}
      {!isLoading && !isError && allItems.length > 0 && (
        <>
          {/* Layout misto: eventos ocupam linha inteira, classificados em grid 3 colunas */}
          <div className="space-y-4">
            {allItems.map((item) =>
              item.type === "event" ? (
                <div key={`${item.type}-${item.id}`} className="max-w-2xl">
                  <FeedItemCard item={item} />
                </div>
              ) : item.type === "ad" ? (
                <div key={`${item.type}-${item.id}`} className="max-w-md">
                  <FeedItemCard item={item} />
                </div>
              ) : null,
            )}
          </div>

          {/* Classificados em grid */}
          {allItems.some((i) => i.type === "classified") && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allItems
                .filter((i) => i.type === "classified")
                .map((item) => (
                  <FeedItemCard key={`${item.type}-${item.id}`} item={item} />
                ))}
            </div>
          )}

          {/* Load more */}
          {hasNextPage && (
            <div className="flex justify-center pt-4">
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
                Ver mais
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
