import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Truck, CheckCircle2, MapPin, KeyRound, ExternalLink, Phone, ShieldCheck } from "lucide-react";
import { getDispatchByDealId, getDispatchByOrderId } from "@/services/company-delivery.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DealDeliveryTrackingCardProps {
  dealId?: string;
  orderId?: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: "Aguardando Coleta pelo Motoboy", color: "text-amber-600 bg-amber-500/10 border-amber-500/20", step: 1 },
  accepted: { label: "Motoboy a Caminho da Loja", color: "text-blue-600 bg-blue-500/10 border-blue-500/20", step: 2 },
  picked_up: { label: "A Caminho do seu Endereço", color: "text-purple-600 bg-purple-500/10 border-purple-500/20", step: 3 },
  delivered: { label: "Entrega Concluída", color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", step: 4 },
  cancelled: { label: "Entrega Cancelada", color: "text-destructive bg-destructive/10 border-destructive/20", step: 0 },
};

export function DealDeliveryTrackingCard({ dealId, orderId }: DealDeliveryTrackingCardProps) {
  const targetId = dealId || orderId;

  const { data, isLoading } = useQuery({
    queryKey: ["delivery-dispatch", targetId],
    queryFn: async () => {
      if (dealId) {
        return getDispatchByDealId({ data: { dealId } });
      }
      if (orderId) {
        return getDispatchByOrderId({ data: { orderId } });
      }
      return { dispatch: null };
    },
    enabled: !!targetId,
    refetchInterval: 10000, // Atualização a cada 10 segundos
  });

  const dispatch = data?.dispatch;

  if (isLoading || !dispatch) {
    return null;
  }

  const statusConfig = STATUS_MAP[dispatch.status] || STATUS_MAP.pending;

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Header do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Truck className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-foreground">
                Entrega Expressa Motoboy
              </h4>
              <Badge variant="outline" className={`text-[10px] font-semibold ${statusConfig.color}`}>
                {statusConfig.label}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Despachado por <strong className="text-foreground">{dispatch.store?.name || "Lojista"}</strong>
            </p>
          </div>
        </div>

        {/* PIN de Segurança em Destaque */}
        {dispatch.confirmation_pin && dispatch.status !== "delivered" && (
          <div className="flex items-center gap-2 bg-card border border-primary/20 px-3 py-1.5 rounded-xl self-start sm:self-auto shadow-2xs">
            <KeyRound className="size-4 text-primary shrink-0" />
            <div className="text-left">
              <span className="text-[9px] uppercase font-bold text-muted-foreground block">
                PIN de Recebimento
              </span>
              <span className="font-mono text-sm font-black text-primary tracking-widest">
                {dispatch.confirmation_pin}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Linha do Tempo Visual de 3 Etapas */}
      <div className="grid grid-cols-3 gap-2 py-1">
        <div className={`p-2.5 rounded-xl border text-center transition-all ${
          statusConfig.step >= 1 ? "bg-primary/10 border-primary/30 text-foreground font-semibold" : "bg-muted/20 border-border/40 text-muted-foreground opacity-60"
        }`}>
          <div className="text-[10px] uppercase font-bold mb-0.5">1. Despachado</div>
          <span className="text-[11px]">Loja acionou motoboy</span>
        </div>

        <div className={`p-2.5 rounded-xl border text-center transition-all ${
          statusConfig.step >= 3 ? "bg-primary/10 border-primary/30 text-foreground font-semibold" : "bg-muted/20 border-border/40 text-muted-foreground opacity-60"
        }`}>
          <div className="text-[10px] uppercase font-bold mb-0.5">2. Em Trânsito</div>
          <span className="text-[11px]">A caminho da sua casa</span>
        </div>

        <div className={`p-2.5 rounded-xl border text-center transition-all ${
          statusConfig.step >= 4 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold" : "bg-muted/20 border-border/40 text-muted-foreground opacity-60"
        }`}>
          <div className="text-[10px] uppercase font-bold mb-0.5">3. Entregue</div>
          <span className="text-[11px]">Pacote recebido</span>
        </div>
      </div>

      {/* Detalhes de Destino & Entregador */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-card/60 p-3 rounded-xl border border-border/40">
        <div className="flex items-start gap-2">
          <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-muted-foreground block text-[10px] uppercase font-medium">Endereço de Entrega</span>
            <p className="font-semibold text-foreground truncate">{dispatch.delivery_address}</p>
            {dispatch.delivery_neighborhood && (
              <p className="text-[11px] text-muted-foreground">{dispatch.delivery_neighborhood} — {dispatch.delivery_city}</p>
            )}
          </div>
        </div>

        {dispatch.courier_name && (
          <div className="flex items-start gap-2 sm:border-l sm:border-border/40 sm:pl-3">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="text-muted-foreground block text-[10px] uppercase font-medium">Entregador Responsável</span>
              <p className="font-semibold text-foreground truncate">{dispatch.courier_name}</p>
              {dispatch.courier_phone && (
                <a href={`tel:${dispatch.courier_phone}`} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
                  <Phone className="size-3" />
                  <span>{dispatch.courier_phone}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Foto de Comprovante de Entrega se Concluída */}
      {dispatch.status === "delivered" && dispatch.proof_photo_url && (
        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-4" />
            <span>Comprovante de entrega anexado pelo entregador</span>
          </div>
          <a
            href={dispatch.proof_photo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Ver Foto</span>
            <ExternalLink className="size-3" />
          </a>
        </div>
      )}

      {/* Ação: Abrir link opaco de rastreamento completo */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-muted-foreground">
          Informe o PIN ao entregador no ato da entrega para confirmar o recebimento.
        </span>

        <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 h-8">
          <Link to="/entrega/$token" params={{ token: dispatch.token }}>
            <ExternalLink className="size-3.5" />
            <span>Acompanhar Entrega</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
