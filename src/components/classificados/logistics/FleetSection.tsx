import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, MapPin, Wrench, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { INITIAL_FLEET, INITIAL_MAINTENANCE, FleetVehicle, MaintenanceRecord, generateId, formatCurrency } from "./logistics-data";

export function FleetSection() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(INITIAL_FLEET);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>(INITIAL_MAINTENANCE);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);

  const handleAddVehicle = (v: FleetVehicle) => {
    setVehicles((prev) => [...prev, v]);
    toast.success("Veículo adicionado!");
  };

  const handleUpdateVehicle = (v: FleetVehicle) => {
    setVehicles((prev) => prev.map((veh) => (veh.id === v.id ? v : veh)));
    setEditingVehicle(null);
    toast.success("Veículo atualizado!");
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    toast.success("Veículo removido!");
  };

  const handleAddMaintenance = (m: MaintenanceRecord) => {
    setMaintenance((prev) => [m, ...prev]);
    toast.success("Manutenção registrada!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Veículos da Frota</h3>
        <VehicleFormDialog onSave={handleAddVehicle} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {vehicles.map((v) => (
          <Card key={v.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{v.brand} {v.model} ({v.year})</span>
                <Badge variant={v.status === "active" ? "default" : v.status === "maintenance" ? "secondary" : "outline"}>
                  {v.status === "active" ? "Ativo" : v.status === "maintenance" ? "Em manutenção" : "Inativo"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Tipo: {v.type}</span>
                <span>Placa: {v.plate}</span>
                {v.km && <span>{v.km.toLocaleString()} km</span>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Wrench className="h-3 w-3" />
                Próxima manutenção: {v.nextMaintenance}
              </div>
              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingVehicle(v)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteVehicle(v.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {vehicles.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">Nenhum veículo cadastrado.</p>}
      </div>

      {editingVehicle && (
        <VehicleFormDialog vehicle={editingVehicle} onSave={handleUpdateVehicle} open onOpenChange={(o) => !o && setEditingVehicle(null)} />
      )}

      <Separator />

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Histórico de Manutenção</h3>
        <MaintenanceFormDialog vehicles={vehicles} onSave={handleAddMaintenance} />
      </div>

      {maintenance.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Veículo</TableHead>
              <TableHead>Serviço</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Custo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {maintenance.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.vehicleLabel}</TableCell>
                <TableCell>{m.service}</TableCell>
                <TableCell>{m.date}</TableCell>
                <TableCell className="text-right">{formatCurrency(m.cost)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-muted-foreground text-center py-4">Nenhum registro de manutenção.</p>
      )}

      <Separator />
      <div>
        <h3 className="font-semibold mb-3">Rastreamento GPS</h3>
        <Card>
          <CardContent className="p-8 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Mapa com posição em tempo real dos veículos</p>
              <p className="text-xs">Integração com Mapbox</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Vehicle Form ─── */
function VehicleFormDialog({ vehicle, onSave, open: cOpen, onOpenChange }: {
  vehicle?: FleetVehicle; onSave: (v: FleetVehicle) => void; open?: boolean; onOpenChange?: (o: boolean) => void;
}) {
  const [iOpen, setIOpen] = useState(false);
  const isC = cOpen !== undefined;
  const isOpen = isC ? cOpen : iOpen;
  const setOpen = isC ? onOpenChange! : setIOpen;

  const [form, setForm] = useState({
    type: vehicle?.type || "", plate: vehicle?.plate || "", brand: vehicle?.brand || "",
    model: vehicle?.model || "", year: vehicle?.year || "", status: vehicle?.status || "active" as FleetVehicle["status"],
    nextMaintenance: vehicle?.nextMaintenance || "", km: vehicle?.km || 0,
  });
  const u = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));
  const valid = form.type && form.plate && form.brand && form.model;

  const submit = () => {
    if (!valid) return;
    onSave({ id: vehicle?.id || generateId(), ...form });
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isC && <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar Veículo</Button></DialogTrigger>}
      <DialogContent>
        <DialogHeader><DialogTitle>{vehicle ? "Editar Veículo" : "Novo Veículo"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo *</Label><Input value={form.type} onChange={(e) => u("type", e.target.value)} placeholder="VUC, Fiorino..." /></div>
            <div><Label>Placa *</Label><Input value={form.plate} onChange={(e) => u("plate", e.target.value)} placeholder="ABC-1234" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Marca *</Label><Input value={form.brand} onChange={(e) => u("brand", e.target.value)} /></div>
            <div><Label>Modelo *</Label><Input value={form.model} onChange={(e) => u("model", e.target.value)} /></div>
            <div><Label>Ano</Label><Input value={form.year} onChange={(e) => u("year", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>KM atual</Label><Input type="number" value={form.km} onChange={(e) => u("km", Number(e.target.value))} /></div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => u("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="maintenance">Em manutenção</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Próxima manutenção</Label><Input type="date" value={form.nextMaintenance} onChange={(e) => u("nextMaintenance", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={submit} disabled={!valid}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Maintenance Form ─── */
function MaintenanceFormDialog({ vehicles, onSave }: { vehicles: FleetVehicle[]; onSave: (m: MaintenanceRecord) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", service: "", date: "", cost: 0 });
  const u = (f: string, v: any) => setForm((p) => ({ ...p, [f]: v }));
  const valid = form.vehicleId && form.service && form.date && form.cost > 0;

  const submit = () => {
    if (!valid) return;
    const v = vehicles.find((veh) => veh.id === form.vehicleId);
    onSave({ id: generateId(), ...form, vehicleLabel: v ? `${v.brand} ${v.model} (${v.plate})` : form.vehicleId });
    setForm({ vehicleId: "", service: "", date: "", cost: 0 });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Registrar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova Manutenção</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Veículo *</Label>
            <Select value={form.vehicleId} onValueChange={(v) => u("vehicleId", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.plate})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div><Label>Serviço *</Label><Input value={form.service} onChange={(e) => u("service", e.target.value)} placeholder="Ex: Troca de óleo" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => u("date", e.target.value)} /></div>
            <div><Label>Custo (R$) *</Label><Input type="number" value={form.cost} onChange={(e) => u("cost", Number(e.target.value))} /></div>
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
