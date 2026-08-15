import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Handshake,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  DollarSign,
  FileSignature,
  Loader2,
  Tag,
  User,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { getDealsByUser, respondToDealProposal } from "@/services/deals.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";

export const Route = createFileRoute("/_store/conta/negociacoes")({
  head: () => ({ meta: [{ title: "Minhas Negociações & Propostas — JAH" }] }),
  component: NegociacoesPage,
});

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  negotiating: { label: "Em Negociação", variant: "secondary" },
  accepted: { label: "Proposta Aceita", variant: "default" },
  rejected: { label: "Recusada", variant: "destructive" },
  cancelled: { label: "Cancelada", variant: "outline" },
  completed: { label: "Concluída", variant: "default" },
};

function NegociacoesPage() {
  const queryClient = useQueryClient();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [counterPriceReal, setCounterPriceReal] = useState("");
  const [counterMessage, setCounterMessage] = useState("");

  const { data: deals, isLoading } = useQuery({
    queryKey: ["user-deals"],
    queryFn: () => getDealsByUser(),
  });

  const respondMutation = useMutation({
    mutationFn: respondToDealProposal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-deals"] });
      toast.success("Resposta à proposta enviada com sucesso!");
      setSelectedDealId(null);
      setCounterPriceReal("");
      setCounterMessage("");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao responder proposta.");
    },
  });

  const handleAction = (dealId: string, action: "accept" | "reject" | "counter_proposal") => {
    if (action === "counter_proposal") {
      const counterCents = counterPriceReal
        ? Math.round(parseFloat(counterPriceReal.replace(/\D/g, "")) || 0)
        : undefined;
      if (!counterCents) {
        toast.error("Informe o valor da contraproposta.");
        return;
      }
      respondMutation.mutate({
        data: {
          dealId,
          action: "counter_proposal",
          counterPriceCents: counterCents,
          message: counterMessage.trim() || undefined,
        },
      });
    } else {
      respondMutation.mutate({
        data: {
          dealId,
          action,
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Handshake className="size-5 text-primary" />
            <span>Negociações & Propostas</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Acompanhe propostas recebidas e enviadas, faça contrapropostas e emita contratos.
          </p>
        </div>
      </div>

      {/* ── Lista de Negociações ─────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs">Carregando negociações...</p>
        </div>
      ) : deals && deals.length > 0 ? (
        <div className="space-y-4">
          {deals.map((deal: any) => {
            const status = STATUS_CONFIG[deal.status] || { label: deal.status, variant: "outline" };
            const isNegotiating = deal.status === "negotiating";
            const isAccepted = deal.status === "accepted";
            const isCountering = selectedDealId === deal.id;

            return (
              <div
                key={deal.id}
                className="border border-border bg-card rounded-2xl p-5 shadow-2xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={status.variant}
                        className="text-[10px] font-bold uppercase tracking-wider"
                      >
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(deal.updated_at)}
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-foreground">
                      {deal.classified?.title || "Negociação Direta"}
                    </h2>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      Valor da Proposta
                    </span>
                    <span className="text-xl font-black text-primary font-mono">
                      {formatMoney(deal.proposed_price_cents)}
                    </span>
                  </div>
                </div>

                {/* Detalhes da Proposta */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/60">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Comprador</span>
                    <span className="font-semibold">{deal.buyer?.full_name || "Membro"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Vendedor</span>
                    <span className="font-semibold">{deal.seller?.full_name || "Membro"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Condições</span>
                    <span className="font-semibold">
                      {deal.installments_count > 1
                        ? `${deal.installments_count}x parcelas`
                        : "À vista"}
                    </span>
                  </div>
                </div>

                {deal.terms && (
                  <p className="text-xs text-foreground/80 bg-background p-3 rounded-xl border border-border/80 leading-relaxed">
                    <strong className="text-foreground">Termos propostos:</strong> {deal.terms}
                  </p>
                )}

                {/* Ações de Negociação */}
                {isNegotiating && !isCountering && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleAction(deal.id, "accept")}
                      disabled={respondMutation.isPending}
                      className="rounded-xl text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <CheckCircle2 className="size-3.5" />
                      <span>Aceitar Proposta</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedDealId(deal.id)}
                      disabled={respondMutation.isPending}
                      className="rounded-xl text-xs font-semibold gap-1.5"
                    >
                      <DollarSign className="size-3.5 text-primary" />
                      <span>Fazer Contraproposta</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(deal.id, "reject")}
                      disabled={respondMutation.isPending}
                      className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="size-3.5" />
                      <span>Recusar</span>
                    </Button>
                  </div>
                )}

                {/* Form de Contraproposta */}
                {isCountering && (
                  <div className="border border-primary/30 bg-primary/5 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                      Enviar Contraproposta
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">
                          Novo Valor (R$)
                        </label>
                        <Input
                          value={counterPriceReal}
                          onChange={(e) => setCounterPriceReal(e.target.value)}
                          placeholder="Ex: 1.200,00"
                          className="h-9 rounded-xl text-xs bg-background font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-foreground">
                          Mensagem / Justificativa
                        </label>
                        <Input
                          value={counterMessage}
                          onChange={(e) => setCounterMessage(e.target.value)}
                          placeholder="Ex: Consigo fechar por esse valor com retirada hoje..."
                          className="h-9 rounded-xl text-xs bg-background"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => handleAction(deal.id, "counter_proposal")}
                        disabled={respondMutation.isPending}
                        className="rounded-xl text-xs font-bold gap-1.5"
                      >
                        {respondMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <ArrowRight className="size-3.5" />
                        )}
                        <span>Enviar Contraproposta</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedDealId(null)}
                        className="rounded-xl text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                {/* Se a proposta foi aceita, exibir botão para gerar contrato ou quitação */}
                {isAccepted && (
                  <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">Negociação Aceita!</p>
                        <p className="text-[11px] text-muted-foreground">
                          Vocês podem formalizar um contrato digital com assinatura eletrônica e
                          registro de parcelas.
                        </p>
                      </div>
                    </div>

                    {deal.classified && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs font-bold shrink-0"
                      >
                        <Link to="/classificados/$id" params={{ id: deal.classified.id }}>
                          <Tag className="size-3.5 mr-1.5" />
                          <span>Ver Anúncio</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-dashed border-border bg-card/60 rounded-2xl p-10 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Handshake className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">Nenhuma negociação em andamento</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Quando você enviar uma proposta para um anúncio ou receber uma oferta nos seus
            classificados, ela aparecerá aqui.
          </p>
          <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 mt-2">
            <Link to="/mercado">
              <Tag className="size-4" />
              <span>Explorar Anúncios</span>
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
