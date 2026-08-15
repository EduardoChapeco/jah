import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Car,
  Bike,
  Zap,
  Truck,
  Boxes,
  MapPin,
  Clock,
  Loader2,
  Phone,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import {
  listCustomerMobilityRequests,
} from "@/services/mobility.functions";

export const Route = createFileRoute("/_store/conta/mobilidade")({
  head: () => ({
    meta: [{ title: "Minhas Corridas & Mudanças — JAH" }],
  }),
  loader: async () => {
    const requests = await listCustomerMobilityRequests().catch(() => []);
    return { requests };
  },
  component: CustomerMobilityHistoryPage,
});

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  searching: { label: "Buscando Motorista", variant: "secondary" },
  accepted: { label: "Motorista a Caminho", variant: "default" },
  in_progress: { label: "Em Transporte", variant: "default" },
  delivered: { label: "Entregue", variant: "outline" },
  completed: { label: "Concluído", variant: "outline" },
  cancelled: { label: "Cancelado", variant: "secondary" },
};

function CustomerMobilityHistoryPage() {
  const { requests: initialRequests } = Route.useLoaderData();
  const { data: requests, isLoading } = useQuery({
    queryKey: ["customer-mobility-history"],
    queryFn: () => listCustomerMobilityRequests(),
    initialData: initialRequests,
    refetchInterval: 10000,
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Minhas Corridas & Mudanças
          </h1>
          <p className="text-xs text-muted-foreground">
            Acompanhe o status dos seus trajetos, entregas e fretes contratados.
          </p>
        </div>

        <Button asChild className="rounded-xl h-10 px-4 font-semibold text-xs bg-foreground text-background hover:opacity-90 gap-2">
          <Link to="/mobilidade">
            <Plus className="size-4" />
            <span>Fazer Novo Chamado</span>
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && requests && requests.length === 0 && (
        <div className="py-20 text-center space-y-3 bg-muted/20 rounded-2xl border border-border p-8">
          <Car className="size-10 text-muted-foreground/50 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Nenhuma corrida solicitada</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Precisa transportar um pacote, se deslocar pela cidade ou fazer uma mudança?
            </p>
          </div>
          <Button asChild className="rounded-xl h-10 px-5 font-semibold text-xs bg-foreground text-background hover:opacity-90">
            <Link to="/mobilidade">Chamar Agora</Link>
          </Button>
        </div>
      )}

      {!isLoading && requests && requests.length > 0 && (
        <div className="space-y-3">
          {requests.map((req) => {
            const statusConfig = STATUS_LABELS[req.status] || {
              label: req.status,
              variant: "outline",
            };

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3 hover:border-foreground/20 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-muted-foreground">
                      #{req.magic_token || req.id.substring(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(req.created_at)}
                    </span>
                  </div>

                  <Badge variant={statusConfig.variant} className="text-xs">
                    {statusConfig.label}
                  </Badge>
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span>Origem / Coleta:</span>
                    </span>
                    <p className="text-foreground pl-5">{req.origin_address}</p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="font-medium text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground" />
                      <span>Destino / Entrega:</span>
                    </span>
                    <p className="text-foreground pl-5">{req.destination_address}</p>
                  </div>
                </div>

                {/* Assigned Driver (if any) */}
                {req.courier_profiles && (
                  <div className="p-3 rounded-xl bg-muted/30 border border-border flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold">
                        {req.courier_profiles.full_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{req.courier_profiles.full_name}</span>
                        <p className="text-[11px] text-muted-foreground">
                          {req.courier_profiles.vehicle_model || req.courier_profiles.vehicle_type} • {req.courier_profiles.vehicle_plate || "Placa em confirmação"}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/55${req.courier_profiles.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="size-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Price & Summary */}
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {req.service_type}
                    </Badge>
                    {req.helpers_count > 0 && (
                      <span className="text-xs text-muted-foreground">
                        +{req.helpers_count} ajudante(s)
                      </span>
                    )}
                  </div>

                  <span className="font-semibold text-sm text-foreground">
                    {formatMoney(req.final_price_cents || req.estimated_price_cents)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
