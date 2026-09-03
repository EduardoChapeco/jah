import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Hotel,
  Plus,
  Search,
  Star,
  MapPin,
  Utensils,
  Phone,
  Globe,
  Camera,
  Edit2,
  Trash2,
  Check,
  Building,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  listHotelsBank,
  createHotel,
  updateHotel,
  deleteHotel,
  listDestinations,
  type HotelBankDTO,
  type DestinationDTO,
} from "@/services/travel-catalog.functions";

export const Route = createFileRoute("/workspace/turismo/hoteis")({
  head: () => ({ meta: [{ title: "Banco de Hotéis & Resorts | Workspace Wider" }] }),
  loader: async () => {
    const [hotels, destinations] = await Promise.all([
      listHotelsBank().catch(() => []),
      listDestinations().catch(() => []),
    ]);
    return { hotels: hotels || [], destinations: destinations || [] };
  },
  component: WorkspaceHotelsPage,
});

function WorkspaceHotelsPage() {
  const { hotels: initialHotels, destinations = [] } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<string>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<HotelBankDTO | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    destination_id: "",
    city: "",
    state: "",
    country: "Brasil",
    stars: 4,
    regime_options: ["All Inclusive"],
    description: "",
    cover_photo_url: "",
    website: "",
    phone: "",
    internal_rating: 4.8,
    badges: ["Eco-friendly", "Pé na Areia"],
    bio_bullets: [
      "🌴 Paraíso ecológico beira-mar integrado à natureza",
      "🍹 All Inclusive: todas as refeições, snacks e bebidas inclusas",
      "🛏️ Acomodação Deluxe Casal",
    ],
  });

  const [newBadge, setNewBadge] = useState("");
  const [newBullet, setNewBullet] = useState("");

  const { data: hotels = initialHotels, refetch } = useQuery({
    queryKey: ["workspace_hotels_bank", selectedDestination],
    queryFn: () =>
      listHotelsBank({
        destination_id: selectedDestination === "all" ? undefined : selectedDestination,
      }),
    initialData: initialHotels,
  });

  const createMut = useMutation({
    mutationFn: (payload: any) => createHotel({ data: payload }),
    onSuccess: () => {
      toast.success("Hotel cadastrado com sucesso!");
      setIsSheetOpen(false);
      resetForm();
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao salvar hotel."),
  });

  const updateMut = useMutation({
    mutationFn: (payload: any) => updateHotel({ data: payload }),
    onSuccess: () => {
      toast.success("Hotel atualizado com sucesso!");
      setIsSheetOpen(false);
      resetForm();
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao atualizar hotel."),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteHotel({ data: { id } }),
    onSuccess: () => {
      toast.success("Hotel removido.");
      refetch();
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao remover hotel."),
  });

  const resetForm = () => {
    setEditingHotel(null);
    setFormData({
      name: "",
      destination_id: "",
      city: "",
      state: "",
      country: "Brasil",
      stars: 4,
      regime_options: ["All Inclusive"],
      description: "",
      cover_photo_url: "",
      website: "",
      phone: "",
      internal_rating: 4.8,
      badges: ["Eco-friendly", "Pé na Areia"],
      bio_bullets: [
        "🌴 Paraíso ecológico beira-mar integrado à natureza",
        "🍹 All Inclusive: todas as refeições, snacks e bebidas inclusas",
        "🛏️ Acomodação Deluxe Casal",
      ],
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsSheetOpen(true);
  };

  const handleOpenEdit = (hotel: HotelBankDTO) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      destination_id: hotel.destination_id || "",
      city: hotel.city,
      state: hotel.state || "",
      country: hotel.country || "Brasil",
      stars: hotel.stars || 4,
      regime_options: hotel.regime_options || ["All Inclusive"],
      description: hotel.description || "",
      cover_photo_url: hotel.cover_photo_url || "",
      website: hotel.website || "",
      phone: hotel.phone || "",
      internal_rating: hotel.internal_rating || 4.8,
      badges: hotel.badges || ["Eco-friendly", "Pé na Areia"],
      bio_bullets: hotel.bio_bullets || [],
    });
    setIsSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim()) {
      toast.error("Nome e cidade do hotel são obrigatórios.");
      return;
    }

    const payload = {
      ...formData,
      destination_id: formData.destination_id || undefined,
    };

    if (editingHotel) {
      updateMut.mutate({ id: editingHotel.id, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const addBadge = () => {
    if (!newBadge.trim()) return;
    if (!formData.badges.includes(newBadge.trim())) {
      setFormData({ ...formData, badges: [...formData.badges, newBadge.trim()] });
    }
    setNewBadge("");
  };

  const removeBadge = (idx: number) => {
    setFormData({ ...formData, badges: formData.badges.filter((_, i) => i !== idx) });
  };

  const addBullet = () => {
    if (!newBullet.trim()) return;
    setFormData({ ...formData, bio_bullets: [...formData.bio_bullets, newBullet.trim()] });
    setNewBullet("");
  };

  const removeBullet = (idx: number) => {
    setFormData({ ...formData, bio_bullets: formData.bio_bullets.filter((_, i) => i !== idx) });
  };

  const filtered = hotels.filter((h: HotelBankDTO) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      h.name.toLowerCase().includes(term) ||
      h.city.toLowerCase().includes(term) ||
      h.state?.toLowerCase().includes(term) ||
      h.destination_name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        eyebrow="Turismo & Hotelaria"
        title="Banco de Hotéis & Resorts"
        actions={
          <Button
            onClick={handleOpenCreate}
            size="sm"
            className="rounded-xl font-semibold gap-1.5 bg-primary text-primary-foreground h-9 px-4 cursor-pointer shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Novo Hotel / Resort</span>
          </Button>
        }
      />

      {/* Filtros de Busca & Destino */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por hotel, cidade ou estado..."
            className="pl-10 h-10 rounded-xl bg-card text-xs border-border/70 w-full"
          />
        </div>

        {destinations.length > 0 && (
          <div className="w-full sm:w-64">
            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
              <SelectTrigger className="h-10 rounded-xl bg-card text-xs border-border/70">
                <SelectValue placeholder="Filtrar por Destino" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Destinos</SelectItem>
                {destinations.map((d: DestinationDTO) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} ({d.region || d.country})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Badge variant="outline" className="h-10 px-3 rounded-xl font-mono text-xs border-border/70 shrink-0">
          {filtered.length} {filtered.length === 1 ? "hotel" : "hotéis"}
        </Badge>
      </div>

      {/* Grid de Hotéis */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-card border border-border/60 space-y-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Hotel className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Nenhum hotel no banco</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Cadastre os resorts e hotéis parceiros da sua agência com fotos e regimes para conectá-los instantaneamente a pacotes.
          </p>
          <Button onClick={handleOpenCreate} size="sm" variant="outline" className="rounded-xl mt-2">
            + Cadastrar Primeiro Hotel
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((hotel: HotelBankDTO) => (
            <div
              key={hotel.id}
              className="bg-card rounded-2xl overflow-hidden border border-border/70 hover:border-primary/40 transition-all group flex flex-col shadow-2xs"
            >
              {/* Foto de Capa & Estrelas */}
              <div className="relative aspect-[16/9] w-full bg-muted/30 overflow-hidden">
                {hotel.cover_photo_url ? (
                  <img
                    src={hotel.cover_photo_url}
                    alt={hotel.name}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="size-full flex flex-col items-center justify-center text-muted-foreground/40 gap-1.5">
                    <Camera className="size-8 stroke-[1.2]" />
                    <span className="text-[10px]">Sem foto de capa</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                {/* Badges de Estrelas & Avaliação */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-amber-400 text-xs">
                    {Array.from({ length: hotel.stars || 4 }).map((_, i) => (
                      <Star key={i} className="size-3 fill-amber-400" />
                    ))}
                  </div>
                  <Badge className="bg-emerald-600 text-white font-semibold text-[10px] border-none">
                    ★ {hotel.internal_rating || 4.8}
                  </Badge>
                </div>

                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h4 className="text-base font-bold drop-shadow-sm truncate">{hotel.name}</h4>
                  <p className="text-xs text-white/80 truncate flex items-center gap-1">
                    <MapPin className="size-3" />
                    <span>
                      {hotel.city}, {hotel.state || hotel.country}
                    </span>
                    {hotel.destination_name && <span>• ({hotel.destination_name})</span>}
                  </p>
                </div>
              </div>

              {/* Informações Comerciais */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2 text-xs">
                  {/* Regimes de Refeição */}
                  <div className="flex flex-wrap gap-1.5">
                    {hotel.regime_options.map((regime, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-semibold"
                      >
                        {regime}
                      </span>
                    ))}
                  </div>

                  {/* Badges (Eco-friendly, etc.) */}
                  {hotel.badges && hotel.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {hotel.badges.map((b, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] border border-border/50"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Bullets de Destaque */}
                  {hotel.bio_bullets && hotel.bio_bullets.length > 0 && (
                    <div className="space-y-1 pt-1 text-[11px] text-muted-foreground">
                      {hotel.bio_bullets.slice(0, 2).map((bullet, i) => (
                        <p key={i} className="truncate">
                          {bullet}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenEdit(hotel)}
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
                      if (confirm(`Deseja remover o hotel "${hotel.name}" do banco?`)) {
                        deleteMut.mutate(hotel.id);
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
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingHotel ? "Editar Hotel / Resort" : "Novo Hotel no Banco"}</SheetTitle>
            <SheetDescription>
              Salve as informações, comodidades e fotos para auto-preencher pacotes e roteiros com 1 clique.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Nome do Hotel / Resort *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Resort Tororomba, Hotel Fasano"
                className="h-10 rounded-xl bg-background"
                required
              />
            </div>

            {destinations.length > 0 && (
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Destino Vinculado</Label>
                <Select
                  value={formData.destination_id}
                  onValueChange={(val) => setFormData({ ...formData, destination_id: val })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue placeholder="Selecione um destino..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum (Avulso)</SelectItem>
                    {destinations.map((d: DestinationDTO) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name} ({d.region || d.country})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Cidade *</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ex: Ilhéus, Maceió"
                  className="h-10 rounded-xl bg-background"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Estado</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Ex: Bahia, Alagoas"
                  className="h-10 rounded-xl bg-background"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Classificação (Estrelas)</Label>
                <Select
                  value={String(formData.stars)}
                  onValueChange={(val) => setFormData({ ...formData, stars: Number(val) })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">★★★★★ 5 Estrelas (Luxo)</SelectItem>
                    <SelectItem value="4">★★★★☆ 4 Estrelas (Superior)</SelectItem>
                    <SelectItem value="3">★★★☆☆ 3 Estrelas (Conforto)</SelectItem>
                    <SelectItem value="2">★★☆☆☆ 2 Estrelas (Padrão)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold text-foreground">Regime Principal</Label>
                <Select
                  value={formData.regime_options[0] || "All Inclusive"}
                  onValueChange={(val) => setFormData({ ...formData, regime_options: [val] })}
                >
                  <SelectTrigger className="h-10 rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Inclusive">🍹 All Inclusive</SelectItem>
                    <SelectItem value="Pensão Completa">🍽️ Pensão Completa</SelectItem>
                    <SelectItem value="Meia Pensão">☕ Meia Pensão</SelectItem>
                    <SelectItem value="Café da Manhã">🥐 Café da Manhã</SelectItem>
                    <SelectItem value="Sem Refeições">🏨 Apenas Hospedagem</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Foto de Capa do Hotel / Resort</Label>
              <ImageUpload
                value={formData.cover_photo_url}
                onChange={(url) => setFormData({ ...formData, cover_photo_url: url })}
                onRemove={() => setFormData({ ...formData, cover_photo_url: "" })}
                bucket="cms-media"
                aspectPreset="widescreen"
                helperText="Envie a foto de destaque do hotel ou resort parceiro (16:9)"
              />
            </div>

            {/* Badges / Selos */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Badges do Hotel</Label>
              <div className="flex flex-wrap gap-1.5">
                {formData.badges.map((b, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs bg-muted text-foreground border border-border/60"
                  >
                    <span>{b}</span>
                    <button
                      type="button"
                      onClick={() => removeBadge(idx)}
                      className="size-3.5 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBadge())}
                  placeholder="Novo selo (ex: Spa, Piscina Aquecida)..."
                  className="h-9 rounded-xl text-xs bg-background flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={addBadge} className="rounded-xl h-9">
                  +
                </Button>
              </div>
            </div>

            {/* Bullets da Bio */}
            <div className="space-y-2">
              <Label className="font-semibold text-foreground">Destaques da Bio (Resumo Editorial)</Label>
              <div className="space-y-1.5">
                {formData.bio_bullets.map((bullet, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 text-xs">
                    <span className="flex-1 text-foreground">{bullet}</span>
                    <button
                      type="button"
                      onClick={() => removeBullet(idx)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={newBullet}
                  onChange={(e) => setNewBullet(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBullet())}
                  placeholder="Ex: 🌴 Piscinas naturais com bar molhado..."
                  className="h-9 rounded-xl text-xs bg-background flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={addBullet} className="rounded-xl h-9">
                  +
                </Button>
              </div>
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
                {editingHotel ? "Salvar Alterações" : "Salvar Hotel no Banco"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
