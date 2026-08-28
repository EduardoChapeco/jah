import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  ShoppingBag,
  Search,
  MoreVertical,
  Eye,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  ReceiptText,
  Clock,
  Filter,
  Volume2,
  VolumeX,
  Printer,
  LayoutGrid,
  List,
  ChefHat,
  ArrowRight,
} from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/state/states";
import { listOrders, updateOrderStatus } from "@/services/order.functions";
import { approvePayment } from "@/services/payment.functions";
import { formatMoney } from "@/lib/money";
import { formatDateTime } from "@/lib/datetime";

export const Route = createFileRoute("/workspace/pedidos/")({
  head: () => ({ meta: [{ title: "Gestão de Pedidos" }] }),
  loader: async () => {
    const res = await listOrders().catch(() => []);
    return res || [];
  },
  component: AdminOrdersPage,
});

function getStatusLabel(status: string) {
  const map: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline" | "info" | "success" | "warning";
    }
  > = {
    draft: { label: "Rascunho", variant: "secondary" },
    awaiting_payment: { label: "Aguardando Pagto", variant: "warning" },
    payment_processing: { label: "Processando Pagto", variant: "info" },
    paid: { label: "Pago", variant: "success" },
    processing: { label: "Em Preparo", variant: "secondary" },
    ready_for_pickup: { label: "Pronto p/ Retirada", variant: "success" },
    shipped: { label: "Em Entrega", variant: "info" },
    delivered: { label: "Entregue", variant: "success" },
    cancelled: { label: "Cancelado", variant: "destructive" },
  };
  return map[status] || { label: status, variant: "outline" };
}

