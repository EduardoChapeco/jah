import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, ChefHat, Check, UtensilsCrossed, PackageCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatTimeOnly } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/pdv/cozinha")({
  head: () => ({ meta: [{ title: "KDS - Cozinha Pro | Workspace Wider" }] }),
  component: KDSDashboard,
});

function KDSDashboard() {
  const queryClient = useQueryClient();

  // Polling a cada 4s para atualização em tempo real de pedidos
  const { data: orders, isLoading } = useQuery({
    queryKey: ["kds-orders"],
    queryFn: () => listOrders(),
    refetchInterval: 4000, 
  });

  const { mutate: changeStatus, isPending } = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kds-orders"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar status");
    }
  });

  // Filtramos os pedidos para a visao da cozinha. 
  // No WIDER, um pedido de comida comeca como 'pending' (aberto),
  // passa para 'processing' (em preparo), 'shipped' ou 'ready' (pronto), e 'delivered' (arquivado do KDS).
  const activeOrders = orders?.filter((o: any) => 
    ["pending", "processing", "shipped"].includes(o.status)
  ) || [];

  const colPending = activeOrders.filter((o: any) => o.status === "pending");
  const colProcessing = activeOrders.filter((o: any) => o.status === "processing");
  const colReady = activeOrders.filter((o: any) => o.status === "shipped"); // Usando shipped como Pronto para Retirada

  const moveOrder = (orderId: string, currentStatus: string) => {
    let nextStatus: "processing" | "shipped" | "delivered" = "processing";
    if (currentStatus === "pending") nextStatus = "processing";
    else if (currentStatus === "processing") nextStatus = "shipped";
    else if (currentStatus === "shipped") nextStatus = "delivered";

    changeStatus({ data: { orderId, status: nextStatus } });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-full overflow-hidden bg-muted/10">
      {/* Header Fixo */}
      <div className="flex items-center justify-between px-6 py-4 bg-background border-b shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <ChefHat size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl leading-none">Kitchen Display System (KDS)</h1>
            <p className="text-xs text-muted-foreground mt-1">Sincronização em tempo real ativada</p>
          </div>
        </div>
        <div className="flex gap-4 text-sm font-bold text-muted-foreground">
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning animate-pulse" />
            {colPending.length} na fila
          </span>
          <span className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            {colProcessing.length} em preparo
          </span>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-6 h-full items-start min-w-[1024px]">
          
          <KanbanColumn 
            title="Recebidos (Fila)" 
            count={colPending.length}
            icon={UtensilsCrossed}
            color="border-warning"
            bg="bg-warning/10"
            orders={colPending}
            onAction={moveOrder}
            actionLabel="Iniciar Preparo"
            actionIcon={ChefHat}
            isPending={isPending}
          />

          <KanbanColumn 
            title="Em Preparo" 
            count={colProcessing.length}
            icon={ChefHat}
            color="border-primary"
            bg="bg-primary/10"
            orders={colProcessing}
            onAction={moveOrder}
            actionLabel="Marcar como Pronto"
            actionIcon={Check}
            isPending={isPending}
          />

          <KanbanColumn 
            title="Pronto p/ Entrega" 
            count={colReady.length}
            icon={PackageCheck}
            color="border-success"
            bg="bg-success/10"
            orders={colReady}
            onAction={moveOrder}
            actionLabel="Despachar"
            actionIcon={Check}
            isPending={isPending}
          />

        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ title, count, icon: Icon, color, bg, orders, onAction, actionLabel, actionIcon: ActionIcon, isPending }: any) {
  return (
    <div className={`flex flex-col w-[350px] shrink-0 h-full max-h-full rounded-3xl border-2 ${color} bg-background overflow-hidden shadow-sm`}>
      <div className={`p-4 ${bg} border-b flex items-center justify-between shrink-0`}>
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Icon size={20} /> {title}
        </h2>
        <Badge variant="secondary" className="text-base px-3">{count}</Badge>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {orders.map((o: any) => (
          <TicketCard 
            key={o.id} 
            order={o} 
            onAction={() => onAction(o.id, o.status)}
            actionLabel={actionLabel}
            actionIcon={ActionIcon}
            isPending={isPending}
          />
        ))}
        {orders.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center text-muted-foreground opacity-50">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm font-medium">Nenhum pedido</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketCard({ order, onAction, actionLabel, actionIcon: ActionIcon, isPending }: any) {
  // O número do pedido geralmente é gerado. Vamos usar o ID curto.
  const ticketNumber = order.id.split("-")[0].toUpperCase();
  const waitMinutes = Math.floor((new Date().getTime() - new Date(order.created_at).getTime()) / 60000);
  
  const isDelayed = waitMinutes > 20;
  const itemsList = order.order_items || order.items || [];
  const customerName =
    order.customer_snapshot?.name ||
    order.customer?.name ||
    order.customer?.full_name ||
    "Cliente Balcão";

  return (
    <div className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
      <div className={`p-3 text-white flex justify-between items-center ${isDelayed ? 'bg-destructive' : 'bg-slate-800'}`}>
        <span className="font-black text-xl">#{ticketNumber}</span>
        <span className="text-sm font-bold flex items-center gap-1">
          <Clock size={14} /> {formatTimeOnly(order.created_at)} ({waitMinutes}m)
        </span>
      </div>
      
      <div className="p-4 flex-1 space-y-4">
        {/* Identificação do Cliente / Mesa */}
        <div className="text-sm border-b pb-3">
          <p className="font-bold uppercase">{customerName}</p>
          {(order.table_identifier || order.table_number) && (
            <p className="text-muted-foreground font-semibold text-xs mt-0.5">
              Mesa: {order.table_identifier || order.table_number}
            </p>
          )}
          {order.shipping_method === "delivery" && (
            <p className="text-muted-foreground text-xs">Delivery</p>
          )}
        </div>

        {/* Itens do Pedido */}
        <ul className="space-y-3">
          {itemsList.map((item: any, i: number) => {
            const rawOptions = item.selected_options || item.options;
            const optionsArray = rawOptions
              ? Array.isArray(rawOptions)
                ? rawOptions
                : typeof rawOptions === "object"
                  ? Object.values(rawOptions)
                  : []
              : [];

            return (
              <li key={i} className="text-sm">
                <div className="flex gap-2 items-start font-bold">
                  <span className="text-primary font-mono">{item.qty ?? item.quantity ?? 1}x</span>
                  <span>{item.product_title || item.product_name || "Item sem título"}</span>
                </div>
                
                {/* Modificadores */}
                {optionsArray.length > 0 && (
                  <div className="pl-6 pt-1 space-y-0.5">
                    {optionsArray.map((opt: any, idx: number) => {
                      const label = typeof opt === "string" ? opt : opt?.label || opt?.name || JSON.stringify(opt);
                      return (
                        <div key={idx} className="text-xs text-muted-foreground flex gap-1 items-start">
                          <span className="text-destructive font-bold">+</span> 
                          <span>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Nota especial do item */}
                {item.notes && (
                  <p className="pl-6 mt-1 text-xs text-warning font-medium bg-warning/10 p-1.5 rounded uppercase">
                    OBS: {item.notes}
                  </p>
                )}
              </li>
            );
          })}
          {itemsList.length === 0 && (
            <li className="text-xs text-muted-foreground italic">Nenhum item listado.</li>
          )}
        </ul>
      </div>

      <div className="p-3 bg-muted/30 border-t">
        <Button 
          className="w-full font-bold h-12 text-base rounded-xl" 
          onClick={onAction}
          disabled={isPending}
        >
          <ActionIcon size={20} className="mr-2" />
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
