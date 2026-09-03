import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  MessageSquare,
  MessageCircle,
  Store,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listCustomerChatThreads } from "@/services/chat.functions";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/_store/conta/conversas/")({
  head: () => ({ meta: [{ title: "Minhas Conversas & Atendimento — Wider" }] }),
  loader: async () => {
    return (await listCustomerChatThreads().catch(() => [])) || [];
  },
  component: CustomerConversationsIndexPage,
});

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }
> = {
  open: {
    label: "Em Atendimento",
    variant: "secondary",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  pending: {
    label: "Aguardando Loja",
    variant: "secondary",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  resolved: {
    label: "Resolvido",
    variant: "outline",
    className: "text-muted-foreground border-border/60",
  },
  closed: {
    label: "Encerrado",
    variant: "outline",
    className: "text-muted-foreground/60 border-border/40",
  },
};

function CustomerConversationsIndexPage() {
  const initialThreads = Route.useLoaderData();

  const { data: threads } = useQuery({
    queryKey: ["customer-chat-threads"],
    queryFn: () => listCustomerChatThreads(),
    initialData: initialThreads,
    refetchInterval: 15000,
  });

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 px-4 sm:px-0">
      {/* ── 1. Top Header Unificado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              to="/conta"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              Minha Conta
            </Link>
            <span className="text-xs text-muted-foreground">/</span>
            <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold tracking-wider">
              Conversas
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mensagens & Atendimento
          </h1>
          <p className="text-xs text-muted-foreground">
            Histórico de conversas com estabelecimentos, vendedores e chamados de suporte pós-venda.
          </p>
        </div>

        <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-9 px-4 cursor-pointer self-start sm:self-auto">
          <Link to="/mercado">Explorar Lojas</Link>
        </Button>
      </div>

      {/* ── 2. Lista de Conversas ou Empty State ── */}
      {!threads || threads.length === 0 ? (
        <div className="rounded-3xl border border-border/60 bg-card p-10 text-center space-y-4 max-w-lg mx-auto">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <MessageCircle className="size-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-foreground">Nenhuma conversa encontrada</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Quando você entrar em contato com uma loja, realizar uma compra ou solicitar suporte, suas mensagens aparecerão aqui em tempo real.
            </p>
          </div>
          <div className="pt-2">
            <Button asChild className="rounded-xl text-xs font-bold h-9 px-5">
              <Link to="/mercado">Explorar Estabelecimentos</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread: any) => {
            const statusInfo = STATUS_CONFIG[thread.status] || STATUS_CONFIG.open;
            const store = thread.store;
            const hasUnread = thread.unread_count > 0;

            return (
              <Link
                key={thread.id}
                to="/conta/conversas/$id"
                params={{ id: thread.id }}
                className={`group block p-4 rounded-2xl border transition-all cursor-pointer ${
                  hasUnread
                    ? "border-primary/50 bg-primary/5 hover:bg-primary/10 shadow-xs"
                    : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-4">
                  {/* Avatar da Loja + Textos */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <div className="size-11 rounded-xl bg-muted border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                      {store?.logo_url ? (
                        <img
                          src={store.logo_url}
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="size-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {store?.name || "Loja Parceira"}
                        </span>
                        <Badge
                          variant={statusInfo.variant}
                          className={`text-[10px] font-medium px-2 py-0.5 ${statusInfo.className}`}
                        >
                          {statusInfo.label}
                        </Badge>
                        {thread.order_id && (
                          <Badge variant="outline" className="text-[10px] font-mono gap-1 text-muted-foreground">
                            <Package className="size-3" />
                            <span>Pedido</span>
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-foreground/80 font-medium truncate">
                        {thread.subject || "Atendimento ao Cliente"}
                      </p>

                      <p className="text-xs text-muted-foreground truncate">
                        {thread.is_last_reply_staff ? (
                          <span className="font-semibold text-foreground/70">Loja: </span>
                        ) : (
                          <span className="font-semibold text-foreground/70">Você: </span>
                        )}
                        {thread.last_message || "Conversa iniciada"}
                      </p>
                    </div>
                  </div>

                  {/* Metadados Direitos: Data e Indicador */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground font-mono block">
                        {formatRelativeTime(thread.last_message_at)}
                      </span>
                      {hasUnread && (
                        <Badge variant="default" className="text-[10px] font-bold mt-1 bg-primary text-primary-foreground">
                          {thread.unread_count} nova(s)
                        </Badge>
                      )}
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all hidden sm:block" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CustomerConversationsIndexPage;
