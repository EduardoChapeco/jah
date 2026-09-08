import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Trash2, CalendarIcon, Copy } from "lucide-react";
import { format } from "date-fns";
import { PROMO_TYPES, type Promotion } from "@/hooks/usePromotions";
import { useCreatePromotion, useUpdatePromotion } from "@/hooks/usePromotions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  editPromo?: Promotion | null;
}

const CHANNELS = [
  { value: "pdv", label: "PDV" },
  { value: "vitrine", label: "Vitrine Online" },
  { value: "ifood", label: "iFood" },
  { value: "ml", label: "Mercado Livre" },
  { value: "whatsapp", label: "WhatsApp" },
];

export default function PromotionWizard({ open, onOpenChange, companyId, editPromo }: Props) {
  const createPromo = useCreatePromotion();
  const updatePromo = useUpdatePromotion();

  const [name, setName] = useState(editPromo?.name || "");
  const [promoType, setPromoType] = useState(editPromo?.promo_type || "simple_discount");
  const [isActive, setIsActive] = useState(editPromo?.is_active ?? true);
  const [stackable, setStackable] = useState(editPromo?.stackable ?? false);
  const [priority, setPriority] = useState(editPromo?.priority?.toString() || "0");
  const [maxUses, setMaxUses] = useState(editPromo?.max_uses?.toString() || "");
  const [channels, setChannels] = useState<string[]>(editPromo?.channels || []);
  const [startsAt, setStartsAt] = useState<Date | undefined>(editPromo?.starts_at ? new Date(editPromo.starts_at) : undefined);
  const [endsAt, setEndsAt] = useState<Date | undefined>(editPromo?.ends_at ? new Date(editPromo.ends_at) : undefined);
  const [periodMode, setPeriodMode] = useState<"always" | "range" | "uses">(
    editPromo?.starts_at ? "range" : editPromo?.max_uses ? "uses" : "always"
  );

  // Config state (varies by type)
  const cfg = editPromo?.config || {};
  const [discountValue, setDiscountValue] = useState(cfg.discount_value?.toString() || "");
  const [discountUnit, setDiscountUnit] = useState(cfg.discount_unit || "percent");
  const [targetProducts, setTargetProducts] = useState<string[]>(cfg.product_ids || []);
  const [targetCategory, setTargetCategory] = useState(cfg.category || "");

  // Leve N Pague M
  const [leveN, setLeveN] = useState(cfg.leve_n?.toString() || "3");
  const [pagueM, setPagueM] = useState(cfg.pague_m?.toString() || "2");

  // Qty discount tiers
  const [qtyTiers, setQtyTiers] = useState<{ min: number; discount: number }[]>(cfg.qty_tiers || [{ min: 5, discount: 15 }]);

  // Payment discount
  const [paymentMethod, setPaymentMethod] = useState(cfg.payment_method || "pix");

  // Coupon
  const [couponCode, setCouponCode] = useState(cfg.coupon_code || "");
  const [couponPerCpf, setCouponPerCpf] = useState(cfg.per_cpf ?? false);
  const [couponMinValue, setCouponMinValue] = useState(cfg.min_value?.toString() || "");
  const [couponBatch, setCouponBatch] = useState(cfg.batch_count?.toString() || "");

  // Free shipping
  const [freeShipMinOrder, setFreeShipMinOrder] = useState(cfg.min_order?.toString() || "");

  // Gift
  const [giftProductId, setGiftProductId] = useState(cfg.gift_product_id || "");
  const [giftMinOrder, setGiftMinOrder] = useState(cfg.gift_min_order?.toString() || "");

  // Loyalty
  const [pointsPerReal, setPointsPerReal] = useState(cfg.points_per_real?.toString() || "1");
  const [pointsRedeemValue, setPointsRedeemValue] = useState(cfg.redeem_value?.toString() || "");
  const [pointsRedeemCost, setPointsRedeemCost] = useState(cfg.redeem_cost?.toString() || "");
  const [pointsExpiry, setPointsExpiry] = useState(cfg.points_expiry_days?.toString() || "365");
  const [pointsHasExpiry, setPointsHasExpiry] = useState(cfg.points_has_expiry ?? true);

  // Products for selection
  const { data: products } = useQuery({
    queryKey: ["promo-products", companyId],
    enabled: open,
    queryFn: async () => {
      const res = await listAdminProducts();
      return (res || []).map((p: any) => ({
        id: p.id,
        name: p.title || p.name || "",
        price: ((p.priceCents ?? p.price_cents ?? p.price ?? 0) as number) / 100,
      }));
    },
  });

  const [productSearch, setProductSearch] = useState("");
  const filteredProducts = products?.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase())
  ) || [];

  const toggleChannel = (ch: string) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);
  };

  const buildConfig = (): Record<string, any> => {
    const base: Record<string, any> = {};
    switch (promoType) {
      case "simple_discount":
        base.discount_value = Number(discountValue) || 0;
        base.discount_unit = discountUnit;
        base.product_ids = targetProducts;
        base.category = targetCategory;
        break;
      case "buy_n_pay_m":
        base.leve_n = Number(leveN) || 3;
        base.pague_m = Number(pagueM) || 2;
        base.product_ids = targetProducts;
        break;
      case "quantity_discount":
        base.qty_tiers = qtyTiers;
        base.product_ids = targetProducts;
        break;
      case "combo_promo":
        base.product_ids = targetProducts;
        base.discount_value = Number(discountValue) || 0;
        base.discount_unit = discountUnit;
        break;
      case "payment_discount":
        base.payment_method = paymentMethod;
        base.discount_value = Number(discountValue) || 0;
        base.discount_unit = "percent";
        break;
      case "coupon":
        base.coupon_code = couponCode;
        base.per_cpf = couponPerCpf;
        base.min_value = Number(couponMinValue) || 0;
        base.discount_value = Number(discountValue) || 0;
        base.discount_unit = discountUnit;
        base.batch_count = Number(couponBatch) || 0;
        break;
      case "free_shipping":
        base.min_order = Number(freeShipMinOrder) || 0;
        base.product_ids = targetProducts;
        break;
      case "gift":
        base.gift_product_id = giftProductId;
        base.gift_min_order = Number(giftMinOrder) || 0;
        break;
      case "loyalty":
        base.points_per_real = Number(pointsPerReal) || 1;
        base.redeem_value = Number(pointsRedeemValue) || 0;
        base.redeem_cost = Number(pointsRedeemCost) || 0;
        base.points_has_expiry = pointsHasExpiry;
        base.points_expiry_days = Number(pointsExpiry) || 365;
        break;
    }
    return base;
  };

  const handleSave = () => {
    if (!name) { toast.error("Nome é obrigatório"); return; }

    const data: any = {
      company_id: companyId,
      name,
      promo_type: promoType,
      config: buildConfig(),
      is_active: isActive,
      starts_at: periodMode === "range" && startsAt ? startsAt.toISOString() : null,
      ends_at: periodMode === "range" && endsAt ? endsAt.toISOString() : null,
      max_uses: periodMode === "uses" ? (Number(maxUses) || null) : null,
      stackable,
      priority: Number(priority) || 0,
      channels,
    };

    if (editPromo) {
      updatePromo.mutate({ id: editPromo.id, ...data }, {
        onSuccess: () => { onOpenChange(false); toast.success("Promoção atualizada!"); },
      });
    } else {
      createPromo.mutate(data, {
        onSuccess: () => { onOpenChange(false); toast.success("Promoção criada!"); },
      });
    }
  };

  const ProductPicker = () => (
    <div className="space-y-2">
      <Label className="text-xs">Produtos vinculados</Label>
      <div className="relative">
        <Input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar produto..." className="h-8 text-xs" />
        {productSearch && (
          <div className="absolute z-10 w-full mt-1 border border-border rounded-[var(--r2)] bg-popover max-h-32 overflow-y-auto shadow-md">
            {filteredProducts.filter(p => !targetProducts.includes(p.id)).map(p => (
              <button key={p.id} onClick={() => { setTargetProducts(prev => [...prev, p.id]); setProductSearch(""); }}
                className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent flex justify-between">
                <span>{p.name}</span><span className="text-muted-foreground">R$ {p.price.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {targetProducts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {targetProducts.map(pid => {
            const prod = products?.find(p => p.id === pid);
            return (
              <Badge key={pid} variant="secondary" className="text-[10px] gap-1">
                {prod?.name || pid}
                <button onClick={() => setTargetProducts(prev => prev.filter(i => i !== pid))}>
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>{editPromo ? "Editar" : "Criar"} Promoção</DialogTitle>
        </DialogHeader>
        <Separator className="mt-3" />
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {/* Basic info */}
            <div>
              <Label>Nome da promoção *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Desconto de verão" />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={promoType} onValueChange={setPromoType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map(pt => (
                    <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Type-specific config */}
            {promoType === "simple_discount" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Valor do desconto</Label>
                    <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="10" className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={discountUnit} onValueChange={setDiscountUnit}>
                      <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="fixed">R$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ProductPicker />
              </div>
            )}

            {promoType === "buy_n_pay_m" && (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Label className="text-xs">Leve (N)</Label>
                    <Input type="number" value={leveN} onChange={e => setLeveN(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">Pague (M)</Label>
                    <Input type="number" value={pagueM} onChange={e => setPagueM(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  "Leve {leveN || "N"} Pague {pagueM || "M"}" — o cliente paga apenas {pagueM || "M"} unidades
                </p>
                <ProductPicker />
              </div>
            )}

            {promoType === "quantity_discount" && (
              <div className="space-y-3">
                <Label className="text-xs">Faixas de desconto por quantidade</Label>
                {qtyTiers.map((tier, i) => (
                  <div key={i} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <Label className="text-[10px]">A partir de (un)</Label>
                      <Input type="number" value={tier.min} className="h-7 text-xs"
                        onChange={e => { const t = [...qtyTiers]; t[i] = { ...t[i], min: Number(e.target.value) }; setQtyTiers(t); }} />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px]">Desconto (%)</Label>
                      <Input type="number" value={tier.discount} className="h-7 text-xs"
                        onChange={e => { const t = [...qtyTiers]; t[i] = { ...t[i], discount: Number(e.target.value) }; setQtyTiers(t); }} />
                    </div>
                    <Button variant="ghost" size="sm" className="text-destructive h-7"
                      onClick={() => setQtyTiers(prev => prev.filter((_, j) => j !== i))}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="text-xs"
                  onClick={() => setQtyTiers(prev => [...prev, { min: 10, discount: 20 }])}>
                  <Plus className="w-3 h-3 mr-1" /> Faixa
                </Button>
                <ProductPicker />
              </div>
            )}

            {promoType === "combo_promo" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Selecione os produtos — ao comprar todos juntos, o desconto é aplicado no total.
                </p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Desconto no total</Label>
                    <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={discountUnit} onValueChange={setDiscountUnit}>
                      <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="fixed">R$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ProductPicker />
              </div>
            )}

            {promoType === "payment_discount" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Forma de pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Desconto (%)</Label>
                  <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="h-8 text-xs" placeholder="5" />
                </div>
              </div>
            )}

            {promoType === "coupon" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Código do cupom</Label>
                  <div className="flex gap-2">
                    <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="VERAO2025" className="h-8 text-xs uppercase" />
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                      onClick={() => setCouponCode(Math.random().toString(36).substring(2, 10).toUpperCase())}>
                      <Copy className="w-3 h-3 mr-1" /> Gerar
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Desconto</Label>
                    <Input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="h-8 text-xs" />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo</Label>
                    <Select value={discountUnit} onValueChange={setDiscountUnit}>
                      <SelectTrigger className="h-8 text-xs w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percent">%</SelectItem>
                        <SelectItem value="fixed">R$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Valor mínimo do pedido (R$)</Label>
                  <Input type="number" value={couponMinValue} onChange={e => setCouponMinValue(e.target.value)} className="h-8 text-xs" placeholder="0" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={couponPerCpf} onCheckedChange={setCouponPerCpf} className="scale-75" />
                  <span className="text-xs">Uso único por CPF</span>
                </div>
                <div>
                  <Label className="text-xs">Geração em lote (quantidade de códigos únicos)</Label>
                  <Input type="number" value={couponBatch} onChange={e => setCouponBatch(e.target.value)} className="h-8 text-xs" placeholder="0 = apenas um código" />
                </div>
              </div>
            )}

            {promoType === "free_shipping" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Pedido mínimo para frete grátis (R$)</Label>
                  <Input type="number" value={freeShipMinOrder} onChange={e => setFreeShipMinOrder(e.target.value)} className="h-8 text-xs" placeholder="0 = sem mínimo" />
                </div>
                <ProductPicker />
              </div>
            )}

            {promoType === "gift" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Compra mínima para ganhar brinde (R$)</Label>
                  <Input type="number" value={giftMinOrder} onChange={e => setGiftMinOrder(e.target.value)} className="h-8 text-xs" placeholder="100" />
                </div>
                <div>
                  <Label className="text-xs">Produto brinde</Label>
                  <Select value={giftProductId} onValueChange={setGiftProductId}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {products?.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {promoType === "loyalty" && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">R$ para ganhar 1 ponto</Label>
                    <Input type="number" value={pointsPerReal} onChange={e => setPointsPerReal(e.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
                <Separator />
                <p className="text-xs font-medium">Resgate</p>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Pontos necessários</Label>
                    <Input type="number" value={pointsRedeemCost} onChange={e => setPointsRedeemCost(e.target.value)} className="h-8 text-xs" placeholder="100" />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">= R$ de desconto</Label>
                    <Input type="number" value={pointsRedeemValue} onChange={e => setPointsRedeemValue(e.target.value)} className="h-8 text-xs" placeholder="10" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={pointsHasExpiry} onCheckedChange={setPointsHasExpiry} className="scale-75" />
                  <span className="text-xs">Pontos expiram</span>
                </div>
                {pointsHasExpiry && (
                  <div>
                    <Label className="text-xs">Validade (dias)</Label>
                    <Input type="number" value={pointsExpiry} onChange={e => setPointsExpiry(e.target.value)} className="h-8 text-xs" />
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Period */}
            <div className="space-y-3">
              <Label>Período de validade</Label>
              <Select value={periodMode} onValueChange={v => setPeriodMode(v as any)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="always">Sempre ativo</SelectItem>
                  <SelectItem value="range">Período específico</SelectItem>
                  <SelectItem value="uses">Por quantidade de resgates</SelectItem>
                </SelectContent>
              </Select>
              {periodMode === "range" && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label className="text-[10px]">Início</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-8 text-xs justify-start">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {startsAt ? format(startsAt, "dd/MM/yyyy") : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={startsAt} onSelect={setStartsAt} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px]">Fim</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-8 text-xs justify-start">
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {endsAt ? format(endsAt, "dd/MM/yyyy") : "Selecione"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={endsAt} onSelect={setEndsAt} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
              {periodMode === "uses" && (
                <div>
                  <Label className="text-xs">Máximo de resgates</Label>
                  <Input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)} className="h-8 text-xs" placeholder="100" />
                </div>
              )}
            </div>

            <Separator />

            {/* Channels */}
            <div>
              <Label>Canais</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CHANNELS.map(ch => (
                  <label key={ch.value} className="flex items-center gap-1.5 text-xs">
                    <Checkbox checked={channels.includes(ch.value)} onCheckedChange={() => toggleChannel(ch.value)} />
                    {ch.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Advanced */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs">Empilhável</Label>
                <p className="text-[10px] text-muted-foreground">Pode combinar com outros descontos</p>
              </div>
              <Switch checked={stackable} onCheckedChange={setStackable} />
            </div>
            <div>
              <Label className="text-xs">Prioridade</Label>
              <Input type="number" value={priority} onChange={e => setPriority(e.target.value)} className="h-8 text-xs w-20" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Ativo</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </ScrollArea>
        <Separator />
        <div className="px-6 py-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={createPromo.isPending || updatePromo.isPending}>
            {editPromo ? "Salvar" : "Criar Promoção"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
