import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useKitchenOrders, useUpdateKitchenOrder, useCompanyBrands } from "@/hooks/useRestaurant";
import { ChefHat, Clock, CheckCircle, Truck, AlertTriangle, Store, Monitor, ShoppingBag, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const columns = [
  { key: "pending", label: "🔴 Pendente", color: "border-red-400" },
  { key: "preparing", label: "🟡 Preparando", color: "border-yellow-400" },
  { key: "ready", label: "🟢 Pronto", color: "border-green-400" },
];

const priorityBadge: Record<string, string> = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  normal: "",
};

const sourceIcons: Record<string, { icon: any; label: string }> = {
  comanda: { icon: Monitor, label: "Salão" },
  delivery: { icon: ShoppingBag, label: "Delivery" },
  ifood: { icon: Smartphone, label: "iFood" },
  rappi: { icon: Smartphone, label: "Rappi" },
};

function ElapsedTimer({ since }: { since: string }) {
  const [, setTick] = useState(0);
  const interval = useRef<ReturnType<typeof setInterval>>();
  useEffect(() => {
    interval.current = setInterval(() => setTick(t => t + 1), 30000);
    return () => clearInterval(interval.current);
  }, []);
  const mins = Math.floor((Date.now() - new Date(since).getTime()) / 60000);
  const color = mins > 20 ? "text-red-500" : mins > 10 ? "text-yellow-600" : "text-muted-foreground";
  return <span className={`text-xs flex items-center gap-0.5 ${color}`}><Clock className="h-3 w-3" />{mins}min</span>;
}

interface Props { companyId: string; }

export default function KitchenTab({ companyId }: Props) {
  const { data: orders = [], isLoading } = useKitchenOrders(companyId);
  const { data: brands = [] } = useCompanyBrands(companyId);
  const updateOrder = useUpdateKitchenOrder();
  const [brandFilter, setBrandFilter] = useState("all");
  const [stationFilter, setStationFilter] = useState("all");

  const filteredOrders = orders.filter((o: any) => {
    if (brandFilter !== "all" && o.brand_id !== brandFilter) return false;
    if (stationFilter !== "all" && o.station !== stationFilter) return false;
    return true;
  });

  const stations = [...new Set(orders.map((o: any) => o.station).filter(Boolean))];

  const advance = async (order: any) => {
    const next: Record<string, string> = { pending: "preparing", preparing: "ready", ready: "delivered" };
    const nextStatus = next[order.status];
    if (!nextStatus) return;
    const timeField: Record<string, string> = { preparing: "started_at", ready: "ready_at", delivered: "delivered_at" };
    await updateOrder.mutateAsync({ id: order.id, status: nextStatus, [timeField[nextStatus]]: new Date().toISOString() });
    toast.success(nextStatus === "delivered" ? "Pedido entregue!" : `Status: ${nextStatus}`);
  };

  const actionLabels: Record<string, { label: string; icon: any }> = {
    pending: { label: "Iniciar Preparo", icon: ChefHat },
    preparing: { label: "Marcar Pronto", icon: CheckCircle },
    ready: { label: "Entregue", icon: Truck },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <ChefHat className="h-6 w-6" />
        <h2 className="text-xl font-bold">Cozinha (KDS)</h2>
        <Badge variant="secondary">{filteredOrders.length} pedidos ativos</Badge>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {brands.length > 0 && (
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[160px]"><Store className="h-4 w-4 mr-1" /><SelectValue placeholder="Marca" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {brands.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {stations.length > 1 && (
          <Select value={stationFilter} onValueChange={setStationFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estação" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas estações</SelectItem>
              {stations.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map(col => {
            const colOrders = filteredOrders.filter((o: any) => o.status === col.key);
            return (
              <div key={col.key} className="space-y-2">
                <div className={`p-2 rounded-t-lg border-t-4 ${col.color} bg-muted/30`}>
                  <h3 className="font-semibold text-sm">{col.label} ({colOrders.length})</h3>
                </div>
                <div className="space-y-2 min-h-[200px]">
                  {colOrders.map((order: any) => {
                    const items = Array.isArray(order.items) ? order.items : [];
                    const action = actionLabels[order.status];
                    const src = sourceIcons[order.source] || sourceIcons.comanda;
                    const brand = brands.find((b: any) => b.id === order.brand_id);
                    return (
                      <Card key={order.id} className="border-l-4 border-l-primary/50">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1">
                                <src.icon className="h-3 w-3 text-muted-foreground" />
                                <p className="font-bold text-sm">{order.table_number || "Balcão"}</p>
                              </div>
                              <ElapsedTimer since={order.created_at} />
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {order.priority !== "normal" && (
                                <Badge className={priorityBadge[order.priority] || ""}>
                                  <AlertTriangle className="h-3 w-3 mr-1" />{order.priority}
                                </Badge>
                              )}
                              {brand && <Badge variant="outline" className="text-xs" style={{ borderColor: brand.accent_color }}>{brand.name}</Badge>}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {items.map((item: any, idx: number) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{item.qty || 1}x</span> {item.name}
                                {item.notes && <p className="text-xs text-muted-foreground italic ml-4">📝 {item.notes}</p>}
                              </div>
                            ))}
                            {items.length === 0 && <p className="text-sm text-muted-foreground">Sem itens detalhados</p>}
                          </div>
                          {order.station && order.station !== "geral" && (
                            <Badge variant="outline" className="text-xs">{order.station}</Badge>
                          )}
                          {action && (
                            <Button size="sm" className="w-full" onClick={() => advance(order)}>
                              <action.icon className="h-4 w-4 mr-1" />{action.label}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  {colOrders.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum pedido</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
