import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  Ticket,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { validateTicketCheckin, getEventWithLots } from "@/services/events.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/workspace/eventos/$id/checkin")({
  head: () => ({ meta: [{ title: "Portaria / Check-in de Ingressos — Wider" }] }),
  loader: async ({ params }) => {
    try {
      const event = await getEventWithLots({ data: { eventId: (params as any).id } });
      return { event };
    } catch {
      return { event: null };
    }
  },
  component: EventCheckinPage,
});

function EventCheckinPage() {
  const { event } = Route.useLoaderData() as any;
  const [ticketCode, setTicketCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<{
    success: boolean;
    name?: string;
    lotName?: string;
    message: string;
    timestamp: Date;
  } | null>(null);

  const [history, setHistory] = useState<
    Array<{
      code: string;
      name?: string;
      lotName?: string;
      success: boolean;
      time: string;
    }>
  >([]);

  const handleValidate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = ticketCode.trim();
    if (!code) return;

    setIsValidating(true);
    try {
      const res = await validateTicketCheckin({
        data: {
          eventId: event?.id || "",
          ticketCode: code,
        },
      });

      if (res.status === "success") {
        toast.success(`Check-in confirmado: ${res.name}`);
        setLastCheckin({
          success: true,
          name: res.name,
          lotName: res.lotName,
          message: "Ingresso Válido! Entrada Liberada.",
          timestamp: new Date(),
        });
        setHistory((prev) => [
          {
            code,
            name: res.name,
            lotName: res.lotName,
            success: true,
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 20),
        ]);
        setTicketCode("");
      }
    } catch (err: any) {
      const errMsg = err?.message || "Ingresso inválido ou não encontrado.";
      toast.error(errMsg);
      setLastCheckin({
        success: false,
        message: errMsg,
        timestamp: new Date(),
      });
      setHistory((prev) => [
        {
          code,
          success: false,
          time: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 20),
      ]);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Topbar Operacional */}
      <header className="h-16  bg-card px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/workspace">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold leading-tight truncate max-w-xs md:max-w-md">
                {event?.name || "Portaria & Check-in"}
              </h1>
              <Badge variant="secondary" className="text-[10px] font-mono uppercase font-bold">
                Ao Vivo
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">Validador Oficial de Ingressos</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 grid gap-6 md:grid-cols-12 items-start">
        {/* Lado Esquerdo: Scanner / Validador Rápido */}
        <div className="md:col-span-7 space-y-5">
          {/* Card de Leitura */}
          <div className="p-5 rounded-2xl  bg-card  space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="size-5 text-primary" />
                <h2 className="text-sm font-bold text-foreground">Validar Ingresso / QR Code</h2>
              </div>
              <Badge variant="outline" className="text-xs font-mono">
                Portaria 1
              </Badge>
            </div>

            <form onSubmit={handleValidate} className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  autoFocus
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Escaneie o QR Code ou digite o código do ingresso..."
                  className="pl-10 h-12 rounded-xl text-sm font-mono bg-background"
                  disabled={isValidating}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={isValidating || !ticketCode.trim()}
                  className="flex-1 h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Validando...
                    </>
                  ) : (
                    "Confirmar Entrada"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTicketCode("")}
                  className="h-11 rounded-xl px-4"
                  title="Limpar"
                >
                  <RefreshCw className="size-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Feedback Visual Imediato do Último Check-in */}
          {lastCheckin && (
            <div
              className={`p-5 rounded-2xl border transition-all animate-in fade-in zoom-in-95 ${
                lastCheckin.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              <div className="flex items-start gap-3.5">
                {lastCheckin.success ? (
                  <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="size-8 text-destructive shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 className="text-base font-bold leading-tight">{lastCheckin.message}</h3>
                  {lastCheckin.name && (
                    <div className="flex items-center gap-2 text-sm font-semibold pt-1">
                      <User className="size-4 opacity-70" />
                      <span>{lastCheckin.name}</span>
                    </div>
                  )}
                  {lastCheckin.lotName && (
                    <div className="flex items-center gap-2 text-xs opacity-80">
                      <Ticket className="size-3.5" />
                      <span>{lastCheckin.lotName}</span>
                    </div>
                  )}
                  <p className="text-[10px] opacity-60 pt-1">
                    Validado às {lastCheckin.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lado Direito: Histórico de Entradas Recentes */}
        <div className="md:col-span-5 p-5 rounded-2xl  bg-card  space-y-3">
          <div className="flex items-center justify-between  pb-3">
            <h3 className="text-sm font-bold text-foreground">Entradas Recentes</h3>
            <Badge variant="secondary" className="text-xs font-mono">
              {history.filter((h) => h.success).length} válidas
            </Badge>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {history.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhuma leitura realizada nesta sessão.
              </p>
            ) : (
              history.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    item.success
                      ? "border-border bg-background"
                      : "border-destructive/20 bg-destructive/5 text-destructive"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold truncate">{item.name || item.code}</p>
                    <p className="text-[10px] text-muted-foreground">{item.lotName || item.time}</p>
                  </div>
                  <Badge
                    variant={item.success ? "default" : "destructive"}
                    className="text-[9px] px-1.5 py-0 uppercase font-mono"
                  >
                    {item.success ? "OK" : "ERRO"}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
