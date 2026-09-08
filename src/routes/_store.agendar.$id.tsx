import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Clock,
  CalendarDots,
  ArrowLeft,
  Storefront,
  CheckCircle,
  WarningCircle,
  Sparkle,
  ShieldCheck,
  Phone,
  User,
  CaretRight,
  CircleNotch,
  Ticket,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  getBookingServiceById,
  getAvailableSlots,
  createAppointment,
  listMyPassesForService,
} from "@/services/booking.functions";
import { ContentActionsMenu } from "@/components/common/content-actions-menu";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/agendar/$id")({
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.title
          ? `${loaderData.title} | Agendamentos Wider`
          : "Serviço | Wider OS",
      },
      {
        name: "description",
        content:
          loaderData?.description?.slice(0, 160) ||
          "Agende horários online com profissionais qualificados.",
      },
    ],
  }),
  loader: async ({ params }: { params: { id: string } }) => {
    try {
      return await getBookingServiceById({ data: { id: params.id } });
    } catch (err) {
      console.error("[loader:_store.agendar.$id] Unhandled loader error:", err);
      return null;
    }
  },
  component: ServiceDetailPage,
});

const CATEGORY_LABELS: Record<string, string> = {
  barbearia: "Barbearia",
  salao_cabelo: "Salão & Cabelo",
  unhas_manicure: "Unhas & Manicure",
  estetica_massagem: "Estética & Massagem",
  saude_fisioterapia: "Saúde & Fisioterapia",
  pet_shop: "Pet Shop & Banho",
  personal_fitness: "Personal & Aulas",
};

