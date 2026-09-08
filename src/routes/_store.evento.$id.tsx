import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
 CalendarBlank,
 Ticket,
 WarningCircle,
 ArrowLeft,
 MapPin,
 ShareNetwork,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import { addToCart } from "@/services/cart.functions";
import { getEventWithLots } from "@/services/events.functions";
import { ContentActionsMenu } from "@/components/common/content-actions-menu";

export const Route = createFileRoute("/_store/evento/$id")({
 head: ({ loaderData }) => ({
 meta: [
 {
 title: loaderData?.event?.title
 ? `${loaderData.event.title} - Ingressos | Wider`
 : "Evento | Wider OS",
 },
 {
 name: "description",
 content:
 loaderData?.event?.description?.slice(0, 160) || "Evento cultural na Comunidade Wider.",
 },
 ],
 }),
 loader: async ({ params }: { params: { id: string } }) => {
   try {
 return await getEventWithLots({ data: { eventId: params.id } }).catch(() => null);
   } catch (err) {
     console.error("[loader:_store.evento.$id] Unhandled loader error:", err);
     return null;
   }
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
 <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
 <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
 <WarningCircle size={32} />
 </div>
 <h2 className="text-2xl font-bold text-foreground">Evento não encontrado</h2>
 <p className="text-sm text-muted-foreground max-w-md mx-auto">
 O evento que você procura não existe ou foi cancelado pelo organizador.
 </p>
 <Button asChild className="rounded-xl font-bold" variant="outline">
 <Link to="/agenda">
 <ArrowLeft size={16} weight="bold" className="mr-2" />
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
    <div className="w-full max-w-6xl mx-auto px-1 sm:px-2 py-1 sm:py-3 space-y-6 pb-28 lg:pb-12">
      {/* ── Breadcrumb / Voltar ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/agenda"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para Agenda</span>
        </Link>
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

      {/* ── Grid Principal Split: Esquerda (Mídia & Info) / Direita (Ingressos) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Esquerda: Banner & Detalhes */}
        <div className="lg:col-span-7 space-y-6">
          {event.cover_image && (
            <div className="w-full aspect-video md:aspect-[16/9] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-xs">
              <img src={event.cover_image} alt={event.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="secondary"
                className="px-3 py-1 text-xs font-semibold rounded-xl gap-1.5"
              >
                <CalendarBlank size={14} weight="bold" />
                {new Date(event.event_date).toLocaleString("pt-BR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })}
              </Badge>
              {event.location_name && (
                <Badge
                  variant="outline"
                  className="px-3 py-1 text-xs font-semibold rounded-xl gap-1.5"
                >
                  <MapPin size={14} weight="bold" className="text-foreground" />
                  {event.location_name}
                </Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              {event.title}
            </h1>

            {event.description && (
              <div className="pt-2 border-t border-border/40 space-y-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Sobre o Evento</h2>
                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
                  {event.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Ingressos (Sticky no Desktop) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
          <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-border/40">
              <Ticket size={20} weight="bold" className="text-primary" />
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Ingressos Disponíveis
              </h2>
            </div>

            {activeLots.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-muted/30 border border-border/40">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  Nenhum lote de ingressos disponível no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeLots.map((lot: any) => {
                  const available = lot.capacity - (lot.sold_count + lot.reserved_count);
                  const isSoldOut = available <= 0;

                  return (
                    <div
                      key={lot.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isSoldOut
                          ? "border-border/40 bg-muted/20 opacity-70"
                          : "border-border/80 bg-background hover:border-primary/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <div>
                          <h3 className="font-bold text-sm sm:text-base text-foreground">{lot.name}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {isSoldOut ? "Esgotado" : `Restam ${available} ingressos`}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg sm:text-xl font-black text-primary">
                            {formatMoney(lot.price_cents)}
                          </p>
                        </div>
                      </div>

                      <Button
                        className="w-full font-bold h-11 text-xs rounded-xl"
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
      </div>
    </div>
  );
}
