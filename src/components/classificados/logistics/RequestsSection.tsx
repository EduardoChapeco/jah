import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Calendar, Users, ChevronRight, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  INITIAL_REQUESTS, INITIAL_SERVICE_TYPES, INITIAL_PROFESSIONALS,
  STATUS_MAP, RequestStatus, LogisticsRequest, generateId,
} from "./logistics-data";

export function RequestsSection() {
  const [requests, setRequests] = useState<LogisticsRequest[]>(INITIAL_REQUESTS);
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [selectedRequest, setSelectedRequest] = useState<LogisticsRequest | null>(null);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    new: requests.filter((r) => r.status === "new").length,
    in_progress: requests.filter((r) => r.status === "in_progress").length,
    completed: requests.filter((r) => r.status === "completed").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
  };

  const FILTERS = [
    { key: "all" as const, label: "Todas" },
    { key: "new" as const, label: "Novas" },
    { key: "in_progress" as const, label: "Em andamento" },
    { key: "completed" as const, label: "Concluídas" },
    { key: "cancelled" as const, label: "Canceladas" },
  ];

  const handleAddRequest = (req: LogisticsRequest) => {
    setRequests((prev) => [req, ...prev]);
    toast.success("Solicitação criada com sucesso!");
  };

  const handleStatusChange = (id: string, newStatus: RequestStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
    );
    toast.success(`Status atualizado para "${STATUS_MAP[newStatus].label}"`);
    setSelectedRequest(null);
  };

  const handleAssignProfessional = (id: string, proName: string) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, professional: proName, status: "in_progress" } : r))
    );
    toast.success(`Profissional "${proName}" vinculado!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              size="sm"
              variant={filter === f.key ? "default" : "outline"}
              onClick={() => setFilter(f.key)}
            >
              {f.label} ({counts[f.key]})
            </Button>
          ))}
        </div>
        <NewRequestDialog onAdd={handleAddRequest} />
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const s = STATUS_MAP[r.status];
          const Icon = s.icon;
          return (
            <Card key={r.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => setSelectedRequest(r)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{r.type}</span>
                      <Badge variant="outline" className={cn("text-xs", s.color)}>{s.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.customer}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.origin} → {r.destination}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{r.date}{r.time && ` ${r.time}`}</span>
                      {r.professional && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.professional}</span>}
                    </div>
                    {r.items && <p className="text-xs text-muted-foreground mt-1">📦 {r.items}</p>}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhuma solicitação encontrada.</p>
        )}
      </div>

      {/* Detail dialog */}
      <RequestDetailDialog
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onStatusChange={handleStatusChange}
        onAssign={handleAssignProfessional}
      />
    </div>
  );
}

/* ─── New Request Dialog ─── */
function NewRequestDialog({ onAdd }: { onAdd: (r: LogisticsRequest) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    type: "", origin: "", destination: "", date: "", time: "", customer: "", notes: "", items: "", needsHelpers: false,
  });

  const update = (field: string, value: string | boolean) => setForm((f) => ({ ...f, [field]: value }));

  const isValid = form.type && form.origin && form.destination && form.date && form.customer;

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      id: generateId(),
      type: INITIAL_SERVICE_TYPES.find((t) => t.id === form.type)?.name || form.type,
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      time: form.time,
      status: "new",
      customer: form.customer,
      professional: null,
      notes: form.notes,
      items: form.items,
      needsHelpers: form.needsHelpers,
    });
    setForm({ type: "", origin: "", destination: "", date: "", time: "", customer: "", notes: "", items: "", needsHelpers: false });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nova OS</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova Solicitação</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Tipo de serviço *</Label>
            <Select value={form.type} onValueChange={(v) => update("type", v)}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {INITIAL_SERVICE_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Origem *</Label><Input placeholder="Endereço de origem" value={form.origin} onChange={(e) => update("origin", e.target.value)} /></div>
            <div><Label>Destino *</Label><Input placeholder="Endereço de destino" value={form.destination} onChange={(e) => update("destination", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => update("date", e.target.value)} /></div>
            <div><Label>Horário</Label><Input type="time" value={form.time} onChange={(e) => update("time", e.target.value)} /></div>
          </div>
          <div><Label>Cliente *</Label><Input placeholder="Nome do cliente" value={form.customer} onChange={(e) => update("customer", e.target.value)} /></div>

          {/* Moving-specific fields */}
          {form.type === "1" && (
            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <Label className="flex items-center gap-2 text-sm font-medium">📦 Dados da Mudança</Label>
              <div>
                <Label>Lista de itens</Label>
                <Textarea placeholder="Ex: Sofá 3 lugares, Geladeira, Mesa..." rows={2} value={form.items} onChange={(e) => update("items", e.target.value)} />
              </div>
              <Button variant="outline" size="sm" type="button"><Upload className="h-4 w-4 mr-1" /> Fotos dos itens pesados</Button>
              <div className="flex items-center gap-2">
                <Switch id="helpers" checked={form.needsHelpers} onCheckedChange={(v) => update("needsHelpers", v)} />
                <Label htmlFor="helpers">Precisa de ajudantes extras (+R$ 80/un)</Label>
              </div>
            </div>
          )}

          <div><Label>Observações</Label><Textarea placeholder="Detalhes adicionais..." rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>Criar Solicitação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Request Detail Dialog ─── */
function RequestDetailDialog({
  request, onClose, onStatusChange, onAssign,
}: {
  request: LogisticsRequest | null;
  onClose: () => void;
  onStatusChange: (id: string, status: RequestStatus) => void;
  onAssign: (id: string, proName: string) => void;
}) {
  if (!request) return null;

  const s = STATUS_MAP[request.status];
  const Icon = s.icon;

  const nextStatuses: { from: RequestStatus; to: RequestStatus; label: string }[] = [
    { from: "new", to: "in_progress", label: "Iniciar Atendimento" },
    { from: "in_progress", to: "completed", label: "Marcar como Concluída" },
    { from: "new", to: "cancelled", label: "Cancelar" },
    { from: "in_progress", to: "cancelled", label: "Cancelar" },
  ];

  const availableActions = nextStatuses.filter((a) => a.from === request.status);
  const availablePros = INITIAL_PROFESSIONALS.filter((p) => p.status !== "offline");

  return (
    <Dialog open={!!request} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {request.type} — {request.customer}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Badge variant="outline" className={cn("text-xs", s.color)}>{s.label}</Badge>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Origem:</span> <p className="font-medium">{request.origin}</p></div>
            <div><span className="text-muted-foreground">Destino:</span> <p className="font-medium">{request.destination}</p></div>
            <div><span className="text-muted-foreground">Data:</span> <p className="font-medium">{request.date}{request.time && ` às ${request.time}`}</p></div>
            <div><span className="text-muted-foreground">Profissional:</span> <p className="font-medium">{request.professional || "Não atribuído"}</p></div>
          </div>

          {request.items && (
            <div className="text-sm">
              <span className="text-muted-foreground">Itens:</span>
              <p className="font-medium">{request.items}</p>
            </div>
          )}

          {request.notes && (
            <div className="text-sm">
              <span className="text-muted-foreground">Observações:</span>
              <p>{request.notes}</p>
            </div>
          )}

          {request.cancelReason && (
            <div className="text-sm text-destructive">
              <span>Motivo do cancelamento:</span>
              <p className="font-medium">{request.cancelReason}</p>
            </div>
          )}

          {/* Assign professional */}
          {!request.professional && request.status === "new" && availablePros.length > 0 && (
            <div>
              <Label>Vincular profissional</Label>
              <Select onValueChange={(v) => onAssign(request.id, v)}>
                <SelectTrigger><SelectValue placeholder="Selecione um profissional" /></SelectTrigger>
                <SelectContent>
                  {availablePros.map((p) => (
                    <SelectItem key={p.id} value={p.name}>{p.name} — {p.type} (⭐ {p.rating})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          {availableActions.length > 0 && (
            <div className="flex gap-2 flex-wrap pt-2">
              {availableActions.map((a) => (
                <Button
                  key={a.to}
                  size="sm"
                  variant={a.to === "cancelled" ? "destructive" : "default"}
                  onClick={() => onStatusChange(request.id, a.to)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
