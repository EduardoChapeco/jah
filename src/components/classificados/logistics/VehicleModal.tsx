import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";

export interface Vehicle {
  type: string;
  plate: string;
  year: string;
}

const VEHICLE_TYPES = [
  { value: "moto", label: "Moto" },
  { value: "carro", label: "Carro" },
  { value: "van", label: "Van" },
  { value: "caminhao", label: "Caminhão" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "fiorino", label: "Fiorino / Utilitário" },
];

export function VehicleModal({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (v: Vehicle) => void;
}) {
  const [form, setForm] = useState<Vehicle>({ type: "", plate: "", year: "" });
  const update = (field: keyof Vehicle, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const isValid = form.type && form.plate;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave(form);
    setForm({ type: "", plate: "", year: "" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Veículo</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tipo de veículo *</Label>
            <Select value={form.type} onValueChange={(v) => update("type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {VEHICLE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Placa *</Label>
            <Input value={form.plate} onChange={(e) => update("plate", e.target.value)} placeholder="ABC-1234" />
          </div>
          <div>
            <Label>Ano</Label>
            <Input value={form.year} onChange={(e) => update("year", e.target.value)} placeholder="2024" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>Salvar Veículo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
