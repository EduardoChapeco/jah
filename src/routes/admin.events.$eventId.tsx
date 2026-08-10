import { createFileRoute, useNavigate, useRouter, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Save,
  QrCode,
  Ticket,
  FileText,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatMoney } from "@/lib/money";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Surface } from "@/components/ui/surface";
import { ImageUpload } from "@/components/ui/image-upload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  getAdminEventById,
  upsertEvent,
  listEventLots,
  upsertEventLot,
} from "@/services/events.functions";

export const Route = createFileRoute("/admin/events/$eventId")({
  head: () => ({ meta: [{ title: "Gerenciar Evento — Admin" }] }),
  loader: async ({ params }) => {
    if (params.eventId === "new") {
      return { event: null, lots: [] };
    }
    const event = await getAdminEventById({ data: params.eventId });
    const lots = await listEventLots({ data: params.eventId });
    return { event, lots };
  },
  component: AdminEventEditor,
});

function AdminEventEditor() {
  const { event, lots } = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const isNew = eventId === "new";
  const navigate = useNavigate();
  const router = useRouter();

  // Event State
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [eventDate, setEventDate] = useState(
    event?.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : "",
  );
  const [location, setLocation] = useState(event?.location || "");
  const [status, setStatus] = useState<"draft" | "published" | "cancelled">(
    event?.status || "draft",
  );
  const [coverImage, setCoverImage] = useState(event?.cover_image || "");

  const [isSaving, setIsSaving] = useState(false);

  // Lot Management State
  const [isLotSheetOpen, setIsLotSheetOpen] = useState(false);
  const [editingLot, setEditingLot] = useState<any>(null);
  const [lotName, setLotName] = useState("");
  const [lotPrice, setLotPrice] = useState("");
  const [lotCapacity, setLotCapacity] = useState("");
  const [lotStatus, setLotStatus] = useState<"active" | "inactive" | "sold_out">("active");
  const [isSavingLot, setIsSavingLot] = useState(false);

  const handleSaveEvent = async () => {
    if (!title || !eventDate) {
      toast.error("Título e Data são obrigatórios.");
      return;
    }
    setIsSaving(true);
    try {
      const payload: any = {
        title,
        description,
        event_date: new Date(eventDate).toISOString(),
        location,
        status,
        cover_image: coverImage || null,
      };
      if (!isNew) {
        payload.id = event!.id;
      }

      const res = await upsertEvent({ data: payload });
      toast.success(isNew ? "Evento criado!" : "Evento atualizado!");

      if (isNew) {
        navigate({ to: "/admin/events/$eventId", params: { eventId: res.id } });
      } else {
        await router.invalidate();
      }
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar evento");
    } finally {
      setIsSaving(false);
    }
  };

  const openLotSheet = (lot?: any) => {
    if (lot) {
      setEditingLot(lot);
      setLotName(lot.name);
      setLotPrice((lot.price_cents / 100).toFixed(2));
      setLotCapacity(lot.capacity?.toString() || "");
      setLotStatus(lot.status);
    } else {
      setEditingLot(null);
      setLotName("");
      setLotPrice("");
      setLotCapacity("");
      setLotStatus("active");
    }
    setIsLotSheetOpen(true);
  };

  const handleSaveLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotName || !lotPrice) return;

    setIsSavingLot(true);
    try {
      const priceCents = Math.round(parseFloat(lotPrice.replace(",", ".")) * 100);
      const capacityNum = lotCapacity ? parseInt(lotCapacity, 10) : undefined;

      const payload: any = {
        event_id: event!.id,
        name: lotName,
        price_cents: priceCents,
        capacity: capacityNum,
        status: lotStatus,
      };

      if (editingLot) {
        payload.id = editingLot.id;
      }

      await upsertEventLot({ data: payload });
      toast.success(editingLot ? "Lote atualizado!" : "Lote criado!");
      setIsLotSheetOpen(false);
      await router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar lote");
    } finally {
      setIsSavingLot(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/events">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? "Novo Evento" : "Gerenciar Evento"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isNew
              ? "Crie os dados básicos do evento."
              : "Gerencie informações, ingressos e configurações."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <Button variant="outline" asChild>
              <Link to="/admin/events/$eventId/checkin" params={{ eventId: event!.id }}>
                <QrCode className="mr-2 h-4 w-4" />
                Portaria (Check-in)
              </Link>
            </Button>
          )}
          <Button onClick={handleSaveEvent} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent mb-6">
          <TabsTrigger
            value="info"
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-6"
          >
            <FileText className="h-4 w-4 mr-2" />
            Informações
          </TabsTrigger>
          <TabsTrigger
            value="tickets"
            disabled={isNew}
            className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary py-3 px-6"
          >
            <Ticket className="h-4 w-4 mr-2" />
            Lotes e Ingressos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          <Surface variant="default" padding="none">
            <div className="p-6 border-b border-border/20 bg-muted/10">
              <h3 className="text-base font-bold">Dados Principais</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Imagem de Capa (Flyer)</Label>
                <ImageUpload 
                  value={coverImage} 
                  onChange={setCoverImage} 
                  bucket="cms-media"
                />
              </div>
              <div className="space-y-2">
                <Label>Título do Evento</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Festival Jah de Inverno"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho (Oculto)</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Praça Central, Rua XV..."
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  placeholder="Fale sobre as atrações, regras..."
                />
              </div>
            </div>
          </Surface>
        </TabsContent>

        <TabsContent value="tickets">
          <Surface variant="default" padding="none">
            <div className="flex flex-row items-center justify-between p-6 border-b border-border/20 bg-muted/10">
              <div>
                <h3 className="text-base font-bold">Lotes de Ingressos</h3>
                <p className="text-sm text-muted-foreground">
                  Crie categorias de ingresso (Meia, Inteira, VIP).
                </p>
              </div>
              <Button onClick={() => openLotSheet()}>Novo Lote</Button>
            </div>
            <div className="p-6">
              {lots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground bg-muted/20 border border-dashed">
                  Nenhum lote cadastrado. Crie um lote para começar a vender.
                </div>
              ) : (
                <div className="space-y-3">
                  {lots.map((lot: any) => (
                    <div
                      key={lot.id}
                      className="flex items-center justify-between p-4 border bg-card"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold">{lot.name}</h4>
                          <Badge variant={lot.status === "active" ? "default" : "secondary"}>
                            {lot.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Capacidade:{" "}
                          {lot.capacity
                            ? `${lot.sold_count} vendidos de ${lot.capacity}`
                            : `${lot.sold_count} vendidos (ilimitado)`}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-lg">
                          {formatMoney(lot.price_cents)}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => openLotSheet(lot)}>
                          Editar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Surface>
        </TabsContent>
      </Tabs>

      {/* Sheet para Edição de Lote (Microfase 1 - Design Pattern: No small dialogs for complex forms) */}
      <Sheet open={isLotSheetOpen} onOpenChange={setIsLotSheetOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{editingLot ? "Editar Lote" : "Novo Lote"}</SheetTitle>
            <SheetDescription>
              Configure o nome, preço e capacidade deste tipo de ingresso.
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSaveLot} className="space-y-6 mt-6">
            <div className="space-y-2">
              <Label>Nome do Lote/Ingresso</Label>
              <Input
                value={lotName}
                onChange={(e) => setLotName(e.target.value)}
                placeholder="Ex: Pista - Lote 1, Camarote..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Preço (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={lotPrice}
                  onChange={(e) => setLotPrice(e.target.value)}
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Capacidade (Opcional)</Label>
                <Input
                  type="number"
                  min="1"
                  value={lotCapacity}
                  onChange={(e) => setLotCapacity(e.target.value)}
                  placeholder="Ilimitado se vazio"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={lotStatus} onValueChange={(v: any) => setLotStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo (Vendendo)</SelectItem>
                  <SelectItem value="inactive">Pausado</SelectItem>
                  <SelectItem value="sold_out">Esgotado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setIsLotSheetOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSavingLot}>
                {isSavingLot ? "Salvando..." : "Salvar Lote"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
