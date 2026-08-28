import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { getCustomerChatThread, sendCustomerChatMessage } from "@/services/chat.functions";
import { getBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Send, AlertTriangle, Package, ShieldCheck, Image as ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/datetime";
import { OrderMessageCard } from "@/components/chat/order-message-card";
import { RmaTicketModal } from "@/components/chat/rma-ticket-modal";
import { RmaMessageCard } from "@/components/chat/rma-message-card";

export const Route = createFileRoute("/_store/conta/conversas/$id")({
  head: () => ({ meta: [{ title: "Atendimento & SAC | Jah" }] }),
  loader: async ({ params }) => {
    const res = await getCustomerChatThread({ data: { threadId: params.id } });
    return res;
  },
  component: CustomerChatPage,
});

const STATUS_LABELS: Record<string, string> = {
  open: "Em Atendimento",
  pending: "Aguardando Loja",
  resolved: "Resolvido",
  closed: "Encerrado",
};

function CustomerChatPage() {
  const { thread, messages: initialMessages, tickets: initialTickets } = Route.useLoaderData();
  const { id } = Route.useParams();
  const [messages, setMessages] = useState<any[]>(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [rmaModalOpen, setRmaModalOpen] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Normalize store and order from joined relations
  const rawStore: any = thread.store;
  const storeData: any = Array.isArray(rawStore) ? rawStore[0] : rawStore;

  const rawOrder: any = thread.order;
  const orderData: any = Array.isArray(rawOrder) ? rawOrder[0] : rawOrder;

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    if (!id) return;

    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`customer-chat-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${id}`,
        },
        (payload) => {
          const newMsg = {
            id: payload.new.id,
            message: payload.new.message,
            message_type: payload.new.message_type || "text",
            isStaffReply: payload.new.is_staff_reply,
            createdAt: payload.new.created_at,
            attachments: payload.new.attachments || [],
            payload: payload.new.payload || {},
          };
          setMessages((prev: any[]) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          getCustomerChatThread({ data: { threadId: id } })
            .then((res) => {
              if (res?.messages) setMessages(res.messages);
            })
            .catch(console.error);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    const sent = text;
    setText("");
    setIsSending(true);

    const optimistic = {
      id: crypto.randomUUID(),
      message: sent,
      message_type: "text",
      isStaffReply: false,
      createdAt: new Date().toISOString(),
      attachments: [],
      payload: {},
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendCustomerChatMessage({
        data: {
          threadId: id,
          message: sent,
          message_type: "text",
        },
      });
    } catch (err) {
      toast.error("Erro ao enviar mensagem.");
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(sent);
    } finally {
      setIsSending(false);
    }
  };

  const isClosed = thread.status === "closed" || thread.status === "resolved";

  return (
    <section className="flex flex-col h-[calc(100vh-120px)] min-h-[500px] max-w-4xl mx-auto font-sans text-foreground">
      {/* Header com Loja e Ações de Pedido/SAC */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/80 bg-background sticky top-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl size-9 shrink-0 border border-border/60"
            asChild
          >
            <Link to="/conta/suporte" aria-label="Voltar para Suporte">
              <ChevronLeft className="size-5" />
            </Link>
          </Button>

          <div className="flex items-center gap-2.5 min-w-0">
            {storeData?.logo_url ? (
              <img
                src={storeData.logo_url}
                alt={storeData.name}
                className="size-9 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                {(storeData?.name || "L")[0]}
              </div>
            )}

            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                {storeData?.name || thread.subject || "Atendimento"}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {orderData ? `Pedido #${orderData.id.slice(0, 8)} • ` : ""}
                Aberta em {formatDate(thread.created_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Botão de SAC / Troca se tiver pedido vinculado */}
          {thread.store_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRmaModalOpen(true)}
              className="h-8 text-xs font-bold rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hidden sm:flex"
            >
              <AlertTriangle className="size-3.5 mr-1.5" />
              Solicitar Troca / Ajuda
            </Button>
          )}

          <Badge
            variant={isClosed ? "secondary" : "default"}
            className="text-[10px] uppercase font-bold"
          >
            {STATUS_LABELS[thread.status] ?? thread.status}
          </Badge>
        </div>
      </div>

      {/* Cartão Fixo de Pedido no Topo se a thread for de um pedido específico */}
      {orderData && (
        <div className="pt-2 px-1">
          <OrderMessageCard
            order={orderData}
            onOpenRmaModal={() => setRmaModalOpen(true)}
            isStaff={false}
          />
        </div>
      )}

      {/* Timeline de Mensagens */}
      <div
        ref={chatContainerRef}
        className="flex-1 space-y-3.5 overflow-y-auto py-4 px-1 scrollbar-thin"
      >
        {messages.length === 0 && (
          <div className="text-center py-12 text-muted-foreground space-y-2">
            <ShieldCheck className="size-10 mx-auto text-primary/40" />
            <p className="text-xs font-medium">Conversa segura e criptografada com a loja.</p>
            <p className="text-[11px]">Envie uma mensagem abaixo para falar com o atendimento.</p>
          </div>
        )}

        {messages.map((msg) => {
          const isStaff = msg.isStaffReply;

          // Se for card de pedido
          if (msg.message_type === "order_card" && (msg.payload?.order || orderData)) {
            return (
              <div
                key={msg.id}
                className={`flex ${isStaff ? "justify-start" : "justify-end"} w-full`}
              >
                <OrderMessageCard
                  order={msg.payload?.order || orderData}
                  onOpenRmaModal={() => setRmaModalOpen(true)}
                  isStaff={false}
                />
              </div>
            );
          }

          // Se for card de ticket de troca / SAC
          if (msg.message_type === "rma_ticket" && msg.payload?.ticket_id) {
            return (
              <div
                key={msg.id}
                className={`flex ${isStaff ? "justify-start" : "justify-end"} w-full`}
              >
                <RmaMessageCard payload={msg.payload} isStaff={false} />
              </div>
            );
          }

          // Mensagem de texto padrão
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  isStaff
                    ? "bg-card border border-border/80 text-foreground rounded-tl-xs"
                    : "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.message}</p>

                {/* Anexos de imagem */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex gap-1.5 overflow-x-auto">
                    {msg.attachments.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img
                          src={url}
                          alt="Anexo"
                          className="size-16 rounded-xl object-cover border border-white/20"
                        />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-muted-foreground mt-1 px-1">
                {isStaff ? (storeData?.name || "Equipe") : "Você"} • {formatDate(msg.createdAt)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Input de Mensagem */}
      {!isClosed ? (
        <form
          onSubmit={handleSend}
          className="p-2 border-t border-border/80 bg-background flex items-center gap-2"
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setRmaModalOpen(true)}
            className="size-10 rounded-xl text-destructive hover:bg-destructive/10 shrink-0"
            title="Solicitar Troca ou Devolução"
          >
            <AlertTriangle className="size-4" />
          </Button>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite sua mensagem para a loja..."
            className="flex-1 h-10 rounded-xl text-xs bg-card border-border/80"
            disabled={isSending}
          />

          <Button
            type="submit"
            size="icon"
            disabled={!text.trim() || isSending}
            className="size-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
          >
            {isSending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </form>
      ) : (
        <div className="p-3 bg-muted/40 border-t border-border/80 text-center text-xs text-muted-foreground font-medium rounded-b-2xl">
          Este atendimento foi encerrado.
        </div>
      )}

      {/* Modal de Abertura de Ticket SAC / RMA */}
      <RmaTicketModal
        open={rmaModalOpen}
        onOpenChange={setRmaModalOpen}
        threadId={id}
        storeId={thread.store_id}
        orderId={thread.order_id || undefined}
        onTicketCreated={() => {
          getCustomerChatThread({ data: { threadId: id } }).then((res) => {
            if (res?.messages) setMessages(res.messages);
          });
        }}
      />
    </section>
  );
}