function AdminOrdersPage() {
  const initialOrders = Route.useLoaderData();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusTab, setStatusTab] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"kitchen" | "picking" | "table">("kitchen");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Filter orders by search & tab
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const tokenStr = `#${order.public_token || ""}`.toLowerCase();
      const customerName = (order.customer_snapshot?.name || "").toLowerCase();
      const customerEmail = (order.customer_snapshot?.email || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        tokenStr.includes(query) || customerName.includes(query) || customerEmail.includes(query);

      let matchesTab = true;
      if (statusTab === "awaiting")
        matchesTab = order.status === "awaiting_payment" || order.status === "payment_processing";
      else if (statusTab === "processing")
        matchesTab = order.status === "processing" || order.status === "paid";
      else if (statusTab === "shipped")
        matchesTab = order.status === "shipped" || order.status === "ready_for_pickup";
      else if (statusTab === "delivered") matchesTab = order.status === "delivered";
      else if (statusTab === "cancelled") matchesTab = order.status === "cancelled";

      return matchesSearch && matchesTab;
    });
  }, [orders, searchQuery, statusTab]);

  // Update status action
  const handleStatusChange = async (orderId: string, newStatus: any) => {
    setIsProcessing(true);
    try {
      const res = await updateOrderStatus({ data: { orderId, status: newStatus } });
      if (res) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
        toast.success(`Status do pedido alterado para ${getStatusLabel(newStatus).label}!`);
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao atualizar status.");
      }
    } catch (e: unknown) {
      toast.error("Erro ao atualizar o pedido.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Approve Payment
  const handleQuickApprove = async (orderId: string) => {
    setIsProcessing(true);
    try {
      const res = await approvePayment({ data: { orderId, receivedMethod: "cash" } });
      if (res) {
        toast.success("Pedido aceito e enviado para preparo!");
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: "processing" } : o)),
        );
        router.invalidate();
      } else {
        toast.error((res as any).message || "Erro ao aprovar pagamento.");
      }
    } catch (e: unknown) {
      toast.error("Erro ao aprovar pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Kitchen column orders
  const newOrders = orders.filter(
    (o) => o.status === "awaiting_payment" || o.status === "payment_processing" || o.status === "paid",
  );
  const preparingOrders = orders.filter((o) => o.status === "processing");
  const readyOrders = orders.filter(
    (o) => o.status === "ready_for_pickup" || o.status === "shipped",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader eyebrow="Gestão Comercial de Vendas" title="Painel & Expedição de Pedidos" />

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-xl text-xs gap-1.5 font-bold ${soundEnabled ? "border-primary/40 text-primary" : "text-muted-foreground"}`}
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            <span>{soundEnabled ? "Som Ativo" : "Mudo"}</span>
          </Button>

          <div className="flex items-center rounded-xl p-0.5 bg-muted/40 border border-border/60">
            <button
              onClick={() => setViewMode("kitchen")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "kitchen"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChefHat className="size-3.5" />
              <span>Cozinha</span>
            </button>
            <button
              onClick={() => setViewMode("picking")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "picking"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="size-3.5 text-primary" />
              <span>Separação Mercado</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3.5" />
              <span>Tabela</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Visualização Cockpit de Cozinha (iFood Merchant Mode) ── */}
      {viewMode === "kitchen" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Coluna 1: Novos Pedidos */}
          <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card/60">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-destructive animate-pulse" />
                <h3 className="text-sm font-bold text-foreground">Novos Pedidos</h3>
              </div>
              <Badge variant="secondary" className="font-bold text-xs">
                {newOrders.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {newOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Nenhum pedido novo pendente
                </div>
              ) : (
                newOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-border bg-card space-y-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-foreground">
                            #{order.public_token || order.id.slice(0, 6)}
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {order.customer_snapshot?.name || "Cliente"}
                          </span>
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary uppercase">
                          {order.shipping_method === "pickup" ? "Retirada Balcão" : "Entrega Parceira"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-foreground">
                          {formatMoney(order.total_cents)}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="size-3" />
                          <span>Hoje</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 ">
                      <Button
                        size="sm"
                        onClick={() => handleQuickApprove(order.id)}
                        disabled={isProcessing}
                        className="flex-1 rounded-xl font-bold bg-foreground text-background text-xs h-9"
                      >
                        Aceitar Pedido
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-xl shrink-0"
                        title="Ver Comanda"
                      >
                        <Link to={`/workspace/pedidos/${order.id}/recibo` as never} target="_blank">
                          <Printer className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna 2: Em Preparo */}
          <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card/60">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold text-foreground">Em Preparo</h3>
              </div>
              <Badge variant="secondary" className="font-bold text-xs">
                {preparingOrders.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {preparingOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Nenhum pedido em produção
                </div>
              ) : (
                preparingOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-border bg-card space-y-3 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-foreground">
                            #{order.public_token || order.id.slice(0, 6)}
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {order.customer_snapshot?.name || "Cliente"}
                          </span>
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 uppercase">
                          Cozinha Produzindo
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-foreground">
                          {formatMoney(order.total_cents)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        onClick={() =>
                          handleStatusChange(
                            order.id,
                            order.shipping_method === "pickup" ? "ready_for_pickup" : "shipped",
                          )
                        }
                        disabled={isProcessing}
                        className="flex-1 rounded-xl font-bold bg-primary text-primary-foreground text-xs h-9 gap-1"
                      >
                        <span>Pronto p/ Despacho</span>
                        <ArrowRight className="size-3.5" />
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-xl shrink-0"
                      >
                        <Link to={`/workspace/pedidos/${order.id}/recibo` as never} target="_blank">
                          <Printer className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Coluna 3: Prontos / Em Entrega */}
          <div className="space-y-3 p-4 rounded-2xl border border-border/70 bg-card/60">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-bold text-foreground">Prontos / Em Rota</h3>
              </div>
              <Badge variant="secondary" className="font-bold text-xs">
                {readyOrders.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {readyOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  Nenhum pedido despachado
                </div>
              ) : (
                readyOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-border bg-card space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-foreground">
                            #{order.public_token || order.id.slice(0, 6)}
                          </span>
                          <span className="font-bold text-xs text-foreground">
                            {order.customer_snapshot?.name || "Cliente"}
                          </span>
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/10 text-emerald-600 uppercase">
                          {order.status === "ready_for_pickup"
                            ? "Aguardando Retirada"
                            : "Entregador a Caminho"}
                        </span>
                      </div>

                      <span className="text-xs font-black text-foreground">
                        {formatMoney(order.total_cents)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(order.id, "delivered")}
                        disabled={isProcessing}
                        className="flex-1 rounded-xl font-bold text-xs h-9 border-success/40 text-success hover:bg-success/10"
                      >
                        Confirmar Entrega
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-9 rounded-xl shrink-0"
                      >
                        <Link to={`/workspace/pedidos/${order.id}` as never}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : viewMode === "picking" ? (
        /* ── Visualização Separação de Mercado & Picking de Gôndola ── */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-card ">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <ShoppingBag className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Separação de Gôndola & Conferência de Itens
                </h2>
                <p className="text-xs text-muted-foreground">
                  Confira cada produto na prateleira antes de fechar a sacola de entrega
                </p>
              </div>
            </div>

            <Badge variant="outline" className="font-mono text-xs font-bold">
              {preparingOrders.length + newOrders.length} pedidos pendentes de separação
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...newOrders, ...preparingOrders].length === 0 ? (
              <div className="col-span-2 py-16 text-center space-y-2 bg-muted/10 rounded-3xl border-0 p-8">
                <PackageCheck className="size-10 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-bold text-foreground">Todos os pedidos foram separados!</p>
                <p className="text-xs text-muted-foreground">Nenhuma comanda pendente de conferência no momento.</p>
              </div>
            ) : (
              [...newOrders, ...preparingOrders].map((order) => {
                const items = order.items_snapshot || [];
                const totalItems = items.length || 1;
                const checkedCount = items.filter((_: any, idx: number) => checkedItems[`${order.id}-${idx}`]).length;
                const isAllChecked = checkedCount === totalItems && totalItems > 0;
                const customerPhone = order.customer_snapshot?.phone;

                return (
                  <div
                    key={order.id}
                    className="p-5 rounded-3xl  bg-card  space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      {/* Header do Pedido */}
                      <div className="flex items-start justify-between gap-3 pb-3 ">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-base text-foreground">
                              #{order.public_token || order.id.slice(0, 6)}
                            </span>
                            <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                              {order.shipping_method === "pickup" ? "Retirada Balcão" : "Entrega Agendada"}
                            </Badge>
                          </div>
                          <p className="text-xs font-bold text-foreground mt-1">
                            {order.customer_snapshot?.name || "Cliente Wider"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {order.customer_snapshot?.address_city || "Chapecó - SC"}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="font-mono font-black text-sm text-foreground">
                            {formatMoney(order.total_cents)}
                          </span>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {checkedCount}/{totalItems} itens conferidos
                          </p>
                        </div>
                      </div>

                      {/* Lista de Itens do Supermercado para Conferência */}
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {items.length > 0 ? (
                          items.map((item: any, idx: number) => {
                            const itemKey = `${order.id}-${idx}`;
                            const isChecked = !!checkedItems[itemKey];

                            return (
                              <div
                                key={idx}
                                onClick={() =>
                                  setCheckedItems((prev) => ({
                                    ...prev,
                                    [itemKey]: !prev[itemKey],
                                  }))
                                }
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                                  isChecked
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-foreground"
                                    : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/60"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`size-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                      isChecked
                                        ? "bg-emerald-600 border-emerald-600 text-white"
                                        : "border-border bg-card"
                                    }`}
                                  >
                                    {isChecked && <CheckCircle2 className="size-3.5" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p
                                      className={`text-xs font-bold truncate ${
                                        isChecked ? "line-through opacity-70" : "text-foreground"
                                      }`}
                                    >
                                      {item.title || item.product_name || `Item #${idx + 1}`}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-mono">
                                      Qtd: {item.quantity || 1} • {formatMoney(item.unit_price_cents || item.price_cents || 0)}
                                    </p>
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (customerPhone) {
                                      window.open(
                                        `https://wa.me/55${customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${order.customer_snapshot?.name}, sobre o item "${item.title || "produto"}" do seu pedido #${order.public_token}: gostaríamos de propor uma substituição.`)}`,
                                        "_blank",
                                      );
                                    } else {
                                      toast.info(`Item ${item.title} marcado para substituição.`);
                                    }
                                  }}
                                  className="h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 rounded-lg shrink-0"
                                >
                                  Substituir
                                </Button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="p-3 bg-muted/20 rounded-xl text-xs text-muted-foreground text-center">
                            Ver detalhes do pedido na comanda
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer com Ações do Separador */}
                    <div className="pt-3  flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusChange(order.id, "ready_for_pickup")}
                        disabled={isProcessing}
                        className={`flex-1 rounded-xl font-bold text-xs h-10 transition-all ${
                          isAllChecked
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white "
                            : "bg-foreground text-background"
                        }`}
                      >
                        <CheckCircle2 className="size-4 mr-1.5" />
                        <span>
                          {isAllChecked
                            ? "Concluir Separação & Despachar"
                            : `Concluir (${checkedCount}/${totalItems})`}
                        </span>
                      </Button>

                      <Button
                        asChild
                        variant="outline"
                        size="icon"
                        className="size-10 rounded-xl shrink-0"
                        title="Ver Comanda Completa"
                      >
                        <Link to={`/workspace/pedidos/${order.id}` as never}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* ── Visualização Tabela Clássica ── */
        <div className="bg-card overflow-hidden rounded-2xl border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Pedido</TableHead>
                <TableHead>Data & Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Meio / Frete</TableHead>
                <TableHead className="text-right">Total Final</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => {
                const badgeInfo = getStatusLabel(order.status);

                return (
                  <TableRow key={order.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      #{order.public_token || order.id.slice(0, 6)}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(order.created_at)}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          {order.customer_snapshot?.name || "Cliente Avulso"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customer_snapshot?.email ||
                            order.customer_snapshot?.phone ||
                            "Sem contato"}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground uppercase">
                          {order.payment_method || "Pix / Balcão"}
                        </span>
                        <span>{order.shipping_method || "Entrega Padrão"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right font-extrabold text-sm text-foreground">
                      {formatMoney(order.total_cents)}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={badgeInfo.variant} className="text-[10px]">
                        {badgeInfo.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Ações do pedido">
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                          <DropdownMenuLabel className="text-xs">
                            Ações Operacionais
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link to={`/workspace/pedidos/${order.id}` as never}>
                              <Eye className="size-3.5 mr-2" />
                              Ver Ficha 360 do Pedido
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              to={`/workspace/pedidos/${order.id}/recibo` as never}
                              target="_blank"
                            >
                              <ReceiptText className="size-3.5 mr-2" />
                              Imprimir Recibo / Comprovante
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />

                          {order.status === "awaiting_payment" && (
                            <DropdownMenuItem onClick={() => handleQuickApprove(order.id)}>
                              <CheckCircle2 className="size-3.5 mr-2 text-success" />
                              Aprovar Pagamento
                            </DropdownMenuItem>
                          )}

                          {(order.status === "paid" || order.status === "processing") && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusChange(
                                  order.id,
                                  order.shipping_method === "pickup"
                                    ? "ready_for_pickup"
                                    : "shipped",
                                )
                              }
                            >
                              <Truck className="size-3.5 mr-2 text-primary" />
                              {order.shipping_method === "pickup"
                                ? "Pronto p/ Retirada"
                                : "Marcar como Enviado"}
                            </DropdownMenuItem>
                          )}

                          {(order.status === "shipped" || order.status === "ready_for_pickup") && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, "delivered")}
                            >
                              <PackageCheck className="size-3.5 mr-2 text-success" />
                              Confirmar Entrega ao Cliente
                            </DropdownMenuItem>
                          )}

                          {order.status !== "cancelled" && order.status !== "delivered" && (
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(order.id, "cancelled")}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="size-3.5 mr-2" />
                              Cancelar Pedido
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
