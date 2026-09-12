import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, Pencil, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  INITIAL_SERVICE_TYPES, DEFAULT_BUSINESS_RULES,
  BILLING_LABELS, ServiceType, BusinessRules, generateId,
} from "./logistics-data";

export function SettingsSection() {
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(INITIAL_SERVICE_TYPES);
  const [rules, setRules] = useState<BusinessRules>(DEFAULT_BUSINESS_RULES);
  const [editingType, setEditingType] = useState<ServiceType | null>(null);

  const handleAddType = (t: ServiceType) => {
    setServiceTypes((prev) => [...prev, t]);
    toast.success("Tipo de serviço criado!");
  };

  const handleUpdateType = (t: ServiceType) => {
    setServiceTypes((prev) => prev.map((st) => (st.id === t.id ? t : st)));
    setEditingType(null);
    toast.success("Tipo atualizado!");
  };

  const handleDeleteType = (id: string) => {
    setServiceTypes((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tipo removido!");
  };

  const handleSaveRules = () => {
    toast.success("Regras de negócio salvas!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Tipos de Serviço</h3>
        <ServiceTypeFormDialog onSave={handleAddType} />
      </div>

      <div className="space-y-3">
        {serviceTypes.map((t) => (
          <Card key={t.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{t.name}</span>
                    <Badge variant={t.isActive ? "default" : "secondary"} className="text-xs">
                      {t.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span>Cobrança: {BILLING_LABELS[t.billing] ?? t.billing}</span>
                    <span>Base: R$ {t.basePrice}</span>
                    <span>Área: {t.area}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Regras: {t.rules}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => setEditingType(t)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteType(t.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingType && (
        <ServiceTypeFormDialog serviceType={editingType} onSave={handleUpdateType} open onOpenChange={(o) => !o && setEditingType(null)} />
      )}

      <Separator />

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Regras de Negócio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <BusinessRule
            title="Taxa de cancelamento"
            desc="Cobrar se cancelar menos de 2h antes"
            input={
              <div className="flex items-center gap-2">
                <Input className="w-20 text-right" type="number" value={rules.cancellationFeePct}
                  onChange={(e) => setRules((r) => ({ ...r, cancellationFeePct: Number(e.target.value) }))} />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            }
          />
          <Separator />
          <BusinessRule
            title="Custo por ajudante extra"
            desc="Adicionado ao valor da solicitação"
            input={
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">R$</span>
                <Input className="w-24 text-right" type="number" value={rules.helperExtraCost}
                  onChange={(e) => setRules((r) => ({ ...r, helperExtraCost: Number(e.target.value) }))} />
              </div>
            }
          />
          <Separator />
          <BusinessRule title="Fotos obrigatórias para itens pesados" desc="Mudanças com itens acima de 50kg exigem foto"
            input={<Switch checked={rules.requireHeavyPhotos} onCheckedChange={(v) => setRules((r) => ({ ...r, requireHeavyPhotos: v }))} />} />
          <Separator />
          <BusinessRule title="Checklist de coleta obrigatório" desc="Profissional precisa confirmar itens na retirada"
            input={<Switch checked={rules.requirePickupChecklist} onCheckedChange={(v) => setRules((r) => ({ ...r, requirePickupChecklist: v }))} />} />
          <Separator />
          <BusinessRule title="Assinatura digital na entrega" desc="Cliente assina ao receber"
            input={<Switch checked={rules.requireDeliverySignature} onCheckedChange={(v) => setRules((r) => ({ ...r, requireDeliverySignature: v }))} />} />
          <div className="pt-2">
            <Button size="sm" onClick={handleSaveRules}><Save className="h-4 w-4 mr-1" /> Salvar Regras</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BusinessRule({ title, desc, input }: { title: string; desc: string; input: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      {input}
    </div>
  );
}

/* ─── Service Type Form ─── */
function ServiceTypeFormDialog({ serviceType, onSave, open: cOpen, onOpenChange }: {
  serviceType?: ServiceType; onSave: (t: ServiceType) => void; open?: boolean; onOpenChange?: (o: boolean) => void;
}) {
  const [iOpen, setIOpen] = useState(false);
  const isC = cOpen !== undefined;
  const isOpen = isC ? cOpen : iOpen;
  const setOpen = isC ? onOpenChange! : setIOpen;

  const [form, setForm] = useState({
    name: serviceType?.name || "", billing: serviceType?.billing || "fixed" as ServiceType["billing"],
    basePrice: serviceType?.basePrice || 0, area: serviceType?.area || "",
    rules: serviceType?.rules || "", isActive: serviceType?.isActive ?? true,
  });
  const u = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));
  const valid = form.name && form.basePrice > 0;

  const submit = () => {
    if (!valid) return;
    onSave({ id: serviceType?.id || generateId(), ...form });
    if (!serviceType) setForm({ name: "", billing: "fixed", basePrice: 0, area: "", rules: "", isActive: true });
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isC && <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Novo Tipo</Button></DialogTrigger>}
      <DialogContent>
        <DialogHeader><DialogTitle>{serviceType ? "Editar Tipo" : "Novo Tipo de Serviço"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome *</Label><Input value={form.name} onChange={(e) => u("name", e.target.value)} placeholder="Ex: Mudança Residencial" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cobrança</Label>
              <Select value={form.billing} onValueChange={(v) => u("billing", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(BILLING_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Preço base (R$) *</Label><Input type="number" value={form.basePrice} onChange={(e) => u("basePrice", Number(e.target.value))} /></div>
          </div>
          <div><Label>Área de atuação</Label><Input value={form.area} onChange={(e) => u("area", e.target.value)} placeholder="Ex: 50km, Rota fixa" /></div>
          <div><Label>Regras especiais</Label><Input value={form.rules} onChange={(e) => u("rules", e.target.value)} placeholder="Ex: Mín. 2 ajudantes" /></div>
          <div className="flex items-center gap-2">
            <Switch checked={form.isActive} onCheckedChange={(v) => u("isActive", v)} />
            <Label>Ativo</Label>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={!valid}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
