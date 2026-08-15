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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listQuotes, type QuoteSummaryDTO } from "@/services/quotes.functions";
import { formatMoney } from "@/lib/money";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/orcamentos/")({
  head: () => ({ meta: [{ title: "Orçamentos — JAH Workspace" }] }),
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
    <Badge variant={cfg.variant} className="gap-1.5 text-xs font-medium">
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
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">
            Propostas e orçamentos enviados aos clientes
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/workspace/orcamentos/novo">
            <Plus className="size-4 mr-1.5" />
            Novo Orçamento
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Buscar por número, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-muted/40 border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 border-b border-border mb-4 overflow-x-auto pb-px">
        {STATUS_TABS.map((tab) => (
          <button
            key={String(tab.key)}
            onClick={() => setStatusFilter(tab.key as any)}
            className={cn(
              "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
              statusFilter === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
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
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText className="size-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-foreground">Nenhum orçamento encontrado.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Crie o primeiro orçamento para um cliente.
          </p>
          <Button asChild size="sm" className="mt-4">
            <Link to="/workspace/orcamentos/novo">
              <Plus className="size-4 mr-1.5" />
              Novo Orçamento
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && !isError && quotes.length > 0 && (
        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
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
      className="flex items-center gap-4 px-4 py-3 bg-background hover:bg-muted/40 transition-colors group"
    >
      {/* Número e cliente */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold text-foreground">{quote.quote_number}</span>
          <StatusBadge status={quote.status} />
          {isExpiring && (
            <span className="text-xs text-warning font-medium flex items-center gap-1">
              <AlertTriangle className="size-3" />
              Vence em breve
            </span>
          )}
        </div>
        <p className="text-[13px] text-muted-foreground truncate">
          {quote.customer_name ?? quote.customer_email ?? "Cliente não identificado"}
          {" · "}
          {quote.item_count} {quote.item_count === 1 ? "item" : "itens"}
        </p>
      </div>

      {/* Valor */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{formatMoney(quote.total_cents)}</p>
        <p className="text-xs text-muted-foreground">{formatRelativeTime(quote.updated_at)}</p>
      </div>

      <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </Link>
  );
}
