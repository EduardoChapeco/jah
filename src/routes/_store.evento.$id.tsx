import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Ticket, AlertCircle, ArrowLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/services/cart.functions";
import { getEventWithLots } from "@/services/events.functions";
import { ContentActionsMenu } from "@/components/common/content-actions-menu";

export const Route = createFileRoute("/_store/evento/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.event?.title
          ? `${loaderData.event.title} - Ingressos | JAH`
          : "Evento | JAH",
      },
      {
        name: "description",
        content:
          loaderData?.event?.description?.slice(0, 160) || "Evento cultural na comunidade JAH.",
      },
    ],
  }),
  loader: async ({ params }: { params: { id: string } }) => {
    return await getEventWithLots({ data: { eventId: params.id } }).catch(() => null);
  },
  component: EventDetailPage,
});

function EventDetailPage() {
  const data = Route.useLoaderData();
  const event = data?.event;
  const lots = data?.lots || [];
  const router = useRouter();

  if (!event) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-4">
          <AlertCircle className="size-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Evento não encontrado</h2>
        <p className="text-sm text-muted-foreground mt-2">
          O evento que você procura não existe ou foi cancelado.
        </p>
        <Button asChild className="mt-6 rounded-xl" variant="outline">
          <Link to="/agenda">
            <ArrowLeft className="size-4 mr-2" />
            Voltar para a Agenda
          </Link>
        </Button>
      </div>
    );
  }

  const handleBuyTicket = async (lot: any) => {
    try {
      await addToCart({
        data: {
          variantId: lot.id,
          quantity: 1,
        },
      });
      toast.success("Ingresso adicionado ao carrinho!");
      router.navigate({ to: "/carrinho" });
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : String(err)) || "Erro ao adicionar ingresso.",
      );
    }
  };

  const activeLots = lots.filter((l: any) => l.status === "active");

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12 space-y-10">
      {/* Hero Section */}
      <div className="space-y-6">
        {event.cover_image && (
          <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden border border-border rounded-2xl bg-muted shadow-sm">
            <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs font-semibold rounded-full gap-1.5"
              >
                <Calendar className="size-3.5" />
                {new Date(event.event_date).toLocaleString("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </Badge>
              {event.location_name && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold rounded-full gap-1.5"
                >
                  <MapPin className="size-3.5 text-primary" />
                  {event.location_name}
                </Badge>
              )}
            </div>

            <ContentActionsMenu
              entityType="event"
              entityId={event.id}
              isOwner={false}
              canonicalUrl={`/evento/${event.id}`}
              title={event.title}
              description={event.description || ""}
              mediaUrl={event.cover_image}
            />
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-base text-foreground/80 max-w-3xl leading-relaxed whitespace-pre-wrap pt-2">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Tickets Section */}
      <div className="border-t border-border pt-10">
        <div className="flex items-center gap-3 mb-6">
          <Ticket className="size-6 text-primary" />
          <h2 className="text-2xl font-bold text-foreground tracking-tight">
            Ingressos Disponíveis
          </h2>
        </div>

        {activeLots.length === 0 ? (
          <div className="bg-card p-8 text-center border border-dashed border-border rounded-2xl">
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum lote de ingressos disponível no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLots.map((lot: any) => {
              const available = lot.capacity - (lot.sold_count + lot.reserved_count);
              const isSoldOut = available <= 0;

              return (
                <div
                  key={lot.id}
                  className={`p-6 border rounded-2xl transition-all ${
                    isSoldOut
                      ? "border-border bg-muted/30 opacity-70"
                      : "border-border bg-card hover:border-primary/50 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-foreground">{lot.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {isSoldOut ? "Esgotado" : `Restam ${available} ingressos`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary">
                        {formatMoney(lot.price_cents)}
                      </p>
                    </div>
                  </div>

                  <Button
                    className="w-full font-bold h-12 text-sm rounded-xl"
                    variant={isSoldOut ? "secondary" : "default"}
                    disabled={isSoldOut}
                    onClick={() => handleBuyTicket(lot)}
                  >
                    {isSoldOut ? "Esgotado" : "Comprar Ingresso"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
