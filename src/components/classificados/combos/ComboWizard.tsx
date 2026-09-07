import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Package, Search, Plus, Minus, Trash2, ArrowLeft, ArrowRight, Check,
  Image, Replace, AlertTriangle, ChevronDown, ChevronUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCreateCombo, useUpdateCombo, useUpsertComboItems, ProductCombo, ComboItem } from "@/hooks/useCombos";
import { toast } from "sonner";

interface ComboWizardProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyId: string;
  editCombo?: ProductCombo | null;
  editItems?: ComboItem[];
}

interface WizardItem {
  product_id: string;
  product_name: string;
  product_photo: string | null;
  product_price: number;
  quantity: number;
  is_fixed: boolean;
  alternatives: { id: string; name: string; price: number }[];
  premium_extra: number;
}

const STEPS = ["Identidade", "Itens", "Precificação", "Estoque"];

export default function ComboWizard({ open, onOpenChange, companyId, editCombo, editItems }: ComboWizardProps) {
  const [step, setStep] = useState(0);

  // Step 1 - Identity
  const [name, setName] = useState(editCombo?.name || "");
  const [comboType, setComboType] = useState(editCombo?.combo_type || "combo");
  const [description, setDescription] = useState(editCombo?.description || "");
  const [photoUrl, setPhotoUrl] = useState(editCombo?.photo_url || "");
  const [availability, setAvailability] = useState<Record<string, any>>(editCombo?.availability || {});
  const [isActive, setIsActive] = useState(editCombo?.is_active ?? true);

  // Step 2 - Items
  const [items, setItems] = useState<WizardItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [showAltPicker, setShowAltPicker] = useState<number | null>(null);

  // Step 3 - Pricing
  const [comboPrice, setComboPrice] = useState(editCombo?.combo_price?.toString() || "");
  const [premiumToggle, setPremiumToggle] = useState(false);

  // Step 4 - Stock
  const [autoPause, setAutoPause] = useState(true);

  const createCombo = useCreateCombo();
  const updateCombo = useUpdateCombo();
  const upsertItems = useUpsertComboItems();

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["combo-products", companyId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, photos, is_available")
        .eq("company_id", companyId)
        .eq("is_available", true)
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const filteredProducts = products?.filter(p =>
    !itemSearch || p.name.toLowerCase().includes(itemSearch.toLowerCase())
  ) || [];

  const originalPrice = useMemo(() =>
    items.reduce((sum, it) => sum + it.product_price * it.quantity, 0), [items]);

  const comboPriceNum = Number(comboPrice) || 0;
  const savings = originalPrice - comboPriceNum;
  const savingsPct = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;

  const addItem = (product: any) => {
    const existing = items.find(it => it.product_id === product.id);
    if (existing) {
      setItems(prev => prev.map(it =>
        it.product_id === product.id ? { ...it, quantity: it.quantity + 1 } : it
      ));
      return;
    }
    setItems(prev => [...prev, {
      product_id: product.id,
      product_name: product.name,
      product_photo: product.photos?.[0] || null,
      product_price: product.price,
      quantity: 1,
      is_fixed: true,
      alternatives: [],
      premium_extra: 0,
    }]);
  };

  const updateItem = (idx: number, updates: Partial<WizardItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...updates } : it));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const addAlternative = (itemIdx: number, product: any) => {
    const item = items[itemIdx];
    if (item.alternatives.find(a => a.id === product.id)) return;
    updateItem(itemIdx, {
      alternatives: [...item.alternatives, { id: product.id, name: product.name, price: product.price }],
    });
  };

  const removeAlternative = (itemIdx: number, altId: string) => {
    const item = items[itemIdx];
    updateItem(itemIdx, { alternatives: item.alternatives.filter(a => a.id !== altId) });
  };

  const handleSave = async () => {
    if (!name || items.length === 0 || !comboPrice) {
      toast.error("Preencha nome, itens e preço do combo");
      return;
    }

    try {
      let comboId = editCombo?.id;
      const comboData = {
        company_id: companyId,
        name,
        description: description || null,
        combo_type: comboType,
        photo_url: photoUrl || null,
        original_price: originalPrice,
        combo_price: comboPriceNum,
        is_active: isActive,
        availability: { ...availability, auto_pause: autoPause, premium_enabled: premiumToggle },
      };

      if (editCombo) {
        await updateCombo.mutateAsync({ id: editCombo.id, ...comboData });
      } else {
        const created = await createCombo.mutateAsync(comboData);
        comboId = (created as any).id;
      }

      if (comboId) {
        await upsertItems.mutateAsync({
          comboId,
          items: items.map((it, i) => ({
            combo_id: comboId!,
            product_id: it.product_id,
            quantity: it.quantity,
            is_fixed: it.is_fixed,
            sort_order: i,
            alternatives: it.alternatives.map(a => a.id) as any,
            premium_extra: it.premium_extra,
          })),
        });
      }

      toast.success(editCombo ? "Combo atualizado!" : "Combo criado!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar combo");
    }
  };

  const canNext = () => {
    if (step === 0) return !!name;
    if (step === 1) return items.length > 0;
    if (step === 2) return !!comboPrice && comboPriceNum > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {editCombo ? "Editar" : "Criar"} Combo / Kit
          </DialogTitle>
        </DialogHeader>

        {/* Step indicators */}
        <div className="px-6 py-3 flex gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s}
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step
                  ? "bg-primary text-primary-foreground"
                  : i < step
                  ? "bg-primary/20 text-primary cursor-pointer"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span className="w-4 text-center">{i + 1}</span>}
              {s}
            </button>
          ))}
        </div>

        <Separator />

        <ScrollArea className="flex-1 px-6 py-4">
          {/* STEP 1: Identity */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <Label>Nome do combo *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Combo X-Burguer" />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={comboType} onValueChange={setComboType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="combo">Combo</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                    <SelectItem value="bundle">Bundle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Foto do combo</Label>
                <Input value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} placeholder="URL da foto (ou deixe vazio para collage)" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descreva o combo..." rows={3} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          )}

          {/* STEP 2: Items */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Product search */}
              <div>
                <Label>Buscar produto para adicionar</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    placeholder="Nome do produto..."
                    className="pl-10"
                  />
                </div>
                {itemSearch && (
                  <div className="mt-1 border border-border rounded-[var(--r2)] max-h-40 overflow-y-auto bg-popover">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { addItem(p); setItemSearch(""); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex justify-between items-center"
                      >
                        <span>{p.name}</span>
                        <span className="text-muted-foreground">R$ {p.price.toFixed(2)}</span>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Nenhum produto encontrado</p>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Items list */}
              {items.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-20" />
                  Adicione produtos ao combo
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="border border-border rounded-[var(--r3)] p-3 space-y-2">
                      <div className="flex items-center gap-3">
                        {item.product_photo ? (
                          <img src={item.product_photo} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product_name}</p>
                          <p className="text-xs text-muted-foreground">R$ {item.product_price.toFixed(2)}/un</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button className="w-6 h-6 rounded bg-muted flex items-center justify-center"
                            onClick={() => updateItem(idx, { quantity: Math.max(1, item.quantity - 1) })}>
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                          <button className="w-6 h-6 rounded bg-muted flex items-center justify-center"
                            onClick={() => updateItem(idx, { quantity: item.quantity + 1 })}>
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button onClick={() => removeItem(idx)} className="text-destructive p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <label className="flex items-center gap-2">
                          <Switch
                            checked={item.is_fixed}
                            onCheckedChange={v => updateItem(idx, { is_fixed: v })}
                            className="scale-75"
                          />
                          <span>{item.is_fixed ? "Fixo (obrigatório)" : "Removível pelo cliente"}</span>
                        </label>
                      </div>

                      {/* Alternatives */}
                      <div>
                        <button
                          onClick={() => setShowAltPicker(showAltPicker === idx ? null : idx)}
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          <Replace className="w-3 h-3" />
                          Substituições ({item.alternatives.length})
                          {showAltPicker === idx ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {item.alternatives.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.alternatives.map(alt => (
                              <Badge key={alt.id} variant="secondary" className="text-[10px] gap-1">
                                {alt.name}
                                <button onClick={() => removeAlternative(idx, alt.id)}>
                                  <Trash2 className="w-2.5 h-2.5" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        {showAltPicker === idx && (
                          <div className="mt-2 border border-border rounded-[var(--r2)] max-h-32 overflow-y-auto bg-popover">
                            {products?.filter(p => p.id !== item.product_id && !item.alternatives.find(a => a.id === p.id))
                              .map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => addAlternative(idx, p)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-accent flex justify-between"
                                >
                                  <span>{p.name}</span>
                                  <span className="text-muted-foreground">R$ {p.price.toFixed(2)}</span>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Pricing */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-[var(--r3)] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Preço individual somado</span>
                  <span className="font-medium line-through">R$ {originalPrice.toFixed(2)}</span>
                </div>
                <div>
                  <Label>Preço do combo (R$) *</Label>
                  <Input
                    type="number"
                    value={comboPrice}
                    onChange={e => setComboPrice(e.target.value)}
                    placeholder="0.00"
                    className="text-lg font-bold"
                  />
                </div>
                {comboPriceNum > 0 && savings > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      Economize R$ {savings.toFixed(2)} ({savingsPct}%)
                    </Badge>
                  </div>
                )}
                {comboPriceNum > 0 && savings <= 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    O preço do combo não é menor que a soma individual
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label>Itens premium com acréscimo</Label>
                  <p className="text-xs text-muted-foreground">
                    Trocar por alternativa premium pode ter preço extra
                  </p>
                </div>
                <Switch checked={premiumToggle} onCheckedChange={setPremiumToggle} />
              </div>

              {premiumToggle && items.filter(it => it.alternatives.length > 0).length > 0 && (
                <div className="space-y-2">
                  {items.filter(it => it.alternatives.length > 0).map((item, idx) => (
                    <div key={idx} className="border border-border rounded-[var(--r2)] p-3">
                      <p className="text-sm font-medium mb-2">{item.product_name}</p>
                      <div>
                        <Label className="text-xs">Acréscimo por alternativa (R$)</Label>
                        <Input
                          type="number"
                          value={item.premium_extra || ""}
                          onChange={e => {
                            const realIdx = items.indexOf(item);
                            updateItem(realIdx, { premium_extra: Number(e.target.value) || 0 });
                          }}
                          placeholder="0.00"
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Stock */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-[var(--r3)] p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">O combo não tem estoque próprio</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ao vender 1 combo, será descontada 1 unidade de cada produto componente do estoque individual.
                      Se qualquer componente zerar, o combo ficará indisponível.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Pausar automaticamente ao esgotar componente</Label>
                  <p className="text-xs text-muted-foreground">
                    O combo será desativado se qualquer item ficar sem estoque
                  </p>
                </div>
                <Switch checked={autoPause} onCheckedChange={setAutoPause} />
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Resumo do combo</p>
                <div className="border border-border rounded-[var(--r3)] overflow-hidden">
                  <div className="px-3 py-2 bg-muted/50 flex justify-between text-xs font-medium">
                    <span>Item</span>
                    <span>Qtd</span>
                  </div>
                  {items.map((it, i) => (
                    <div key={i} className="px-3 py-2 flex justify-between items-center text-sm border-t border-border">
                      <div>
                        <span>{it.product_name}</span>
                        {!it.is_fixed && <Badge variant="outline" className="ml-2 text-[9px]">removível</Badge>}
                        {it.alternatives.length > 0 && (
                          <Badge variant="secondary" className="ml-1 text-[9px]">{it.alternatives.length} alt.</Badge>
                        )}
                      </div>
                      <span className="font-bold">{it.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-muted-foreground line-through">R$ {originalPrice.toFixed(2)}</span>
                  <span className="text-xl font-[800] text-primary">R$ {comboPriceNum.toFixed(2)}</span>
                  {savings > 0 && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      -{savingsPct}%
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer navigation */}
        <Separator />
        <div className="px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => step === 0 ? onOpenChange(false) : setStep(step - 1)}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {step === 0 ? "Cancelar" : "Voltar"}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Próximo
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={createCombo.isPending || updateCombo.isPending}>
              <Check className="w-4 h-4 mr-1" />
              {editCombo ? "Salvar" : "Criar Combo"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
