import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";
import { MessagesSquare, Send, User, Store, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "../lib/datetime";
import { Badge } from "@/components/ui/badge";
import {
  getTicketThread,
  sendTicketMessage,
  listCustomerTickets,
} from "@/services/ticket.functions";

export const Route = createFileRoute("/_store/conta/suporte")({
  head: () => ({ meta: [{ title: "Meus Atendimentos" }] }),
  loader: async () => {
    return await listCustomerTickets();
  },
  component: CustomerSupportPage,
});

function CustomerSupportPage() {
  const tickets = Route.useLoaderData();
  const router = useRouter();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [thread, setThread] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  useEffect(() => {
    if (selectedTicketId) {
      loadThread(selectedTicketId);
    }
  }, [selectedTicketId]);

  const loadThread = async (id: string) => {
    setLoadingThread(true);
    try {
      const data = await getTicketThread({ data: { ticketId: id } });
      setThread(data);
    } catch (e: any) {
      toast.error(e.message || "Erro ao carregar atendimento");
      setSelectedTicketId(null);
    } finally {
      setLoadingThread(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedTicketId) return;

    setSending(true);
    try {
      await sendTicketMessage({
        data: { ticketId: selectedTicketId, content: message, isInternal: false },
      });
      setMessage("");
      await loadThread(selectedTicketId);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-[70vh]">
      <div className="flex items-center gap-2">
        <Link to="/conta" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <PageHeader
          title="Meus Atendimentos"
          description="Acompanhe suas solicitações de suporte, trocas e devoluções."
        />
      </div>

      <div className="flex-1 bg-card border overflow-hidden flex flex-col md:flex-row">
        {/* Ticket List - Responsive hide when a ticket is selected on mobile */}
        <div
          className={`w-full md:w-80 border-r bg-muted/10 flex flex-col ${selectedTicketId ? "hidden md:flex" : "flex"}`}
        >
          <div className="p-4 border-b font-medium flex items-center justify-between">
            Meus Chamados
          </div>
          <div className="flex-1 overflow-y-auto">
            {tickets.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center mt-10 p-4">
                Você ainda não possui nenhum atendimento aberto.
              </div>
            ) : (
              <div className="divide-y">
                {tickets.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicketId(t.id)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${selectedTicketId === t.id ? "bg-muted border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm truncate pr-2">{t.subject}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(t.updated_at)}
                      </span>
                      {t.status === "open" && (
                        <Badge variant="secondary" className="text-[10px]">
                          Aguardando Loja
                        </Badge>
                      )}
                      {t.status === "waiting_customer" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Sua Vez
                        </Badge>
                      )}
                      {t.status === "closed" && (
                        <Badge variant="outline" className="text-[10px]">
                          Resolvido
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div
          className={`flex-1 flex flex-col bg-background/50 relative ${!selectedTicketId ? "hidden md:flex" : "flex"}`}
        >
          {!selectedTicketId ? (
            <div className="flex-1 flex flex-col justify-center items-center p-6">
              <EmptyState
                title="Selecione um Chamado"
                description="Escolha um atendimento na lista para ver as mensagens."
              />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card flex justify-start items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedTicketId(null)}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                {loadingThread ? (
                  <div className="animate-pulse h-4 bg-muted rounded w-1/3"></div>
                ) : (
                  <h3 className="font-semibold truncate">
                    {tickets.find((t: any) => t.id === selectedTicketId)?.subject}
                  </h3>
                )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {thread?.messages
                  .filter((m: any) => !m.isInternal)
                  .map((m: any) => (
                    <div key={m.id} className={`flex ${m.isMe ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] md:max-w-[70%] p-3 ${m.isMe ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
                      >
                        <div className="flex items-center gap-2 mb-1 opacity-70">
                          {m.isMe ? <User className="w-3 h-3" /> : <Store className="w-3 h-3" />}
                          <span className="text-[10px] font-medium">
                            {m.isMe ? "Você" : "Equipe da Loja"}
                          </span>
                          <span className="text-[10px] ml-auto">
                            {new Date(m.createdAt).toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message Input */}
              {thread?.ticketStatus !== "closed" ? (
                <div className="p-3 md:p-4 border-t bg-card">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua resposta..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                      }}
                    />
                    <Button onClick={handleSend} disabled={sending || !message.trim()}>
                      <Send className="w-4 h-4" />
                      <span className="hidden md:inline ml-2">Enviar</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t bg-muted text-center text-sm text-muted-foreground">
                  Este atendimento foi encerrado.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
