import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatMoney } from "@/lib/money";
import { requestRma } from "@/services/rma.functions";

type OrderItem = {
  id: string;
  product_title: string;
  variant_sku: string;
  qty: number;
  unit_price_cents: number;
};

export function RmaWizard({ 
  orderId, 
  items, 
  isOpen, 
  onClose,
  onSuccess 
}: { 
  orderId: string, 
  items: OrderItem[], 
  isOpen: boolean, 
  onClose: () => void,
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<"exchange" | "return" | "warranty">("exchange");
  const [selectedItems, setSelectedItems] = useState<Record<string, { selected: boolean, qty: number, reason: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      const current = prev[itemId] || { selected: false, qty: maxQty, reason: "" };
      return {
        ...prev,
        [itemId]: { ...current, selected: !current.selected }
      };
    });
  };

  const updateItem = (itemId: string, field: 'qty' | 'reason', value: any) => {
    setSelectedItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };

  const handleNext = () => {
    const selected = Object.values(selectedItems).filter(i => i.selected);
    if (selected.length === 0) {
      toast.error("Selecione pelo menos um item.");
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    const payloadItems = Object.entries(selectedItems)
      .filter(([_, data]) => data.selected)
      .map(([id, data]) => ({
        orderItemId: id,
        qty: data.qty,
        reason: data.reason || type,
        photos: [] // TODO: Image upload implementation
      }));

    if (payloadItems.some(i => !i.reason || i.reason.length < 5)) {
      toast.error("Por favor, preencha o motivo de forma detalhada para os itens selecionados.");
      return;
    }

    setIsSubmitting(true);
    try {
      await requestRma({
        data: {
          orderId,
          type,
          reason: `Solicitação via portal B2C (${type})`,
          items: payloadItems
        }
      });
      toast.success("Solicitação enviada com sucesso!");
      onSuccess();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao solicitar");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Solicitar Troca ou Devolução</DialogTitle>
          <DialogDescription>
            Passo {step} de 2
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label>O que você deseja fazer?</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return">Devolver o pedido (Arrependimento)</SelectItem>
                  <SelectItem value="exchange">Trocar o produto (Tamanho/Cor)</SelectItem>
                  <SelectItem value="warranty">Acionar Garantia (Defeito)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Quais itens deseja incluir?</Label>
              <div className="space-y-2 border rounded-md p-2 max-h-[300px] overflow-y-auto">
                {items.map(item => {
                  const state = selectedItems[item.id] || { selected: false, qty: item.qty, reason: "" };
                  return (
                    <div key={item.id} className="flex items-start space-x-3 p-3 bg-muted/30 rounded-lg">
                      <Checkbox 
                        checked={state.selected}
                        onCheckedChange={() => toggleItem(item.id, item.qty)}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{item.product_title}</p>
                        <p className="text-xs text-muted-foreground">{item.qty}x de {formatMoney(item.unit_price_cents)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleNext}>Continuar</Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {Object.entries(selectedItems).filter(([_, s]) => s.selected).map(([id, state]) => {
                const item = items.find(i => i.id === id)!;
                return (
                  <div key={id} className="space-y-3 p-4 border rounded-lg bg-card">
                    <div>
                      <p className="font-semibold text-sm">{item.product_title}</p>
                      <p className="text-xs text-muted-foreground">SKU: {item.variant_sku}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1 space-y-2">
                        <Label className="text-xs">Qtd</Label>
                        <Input 
                          type="number" 
                          min={1} 
                          max={item.qty} 
                          value={state.qty}
                          onChange={e => updateItem(id, 'qty', parseInt(e.target.value) || 1)}
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs">Motivo detalhado</Label>
                        <Textarea 
                          className="h-10 text-sm resize-none" 
                          placeholder="Ex: Ficou pequeno, veio quebrado..."
                          value={state.reason}
                          onChange={e => updateItem(id, 'reason', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>Voltar</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Confirmar Solicitação"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
