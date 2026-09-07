import { useState, useMemo } from "react";
import { X, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AddonGroup, AddonSelection } from "@/types/addons";
import { calcAddonTotal, validateSelections } from "@/types/addons";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  sale_price?: number | null;
  photos?: any;
  addon_groups?: any;
}

interface Props {
  product: Product;
  onClose: () => void;
  onAdd: (product: Product, qty: number, selections: AddonSelection[], notes: string) => void;
}

export default function ProductDetailModal({ product, onClose, onAdd }: Props) {
  const groups: AddonGroup[] = useMemo(() => {
    if (!product.addon_groups || !Array.isArray(product.addon_groups)) return [];
    return product.addon_groups as AddonGroup[];
  }, [product.addon_groups]);

  const [selections, setSelections] = useState<AddonSelection[]>(
    groups.map(g => ({ groupId: g.id, selectedItems: {} }))
  );
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");

  const basePrice = Number(product.sale_price || product.price);
  const addonsTotal = calcAddonTotal(groups, selections);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * qty;

  const getSelection = (gId: string) => selections.find(s => s.groupId === gId)!;

  const setGroupSelection = (gId: string, newItems: Record<string, number>) => {
    setSelections(prev => prev.map(s => s.groupId === gId ? { ...s, selectedItems: newItems } : s));
  };

  const toggleSingle = (group: AddonGroup, itemId: string) => {
    const cur = getSelection(group.id);
    setGroupSelection(group.id, cur.selectedItems[itemId] ? {} : { [itemId]: 1 });
  };

  const toggleMultiple = (group: AddonGroup, itemId: string) => {
    const cur = { ...getSelection(group.id).selectedItems };
    if (cur[itemId]) {
      delete cur[itemId];
    } else {
      const count = Object.keys(cur).length;
      if (group.max > 0 && count >= group.max) {
        toast.error(`Máximo de ${group.max} opções`);
        return;
      }
      cur[itemId] = 1;
    }
    setGroupSelection(group.id, cur);
  };

  const changeQuantity = (group: AddonGroup, itemId: string, delta: number) => {
    const cur = { ...getSelection(group.id).selectedItems };
    const newQty = (cur[itemId] || 0) + delta;
    if (newQty <= 0) delete cur[itemId];
    else {
      const totalSelected = Object.values(cur).reduce((a, b) => a + b, 0) - (cur[itemId] || 0) + newQty;
      if (group.max > 0 && totalSelected > group.max) {
        toast.error(`Máximo de ${group.max} opções`);
        return;
      }
      cur[itemId] = newQty;
    }
    setGroupSelection(group.id, cur);
  };

  const togglePizza = (group: AddonGroup, itemId: string) => {
    const cur = { ...getSelection(group.id).selectedItems };
    const maxSlices = group.pizzaSlices || 2;
    if (cur[itemId]) {
      delete cur[itemId];
    } else {
      if (Object.keys(cur).length >= maxSlices) {
        toast.error(`Escolha até ${maxSlices} sabores`);
        return;
      }
      cur[itemId] = 1;
    }
    setGroupSelection(group.id, cur);
  };

  const handleAdd = () => {
    const err = validateSelections(groups, selections);
    if (err) { toast.error(err); return; }
    onAdd(product, qty, selections, notes);
    onClose();
  };

  const photo = product.photos && (product.photos as any[])[0];

  const getSelectedCount = (gId: string) => {
    const sel = getSelection(gId);
    return Object.values(sel.selectedItems).reduce((a, b) => a + b, 0);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center" onClick={onClose}>
      <div className="bg-card rounded-t-2xl md:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Image */}
        {photo && (
          <div className="relative aspect-[16/10] bg-muted shrink-0 rounded-t-2xl md:rounded-t-2xl overflow-hidden">
            <img src={photo} className="w-full h-full object-cover" alt={product.name} />
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-foreground/70 text-background flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {!photo && (
            <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          )}

          <div>
            <h3 className="text-lg font-bold text-foreground">{product.name}</h3>
            {product.description && <p className="text-sm text-muted-foreground mt-1">{product.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              {product.sale_price ? (
                <>
                  <span className="text-xl font-[800] text-primary">R$ {Number(product.sale_price).toFixed(2)}</span>
                  <span className="text-sm text-muted-foreground line-through">R$ {Number(product.price).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-xl font-[800] text-foreground">R$ {Number(product.price).toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Addon groups */}
          {groups.map(group => {
            const availableItems = group.items.filter(i => i.available);
            const selectedCount = getSelectedCount(group.id);
            const ruleText = group.required
              ? group.min > 0 ? `Escolha ${group.min}${group.max > 0 && group.max !== group.min ? `-${group.max}` : ""}` : "Obrigatório"
              : group.max > 0 ? `Escolha até ${group.max}` : "Opcional";

            return (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{group.name}</h4>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[var(--rF)] ${
                    group.required && selectedCount < Math.max(1, group.min)
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {ruleText}
                  </span>
                </div>

                <div className="space-y-1">
                  {availableItems.map(item => {
                    const isSelected = !!getSelection(group.id).selectedItems[item.id];
                    const itemQty = getSelection(group.id).selectedItems[item.id] || 0;

                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-[var(--r3)] border-[1.5px] transition-colors cursor-pointer ${
                          isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                        }`}
                        onClick={() => {
                          if (group.selectionType === "single") toggleSingle(group, item.id);
                          else if (group.selectionType === "multiple") toggleMultiple(group, item.id);
                          else if (group.selectionType === "pizza") togglePizza(group, item.id);
                        }}
                      >
                        {/* Radio / Checkbox indicator */}
                        {(group.selectionType === "single" || group.selectionType === "pizza") && (
                          <div className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center ${isSelected ? "border-primary" : "border-muted-foreground/40"}`}>
                            {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                          </div>
                        )}
                        {group.selectionType === "multiple" && (
                          <div className={`w-5 h-5 rounded-[var(--r1)] border-2 shrink-0 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                            {isSelected && <span className="text-primary-foreground text-xs font-bold">✓</span>}
                          </div>
                        )}

                        {item.image && (
                          <img src={item.image} alt="" className="w-10 h-10 rounded-[var(--r2)] object-cover shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground block truncate">{item.name}</span>
                          {item.description && <span className="text-xs text-muted-foreground truncate block">{item.description}</span>}
                        </div>

                        {group.selectionType === "quantity" ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <button onClick={() => changeQuantity(group, item.id, -1)} className="w-7 h-7 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-muted"><Minus className="w-3 h-3" /></button>
                            <span className="text-sm font-bold w-5 text-center text-foreground">{itemQty}</span>
                            <button onClick={() => changeQuantity(group, item.id, 1)} className="w-7 h-7 rounded-full border border-primary bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20"><Plus className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-foreground shrink-0">
                            {item.price > 0 ? `+ R$ ${item.price.toFixed(2)}` : "Grátis"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Alguma observação?</label>
            <Textarea
              value={notes} onChange={e => setNotes(e.target.value.slice(0, 140))}
              placeholder="Ex: sem cebola, bem passado..."
              className="bg-background border-border text-sm min-h-[60px]"
              maxLength={140}
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{notes.length}/140</span>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="shrink-0 border-t border-border px-5 py-4 bg-card rounded-b-2xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border border-border rounded-[var(--rF)] px-1">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full"><Minus className="w-4 h-4" /></button>
              <span className="text-base font-bold text-foreground w-5 text-center">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="w-9 h-9 flex items-center justify-center text-foreground hover:bg-muted rounded-full"><Plus className="w-4 h-4" /></button>
            </div>
            <Button onClick={handleAdd} className="flex-1 bg-primary text-primary-foreground font-bold h-12 text-sm gap-1">
              Adicionar R$ {totalPrice.toFixed(2)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
