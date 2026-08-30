import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { listQuotes, type QuoteSummaryDTO } from "@/services/quotes.functions";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/orcamentos/")({
  head: () => ({ meta: [{ title: "Orçamentos | Workspace Wider" }] }),
  loader: async () => {
    const res = await listQuotes({ data: { limit: 30 } });
    return { initialData: res };
  },
  component: QuotesListPage,
});

// ---- Status config ----
const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }
> = {
  draft: { label: "Rascunho", variant: "outline", icon: FileText },
  sent: { label: "Enviado", variant: "secondary", icon: Send },
  negotiating: { label: "Negociando", variant: "secondary", icon: Clock },
  approved: { label: "Aprovado", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Recusado", variant: "destructive", icon: XCircle },
  expired: { label: "Expirado", variant: "destructive", icon: AlertTriangle },
  converted: { label: "Convertido", variant: "default", icon: CheckCircle2 },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: "outline", icon: FileText };
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
  { key: "expired", label: "Expirados" },
] as const;

function QuotesListPage() {
  const { initialData } = Route.useLoaderData();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["quotes", statusFilter, search],
    queryFn: () =>
      listQuotes({ data: { status: statusFilter as any, search: search || undefined, limit: 30 } }),
    initialData: statusFilter === undefined && !search ? initialData : undefined,
    staleTime: 30_000,
  });

  const quotes = data?.items ?? [];

  return (
    <div className="space-y-6">
      {/* ── PageHeader Canônico ── */}
      <PageHeader
        eyebrow="Vendas & Logística"
        title="Orçamentos"
        actions={
          <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground">
            <Link to="/workspace/orcamentos/novo">
              <Plus className="size-3.5" />
              Novo Orçamento
            </Link>
          </Button>
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
        <div className="flex items-center gap-3 p-4 bg-danger/5 border border-danger/20 rounded-xl text-sm text-danger">
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

      {!isLoading && !isError && quotes.length > 0 && (
        <div className="divide-y divide-border/60 bg-card border border-border/70 rounded-2xl overflow-hidden shadow-2xs">
          {quotes.map((q: QuoteSummaryDTO) => (
            <QuoteRow key={q.id} quote={q} />
          ))}
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
