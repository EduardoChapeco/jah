import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Utensils, Check, Plus, Loader2, AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { getModifiersByProduct } from "@/services/modifiers.functions";

export interface SelectedModifier {
  groupId: string;
  groupTitle: string;
  modifierId: string;
  title: string;
  priceDeltaCents: number;
}

export interface ProductModifiersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any;
  variant: any;
  onConfirm: (
    product: any,
    variant: any,
    selectedModifiers: SelectedModifier[],
    notes?: string,
  ) => void;
}

export function ProductModifiersModal({
  open,
  onOpenChange,
  product,
  variant,
  onConfirm,
}: ProductModifiersModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifier[]>([]);
  const [notes, setNotes] = useState("");

  const productId = product?.id;

  const { data: modifierGroups, isLoading } = useQuery({
    queryKey: ["product-modifiers", productId],
    queryFn: () => getModifiersByProduct({ data: productId }),
    enabled: !!productId && open,
  });

  // Reset state when modal opens with a new product
  useEffect(() => {
    if (open) {
      setSelectedModifiers([]);
      setNotes("");
    }
  }, [open, productId]);

  const basePriceCents = variant?.price_cents || product?.price_cents || 0;
  const modifiersTotalCents = selectedModifiers.reduce((acc, m) => acc + m.priceDeltaCents, 0);
  const finalUnitPriceCents = basePriceCents + modifiersTotalCents;

  const handleToggleModifier = (group: any, mod: any) => {
    const isSingleChoice = group.max_selections === 1;

    if (isSingleChoice) {
      // Remove any existing selection from this group and add new one
      const filtered = selectedModifiers.filter((m) => m.groupId !== group.id);
      setSelectedModifiers([
        ...filtered,
        {
          groupId: group.id,
          groupTitle: group.title,
          modifierId: mod.id,
          title: mod.title,
          priceDeltaCents: mod.price_delta_cents || 0,
        },
      ]);
    } else {
      // Multi choice
      const exists = selectedModifiers.some((m) => m.modifierId === mod.id);
      if (exists) {
        setSelectedModifiers(selectedModifiers.filter((m) => m.modifierId !== mod.id));
      } else {
        const currentCountInGroup = selectedModifiers.filter((m) => m.groupId === group.id).length;
        if (currentCountInGroup < group.max_selections) {
          setSelectedModifiers([
            ...selectedModifiers,
            {
              groupId: group.id,
              groupTitle: group.title,
              modifierId: mod.id,
              title: mod.title,
              priceDeltaCents: mod.price_delta_cents || 0,
            },
          ]);
        }
      }
    }
  };

  // Validation: Check required groups
  const isValid = (modifierGroups || []).every((group: any) => {
    if (!group.is_required && group.min_selections === 0) return true;
    const selectedInGroup = selectedModifiers.filter((m) => m.groupId === group.id).length;
    return selectedInGroup >= group.min_selections;
  });

  const handleConfirm = () => {
    if (!isValid) return;
    onConfirm(product, variant, selectedModifiers, notes.trim() || undefined);
    onOpenChange(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-6 max-h-[90vh] flex flex-col justify-between">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Utensils className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                {product.title || product.name}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Personalize adicionais e observações da cozinha
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-xs">Carregando complementos...</p>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-5 py-3 pr-1 my-2 flex-1">
            {modifierGroups && modifierGroups.length > 0 ? (
              modifierGroups.map((group: any) => {
                const countInGroup = selectedModifiers.filter((m) => m.groupId === group.id).length;
                const isGroupSatisfied = countInGroup >= group.min_selections;

                return (
                  <div
                    key={group.id}
                    className="space-y-2.5 border border-border/80 bg-muted/10 p-3.5 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {group.title}
                          {group.is_required && (
                            <Badge variant="destructive" className="text-[9px] py-0 px-1.5 h-4">
                              Obrigatório
                            </Badge>
                          )}
                        </span>
                        {group.description && (
                          <p className="text-[11px] text-muted-foreground">{group.description}</p>
                        )}
                      </div>

                      <span className="text-[10px] text-muted-foreground font-mono">
                        {group.max_selections === 1 ? "Escolha 1" : `Até ${group.max_selections}`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {(group.modifiers || []).map((mod: any) => {
                        const isSelected = selectedModifiers.some((m) => m.modifierId === mod.id);

                        return (
                          <button
                            key={mod.id}
                            type="button"
                            onClick={() => handleToggleModifier(group, mod)}
                            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-colors text-left border ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary font-semibold"
                                : "border-border/60 bg-background hover:bg-muted/40 text-foreground"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span
                                className={`size-4 rounded-md border flex items-center justify-center text-[10px] ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "border-border bg-background"
                                }`}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </span>
                              <span>{mod.title}</span>
                            </span>

                            <span className="font-mono text-[11px]">
                              {mod.price_delta_cents > 0
                                ? `+ ${formatMoney(mod.price_delta_cents)}`
                                : "Grátis"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Este item não possui adicionais cadastrados.
              </p>
            )}

            {/* Observações da Cozinha / Salão */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Ponto da carne, sem cebola, talheres adicionais..."
                rows={2}
                className="rounded-xl text-xs bg-background resize-none"
              />
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
              Total Unitário
            </span>
            <span className="text-base font-black text-foreground font-mono">
              {formatMoney(finalUnitPriceCents)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
              className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground"
            >
              <Plus className="size-3.5" />
              <span>Adicionar ao Pedido</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
