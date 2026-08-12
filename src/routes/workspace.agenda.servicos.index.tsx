import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Clock, FileText, CheckCircle2, Edit3, Archive } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import { listBookingServices, deleteBookingService } from "@/services/booking.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/agenda/servicos/")({
  head: () => ({ meta: [{ title: "Serviços de Agendamento" }] }),
  component: ServicesIndexPage,
});

function ServicesIndexPage() {
  const navigate = useNavigate();
  const {
    data: res,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["booking-services"],
    queryFn: () => listBookingServices(),
  });

  const services = res?.data || [];

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente remover (arquivar) este serviço?")) return;
    try {
      await deleteBookingService({ data: { id } });
      toast.success("Serviço removido com sucesso.");
      refetch();
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao remover serviço.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configurações de Agendamento"
        title="Serviços"
        actions={
          <Button asChild>
            <Link to="/workspace/agenda/servicos">
              <Plus className="mr-2 size-4" />
              Novo Serviço
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">Carregando serviços...</div>
      ) : services.length === 0 ? (
        <EmptyState
          title="Nenhum Serviço Cadastrado"
          action={
            <Button asChild>
              <Link to="/workspace/agenda/servicos">Cadastrar Primeiro Serviço</Link>
            </Button>
          }
        />
      ) : (
        <div className="border border-border bg-card rounded-md shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serviço</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service: any) => (
                <TableRow key={service.id} className="group">
                  <TableCell>
                    <div className="font-semibold text-foreground">{service.title}</div>
                    {service.description && (
                      <div className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">
                        {service.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {service.duration_minutes} min
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatMoney(service.price_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.status === "active" ? "default" : "secondary"}>
                      {service.status === "active" ? "Ativo" : "Arquivado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate({ to: `/workspace/agenda/servicos/${service.id}` })}
                        title="Editar Serviço"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(service.id)}
                        title="Remover"
                      >
                        <Archive className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
