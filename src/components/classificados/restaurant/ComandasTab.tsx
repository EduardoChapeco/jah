import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useComandas, useCreateComanda, useUpdateComanda, useAddComandaItem,
  useSendToKitchen, useCouvertConfig, useRestaurantTables, useCompanyBrands
} from "@/hooks/useRestaurant";
import { useCompanyProducts, useCatalogSections } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Receipt, AlertTriangle, Search, Send, ShoppingCart, Users, Percent, CreditCard, Banknote, Smartphone, X } from "lucide-react";
import { toast } from "sonner";
import { updateRestaurantTableStatus } from "@/services/pdv.functions";

const statusLabels: Record<string, string> = { open: "Aberta", closed: "Fechada", cancelled: "Cancelada" };
const statusColors: Record<string, string> = { open: "bg-green-100 text-green-800", closed: "bg-muted text-muted-foreground", cancelled: "bg-red-100 text-red-800" };

interface Props { companyId: string; }

export default function ComandasTab({ companyId }: Props) {
  const { user } = useAuth();
  const { data: comandas = [], isLoading } = useComandas(companyId);
  const { data: products = [] } = useCompanyProducts(companyId);
  const { data: sections = [] } = useCatalogSections(companyId);
  const { data: couvertConfig } = useCouvertConfig(companyId);
  const { data: tables = [] } = useRestaurantTables(companyId);
  const { data: brands = [] } = useCompanyBrands(companyId);
  const createComanda = useCreateComanda();
  const updateComanda = useUpdateComanda();
  const addItem = useAddComandaItem();
  const sendToKitchen = useSendToKitchen();

  // State
  const [showNew, setShowNew] = useState(false);
  const [newTableId, setNewTableId] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [newPeople, setNewPeople] = useState(2);
  const [splitByClient, setSplitByClient] = useState(false);
  const [clientNames, setClientNames] = useState<string[]>([""]);
  const [selectedBrand, setSelectedBrand] = useState("");

  const [selectedComanda, setSelectedComanda] = useState<any>(null);
  const [filter, setFilter] = useState("open");

  // Add item state
  const [addingProduct, setAddingProduct] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [itemQty, setItemQty] = useState(1);
  const [itemNotes, setItemNotes] = useState("");
  const [itemClient, setItemClient] = useState("");
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  // Closing state
  const [showClose, setShowClose] = useState(false);
  const [tipPercent, setTipPercent] = useState(0);
  const [customTip, setCustomTip] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountReason, setDiscountReason] = useState("");
  const [splitMode, setSplitMode] = useState<"none" | "equal" | "by_item" | "custom">("none");
  const [splitPeople, setSplitPeople] = useState(2);
  const [customSplits, setCustomSplits] = useState<number[]>([]);
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([]);
  const [cashReceived, setCashReceived] = useState(0);

  const couvertEnabled = couvertConfig?.enabled || false;
  const couvertPrice = couvertConfig?.price_per_person || 0;

  const availableTables = tables.filter((t: any) => t.status === "available" || t.status === "reserved");

  // Filtered products
  const filteredProducts = useMemo(() => {
    let list = products as any[];
    if (selectedSection !== "all") list = list.filter(p => p.catalog_section_id === selectedSection);
    if (productSearch) {
      const q = productSearch.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, selectedSection, productSearch]);

  const handleCreate = async () => {
    if (!user) return;
    const table = tables.find((t: any) => t.id === newTableId);
    const tableName = table ? `Mesa ${(table as any).table_number}` : "Balcão";
    const people = splitByClient ? clientNames.filter(n => n.trim()).length || newPeople : newPeople;

    const comanda = await createComanda.mutateAsync({
      company_id: companyId,
      table_name: tableName,
      customer_name: splitByClient ? clientNames.filter(n => n.trim()).join(", ") : (newCustomer || null),
      opened_by: user.id,
      brand_id: selectedBrand || null,
    });

    // Auto-add couvert
    if (couvertEnabled && couvertPrice > 0 && people > 0) {
      await addItem.mutateAsync({
        comanda_id: comanda.id,
        product_name: `Couvert (${people} pessoas)`,
        quantity: people,
        unit_price: couvertPrice,
        total_price: couvertPrice * people,
        added_by: user.id,
      });
    }

    // Update table status if selected
    if (table) {
      try {
        await updateRestaurantTableStatus({
          data: {
            tableId: table.id,
            status: "occupied",
          },
        });
      } catch (err) {
        console.warn("[ComandasTab] Erro ao atualizar status da mesa:", err);
      }
    }

    toast.success("Comanda aberta");
    setShowNew(false);
    resetNewForm();
  };

  const resetNewForm = () => {
    setNewTableId("");
    setNewCustomer("");
    setNewPeople(2);
    setSplitByClient(false);
    setClientNames([""]);
    setSelectedBrand("");
  };

  // Add item to pending list (launch later) or send immediately
  const handleAddItem = (sendNow: boolean) => {
    if (!selectedProduct || !selectedComanda) return;
    const unitPrice = Number(selectedProduct.sale_price || selectedProduct.price);
    const item = {
      product: selectedProduct,
      qty: itemQty,
      notes: itemNotes,
      client: itemClient,
      unitPrice,
      total: unitPrice * itemQty,
    };

    if (sendNow) {
      sendItems([item]);
    } else {
      setPendingItems(prev => [...prev, item]);
      toast.info(`${selectedProduct.name} adicionado ao rascunho`);
    }

    setSelectedProduct(null);
    setItemQty(1);
    setItemNotes("");
  };

  const sendItems = async (items: any[]) => {
    if (!selectedComanda || !user) return;
    for (const item of items) {
      await addItem.mutateAsync({
        comanda_id: selectedComanda.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.qty,
        unit_price: item.unitPrice,
        total_price: item.total,
        notes: item.notes || null,
        added_by: user.id,
      });
    }
    // Send all to kitchen at once
    await sendToKitchen.mutateAsync({
      company_id: companyId,
      comanda_id: selectedComanda.id,
      table_number: selectedComanda.table_name,
      items: items.map(i => ({ name: i.product.name, qty: i.qty, notes: i.notes })),
      source: "comanda",
      brand_id: selectedComanda.brand_id || null,
    });
    toast.success(`${items.length} item(ns) enviado(s) para cozinha`);
    setPendingItems([]);
  };

  const sendPendingToKitchen = () => {
    if (pendingItems.length === 0) return;
    sendItems(pendingItems);
  };

  // Closing logic
  const openCloseDialog = (comanda: any) => {
    setShowClose(true);
    setTipPercent(0);
    setCustomTip(0);
    setDiscountValue(0);
    setDiscountReason("");
    setSplitMode("none");
    setSplitPeople(2);
    setPayments([]);
    setCashReceived(0);
  };

  const getComandaTotal = (comanda: any) => {
    const items = comanda?.comanda_items || [];
    return items.reduce((s: number, i: any) => s + (i.total_price || 0), 0);
  };

  const calcFinalTotal = () => {
    if (!selectedComanda) return 0;
    const subtotal = getComandaTotal(selectedComanda);
    const tip = tipPercent > 0 ? subtotal * (tipPercent / 100) : customTip;
    return subtotal - discountValue + tip;
  };

  const calcChange = () => {
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
    const cashPayment = payments.find(p => p.method === "dinheiro");
    if (cashPayment && cashReceived > 0) {
      return Math.max(0, cashReceived - cashPayment.amount);
    }
    return Math.max(0, totalPaid - calcFinalTotal());
  };

  const addPayment = (method: string) => {
    const remaining = calcFinalTotal() - payments.reduce((s, p) => s + p.amount, 0);
    setPayments(prev => [...prev, { method, amount: Math.max(0, remaining) }]);
  };

  const removePayment = (idx: number) => {
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClose = async () => {
    if (!selectedComanda) return;
    const subtotal = getComandaTotal(selectedComanda);
    const tip = tipPercent > 0 ? subtotal * (tipPercent / 100) : customTip;
    const total = subtotal - discountValue + tip;

    // Check minimum consumption
    const minCons = (couvertConfig as any)?.minimum_consumption_enabled ? Number((couvertConfig as any)?.minimum_consumption || 0) : 0;
    if (minCons > 0 && subtotal < minCons) {
      const proceed = window.confirm(`⚠️ Consumo atual: R$ ${subtotal.toFixed(2)}\nMínimo: R$ ${minCons.toFixed(2)}\nFalta: R$ ${(minCons - subtotal).toFixed(2)}\n\nFechar mesmo assim?`);
      if (!proceed) return;
    }

    await updateComanda.mutateAsync({
      id: selectedComanda.id,
      status: "closed",
      subtotal,
      total,
      discount: discountValue,
      payment_methods: payments.length > 0 ? payments : null,
      amount_paid: payments.reduce((s, p) => s + p.amount, 0),
      change_due: calcChange(),
      closed_at: new Date().toISOString(),
    });

    // Free the table
    const table = tables.find((t: any) => (t as any).current_comanda_id === selectedComanda.id);
    if (table) {
      try {
        await updateRestaurantTableStatus({
          data: {
            tableId: (table as any).id,
            status: "available",
          },
        });
      } catch (err) {
        console.warn("[ComandasTab] Erro ao liberar mesa:", err);
      }
    }

    toast.success("Comanda fechada!");
    setShowClose(false);
    setSelectedComanda(null);
  };

  const handleRemoveCouvert = async (comanda: any) => {
    toast.info("Couvert marcado para remoção no fechamento");
  };

  const filtered = comandas.filter((c: any) => filter === "all" ? true : c.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Comandas</h2>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Nova Comanda</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["open", "closed", "all"].map(s => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s === "open" ? "Abertas" : s === "closed" ? "Fechadas" : "Todas"}
            <Badge variant="secondary" className="ml-1">{comandas.filter((c: any) => s === "all" ? true : c.status === s).length}</Badge>
          </Button>
        ))}
      </div>

      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((comanda: any) => {
            const items = comanda.comanda_items || [];
            const total = items.reduce((s: number, i: any) => s + (i.total_price || 0), 0);
            const minCons = (couvertConfig as any)?.minimum_consumption_enabled ? Number((couvertConfig as any)?.minimum_consumption || 0) : 0;
            const belowMin = minCons > 0 && total < minCons && comanda.status === "open";
            const brand = brands.find((b: any) => b.id === comanda.brand_id);
            return (
              <Card key={comanda.id} className={`cursor-pointer hover:shadow-md transition-shadow ${belowMin ? "border-orange-400" : ""}`} onClick={() => setSelectedComanda(comanda)}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{comanda.table_name}</CardTitle>
                      {brand && <Badge variant="outline" style={{ borderColor: brand.accent_color }}>{brand.name}</Badge>}
                    </div>
                    <Badge className={statusColors[comanda.status] || ""} variant="outline">{statusLabels[comanda.status] || comanda.status}</Badge>
                  </div>
                  {comanda.customer_name && <p className="text-xs text-muted-foreground">{comanda.customer_name}</p>}
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm">{items.length} itens</p>
                  <p className="text-lg font-bold">R$ {total.toFixed(2)}</p>
                  {belowMin && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                      <AlertTriangle className="h-3 w-3" />Falta R$ {(minCons - total).toFixed(2)} p/ mínimo
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========== NEW COMANDA DIALOG ========== */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Comanda</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Mesa</Label>
              <Select value={newTableId} onValueChange={setNewTableId}>
                <SelectTrigger><SelectValue placeholder="Balcão (sem mesa)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balcao">Balcão</SelectItem>
                  {availableTables.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>Mesa {t.table_number}{t.nickname ? ` - ${t.nickname}` : ""} ({t.capacity}p)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {brands.length > 0 && (
              <div>
                <Label>Marca</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger><SelectValue placeholder="Marca principal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Marca principal</SelectItem>
                    {brands.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div><Label>Dividir por cliente</Label><p className="text-xs text-muted-foreground">Cada pessoa tem sua sub-comanda</p></div>
              <Switch checked={splitByClient} onCheckedChange={v => { setSplitByClient(v); if (v) setClientNames([""]); }} />
            </div>

            {splitByClient ? (
              <div className="space-y-2">
                {clientNames.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder={`Cliente ${i + 1}`} value={name} onChange={e => { const c = [...clientNames]; c[i] = e.target.value; setClientNames(c); }} />
                    {clientNames.length > 1 && <Button variant="ghost" size="sm" onClick={() => setClientNames(clientNames.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>}
                  </div>
                ))}
                <Button size="sm" variant="outline" onClick={() => setClientNames([...clientNames, ""])}><Plus className="h-4 w-4 mr-1" />Pessoa</Button>
              </div>
            ) : (
              <>
                <div><Label>Nome do Cliente</Label><Input value={newCustomer} onChange={e => setNewCustomer(e.target.value)} placeholder="Opcional" /></div>
                <div><Label>Nº de Pessoas</Label><Input type="number" min={1} value={newPeople} onChange={e => setNewPeople(+e.target.value)} /></div>
              </>
            )}

            {couvertEnabled && (
              <div className="p-2 bg-muted rounded text-sm">
                <p>🎵 Couvert: R$ {couvertPrice.toFixed(2)}/pessoa × {splitByClient ? clientNames.filter(n => n.trim()).length || 1 : newPeople} = <strong>R$ {(couvertPrice * (splitByClient ? clientNames.filter(n => n.trim()).length || 1 : newPeople)).toFixed(2)}</strong></p>
              </div>
            )}
          </div>
          <DialogFooter><Button onClick={handleCreate}>Abrir Comanda</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== COMANDA DETAIL DIALOG ========== */}
      <Dialog open={!!selectedComanda && !showClose} onOpenChange={() => { setSelectedComanda(null); setPendingItems([]); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              {selectedComanda?.table_name}
              {selectedComanda?.customer_name && <span className="text-sm font-normal text-muted-foreground">— {selectedComanda.customer_name}</span>}
            </DialogTitle>
          </DialogHeader>

          {/* Items list */}
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {(selectedComanda?.comanda_items || []).map((item: any) => {
              const isCouvert = item.product_name?.toLowerCase().includes("couvert");
              return (
                <div key={item.id} className={`flex justify-between items-center p-2 rounded border text-sm ${isCouvert ? "bg-muted/50 border-dashed" : ""}`}>
                  <div>
                    <span className="font-medium">{item.quantity}x {item.product_name}</span>
                    {item.notes && <p className="text-xs text-muted-foreground">📝 {item.notes}</p>}
                  </div>
                  <span className="font-medium">R$ {(item.total_price || 0).toFixed(2)}</span>
                </div>
              );
            })}
            {(selectedComanda?.comanda_items || []).length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum item</p>}
          </div>

          {/* Pending items (draft) */}
          {pendingItems.length > 0 && (
            <div className="border-t pt-2 space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">📋 Rascunho ({pendingItems.length})</p>
                <Button size="sm" onClick={sendPendingToKitchen}><Send className="h-3 w-3 mr-1" />Enviar Tudo</Button>
              </div>
              {pendingItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-1.5 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-sm">
                  <span>{item.qty}x {item.product.name}{item.client ? ` (${item.client})` : ""}</span>
                  <div className="flex items-center gap-1">
                    <span>R$ {item.total.toFixed(2)}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setPendingItems(prev => prev.filter((_, j) => j !== i))}><X className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          {(() => {
            const items = selectedComanda?.comanda_items || [];
            const total = items.reduce((s: number, i: any) => s + (i.total_price || 0), 0);
            const minCons = (couvertConfig as any)?.minimum_consumption_enabled ? Number((couvertConfig as any)?.minimum_consumption || 0) : 0;
            return (
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-lg font-bold"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
                {minCons > 0 && selectedComanda?.status === "open" && (
                  <div className={`text-sm ${total >= minCons ? "text-green-600" : "text-orange-600"}`}>
                    Consumo mínimo: R$ {minCons.toFixed(2)} · {total >= minCons ? "✅ Atingido" : `Falta: R$ ${(minCons - total).toFixed(2)}`}
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter className="gap-2 flex-wrap">
            {selectedComanda?.status === "open" && (
              <>
                <Button variant="outline" onClick={() => { setAddingProduct(true); setProductSearch(""); setSelectedSection("all"); }}>
                  <Plus className="h-4 w-4 mr-1" />Adicionar Item
                </Button>
                <Button variant="outline" onClick={() => handleRemoveCouvert(selectedComanda)}>Remover Couvert</Button>
                <Button onClick={() => openCloseDialog(selectedComanda)}>Fechar Comanda</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== ADD PRODUCT DIALOG (mobile-first) ========== */}
      <Dialog open={addingProduct} onOpenChange={v => { setAddingProduct(v); if (!v) setSelectedProduct(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Adicionar Produto</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar por nome..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              <Button size="sm" variant={selectedSection === "all" ? "default" : "outline"} className="text-xs shrink-0" onClick={() => setSelectedSection("all")}>Todos</Button>
              {sections.map((s: any) => (
                <Button key={s.id} size="sm" variant={selectedSection === s.id ? "default" : "outline"} className="text-xs shrink-0" onClick={() => setSelectedSection(s.id)}>{s.name}</Button>
              ))}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-1 gap-1.5 max-h-[200px] overflow-y-auto">
              {filteredProducts.map((p: any) => (
                <div key={p.id} className={`p-2 rounded border cursor-pointer transition-colors ${selectedProduct?.id === p.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`} onClick={() => setSelectedProduct(p)}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{p.name}</span>
                    <span className="text-sm font-medium">R$ {(p.sale_price || p.price || 0).toFixed(2)}</span>
                  </div>
                  {p.short_description && <p className="text-xs text-muted-foreground">{p.short_description}</p>}
                </div>
              ))}
              {filteredProducts.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto encontrado</p>}
            </div>

            {/* Qty, notes, client */}
            {selectedProduct && (
              <div className="border-t pt-3 space-y-2">
                <p className="font-medium text-sm">{selectedProduct.name} — R$ {(selectedProduct.sale_price || selectedProduct.price || 0).toFixed(2)}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Qtd</Label><Input type="number" min={1} value={itemQty} onChange={e => setItemQty(+e.target.value)} /></div>
                  {selectedComanda?.customer_name?.includes(",") && (
                    <div><Label>Cliente</Label><Select value={itemClient} onValueChange={setItemClient}>
                      <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {selectedComanda.customer_name.split(",").map((n: string, i: number) => (
                          <SelectItem key={i} value={n.trim()}>{n.trim()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select></div>
                  )}
                </div>
                <div><Label>Observação</Label><Input value={itemNotes} onChange={e => setItemNotes(e.target.value)} placeholder="Sem cebola, bem passado..." /></div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleAddItem(false)} disabled={!selectedProduct}>
              <ShoppingCart className="h-4 w-4 mr-1" />Lançar Depois
            </Button>
            <Button onClick={() => handleAddItem(true)} disabled={!selectedProduct}>
              <Send className="h-4 w-4 mr-1" />Enviar p/ Cozinha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== CLOSE / CHECKOUT DIALOG ========== */}
      <Dialog open={showClose} onOpenChange={setShowClose}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Fechar Comanda — {selectedComanda?.table_name}</DialogTitle></DialogHeader>
          {selectedComanda && (() => {
            const items = selectedComanda.comanda_items || [];
            const subtotal = items.reduce((s: number, i: any) => s + (i.total_price || 0), 0);
            const tip = tipPercent > 0 ? subtotal * (tipPercent / 100) : customTip;
            const finalTotal = subtotal - discountValue + tip;
            const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
            const remaining = finalTotal - totalPaid;

            return (
              <div className="space-y-4">
                {/* Items summary */}
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>R$ {(item.total_price || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Discount */}
                <div className="border-t pt-3 space-y-2">
                  <Label className="flex items-center gap-1"><Percent className="h-4 w-4" />Desconto</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Valor R$" value={discountValue || ""} onChange={e => setDiscountValue(+e.target.value)} />
                    <Input placeholder="Motivo" value={discountReason} onChange={e => setDiscountReason(e.target.value)} />
                  </div>
                </div>

                {/* Tip */}
                <div className="border-t pt-3 space-y-2">
                  <Label>Gorjeta sugerida</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[0, 10, 12, 15].map(p => (
                      <Button key={p} size="sm" variant={tipPercent === p && customTip === 0 ? "default" : "outline"} onClick={() => { setTipPercent(p); setCustomTip(0); }}>
                        {p === 0 ? "Sem" : `${p}%`}
                      </Button>
                    ))}
                    <Input className="w-24" type="number" placeholder="Outro R$" value={customTip || ""} onChange={e => { setCustomTip(+e.target.value); setTipPercent(0); }} />
                  </div>
                  {(tipPercent > 0 || customTip > 0) && <p className="text-sm text-muted-foreground">Gorjeta: R$ {tip.toFixed(2)}</p>}
                </div>

                {/* Split */}
                <div className="border-t pt-3 space-y-2">
                  <Label className="flex items-center gap-1"><Users className="h-4 w-4" />Divisão da Conta</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["none", "equal", "by_item", "custom"] as const).map(m => (
                      <Button key={m} size="sm" variant={splitMode === m ? "default" : "outline"} onClick={() => { setSplitMode(m); if (m === "custom") setCustomSplits(Array(splitPeople).fill(0)); }}>
                        {m === "none" ? "Sem divisão" : m === "equal" ? "Igualitária" : m === "by_item" ? "Por item" : "Personalizado"}
                      </Button>
                    ))}
                  </div>
                  {splitMode === "equal" && (
                    <div className="flex items-center gap-2">
                      <Label>Pessoas:</Label>
                      <Input type="number" min={2} className="w-20" value={splitPeople} onChange={e => setSplitPeople(+e.target.value)} />
                      <span className="text-sm">= R$ {(finalTotal / splitPeople).toFixed(2)} cada</span>
                    </div>
                  )}
                  {splitMode === "custom" && (
                    <div className="space-y-1">
                      {customSplits.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sm w-20">Pessoa {i + 1}:</span>
                          <Input type="number" className="w-28" value={v || ""} onChange={e => { const s = [...customSplits]; s[i] = +e.target.value; setCustomSplits(s); }} />
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => setCustomSplits([...customSplits, 0])}><Plus className="h-3 w-3 mr-1" />Pessoa</Button>
                    </div>
                  )}
                </div>

                {/* Payment methods */}
                <div className="border-t pt-3 space-y-2">
                  <Label>Formas de Pagamento</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: "cartao_credito", label: "Crédito", icon: CreditCard },
                      { key: "cartao_debito", label: "Débito", icon: CreditCard },
                      { key: "pix", label: "PIX", icon: Smartphone },
                      { key: "dinheiro", label: "Dinheiro", icon: Banknote },
                    ].map(pm => (
                      <Button key={pm.key} size="sm" variant="outline" onClick={() => addPayment(pm.key)}>
                        <pm.icon className="h-3 w-3 mr-1" />{pm.label}
                      </Button>
                    ))}
                  </div>
                  {payments.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Badge variant="outline">{p.method}</Badge>
                      <Input type="number" className="w-28" value={p.amount || ""} onChange={e => { const arr = [...payments]; arr[i].amount = +e.target.value; setPayments(arr); }} />
                      <Button variant="ghost" size="sm" onClick={() => removePayment(i)}><X className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  {payments.some(p => p.method === "dinheiro") && (
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Recebido:</Label>
                      <Input type="number" className="w-28" value={cashReceived || ""} onChange={e => setCashReceived(+e.target.value)} />
                      {cashReceived > 0 && <span className="text-sm font-medium text-green-600">Troco: R$ {calcChange().toFixed(2)}</span>}
                    </div>
                  )}
                  {remaining > 0.01 && <p className="text-sm text-orange-600">Falta: R$ {remaining.toFixed(2)}</p>}
                </div>

                {/* Final summary */}
                <div className="border-t pt-3 space-y-1 bg-muted/30 rounded p-3">
                  <div className="flex justify-between text-sm"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
                  {discountValue > 0 && <div className="flex justify-between text-sm text-red-600"><span>Desconto</span><span>-R$ {discountValue.toFixed(2)}</span></div>}
                  {tip > 0 && <div className="flex justify-between text-sm text-green-600"><span>Gorjeta</span><span>+R$ {tip.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-lg font-bold border-t pt-1"><span>Total</span><span>R$ {finalTotal.toFixed(2)}</span></div>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClose(false)}>Cancelar</Button>
            <Button onClick={handleClose}>Confirmar Fechamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
