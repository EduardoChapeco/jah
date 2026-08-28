import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import {
  Compass,
  MapPin,
  CalendarDots,
  Users,
  WhatsappLogo,
  ShieldCheck,
  Printer,
  ShareNetwork,
  ArrowLeft,
  QrCode,
  Ticket,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Info,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { listCustomerTrips, type TourismBookingDTO } from "@/services/tourism.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/conta/viagens")({
  head: () => ({
    meta: [
      { title: "Minhas Viagens & Vouchers — Wider" },
      { name: "description", content: "Consulte seus vouchers, reservas de turismo e passeios confirmados." },
    ],
  }),
  loader: async () => {
    const trips = await listCustomerTrips().catch(() => []);
    return { trips };
  },
  component: CustomerTripsPage,
});

function CustomerTripsPage() {
  const { trips } = Route.useLoaderData();
  const [selectedBooking, setSelectedBooking] = useState<TourismBookingDTO | null>(null);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  const handleOpenVoucher = (booking: TourismBookingDTO) => {
    setSelectedBooking(booking);
    setIsVoucherOpen(true);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleShare = (code: string) => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(`Voucher JAH Turismo: ${code}`);
      toast.success("Código do voucher copiado!");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-6 px-4 sm:px-0">
      {/* ── Breadcrumb & Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div>
          <Link
            to="/conta"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft size={14} weight="bold" />
            <span>Voltar para Minha Conta</span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2.5">
            <Compass size={28} weight="bold" className="text-primary" />
            <span>Minhas Viagens & Vouchers</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Acompanhe seus passeios, diárias em cabanas e roteiros de aventura adquiridos no Wider.
          </p>
        </div>

        <Button asChild className="rounded-xl font-bold text-xs gap-2 bg-foreground text-background ">
          <Link to="/turismo">
            <Compass size={16} weight="bold" />
            <span>Explorar Mais Passeios</span>
          </Link>
        </Button>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl  bg-card ">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <Ticket size={16} weight="bold" className="text-primary" />
            <span>Total de Reservas</span>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">{trips.length}</p>
        </div>

        <div className="p-4 rounded-2xl  bg-card ">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <CheckCircle size={16} weight="bold" className="text-emerald-500" />
            <span>Vouchers Ativos</span>
          </div>
          <p className="text-2xl font-black text-foreground mt-2">
            {trips.filter((t) => t.status === "confirmed").length}
          </p>
        </div>

        <div className="p-4 rounded-2xl  bg-card  col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold">
            <ShieldCheck size={16} weight="bold" className="text-primary" />
            <span>Garantia JAH</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-medium">
            Embarque 100% verificado e suporte direto com o anfitrião.
          </p>
        </div>
      </div>

      {/* ── Lista de Viagens & Vouchers ── */}
      {trips.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl  bg-card  space-y-4">
          <div className="size-16 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
            <Compass size={32} weight="bold" className="text-primary" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Nenhuma viagem reservada ainda</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Você ainda não possui vouchers de passeios, hospedagens ou experiências turísticas emitidos.
            </p>
          </div>
          <Button asChild className="rounded-xl font-bold text-xs bg-foreground text-background">
            <Link to="/turismo">
              <Compass size={16} weight="bold" className="mr-1.5" />
              <span>Ver Roteiros Disponíveis</span>
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {trips.map((booking) => {
            const exp = booking.experience;
            const formattedDate = booking.desired_date
              ? new Date(booking.desired_date).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Data a combinar";

            const cleanWhatsapp = exp?.contact_whatsapp?.replace(/\D/g, "") || "";
            // whatsappUrl removido: usado trackAndOpenWhatsApp para rastreamento real

            return (
              <div
                key={booking.id}
                className="p-5 sm:p-6 rounded-3xl  bg-card  flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:border-foreground/20 transition-all"
              >
                <div className="flex gap-4 items-start">
                  {exp?.image_url ? (
                    <img
                      src={exp.image_url}
                      alt={exp.title}
                      className="size-20 sm:size-24 rounded-2xl object-cover  shrink-0"
                    />
                  ) : (
                    <div className="size-20 sm:size-24 rounded-2xl bg-muted flex items-center justify-center shrink-0 ">
                      <Compass size={28} className="text-muted-foreground" />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono font-bold bg-muted/60">
                        {booking.voucher_code}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-bold ${
                          booking.status === "confirmed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {booking.status === "confirmed" ? "● Confirmado" : "● Em Análise"}
                      </Badge>
                    </div>

                    <h3 className="text-base font-bold text-foreground line-clamp-1">
                      {exp?.title || "Experiência Turística"}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <CalendarDots size={14} weight="bold" />
                        <span>{formattedDate}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} weight="bold" />
                        <span>{booking.guests_count} participante(s)</span>
                      </span>
                      {booking.total_price_cents > 0 && (
                        <span className="font-bold text-foreground">
                          {formatMoney(booking.total_price_cents)}
                        </span>
                      )}
                    </div>

                    {exp?.location && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <MapPin size={12} weight="bold" />
                        <span className="line-clamp-1">{exp.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-border">
                  <Button
                    onClick={() => handleOpenVoucher(booking)}
                    className="flex-1 md:flex-initial rounded-xl font-bold text-xs gap-1.5 h-10 bg-foreground text-background "
                  >
                    <QrCode size={16} weight="bold" />
                    <span>Ver Voucher Digital</span>
                  </Button>

                  {cleanWhatsapp && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        trackAndOpenWhatsApp({
                          phone: cleanWhatsapp,
                          storeId: (exp as any)?.store_id || null,
                          entityType: "tourism",
                          entityId: exp?.id || null,
                          entityTitle: exp?.title || "Experiência Turística",
                          niche: "turismo",
                          customMessage: `Olá! Tenho uma reserva confirmada com o voucher *${booking.voucher_code}* para *${exp?.title}*. Queria confirmar os detalhes.`,
                        })
                      }
                      className="flex-1 md:flex-initial rounded-xl font-bold text-xs gap-1.5 h-10 border-border cursor-pointer"
                    >
                      <WhatsappLogo size={16} weight="bold" className="text-emerald-500" />
                      <span>Falar com Guia</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Canônico de Voucher Digital (Padrão TravelAgencias / JAH) ── */}
      <Dialog open={isVoucherOpen} onOpenChange={setIsVoucherOpen}>
        <DialogContent className="sm:max-w-lg sm:rounded-3xl p-5 sm:p-8 bg-card border-border">
          {selectedBooking && (
            <div className="space-y-6">
              {/* Header do Voucher */}
              <div className="text-center pb-4  space-y-2">
                <Badge variant="outline" className="text-xs font-mono font-black px-3 py-1 bg-muted">
                  VOUCHER DIGITAL OFICIAL
                </Badge>
                <h2 className="text-xl font-black text-foreground">
                  {selectedBooking.experience?.title || "Experiência Turística"}
                </h2>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>CÓDIGO:</span>
                  <span className="font-black text-foreground text-sm bg-primary/10 px-2 py-0.5 rounded-md">
                    {selectedBooking.voucher_code}
                  </span>
                </div>
              </div>

              {/* Detalhes do Roteiro */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-muted/40  space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Data do Passeio
                  </span>
                  <p className="font-bold text-foreground">
                    {selectedBooking.desired_date
                      ? new Date(selectedBooking.desired_date).toLocaleDateString("pt-BR")
                      : "A combinar"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40  space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Passageiros
                  </span>
                  <p className="font-bold text-foreground">{selectedBooking.guests_count} pessoa(s)</p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40  space-y-1 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Ponto de Encontro / Local
                  </span>
                  <p className="font-bold text-foreground">
                    {selectedBooking.meeting_point || selectedBooking.experience?.location || "Consulte o anfitrião"}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-muted/40  space-y-1 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Titular da Reserva
                  </span>
                  <p className="font-bold text-foreground">
                    {selectedBooking.customer_name} ({selectedBooking.customer_phone})
                  </p>
                </div>
              </div>

              {/* Informações de Embarque & Validação */}
              <div className="p-4 rounded-2xl  bg-muted/20 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Info size={16} weight="bold" className="text-primary" />
                  <span>Instruções para o Embarque</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Apresente este voucher digital no smartphone ou impresso no momento da chegada ao ponto de encontro junto com um documento oficial com foto.
                </p>
              </div>

              {/* Ações do Voucher */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  className="flex-1 rounded-xl font-bold text-xs gap-2 h-11"
                >
                  <Printer size={16} weight="bold" />
                  <span>Imprimir / Salvar PDF</span>
                </Button>

                <Button
                  onClick={() => handleShare(selectedBooking.voucher_code)}
                  className="flex-1 rounded-xl font-bold text-xs gap-2 h-11 bg-foreground text-background"
                >
                  <ShareNetwork size={16} weight="bold" />
                  <span>Copiar Código</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
