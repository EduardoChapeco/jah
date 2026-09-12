import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Plus, Minus, Trash2, Percent, ShoppingCart, CreditCard,
  QrCode, Banknote, X, Pause, RotateCcw, Eye, Lock, ChevronLeft,
  Receipt, Users, Utensils, Scale, Tag, Printer, Package, ScanBarcode, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCreateSale, PAYMENT_METHODS } from "@/hooks/usePOS";
import type { POSRegister, POSSession } from "@/hooks/usePOS";
import BarcodeScanner, { useUSBScanner, type ScanResult } from "@/components/scanner/BarcodeScanner";
import { useSearchCustomers, useUpdateCustomer, useAddLoyaltyTransaction, type Customer, LOYALTY_LEVELS } from "@/hooks/useCustomers";
import { Star, Award, UserCircle } from "lucide-react";

interface CartItem {
  id: string;
  product_id: string;
  name: string;
  photo: string | null;
  unit_price: number;
  quantity: number;
  notes: string;
  discount: number;
  discount_type: "fixed" | "percent";
  sell_unit?: string;
  weight_kg?: number;
  price_per_kg?: number;
}

interface Payment {
  method: string;
  amount: number;
  details?: string;
}

interface SuspendedSale {
  id: number;
  items: CartItem[];
  timestamp: string;
}

interface Props {
  register: POSRegister;
  session: POSSession;
  companyId: string;
  onBack: () => void;
}

