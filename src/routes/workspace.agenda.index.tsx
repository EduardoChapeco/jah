import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  FileText,
  Play,
  Activity,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import {
  listAppointments,
  updateAppointmentStatus,
  listClinicalRecords,
  addClinicalRecord,
} from "@/services/booking.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/state/states";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/workspace/agenda/")({
  head: () => ({ meta: [{ title: "Painel de Agendamentos" }] }),
  component: AdminAppointmentsPage,
});

function ClinicalRecordDrawer({
  appointmentId,
  isOpen,
  onClose,
  guestName,
}: {
  appointmentId: string | null;
  isOpen: boolean;
  onClose: () => void;
  guestName: string;
}) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: recordsRes, isLoading } = useQuery({
    queryKey: ["clinical-records", appointmentId],
    queryFn: () => listClinicalRecords({ data: { appointment_id: appointmentId! } }),
    enabled: !!appointmentId,
  });

  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      return await addClinicalRecord({
        data: { appointment_id: appointmentId!, record_type: "anamnesis", content: text },
      });
    },
    onSuccess: () => {
      toast.success("Evolução salva!");
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["clinical-records", appointmentId] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar evolução"),
  });

  const records = recordsRes?.data || [];

  return (
    <Sheet open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <SheetContent className="sm:max-w-md flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Prontuário & Evolução</SheetTitle>
          <SheetDescription>Histórico clínico de {guestName}</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando histórico...</p>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">
              Nenhum registro encontrado para este paciente.
            </p>
          ) : (
            records.map((r: any) => (
              <div key={r.id} className="bg-muted p-3 rounded-xl text-sm border border-border">
                <div className="flex justify-between items-center mb-2 text-xs text-muted-foreground font-mono">
                  <span>{format(new Date(r.created_at), "dd/MM/yyyy HH:mm")}</span>
                  <span>{r.author?.email || "Profissional"}</span>
                </div>
                <p className="whitespace-pre-wrap">{r.content}</p>
              </div>
            ))
          )}
        </div>
        <div className="pt-4 border-t border-border mt-auto">
          <label className="text-sm font-semibold mb-2 block">Nova Evolução / Anamnese</label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Descreva o procedimento, estado do paciente, uso de produtos..."
            className="mb-3 h-24 resize-none"
          />
          <Button
            className="w-full"
            disabled={!content.trim() || addMutation.isPending}
            onClick={() => addMutation.mutate(content)}
          >
            Salvar Evolução
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AdminAppointmentsPage() {
  const queryClient = useQueryClient();
  const [selectedAppt, setSelectedAppt] = useState<{ id: string; name: string } | null>(null);

  const { data: appointmentsRes, isLoading } = useQuery({
    queryKey: ["admin-appointments"],
    queryFn: () => listAppointments(),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      return await updateAppointmentStatus({ data: { id, status } });
    },
    onSuccess: () => {
      toast.success("Status atualizado!");
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    },
    onError: (e: any) => toast.error(e.message || "Erro ao atualizar status"),
  });

  const appointments = appointmentsRes?.data || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "confirmed":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            Aguardando
          </Badge>
        );
      case "checked_in":
        return (
          <Badge variant="outline" className="bg-info/10 text-info border-info/20">
            Aguardando na Recepção
          </Badge>
        );
      case "in_service":
        return (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Em Atendimento
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            Concluído
          </Badge>
        );
      case "no_show":
        return (
          <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
            Não Compareceu
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20">
            Cancelado
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const groupedAppointments = appointments.reduce((acc: any, appt: any) => {
    const resourceName = appt.booking_resources?.name || "Sem Profissional";
    if (!acc[resourceName]) acc[resourceName] = [];
    acc[resourceName].push(appt);
    return acc;
  }, {});

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader eyebrow="Agendamentos" title="Agenda Orquestrada" />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">Carregando orquestrador...</div>
      ) : appointments.length === 0 ? (
        <EmptyState title="Agenda Livre" />
      ) : (
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max h-full">
            {Object.keys(groupedAppointments).map((resourceName) => (
              <div
                key={resourceName}
                className="w-96 flex flex-col gap-4 bg-surface-paper shadow-sm rounded-xl border border-border p-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <User className="size-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{resourceName}</h3>
                  <Badge variant="secondary" className="ml-auto">
                    {groupedAppointments[resourceName].length}
                  </Badge>
                </div>

                <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
                  {groupedAppointments[resourceName].map((appt: any) => (
                    <div
                      key={appt.id}
                      className="flex flex-col border border-border bg-background shadow-sm rounded-xl p-3 overflow-hidden"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm leading-tight">
                          {appt.booking_services?.title || "Serviço Avulso"}
                        </h4>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded-xl">
                          <Clock className="size-3" />
                          <span>
                            {format(new Date(appt.scheduled_at), "HH:mm")} -{""}
                            {format(
                              new Date(
                                new Date(appt.scheduled_at).getTime() +
                                  (appt.duration_minutes || 60) * 60000,
                              ),
                              "HH:mm",
                            )}
                          </span>
                        </div>
                        {getStatusBadge(appt.status)}
                      </div>

                      <div className="pt-2 border-t border-border mt-2">
                        <p className="text-sm font-semibold text-foreground/90 flex items-center justify-between">
                          {appt.guest_name || "Cliente Não Identificado"}

                          {/* Botão de Prontuário Clínico */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            title="Ver Prontuário / Evolução"
                            onClick={() =>
                              setSelectedAppt({ id: appt.id, name: appt.guest_name || "Cliente" })
                            }
                          >
                            <FileText className="size-4 text-primary" />
                          </Button>
                        </p>
                      </div>

                      {/* Botões de Ação de Estado */}
                      {["pending", "confirmed"].includes(appt.status) && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              statusMutation.mutate({ id: appt.id, status: "checked_in" })
                            }
                          >
                            Fazer Check-in
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() =>
                              statusMutation.mutate({ id: appt.id, status: "no_show" })
                            }
                          >
                            Faltou
                          </Button>
                        </div>
                      )}
                      {appt.status === "checked_in" && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              statusMutation.mutate({ id: appt.id, status: "in_service" })
                            }
                          >
                            <Play className="size-3 mr-1" /> Iniciar Atendimento
                          </Button>
                        </div>
                      )}
                      {appt.status === "in_service" && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="w-full"
                            onClick={() =>
                              statusMutation.mutate({ id: appt.id, status: "completed" })
                            }
                          >
                            <CheckCircle2 className="size-3 mr-1" /> Concluir Atendimento
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedAppt && (
        <ClinicalRecordDrawer
          isOpen={true}
          onClose={() => setSelectedAppt(null)}
          appointmentId={selectedAppt.id}
          guestName={selectedAppt.name}
        />
      )}
    </div>
  );
}
