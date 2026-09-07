import { useState } from "react";
import { Plus, GripVertical, ChevronDown, ChevronUp, Trash2, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type { AddonGroup, AddonItem, AddonSelectionType } from "@/types/addons";
import { generateId } from "@/types/addons";

interface Props {
  groups: AddonGroup[];
  onChange: (groups: AddonGroup[]) => void;
}

const SELECTION_TYPES: { value: AddonSelectionType; label: string; desc: string }[] = [
  { value: "single", label: "Único", desc: "Escolhe 1 opção (radio)" },
  { value: "multiple", label: "Múltiplo", desc: "Escolhe N opções (checkbox)" },
  { value: "quantity", label: "Quantidade", desc: "Contador por item" },
  { value: "pizza", label: "Pizza", desc: "Metades / sabores" },
];

const EMPTY_ITEM: () => AddonItem = () => ({
  id: generateId(), name: "", price: 0, available: true,
});

export default function AddonGroupEditor({ groups, onChange }: Props) {
  const [openGroupId, setOpenGroupId] = useState<string | null>(null);

  const addGroup = () => {
    const g: AddonGroup = {
      id: generateId(), name: "", selectionType: "multiple",
      required: false, min: 0, max: 0, items: [EMPTY_ITEM()],
    };
    onChange([...groups, g]);
    setOpenGroupId(g.id);
  };

  const updateGroup = (id: string, patch: Partial<AddonGroup>) => {
    onChange(groups.map(g => g.id === id ? { ...g, ...patch } : g));
  };

  const removeGroup = (id: string) => onChange(groups.filter(g => g.id !== id));

  const moveGroup = (idx: number, dir: -1 | 1) => {
    const arr = [...groups];
    const t = arr[idx]; arr[idx] = arr[idx + dir]; arr[idx + dir] = t;
    onChange(arr);
  };

  const updateItem = (gId: string, iId: string, patch: Partial<AddonItem>) => {
    onChange(groups.map(g => g.id === gId ? {
      ...g, items: g.items.map(i => i.id === iId ? { ...i, ...patch } : i)
    } : g));
  };

  const addItem = (gId: string) => {
    onChange(groups.map(g => g.id === gId ? { ...g, items: [...g.items, EMPTY_ITEM()] } : g));
  };

  const removeItem = (gId: string, iId: string) => {
    onChange(groups.map(g => g.id === gId ? { ...g, items: g.items.filter(i => i.id !== iId) } : g));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-foreground">Adicionais e Complementos</h3>
        <Button type="button" variant="outline" size="sm" onClick={addGroup} className="gap-1.5 text-xs">
          <Plus className="w-3.5 h-3.5" /> Criar grupo
        </Button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum grupo de adicional. Clique em "Criar grupo" para começar.</p>
      )}

      {groups.map((group, gIdx) => {
        const open = openGroupId === group.id;
        return (
          <div key={group.id} className="border-[1.5px] border-border rounded-[var(--r4)] overflow-hidden bg-card">
            {/* Header */}
            <button
              type="button"
              onClick={() => setOpenGroupId(open ? null : group.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1 text-left">
                <span className="text-sm font-semibold text-foreground">
                  {group.name || "Novo grupo"}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {group.items.length} {group.items.length === 1 ? "item" : "itens"}
                  {group.required && " · Obrigatório"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {gIdx > 0 && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); moveGroup(gIdx, -1); }}><ChevronUp className="w-3.5 h-3.5" /></Button>}
                {gIdx < groups.length - 1 && <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); moveGroup(gIdx, 1); }}><ChevronDown className="w-3.5 h-3.5" /></Button>}
                <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={e => { e.stopPropagation(); removeGroup(group.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </div>
            </button>

            {/* Body */}
            {open && (
              <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                {/* Group meta */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Nome do grupo *</label>
                    <Input value={group.name} onChange={e => updateGroup(group.id, { name: e.target.value })} placeholder='Ex: "Alguma bebida?"' className="h-10 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-foreground mb-1 block">Descrição</label>
                    <Input value={group.description || ""} onChange={e => updateGroup(group.id, { description: e.target.value })} placeholder='Ex: "Escolha até 3 opções"' className="h-10 text-sm bg-background" />
                  </div>
                </div>

                {/* Selection type */}
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block">Tipo de seleção</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SELECTION_TYPES.map(st => (
                      <button
                        key={st.value} type="button"
                        onClick={() => updateGroup(group.id, { selectionType: st.value })}
                        className={`text-left p-3 rounded-[var(--r3)] border-[1.5px] transition-colors ${group.selectionType === st.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <span className="text-xs font-semibold text-foreground block">{st.label}</span>
                        <span className="text-[10px] text-muted-foreground">{st.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pizza-specific */}
                {group.selectionType === "pizza" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Nº de sabores</label>
                      <select value={group.pizzaSlices || 2} onChange={e => updateGroup(group.id, { pizzaSlices: Number(e.target.value) })}
                        className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-3 text-sm">
                        {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Cálculo do preço</label>
                      <select value={group.pizzaPriceMode || "average"} onChange={e => updateGroup(group.id, { pizzaPriceMode: e.target.value as any })}
                        className="flex h-10 w-full rounded-[var(--r3)] border-[1.5px] border-input bg-background px-3 text-sm">
                        <option value="average">Média dos sabores</option>
                        <option value="highest">Maior preço</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Rules */}
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Switch checked={group.required} onCheckedChange={v => updateGroup(group.id, { required: v })} />
                    Obrigatório
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Mín:</label>
                    <Input type="number" min={0} value={group.min} onChange={e => updateGroup(group.id, { min: Number(e.target.value) })} className="h-8 w-16 text-xs bg-background" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Máx:</label>
                    <Input type="number" min={0} value={group.max} onChange={e => updateGroup(group.id, { max: Number(e.target.value) })} className="h-8 w-16 text-xs bg-background" />
                    <span className="text-[10px] text-muted-foreground">(0 = ilimitado)</span>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">Itens</label>
                  {group.items.map((item, iIdx) => (
                    <div key={item.id} className="flex items-start gap-2 p-3 bg-muted/40 rounded-[var(--r3)]">
                      <span className="text-[10px] text-muted-foreground mt-2 w-4 shrink-0 text-center">{iIdx + 1}</span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_100px] gap-2">
                        <Input value={item.name} onChange={e => updateItem(group.id, item.id, { name: e.target.value })} placeholder="Nome do item" className="h-9 text-xs bg-background" />
                        <Input value={item.description || ""} onChange={e => updateItem(group.id, item.id, { description: e.target.value })} placeholder="Descrição (opcional)" className="h-9 text-xs bg-background" />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                          <Input type="number" min={0} step={0.01} value={item.price} onChange={e => updateItem(group.id, item.id, { price: Number(e.target.value) })} className="h-9 text-xs bg-background pl-8" />
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Switch checked={item.available} onCheckedChange={v => updateItem(group.id, item.id, { available: v })} />
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeItem(group.id, item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button type="button" variant="ghost" size="sm" onClick={() => addItem(group.id)} className="gap-1.5 text-xs text-primary">
                    <Plus className="w-3.5 h-3.5" /> Adicionar item
                  </Button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
