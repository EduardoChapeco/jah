import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Clock, Edit3, Archive, Loader2, Save, Wrench } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/state/states";
import {
  listBookingServices,
  upsertBookingService,
  deleteBookingService,
} from "@/services/booking.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/agenda/servicos/")({
  head: () => ({ meta: [{ title: "Serviços de Agendamento — Wider Workspace" }] }),
  component: ServicesIndexPage,
});

interface ServiceFormState {
  id?: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_reais: string;
  category: string;
  gender_target: string;
  status: "active" | "archived";
}

const INITIAL_FORM: ServiceFormState = {
  title: "",
  description: "",
  duration_minutes: 30,
  price_reais: "50,00",
  category: "geral",
  gender_target: "todos",
  status: "active",
};

function ServicesIndexPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(INITIAL_FORM);

  const { data: res, isLoading } = useQuery({
    queryKey: ["booking-services"],
    queryFn: () => listBookingServices(),
  });

  const services = res?.data || [];

  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanPrice = parseFloat(form.price_reais.replace(".", "").replace(",", ".")) || 0;
      const price_cents = Math.round(cleanPrice * 100);

      return upsertBookingService({
        data: {
          id: form.id,
          title: form.title.trim(),
          description: form.description.trim() || null,
          duration_minutes: Number(form.duration_minutes),
          price_cents,
          category: form.category || null,
          gender_target: form.gender_target || null,
          status: form.status,
        },
      });
    },
    onSuccess: () => {
      toast.success(form.id ? "Serviço atualizado com sucesso." : "Novo serviço cadastrado.");
      setIsSheetOpen(false);
      setForm(INITIAL_FORM);
      queryClient.invalidateQueries({ queryKey: ["booking-services"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao salvar serviço.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteBookingService({ data: { id } });
    },
    onSuccess: () => {
      toast.success("Serviço arquivado com sucesso.");
      queryClient.invalidateQueries({ queryKey: ["booking-services"] });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao arquivar serviço.");
    },
  });

  const handleOpenCreate = () => {
    setForm(INITIAL_FORM);
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (service: any) => {
    setForm({
      id: service.id,
      title: service.title || "",
      description: service.description || "",
      duration_minutes: service.duration_minutes || 30,
      price_reais: (Number(service.price_cents || 0) / 100).toFixed(2).replace(".", ","),
      category: service.category || "geral",
      gender_target: service.gender_target || "todos",
      status: service.status || "active",
    });
    setIsSheetOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <PageHeader
        eyebrow="Configurações de Agendamento"
        title="Serviços"
        actions={
          <Button onClick={handleOpenCreate} className="rounded-xl gap-1.5">
            <Plus className="size-4" />
            Novo Serviço
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-40 flex items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <EmptyState
          title="Nenhum Serviço Cadastrado"
          action={
            <Button onClick={handleOpenCreate} className="rounded-xl">
              Cadastrar Primeiro Serviço
            </Button>
          }
        />
      ) : (
        <div className="bg-card rounded-2xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold text-xs">Serviço</TableHead>
                <TableHead className="font-semibold text-xs">Duração</TableHead>
                <TableHead className="font-semibold text-xs">Preço</TableHead>
                <TableHead className="font-semibold text-xs">Status</TableHead>
                <TableHead className="text-right font-semibold text-xs">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {services.map((service: any) => (
                <TableRow key={service.id} className="group hover:bg-muted/20 transition-colors">
                  <TableCell>
                    <div className="font-semibold text-foreground text-sm">{service.title}</div>
                    {service.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-[320px] mt-0.5">
                        {service.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs gap-1">
                      <Clock className="size-3" />
                      {service.duration_minutes} min
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono font-medium text-sm text-foreground">
                    {formatMoney(service.price_cents)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={service.status === "active" ? "default" : "secondary"}>
                      {service.status === "active" ? "Ativo" : "Arquivado"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(service)}
                        className="size-8 rounded-lg"
                        title="Editar Serviço"
                      >
                        <Edit3 className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm(`Deseja arquivar o serviço "${service.title}"?`)) {
                            deleteMutation.mutate(service.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Arquivar"
                      >
                        <Archive className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Editor Drawer / Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md bg-card flex flex-col justify-between">
          <div className="space-y-5">
            <SheetHeader>
              <SheetTitle className="text-base font-semibold flex items-center gap-2">
                <Wrench className="size-4 text-primary" />
                {form.id ? "Editar Serviço" : "Novo Serviço"}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Configure os parâmetros de agendamento, duração e tarifa do serviço.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="service-title" className="text-xs font-semibold">
                  Título do Serviço *
                </Label>
                <Input
                  id="service-title"
                  placeholder="Ex: Corte Degrade + Barba, Massagem..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="rounded-xl h-10 text-sm"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="service-desc" className="text-xs font-semibold">
                  Descrição / Detalhes
                </Label>
                <Textarea
                  id="service-desc"
                  placeholder="Descreva o que está incluso no atendimento..."
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="rounded-xl text-xs resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Duração (Minutos) *</Label>
                  <Select
                    value={String(form.duration_minutes)}
                    onValueChange={(val) => setForm({ ...form, duration_minutes: Number(val) })}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">1 hora (60 min)</SelectItem>
                      <SelectItem value="90">1h30 (90 min)</SelectItem>
                      <SelectItem value="120">2 horas (120 min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="service-price" className="text-xs font-semibold">
                    Preço (R$) *
                  </Label>
                  <Input
                    id="service-price"
                    placeholder="0,00"
                    value={form.price_reais}
                    onChange={(e) => setForm({ ...form, price_reais: e.target.value })}
                    className="rounded-xl h-10 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Público / Gênero</Label>
                  <Select
                    value={form.gender_target}
                    onValueChange={(val) => setForm({ ...form, gender_target: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="todos">Todos (Unissex)</SelectItem>
                      <SelectItem value="masculino">Masculino</SelectItem>
                      <SelectItem value="feminino">Feminino</SelectItem>
                      <SelectItem value="infantil">Infantil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val: any) => setForm({ ...form, status: val })}
                  >
                    <SelectTrigger className="rounded-xl h-10 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="active">Ativo (Disponível)</SelectItem>
                      <SelectItem value="archived">Arquivado (Oculto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSheetOpen(false)}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title.trim()}
              className="rounded-xl gap-1.5 min-w-[120px]"
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Salvar Serviço
                </>
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

