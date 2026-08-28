import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo, useEffect, Fragment } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  CheckCircle2,
  Bike,
  PackageSearch,
  Maximize,
  Printer,
  FileText,
} from "lucide-react";

import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { getBrowserClient } from "@/lib/supabase";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/workspace/pedidos/gestor")({
  head: () => ({ meta: [{ title: "KDS - Gestor de Pedidos em Tempo Real" }] }),
  loader: async () => {
    const { getUserSession } = await import("@/services/auth.functions");
    const session = await getUserSession().catch(() => null);
    const storeId = session?.store_id;

    const res = await listOrders();
    // Filter only orders that make sense for the kitchen/fulfillment display
    const initialOrders = (res || []).filter((o: any) => !["draft", "cancelled", "refunded"].includes(o.status));
    
    return { initialOrders, storeId };
  },
  component: KDSPage,
});

function playOrderChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (e) {
    console.warn("Web Audio chime not supported:", e);
  }
}

function KDSPage() {
  const router = useRouter();
  const { initialOrders, storeId } = Route.useLoaderData();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    setAudioCtx(ctx);
    if (ctx.state === "running") setAudioUnlocked(true);
    
    const unlock = () => {
      if (ctx.state === "suspended") {
        ctx.resume().then(() => setAudioUnlocked(true));
      }
    };
    
    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  function playOrderChime() {
    if (!audioCtx || audioCtx.state !== "running") return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn("Web Audio chime not supported:", e);
    }
  }

  // Supabase Realtime WebSockets Listener
  useEffect(() => {
    if (!storeId) return;
    const supabase = getBrowserClient();
    const channel = supabase
      .channel("orders-kds-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `store_id=eq.${storeId}` },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            playOrderChime();
            toast.success(`🔔 Novo pedido #${(payload.new as any).id?.slice(0, 6)} recebido na cozinha!`);
            const newOrder = payload.new;
            if (!["draft", "cancelled", "refunded"].includes(newOrder.status)) {
              setOrders((prev) => {
                if (prev.some((o) => o.id === newOrder.id)) return prev;
                return [...prev, newOrder];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new;
            setOrders((prev) => {
              if (["draft", "cancelled", "refunded"].includes(updatedOrder.status)) {
                return prev.filter((o) => o.id !== updatedOrder.id);
              }
              const exists = prev.some((o) => o.id === updatedOrder.id);
              if (exists) {
                return prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
              } else {
                return [...prev, updatedOrder];
              }
            });
          }
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          // Catch-up sync: preenche gap de pedidos se o socket reconectar após queda
          try {
            const freshRes = await listOrders();
            const freshActive = (freshRes || []).filter((o: any) => !["draft", "cancelled", "refunded"].includes(o.status));
            setOrders(freshActive);
          } catch (err) {
            console.error("Erro ao sincronizar KDS:", err);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, audioCtx]);

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

  const handleStatusChange = async (e: React.MouseEvent, orderId: string, newStatus: string) => {
    e.stopPropagation(); // Previne abrir o detalhe ao clicar na ação rápida
    const res = await updateOrderStatus({ data: { orderId, status: newStatus as any } });
    if (res?.status === "ok") {
      toast.success("Status atualizado!");
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev: any) => ({ ...prev, status: newStatus }));
      }
    } else {
      toast.error("Erro ao atualizar o pedido");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    {
      id: "paid",
      title: "Novos (Pendentes)",
      icon: <PackageSearch className="size-5" />,
      color: "bg-info/10 text-info border-info/20",
      nextStatus: "processing",
      nextLabel: "Iniciar Preparo",
    },
    {
      id: "processing",
      title: "Em Preparo",
      icon: <ChefHat className="size-5" />,
      color: "bg-warning/10 text-warning border-warning/20",
      nextStatus: "shipped",
      nextLabel: "Pronto p/ Entrega",
    },
    {
      id: "shipped",
      title: "Aguardando Retirada",
      icon: <Bike className="size-5" />,
      color: "bg-secondary text-secondary-foreground border-border",
      nextStatus: "delivered",
      nextLabel: "Finalizar (Entregue)",
    },
    {
      id: "delivered",
      title: "Concluídos",
      icon: <CheckCircle2 className="size-5" />,
      color: "bg-success/10 text-success border-success/20",
      nextStatus: null,
      nextLabel: null,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col h-screen overflow-hidden text-foreground">
      {/* Estilos de Impressão (Bobina 80mm) */}
      <style>{`
 @media print {
 body * {
 visibility: hidden;
 }
 #printable-receipt, #printable-receipt * {
 visibility: visible;
 }
 #printable-receipt {
 position: absolute;
 left: 0;
 top: 0;
 width: 80mm;
 padding: 0;
 margin: 0;
 font-family: monospace;
 color: #000;
 background: #fff;
 }
 .no-print {
 display: none !important;
 }
 }
 `}</style>

      {/* Topbar */}
      <header className="flex-none h-16  bg-card px-4 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          {!isFullscreen && (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/workspace/pedidos">
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
        <div className="flex items-center gap-2">
          {!audioUnlocked && (
            <Badge variant="warning" className="cursor-pointer" onClick={() => document.body.click()}>
              Clique para ativar os alertas sonoros
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-2">
            <Maximize className="size-4" />
            {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          </Button>
        </div>
      </header>

      {/* Kanban Board */}
      <main className="flex-1 overflow-x-auto p-4 flex gap-4 bg-muted/30 no-print">
        {columns.map((col) => {
          const isPrepCol = col.id === "processing";
          const colOrders = orders
            .filter((o) =>
              isPrepCol
                ? o.status === "processing" || o.status === "kitchen_prep"
                : o.status === col.id,
            )
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

          return (
            <div key={col.id} className="flex-shrink-0 w-[350px] flex flex-col gap-3 h-full">
              <div
                className={`rounded-xl border ${col.color} p-3 flex items-center justify-between bg-surface-paper `}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  {col.icon}
                  {col.title}
                </div>
                <Badge variant="secondary" className="font-mono text-sm">
                  {colOrders.length}
                </Badge>
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 pb-6">
                {colOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-surface-paper rounded-xl   p-4 flex flex-col gap-3 cursor-pointer hover:border-primary/50 hover: transition-all"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-bold text-muted-foreground">
                          #{order.id.split("-")[0].toUpperCase()}
                        </span>
                        <h4 className="font-bold text-base leading-tight mt-1">
                          {order.customer_snapshot?.name ||
                            order.customer?.name ||
                            "Cliente Avulso"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(order.created_at)}
                          </p>
                          {order.origin_type && order.origin_type !== "ecommerce" && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4 uppercase"
                            >
                              {order.origin_type === "table" ? "Mesa" : order.origin_type}
                            </Badge>
                          )}
                          {order.table_identifier && (
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary"
                            >
                              {order.table_identifier}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono bg-muted/20 border-border">
                        {formatMoney(order.total_cents)}
                      </Badge>
                    </div>

                    <div className="py-2 border-y border-border/50 text-sm space-y-2">
                      {order.order_items?.map((item: any) => {
                        const options = item.selected_options
                          ? Object.values(item.selected_options)
                          : [];
                        return (
                          <div key={item.id} className="flex flex-col">
                            <div className="flex justify-between items-start">
                              <span className="font-medium leading-tight">
                                <span className="text-primary font-bold mr-1">{item.qty}x</span>
                                {item.product_title || "Item genérico"}
                              </span>
                            </div>
                            {options.length > 0 && (
                              <div className="text-xs text-muted-foreground mt-0.5 ml-5  pl-2 py-0.5 space-y-0.5">
                                {options.map((opt: any, idx: number) => (
                                  <div key={idx}>+ {opt.label}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {col.nextStatus && (
                      <Button
                        className="w-full font-bold h-10 "
                        onClick={(e) => handleStatusChange(e, order.id, col.nextStatus!)}
                      >
                        {col.nextLabel}
                      </Button>
                    )}
                  </div>
                ))}
                {colOrders.length === 0 && (
                  <div className="h-24 flex items-center justify-center border-0/60 rounded-xl text-muted-foreground text-sm font-medium bg-surface-paper/50">
                    Nenhum pedido nesta fila
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* Sheet para Detalhes do Pedido */}
      <Sheet open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-0 flex flex-col no-print">
          {selectedOrder && (
            <>
              <SheetHeader className="p-6 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <SheetTitle className="text-2xl font-black">
                      Pedido #{selectedOrder.id.split("-")[0].toUpperCase()}
                    </SheetTitle>
                    <p className="text-muted-foreground text-sm mt-1">
                      {formatDateTime(selectedOrder.created_at)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                    <Printer className="size-4" />
                    Imprimir Comanda
                  </Button>
                </div>
              </SheetHeader>

              <div className="flex-1 p-6 space-y-6">
                {/* Cliente Info */}
                <section>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">
                    Cliente
                  </h3>
                  <div className="bg-surface-paper  rounded-xl p-4 ">
                    <p className="font-bold text-lg">
                      {selectedOrder.customer_snapshot?.name ||
                        selectedOrder.customer?.name ||
                        "Cliente Avulso"}
                    </p>
                    {selectedOrder.customer_snapshot?.phone && (
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.customer_snapshot.phone}
                      </p>
                    )}
                    {selectedOrder.shipping_method === "pickup" && (
                      <Badge className="mt-2" variant="secondary">
                        Retirada na Loja
                      </Badge>
                    )}
                  </div>
                </section>

                <Separator />

                {/* Itens do Pedido */}
                <section>
                  <h3 className="text-sm font-bold uppercase text-muted-foreground mb-3">
                    Itens ({selectedOrder.order_items?.length})
                  </h3>
                  <div className="space-y-4">
                    {selectedOrder.order_items?.map((item: any) => {
                      const options = item.selected_options
                        ? Object.values(item.selected_options)
                        : [];
                      return (
                        <div
                          key={item.id}
                          className="bg-surface-paper   rounded-xl p-3"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-base">
                              <span className="text-primary mr-2">{item.qty}x</span>
                              {item.product_title}
                            </span>
                            <span className="font-medium text-sm">
                              {formatMoney(item.total_cents)}
                            </span>
                          </div>

                          {/* Modifiers / Options */}
                          {options.length > 0 && (
                            <div className="mt-2 ml-7 pl-3 border-l-2 border-primary/30 space-y-1">
                              {options.map((opt: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex justify-between text-sm text-muted-foreground"
                                >
                                  <span>+ {opt.label}</span>
                                  {opt.price_modifier_cents > 0 && (
                                    <span>{formatMoney(opt.price_modifier_cents * item.qty)}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <Separator />

                {/* Resumo Financeiro */}
                <section className="bg-primary/5 border border-primary/10 p-4 rounded-xl mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatMoney(selectedOrder.total_cents)}</span>
                  </div>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Printable Receipt (Escondido na tela normal) */}
      {selectedOrder && (
        <div id="printable-receipt" className="hidden">
          <div
            style={{
              textAlign: "center",
              marginBottom: "15px",
              paddingBottom: "10px",
              borderBottom: "1px dashed #000",
            }}
          >
            <h2 style={{ margin: "0 0 5px 0", fontSize: "16px" }}>
              PEDIDO #{selectedOrder.id.split("-")[0].toUpperCase()}
            </h2>
            <p style={{ margin: "0", fontSize: "12px" }}>
              {new Date(selectedOrder.created_at).toLocaleString("pt-BR")}
            </p>
            {selectedOrder.origin_type && (
              <p style={{ margin: "5px 0 0 0", fontSize: "14px", fontWeight: "bold" }}>
                {selectedOrder.origin_type === "table"
                  ? "MESA" + (selectedOrder.table_identifier || "")
                  : "BALCÃO"}
              </p>
            )}
          </div>

          <div
            style={{ marginBottom: "15px", paddingBottom: "10px", borderBottom: "1px dashed #000" }}
          >
            <p style={{ margin: "0 0 5px 0", fontSize: "14px", fontWeight: "bold" }}>CLIENTE:</p>
            <p style={{ margin: "0", fontSize: "14px" }}>
              {selectedOrder.customer_snapshot?.name || selectedOrder.customer?.name || "Avulso"}
            </p>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "14px", fontWeight: "bold" }}>ITENS:</p>
            {selectedOrder.order_items?.map((item: any) => {
              const options = item.selected_options ? Object.values(item.selected_options) : [];
              return (
                <div key={item.id} style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    <span>
                      {item.qty}x {item.product_title}
                    </span>
                  </div>
                  {options.map((opt: any, idx: number) => (
                    <div
                      key={idx}
                      style={{ fontSize: "12px", marginLeft: "15px", marginTop: "2px" }}
                    >
                      + {opt.label}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div
            style={{
              borderTop: "1px dashed #000",
              paddingTop: "10px",
              display: "flex",
              justifyContent: "space-between",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            <span>TOTAL:</span>
            <span>R$ {(selectedOrder.total_cents / 100).toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
