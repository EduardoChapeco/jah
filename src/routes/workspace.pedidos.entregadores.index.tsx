import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Car,
  Bike,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Truck,
  Ban,
  Clock,
  Loader2,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listCouriers, type CourierSummaryDTO } from "@/services/fleet.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/pedidos/entregadores/")({
  head: () => ({ meta: [{ title: "Entregadores — Wider Workspace" }] }),
  loader: async () => {
    const data = await listCouriers({ data: {} });
    return { initialData: data };
  },
  component: CouriersListPage,
});

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  available: { label: "Disponível", variant: "default", icon: CheckCircle2 },
  on_route: { label: "Em Rota", variant: "secondary", icon: Truck },
  offline: { label: "Offline", variant: "outline", icon: Clock },
  suspended: { label: "Suspenso", variant: "destructive", icon: Ban },
};

const VEHICLE_ICONS: Record<string, any> = {
  motorcycle: Bike,
  car: Car,
  bicycle: Bike,
  van: Truck,
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "outline", icon: Clock };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1.5 text-xs font-medium">
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

function CouriersListPage() {
  const { initialData } = Route.useLoaderData();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data: couriers, isLoading } = useQuery({
    queryKey: ["couriers", statusFilter, search],
    queryFn: () =>
      listCouriers({ data: { status: statusFilter as any, search: search || undefined } }),
    initialData: statusFilter === undefined && !search ? initialData : undefined,
    staleTime: 60_000,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Entregadores</h1>
          <p className="text-sm text-muted-foreground">Gestão de frota, pagamentos e status</p>
        </div>
        <Button asChild size="sm">
          <Link to="/workspace/pedidos/entregadores/novo">
            <Plus className="size-4 mr-1.5" />
            Novo Entregador
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por nome, telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-background  rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? undefined : key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === key
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:border-foreground/30"
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && couriers && couriers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-0 rounded-lg bg-muted/10">
          <Bike className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">Nenhum entregador encontrado.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre seu primeiro entregador fixo para atribuir pedidos.
          </p>
        </div>
      )}

      {!isLoading && couriers && couriers.length > 0 && (
        <div className=" rounded-lg overflow-hidden bg-background">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/30  text-xs text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-medium">Entregador</th>
                <th className="px-4 py-3 font-medium">Veículo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Taxa Padrão</th>
                <th className="px-4 py-3 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {couriers.map((courier) => {
                const VehicleIcon = VEHICLE_ICONS[courier.vehicle_type] ?? Bike;
                return (
                  <tr key={courier.id} className="hover:bg-muted/20 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{courier.name}</p>
                      {courier.phone && (
                        <p className="text-xs text-muted-foreground mt-0.5">{courier.phone}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded bg-muted flex items-center justify-center">
                          <VehicleIcon className="size-3 text-muted-foreground" />
                        </div>
                        {courier.vehicle_plate && (
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded  uppercase">
                            {courier.vehicle_plate}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={courier.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {courier.default_fee_cents > 0
                        ? formatMoney(courier.default_fee_cents)
                        : "---"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="size-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem asChild>
                            <Link
                              to="/workspace/pedidos/entregadores/$id"
                              params={{ id: courier.id }}
                            >
                              Ver Detalhes
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>Gerar Fatura</DropdownMenuItem>
                          <DropdownMenuItem className="text-danger">Suspender</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
