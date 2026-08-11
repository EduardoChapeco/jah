import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, Clock, User, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/commerce/page-header";
import { listAppointments } from "@/services/booking.functions";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/workspace/agenda/")({
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
      case "checked_in": return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">Check-in</Badge>;
      case "in_service": return <Badge variant="outline" className="bg-violet-500/10 text-violet-600 border-violet-500/20">Em Atendimento</Badge>;
      case "completed": return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Concluído</Badge>;
      case "no_show": return <Badge variant="outline" className="bg-zinc-500/10 text-zinc-600 border-zinc-500/20">Não Compareceu</Badge>;
      case "cancelled": return <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">Cancelado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Group by resource
  const groupedAppointments = appointments.reduce((acc: any, appt: any) => {
    const resourceName = appt.booking_resources?.name || "Sem Profissional";
    if (!acc[resourceName]) acc[resourceName] = [];
    acc[resourceName].push(appt);
    return acc;
  }, {});

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        eyebrow="Agendamentos"
        title="Agenda Orquestrada"
        description="Gestão diária de recursos, profissionais e fluxo de clientes."
      />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">Carregando orquestrador...</div>
      ) : appointments.length === 0 ? (
        <EmptyState
          title="Agenda Livre"
          description="Nenhum agendamento encontrado para o período."
        />
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {Object.keys(groupedAppointments).map((resourceName) => (
              <div key={resourceName} className="w-80 flex flex-col gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <User className="size-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{resourceName}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedAppointments[resourceName].length}
                  </Badge>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
                  {groupedAppointments[resourceName].map((appt: any) => (
                    <Card key={appt.id} className="flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="p-3 flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-sm leading-tight">{appt.booking_services?.title || "Serviço Avulso"}</h4>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-md">
                            <Clock className="size-3" />
                            <span>
                              {format(new Date(appt.scheduled_at), "HH:mm")} - {format(new Date(new Date(appt.scheduled_at).getTime() + (appt.duration_minutes * 60000)), "HH:mm")}
                            </span>
                          </div>
                          {getStatusBadge(appt.status)}
                        </div>

                        <div className="pt-2 border-t border-border mt-2">
                          <p className="text-sm font-semibold text-foreground/90">{appt.guest_name || "Cliente Não Identificado"}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{appt.guest_phone || "Sem contato"}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
