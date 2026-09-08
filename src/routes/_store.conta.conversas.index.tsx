import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { MessageCircle, Search, Store, ChevronRight, Package, PenSquare } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { listCustomerChatThreads } from "@/services/chat.functions";
import { formatRelativeTime } from "@/lib/datetime";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_store/conta/conversas/")(({
  head: () => ({ meta: [{ title: "Mensagens | Wider" }] }),
  loader: async () => {
    try {
      return (await listCustomerChatThreads().catch(() => [])) || [];
    } catch {
      return [];
    }
  },
  component: CustomerConversationsIndexPage,
} as any));

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string }
> = {
  open: { label: "Em aberto", dot: "bg-emerald-500" },
  pending: { label: "Aguardando", dot: "bg-amber-500" },
  resolved: { label: "Resolvido", dot: "bg-muted-foreground/40" },
  closed: { label: "Encerrado", dot: "bg-muted-foreground/20" },
};

const FILTER_TABS = [
  { id: "all", label: "Todas" },
  { id: "open", label: "Em aberto" },
  { id: "pending", label: "Aguardando" },
  { id: "resolved", label: "Resolvidas" },
];

function CustomerConversationsIndexPage() {
  const initialThreads = Route.useLoaderData();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const { data: threads } = useQuery({
    queryKey: ["customer-chat-threads"],
    queryFn: () => listCustomerChatThreads(),
    initialData: initialThreads,
    refetchInterval: 15000,
  });

  const filtered = useMemo(() => {
    if (!threads) return [];
    let list = threads as any[];
    if (activeFilter !== "all") list = list.filter((t: any) => t.status === activeFilter);
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t: any) =>
        t.store?.name?.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q) ||
        t.last_message?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [threads, activeFilter, searchQuery]);

  return (
    <div className="flex flex-col h-full min-h-[80vh] pb-20">
      {/* ── Header limpo estilo Direct/WhatsApp ── */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/40 shrink-0">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-base font-bold text-foreground">Mensagens</h1>
          <div className="flex items-center gap-1">
            <button
              id="btn-search-messages"
              onClick={() => setShowSearch((s) => !s)}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Buscar conversa"
            >
              <Search className="size-4" />
            </button>
            <button
              id="btn-new-message"
              onClick={() => navigate({ to: "/mercado" })}
              className="size-9 flex items-center justify-center rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Nova conversa"
            >
              <PenSquare className="size-4" />
            </button>
          </div>
        </div>

        {/* Campo de busca inline (aparece ao clicar no ícone) */}
        {showSearch && (
          <div className="px-4 pb-3">
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full h-9 px-3.5 rounded-xl text-xs bg-muted border-0 outline-none focus:ring-1 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        )}

        {/* Filtros tipo chips */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`filter-tab-${tab.id}`}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 h-7 px-3.5 rounded-full text-xs font-semibold transition-all ${
                activeFilter === tab.id
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Lista de Conversas ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 py-20 px-6 text-center gap-4">
          <MessageCircle className="size-9 text-muted-foreground/25" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {activeFilter !== "all" || searchQuery ? "Nenhuma conversa" : "Sem mensagens"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeFilter !== "all" || searchQuery
                ? "Tente outro filtro ou pesquisa."
                : "Entre em contato com uma loja para começar."}
            </p>
          </div>
          {activeFilter === "all" && !searchQuery && (
            <Button asChild size="sm" className="rounded-xl h-10 px-5 text-xs font-semibold">
              <Link to="/mercado">Explorar lojas</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {filtered.map((thread: any) => {
            const statusInfo = STATUS_CONFIG[thread.status] || STATUS_CONFIG.open;
            const store = thread.store;
            const hasUnread = thread.unread_count > 0;

            return (
              <Link
                key={thread.id}
                to="/conta/conversas/$id"
                params={{ id: thread.id }}
                className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/40 active:bg-muted/60 transition-colors cursor-pointer"
              >
                {/* Avatar */}
                <div className="relative size-11 rounded-full bg-muted border border-border/40 flex items-center justify-center overflow-hidden shrink-0">
                  {store?.logo_url ? (
                    <img src={store.logo_url} alt={store.name} className="size-full object-cover" />
                  ) : (
                    <Store className="size-5 text-muted-foreground" />
                  )}
                  {/* Dot de status */}
                  <span className={`absolute bottom-0 right-0 size-3 rounded-full border-2 border-background ${statusInfo.dot}`} />
                </div>

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className={`text-sm truncate ${hasUnread ? "font-bold text-foreground" : "font-semibold text-foreground/80"}`}>
                      {store?.name || "Loja Parceira"}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                      {formatRelativeTime(thread.last_message_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${hasUnread ? "text-foreground/80 font-medium" : "text-muted-foreground"}`}>
                      {thread.is_last_reply_staff ? "" : "Você: "}
                      {thread.last_message || thread.subject || "Conversa iniciada"}
                    </p>
                    {hasUnread && (
                      <span className="shrink-0 size-5 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                        {thread.unread_count > 9 ? "9+" : thread.unread_count}
                      </span>
                    )}
                    {thread.order_id && !hasUnread && (
                      <Package className="size-3.5 text-muted-foreground/50 shrink-0" />
                    )}
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
