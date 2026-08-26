import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  Plus,
  QrCode,
  ExternalLink,
  MapPin,
  Clock,
  Ticket,
  Users,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { EmptyState } from "@/components/state/states";
import { ImageUpload } from "@/components/ui/image-upload";
import { listAdminEvents, upsertEvent } from "@/services/events.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/eventos/")({
  head: () => ({ meta: [{ title: "Gestão de Eventos & Produtora — Wider" }] }),
  loader: async () => {
    try {
      const events = await listAdminEvents();
      return { events: events || [] };
    } catch {
      return { events: [] };
    }
  },
  component: WorkspaceEventosPage,
});

function WorkspaceEventosPage() {
  const { events } = Route.useLoaderData();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    cover_image: "",
    category: "shows",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.event_date) {
      toast.error("Informe o título e a data do evento.");
      return;
    }

    setIsSaving(true);
    try {
      await upsertEvent({
        data: {
          title: form.title,
          description: form.description,
          event_date: form.event_date,
          location: form.location,
          cover_image: form.cover_image || undefined,
          category: form.category,
          status: "published",
        } as any,
      });

      toast.success("Evento criado com sucesso!");
      setIsOpen(false);
      setForm({
        title: "",
        description: "",
        event_date: "",
        location: "",
        cover_image: "",
        category: "shows",
      });
      router.invalidate();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar evento.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Eventos & Atrações"
        actions={
          <Button onClick={() => setIsOpen(true)} className="gap-2">
            <Plus className="size-4" />
            Criar Evento
          </Button>
        }
      />

      {/* Grid de Eventos */}
      {events.length === 0 ? (
        <EmptyState
          title="Nenhum evento cadastrado"
          description="Crie o primeiro evento da sua produtora para iniciar as vendas de ingressos."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event: any) => (
            <div
              key={event.id}
              className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {event.cover_image ? (
                  <div className="w-full aspect-[16/9] bg-muted overflow-hidden">
                    <img
                      src={event.cover_image}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] bg-muted/40 flex items-center justify-center text-muted-foreground">
                    <Calendar className="size-8 opacity-40" />
                  </div>
                )}

                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono uppercase">
                      {event.category || "Evento"}
                    </Badge>
                    <Badge
                      variant={event.status === "published" ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {event.status === "published" ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-foreground line-clamp-1">
                    {event.title}
                  </h3>

                  {event.event_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="size-3.5" />
                      {new Date(event.event_date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}

                  {event.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="size-3.5 shrink-0" />
                      {event.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Ações Rápidas do Evento */}
              <div className="p-4 pt-0 flex items-center gap-2 border-t border-border/40 mt-3 pt-3">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="flex-1 h-9 rounded-xl text-xs font-semibold gap-1.5"
                >
                  <Link
                    to="/workspace/eventos/$id"
                    params={{ id: event.id }}
                  >
                    <Ticket className="size-3.5" />
                    Gerenciar Lotes & Setores
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl text-xs font-semibold gap-1.5"
                  title="Portaria / Validador de QR Code"
                >
                  <Link
                    to="/workspace/eventos/$id/checkin"
                    params={{ id: event.id }}
                  >
                    <QrCode className="size-3.5" />
                  </Link>
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2.5 rounded-xl text-xs"
                  title="Ver na Vitrine Pública"
                >
                  <Link
                    to="/evento/$id"
                    params={{ id: event.id }}
                    target="_blank"
                  >
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer de Cadastro de Evento */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="sm:max-w-xl p-0 overflow-y-auto">
          <SheetHeader className="px-6 py-4 bg-muted/30">
            <SheetTitle className="text-xl font-bold">Novo Evento / Atração</SheetTitle>
            <SheetDescription>
              Preencha os dados do evento para habilitar a venda de ingressos e o controle de portaria.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="evt-title">Título do Evento *</Label>
              <Input
                id="evt-title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Festival de Verão 2026"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="evt-date">Data e Hora *</Label>
                <Input
                  id="evt-date"
                  type="datetime-local"
                  required
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evt-cat">Categoria</Label>
                <Input
                  id="evt-cat"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Ex: shows, teatro, festival"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-loc">Local / Endereço</Label>
              <Input
                id="evt-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Ex: Arena Central — São Miguel do Oeste"
              />
            </div>

            <div className="space-y-2">
              <Label>Capa do Evento (16:9)</Label>
              <ImageUpload
                value={form.cover_image}
                onChange={(url) => setForm({ ...form, cover_image: url })}
                onRemove={() => setForm({ ...form, cover_image: "" })}
                aspectPreset="widescreen"
                bucket="cms-media"
                helperText="Arraste ou selecione a imagem oficial de divulgação do evento."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evt-desc">Descrição / Line-up</Label>
              <Textarea
                id="evt-desc"
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes da atração, horários e regulamento..."
              />
            </div>

            <SheetFooter className="pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} className="font-bold">
                {isSaving ? "Salvando..." : "Criar e Publicar"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
