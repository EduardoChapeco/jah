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
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Phone,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";
import {
  listCustomerMobilityRequests,
  type MobilityRequestDTO,
} from "@/services/mobility.functions";

export const Route = createFileRoute("/_store/conta/mobilidade")({
  head: () => ({
    meta: [{ title: "Minhas Corridas & Mudanças | JAH" }],
  }),
  loader: async () => {
    const requests = await listCustomerMobilityRequests().catch(() => []);
    return { requests };
  },
  component: CustomerMobilityHistoryPage,
});

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  searching: { label: "Buscando Motorista", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300" },
  accepted: { label: "Motorista a Caminho", color: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300" },
  in_progress: { label: "Em Rota / Transporte", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300" },
  delivered: { label: "Entregue / Concluído", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  completed: { label: "Finalizado com Sucesso", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" },
  cancelled: { label: "Cancelado", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300" },
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
    <div className="w-full max-w-4xl mx-auto space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">
            Minhas Corridas & Mudanças
          </h1>
          <p className="text-xs text-muted-foreground">
            Acompanhe o status dos seus trajetos, entregas expressas e fretes contratados.
          </p>
        </div>

        <Button asChild className="rounded-2xl h-11 px-5 font-bold text-xs bg-primary text-primary-foreground gap-2">
          <Link to="/mobilidade">
            <Plus className="size-4" />
            <span>Fazer Novo Chamado</span>
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-24">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && requests && requests.length === 0 && (
        <div className="py-24 text-center space-y-4 bg-muted/20 rounded-3xl border border-dashed border-border p-8">
          <Car className="size-12 text-muted-foreground/40 mx-auto" />
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">Nenhuma corrida ou entrega solicitada</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Precisa transportar um pacote, se deslocar pela cidade ou fazer uma mudança? Chame um motorista local!
            </p>
          </div>
          <Button asChild className="rounded-2xl h-11 px-6 font-bold text-xs bg-primary text-primary-foreground">
            <Link to="/mobilidade">Chamar Agora</Link>
          </Button>
        </div>
      )}

      {!isLoading && requests && requests.length > 0 && (
        <div className="space-y-4">
          {requests.map((req) => {
            const statusConfig = STATUS_LABELS[req.status] || {
              label: req.status,
              color: "bg-muted text-muted-foreground",
            };

            return (
              <div
                key={req.id}
                className="rounded-3xl border border-border/80 bg-card p-6 shadow-xs space-y-4 hover-elevate transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">
                      #{req.magic_token || req.id.substring(0, 8)}
                    </span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDate(req.created_at)}
                    </span>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                    {statusConfig.label}
                  </span>
                </div>

                {/* Route Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-amber-500" />
                      <span>Origem / Coleta:</span>
                    </span>
                    <p className="text-foreground font-medium pl-5">{req.origin_address}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-emerald-500" />
                      <span>Destino / Entrega:</span>
                    </span>
                    <p className="text-foreground font-medium pl-5">{req.destination_address}</p>
                  </div>
                </div>

                {/* Assigned Driver (if any) */}
                {req.courier_profiles && (
                  <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {req.courier_profiles.full_name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-foreground">{req.courier_profiles.full_name}</span>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          {req.courier_profiles.vehicle_model || req.courier_profiles.vehicle_type} • {req.courier_profiles.vehicle_plate || "Placa em confirmação"}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`https://wa.me/55${req.courier_profiles.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Phone className="size-3.5" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                )}

                {/* Price & Summary */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                      {req.service_type}
                    </Badge>
                    {req.helpers_count > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        +{req.helpers_count} ajudante(s)
                      </span>
                    )}
                  </div>

                  <span className="font-mono font-black text-base text-foreground">
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
