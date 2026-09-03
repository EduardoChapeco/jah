import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Search,
  Camera,
  Calendar,
  Compass,
  Edit2,
  Trash2,
  Hotel,
  Sun,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/commerce/page-header";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import {
  listDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  type DestinationDTO,
} from "@/services/travel-catalog.functions";

export const Route = createFileRoute("/workspace/turismo/destinos")({
  head: () => ({ meta: [{ title: "Banco de Destinos Turísticos | Workspace Wider" }] }),
  loader: async () => {
    const destinations = await listDestinations();
    return { destinations: destinations || [] };
  },
  component: WorkspaceDestinationsPage,
});

function WorkspaceDestinationsPage() {
  const { destinations: initialData } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<DestinationDTO | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    country: "Brasil",
    region: "",
    description: "",
    best_season: "",
    iata_gateway: "",
    weather_summary: "",
    cover_image_url: "",
  });

  const { data: destinations = initialData, refetch } = useQuery({
    queryKey: ["workspace_destinations"],
    queryFn: () => listDestinations(),
    initialData,
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createDestination({ data: payload }),
    onSuccess: () => {
      toast.success("Destino cadastrado com sucesso!");
      setIsSheetOpen(false);
      resetForm();
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao salvar destino."),
  });

  const updateMut = useMutation({
    mutationFn: (payload: any) => updateDestination({ data: payload }),
    onSuccess: () => {
      toast.success("Destino atualizado com sucesso!");
      setIsSheetOpen(false);
      resetForm();
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao atualizar destino."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteDestination({ data: { id } }),
    onSuccess: () => {
      toast.success("Destino removido.");
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao remover destino."),
  });

  const resetForm = () => {
    setEditingDestination(null);
    setFormData({
      name: "",
      country: "Brasil",
      region: "",
      description: "",
      best_season: "",
      iata_gateway: "",
      weather_summary: "",
      cover_image_url: "",
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (dest: DestinationDTO) => {
    setEditingDestination(dest);
    setFormData({
      name: dest.name,
      country: dest.country || "Brasil",
      region: dest.region || "",
      description: dest.description || "",
      best_season: dest.best_season || "",
      iata_gateway: dest.iata_gateway || "",
      weather_summary: dest.weather_summary || "",
      cover_image_url: dest.cover_image_url || "",
    });
    setIsSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Nome do destino é obrigatório.");
      return;
    }

    if (editingDestination) {
      updateMut.mutate({ id: editingDestination.id, ...formData });
    } else {
      createMut.mutate(formData);
    }
  };

  const filtered = destinations.filter((d: DestinationDTO) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(term) ||
      d.region?.toLowerCase().includes(term) ||
      d.country.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Turismo & Roteiros"
        title="Banco de Destinos"
        actions={
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground h-9 px-4 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Novo Destino</span>
          </Button>
        }
      />

      {/* Barra de Filtros & Busca */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por destino, estado ou país..."
            className="pl-10 h-10 rounded-xl bg-card text-xs border-border/70"
          />
        </div>
        <Badge variant="outline" className="h-10 px-3 rounded-xl font-mono text-xs border-border/70">
          {filtered.length} {filtered.length === 1 ? "destino" : "destinos"}
        </Badge>
      </div>

      {/* Grid de Destinos */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-card border border-border/60 space-y-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Compass className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Nenhum destino encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Cadastre destinos para conectar aos seus pacotes, hotéis parceiros e roteiros dia a dia.
          </p>
          <Button onClick={handleOpenCreate} size="sm" variant="outline" className="rounded-xl mt-2">
            + Cadastrar Primeiro Destino
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((dest: DestinationDTO) => (
            <div
              key={dest.id}
              className="bg-card rounded-3xl overflow-hidden border border-border/70 hover:border-primary/40 transition-all group flex flex-col shadow-2xs"
            >
              {/* Foto de Capa */}
              <div className="relative aspect-[16/9] w-full bg-muted/30 overflow-hidden">
                {dest.cover_image_url ? (
                  <img
                    src={dest.cover_image_url}
                    alt={dest.name}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-muted-foreground/40 gap-1.5">
                    <Camera className="size-8 stroke-[1.2]" />
                    <span className="text-[10px]">Sem foto de capa</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <Badge className="bg-background/90 text-foreground backdrop-blur-md text-[10px] font-semibold border-none">
                    {dest.country}
                  </Badge>
                  {dest.iata_gateway && (
                    <Badge variant="outline" className="bg-black/60 text-white font-mono text-[10px] border-white/20">
                      IATA: {dest.iata_gateway}
                    </Badge>
                  )}
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-base font-bold drop-shadow-sm truncate">{dest.name}</h4>
                  <p className="text-xs text-white/80 truncate">{dest.region || dest.country}</p>
                </div>
              </div>

              {/* Detalhes do Destino */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2 text-xs">
                  {dest.description && (
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">{dest.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-muted-foreground">
                    {dest.best_season && (
                      <span className="flex items-center gap-1">
                        <Sun className="size-3 text-amber-500" />
                        <span>Temporada: {dest.best_season}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1 font-mono text-[11px]">
                      <Hotel className="size-3 text-primary" />
                      <span>{dest.hotels_count || 0} hotéis</span>
                    </span>
                  </div>
                </div>

                {/* Ações */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(dest)}
                    className="rounded-xl text-xs gap-1.5 h-8"
                  >
                    <Edit2 className="size-3.5" />
                    <span>Editar</span>
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Deseja remover o destino "${dest.name}"?`)) {
                        deleteMut.mutate(dest.id);
                      }
                    }}
                    className="size-8 text-destructive hover:bg-destructive/10 rounded-xl"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet de Cadastro / Edição */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingDestination ? "Editar Destino" : "Novo Destino Turístico"}</SheetTitle>
            <SheetDescription>
              Cadastre as informações e fotos de capa do destino para reutilizar em múltiplos pacotes e propostas.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Nome do Destino *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Ilhéus, Gramado, Maceió, Cancún"
                className="h-10 rounded-xl bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Estado / Região</Label>
                <Input
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  placeholder="Ex: Bahia, Serra Gaúcha"
                  className="h-10 rounded-xl bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">País</Label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Brasil"
                  className="h-10 rounded-xl bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Código IATA Aeroporto</Label>
                <Input
                  value={formData.iata_gateway}
                  onChange={(e) => setFormData({ ...formData, iata_gateway: e.target.value.toUpperCase() })}
                  placeholder="Ex: IOS, POA, MCZ"
                  className="h-10 rounded-xl bg-background font-mono uppercase"
                  maxLength={4}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Melhor Temporada</Label>
                <Input
                  value={formData.best_season}
                  onChange={(e) => setFormData({ ...formData, best_season: e.target.value })}
                  placeholder="Ex: Set a Março, Ano todo"
                  className="h-10 rounded-xl bg-background"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Foto de Capa do Destino</Label>
              <ImageUpload
                value={formData.cover_image_url}
                onChange={(url) => setFormData({ ...formData, cover_image_url: url })}
                onRemove={() => setFormData({ ...formData, cover_image_url: "" })}
                bucket="cms-media"
                aspectPreset="widescreen"
                helperText="Envie a foto de capa panorâmica do destino turístico (16:9)"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Resumo / Descrição Turística</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Pontos fortes do destino, clima, cultura e atrativos principais..."
                className="rounded-xl bg-background"
              />
            </div>

            <SheetFooter className="pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSheetOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMut.isPending || updateMut.isPending}
                className="rounded-xl font-bold bg-primary text-primary-foreground"
              >
                {editingDestination ? "Salvar Alterações" : "Cadastrar Destino"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
