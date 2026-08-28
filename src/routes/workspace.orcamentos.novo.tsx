import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  User,
  FileText,
  Calendar,
  Package,
  Wrench,
  Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createQuote,
  type CreateQuoteInput,
  type QuoteItemInput,
} from "@/services/quotes.functions";
import { formatMoney } from "@/lib/money";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/orcamentos/novo")({
  head: () => ({ meta: [{ title: "Novo Orçamento — Wider Workspace" }] }),
  component: NovoOrcamentoPage,
});

const ITEM_TYPE_OPTIONS = [
  { value: "manual_item", label: "Item Avulso", icon: Package },
  { value: "product_variant", label: "Produto do Catálogo", icon: Package },
  { value: "service", label: "Serviço", icon: Wrench },
  { value: "rental_equipment", label: "Locação de Equipamento", icon: Hash },
];

interface FormItem {
  id: string;
  item_type: string;
  name: string;
  description: string;
  unit_price_cents: number;
  quantity: number;
  discount_cents: number;
}

function createEmptyItem(): FormItem {
  return {
    id: crypto.randomUUID(),
    item_type: "manual_item",
    name: "",
    description: "",
    unit_price_cents: 0,
    quantity: 1,
    discount_cents: 0,
  };
}

function NovoOrcamentoPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [client, setClient] = useState({
    guest_name: "",
    guest_email: "",
    guest_phone: "",
  });

  const [conditions, setConditions] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const [items, setItems] = useState<FormItem[]>([createEmptyItem()]);

  function addItem() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function updateItem(id: string, field: string, value: string | number) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  const subtotalCents = items.reduce(
    (sum, item) =>
      sum + item.unit_price_cents * item.quantity - item.discount_cents,
    0,
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validItems = items.filter((item) => item.name.trim());
    if (validItems.length === 0) {
      toast.error("Adicione ao menos 1 item ao orçamento.");
      return;
    }

    if (!client.guest_name.trim() && !client.guest_email.trim()) {
      toast.error("Preencha o nome ou e-mail do cliente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateQuoteInput = {
        guest_name: client.guest_name.trim() || undefined,
        guest_email: client.guest_email.trim() || undefined,
        guest_phone: client.guest_phone.trim() || undefined,
        conditions: conditions.trim() || undefined,
        internal_notes: internalNotes.trim() || undefined,
        valid_until: validUntil
          ? new Date(validUntil).toISOString()
          : undefined,
        items: validItems.map((item, idx) => ({
          item_type: item.item_type as any,
          name: item.name.trim(),
          description: item.description.trim() || undefined,
          unit_price_cents: item.unit_price_cents,
          quantity: item.quantity,
          discount_cents: item.discount_cents,
          position: idx,
        })),
      };

      const result = await createQuote({ data: payload });
      toast.success("Orçamento criado com sucesso.");
      navigate({ to: "/workspace/orcamentos" });
    } catch (err: any) {
      toast.error(err?.message || "Erro ao criar orçamento.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/workspace/orcamentos" })}
          className="rounded-xl size-9"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Novo Orçamento
          </h1>
          <p className="text-xs text-muted-foreground">
            Monte uma proposta para enviar ao cliente
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl pb-10">
        {/* ── Cliente ── */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <User className="size-3.5" />
            Dados do Cliente
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome *</Label>
              <Input
                value={client.guest_name}
                onChange={(e) =>
                  setClient((p) => ({ ...p, guest_name: e.target.value }))
                }
                placeholder="Nome do cliente"
                className="rounded-xl h-11 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">E-mail</Label>
              <Input
                type="email"
                value={client.guest_email}
                onChange={(e) =>
                  setClient((p) => ({ ...p, guest_email: e.target.value }))
                }
                placeholder="email@exemplo.com"
                className="rounded-xl h-11 border-border/60"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Telefone</Label>
              <Input
                value={client.guest_phone}
                onChange={(e) =>
                  setClient((p) => ({ ...p, guest_phone: e.target.value }))
                }
                placeholder="(49) 99999-0000"
                className="rounded-xl h-11 border-border/60"
              />
            </div>
          </div>
        </div>

        {/* ── Itens ── */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Package className="size-3.5" />
              Itens do Orçamento
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="rounded-xl text-xs gap-1.5"
            >
              <Plus className="size-3.5" />
              Adicionar Item
            </Button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-xl border border-border/60 bg-background p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">
                    Item {idx + 1}
                  </span>
                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="size-7 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Nome *</Label>
                    <Input
                      value={item.name}
                      onChange={(e) =>
                        updateItem(item.id, "name", e.target.value)
                      }
                      placeholder="Produto ou serviço"
                      className="rounded-xl h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Tipo</Label>
                    <Select
                      value={item.item_type}
                      onValueChange={(v) =>
                        updateItem(item.id, "item_type", v)
                      }
                    >
                      <SelectTrigger className="rounded-xl h-10 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {ITEM_TYPE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value}
                            value={opt.value}
                            className="text-xs"
                          >
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Descrição</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.id, "description", e.target.value)
                    }
                    placeholder="Detalhes opcionais do item"
                    className="rounded-xl h-10 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Preço Unit. (R$)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(item.unit_price_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "unit_price_cents",
                          Math.round(
                            parseFloat(e.target.value || "0") * 100,
                          ),
                        )
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Qtd</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "quantity",
                          parseInt(e.target.value || "1", 10),
                        )
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">
                      Desconto (R$)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(item.discount_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        updateItem(
                          item.id,
                          "discount_cents",
                          Math.round(
                            parseFloat(e.target.value || "0") * 100,
                          ),
                        )
                      }
                      className="rounded-xl h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="text-right text-xs font-semibold text-foreground">
                  Subtotal:{" "}
                  {formatMoney(
                    item.unit_price_cents * item.quantity -
                      item.discount_cents,
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-3 border-t border-border/40">
            <span className="text-sm font-semibold text-foreground">
              Total do Orçamento
            </span>
            <span className="text-lg font-bold text-foreground">
              {formatMoney(subtotalCents)}
            </span>
          </div>
        </div>

        {/* ── Condições ── */}
        <div className="bg-card rounded-2xl border border-border/60 p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <FileText className="size-3.5" />
            Condições & Validade
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Válido até</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="rounded-xl h-11 border-border/60"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Condições de Pagamento / Entregas
            </Label>
            <textarea
              rows={3}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Ex: Pagamento 50% na aprovação + 50% na entrega. Frete incluso para o município."
              className="w-full rounded-xl border border-border/60 bg-background p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">
              Notas Internas (invisíveis ao cliente)
            </Label>
            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Anotações internas do time..."
              className="w-full rounded-xl border border-border/60 bg-background p-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* ── Ações ── */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate({ to: "/workspace/orcamentos" })}
            className="rounded-xl"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              items.filter((i) => i.name.trim()).length === 0
            }
            className="rounded-xl min-w-[140px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin mr-2" />
                Criando...
              </>
            ) : (
              "Criar Orçamento"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