export default function POSSalesTerminal({ register, session, companyId, onBack }: Props) {
  const searchRef = useRef<HTMLInputElement>(null);
  const createSale = useCreateSale();

  // Products
  const { data: products } = useQuery({
    queryKey: ["pos-products", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, sale_price, photos, catalog_section_id, is_available, catalog_sections(name)")
        .eq("company_id", companyId)
        .eq("is_available", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // Combos
  const { data: combos } = useQuery({
    queryKey: ["pos-combos", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_combos")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: sections } = useQuery({
    queryKey: ["pos-sections", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("catalog_sections")
        .select("id, name")
        .eq("company_id", companyId)
        .eq("active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  // State
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [paymentTab, setPaymentTab] = useState("dinheiro");
  const [cashReceived, setCashReceived] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);

  // Discount
  const [discountDialog, setDiscountDialog] = useState(false);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"fixed" | "percent">("percent");
  const [discountReason, setDiscountReason] = useState("");

  // Auth dialog
  const [authDialog, setAuthDialog] = useState<{ action: string; callback: () => void } | null>(null);
  const [authPassword, setAuthPassword] = useState("");

  // Suspended
  const [suspended, setSuspended] = useState<SuspendedSale[]>([]);
  const [suspendedDialog, setSuspendedDialog] = useState(false);

  // Price check
  const [priceCheckDialog, setPriceCheckDialog] = useState(false);
  const [priceCheckProduct, setPriceCheckProduct] = useState<any>(null);

  // Return dialog
  const [returnDialog, setReturnDialog] = useState(false);

  // Fiado
  const [fiadoDialog, setFiadoDialog] = useState(false);
  const [fiadoCustomer, setFiadoCustomer] = useState("");

  // Post-sale
  const [saleComplete, setSaleComplete] = useState(false);
  const [changeDue, setChangeDue] = useState(0);

  // Weighing
  const [weighDialog, setWeighDialog] = useState<any>(null);
  const [weighMode, setWeighMode] = useState<"auto" | "manual">("manual");
  const [weighValue, setWeighValue] = useState("");
  const [weighUnit, setWeighUnit] = useState<"kg" | "g">("kg");
  const [simulatedWeight, setSimulatedWeight] = useState(0);

  // Buffet
  const [buffetDialog, setBuffetDialog] = useState(false);
  const [buffetWeight, setBuffetWeight] = useState("");

  // Label printing
  const [labelDialog, setLabelDialog] = useState<any>(null);
  const [labelExpiry, setLabelExpiry] = useState("3");
  const [labelLot, setLabelLot] = useState("");

  // Scanner
  const [scannerOpen, setScannerOpen] = useState(false);
  const barcodeEnabled = register.config?.barcode_enabled !== false;

  // Customer identification
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Partial<Customer> | null>(null);
  const [customerDialog, setCustomerDialog] = useState(false);
  const [addPointsToggle, setAddPointsToggle] = useState(true);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const { data: customerResults } = useSearchCustomers(companyId, customerSearch);
  const addLoyaltyTxn = useAddLoyaltyTransaction();
  const updateCust = useUpdateCustomer();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F3") { e.preventDefault(); setPriceCheckDialog(true); }
      if (e.key === "F12" || (e.key === "Enter" && e.ctrlKey)) { e.preventDefault(); handleFinalize(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, payments, cashReceived]);

  // Filter products
  const filtered = products?.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    const matchSection = !activeSection || p.catalog_section_id === activeSection;
    return matchSearch && matchSection;
  }) || [];

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => {
    const itemTotal = item.unit_price * item.quantity;
    const disc = item.discount_type === "percent" ? itemTotal * (item.discount / 100) : item.discount;
    return sum + itemTotal - disc;
  }, 0);

  const [globalDiscount, setGlobalDiscount] = useState(0);
  const total = Math.max(0, subtotal - globalDiscount);

  const totalPaid = paymentTab === "misto"
    ? payments.reduce((s, p) => s + p.amount, 0)
    : paymentTab === "dinheiro" ? Number(cashReceived) || 0 : total;
  const remaining = total - totalPaid;

  // EAN-13 weighable barcode parser (prefix 2: weight embedded)
  const parseWeighableEAN = (code: string): { productCode: string; weightKg: number } | null => {
    if (code.length !== 13 || !code.startsWith("2")) return null;
    const productCode = code.substring(1, 7);
    const weightRaw = parseInt(code.substring(7, 12), 10);
    const weightKg = weightRaw / 1000;
    return { productCode, weightKg };
  };

  // Determine buffet price by time
  const getBuffetPrice = (): number => {
    const hour = new Date().getHours();
    if (hour >= 11 && hour < 15) return 39.90; // Almoço
    if (hour >= 18 && hour < 22) return 44.90; // Jantar
    return 39.90; // Default
  };

  const getBuffetPeriod = (): string => {
    const hour = new Date().getHours();
    if (hour >= 11 && hour < 15) return "Almoço (11h-15h)";
    if (hour >= 18 && hour < 22) return "Jantar (18h-22h)";
    return "Padrão";
  };

  // Check if product is weighable
  const isWeighable = (product: any): boolean => {
    const unit = product.sell_unit || product.unit;
    return ["kg", "g"].includes(unit);
  };

  // Actions
  const addToCart = useCallback((product: any) => {
    if (isWeighable(product)) {
      setWeighDialog(product);
      setWeighValue("");
      setWeighUnit("kg");
      setSimulatedWeight(0);
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id && !i.notes);
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: product.name,
        photo: product.photos?.[0] || null,
        unit_price: product.sale_price || product.price,
        quantity: 1,
        notes: "",
        discount: 0,
        discount_type: "fixed" as const,
      }];
    });
  }, []);

  const addWeighedToCart = (product: any, weightKg: number) => {
    const pricePerKg = product.price_per_kg || product.sale_price || product.price;
    const totalPrice = weightKg * pricePerKg;
    setCart(prev => [...prev, {
      id: crypto.randomUUID(),
      product_id: product.id,
      name: product.name,
      photo: product.photos?.[0] || null,
      unit_price: totalPrice,
      quantity: 1,
      notes: `${weightKg.toFixed(3)} kg × R$ ${pricePerKg.toFixed(2)}/kg`,
      discount: 0,
      discount_type: "fixed" as const,
      sell_unit: "kg",
      weight_kg: weightKg,
      price_per_kg: pricePerKg,
    }]);
  };

  const addBuffetToCart = () => {
    const wt = Number(buffetWeight) || 0;
    if (wt <= 0) return;
    const pricePerKg = getBuffetPrice();
    const totalPrice = wt * pricePerKg;
    setCart(prev => [...prev, {
      id: crypto.randomUUID(),
      product_id: "buffet",
      name: `Buffet por Kilo (${getBuffetPeriod()})`,
      photo: null,
      unit_price: totalPrice,
      quantity: 1,
      notes: `${wt.toFixed(3)} kg × R$ ${pricePerKg.toFixed(2)}/kg`,
      discount: 0,
      discount_type: "fixed" as const,
      sell_unit: "kg",
      weight_kg: wt,
      price_per_kg: pricePerKg,
    }]);
    setBuffetDialog(false);
    setBuffetWeight("");
    toast.success(`Buffet: ${wt.toFixed(3)} kg = R$ ${totalPrice.toFixed(2)}`);
  };

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const removeCartItem = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
    setEditingItem(null);
  };

  // ═══ SCANNER INTEGRATION ═══
  const handleScanResult = useCallback((result: ScanResult) => {
    const code = result.raw.trim();
    switch (result.type) {
      case "product_barcode":
      case "product_qr": {
        const product = products?.find(p =>
          (p as any).barcode === code || (p as any).sku === code || p.id === code
        );
        if (product) {
          const existing = cart.find(i => i.product_id === product.id && !i.notes);
          if (existing) {
            updateCartItem(existing.id, { quantity: existing.quantity + 1 });
            toast.success(`${product.name} × ${existing.quantity + 1}`);
          } else {
            addToCart(product);
            toast.success(`${product.name} adicionado`);
          }
        } else {
          toast.error(`Produto não encontrado: ${code}`, {
            action: { label: "Buscar", onClick: () => setSearch(code) },
          });
        }
        break;
      }
      case "gift_card": toast.info(`Gift Card detectado: ${code}`); break;
      case "coupon": toast.success(`Cupom "${code}" aplicado!`); break;
      case "nfe": toast.info("NF-e detectada — abrindo registro de despesa"); break;
      case "pix": toast.info("QR Code PIX detectado"); break;
      case "credential": toast.info(`Credencial: ${code}`); break;
      case "ticket": toast.info(`Ingresso: ${code}`); break;
      default: setSearch(code); toast.info(`Código "${code}" — buscando...`);
    }
  }, [products, cart, addToCart, updateCartItem]);

  useUSBScanner({ enabled: barcodeEnabled, onScan: handleScanResult });

  const applyGlobalDiscount = () => {
    const val = Number(discountValue) || 0;
    const disc = discountType === "percent" ? subtotal * (val / 100) : val;
    setGlobalDiscount(disc);
    setDiscountDialog(false);
    toast.success(`Desconto de R$ ${disc.toFixed(2)} aplicado`);
  };

  const handleSuspend = () => {
    if (cart.length === 0) return;
    const id = (suspended.length || 0) + 1;
    setSuspended(prev => [...prev, { id, items: [...cart], timestamp: new Date().toISOString() }]);
    setCart([]);
    setGlobalDiscount(0);
    toast.success(`Venda #${id} suspensa`);
  };

  const handleRecover = (sale: SuspendedSale) => {
    setCart(sale.items);
    setSuspended(prev => prev.filter(s => s.id !== sale.id));
    setSuspendedDialog(false);
    toast.success(`Venda #${sale.id} recuperada`);
  };

  const addMixedPayment = (method: string, amount: number) => {
    if (amount <= 0) return;
    setPayments(prev => [...prev, { method, amount }]);
  };

  const handleFinalize = () => {
    if (cart.length === 0) { toast.error("Carrinho vazio"); return; }

    const salePayments: Payment[] = paymentTab === "misto"
      ? payments
      : [{ method: paymentTab, amount: paymentTab === "dinheiro" ? Number(cashReceived) || total : total }];

    const paidTotal = salePayments.reduce((s, p) => s + p.amount, 0);
    if (paidTotal < total) { toast.error("Pagamento insuficiente"); return; }

    const change = paymentTab === "dinheiro" ? Math.max(0, paidTotal - total) : 0;

    createSale.mutate({
      session_id: session.id,
      company_id: companyId,
      customer_id: null,
      items: cart.map(i => ({
        product_id: i.product_id, name: i.name, qty: i.quantity,
        unit_price: i.unit_price, discount: i.discount, notes: i.notes,
      })),
      subtotal,
      discount: globalDiscount,
      discount_reason: discountReason || null,
      total,
      payments: salePayments,
      change_due: change,
      status: "completed",
      sale_number: null,
      notes: null,
    }, {
      onSuccess: () => {
        setChangeDue(change);
        setSaleComplete(true);
      },
      onError: () => toast.error("Erro ao registrar venda"),
    });
  };

  const resetSale = () => {
    setCart([]);
    setGlobalDiscount(0);
    setCashReceived("");
    setPayments([]);
    setDiscountReason("");
    setDiscountValue("");
    setSaleComplete(false);
    setChangeDue(0);
    setPaymentTab("dinheiro");
  };

  // ─── SALE COMPLETE DIALOG ───
  if (saleComplete) {
    return (
      <div className="flex items-center justify-center h-full min-h-[80vh]">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 rounded-full bg-[hsl(var(--badge-green))]/10 flex items-center justify-center mx-auto">
            <Receipt className="w-10 h-10 text-[hsl(var(--badge-green))]" />
          </div>
          <div>
            <h2 className="text-2xl font-[800] text-foreground">Venda Finalizada!</h2>
            <p className="text-lg font-bold text-foreground mt-2">Total: R$ {total.toFixed(2)}</p>
            {changeDue > 0 && (
              <p className="text-2xl font-[800] text-[hsl(var(--badge-orange))] mt-2">Troco: R$ {changeDue.toFixed(2)}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={resetSale}>Nova Venda</Button>
            <Button variant="outline" className="flex-1" onClick={() => { toast.success("Cupom enviado via WhatsApp"); resetSale(); }}>WhatsApp</Button>
            <Button className="flex-1" onClick={() => { toast.success("Imprimindo cupom..."); resetSale(); }}>Imprimir</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── MAIN LAYOUT ───
  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-border bg-card shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 text-muted-foreground shrink-0">
          <ChevronLeft className="w-4 h-4" /> Voltar
        </Button>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-bold text-foreground">{register.name}</span>
          <span className="text-[10px] text-muted-foreground ml-2">Sessão aberta</span>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {barcodeEnabled && (
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary" onClick={() => setScannerOpen(true)}>
              <ScanBarcode className="w-3.5 h-3.5" /> Scanner
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setPriceCheckDialog(true)}>
            <Eye className="w-3.5 h-3.5" /> F3
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={handleSuspend} disabled={cart.length === 0}>
            <Pause className="w-3.5 h-3.5" /> Suspender
          </Button>
          {suspended.length > 0 && (
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setSuspendedDialog(true)}>
              <RotateCcw className="w-3.5 h-3.5" /> Recuperar ({suspended.length})
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setReturnDialog(true)}>
            <RotateCcw className="w-3.5 h-3.5" /> Troca
          </Button>
          <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setBuffetDialog(true)}>
            <Utensils className="w-3.5 h-3.5" /> Buffet
          </Button>
        </div>
      </div>

      {/* Body: catalog + cart */}
      <div className="flex flex-1 min-h-0">
        {/* ─── LEFT: CATALOG ─── */}
        <div className="flex-[3] flex flex-col border-r border-border min-h-0">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                value={search}
                onChange={e => {
                  const val = e.target.value;
                  setSearch(val);
                  // Check for EAN-13 weighable barcode (starts with 2)
                  if (val.length === 13 && val.startsWith("2")) {
                    const parsed = parseWeighableEAN(val);
                    if (parsed) {
                      const product = products?.find(p => (p as any).barcode?.includes(parsed.productCode));
                      if (product) {
                        addWeighedToCart(product, parsed.weightKg);
                        setSearch("");
                        toast.success(`${product.name}: ${parsed.weightKg.toFixed(3)} kg`);
                        return;
                      }
                      // Even without product match, add generic weight item
                      setCart(prev => [...prev, {
                        id: crypto.randomUUID(),
                        product_id: `ean-${parsed.productCode}`,
                        name: `Produto ${parsed.productCode}`,
                        photo: null,
                        unit_price: 0,
                        quantity: 1,
                        notes: `${parsed.weightKg.toFixed(3)} kg (via etiqueta)`,
                        discount: 0,
                        discount_type: "fixed" as const,
                        sell_unit: "kg",
                        weight_kg: parsed.weightKg,
                      }]);
                      setSearch("");
                      toast.info(`Código ${parsed.productCode}: ${parsed.weightKg.toFixed(3)} kg — ajuste o preço manualmente`);
                    }
                  }
                }}
                placeholder="Buscar produto, código ou código de barras... (F2)"
                className="pl-10 h-11 bg-background text-sm"
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs */}
          {sections && sections.length > 0 && (
            <div className="px-3 py-2 border-b border-border overflow-x-auto flex gap-1.5 shrink-0">
              <button
                onClick={() => setActiveSection(null)}
                className={`px-3 py-1.5 rounded-[var(--rF)] text-xs font-medium whitespace-nowrap transition-colors ${
                  !activeSection ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >Todos</button>
              <button
                onClick={() => setActiveSection("__combos__")}
                className={`px-3 py-1.5 rounded-[var(--rF)] text-xs font-medium whitespace-nowrap transition-colors ${
                  activeSection === "__combos__" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >🎁 Combos</button>
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-3 py-1.5 rounded-[var(--rF)] text-xs font-medium whitespace-nowrap transition-colors ${
                    activeSection === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >{s.name}</button>
              ))}
            </div>
          )}

          {/* Product grid */}
          <ScrollArea className="flex-1">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
              {/* Combo cards */}
              {(activeSection === "__combos__" || !activeSection) && combos?.map(combo => {
                const photo = combo.photo_url;
                const hasSavings = combo.original_price > 0 && combo.original_price > combo.combo_price;
                const savingsPct = hasSavings ? Math.round(((combo.original_price - combo.combo_price) / combo.original_price) * 100) : 0;
                return (
                  <button
                    key={`combo-${combo.id}`}
                    onClick={() => {
                      setCart(prev => [...prev, {
                        id: crypto.randomUUID(),
                        product_id: `combo-${combo.id}`,
                        name: combo.name,
                        photo: photo || null,
                        unit_price: combo.combo_price,
                        quantity: 1,
                        notes: `COMBO ${combo.combo_type.toUpperCase()}`,
                        discount: 0,
                        discount_type: "fixed" as const,
                      }]);
                      toast.success(`${combo.name} adicionado`);
                    }}
                    className="group bg-card border-2 border-primary/30 rounded-[var(--r3)] p-2 text-left hover:border-primary hover:shadow-md transition-all relative"
                  >
                    <Badge className="absolute top-1 right-1 z-10 bg-primary text-primary-foreground text-[9px] px-1.5">
                      COMBO
                    </Badge>
                    {photo ? (
                      <div className="aspect-square rounded-[var(--r2)] overflow-hidden bg-muted mb-2">
                        <img src={photo} alt={combo.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-[var(--r2)] bg-primary/5 mb-2 flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary/30" />
                      </div>
                    )}
                    <p className="text-xs font-medium text-foreground truncate">{combo.name}</p>
                    <div className="mt-1">
                      {hasSavings && (
                        <span className="text-[10px] text-muted-foreground line-through mr-1">R$ {combo.original_price.toFixed(2)}</span>
                      )}
                      <span className="text-sm font-[800] text-primary">R$ {combo.combo_price.toFixed(2)}</span>
                      {hasSavings && (
                        <Badge className="ml-1 bg-green-100 text-green-800 border-green-200 text-[8px] px-1 py-0 h-4">
                          -{savingsPct}%
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}

              {/* Regular products (hide when showing combos only) */}
              {activeSection !== "__combos__" && filtered.map(p => {
                const photo = Array.isArray(p.photos) && p.photos.length > 0 ? p.photos[0] : null;
                const price = (p.sale_price || p.price) as number;
                return (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group bg-card border border-border rounded-[var(--r3)] p-2 text-left hover:border-primary/50 hover:shadow-sm transition-all"
                  >
                    {photo ? (
                      <div className="aspect-square rounded-[var(--r2)] overflow-hidden bg-muted mb-2">
                        <img src={photo as string} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="aspect-square rounded-[var(--r2)] bg-muted mb-2 flex items-center justify-center">
                        <ShoppingCart className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                    <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-[800] text-foreground">R$ {price.toFixed(2)}</span>
                        {isWeighable(p) && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">
                            <Scale className="w-2.5 h-2.5 mr-0.5" />/kg
                          </Badge>
                        )}
                      </div>
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-3.5 h-3.5 text-primary" />
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-12 text-center text-muted-foreground text-sm">
                  {search ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* ─── RIGHT: CART ─── */}
        <div className="flex-[2] flex flex-col min-h-0 bg-card">
          {/* Cart header */}
          <div className="px-3 py-2 border-b border-border flex items-center justify-between shrink-0">
            <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4" /> Carrinho ({cart.length})
            </span>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs text-destructive h-7" onClick={() => { setCart([]); setGlobalDiscount(0); }}>
                Limpar
              </Button>
            )}
          </div>

          {/* Cart items */}
          <ScrollArea className="flex-1 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-xs">Adicione produtos ao carrinho</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {cart.map(item => {
                  const itemTotal = item.unit_price * item.quantity;
                  const disc = item.discount_type === "percent" ? itemTotal * (item.discount / 100) : item.discount;
                  const isEditing = editingItem === item.id;
                  return (
                    <div key={item.id} className="px-3 py-2">
                      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditingItem(isEditing ? null : item.id)}>
                        <div className="flex items-center gap-1 shrink-0">
                          <button className="w-6 h-6 rounded bg-muted flex items-center justify-center"
                            onClick={e => { e.stopPropagation(); updateCartItem(item.id, { quantity: Math.max(1, item.quantity - 1) }); }}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button className="w-6 h-6 rounded bg-muted flex items-center justify-center"
                            onClick={e => { e.stopPropagation(); updateCartItem(item.id, { quantity: item.quantity + 1 }); }}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                          {item.notes && <p className="text-[10px] text-muted-foreground truncate">{item.notes}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-foreground">R$ {(itemTotal - disc).toFixed(2)}</p>
                          {disc > 0 && <p className="text-[9px] text-destructive">-R$ {disc.toFixed(2)}</p>}
                        </div>
                        <button className="p-1 text-muted-foreground hover:text-destructive"
                          onClick={e => { e.stopPropagation(); removeCartItem(item.id); }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Expanded edit */}
                      {isEditing && (
                        <div className="mt-2 space-y-2 pl-[72px]">
                          <div>
                            <Label className="text-[10px]">Observação</Label>
                            <Input className="h-7 text-xs" value={item.notes}
                              onChange={e => updateCartItem(item.id, { notes: e.target.value })} placeholder="Ex: sem cebola" />
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label className="text-[10px]">Desconto</Label>
                              <Input className="h-7 text-xs" type="number" value={item.discount || ""}
                                onChange={e => updateCartItem(item.id, { discount: Number(e.target.value) || 0 })} placeholder="0" />
                            </div>
                            <div>
                              <Label className="text-[10px]">Tipo</Label>
                              <Select value={item.discount_type} onValueChange={v => updateCartItem(item.id, { discount_type: v as "fixed" | "percent" })}>
                                <SelectTrigger className="h-7 text-xs w-16"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="fixed">R$</SelectItem>
                                  <SelectItem value="percent">%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Cart footer */}
          {cart.length > 0 && (
            <div className="border-t border-border p-3 space-y-3 shrink-0">
              {/* Customer identification */}
              <div className="space-y-1.5">
                {selectedCustomer ? (
                  <div className="flex items-center gap-2 p-2 bg-primary/[0.04] border border-primary/20 rounded-[var(--r3)]">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-[800] text-primary">{selectedCustomer.name?.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{selectedCustomer.name}</p>
                      <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-primary" />{selectedCustomer.loyalty_points || 0} pts</span>
                        <span>{selectedCustomer.segment === "vip" ? "VIP" : selectedCustomer.segment === "regular" ? "Regular" : "Ocasional"}</span>
                      </div>
                    </div>
                    <button className="p-1 text-muted-foreground hover:text-destructive" onClick={() => { setSelectedCustomer(null); setRedeemPoints(0); }}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button className="w-full flex items-center gap-2 p-2 border border-dashed border-border rounded-[var(--r3)] text-xs text-muted-foreground hover:border-primary/30 hover:text-foreground transition-colors"
                    onClick={() => { setCustomerSearch(""); setCustomerDialog(true); }}>
                    <UserCircle className="w-4 h-4" /> Identificar cliente (CPF, telefone ou nome)
                  </button>
                )}
              </div>
              {/* Subtotal + discount */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                {globalDiscount > 0 && (
                  <div className="flex justify-between text-destructive">
                    <span>Desconto</span>
                    <span className="font-medium">-R$ {globalDiscount.toFixed(2)}</span>
                  </div>
                )}
                <button className="text-[10px] text-primary hover:underline flex items-center gap-1"
                  onClick={() => setDiscountDialog(true)}>
                  <Percent className="w-3 h-3" /> Aplicar desconto geral
                </button>
              </div>

              <Separator />

              {/* Total */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">TOTAL</span>
                <span className="text-2xl font-[800] text-foreground">R$ {total.toFixed(2)}</span>
              </div>

              {/* Payment method tabs */}
              <Tabs value={paymentTab} onValueChange={setPaymentTab}>
                <TabsList className="w-full grid grid-cols-5 h-8">
                  <TabsTrigger value="dinheiro" className="text-[10px]">Dinheiro</TabsTrigger>
                  <TabsTrigger value="pix" className="text-[10px]">PIX</TabsTrigger>
                  <TabsTrigger value="debito" className="text-[10px]">Débito</TabsTrigger>
                  <TabsTrigger value="credito" className="text-[10px]">Crédito</TabsTrigger>
                  <TabsTrigger value="misto" className="text-[10px]">Misto</TabsTrigger>
                </TabsList>

                <TabsContent value="dinheiro" className="mt-2 space-y-2">
                  <Input type="number" value={cashReceived} onChange={e => setCashReceived(e.target.value)}
                    placeholder="Valor recebido" className="h-10 text-base font-bold" />
                  <div className="flex gap-1">
                    {[20, 50, 100, 200].map(v => (
                      <Button key={v} variant="outline" size="sm" className="flex-1 text-xs h-8"
                        onClick={() => setCashReceived(String(v))}>R${v}</Button>
                    ))}
                    <Button variant="outline" size="sm" className="flex-1 text-xs h-8"
                      onClick={() => setCashReceived(total.toFixed(2))}>Exato</Button>
                  </div>
                  {cashReceived && Number(cashReceived) >= total && (
                    <div className="bg-[hsl(var(--badge-green))]/10 rounded-[var(--r2)] p-2 text-center">
                      <span className="text-xs text-muted-foreground">Troco:</span>
                      <span className="text-lg font-[800] text-[hsl(var(--badge-green))] ml-2">
                        R$ {(Number(cashReceived) - total).toFixed(2)}
                      </span>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pix" className="mt-2">
                  <div className="bg-muted/50 rounded-[var(--r3)] p-4 text-center space-y-2">
                    <QrCode className="w-16 h-16 mx-auto text-muted-foreground/30" />
                    <p className="text-xs font-medium">QR Code PIX · R$ {total.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Aguardando pagamento... (5:00)</p>
                  </div>
                </TabsContent>

                <TabsContent value="debito" className="mt-2">
                  <div className="bg-muted/50 rounded-[var(--r3)] p-4 text-center space-y-2">
                    <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/30" />
                    <p className="text-xs font-medium">Débito · R$ {total.toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Valor enviado para a maquininha</p>
                  </div>
                </TabsContent>

                <TabsContent value="credito" className="mt-2 space-y-2">
                  <div className="bg-muted/50 rounded-[var(--r3)] p-4 text-center space-y-2">
                    <CreditCard className="w-10 h-10 mx-auto text-muted-foreground/30" />
                    <p className="text-xs font-medium">Crédito · R$ {total.toFixed(2)}</p>
                  </div>
                  <Select defaultValue="1">
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">À vista</SelectItem>
                      {[2, 3, 4, 5, 6, 10, 12].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}x de R$ {(total / n).toFixed(2)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="misto" className="mt-2 space-y-2">
                  {payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted/50 rounded-[var(--r2)] px-3 py-1.5 text-xs">
                      <span className="capitalize font-medium">{p.method}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">R$ {p.amount.toFixed(2)}</span>
                        <button onClick={() => setPayments(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Select onValueChange={v => setPaymentTab(v || "misto")}>
                      <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Forma" /></SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input className="h-8 text-xs w-24" type="number" placeholder="R$" id="mixed-amount" />
                    <Button size="sm" className="h-8 text-xs" onClick={() => {
                      const input = document.getElementById("mixed-amount") as HTMLInputElement;
                      const lastSelect = paymentTab !== "misto" ? paymentTab : "dinheiro";
                      addMixedPayment(lastSelect, Number(input?.value) || 0);
                      if (input) input.value = "";
                      setPaymentTab("misto");
                    }}>+</Button>
                  </div>
                  {remaining > 0 && (
                    <p className="text-[10px] text-destructive text-center">Falta: R$ {remaining.toFixed(2)}</p>
                  )}
                </TabsContent>
              </Tabs>

              {/* Fiado */}
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground gap-1"
                onClick={() => setFiadoDialog(true)}>
                <Users className="w-3.5 h-3.5" /> Vender fiado
              </Button>

              {/* Finalize */}
              <Button
                className="w-full h-12 text-base font-[800] bg-[hsl(var(--badge-orange))] hover:bg-[hsl(var(--badge-orange))]/90 text-white"
                disabled={cart.length === 0 || createSale.isPending}
                onClick={handleFinalize}
              >
                {createSale.isPending ? "Finalizando..." : `Finalizar Venda · R$ ${total.toFixed(2)}`}
              </Button>
              <p className="text-[9px] text-center text-muted-foreground">F12 ou Ctrl+Enter</p>
            </div>
          )}
        </div>
      </div>

      {/* ── DIALOGS ── */}

      {/* Discount */}
      <Dialog open={discountDialog} onOpenChange={setDiscountDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Percent className="w-5 h-5" /> Desconto na Venda</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Valor</Label>
                <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={discountType} onValueChange={v => setDiscountType(v as "fixed" | "percent")}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">R$</SelectItem>
                    <SelectItem value="percent">%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Justificativa</Label><Input value={discountReason} onChange={e => setDiscountReason(e.target.value)} placeholder="Motivo do desconto" /></div>
            <Button className="w-full" onClick={applyGlobalDiscount}>Aplicar Desconto</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Price check */}
      <Dialog open={priceCheckDialog} onOpenChange={setPriceCheckDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="w-5 h-5" /> Consulta de Preço (F3)</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Buscar produto ou escanear código..." onChange={e => {
              const q = e.target.value.toLowerCase();
              const found = products?.find(p => p.name.toLowerCase().includes(q));
              setPriceCheckProduct(found || null);
            }} />
            {priceCheckProduct && (
              <div className="bg-muted/50 rounded-[var(--r3)] p-4 text-center space-y-2">
                <p className="text-sm font-bold text-foreground">{priceCheckProduct.name}</p>
                <p className="text-3xl font-[800] text-foreground">
                  R$ {((priceCheckProduct.sale_price || priceCheckProduct.price) as number).toFixed(2)}
                </p>
                {priceCheckProduct.sale_price && priceCheckProduct.price !== priceCheckProduct.sale_price && (
                  <p className="text-sm text-muted-foreground line-through">R$ {(priceCheckProduct.price as number).toFixed(2)}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Suspended sales */}
      <Dialog open={suspendedDialog} onOpenChange={setSuspendedDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Vendas Suspensas ({suspended.length})</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {suspended.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-[var(--r3)]">
                <div>
                  <p className="text-sm font-bold">Venda #{s.id}</p>
                  <p className="text-[10px] text-muted-foreground">{s.items.length} itens · {new Date(s.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <Button size="sm" onClick={() => handleRecover(s)}>Recuperar</Button>
              </div>
            ))}
            {suspended.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda suspensa</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* Return */}
      <Dialog open={returnDialog} onOpenChange={setReturnDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RotateCcw className="w-5 h-5" /> Troca / Devolução</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Buscar venda original</Label><Input placeholder="Número da venda ou CPF do cliente" /></div>
            <div><Label>Motivo</Label>
              <Select><SelectTrigger><SelectValue placeholder="Selecione o motivo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="defeito">Produto com defeito</SelectItem>
                  <SelectItem value="errado">Produto errado</SelectItem>
                  <SelectItem value="desistencia">Desistência</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Observação</Label><Textarea placeholder="Detalhes da troca/devolução" rows={2} /></div>
            <div><Label>Crédito</Label>
              <Select defaultValue="devolucao"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="devolucao">Devolver dinheiro</SelectItem>
                  <SelectItem value="credito">Crédito na conta</SelectItem>
                  <SelectItem value="vale">Vale troca (impresso)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Senha gerencial *</Label><Input type="password" placeholder="Autorização obrigatória" /></div>
            <Button className="w-full">Processar Troca/Devolução</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fiado */}
      <Dialog open={fiadoDialog} onOpenChange={setFiadoDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Venda Fiado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Cliente *</Label><Input value={fiadoCustomer} onChange={e => setFiadoCustomer(e.target.value)} placeholder="Buscar cliente cadastrado..." /></div>
            <Separator />
            <p className="text-xs text-muted-foreground">Ou cadastrar novo cliente rápido:</p>
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Nome</Label><Input className="h-8 text-xs" placeholder="Nome completo" /></div>
              <div><Label className="text-xs">Telefone</Label><Input className="h-8 text-xs" placeholder="(00) 00000-0000" /></div>
            </div>
            <div className="bg-muted/50 rounded-[var(--r3)] p-3 text-center">
              <p className="text-xs text-muted-foreground">Total da venda</p>
              <p className="text-xl font-[800] text-foreground">R$ {total.toFixed(2)}</p>
            </div>
            <Button className="w-full" onClick={() => { setFiadoDialog(false); toast.success("Venda fiado registrada"); handleFinalize(); }}>
              Registrar Venda Fiado
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Auth dialog */}
      <Dialog open={!!authDialog} onOpenChange={o => !o && setAuthDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="w-5 h-5" /> Autorização Necessária</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{authDialog?.action}</p>
            <div><Label>Senha do gerente</Label><Input type="password" value={authPassword}
              onChange={e => setAuthPassword(e.target.value)} placeholder="Digite a senha" /></div>
            <Button className="w-full" onClick={() => { authDialog?.callback(); setAuthDialog(null); setAuthPassword(""); }}>
              Autorizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── WEIGHING DIALOG ── */}
      <Dialog open={!!weighDialog} onOpenChange={o => { if (!o) setWeighDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Pesagem — {weighDialog?.name}
            </DialogTitle>
          </DialogHeader>
          {weighDialog && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-[var(--r3)] p-3 text-center">
                <p className="text-xs text-muted-foreground">Preço por kg</p>
                <p className="text-xl font-[800] text-foreground">
                  R$ {((weighDialog.price_per_kg || weighDialog.sale_price || weighDialog.price) as number).toFixed(2)}/kg
                </p>
              </div>

              <Tabs value={weighMode} onValueChange={v => setWeighMode(v as "auto" | "manual")}>
                <TabsList className="w-full grid grid-cols-2 h-8">
                  <TabsTrigger value="auto" className="text-xs">Automático (balança)</TabsTrigger>
                  <TabsTrigger value="manual" className="text-xs">Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="auto" className="mt-3 space-y-3">
                  <div className="bg-card border-2 border-primary/20 rounded-[var(--r4)] p-6 text-center space-y-2">
                    <Scale className="w-8 h-8 mx-auto text-primary/40" />
                    <p className="text-xs text-muted-foreground">Coloque o produto na balança</p>
                    <p className="text-4xl font-[800] text-foreground tabular-nums">
                      {simulatedWeight > 0 ? simulatedWeight.toFixed(3) : "0.000"} <span className="text-lg">kg</span>
                    </p>
                    {simulatedWeight > 0 && (
                      <p className="text-sm font-bold text-primary">
                        = R$ {(simulatedWeight * ((weighDialog.price_per_kg || weighDialog.sale_price || weighDialog.price) as number)).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 text-xs" onClick={() => setSimulatedWeight(+(Math.random() * 2 + 0.1).toFixed(3))}>
                      Simular leitura
                    </Button>
                    <Button className="flex-1 text-xs" disabled={simulatedWeight <= 0}
                      onClick={() => {
                        addWeighedToCart(weighDialog, simulatedWeight);
                        setWeighDialog(null);
                        toast.success(`${weighDialog.name}: ${simulatedWeight.toFixed(3)} kg`);
                      }}>
                      Capturar peso
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="mt-3 space-y-3">
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-xs">Peso</Label>
                      <Input type="number" value={weighValue} onChange={e => setWeighValue(e.target.value)}
                        placeholder="0.000" className="h-12 text-lg font-bold" step="0.001" />
                    </div>
                    <Select value={weighUnit} onValueChange={v => setWeighUnit(v as "kg" | "g")}>
                      <SelectTrigger className="w-16 h-12"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {weighValue && Number(weighValue) > 0 && (
                    <div className="bg-muted/50 rounded-[var(--r3)] p-3 text-center">
                      <p className="text-xs text-muted-foreground">Preço calculado</p>
                      <p className="text-2xl font-[800] text-foreground">
                        R$ {((weighUnit === "g" ? Number(weighValue) / 1000 : Number(weighValue)) * ((weighDialog.price_per_kg || weighDialog.sale_price || weighDialog.price) as number)).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <Button className="w-full h-10" disabled={!weighValue || Number(weighValue) <= 0}
                    onClick={() => {
                      const wKg = weighUnit === "g" ? Number(weighValue) / 1000 : Number(weighValue);
                      addWeighedToCart(weighDialog, wKg);
                      setWeighDialog(null);
                      toast.success(`${weighDialog.name}: ${wKg.toFixed(3)} kg`);
                    }}>
                    Confirmar peso
                  </Button>
                </TabsContent>
              </Tabs>

              <Separator />
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5"
                onClick={() => {
                  const wKg = weighMode === "auto" ? simulatedWeight : (weighUnit === "g" ? Number(weighValue) / 1000 : Number(weighValue));
                  if (wKg <= 0) { toast.error("Pese o produto primeiro"); return; }
                  setLabelDialog({ ...weighDialog, weight_kg: wKg, price_per_kg: weighDialog.price_per_kg || weighDialog.sale_price || weighDialog.price });
                  setLabelExpiry("3");
                  setLabelLot("");
                }}>
                <Tag className="w-3.5 h-3.5" /> Imprimir etiqueta de peso
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── BUFFET DIALOG ── */}
      <Dialog open={buffetDialog} onOpenChange={setBuffetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[hsl(var(--badge-orange))]" /> Buffet por Kilo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted/50 rounded-[var(--r3)] p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground">{getBuffetPeriod()}</p>
              <p className="text-2xl font-[800] text-foreground">R$ {getBuffetPrice().toFixed(2)}/kg</p>
            </div>

            <div className="bg-card border border-border rounded-[var(--r3)] p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Tabela de preços</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span>Almoço (11h-15h)</span><span className="font-bold">R$ 39,90/kg</span></div>
                <div className="flex justify-between"><span>Jantar (18h-22h)</span><span className="font-bold">R$ 44,90/kg</span></div>
              </div>
            </div>

            <div>
              <Label className="font-bold">Peso (kg)</Label>
              <Input type="number" value={buffetWeight} onChange={e => setBuffetWeight(e.target.value)}
                placeholder="0.000" className="h-12 text-lg font-bold mt-1" step="0.001" />
            </div>

            {buffetWeight && Number(buffetWeight) > 0 && (
              <div className="bg-[hsl(var(--badge-orange))]/10 rounded-[var(--r3)] p-3 text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-2xl font-[800] text-[hsl(var(--badge-orange))]">
                  R$ {(Number(buffetWeight) * getBuffetPrice()).toFixed(2)}
                </p>
              </div>
            )}

            <Button className="w-full h-12 text-base font-bold bg-[hsl(var(--badge-orange))] hover:bg-[hsl(var(--badge-orange))]/90 text-white"
              disabled={!buffetWeight || Number(buffetWeight) <= 0}
              onClick={addBuffetToCart}>
              Adicionar ao Carrinho
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── LABEL PRINTING DIALOG ── */}
      <Dialog open={!!labelDialog} onOpenChange={o => { if (!o) setLabelDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" /> Etiqueta de Peso
            </DialogTitle>
          </DialogHeader>
          {labelDialog && (
            <div className="space-y-4">
              {/* Label preview */}
              <div className="border-2 border-dashed border-border rounded-[var(--r3)] p-4 space-y-2 bg-white text-black">
                <p className="text-sm font-bold text-center">{labelDialog.name}</p>
                <Separator className="bg-black/20" />
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span>Peso:</span><span className="font-bold text-right">{labelDialog.weight_kg.toFixed(3)} kg</span>
                  <span>Preço/kg:</span><span className="font-bold text-right">R$ {(labelDialog.price_per_kg as number).toFixed(2)}</span>
                </div>
                <Separator className="bg-black/20" />
                <div className="text-center">
                  <p className="text-xs text-gray-500">TOTAL</p>
                  <p className="text-xl font-[800]">R$ {(labelDialog.weight_kg * (labelDialog.price_per_kg as number)).toFixed(2)}</p>
                </div>
                <div className="flex justify-center py-2">
                  <div className="bg-black/10 px-4 py-1 rounded text-[10px] font-mono tracking-widest">
                    2{String(labelDialog.product_id).substring(0, 6).padStart(6, "0")}{String(Math.round(labelDialog.weight_kg * 1000)).padStart(5, "0")}0
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[10px] text-gray-500">
                  <span>Validade: {(() => {
                    const d = new Date(); d.setDate(d.getDate() + (Number(labelExpiry) || 3));
                    return d.toLocaleDateString("pt-BR");
                  })()}</span>
                  <span className="text-right">Lote: {labelLot || "AUTO"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Validade (dias a partir de hoje)</Label>
                  <Input type="number" value={labelExpiry} onChange={e => setLabelExpiry(e.target.value)}
                    className="h-8 text-xs mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Lote</Label>
                  <Input value={labelLot} onChange={e => setLabelLot(e.target.value)}
                    placeholder="AUTO" className="h-8 text-xs mt-1" />
                </div>
              </div>

              <Button className="w-full h-10 gap-2" onClick={() => {
                toast.success("Etiqueta enviada para impressora");
                setLabelDialog(null);
              }}>
                <Printer className="w-4 h-4" /> Imprimir Etiqueta
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Camera */}
      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScanResult}
        title="Scanner PDV"
      />

      {/* Customer Search Dialog */}
      <Dialog open={customerDialog} onOpenChange={setCustomerDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><UserCircle className="w-5 h-5" /> Identificar Cliente</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={customerSearch} onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Buscar por CPF, telefone ou nome..." autoFocus className="h-11" />
            <ScrollArea className="max-h-[250px]">
              {customerResults && customerResults.length > 0 ? (
                <div className="space-y-1">
                  {customerResults.map(c => {
                    const lvl = LOYALTY_LEVELS.find(l => l.value === c.loyalty_level);
                    return (
                      <button key={c.id} className="w-full flex items-center gap-3 p-3 rounded-[var(--r3)] border border-border hover:border-primary/30 text-left transition-colors"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerDialog(false);
                          toast.success(`Olá, ${c.name}! ${c.loyalty_points || 0} pontos disponíveis.`);
                        }}>
                        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-[800] text-primary">{c.name?.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground">{c.name}</p>
                          <p className="text-[10px] text-muted-foreground">{c.phone || c.cpf_cnpj || ""}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-primary">{c.loyalty_points || 0} pts</p>
                          {lvl && <Badge variant="outline" className="text-[8px]">{lvl.label}</Badge>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : customerSearch.length >= 2 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhum cliente encontrado.</p>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">Digite ao menos 2 caracteres para buscar.</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
