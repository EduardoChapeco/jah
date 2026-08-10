import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/commerce/page-header";
import { listAppointments } from "@/services/booking.functions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Surface } from "@/components/ui/surface";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/agendamentos/")({
  head: () => ({ meta: [{ title: "Painel de Agendamentos" }] }),
  component: AdminAppointmentsPage,
});

function AdminAppointmentsPage() {
  const { data: appointmentsRes, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => listAppointments(),
  });

  const appointments = appointmentsRes?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
      case "confirmed": return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Confirmado</Badge>;
      case "completed": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Concluído</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Cancelado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agendamentos"
        title="Agenda da Loja"
        description="Gestão de reservas, serviços e fluxo de horários."
      />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">Carregando agendamentos...</div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarIcon className="size-10 text-muted-foreground" />}
          title="Agenda Livre"
          description="Nenhum agendamento encontrado para o período."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appt: any) => (
            <Surface key={appt.id} variant="op" padding="none" className="flex flex-col h-full overflow-hidden">
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{appt.booking_services?.title || "Serviço Avulso"}</h3>
                    <p className="text-sm text-muted-foreground font-medium flex items-center gap-1 mt-1">
                      <User className="size-3" /> {appt.booking_resources?.name || "Sem Recurso Atribuído"}
                    </p>
                  </div>
                  {getStatusBadge(appt.status)}
                </div>

                <div className="space-y-2 mb-4 p-3 bg-muted/40 rounded-lg border border-border/50">
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarIcon className="size-4 text-primary" />
                    <span className="font-medium capitalize">
                      {format(new Date(appt.scheduled_at), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-primary" />
                    <span className="font-mono">
                      {format(new Date(appt.scheduled_at), "HH:mm")}
                      {" - "}
                      {format(new Date(new Date(appt.scheduled_at).getTime() + (appt.duration_minutes * 60000)), "HH:mm")}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm font-semibold">{appt.guest_name || "Cliente Não Identificado"}</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{appt.guest_phone || "Sem contato"}</p>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