function ServiceDetailPage() {
  const service = Route.useLoaderData();
  const queryClient = useQueryClient();

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!service) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center space-y-4">
        <div className="inline-flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-2">
          <WarningCircle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Serviço não encontrado</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          O serviço solicitado não está disponível ou foi arquivado pelo estabelecimento.
        </p>
        <Button asChild className="rounded-xl font-bold" variant="outline">
          <Link to="/agendar">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Voltar para Serviços & Agendamentos
          </Link>
        </Button>
      </div>
    );
  }

  // 1. Horários disponíveis para a data selecionada
  const { data: slotsResult, isLoading: isLoadingSlots } = useQuery({
    queryKey: ["service-slots", service.id, selectedDate],
    queryFn: () => getAvailableSlots({ data: { service_id: service.id, date: selectedDate } }),
    enabled: isBookingOpen && !!service.id && !!selectedDate,
  });

  const slots = slotsResult?.data || [];

  // 2. Passes de sessões do usuário
  const { data: activePasses } = useQuery({
    queryKey: ["my-service-passes", service.id],
    queryFn: () => listMyPassesForService({ data: { service_id: service.id } }),
    enabled: isBookingOpen && !!service.id,
  });

  const appointmentMutation = useMutation({
    mutationFn: () => {
      const scheduledIso = selectedSlot
        ? selectedSlot
        : new Date(selectedDate + "T14:00:00.000Z").toISOString();

      return createAppointment({
        data: {
          service_id: service.id,
          guest_name: guestName,
          guest_phone: guestPhone,
          scheduled_at: scheduledIso,
          notes: notes || undefined,
          pass_id: selectedPassId || undefined,
        },
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success(
        selectedPassId
          ? "Agendamento confirmado usando seu pacote de sessões!"
          : "Horário reservado com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["my-service-passes"] });
      queryClient.invalidateQueries({ queryKey: ["service-slots", service.id, selectedDate] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao agendar horário.");
    },
  });

  const handleStartBooking = () => {
    setIsBookingOpen(true);
    setIsSuccess(false);
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      toast.error("Preencha seu nome e telefone WhatsApp para confirmação.");
      return;
    }
    if (!selectedSlot && slots.length > 0) {
      toast.error("Selecione um horário disponível para o agendamento.");
      return;
    }
    appointmentMutation.mutate();
  };

  const categoryLabel = CATEGORY_LABELS[service.category] || service.category || "Geral";
  const store = service.stores;

  // Próximos 7 dias para seleção rápida
  const nextDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().split("T")[0];
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase();
    const dayNum = d.getDate();
    return { iso, weekday, dayNum, isToday: i === 0 };
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8 space-y-6 pb-28 lg:pb-12">
      {/* ── Breadcrumb / Voltar ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/agendar"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={16} weight="bold" className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para Serviços & Agendamentos</span>
        </Link>
        <ContentActionsMenu
          entityType="product"
          entityId={service.id}
          isOwner={false}
          canonicalUrl={`/agendar/${service.id}`}
          title={service.title}
          description={service.description || ""}
          mediaUrl={service.image_url}
        />
      </div>

      {/* ── Layout Split BigTech (2 Colunas no Desktop) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna Principal: Galeria + Detalhes (col-span-7 ou col-span-8) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Banner / Foto Imersiva */}
          <div className="aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-muted relative shadow-sm border border-border/40">
            {service.image_url ? (
              <img
                src={service.image_url}
                alt={service.title}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center bg-muted/60 text-muted-foreground">
                <Storefront size={48} />
              </div>
            )}
            <div className="absolute top-3 left-3 flex items-center gap-2">
              <Badge className="bg-background/90 text-foreground backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl shadow-sm border border-border/50">
                {categoryLabel}
              </Badge>
              {service.duration_minutes && (
                <Badge variant="secondary" className="backdrop-blur-md text-xs font-mono font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                  <Clock size={13} weight="bold" />
                  <span>{service.duration_minutes} min</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Cabeçalho do Serviço */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight leading-snug">
              {service.title}
            </h1>

            {/* Estabelecimento Parceiro */}
            {store && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/60">
                <div className="size-11 rounded-xl bg-muted overflow-hidden shrink-0 border border-border/40">
                  {store.avatar_url || store.logo_url ? (
                    <img
                      src={store.avatar_url || store.logo_url}
                      alt={store.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="size-full flex items-center justify-center text-muted-foreground font-bold">
                      {store.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-foreground truncate">{store.name}</span>
                    <ShieldCheck size={16} weight="fill" className="text-emerald-500 shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {store.settings?.address?.city || store.settings?.address_city || "Atendimento no estabelecimento"}
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold shrink-0">
                  <Link to="/loja/$slug" params={{ slug: store.slug || store.id }}>
                    Ver Loja
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Descrição Completa */}
          {service.description && (
            <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-2">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Sparkle size={16} className="text-primary" />
                <span>Sobre este serviço</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {service.description}
              </p>
            </div>
          )}

          {/* Pacotes de Sessões Disponíveis */}
          {service.packages && service.packages.length > 0 && (
            <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Ticket size={16} className="text-primary" />
                  <span>Pacotes & Planos de Sessões com Desconto</span>
                </h2>
                <Badge variant="secondary" className="text-[10px] font-mono font-bold">
                  Economia garantida
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {service.packages.map((pkg: any) => (
                  <div
                    key={pkg.id}
                    className="p-3.5 rounded-xl border border-border/60 bg-muted/20 flex flex-col justify-between gap-2"
                  >
                    <div>
                      <h3 className="font-bold text-xs text-foreground">{pkg.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {pkg.credits_count} sessões inclusas ({pkg.validity_days} dias de validade)
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40">
                      <span className="font-mono font-bold text-sm text-foreground">
                        {formatMoney(pkg.price_cents)}
                      </span>
                      <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg font-bold">
                        Adquirir Pacote
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Lateral: Box de Agendamento Desktop (col-span-5) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border/60 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-semibold text-muted-foreground block">Preço do Serviço</span>
              <div className="text-3xl font-black font-mono text-foreground mt-1">
                {formatMoney(service.price_cents)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <Clock size={14} className="text-primary" />
                <span>Duração estimada de {service.duration_minutes || 60} minutos</span>
              </p>
            </div>

            <div className="pt-4 border-t border-border/50 space-y-3">
              <Button
                size="lg"
                onClick={handleStartBooking}
                className="w-full h-12 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                <CalendarDots size={18} weight="bold" className="mr-2" />
                Agendar Horário Agora
              </Button>

              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                Confirmação em tempo real com o estabelecimento. Sem cobranças antecipadas obrigatórias.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra Flutuante Mobile (Thumb Zone) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3.5 bg-background/95 backdrop-blur-md border-t border-border/60 z-30 flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="text-[10px] text-muted-foreground font-semibold block">Total</span>
          <span className="text-lg font-black font-mono text-foreground">
            {formatMoney(service.price_cents)}
          </span>
        </div>
        <Button
          onClick={handleStartBooking}
          className="h-11 px-6 rounded-xl font-bold text-xs bg-primary text-primary-foreground cursor-pointer shrink-0 shadow-sm"
        >
          <CalendarDots size={16} weight="bold" className="mr-1.5" />
          Agendar Horário
        </Button>
      </div>

      {/* ── SHEET LATERAL DE AGENDAMENTO (Desktop e Mobile Drawer) ── */}
      <Sheet open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col justify-between bg-card">
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            <SheetHeader className="text-left space-y-1">
              <SheetTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <CalendarDots size={20} className="text-primary" />
                <span>Reservar Horário</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                {service.title} • {formatMoney(service.price_cents)} ({service.duration_minutes || 60} min)
              </SheetDescription>
            </SheetHeader>

            {isSuccess ? (
              <div className="py-12 text-center space-y-4">
                <div className="size-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle size={36} weight="bold" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Agendamento Confirmado!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Seu horário para <strong>{service.title}</strong> foi agendado com sucesso para o dia{" "}
                  <strong>{selectedDate}</strong> às <strong>{selectedSlot ? new Date(selectedSlot).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "horário comercial"}</strong>.
                </p>
                <div className="pt-4 flex flex-col gap-2">
                  <Button asChild className="rounded-xl font-bold text-xs h-10">
                    <Link to="/conta/agendamentos">Ver Meus Agendamentos</Link>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsBookingOpen(false)}
                    className="rounded-xl font-bold text-xs h-10"
                  >
                    Fechar
                  </Button>
                </div>
              </div>
            ) : (
              <form id="booking-form" onSubmit={handleSubmitBooking} className="space-y-5">
                {/* 1. Escolha do Dia */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground">1. Escolha a Data</Label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {nextDays.map((day) => {
                      const isSelected = selectedDate === day.iso;
                      return (
                        <button
                          key={day.iso}
                          type="button"
                          onClick={() => {
                            setSelectedDate(day.iso);
                            setSelectedSlot(null);
                          }}
                          className={cn(
                            "p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center",
                            isSelected
                              ? "bg-foreground text-background border-foreground font-bold shadow-sm"
                              : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <span className="text-[9px] font-mono tracking-wider">{day.weekday}</span>
                          <span className="text-sm font-bold mt-0.5">{day.dayNum}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Horários Disponíveis */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">2. Horário Disponível</Label>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {slots.length} opções disponíveis
                    </span>
                  </div>

                  {isLoadingSlots ? (
                    <div className="flex items-center justify-center py-6">
                      <CircleNotch size={24} className="animate-spin text-muted-foreground" />
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-muted/40 text-center text-xs text-muted-foreground">
                      Nenhum horário disponível para esta data. Selecione outro dia.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                      {slots.map((slotIso: string) => {
                        const timeStr = new Date(slotIso).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const isSelected = selectedSlot === slotIso;

                        return (
                          <button
                            key={slotIso}
                            type="button"
                            onClick={() => setSelectedSlot(slotIso)}
                            className={cn(
                              "h-9 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer flex items-center justify-center",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-card border-border/60 hover:bg-muted text-foreground"
                            )}
                          >
                            {timeStr}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Pacotes de Sessões Ativos do Usuário */}
                {activePasses && activePasses.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                        <Ticket size={15} weight="bold" />
                        Usar Crédito de Pacote
                      </span>
                    </div>
                    {activePasses.map((pass: any) => (
                      <label
                        key={pass.id}
                        className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="service_pass"
                          checked={selectedPassId === pass.id}
                          onChange={() => setSelectedPassId(pass.id)}
                          className="text-primary"
                        />
                        <span>
                          {pass.service_packages?.title} ({pass.remaining_credits} créditos restantes)
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* 4. Dados Pessoais do Cliente */}
                <div className="space-y-3 pt-2">
                  <Label className="text-xs font-bold text-foreground">3. Seus Dados de Contato</Label>
                  <div className="space-y-2">
                    <div className="relative">
                      <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Seu nome completo"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        className="pl-9 h-10 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="WhatsApp (ex: 49 99999-9999)"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="pl-9 h-10 rounded-xl text-xs"
                        required
                      />
                    </div>
                    <Textarea
                      placeholder="Observações ou preferências para o profissional (opcional)"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="rounded-xl text-xs min-h-16 resize-none"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          {!isSuccess && (
            <div className="p-4 border-t border-border/60 bg-background flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] text-muted-foreground font-semibold block">Total</span>
                <span className="text-base font-black font-mono text-foreground">
                  {selectedPassId ? "1 Crédito (Pacote)" : formatMoney(service.price_cents)}
                </span>
              </div>
              <Button
                type="submit"
                form="booking-form"
                disabled={appointmentMutation.isPending}
                className="h-11 px-6 rounded-xl font-bold text-xs bg-primary text-primary-foreground cursor-pointer shadow-sm"
              >
                {appointmentMutation.isPending ? (
                  <CircleNotch size={16} className="animate-spin" />
                ) : (
                  "Confirmar Agendamento"
                )}
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
