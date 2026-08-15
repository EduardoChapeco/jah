import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ChevronLeft,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Package,
  Wrench,
  Box,
  Hash,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  getQuoteDetail,
  updateQuoteStatus,
  approveQuote,
  addQuoteMessage,
  type QuoteItemDTO,
  type QuoteMessageDTO,
} from "@/services/quotes.functions";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/orcamentos/$id")({
  head: () => ({ meta: [{ title: "Detalhe do Orçamento — JAH Workspace" }] }),
  loader: async ({ params }) => {
    const data = await getQuoteDetail({ data: { quote_id: params.id } });
    return { quote: data };
  },
  component: QuoteDetailPage,
});

const ITEM_TYPE_ICON: Record<string, any> = {
  product_variant: Package,
  service: Wrench,
  rental_equipment: Box,
  manual_item: Hash,
};

function QuoteDetailPage() {
  const { quote: initial } = Route.useLoaderData();
  const params = Route.useParams();
  const qc = useQueryClient();

  const { data: quote, isLoading } = useQuery({
    queryKey: ["quote-detail", params.id],
    queryFn: () => getQuoteDetail({ data: { quote_id: params.id } }),
    initialData: initial,
    staleTime: 30_000,
  });

  const [messageText, setMessageText] = useState("");
  const [isInternal, setIsInternal] = useState(false);

  const sendMessage = useMutation({
    mutationFn: () =>
      addQuoteMessage({
        data: { quote_id: params.id, body: messageText, is_internal: isInternal },
      }),
    onSuccess: () => {
      setMessageText("");
      qc.invalidateQueries({ queryKey: ["quote-detail", params.id] });
      toast.success("Mensagem enviada.");
    },
    onError: () => toast.error("Erro ao enviar mensagem."),
  });

  const changeStatus = useMutation({
    mutationFn: (status: "sent" | "negotiating" | "rejected") =>
      updateQuoteStatus({ data: { quote_id: params.id, status } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quote-detail", params.id] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Status atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar status."),
  });

  const handleApprove = useMutation({
    mutationFn: () => approveQuote({ data: { quote_id: params.id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quote-detail", params.id] });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Orçamento aprovado!");
    },
    onError: (e: any) => toast.error(e?.message ?? "Erro ao aprovar orçamento."),
  });

  if (isLoading || !quote) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isDraft = quote.status === "draft";
  const isSent = quote.status === "sent" || quote.status === "negotiating";
  const isTerminal = ["approved", "rejected", "expired", "converted"].includes(quote.status);

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          to="/workspace/orcamentos"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="size-4" />
          Orçamentos
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-medium">{quote.quote_number}</span>
        <Badge variant={isTerminal ? "default" : "secondary"} className="ml-2 text-xs">
          {quote.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Coluna principal */}
        <div className="flex flex-col gap-4">
          {/* Cabeçalho */}
          <div className="border border-border rounded-lg p-5 bg-background">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-bold text-foreground">{quote.quote_number}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {quote.customer_name ?? quote.customer_email ?? "Cliente não identificado"}
                  {quote.customer_phone && ` · ${quote.customer_phone}`}
                </p>
                {quote.valid_until && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Válido até {new Date(quote.valid_until).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
              {/* Ações de status */}
              {!isTerminal && (
                <div className="flex gap-2 flex-wrap">
                  {isDraft && (
                    <Button
                      size="sm"
                      onClick={() => changeStatus.mutate("sent")}
                      disabled={changeStatus.isPending}
                    >
                      <Send className="size-4 mr-1.5" />
                      Enviar ao Cliente
                    </Button>
                  )}
                  {isSent && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove.mutate()}
                        disabled={handleApprove.isPending}
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-danger hover:text-danger hover:bg-danger/10 border-danger/30"
                        onClick={() => changeStatus.mutate("rejected")}
                        disabled={changeStatus.isPending}
                      >
                        <XCircle className="size-4 mr-1.5" />
                        Recusar
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {quote.conditions && (
              <div className="p-3 bg-muted/40 rounded-xl text-sm text-muted-foreground">
                <strong className="text-foreground text-xs uppercase tracking-wide">
                  Condições:
                </strong>
                <p className="mt-1">{quote.conditions}</p>
              </div>
            )}
          </div>

          {/* Itens do orçamento */}
          <div className="border border-border rounded-lg overflow-hidden bg-background">
            <div className="px-5 py-3 border-b border-border bg-muted/20">
              <h2 className="text-sm font-semibold text-foreground">Itens</h2>
            </div>
            <div className="divide-y divide-border">
              {quote.items.map((item: QuoteItemDTO) => {
                const Icon = ITEM_TYPE_ICON[item.item_type] ?? Hash;
                return (
                  <div key={item.id} className="flex items-start gap-4 px-5 py-3">
                    <div className="size-8 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                      {item.scheduled_start && (
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(item.scheduled_start).toLocaleString("pt-BR")}
                          {item.duration_minutes && ` · ${item.duration_minutes} min`}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-foreground">
                        {formatMoney(item.total_cents)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity}× {formatMoney(item.unit_price_cents)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Totais */}
            <div className="px-5 py-3 border-t border-border bg-muted/20 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatMoney(quote.subtotal_cents)}</span>
              </div>
              {quote.discount_cents > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Desconto</span>
                  <span className="font-medium text-success">
                    −{formatMoney(quote.discount_cents)}
                  </span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(quote.total_cents)}</span>
              </div>
            </div>
          </div>

          {/* Chat de negociação */}
          <div className="border border-border rounded-lg overflow-hidden bg-background">
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Histórico de Negociação</h2>
            </div>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {quote.messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma mensagem ainda.
                </p>
              )}
              {quote.messages.map((msg: QuoteMessageDTO) => (
                <div
                  key={msg.id}
                  className={cn(
                    "p-3 rounded-lg text-sm",
                    msg.is_internal
                      ? "bg-warning/10 border border-warning/20"
                      : "bg-muted/30 border border-border",
                  )}
                >
                  {msg.is_internal && (
                    <span className="text-xs font-medium text-warning block mb-1">
                      Nota interna
                    </span>
                  )}
                  <p className="text-foreground">{msg.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(msg.created_at)}
                  </p>
                </div>
              ))}
            </div>
            {!isTerminal && (
              <div className="p-4 border-t border-border">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  rows={3}
                  className="w-full p-3 text-sm bg-muted/30 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded"
                    />
                    Nota interna (não visível ao cliente)
                  </label>
                  <Button
                    size="sm"
                    onClick={() => sendMessage.mutate()}
                    disabled={!messageText.trim() || sendMessage.isPending}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <aside className="flex flex-col gap-4">
          <div className="border border-border rounded-lg p-4 bg-background">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Resumo
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Número</span>
                <span className="font-mono font-medium">{quote.quote_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary" className="text-xs">
                  {quote.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span>v{quote.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado</span>
                <span>{formatRelativeTime(quote.created_at)}</span>
              </div>
              {quote.approved_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Aprovado</span>
                  <span>{new Date(quote.approved_at).toLocaleDateString("pt-BR")}</span>
                </div>
              )}
              {quote.converted_order_id && (
                <div className="pt-2">
                  <Link
                    to="/workspace/pedidos/$id"
                    params={{ id: quote.converted_order_id }}
                    className="flex items-center justify-between p-2 bg-success/10 border border-success/20 rounded-xl text-xs text-success hover:bg-success/15 transition-colors"
                  >
                    <span>Ver Pedido Gerado</span>
                    <ChevronLeft className="size-3 rotate-180" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {quote.internal_notes && (
            <div className="border border-warning/20 bg-warning/5 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-warning uppercase tracking-wide mb-2">
                Notas Internas
              </h3>
              <p className="text-sm text-foreground">{quote.internal_notes}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// Helper importado localmente para evitar import circular
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}
