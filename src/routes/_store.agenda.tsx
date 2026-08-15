import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2, AlertCircle, Ticket, MapPin, Search, Sparkles, Clock } from "lucide-react";
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
    <div className="w-full space-y-8">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground">
            Agenda Cultural
          </span>
          <span className="text-xs text-muted-foreground font-mono">Programação Oficial</span>
        </div>

        {/* Busca de Eventos */}
        <div className="flex gap-2 w-full sm:w-72">
          <Input
            placeholder="Buscar por show, local..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-2xl h-10 bg-card text-xs"
          />
          <Button size="icon" className="h-10 w-10 rounded-2xl shrink-0 font-bold">
            <Search className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── Chips de Categorias de Eventos ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        {EVENT_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-xs scale-105"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {isError && (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="font-bold text-foreground text-sm">Erro ao carregar a Agenda Cultural</p>
        </div>
      )}

      {!isLoading && !isError && filteredEvents.length === 0 && (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <Calendar className="size-10 text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Nenhum evento encontrado nesta categoria
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outra categoria ou buscar por outro termo.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs group hover-elevate transition-all"
            >
              {/* Cover Image */}
              <div className="aspect-16/10 relative overflow-hidden bg-muted">
                {event.cover_image && (
                  <img
                    src={event.cover_image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold px-3 py-1 rounded-full border border-white/20">
                    {formatDate(event.event_date)}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg font-black text-white leading-tight drop-shadow-md line-clamp-2">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                <div className="space-y-2.5">
                  {event.location && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}

                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-foreground bg-muted px-2.5 py-1 rounded-xl">
                    {(event as any).ticket_price || "Entrada Franca"}
                  </span>

                  <Button
                    asChild
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground px-4"
                  >
                    <Link to="/evento/$id" params={{ id: event.id }}>
                      <Ticket className="size-3.5" />
                      <span>Ingressos & Detalhes</span>
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
