import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, MapPin, Loader2, AlertCircle, Ticket } from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Surface } from "@/components/ui/surface";
import { Button } from "@/components/ui/button";
import { getPublicEvents } from "@/services/events.functions";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/_store/agenda")({
  head: () => ({ meta: [{ title: "Agenda Cultural" }] }),
  component: AgendaPage,
});

function AgendaPage() {
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
    <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
      <PageHeader eyebrow="Eventos" title="Agenda Cultural" />

      {isLoading && (
        <div className="flex justify-center py-20 mt-10">
          <Loader2 className="size-10 animate-spin text-foreground/30" />
        </div>
      )}

      {isError && (
        <div className="mt-12 flex justify-center">
          <Surface
            variant="default"
            padding="lg"
            className="flex items-center gap-4 text-primary max-w-xl w-full"
          >
            <AlertCircle className="size-8 shrink-0" />
            <div>
              <p className="font-display text-xl uppercase font-bold">Erro ao carregar a Agenda</p>
              <p className="font-sans text-muted-foreground text-sm text-foreground/70">
                Tente novamente em instantes.
              </p>
            </div>
          </Surface>
        </div>
      )}

      {!isLoading && !isError && events?.length === 0 && (
        <div className="mt-12 flex justify-center">
          <Surface
            variant="default"
            padding="lg"
            className="text-center py-20 flex flex-col items-center justify-center max-w-2xl w-full"
          >
            <div className="bg-primary/10 p-6 rounded-full border border-border border-dashed mb-6">
              <Calendar className="size-12 text-foreground/50" />
            </div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider mb-2">
              Nenhum Evento Próximo
            </h2>
            <p className="font-sans text-muted-foreground text-foreground/70">
              No momento a agenda está sem novidades. Volte em breve para conferir os próximos
              eventos da comunidade!
            </p>
          </Surface>
        </div>
      )}

      {!isLoading && !isError && events && events.length > 0 && (
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Surface
              key={event.id}
              variant="default"
              padding="none"
              className="flex flex-col overflow-hidden group"
            >
              {/* Cover */}
              <div className="bg-primary aspect-video relative overflow-hidden flex flex-col justify-end p-4 border-b border-border">
                {event.cover_image ? (
                  <img
                    src={event.cover_image}
                    alt={event.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen grayscale group-hover:opacity-70 transition-opacity duration-300"
                  />
                ) : (
                  <div className="absolute inset-0 opacity-20 mix-blend-overlay" />
                )}
                <div className="relative z-10">
                  <span className="bg-secondary text-foreground text-xs font-mono font-bold px-3 py-1 border border-border inline-block mb-2 shadow-sm">
                    {formatDate(event.event_date)}
                  </span>
                  <h3 className="font-display text-3xl text-primary-foreground leading-none uppercase">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex flex-col gap-3 flex-1">
                {event.location && (
                  <p className="flex items-center gap-2 font-mono text-xs text-foreground/60 uppercase">
                    <MapPin className="size-4 shrink-0" />
                    {event.location}
                  </p>
                )}
                {event.description && (
                  <p className="font-sans text-muted-foreground text-foreground/80 text-sm line-clamp-3">
                    {event.description}
                  </p>
                )}
                <div className="mt-auto pt-3 border-t border-border/10">
                  <Button
                    asChild
                    variant="default"
                    className="w-full border border-border bg-primary text-foreground hover:bg-primary/80 shadow-sm"
                  >
                    <Link to="/evento/$id" params={{ id: event.id }}>
                      <Ticket className="size-4 mr-2" />
                      Ver Ingressos
                    </Link>
                  </Button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
