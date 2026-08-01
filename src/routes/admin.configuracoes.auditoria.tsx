import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/state/states";
import { getAuditLog } from "@/services/audit.functions";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/admin/configuracoes/auditoria")({
  head: () => ({ meta: [{ title: "Auditoria" }] }),
  loader: async () => {
    return await getAuditLog();
  },
  component: AuditoriaPage,
});

function AuditoriaPage() {
  const res = Route.useLoaderData();

  const entries = Array.isArray(res) ? res : [];

  const actionVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    INSERT: "default",
    UPDATE: "secondary",
    DELETE: "destructive",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log de Auditoria"
        description="Últimas 100 ações realizadas por colaboradores no sistema."
      />

      {entries.length === 0 ? (
        <EmptyState
          title="Nenhum registro de auditoria"
          description="As ações administrativas serão registradas aqui automaticamente."
        />
      ) : (
        <div className="rounded-md border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Registro (ID)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(entry.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariant[entry.action] || "secondary"}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{entry.profiles?.full_name || "Sistema"}</TableCell>
                  <TableCell className="font-mono text-xs">{entry.entity_type || "N/A"}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {entry.entity_id?.slice(0, 8)}…
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
