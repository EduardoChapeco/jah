import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FileText,
  Plus,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  Loader2,
  Kanban,
  List,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { listQuotes, updateQuoteStatus, type QuoteSummaryDTO } from "@/services/quotes.functions";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/orcamentos/")({
  head: () => ({ meta: [{ title: "Orçamentos & Pipeline de Vendas | Workspace Wider" }] }),
  loader: async () => {
    const res = await listQuotes({ data: { limit: 50 } });
    return { initialData: res };
  },
  component: QuotesListPage,
});

// ---- Status config ----
const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any; color: string }
> = {
  draft: { label: "Rascunho", variant: "outline", icon: FileText, color: "border-border text-muted-foreground" },
  sent: { label: "Enviado", variant: "secondary", icon: Send, color: "border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10" },
  negotiating: { label: "Em Negociação", variant: "secondary", icon: Clock, color: "border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  approved: { label: "Aprovado", variant: "default", icon: CheckCircle2, color: "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  rejected: { label: "Recusado", variant: "destructive", icon: XCircle, color: "border-destructive/30 text-destructive bg-destructive/10" },
  expired: { label: "Expirado", variant: "destructive", icon: AlertTriangle, color: "border-destructive/30 text-destructive bg-destructive/10" },
  converted: { label: "Convertido em Pedido", variant: "default", icon: CheckCircle2, color: "border-primary/30 text-primary bg-primary/10" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "outline", icon: FileText, color: "" };
  const Icon = cfg.icon;
  return (
    <Badge variant={cfg.variant} className="gap-1.5 text-[10px] font-semibold rounded-lg px-2 py-0.5">
      <Icon className="size-3" />
      {cfg.label}
    </Badge>
  );
}

const STATUS_TABS = [
  { key: undefined, label: "Todos" },
  { key: "draft", label: "Rascunhos" },
  { key: "sent", label: "Enviados" },
  { key: "negotiating", label: "Negociando" },
  { key: "approved", label: "Aprovados" },
  { key: "rejected", label: "Recusados" },
] as const;

const KANBAN_COLUMNS = [
  { id: "draft", title: "Rascunhos & Leads", statuses: ["draft"] },
  { id: "sent", title: "Enviados", statuses: ["sent"] },
  { id: "negotiating", title: "Em Negociação", statuses: ["negotiating"] },
  { id: "won", title: "Ganhos / Fechados", statuses: ["approved", "converted"] },
];

function QuotesListPage() {
  const { initialData } = Route.useLoaderData();
  const [viewMode, setViewMode] = useState<"list" | "kanban">("kanban");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quotes", statusFilter, search],
    queryFn: () =>
      listQuotes({ data: { status: statusFilter as any, search: search || undefined, limit: 50 } }),
    initialData: statusFilter === undefined && !search ? initialData : undefined,
    staleTime: 30_000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (vars: { quote_id: string; status: "sent" | "negotiating" | "rejected" }) =>
      updateQuoteStatus({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Estágio do orçamento atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar estágio do orçamento.");
    },
  });

  const quotes = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* ── PageHeader Canônico ── */}
      <PageHeader
        eyebrow="Funil & Vendas"
        title="Orçamentos & Pipeline"
        actions={
          <div className="flex items-center gap-2">
            <div className="bg-muted/60 p-1 rounded-xl flex items-center gap-1">
              <Button
                variant={viewMode === "kanban" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("kanban")}
                className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1.5"
              >
                <Kanban className="size-3.5" />
                <span>Kanban</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-8 px-2.5 rounded-lg text-xs font-bold gap-1.5"
              >
                <List className="size-3.5" />
                <span>Lista</span>
              </Button>
            </div>
            <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground">
              <Link to="/workspace/orcamentos/novo">
                <Plus className="size-3.5" />
                <span>Novo Orçamento</span>
              </Link>
            </Button>
          </div>
        }
      />

      {/* ── Toolbar Unificada de Filtros & Busca ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card border border-border rounded-2xl px-4 py-3">
        <Tabs
          value={statusFilter || "all"}
          onValueChange={(val) => setStatusFilter(val === "all" ? undefined : val)}
        >
          <TabsList className="flex overflow-x-auto no-scrollbar h-8">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={String(tab.key || "all")}
                value={tab.key || "all"}
                className="text-xs shrink-0"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número, cliente..."
            className="pl-8 text-xs w-full rounded-xl h-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Conteúdo Principal ── */}
      {isLoading && (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="flex items-center gap-3 p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-sm text-destructive">
          <XCircle className="size-5 shrink-0" />
          Erro ao carregar orçamentos. Tente novamente.
        </div>
      )}

      {!isLoading && !isError && quotes.length === 0 && (
        <div className="py-12 text-center space-y-4 border border-dashed border-border/70 rounded-2xl bg-card/40">
          <div className="size-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground">
            <FileText className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">Nenhum orçamento encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Crie propostas e orçamentos para enviar a clientes e negociar pedidos.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold h-9">
            <Link to="/workspace/orcamentos/novo">
              <Plus className="size-3.5 mr-1" />
              Criar Primeiro Orçamento
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && quotes.length > 0 && viewMode === "list" && (
        <div className="divide-y divide-border/60 bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs">
          {quotes.map((q: QuoteSummaryDTO) => (
            <QuoteRow key={q.id} quote={q} />
          ))}
        </div>
      )}

      {!isLoading && !isError && quotes.length > 0 && viewMode === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {KANBAN_COLUMNS.map((col) => {
            const colQuotes = quotes.filter((q) => col.statuses.includes(q.status));
            const colTotalCents = colQuotes.reduce((acc, q) => acc + q.total_cents, 0);

            return (
              <div
                key={col.id}
                className="bg-muted/30 border border-border/60 rounded-2xl p-3 space-y-3 flex flex-col min-h-[420px]"
              >
                {/* Header da Coluna */}
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground">{col.title}</span>
                    <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 h-4">
                      {colQuotes.length}
                    </Badge>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">
                    {formatMoney(colTotalCents)}
                  </span>
                </div>

                {/* Cards da Coluna */}
                <div className="space-y-2.5 flex-1 overflow-y-auto">
                  {colQuotes.length === 0 ? (
                    <div className="h-32 border border-dashed border-border/40 rounded-xl flex items-center justify-center text-center p-3">
                      <span className="text-[11px] text-muted-foreground font-medium">Nenhum orçamento</span>
                    </div>
                  ) : (
                    colQuotes.map((q) => (
                      <div
                        key={q.id}
                        className="bg-card border border-border/70 rounded-xl p-3 shadow-2xs hover:border-primary/40 transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <Link
                            to="/workspace/orcamentos/$id"
                            params={{ id: q.id }}
                            className="font-mono text-xs font-bold text-primary hover:underline"
                          >
                            {q.quote_number}
                          </Link>
                          <StatusBadge status={q.status} />
                        </div>

                        <Link
                          to="/workspace/orcamentos/$id"
                          params={{ id: q.id }}
                          className="block"
                        >
                          <p className="text-xs font-semibold text-foreground truncate">
                            {q.customer_name || q.customer_email || "Cliente avulso"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {q.item_count} {q.item_count === 1 ? "item" : "itens"} • {formatRelativeTime(q.updated_at)}
                          </p>
                        </Link>

                        <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                          <span className="text-xs font-bold font-mono text-foreground">
                            {formatMoney(q.total_cents)}
                          </span>

                          {/* Ações de Avanço Rápido de Estágio */}
                          {q.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ quote_id: q.id, status: "sent" })}
                              className="h-6 px-2 text-[10px] font-bold rounded-lg gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10"
                            >
                              <span>Enviar</span>
                              <ArrowRight className="size-2.5" />
                            </Button>
                          )}
                          {q.status === "sent" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={updateStatusMutation.isPending}
                              onClick={() => updateStatusMutation.mutate({ quote_id: q.id, status: "negotiating" })}
                              className="h-6 px-2 text-[10px] font-bold rounded-lg gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            >
                              <span>Negociar</span>
                              <ArrowRight className="size-2.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuoteRow({ quote }: { quote: QuoteSummaryDTO }) {
  const isExpiring =
    quote.valid_until &&
    quote.status === "sent" &&
    new Date(quote.valid_until).getTime() - Date.now() < 48 * 60 * 60 * 1000;

  return (
    <Link
      to="/workspace/orcamentos/$id"
      params={{ id: quote.id }}
      className="flex items-center gap-4 px-4 py-3.5 bg-card hover:bg-muted/30 transition-colors group"
    >
      {/* Número e cliente */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono font-bold text-foreground">{quote.quote_number}</span>
          <StatusBadge status={quote.status} />
          {isExpiring && (
            <span className="text-[10px] text-warning font-medium flex items-center gap-1">
              <AlertTriangle className="size-3" />
              Vence em breve
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {quote.customer_name ?? quote.customer_email ?? "Cliente não identificado"}
          {" · "}
          {quote.item_count} {quote.item_count === 1 ? "item" : "itens"}
        </p>
      </div>

      {/* Valor */}
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-foreground font-mono">{formatMoney(quote.total_cents)}</p>
        <p className="text-[10px] text-muted-foreground">{formatRelativeTime(quote.updated_at)}</p>
      </div>

      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </Link>
  );
}
