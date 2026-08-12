// @ts-nocheck
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { PageHeader } from "@/components/commerce/page-header";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { addToCart } from "@/services/cart.functions";
import { getEventWithLots } from "@/services/events.functions";

// @ts-ignore
export const Route = createFileRoute("/_store/evento/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData ? `${loaderData.event.title} - Ingressos` : "Evento não encontrado" },
      { name: "description", content: loaderData?.event.description?.slice(0, 160) || "" },
    ],
  }),
  loader: async ({ params }: { params: { id: string } }) => {
    return await getEventWithLots({ data: { eventId: params.id } });
  },
  component: EventDetailPage,
});

function EventDetailPage() {
  const { event, lots } = Route.useLoaderData();
  const router = useRouter();

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Evento não encontrado</h2>
        <p className="text-muted-foreground mb-6">
          O evento que você procura não existe ou foi cancelado.
        </p>
        <Button asChild>
          <Link to="/">Voltar para o Início</Link>
        </Button>
      </div>
    );
  }

  const handleBuyTicket = async (lot: any) => {
    try {
      // Treat the ticket lot as a virtual product in the cart
      // We pass the lot ID as the variantId
      await addToCart({
        data: {
          variantId: lot.id, // Using lot ID as variantId
          quantity: 1,
        },
      });
      toast.success("Ingresso adicionado ao carrinho!");
      router.navigate({ to: "/carrinho" });
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : String(err)) || "Erro ao adicionar ingresso.");
    }
  };

  const activeLots = lots.filter((l: any) => l.status === "active");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 md:px-6 space-y-12">
      {/* Hero Section */}
      <div className="space-y-6">
        {event.cover_image && (
          <div className="w-full aspect-video md:aspect-[21/9] overflow-hidden border bg-muted">
            <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">
              <Calendar className="mr-1.5 h-4 w-4" />
              {new Date(event.event_date).toLocaleString("pt-BR", {
                dateStyle: "long",
                timeStyle: "short",
              })}
            </Badge>
            {event.location && (
              <Badge variant="outline" className="px-3 py-1 text-sm font-medium">
                <MapPin className="mr-1.5 h-4 w-4" />
                {event.location}
              </Badge>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            {event.title}
          </h1>
          {event.description && (
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          )}
        </div>
      </div>

      {/* Tickets Section */}
      <div className="border-t pt-10">
        <div className="flex items-center gap-3 mb-6">
          <Ticket className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Ingressos</h2>
        </div>

        {activeLots.length === 0 ? (
          <div className="bg-muted/50 p-8 text-center border border-dashed">
            <p className="text-lg font-medium text-muted-foreground">
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
                  className={`p-6 border transition-all ${isSoldOut ? "border-border bg-muted/30 opacity-70" : "border-primary/20 bg-card hover:border-primary/50 shadow-sm"}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl">{lot.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
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
                    className="w-full font-bold h-12 text-lg"
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
