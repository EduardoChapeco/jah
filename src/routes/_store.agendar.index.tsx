import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Scissors,
  Clock,
  CalendarDots,
  User,
  Phone,
  Sparkle,
  CheckCircle,
  MagnifyingGlass,
  Sparkle as SparkleIcon,
  CircleNotch,
  ArrowRight,
  ChatText,
} from "@phosphor-icons/react";
import { listBookingServices, createAppointment } from "@/services/booking.functions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/agendar/")({
  head: () => ({
    meta: [
      { title: "Agendamento de Serviços & Beleza | JAH" },
      {
        name: "description",
        content:
          "Agende horários em barbearias, salões de beleza, manicures, estética e massagens em Chapecó.",
      },
    ],
  }),
  component: BookingIndexPage,
});

const BOOKING_CATEGORIES = [
  { id: "todos", label: "Todos Serviços", icon: Scissors },
  { id: "barbearia", label: "Barbearia & Masculino", icon: Scissors },
  { id: "salao_cabelo", label: "Salão & Cabelo", icon: Sparkle },
  { id: "unhas_manicure", label: "Unhas & Manicure", icon: SparkleIcon },
  { id: "estetica_massagem", label: "Estética & Massagem", icon: Sparkle },
];

function BookingIndexPage() {
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("14:00");
  const [notes, setNotes] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: servicesResult, isLoading } = useQuery({
    queryKey: ["booking-services", selectedCategory, search],
    queryFn: () =>
      listBookingServices({
        data: {
          category: selectedCategory === "todos" ? undefined : selectedCategory,
          search: search || undefined,
        },
      }),
  });

  const services = servicesResult?.data || [];

  const appointmentMutation = useMutation({
    mutationFn: () => {
      const scheduledIso = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();
      return createAppointment({
        data: {
          service_id: selectedService.id,
          guest_name: guestName,
          guest_phone: guestPhone,
          scheduled_at: scheduledIso,
          notes: notes || undefined,
        },
      });
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success("Horário agendado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao confirmar agendamento.");
    },
  });

  const handleOpenBooking = (service: any) => {
    setSelectedService(service);
    setIsSuccess(false);
    // Data padrão para amanhã
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    setScheduledDate(tomorrow);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-24 px-4 sm:px-6 pt-6">
      {/* ── 1. Header ── */}
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold px-2.5 py-0.5">
            Agendamentos
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Barbearia, Salões & Estética</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
          Agende seu Atendimento
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
          Escolha o segmento desejado e reserve seu horário online com confirmação imediata.
        </p>
      </header>

      {/* ── 2. Filtros de Segmento em Cards Gordinhos Squircle ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors size={16} weight="bold" className="text-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Segmentos de Atendimento
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar corte, barba, mechas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 w-full px-0.5">
          {BOOKING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-w-[104px] sm:min-w-[124px] h-[94px] sm:h-[100px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all group ${
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-xs font-bold scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/30 shadow-2xs"
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isSelected ? "bg-background/20 text-background" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon size={20} weight={isSelected ? "fill" : "bold"} />
                </div>
                <span className="text-xs font-bold text-center leading-tight line-clamp-1">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 3. Grid de Serviços ── */}
      {isLoading ? (
        <div className="flex justify-center py-24">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <Scissors size={40} className="text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Nenhum serviço encontrado neste segmento
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outra categoria no menu acima ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {services.map((service: any) => (
            <div
              key={service.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                        {service.category?.toUpperCase() || "SERVIÇO"}
                      </span>
                      {service.gender_target && service.gender_target !== "todos" && (
                        <Badge variant="outline" className="text-[9px] uppercase font-mono px-1.5 py-0">
                          {service.gender_target}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground leading-tight">
                      {service.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-xl shrink-0">
                    <Clock size={13} weight="bold" />
                    <span>{service.duration_minutes} min</span>
                  </div>
                </div>

                {service.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold">
                    Valor
                  </span>
                  <p className="font-mono font-black text-sm text-foreground">
                    {formatMoney(service.price_cents, "BRL")}
                  </p>
                </div>

                <Button
                  onClick={() => handleOpenBooking(service)}
                  size="sm"
                  className="rounded-xl font-bold text-xs h-10 px-4 gap-1.5 bg-foreground text-background"
                >
                  <span>Agendar Horário</span>
                  <ArrowRight size={14} weight="bold" />
                </Button>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ── 4. Modal de Agendamento Real ── */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6 sm:p-8">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-lg font-black text-foreground">
              Agendar {selectedService?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Duração: {selectedService?.duration_minutes} min • Valor: {selectedService && formatMoney(selectedService.price_cents, "BRL")}
            </DialogDescription>
          </DialogHeader>

          {isSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-foreground text-background flex items-center justify-center mx-auto">
                <CheckCircle size={24} weight="bold" />
              </div>
              <h4 className="text-sm font-bold text-foreground">Horário Solicitado com Sucesso!</h4>
              <p className="text-xs text-muted-foreground">
                Recebemos seu agendamento para {scheduledDate} às {scheduledTime}. Entraremos em contato via WhatsApp para confirmação.
              </p>
              <Button
                variant="outline"
                onClick={() => setSelectedService(null)}
                className="rounded-xl font-bold text-xs"
              >
                Concluir
              </Button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                appointmentMutation.mutate();
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <User size={14} weight="bold" />
                  <span>Seu Nome *</span>
                </label>
                <Input
                  required
                  placeholder="Ex: Carlos Eduardo"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="rounded-xl h-10 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Phone size={14} weight="bold" />
                  <span>WhatsApp para Confirmação *</span>
                </label>
                <Input
                  required
                  placeholder="(49) 99999-9999"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="rounded-xl h-10 text-xs bg-background"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CalendarDots size={14} weight="bold" />
                    <span>Data Desejada *</span>
                  </label>
                  <Input
                    required
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="rounded-xl h-10 text-xs bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Clock size={14} weight="bold" />
                    <span>Horário *</span>
                  </label>
                  <Input
                    required
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="rounded-xl h-10 text-xs bg-background"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <ChatText size={14} weight="bold" />
                  <span>Observações (Opcional)</span>
                </label>
                <Input
                  placeholder="Ex: Preferência por profissional específico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl h-10 text-xs bg-background"
                />
              </div>

              <Button
                type="submit"
                disabled={appointmentMutation.isPending}
                className="w-full rounded-xl font-bold h-11 text-xs bg-foreground text-background mt-2"
              >
                {appointmentMutation.isPending ? (
                  <>
                    <CircleNotch size={16} className="animate-spin mr-2" />
                    Confirmando agendamento...
                  </>
                ) : (
                  "Confirmar Agendamento"
                )}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
