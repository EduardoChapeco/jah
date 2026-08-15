import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { getCustomerChatThread, sendCustomerChatMessage } from "@/services/chat.functions";
import { getBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/state/states";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Send } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "../lib/datetime";

export const Route = createFileRoute("/_store/conta/conversas/$id")({
  head: () => ({ meta: [{ title: "Suporte" }] }),
  loader: async ({ params }) => {
    const res = await getCustomerChatThread({ data: { threadId: params.id } });
    return res;
  },
  component: Page,
});

const STATUS_LABELS: Record<string, string> = {
  open: "Aberta",
  pending: "Aguardando resposta",
  resolved: "Resolvida",
  closed: "Encerrada",
};

function Page() {
  const { thread, messages: initialMessages } = Route.useLoaderData();
  const { id } = Route.useParams();
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!id) return;

    const supabase = getBrowserClient();
    const channel = supabase
      .channel("customer-chat-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${id}`,
        },
        (payload) => {
          // Map to local structure and add if not present
          const newMsg = {
            id: payload.new.id,
            message: payload.new.message,
            isStaffReply: payload.new.is_staff_reply,
            createdAt: payload.new.created_at,
          };
          setMessages((prev: any[]) => {
            if (
              prev.find(
                (m: any) =>
                  m.id === newMsg.id ||
                  (m.message === newMsg.message && m.createdAt === newMsg.createdAt),
              )
            )
              return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isSending) return;

    setIsSending(true);
    const optimistic = {
      id: crypto.randomUUID(),
      message: text,
      isStaffReply: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev: any[]) => [...prev, optimistic]);
    const sent = text;
    setText("");

    try {
      await sendCustomerChatMessage({ data: { threadId: id, message: sent } });
    } catch {
      toast.error("Erro ao enviar mensagem.");
      setMessages((prev: any[]) => prev.filter((m: any) => m.id !== optimistic.id));
      setText(sent);
    } finally {
      setIsSending(false);
    }
  };

  const isClosed = thread.status === "closed" || thread.status === "resolved";

  return (
    <section className="flex flex-col h-full min-h-[60vh] font-sans text-foreground">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6 border-b border-border pb-4">
        <Button
          variant="ghost"
          className="rounded-xl border border-border bg-white h-10 w-10 p-0 flex items-center justify-center text-foreground"
          asChild
        >
          <Link to="/conta/suporte" aria-label="Voltar">
            <ChevronLeft className="size-6" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-semibold font-black text-foreground uppercase truncate">
            {thread.subject || "Suporte"}
          </h2>
          <p className="text-sm font-medium text-foreground/70 font-mono mt-1">
            Aberta em {formatDate(thread.createdAt)}
          </p>
        </div>
        <span
          className={`px-3 py-1 font-black text-sm border border-border ${isClosed ? "bg-muted/30 text-foreground" : "bg-success text-white"}`}
        >
          {STATUS_LABELS[thread.status] ?? thread.status}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto pr-2 mb-6 max-h-[50vh] scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center p-10 border border-dashed border-border bg-background">
            <p className="text-lg font-bold text-foreground uppercase">Nenhuma mensagem ainda.</p>
            <p className="text-sm text-foreground/70 font-medium">
              Envie uma mensagem para a equipe.
            </p>
          </div>
        )}
        {messages.map((msg: any) => (
          <div
            key={msg.id}
            className={`flex ${msg.isStaffReply ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] px-5 py-3 border border-border ${msg.isStaffReply ? "bg-background rounded-xl rounded-br-2xl text-foreground" : "bg-primary text-primary-foreground rounded-xl rounded-bl-2xl"}`}
            >
              <p className="text-base font-medium leading-relaxed">{msg.message}</p>
              <p
                className={`text-xs mt-2 font-mono font-bold ${msg.isStaffReply ? "text-foreground/60" : "text-primary-foreground/70"}`}
              >
                {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {isClosed ? (
        <div className="border border-border bg-secondary p-4 text-center">
          <p className="font-semibold text-xl font-black uppercase text-foreground">
            Conversa Encerrada
          </p>
          <p className="text-sm text-foreground/80 font-medium">
            Abra um novo chamado de suporte se precisar de ajuda.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex gap-3">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva sua mensagem..."
            disabled={isSending}
            className="flex-1 h-14 border border-border rounded-xl bg-background font-medium focus-visible:ring-0 focus-visible:border-poster-red placeholder:text-foreground/40"
          />
          <Button
            type="submit"
            disabled={!text.trim() || isSending}
            className="h-14 w-14 rounded-xl bg-primary text-primary-foreground border border-border p-0 flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:-none"
            aria-label="Enviar"
          >
            <Send className="size-6" aria-hidden />
          </Button>
        </form>
      )}
    </section>
  );
}
