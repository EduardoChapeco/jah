import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Filter,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { getStoreSettings } from "@/services/store.functions";
import {
  listSupportTickets,
  getSupportTicketDetails,
  createSupportTicket,
  addSupportTicketMessage,
  updateSupportTicketStatus,
  type SupportTicketItem,
  type SupportMessageItem,
  type TicketCategory,
  type TicketPriority,
  type TicketStatus,
} from "@/services/support-tickets.functions";

export const Route = createFileRoute("/workspace/suporte")({
  head: () => ({ meta: [{ title: "Central de Suporte | Workspace" }] }),
  loader: async () => {
    const store = await getStoreSettings().catch(() => null);
    const storeId = store?.id || "";
    const tickets = storeId
      ? await listSupportTickets({ data: { store_id: storeId } }).catch(() => [])
      : [];
    return { store, initialTickets: tickets };
  },
  component: WorkspaceSupportPage,
});

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  finance: "Financeiro & Taxas",
  system_bug: "Erro no Sistema",
  integration: "Integrações & Domínio",
  tourism: "Módulo Turismo / Excursões",
  account: "Conta & Acessos",
  other: "Outras Dúvidas",
};

const STATUS_LABELS: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: "Aberto", className: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  in_progress: { label: "Em Análise", className: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
  resolved: { label: "Resolvido", className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  closed: { label: "Encerrado", className: "bg-muted text-muted-foreground border-border" },
};

function WorkspaceSupportPage() {
  const { store, initialTickets } = (Route.useLoaderData as any)();
  const storeId = store?.id || "";

  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialTickets || []);
  const [statusFilter, setStatusFilter] = useState("all");

  // Novo Ticket Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("other");
  const [priority, setPriority] = useState<TicketPriority>("normal");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detalhe / Thread Drawer
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [activeTicket, setActiveTicket] = useState<SupportTicketItem | null>(null);
  const [threadMessages, setThreadMessages] = useState<SupportMessageItem[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const reloadTickets = async () => {
    if (!storeId) return;
    try {
      const data = await listSupportTickets({
        data: { store_id: storeId, status: statusFilter },
      });
      setTickets(data);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar chamados");
    }
  };

  const handleOpenTicketDetails = async (ticketId: string) => {
    try {
      setSelectedTicketId(ticketId);
      const data = await getSupportTicketDetails({ data: { ticket_id: ticketId } });
      setActiveTicket(data.ticket);
      setThreadMessages(data.messages);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao carregar detalhes do chamado");
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return toast.error("Informe o assunto do chamado");
    if (!message.trim()) return toast.error("Descreva sua solicitação");

    try {
      setSubmitting(true);
      await createSupportTicket({
        data: {
          store_id: storeId,
          subject: subject.trim(),
          category,
          priority,
          initial_message: message.trim(),
        },
      });

      toast.success("Chamado de suporte aberto!");
      setNewModalOpen(false);
      setSubject("");
      setMessage("");
      reloadTickets();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao abrir chamado");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicketId) return;

    try {
      setSendingReply(true);
      const newMsg = await addSupportTicketMessage({
        data: {
          ticket_id: selectedTicketId,
          message: replyText.trim(),
        },
      });

      setThreadMessages((prev) => [...prev, newMsg as any]);
      setReplyText("");
      toast.success("Resposta enviada!");
      reloadTickets();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar mensagem");
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicketId) return;
    try {
      await updateSupportTicketStatus({
        data: { ticket_id: selectedTicketId, status },
      });
      toast.success("Status atualizado!");
      if (activeTicket) {
        setActiveTicket({ ...activeTicket, status });
      }
      reloadTickets();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao atualizar status");
    }
  };

  // Contadores
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length;

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-24">
      {/* ── 1. Header & Ações ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
              Central de Ajuda & Suporte Técnico
            </h1>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 text-primary">
              <LifeBuoy className="size-3" /> SLA 24h
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Abra chamados para suporte da equipe de engenharia, dúvidas fiscais e melhorias na plataforma.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setNewModalOpen(true)}
          className="h-10 px-4 rounded-xl text-xs font-bold gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="size-3.5" /> Abrir Novo Chamado
        </Button>
      </div>

      {/* ── 2. Cards de Métricas ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1">
          <span className="text-xs font-semibold text-amber-700">Aguardando Análise</span>
          <p className="text-2xl font-extrabold text-amber-700 font-mono">{openCount}</p>
          <p className="text-[10px] text-amber-600">Chamados recém-abertos</p>
        </div>

        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 space-y-1">
          <span className="text-xs font-semibold text-sky-700">Em Atendimento</span>
          <p className="text-2xl font-extrabold text-sky-700 font-mono">{inProgressCount}</p>
          <p className="text-[10px] text-sky-600">Em resolução com a equipe</p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1">
          <span className="text-xs font-semibold text-emerald-700">Resolvidos</span>
          <p className="text-2xl font-extrabold text-emerald-700 font-mono">{resolvedCount}</p>
          <p className="text-[10px] text-emerald-600">Finalizados com sucesso</p>
        </div>
      </div>

      {/* ── 3. Lista de Tickets ── */}
      <div className="p-5 rounded-3xl bg-card border border-border/70 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Meus Chamados</h2>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant={statusFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                reloadTickets();
              }}
              className="h-8 px-2.5 rounded-lg text-xs cursor-pointer"
            >
              Todos
            </Button>
            <Button
              type="button"
              variant={statusFilter === "open" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("open");
                reloadTickets();
              }}
              className="h-8 px-2.5 rounded-lg text-xs cursor-pointer"
            >
              Abertos
            </Button>
            <Button
              type="button"
              variant={statusFilter === "resolved" ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter("resolved");
                reloadTickets();
              }}
              className="h-8 px-2.5 rounded-lg text-xs cursor-pointer"
            >
              Resolvidos
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {tickets.map((t) => {
            const st = STATUS_LABELS[t.status] || STATUS_LABELS.open;
            return (
              <div
                key={t.id}
                onClick={() => handleOpenTicketDetails(t.id)}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-border/60 bg-muted/10 hover:bg-muted/25 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MessageSquare className="size-4" />
                  </div>

                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-muted-foreground">
                        #{t.ticket_number}
                      </span>
                      <p className="text-xs sm:text-sm font-bold text-foreground truncate">
                        {t.subject}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{CATEGORY_LABELS[t.category]}</span>
                      <span>•</span>
                      <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant="outline" className={`text-[10px] border ${st.className}`}>
                    {st.label}
                  </Badge>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}

          {tickets.length === 0 && (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/70 text-xs text-muted-foreground">
              Nenhum chamado aberto. Caso precise de ajuda, clique em "Abrir Novo Chamado".
            </div>
          )}
        </div>
      </div>

      {/* ── 4. Modal de Novo Chamado ── */}
      <Dialog open={newModalOpen} onOpenChange={setNewModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-border/70 bg-card p-5 space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <LifeBuoy className="size-4 text-primary" />
              Novo Chamado de Suporte
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTicket} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Categoria *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground focus:outline-none"
              >
                <option value="tourism">Módulo Turismo / Excursões</option>
                <option value="finance">Financeiro & Pagamentos</option>
                <option value="system_bug">Bug / Erro Visual ou de Operação</option>
                <option value="integration">Integrações & Domínio Próprio</option>
                <option value="account">Acesso & Usuários</option>
                <option value="other">Outras Dúvidas</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Assunto *</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Dúvida sobre emissão de manifesto ANTT"
                className="h-10 text-xs rounded-xl"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Prioridade</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TicketPriority)}
                className="w-full h-10 px-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none"
              >
                <option value="low">Baixa</option>
                <option value="normal">Normal</option>
                <option value="high">Alta (Bloqueia operação)</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Mensagem Detalhada *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Descreva o que aconteceu ou o que precisa de suporte..."
                className="w-full h-28 p-3 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none resize-none"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="w-full h-10 rounded-xl text-xs font-bold cursor-pointer"
              >
                {submitting ? "Abrindo chamado..." : "Enviar Solicitação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 5. Drawer de Thread de Atendimento ── */}
      <Sheet open={Boolean(selectedTicketId)} onOpenChange={(open) => !open && setSelectedTicketId(null)}>
        <SheetContent className="sm:max-w-lg w-full flex flex-col p-6 space-y-4 bg-card border-border/80">
          <SheetHeader className="pb-3 border-b border-border/60">
            <SheetTitle className="text-base font-bold text-foreground flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary">
                  #{activeTicket?.ticket_number}
                </span>
                <span className="truncate max-w-xs">{activeTicket?.subject}</span>
              </div>
            </SheetTitle>

            {activeTicket && (
              <div className="flex items-center justify-between pt-2 text-xs">
                <Badge
                  variant="outline"
                  className={`text-[10px] ${STATUS_LABELS[activeTicket.status]?.className}`}
                >
                  {STATUS_LABELS[activeTicket.status]?.label}
                </Badge>

                {activeTicket.status !== "resolved" && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus("resolved")}
                    className="h-7 px-2 text-[11px] font-semibold gap-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    <CheckCircle2 className="size-3" /> Marcar como Resolvido
                  </Button>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Histórico de Mensagens */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {threadMessages.map((m) => (
              <div
                key={m.id}
                className={`p-3.5 rounded-2xl text-xs space-y-1 max-w-[85%] ${
                  m.is_staff_reply
                    ? "bg-primary/10 text-foreground border border-primary/20 ml-0 mr-auto"
                    : "bg-muted/40 text-foreground border border-border/60 ml-auto mr-0"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>{m.is_staff_reply ? "Equipe de Suporte" : "Você (Operador)"}</span>
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
              </div>
            ))}
          </div>

          {/* Input de Resposta */}
          <form onSubmit={handleSendReply} className="pt-2 border-t border-border/60 flex items-center gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Digite uma mensagem..."
              className="h-11 rounded-xl text-xs flex-1"
            />
            <Button
              type="submit"
              disabled={sendingReply || !replyText.trim()}
              className="size-11 rounded-xl shrink-0 cursor-pointer shadow-xs"
            >
              <Send className="size-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
