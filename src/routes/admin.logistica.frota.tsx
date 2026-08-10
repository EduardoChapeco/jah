import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  Bike, 
  Package, 
  CheckCircle2,
  Clock,
  Navigation
} from "lucide-react";

import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/commerce/page-header";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/state/states";

export const Route = createFileRoute("/admin/logistica/frota")({
  head: () => ({ meta: [{ title: "JAH Entrega - Gestão de Frota" }] }),
  loader: async () => {
    const res = await listOrders();
    return (res || []).filter((o: any) => 
      ["processing", "shipped"].includes(o.status)
    );
  },
  component: DeliveryFleetPage,
});

function DeliveryFleetPage() {
  const initialOrders = Route.useLoaderData();
  const [orders, setOrders] = useState<any[]>(initialOrders);

  // Mock fleet for now
  const drivers = [
    { id: "d1", name: "Carlos Silva (Moto)" },
    { id: "d2", name: "Ana Beatriz (Bicicleta)" },
    { id: "d3", name: "Roberto Alves (Moto)" }
  ];

  const handleAssignDriver = async (orderId: string, driverId: string) => {
    // In a real app, this would hit a specific logistics endpoint.
    // For now, we update the status to shipped to simulate assignment if it's processing.
    const order = orders.find(o => o.id === orderId);
    if (order?.status === "processing") {
      const res = await updateOrderStatus({ data: { orderId, status: "shipped" } });
      if (res?.id) {
        toast.success("Entregador atribuído com sucesso!");
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "shipped" } : o));
      } else {
        toast.error("Erro ao atribuir entregador.");
      }
    } else {
      toast.success("Entregador atualizado com sucesso!");
    }
  };

  const handleCompleteDelivery = async (orderId: string) => {
    const res = await updateOrderStatus({ data: { orderId, status: "delivered" } });
    if (res?.id) {
      toast.success("Entrega confirmada!");
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } else {
      toast.error("Erro ao confirmar entrega.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Logística Proprietária"
        title="JAH Entrega"
        description="Painel de roteirização e atribuição de motoristas para pedidos ativos."
        actions={
          <Button variant="outline" asChild size="sm">
            <Link to="/admin">
              <ArrowLeft className="mr-1.5 size-4" />
              Voltar ao Painel
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Package className="size-5 text-primary" /> Pedidos Aguardando Despacho
          </h2>
          
          {orders.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="size-10 text-emerald-500" />}
              title="Tudo limpo!"
              description="Nenhum pedido pendente de entrega no momento."
            />
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <Card key={order.id} className="overflow-hidden border-border shadow-op-sm">
                  <div className="flex flex-col md:flex-row border-b border-border bg-muted/20">
                    <div className="p-4 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-muted-foreground uppercase">#{order.id.split("-")[0]}</span>
                        <Badge variant={order.status === "shipped" ? "secondary" : "outline"} className="text-[10px]">
                          {order.status === "shipped" ? "Em Rota" : "Aguardando Entregador"}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-base">{order.customer?.name || "Cliente Avulso"}</h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2 font-mono">
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {formatDateTime(order.created_at)}</span>
                        <span className="flex items-center gap-1"><MapPin className="size-3" /> {order.shipping_address?.city || "Retirada Local"}</span>
                      </div>
                    </div>
                    <div className="p-4 md:border-l border-border bg-card flex flex-col justify-center items-end md:w-64 gap-3">
                      <div className="text-sm font-bold">{formatMoney(order.total_cents)}</div>
                      <Select onValueChange={(val) => handleAssignDriver(order.id, val)}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue placeholder="Atribuir Motoboy..." />
                        </SelectTrigger>
                        <SelectContent>
                          {drivers.map(d => (
                            <SelectItem key={d.id} value={d.id} className="text-xs">
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {order.status === "shipped" && (
                        <Button size="sm" className="w-full h-8 text-xs font-bold" onClick={() => handleCompleteDelivery(order.id)}>
                          Confirmar Entrega
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/10 text-xs flex flex-wrap gap-x-4 gap-y-1">
                    {order.order_items?.map((item: any) => (
                      <span key={item.id} className="text-muted-foreground">
                        <span className="font-bold text-foreground mr-1">{item.qty}x</span>
                        {item.product?.title || "Item"}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-op-sm bg-primary text-primary-foreground">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bike className="size-5" /> Entregadores Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {drivers.map(driver => (
                  <div key={driver.id} className="flex items-center justify-between p-2 rounded bg-primary-foreground/10 border border-primary-foreground/20">
                    <span className="text-sm font-medium">{driver.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" title="Disponível" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-op-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Navigation className="size-5 text-muted-foreground" /> Roteirização Inteligente
              </CardTitle>
              <CardDescription className="text-xs">
                Otimize rotas baseadas na localização dos pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full text-xs" disabled>
                Gerar Rota Otimizada (Em Breve)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
