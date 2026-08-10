import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  Bike, 
  PackageSearch,
  Maximize
} from "lucide-react";

import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/pedidos/gestor")({
  head: () => ({ meta: [{ title: "KDS - Gestor de Pedidos" }] }),
  loader: async () => {
    const res = await listOrders();
    // Filter only orders that make sense for the kitchen/fulfillment display
    return (res || []).filter((o: any) => 
      !["draft", "cancelled", "refunded"].includes(o.status)
    );
  },
  component: KDSPage,
});

function KDSPage() {
  const router = useRouter();
  const initialOrders = Route.useLoaderData();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Optional: Add auto-refresh polling here in the future
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const res = await updateOrderStatus({ data: { orderId, status: newStatus } });
    if (res?.id) {
      toast.success("Status atualizado!");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } else {
      toast.error("Erro ao atualizar o pedido");
    }
  };

  const columns = [
    {
      id: "paid",
      title: "Novos (Pendentes)",
      icon: <PackageSearch className="size-5" />,
      color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      nextStatus: "processing",
      nextLabel: "Iniciar Preparo",
    },
    {
      id: "processing",
      title: "Em Preparo",
      icon: <ChefHat className="size-5" />,
      color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      nextStatus: "shipped",
      nextLabel: "Pronto p/ Entrega",
    },
    {
      id: "shipped",
      title: "Aguardando Retirada",
      icon: <Bike className="size-5" />,
      color: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      nextStatus: "delivered",
      nextLabel: "Finalizar (Entregue)",
    },
    {
      id: "delivered",
      title: "Concluídos",
      icon: <CheckCircle2 className="size-5" />,
      color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      nextStatus: null,
      nextLabel: null,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-screen overflow-hidden text-foreground">
      {/* Topbar */}
      <header className="flex-none h-16 border-b border-border bg-card px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {!isFullscreen && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/admin/pedidos">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold">KDS / Gestor de Pedidos</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Atualizado em {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-2">
          <Maximize className="size-4" />
          {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        </Button>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto p-4 flex gap-4 bg-muted/30">
        {columns.map(col => {
          const colOrders = orders.filter(o => o.status === col.id).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          
          return (
            <div key={col.id} className="flex-shrink-0 w-[350px] flex flex-col gap-3 h-full">
              <div className={`rounded-xl border ${col.color} p-3 flex items-center justify-between shadow-op-sm bg-card`}>
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm">
                  {col.icon}
                  {col.title}
                </div>
                <Badge variant="secondary" className="font-mono text-sm">{colOrders.length}</Badge>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 pb-24">
                {colOrders.map(order => (
                  <div key={order.id} className="bg-card rounded-xl border border-border shadow-op-sm p-4 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground">#{order.id.split("-")[0].toUpperCase()}</span>
                        <h4 className="font-bold text-base leading-tight mt-1">{order.customer?.name || "Cliente Avulso"}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(order.created_at)}</p>
                      </div>
                      <Badge variant="outline" className="font-mono bg-background">
                        {formatMoney(order.total_cents)}
                      </Badge>
                    </div>

                    <div className="py-2 border-y border-border/50 text-sm space-y-1">
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <span className="font-medium">
                            <span className="text-primary font-bold mr-1">{item.qty}x</span>
                            {item.product?.title || "Item genérico"}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    {col.nextStatus && (
                      <Button 
                        className="w-full font-bold uppercase tracking-wider h-12 shadow-op-sm" 
                        onClick={() => handleStatusChange(order.id, col.nextStatus!)}
                      >
                        {col.nextLabel}
                      </Button>
                    )}
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground text-sm font-medium">
                    Nenhum pedido nesta fila
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
