import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Settings2, Users, Archive, CheckCircle2 } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { listResources } from "@/services/booking.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/workspace/agenda/recursos")({
  head: () => ({ meta: [{ title: "Gestão de Recursos" }] }),
  component: AdminResourcesPage,
});

function AdminResourcesPage() {
  const { data: resourcesRes, isLoading } = useQuery({
    queryKey: ["admin-booking-resources"],
    queryFn: () => listResources(),
  });

  const resources = resourcesRes?.data || [];

  const getDayName = (day: number) => {
    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    return days[day];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Agenda"
        title="Recursos"
        actions={
          <Button>
            <UserPlus className="mr-2 size-4" />
            Novo Recurso
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">Carregando recursos...</div>
      ) : resources.length === 0 ? (
        <EmptyState
          title="Nenhum Recurso Cadastrado"
          action={<Button>Cadastrar Primeiro Recurso</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {resources.map((res: any) => (
            <div
              key={res.id}
              className="flex flex-col h-full relative group p-6  bg-card hover:border-primary/50 transition-colors rounded-xl"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl leading-tight">{res.name}</h3>
                  <p className="text-sm text-muted-foreground font-semibold mt-1">
                    {res.resource_type === "person"
                      ? "Profissional"
                      : res.resource_type === "room"
                        ? "Sala/Espaço"
                        : "Equipamento"}
                  </p>
                </div>
                <Badge variant={res.status === "active" ? "default" : "secondary"}>
                  {res.status === "active" ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="size-4 text-muted-foreground" />
                  <span>
                    Capacidade: <strong>{res.capacity}</strong> atendimento(s) simultâneo(s)
                  </span>
                </div>
              </div>

              <div className="mt-auto">
                <h4 className="text-xs font-bold text-muted-foreground mb-3  pb-1">
                  Grade de Horários
                </h4>

                {res.booking_resource_availabilities?.length > 0 ? (
                  <div className="space-y-2">
                    {res.booking_resource_availabilities.map((avail: any) => (
                      <div
                        key={avail.id}
                        className="flex justify-between items-center text-sm p-2 rounded bg-muted/40 "
                      >
                        <span className="font-medium">{getDayName(avail.day_of_week)}</span>
                        <span className="font-mono text-muted-foreground">
                          {avail.start_time.slice(0, 5)} - {avail.end_time.slice(0, 5)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Grade não configurada.</p>
                )}
              </div>

              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button size="icon" variant="secondary" className="size-8 rounded-full">
                  <Settings2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
