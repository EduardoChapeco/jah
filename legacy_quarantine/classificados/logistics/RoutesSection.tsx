import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Plus, Calendar, Clock, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { INITIAL_ROUTES, Route, generateId } from "./logistics-data";

export function RoutesSection() {
  const [routes, setRoutes] = useState<Route[]>(INITIAL_ROUTES);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const handleAdd = (route: Route) => {
    setRoutes((prev) => [...prev, route]);
    toast.success("Rota criada!");
  };

  const handleUpdate = (route: Route) => {
    setRoutes((prev) => prev.map((r) => (r.id === route.id ? route : r)));
    setEditingRoute(null);
    toast.success("Rota atualizada!");
  };

  const handleDelete = (id: string) => {
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    toast.success("Rota removida!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Rotas Fixas</h3>
        <RouteFormDialog onSave={handleAdd} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {routes.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{r.name}</span>
                <Badge variant="outline">R$ {r.price}/vaga</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{r.origin} → {r.destination}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{r.days}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">{r.booked}/{r.slots} vagas</span>
                <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(r.booked / r.slots) * 100}%` }} />
                </div>
              </div>
              <div className="flex gap-1 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setEditingRoute(r)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {routes.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-8">Nenhuma rota cadastrada.</p>}
      </div>

      {/* Edit dialog */}
      {editingRoute && (
        <RouteFormDialog route={editingRoute} onSave={handleUpdate} open onOpenChange={(o) => !o && setEditingRoute(null)} />
      )}

      <Separator />
      <div>
        <h3 className="font-semibold mb-3">Mapa de Calor de Solicitações</h3>
        <Card>
          <CardContent className="p-8 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Mapa de calor com concentração de solicitações</p>
              <p className="text-xs">Integração com Mapbox será ativada aqui</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ─── Route Form Dialog ─── */
function RouteFormDialog({
  route, onSave, open: controlledOpen, onOpenChange,
}: {
  route?: Route;
  onSave: (r: Route) => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [form, setForm] = useState<Omit<Route, "id">>({
    name: route?.name || "", origin: route?.origin || "", destination: route?.destination || "",
    days: route?.days || "Seg-Sex", time: route?.time || "", price: route?.price || 0,
    slots: route?.slots || 4, booked: route?.booked || 0,
  });

  const update = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }));
  const isValid = form.name && form.origin && form.destination && form.price > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({ id: route?.id || generateId(), ...form });
    if (!route) setForm({ name: "", origin: "", destination: "", days: "Seg-Sex", time: "", price: 0, slots: 4, booked: 0 });
    setOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova Rota</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>{route ? "Editar Rota" : "Nova Rota"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome da rota *</Label><Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex: Rota Centro-Norte" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Origem *</Label><Input value={form.origin} onChange={(e) => update("origin", e.target.value)} /></div>
            <div><Label>Destino *</Label><Input value={form.destination} onChange={(e) => update("destination", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Dias</Label><Input value={form.days} onChange={(e) => update("days", e.target.value)} placeholder="Seg-Sex" /></div>
            <div><Label>Horários</Label><Input value={form.time} onChange={(e) => update("time", e.target.value)} placeholder="07:00 / 18:00" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Preço/vaga (R$) *</Label><Input type="number" value={form.price} onChange={(e) => update("price", Number(e.target.value))} /></div>
            <div><Label>Total de vagas</Label><Input type="number" value={form.slots} onChange={(e) => update("slots", Number(e.target.value))} /></div>
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
