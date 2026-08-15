import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Loader2, AlertCircle, Ticket, Sparkles } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { getPublicEvents } from "@/services/events.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/_store/agenda")({
  head: () => ({ meta: [{ title: "Agenda Cultural — JAH" }] }),
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
  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-events"],
    queryFn: () => getPublicEvents({ data: { limit: 50 } }),
    staleTime: 60_000,
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

      {!isLoading && !isError && events?.length === 0 && (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <Calendar className="size-10 text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Nenhum evento agendado para os próximos dias
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Seja o primeiro a cadastrar um show, feira ou evento para a comunidade!
          </p>
        </div>
      )}

      {!isLoading && !isError && events && events.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs group hover:border-primary/50 transition-colors"
            >
              {/* Cover */}
              <div className="aspect-video relative overflow-hidden bg-muted flex flex-col justify-end p-4 border-b border-border">
                {event.cover_image && (
                  <img
                    src={event.cover_image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                <div className="relative z-10">
                  <span className="bg-background/90 backdrop-blur-xs text-foreground text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-border inline-block mb-2">
                    {formatDate(event.event_date)}
                  </span>
                  <h3 className="text-xl font-bold text-foreground leading-tight drop-shadow-xs">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between">
                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                )}
                <div className="pt-3 border-t border-border/40">
                  <Button
                    asChild
                    size="sm"
                    className="w-full rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
                  >
                    <Link to="/evento/$id" params={{ id: event.id }}>
                      <Ticket className="size-3.5" />
                      <span>Ver Ingressos & Detalhes</span>
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
