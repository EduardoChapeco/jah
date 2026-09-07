import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useReservations, useCreateReservation, useUpdateReservation, useRestaurantTables, useRestaurantSectors } from "@/hooks/useRestaurant";
import { Calendar, Clock, Users, Phone, Check, X, AlertTriangle, Plus } from "lucide-react";
import { toast } from "sonner";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, string> = { pending: "Pendente", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Concluída", no_show: "No-show" };
const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800", completed: "bg-blue-100 text-blue-800", no_show: "bg-orange-100 text-orange-800" };

interface Props { companyId: string; }

export default function ReservationsTab({ companyId }: Props) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const { data: reservations = [], isLoading } = useReservations(companyId, selectedDate);
  const { data: allReservations = [] } = useReservations(companyId);
  const { data: tables = [] } = useRestaurantTables(companyId);
  const { data: sectors = [] } = useRestaurantSectors(companyId);
  const createReservation = useCreateReservation();
  const updateReservation = useUpdateReservation();

  const [showNew, setShowNew] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [filter, setFilter] = useState("all");

  const [form, setForm] = useState({
    customer_name: "", customer_phone: "", party_size: 2, reserved_date: format(new Date(), "yyyy-MM-dd"),
    reserved_time: "19:00", table_id: "", sector_preference: "", notes: "", duration_hours: 2, prepayment: 0,
  });

  const handleCreate = async () => {
    if (!form.customer_name || !form.customer_phone) { toast.error("Nome e telefone são obrigatórios"); return; }
    await createReservation.mutateAsync({
      company_id: companyId,
      customer_name: form.customer_name,
      customer_phone: form.customer_phone,
      party_size: form.party_size,
      reserved_date: form.reserved_date,
      reserved_time: form.reserved_time,
      table_id: form.table_id || null,
      sector_preference: form.sector_preference || null,
      notes: form.notes || null,
      duration_hours: form.duration_hours,
      prepayment: form.prepayment || null,
      status: "pending",
    });
    toast.success("Reserva criada com sucesso");
    setShowNew(false);
    resetForm();
  };

  const resetForm = () => setForm({ customer_name: "", customer_phone: "", party_size: 2, reserved_date: format(new Date(), "yyyy-MM-dd"), reserved_time: "19:00", table_id: "", sector_preference: "", notes: "", duration_hours: 2, prepayment: 0 });

  const handleConfirm = async (id: string) => { await updateReservation.mutateAsync({ id, status: "confirmed" }); toast.success("Reserva confirmada"); };
  const handleCancel = async (id: string) => { await updateReservation.mutateAsync({ id, status: "cancelled" }); toast.success("Reserva cancelada"); };
  const handleComplete = async (id: string) => { await updateReservation.mutateAsync({ id, status: "completed" }); toast.success("Reserva concluída"); };
  const handleNoShow = async (id: string) => { await updateReservation.mutateAsync({ id, status: "no_show" }); toast.success("Marcada como no-show"); };

  const filtered = reservations.filter((r: any) => filter === "all" ? true : r.status === filter);

  // Stats
  const todayCount = reservations.length;
  const pendingCount = allReservations.filter((r: any) => r.status === "pending").length;
  const confirmedToday = reservations.filter((r: any) => r.status === "confirmed").length;
  const totalGuests = reservations.reduce((s: number, r: any) => s + (r.party_size || 0), 0);

  // Date navigation
  const dates = Array.from({ length: 7 }, (_, i) => format(addDays(new Date(), i), "yyyy-MM-dd"));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold">Reservas</h2>
        <Button onClick={() => setShowNew(true)}><Plus className="h-4 w-4 mr-1" />Nova Reserva</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{todayCount}</p><p className="text-xs text-muted-foreground">Hoje</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{confirmedToday}</p><p className="text-xs text-muted-foreground">Confirmadas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold">{totalGuests}</p><p className="text-xs text-muted-foreground">Pessoas</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-yellow-600">{pendingCount}</p><p className="text-xs text-muted-foreground">Pendentes</p></CardContent></Card>
      </div>

      {/* Date tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {dates.map(d => (
          <Button key={d} size="sm" variant={selectedDate === d ? "default" : "outline"} onClick={() => setSelectedDate(d)} className="whitespace-nowrap">
            {format(new Date(d + "T12:00"), "EEE dd/MM", { locale: ptBR })}
          </Button>
        ))}
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "cancelled", "no_show"].map(s => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>
            {s === "all" ? "Todas" : statusLabels[s]}
          </Button>
        ))}
      </div>

      {/* Reservations list */}
      {isLoading ? <p className="text-muted-foreground">Carregando...</p> : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">Nenhuma reserva para esta data</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r: any) => (
            <Card key={r.id} className="cursor-pointer hover:shadow-md" onClick={() => setShowDetail(r)}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-bold">{r.reserved_time}</p>
                    </div>
                    <div>
                      <p className="font-medium">{r.customer_name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{r.party_size} pessoas</span>
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.customer_phone}</span>
                        {r.restaurant_tables && <span>Mesa {(r.restaurant_tables as any).table_number}</span>}
                      </div>
                      {r.notes && <p className="text-xs text-muted-foreground mt-1">📝 {r.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={statusColors[r.status] || ""} variant="outline">{statusLabels[r.status] || r.status}</Badge>
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={e => { e.stopPropagation(); handleConfirm(r.id); }}><Check className="h-3 w-3" /></Button>
                        <Button size="sm" variant="outline" className="h-7 px-2" onClick={e => { e.stopPropagation(); handleCancel(r.id); }}><X className="h-3 w-3" /></Button>
                      </div>
                    )}
                    {r.status === "confirmed" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-green-600" onClick={e => { e.stopPropagation(); handleComplete(r.id); }}>✅</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-orange-600" onClick={e => { e.stopPropagation(); handleNoShow(r.id); }}><AlertTriangle className="h-3 w-3" /></Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New reservation dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Reserva</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do Cliente *</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
            <div><Label>Telefone *</Label><Input value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} placeholder="(11) 99999-9999" /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Data</Label><Input type="date" value={form.reserved_date} onChange={e => setForm(f => ({ ...f, reserved_date: e.target.value }))} /></div>
              <div><Label>Horário</Label><Input type="time" value={form.reserved_time} onChange={e => setForm(f => ({ ...f, reserved_time: e.target.value }))} /></div>
              <div><Label>Pessoas</Label><Input type="number" min={1} value={form.party_size} onChange={e => setForm(f => ({ ...f, party_size: +e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mesa (opcional)</Label>
                <Select value={form.table_id} onValueChange={v => setForm(f => ({ ...f, table_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Auto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Automático</SelectItem>
                    {tables.filter((t: any) => t.capacity >= form.party_size).map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>Mesa {t.table_number} ({t.capacity}p)</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {sectors.length > 0 && (
                <div>
                  <Label>Setor preferido</Label>
                  <Select value={form.sector_preference} onValueChange={v => setForm(f => ({ ...f, sector_preference: v }))}>
                    <SelectTrigger><SelectValue placeholder="Qualquer" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Qualquer</SelectItem>
                      {sectors.map((s: any) => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Duração (h)</Label><Input type="number" min={1} value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: +e.target.value }))} /></div>
              <div><Label>Pré-pagamento (R$)</Label><Input type="number" value={form.prepayment} onChange={e => setForm(f => ({ ...f, prepayment: +e.target.value }))} /></div>
            </div>
            <div><Label>Observações</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Aniversário, alergia, preferência..." rows={2} /></div>
          </div>
          <DialogFooter><Button onClick={handleCreate}>Criar Reserva</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation detail dialog */}
      <Dialog open={!!showDetail} onOpenChange={() => setShowDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Detalhes da Reserva</DialogTitle></DialogHeader>
          {showDetail && (
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-bold">{showDetail.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{showDetail.customer_phone}</p>
                </div>
                <Badge className={statusColors[showDetail.status] || ""} variant="outline">{statusLabels[showDetail.status]}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" />{format(new Date(showDetail.reserved_date + "T12:00"), "dd/MM/yyyy")}</div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{showDetail.reserved_time}</div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />{showDetail.party_size} pessoas</div>
                <div className="text-muted-foreground">{showDetail.duration_hours}h de duração</div>
              </div>
              {showDetail.sector_preference && <p className="text-sm">Setor: {showDetail.sector_preference}</p>}
              {showDetail.notes && <div className="p-2 bg-muted rounded text-sm"><p className="font-medium text-xs text-muted-foreground mb-1">Observações:</p>{showDetail.notes}</div>}
              {showDetail.prepayment > 0 && <p className="text-sm font-medium text-green-600">Pré-pagamento: R$ {Number(showDetail.prepayment).toFixed(2)}</p>}
              {showDetail.no_show_fee > 0 && showDetail.status === "no_show" && <p className="text-sm font-medium text-red-600">Taxa no-show: R$ {Number(showDetail.no_show_fee).toFixed(2)}</p>}
              <DialogFooter className="gap-2">
                {showDetail.status === "pending" && (
                  <>
                    <Button variant="outline" onClick={() => { handleConfirm(showDetail.id); setShowDetail(null); }}>Confirmar</Button>
                    <Button variant="destructive" onClick={() => { handleCancel(showDetail.id); setShowDetail(null); }}>Cancelar</Button>
                  </>
                )}
                {showDetail.status === "confirmed" && (
                  <>
                    <Button variant="outline" onClick={() => { handleComplete(showDetail.id); setShowDetail(null); }}>Concluída</Button>
                    <Button variant="destructive" onClick={() => { handleNoShow(showDetail.id); setShowDetail(null); }}>No-show</Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
