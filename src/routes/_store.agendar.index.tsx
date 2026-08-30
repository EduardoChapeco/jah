import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Scissors,
  Clock,
  CalendarDots,
  Sparkle,
  CheckCircle,
  MagnifyingGlass,
  CircleNotch,
  SquaresFour,
  ListDashes,
  Heartbeat,
  PawPrint,
  Barbell,
} from "@phosphor-icons/react";
import { listBookingServices, createAppointment, listMyPassesForService } from "@/services/booking.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/agendar/")({
  head: () => ({
    meta: [
      { title: "Agendamentos & Serviços | Wider" },
      {
        name: "description",
        content:
          "Agende horários em barbearias, salões, clínicas, estética, pet shops e bem-estar.",
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
  component: BookingIndexPage,
});

const BOOKING_CATEGORIES = [
  { id: "todos", label: "Tudo", icon: Scissors },
  { id: "barbearia", label: "Barbearias", icon: Scissors },
  { id: "beleza", label: "Salão & Cabelo", icon: Sparkle },
  { id: "manicure", label: "Unhas & Manicure", icon: Sparkle },
  { id: "estetica", label: "Estética & Massagem", icon: Sparkle },
  { id: "saude", label: "Saúde & Fisioterapia", icon: Heartbeat },
  { id: "pet", label: "Pet Shop & Banho", icon: PawPrint },
  { id: "fitness", label: "Personal & Aulas", icon: Barbell },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
];

function BookingIndexPage() {
  const { banners, hotpages } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().split("T")[0]);
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

  const { data: activePasses } = useQuery({
    queryKey: ["my-service-passes", selectedService?.id],
    queryFn: () => listMyPassesForService({ data: { service_id: selectedService.id } }),
    enabled: !!selectedService?.id,
  });

  const services = servicesResult?.data || [];

  const appointmentMutation = useMutation({
    mutationFn: () => {
      const scheduledIso = new Date(scheduledDate + "T" + scheduledTime + ":00").toISOString();
      return createAppointment({
        data: {
          service_id: selectedService.id,
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
          ? "Agendamento confirmado com 1 crédito do seu pacote!"
          : "Agendamento confirmado com sucesso!"
      );
      queryClient.invalidateQueries({ queryKey: ["my-service-passes"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao agendar horário.");
    },
  });

  const handleOpenBooking = (service: any) => {
    setSelectedService(service);
    setSelectedPassId(null);
    setIsSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !scheduledDate || !scheduledTime) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }
    appointmentMutation.mutate();
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {banners && banners.length > 0 && <BannerHeroCarousel banners={banners} />}
      {hotpages && hotpages.length > 0 && <HotpagesRail hotpages={hotpages} cleanMode={true} />}

      <section className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Buscar serviço, barbearia, salão, massagem ou profissional..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-card border-border "
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl  shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-background text-foreground "
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Grade"
            >
              <SquaresFour size={16} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "list"
                  ? "bg-background text-foreground "
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Lista"
            >
              <ListDashes size={16} weight="bold" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {BOOKING_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "h-9 px-3.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-2 cursor-pointer border",
                  isSelected
                    ? "bg-foreground text-background border-foreground  font-bold"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <Icon size={16} weight={isSelected ? "fill" : "bold"} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-card rounded-3xl border-0 p-8">
          <Scissors size={40} className="text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Nenhum serviço disponível no momento
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outra categoria ou buscar por outro termo.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service: any) => (
            <div
              key={service.id}
              className="rounded-3xl bg-card border border-border/60 overflow-hidden hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              {service.image_url && (
                <div className="w-full aspect-[16/9] bg-muted/40 overflow-hidden border-b border-border/40">
                  <img
                    src={service.image_url}
                    alt={service.title || service.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono font-bold uppercase">
                      {service.category || "Geral"}
                    </Badge>
                    {service.duration_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 font-mono">
                        <Clock size={13} />
                        <span>{service.duration_minutes} min</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-foreground leading-snug">
                    {service.title || service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <span className="font-mono font-black text-lg text-foreground">
                    {formatMoney(service.price_cents)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleOpenBooking(service)}
                    className="rounded-xl font-bold text-xs h-9 px-4 bg-primary text-primary-foreground cursor-pointer"
                  >
                    Agendar Horário
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-md sm:rounded-3xl sm:p-6 border-border bg-card">
          <DialogHeader className="pb-3 ">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CalendarDots size={18} className="text-primary" />
              <span>Agendar Horário</span>
            </DialogTitle>
          </DialogHeader>

          {isSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle size={28} weight="bold" />
              </div>
              <h3 className="text-base font-bold text-foreground">Agendamento Confirmado!</h3>
              <p className="text-xs text-muted-foreground">
                Seu horário para <strong>{selectedService?.name}</strong> foi reservado para dia {scheduledDate} às {scheduledTime}.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1 rounded-xl font-semibold text-xs h-10 cursor-pointer"
                >
                  <Link to="/conta/agendamentos">Ver Minha Agenda</Link>
                </Button>
                <Button
                  onClick={() => setSelectedService(null)}
                  className="flex-1 rounded-xl font-semibold text-xs h-10 cursor-pointer"
                >
                  Concluir
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="bg-muted/40 p-3.5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-muted-foreground block">
                  Serviço Selecionado
                </span>
                <p className="text-sm font-bold text-foreground">{selectedService?.title || selectedService?.name}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    Duração: {selectedService?.duration_minutes || 30} min
                  </span>
                  <span className="font-mono font-black text-primary text-sm">
                    {selectedPassId ? "1 Crédito do Pacote" : formatMoney(selectedService?.price_cents || 0)}
                  </span>
                </div>
              </div>

              {/* Opção de Usar Pacote de Créditos */}
              {activePasses && activePasses.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        🎉 Você possui pacote ativo!
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {activePasses[0].remaining_credits} créditos restantes de {activePasses[0].total_credits}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={selectedPassId ? "default" : "outline"}
                      onClick={() => setSelectedPassId(selectedPassId ? null : activePasses[0].id)}
                      className="rounded-xl text-xs font-semibold h-8"
                    >
                      {selectedPassId ? "✓ Usando Pacote" : "Usar Crédito"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">Seu Nome</label>
                    <Input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Nome completo"
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-foreground">WhatsApp / Telefone</label>
                    <Input
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      className="h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Data Desejada</label>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Horários Disponíveis</label>
                  <div className="grid grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1  rounded-xl bg-background scrollbar-none">
                    {TIME_SLOTS.map((slot) => {
                      const isSlotSelected = scheduledTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setScheduledTime(slot)}
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer",
                            isSlotSelected
                              ? "bg-primary text-primary-foreground "
                              : "bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Observações (Opcional)</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ex: Primeira vez, preferência por profissional..."
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2  flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedService(null)}
                  className="rounded-xl text-xs h-10 px-4 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={appointmentMutation.isPending}
                  className="rounded-xl font-bold text-xs h-10 px-5 bg-primary text-primary-foreground cursor-pointer"
                >
                  {appointmentMutation.isPending ? "Confirmando..." : "Confirmar Horário"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
