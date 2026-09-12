import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCouvertConfig, useUpsertCouvertConfig, useCompanyBrands, useUpsertBrand, useDeleteBrand } from "@/hooks/useRestaurant";
import { Plus, Trash2, Store, DollarSign, Settings, CalendarCheck, Clock } from "lucide-react";
import { toast } from "sonner";

interface Props { companyId: string; }

export default function ConfigTab({ companyId }: Props) {
  const { data: couvert } = useCouvertConfig(companyId);
  const upsertCouvert = useUpsertCouvertConfig();
  const { data: brands = [] } = useCompanyBrands(companyId);
  const upsertBrand = useUpsertBrand();
  const deleteBrand = useDeleteBrand();

  const [couvertEnabled, setCouvertEnabled] = useState(false);
  const [couvertPrice, setCouvertPrice] = useState(0);
  const [couvertScheduleEnabled, setCouvertScheduleEnabled] = useState(false);
  const [minConsEnabled, setMinConsEnabled] = useState(false);
  const [minCons, setMinCons] = useState(0);

  // Reservation config
  const [resDuration, setResDuration] = useState(2);
  const [resMinAdvance, setResMinAdvance] = useState(2);
  const [resPrepayEnabled, setResPrepayEnabled] = useState(false);
  const [resPrepayAmount, setResPrepayAmount] = useState(0);
  const [resNoshowEnabled, setResNoshowEnabled] = useState(false);
  const [resNoshowFee, setResNoshowFee] = useState(0);
  const [resAutoConfirm, setResAutoConfirm] = useState(false);

  const [showBrand, setShowBrand] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [brandForm, setBrandForm] = useState({ name: "", description: "", accent_color: "#6366f1" });

  useEffect(() => {
    if (couvert) {
      setCouvertEnabled(couvert.enabled || false);
      setCouvertPrice(couvert.price_per_person || 0);
      setCouvertScheduleEnabled((couvert as any).couvert_schedule_enabled || false);
      setMinConsEnabled((couvert as any).minimum_consumption_enabled || false);
      setMinCons((couvert as any).minimum_consumption || 0);
      setResDuration((couvert as any).reservation_duration_hours || 2);
      setResMinAdvance((couvert as any).reservation_min_advance_hours || 2);
      setResPrepayEnabled((couvert as any).reservation_prepayment_enabled || false);
      setResPrepayAmount((couvert as any).reservation_prepayment_amount || 0);
      setResNoshowEnabled((couvert as any).reservation_noshow_enabled || false);
      setResNoshowFee((couvert as any).reservation_noshow_fee || 0);
      setResAutoConfirm((couvert as any).reservation_auto_confirm || false);
    }
  }, [couvert]);

  const saveAll = async () => {
    await upsertCouvert.mutateAsync({
      company_id: companyId,
      enabled: couvertEnabled,
      price_per_person: couvertPrice,
      couvert_schedule_enabled: couvertScheduleEnabled,
      minimum_consumption_enabled: minConsEnabled,
      minimum_consumption: minCons,
      reservation_duration_hours: resDuration,
      reservation_min_advance_hours: resMinAdvance,
      reservation_prepayment_enabled: resPrepayEnabled,
      reservation_prepayment_amount: resPrepayAmount,
      reservation_noshow_enabled: resNoshowEnabled,
      reservation_noshow_fee: resNoshowFee,
      reservation_auto_confirm: resAutoConfirm,
    });
    toast.success("Configurações salvas");
  };

  const openNewBrand = () => { setEditingBrand(null); setBrandForm({ name: "", description: "", accent_color: "#6366f1" }); setShowBrand(true); };
  const openEditBrand = (b: any) => { setEditingBrand(b); setBrandForm({ name: b.name, description: b.description || "", accent_color: b.accent_color || "#6366f1" }); setShowBrand(true); };
  const saveBrand = async () => {
    if (!brandForm.name) { toast.error("Nome obrigatório"); return; }
    await upsertBrand.mutateAsync({ ...(editingBrand ? { id: editingBrand.id } : {}), company_id: companyId, name: brandForm.name, description: brandForm.description || null, accent_color: brandForm.accent_color });
    toast.success(editingBrand ? "Marca atualizada" : "Marca criada");
    setShowBrand(false);
  };

  return (
    <div className="space-y-6">
      {/* Couvert */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Couvert Artístico</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label className="text-base">Ativar Couvert</Label><p className="text-sm text-muted-foreground">Cobrar couvert por pessoa ao abrir comanda</p></div>
            <Switch checked={couvertEnabled} onCheckedChange={setCouvertEnabled} />
          </div>
          {couvertEnabled && (
            <>
              <div><Label>Valor por pessoa (R$)</Label><Input type="number" value={couvertPrice} onChange={e => setCouvertPrice(+e.target.value)} /></div>
              <div className="flex items-center justify-between">
                <div><Label>Couvert por dia/horário</Label><p className="text-xs text-muted-foreground">Cobrar apenas em dias/horários específicos</p></div>
                <Switch checked={couvertScheduleEnabled} onCheckedChange={setCouvertScheduleEnabled} />
              </div>
              <p className="text-xs text-muted-foreground italic">Toggle "Remover couvert" disponível por comanda na aba de comandas</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Consumo Mínimo */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Consumo Mínimo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div><Label className="text-base">Ativar Consumo Mínimo Global</Label><p className="text-sm text-muted-foreground">Valor mínimo por pessoa (customizável por mesa)</p></div>
            <Switch checked={minConsEnabled} onCheckedChange={setMinConsEnabled} />
          </div>
          {minConsEnabled && (
            <div><Label>Valor mínimo por pessoa (R$)</Label><Input type="number" value={minCons} onChange={e => setMinCons(+e.target.value)} /></div>
          )}
        </CardContent>
      </Card>

      {/* Reservas Config */}
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5" />Configuração de Reservas</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Duração padrão (horas)</Label><Input type="number" min={1} value={resDuration} onChange={e => setResDuration(+e.target.value)} /></div>
            <div>
              <Label>Antecedência mínima</Label>
              <Select value={String(resMinAdvance)} onValueChange={v => setResMinAdvance(+v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hora</SelectItem>
                  <SelectItem value="2">2 horas</SelectItem>
                  <SelectItem value="4">4 horas</SelectItem>
                  <SelectItem value="12">12 horas</SelectItem>
                  <SelectItem value="24">24 horas</SelectItem>
                  <SelectItem value="48">48 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Confirmação automática</Label><p className="text-xs text-muted-foreground">Confirmar reservas sem aprovação manual</p></div>
            <Switch checked={resAutoConfirm} onCheckedChange={setResAutoConfirm} />
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div><Label>Pré-pagamento</Label><p className="text-xs text-muted-foreground">Cobrar para confirmar reserva</p></div>
              <Switch checked={resPrepayEnabled} onCheckedChange={setResPrepayEnabled} />
            </div>
            {resPrepayEnabled && <div className="mt-2"><Label>Valor (R$)</Label><Input type="number" value={resPrepayAmount} onChange={e => setResPrepayAmount(+e.target.value)} /></div>}
          </div>
          <div className="border-t pt-4">
            <div className="flex items-center justify-between">
              <div><Label>Política de No-show</Label><p className="text-xs text-muted-foreground">Cobrar taxa quando cliente não comparece</p></div>
              <Switch checked={resNoshowEnabled} onCheckedChange={setResNoshowEnabled} />
            </div>
            {resNoshowEnabled && <div className="mt-2"><Label>Taxa no-show (R$)</Label><Input type="number" value={resNoshowFee} onChange={e => setResNoshowFee(+e.target.value)} /></div>}
          </div>
        </CardContent>
      </Card>

      {/* Multi-Brand */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Operação Multi-Marca</CardTitle>
            <Button size="sm" onClick={openNewBrand}><Plus className="h-4 w-4 mr-1" />Nova Marca</Button>
          </div>
          <p className="text-sm text-muted-foreground">Dark kitchens, marcas virtuais no mesmo CNPJ</p>
        </CardHeader>
        <CardContent>
          {brands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma marca adicional. Empresa opera com marca única.</p>
          ) : (
            <div className="space-y-2">
              {brands.map((brand: any) => (
                <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50" onClick={() => openEditBrand(brand)}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full" style={{ backgroundColor: brand.accent_color || "#6366f1" }} />
                    <div><p className="font-medium">{brand.name}</p>{brand.description && <p className="text-xs text-muted-foreground">{brand.description}</p>}</div>
                  </div>
                  <Badge variant={brand.is_active ? "default" : "secondary"}>{brand.is_active ? "Ativa" : "Inativa"}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Button onClick={saveAll} className="w-full" size="lg">Salvar Todas as Configurações</Button>

      {/* Brand Dialog */}
      <Dialog open={showBrand} onOpenChange={setShowBrand}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingBrand ? "Editar Marca" : "Nova Marca"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome *</Label><Input value={brandForm.name} onChange={e => setBrandForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Descrição</Label><Input value={brandForm.description} onChange={e => setBrandForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div><Label>Cor</Label><Input type="color" value={brandForm.accent_color} onChange={e => setBrandForm(f => ({ ...f, accent_color: e.target.value }))} className="h-10 w-20" /></div>
          </div>
          <DialogFooter className="gap-2">
            {editingBrand && <Button variant="destructive" size="sm" onClick={async () => { await deleteBrand.mutateAsync(editingBrand.id); setShowBrand(false); toast.success("Marca removida"); }}><Trash2 className="h-4 w-4" /></Button>}
            <Button onClick={saveBrand}>{editingBrand ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
