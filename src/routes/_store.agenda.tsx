import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2, AlertCircle, Ticket, MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getPublicEvents } from "@/services/events.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { formatDate } from "@/lib/datetime";

const EVENT_CATEGORIES = [
  { id: "todos", label: "Todos os Eventos" },
  { id: "shows", label: "Shows & Festivais" },
  { id: "gastronomico", label: "Gastronomia & Feiras" },
  { id: "feiras", label: "Bazaares & Pets" },
  { id: "workshops", label: "Cursos & Workshops" },
];

export const Route = createFileRoute("/_store/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda Cultural & Shows — JAH" },
      {
        name: "description",
        content: "Descubra os principais shows, festivais gastronômicos, feiras e workshops da cidade.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages] = await Promise.all([
      listActiveBanners({ data: { placement: "agenda" } }).catch(() => []),
      listHotpages({ data: { module: "agenda" } }).catch(() => []),
    ]);
    return { banners, hotpages };
  },
  component: AgendaPage,
});

function AgendaPage() {
  const { banners, hotpages } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-events", selectedCategory],
    queryFn: () =>
      getPublicEvents({
        data: {
          limit: 50,
          category: selectedCategory === "todos" ? undefined : selectedCategory,
        },
      }),
    staleTime: 60_000,
  });

  const filteredEvents = (events || []).filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-6">
      {/* ── Top Universal Banner Hero ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── Hotpages & Categorias ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias">
          <HotpagesRail hotpages={hotpages} />
        </section>
      )}

      {/* ── Barra Superior de Filtros & Busca ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider bg-foreground text-background">
            Agenda Cultural
          </span>
          <span className="text-xs text-muted-foreground">Programação Oficial</span>
        </div>

        {/* Busca de Eventos */}
        <div className="flex gap-2 w-full sm:w-72">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por show, local..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-10 bg-background border-border text-xs"
            />
          </div>
        </div>
      </div>

      {/* ── Chips de Categorias de Eventos (Scroll Invisível & Contraste Seguro) ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
        {EVENT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors border cursor-pointer ${
                isSelected
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-2">
          <AlertCircle className="size-6 text-destructive mx-auto" />
          <p className="font-semibold text-foreground text-sm">Erro ao carregar a Agenda Cultural</p>
        </div>
      )}

      {!isLoading && !isError && filteredEvents.length === 0 && (
        <div className="py-20 text-center space-y-2 bg-muted/20 rounded-2xl border border-border p-8">
          <Calendar className="size-8 text-muted-foreground/50 mx-auto" />
          <h2 className="text-sm font-semibold text-foreground">
            Nenhum evento encontrado nesta categoria
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outra categoria ou buscar por outro termo.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:border-foreground/20 transition-colors"
            >
              {/* Cover Image */}
              <div className="aspect-16/10 relative overflow-hidden bg-muted">
                {event.cover_image && (
                  <img
                    src={event.cover_image}
                    alt={event.title}
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2.5 py-1 rounded-lg border border-white/20">
                    {formatDate(event.event_date)}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-semibold text-white leading-tight drop-shadow-xs line-clamp-2">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between text-xs">
                <div className="space-y-1.5">
                  {event.location && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}

                  {event.description && (
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Badge variant={event.is_free ? "secondary" : "outline"} className="text-[10px]">
                    {event.is_free ? "Gratuito" : "Ingresso Pago"}
                  </Badge>

                  <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                    <Link to="/evento/$id" params={{ id: event.id }}>
                      <span>Detalhes</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
