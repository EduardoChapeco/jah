import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Plus, Phone, Star, Pencil, Trash2, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { INITIAL_PROFESSIONALS, INITIAL_SERVICE_TYPES, PRO_STATUS_MAP, Professional, generateId } from "./logistics-data";
import { VehicleModal, type Vehicle } from "./VehicleModal";

export function ProfessionalsSection() {
  const [pros, setPros] = useState<Professional[]>(INITIAL_PROFESSIONALS);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingPro, setEditingPro] = useState<Professional | null>(null);
  const [vehicleTarget, setVehicleTarget] = useState<string | null>(null);

  const filtered = statusFilter === "all" ? pros : pros.filter((p) => p.status === statusFilter);

  const handleAdd = (pro: Professional) => {
    setPros((prev) => [...prev, pro]);
    toast.success("Profissional cadastrado!");
  };

  const handleUpdate = (pro: Professional) => {
    setPros((prev) => prev.map((p) => (p.id === pro.id ? pro : p)));
    setEditingPro(null);
    toast.success("Profissional atualizado!");
  };

  const handleDelete = (id: string) => {
    setPros((prev) => prev.filter((p) => p.id !== id));
    toast.success("Profissional removido!");
  };

  const handleVehicleSave = (vehicle: Vehicle) => {
    if (!vehicleTarget) return;
    setPros((prev) =>
      prev.map((p) =>
        p.id === vehicleTarget
          ? { ...p, vehicle: `${vehicle.type} — ${vehicle.plate}` }
          : p
      )
    );
    setVehicleTarget(null);
    toast.success("Veículo vinculado!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">Profissionais</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos ({pros.length})</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="busy">Ocupado</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ProfessionalFormDialog onSave={handleAdd} />
      </div>

      <div className="space-y-2">
        {filtered.map((p) => {
          const ps = PRO_STATUS_MAP[p.status];
          return (
            <Card key={p.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold shrink-0">
                      {p.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        <span className={cn("h-2 w-2 rounded-full shrink-0", ps.dotClass)} />
                        <span className="text-xs text-muted-foreground">{ps.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.type}</p>
                      {p.vehicle && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Truck className="h-3 w-3" /> {p.vehicle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-primary text-primary" />
                      <span className="font-medium text-sm">{p.rating}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={`tel:${p.phone}`}><Phone className="h-4 w-4" /></a>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setVehicleTarget(p.id)} title="Adicionar veículo">
                      <Truck className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingPro(p)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum profissional encontrado.</p>
        )}
      </div>

      {editingPro && (
        <ProfessionalFormDialog
          professional={editingPro}
          onSave={handleUpdate}
          open
          onOpenChange={(o) => !o && setEditingPro(null)}
        />
      )}

      <VehicleModal
        open={!!vehicleTarget}
        onOpenChange={(o) => !o && setVehicleTarget(null)}
        onSave={handleVehicleSave}
      />
    </div>
  );
}

/* ─── Simple Professional Form (6 fields per spec) ─── */
function ProfessionalFormDialog({
  professional,
  onSave,
  open: controlledOpen,
  onOpenChange,
}: {
  professional?: Professional;
  onSave: (p: Professional) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [form, setForm] = useState({
    name: professional?.name || "",
    cpf: professional?.cpf || "",
    phone: professional?.phone || "",
    type: professional?.type || "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isValid = form.name && form.type && form.phone;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      id: professional?.id || generateId(),
      name: form.name,
      cpf: form.cpf,
      phone: form.phone,
      type: form.type,
      vehicle: professional?.vehicle || "",
      status: professional?.status || "offline",
      rating: professional?.rating || 0,
    });
    if (!professional) setForm({ name: "", cpf: "", phone: "", type: "" });
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Cadastrar</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {professional ? "Editar Profissional" : "Novo Profissional"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Nome completo" />
          </div>
          <div>
            <Label>CPF</Label>
            <Input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} placeholder="000.000.000-00" />
          </div>
          <div>
            <Label>Telefone / WhatsApp *</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="(00) 00000-0000" />
          </div>
          <div>
            <Label>Tipo de serviço *</Label>
            <Select value={form.type} onValueChange={(v) => update("type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {INITIAL_SERVICE_TYPES.map((t) => (
                  <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
