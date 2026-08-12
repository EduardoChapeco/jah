import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Bike, Package, Clock, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { listOrders, assignDriverToOrder, respondToDispatch } from "@/services/order.functions";
import { listDrivers, getOrderDispatches } from "@/services/shipping.functions";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/commerce/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/workspace/pedidos/frota")({
  head: () => ({ meta: [{ title: "JAH Entrega - Gestão de Frota" }] }),
  loader: async () => {
    return {
      initialOrders: await listOrders().catch(() => []),
      initialDrivers: await listDrivers().catch(() => []),
    };
  },
  component: DeliveryFleetPage,
});

function OrderDispatchHistory({ orderId }: { orderId: string }) {
  const { data: dispatches, isLoading } = useQuery({
    queryKey: ["order-dispatches", orderId],
    queryFn: () => getOrderDispatches({ data: { orderId } }),
  });

  const queryClient = useQueryClient();
  const router = useRouter();

  const handleResponse = async (dispatchId: string, response: "accepted" | "rejected" | "failed" | "delivered") => {
    try {
      await respondToDispatch({ data: { dispatchId, response } });
      toast.success("Resposta registrada!");
      queryClient.invalidateQueries({ queryKey: ["order-dispatches", orderId] });
      queryClient.invalidateQueries({ queryKey: ["fleet-orders"] });
      router.invalidate();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erro ao registrar resposta.");
    }
  };

  if (isLoading || !dispatches || dispatches.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/10 space-y-3">
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Histórico de Despacho</h5>
      {dispatches.map((d: any) => (
        <div key={d.id} className="text-sm bg-muted/30 rounded-md p-3 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-foreground">{d.delivery_drivers?.name}</span>
            <Badge variant={
              d.status === 'delivered' ? 'success' : 
              d.status === 'failed' || d.status === 'rejected' ? 'destructive' : 
              d.status === 'in_transit' || d.status === 'accepted' ? 'brand' : 'outline'
            } className="text-[10px]">{d.status}</Badge>
          </div>
          <div className="text-xs text-muted-foreground flex justify-between">
            <span>Atribuído: {formatDateTime(d.assigned_at)}</span>
            {d.completed_at && <span>Concluído: {formatDateTime(d.completed_at)}</span>}
          </div>
          {d.failure_reason && (
            <div className="mt-2 text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="size-3" /> Motivo: {d.failure_reason}
            </div>
          )}
          
          {d.status === 'assigned' && (
            <div className="mt-3 flex gap-2">
              <Button size="xs" variant="outline" onClick={() => handleResponse(d.id, 'accepted')}>Entregador Aceitou</Button>
              <Button size="xs" variant="destructive" onClick={() => handleResponse(d.id, 'rejected')}>Entregador Rejeitou</Button>
            </div>
          )}
          {(d.status === 'accepted' || d.status === 'in_transit') && (
            <div className="mt-3 flex gap-2">
              <Button size="xs" variant="success" onClick={() => handleResponse(d.id, 'delivered')}>Baixar Entrega</Button>
              <Button size="xs" variant="destructive" onClick={() => handleResponse(d.id, 'failed')}>Falha (Ex: Ausente)</Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function DeliveryFleetPage() {
  const { initialOrders, initialDrivers } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: allOrders } = useQuery({
    queryKey: ["fleet-orders"],
    queryFn: () => listOrders(),
    initialData: initialOrders,
  });

  const { data: drivers } = useQuery({
    queryKey: ["fleet-drivers"],
    queryFn: () => listDrivers(),
    initialData: initialDrivers,
  });

  const orders = (allOrders || []).filter((o: any) => ["processing", "shipped"].includes(o.status));

  const assignMutation = useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      return await assignDriverToOrder({ data: { orderId, driverId } });
    },
    onSuccess: () => {
      toast.success("Entregador atribuído ao pedido!");
      queryClient.invalidateQueries({ queryKey: ["fleet-orders"] });
      router.invalidate();
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atribuir entregador.");
    },
  });

  const [selectedDriver, setSelectedDriver] = useState<Record<string, string>>({});

  const handleAssignDriver = (orderId: string) => {
    const driverId = selectedDriver[orderId];
    if (!driverId) {
      toast.error("Selecione um entregador primeiro.");
      return;
    }
    assignMutation.mutate({ orderId, driverId });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Logística Proprietária"
        title="JAH Entrega (Despachos)"
        description="Gestão real de motoristas, ocorrências, reatribuições e status de campo."
        actions={
          <Button variant="outline" asChild size="sm">
            <Link to="/workspace">
              <ArrowLeft className="mr-1.5 size-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="size-5 text-primary" /> Fila de Despacho
          </h2>

          {orders.length === 0 ? (
            <EmptyState title="Tudo limpo!" description="Nenhum pedido pendente de logística." />
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div
                  key={order.id}
                  className="overflow-hidden bg-card rounded-md border border-border shadow-xs"
                >
                  <div className="flex flex-col md:flex-row border-b border-border bg-muted/20">
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">
                          #{order.id.split("-")[0]}
                        </span>
                        <Badge
                          variant={order.status === "shipped" ? "brand" : "outline"}
                          className="text-[10px]"
                        >
                          {order.status === "shipped" ? "Despachado" : "Aguardando Entregador"}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-base">
                        {order.customer?.name || "Cliente Avulso"}
                      </h4>
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" /> {formatDateTime(order.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="size-3" />{" "}
                          {order.shipping_address?.street}, {order.shipping_address?.number} - {order.shipping_address?.neighborhood}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-muted/10 md:w-64 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center gap-3">
                      <div className="text-sm">
                        <span className="text-muted-foreground block mb-1">Atribuir a:</span>
                        <Select
                          value={selectedDriver[order.id] || ""}
                          onValueChange={(val) => setSelectedDriver((p) => ({ ...p, [order.id]: val }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers?.length === 0 && <SelectItem value="none" disabled>Nenhum entregador cadastrado</SelectItem>}
                            {drivers?.map((d: any) => (
                              <SelectItem key={d.id} value={d.id}>
                                {d.name} ({d.vehicle_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        size="sm"
                        disabled={assignMutation.isPending}
                        onClick={() => handleAssignDriver(order.id)}
                      >
                        Despachar Pedido
                      </Button>
                    </div>
                  </div>
                  
                  {/* Historical Dispatch Data */}
                  <div className="p-4">
                    <OrderDispatchHistory orderId={order.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card className="border border-border shadow-xs bg-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bike className="size-5" /> Frota Ativa
              </CardTitle>
              <CardDescription>Entregadores e veículos disponíveis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {drivers?.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  Nenhum motorista cadastrado.
                </div>
              ) : (
                drivers?.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 border border-border rounded-md">
                    <div>
                      <p className="font-medium text-sm">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.vehicle_type} • {d.phone || "Sem tel"}</p>
                    </div>
                    <Badge variant={d.status === "available" ? "success" : "secondary"}>
                      {d.status === "available" ? "Livre" : "Ocupado"}
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
