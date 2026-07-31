import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Scan, CheckCircle, XCircle, Search, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getAdminEventById } from "@/services/events.functions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/events/$eventId/checkin")({
  head: () => ({ meta: [{ title: "Check-in de Evento — Admin" }] }),
  loader: async ({ params }) => {
    const event = await getAdminEventById({ data: params.eventId });
    return { event };
  },
  component: AdminEventCheckin,
});

function AdminEventCheckin() {
  const { event } = Route.useLoaderData();
  const [manualCode, setManualCode] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Fake state for demo since we haven't built the ticket purchase flow yet
  const [lastCheckin, setLastCheckin] = useState<{status: 'success' | 'error', message: string, name?: string, lotName?: string} | null>(null);

  const handleManualCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsProcessing(true);
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600));

    // Mock validation logic for demonstration
    if (manualCode.toLowerCase().startsWith("jah-")) {
      setLastCheckin({
        status: 'success',
        message: 'Ingresso Validado!',
        name: 'Maria Silva',
        lotName: 'Pista - Lote 1'
      });
      toast.success("Check-in realizado com sucesso.");
    } else {
      setLastCheckin({
        status: 'error',
        message: 'Ingresso Inválido ou já utilizado.',
      });
      toast.error("Erro na validação do ingresso.");
    }

    setManualCode("");
    setIsProcessing(false);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-md mx-auto w-full bg-background md:bg-muted/10 md:p-6 md:border-x">
      {/* Top Header Mobile-First */}
      <div className="flex items-center gap-4 p-4 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link to="/admin/events/$eventId" params={{ eventId: event.id }}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold tracking-tight truncate">Check-in Portaria</h1>
          <p className="text-muted-foreground text-xs truncate">
            {event.title}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-6">
        
        {/* Scanner Placeholder */}
        <Card className="border-2 border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center h-[280px]">
            <Scan className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="font-semibold text-lg mb-1">Câmera Inativa</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              A permissão de câmera é necessária para o escaneamento automático de QR Codes.
            </p>
            <Button variant="outline" className="mt-6 border-primary text-primary hover:bg-primary/5">
              Ativar Câmera
            </Button>
          </CardContent>
        </Card>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou digite o código
            </span>
          </div>
        </div>

        {/* Manual Checkin Form */}
        <form onSubmit={handleManualCheckin} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Ex: JAH-123456" 
              className="pl-9 font-mono uppercase"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={isProcessing || !manualCode.trim()}>
            Validar
          </Button>
        </form>

        {/* Result Area */}
        {lastCheckin && (
          <div className={`mt-4 p-4 rounded-xl border-2 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 ${
            lastCheckin.status === 'success' 
              ? 'border-green-500/50 bg-green-500/10' 
              : 'border-red-500/50 bg-red-500/10'
          }`}>
            {lastCheckin.status === 'success' ? (
              <CheckCircle className="h-12 w-12 text-green-500 mb-3" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500 mb-3" />
            )}
            
            <h2 className={`text-xl font-bold mb-1 ${lastCheckin.status === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
              {lastCheckin.message}
            </h2>
            
            {lastCheckin.status === 'success' && (
              <div className="mt-4 w-full flex flex-col items-center gap-2 border-t border-green-500/20 pt-4">
                <p className="font-medium text-foreground">{lastCheckin.name}</p>
                <Badge variant="outline" className="bg-background font-mono font-bold">
                  <Ticket className="h-3 w-3 mr-1" />
                  {lastCheckin.lotName}
                </Badge>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
