import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { EmptyState } from "@/components/state/states";
import { MessagesSquare, Send, User, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { listAdminTickets, getTicketThread, sendTicketMessage } from "@/services/ticket.functions";

export const Route = createFileRoute("/admin/suporte")({
  head: () => ({ meta: [{ title: "Central de Suporte — Jah" }] }),
  loader: async () => {
    return await listAdminTickets();
  },
  component: SupportInboxPage,
});

function SupportInboxPage() {
  const tickets = Route.useLoaderData();
  const router = useRouter();

  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [thread, setThread] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
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
      toast.error(e.message || "Erro ao carregar mensagens");
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
        data: { ticketId: selectedTicketId, content: message, isInternal }
      });
      setMessage("");
      setIsInternal(false);
      // Reload thread
      await loadThread(selectedTicketId);
      router.invalidate(); // Refresh the sidebar
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar mensagem");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 h-[80vh] flex flex-col">
      <PageHeader
        title="Central de Suporte (Inbox)"
        description="Gerencie os tickets de atendimento e as mensagens de trocas e devoluções."
      />

      <div className="flex-1 bg-card border rounded-lg overflow-hidden flex">
        {/* Sidebar with ticket list */}
        <div className="w-80 border-r bg-muted/10 flex flex-col">
          <div className="p-4 border-b font-medium flex items-center justify-between">
            Fila de Atendimento
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {tickets.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
             {tickets.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center mt-10">
                  Nenhum ticket aberto.
                </div>
             ) : (
                <div className="divide-y">
                  {tickets.map((t: any) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTicketId(t.id)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedTicketId === t.id ? "bg-muted border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-sm truncate pr-2">{t.customerName}</span>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(t.updated_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mb-2">{t.subject}</p>
                      <div className="flex gap-2">
                        {t.status === "open" && <Badge variant="destructive" className="text-[10px]">Novo</Badge>}
                        {t.status === "waiting_customer" && <Badge variant="secondary" className="text-[10px]">Aguard. Cliente</Badge>}
                        {t.status === "closed" && <Badge variant="outline" className="text-[10px]">Resolvido</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-background/50 relative">
          {!selectedTicketId ? (
            <div className="flex-1 flex flex-col justify-center items-center p-6">
              <EmptyState
                title="Selecione um Ticket"
                description="Escolha uma conversa na lateral para iniciar o atendimento."
                icon={MessagesSquare}
              />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-card flex justify-between items-center">
                 {loadingThread ? (
                    <div className="animate-pulse flex gap-2 w-full">
                       <div className="h-4 bg-muted rounded w-1/3"></div>
                    </div>
                 ) : (
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        {tickets.find((t: any) => t.id === selectedTicketId)?.customerName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tickets.find((t: any) => t.id === selectedTicketId)?.subject}
                      </p>
                    </div>
                 )}
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {thread?.messages.map((m: any) => (
                  <div key={m.id} className={`flex ${m.isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg p-3 ${
                      m.isInternal 
                        ? 'bg-yellow-100 text-yellow-900 border border-yellow-200' 
                        : m.isMe 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-foreground'
                    }`}>
                      <div className="flex items-center gap-2 mb-1 opacity-70">
                        {m.isMe ? <ShieldAlert className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        <span className="text-[10px] font-medium">{m.senderName}</span>
                        {m.isInternal && <span className="text-[10px] uppercase font-bold">(Nota Interna)</span>}
                        <span className="text-[10px] ml-auto">
                          {new Date(m.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t bg-card">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-2">
                     <Checkbox 
                        id="internalNote" 
                        checked={isInternal} 
                        onCheckedChange={(c) => setIsInternal(!!c)} 
                     />
                     <label htmlFor="internalNote" className="text-xs text-muted-foreground cursor-pointer font-medium">
                       Marcar como Nota Interna (invisível para o cliente)
                     </label>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder={isInternal ? "Escreva uma nota interna..." : "Digite sua mensagem para o cliente..."}
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      onKeyDown={e => { if(e.key === 'Enter') handleSend() }}
                      className={isInternal ? "bg-yellow-50 border-yellow-200" : ""}
                    />
                    <Button onClick={handleSend} disabled={sending || !message.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
