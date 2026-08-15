import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Search,
  Navigation,
  Calendar,
  Store,
  Sparkles,
  Phone,
  ArrowRight,
  X,
  ExternalLink,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMomentsMap } from "@/services/social.functions";
import { formatRelativeTime } from "@/lib/datetime";

export const Route = createFileRoute("/_store/mapa")({
  head: () => ({ meta: [{ title: "Mapa Social & Moments — JAH" }] }),
  loader: async () => {
    const data = await getMomentsMap({ data: {} });
    return { mapData: data };
  },
  component: MapaPage,
});

const CATEGORY_CHIPS = [
  { id: "all", label: "Todos" },
  { id: "moments", label: "Moments" },
  { id: "places", label: "Locais & Lojas" },
  { id: "events", label: "Eventos" },
  { id: "food", label: "Restaurantes & Bares" },
  { id: "live", label: "Ao Vivo Agora" },
];

function MapaPage() {
  const { mapData: initialMapData } = Route.useLoaderData();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const { data: mapData } = useQuery({
    queryKey: ["moments-map", activeCategory],
    queryFn: () => getMomentsMap({ data: {} }),
    initialData: initialMapData,
    staleTime: 60_000,
  });

  const moments = mapData?.moments || [];
  const places = mapData?.places || [];
  const events = mapData?.events || [];

  // Filtra itens com base na categoria e busca
  const filteredMoments = moments.filter((m: any) => {
    if (activeCategory === "places" || activeCategory === "events") return false;
    if (searchQuery && !m.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredPlaces = places.filter((p: any) => {
    if (activeCategory === "moments" || activeCategory === "events") return false;
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredEvents = events.filter((e: any) => {
    if (activeCategory === "moments" || activeCategory === "places") return false;
    if (searchQuery && !e.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const allFilteredItems = [...filteredMoments, ...filteredPlaces, ...filteredEvents];

  return (
    <div className="relative w-full h-[calc(100vh-5rem)] bg-background flex flex-col md:flex-row overflow-hidden">
      {/* ── Desktop Side Panel (Lista + Descoberta) ───────────────── */}
      <aside className="hidden lg:flex flex-col w-[380px] shrink-0 border-r border-border bg-card z-20 h-full overflow-y-auto">
        <div className="p-4 border-b border-border space-y-3 sticky top-0 bg-card/95 backdrop-blur z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <h1 className="text-base font-bold text-foreground">Mapa da Cidade</h1>
            </div>
            <Badge variant="secondary" className="text-xs font-semibold">
              {allFilteredItems.length} pontos
            </Badge>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar momentos, locais, shows..."
              className="pl-9 h-9 rounded-xl bg-background text-xs"
            />
          </div>

          {/* Chips de filtro */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveCategory(chip.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                  activeCategory === chip.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Itens do Mapa */}
        <div className="p-3 space-y-2.5 flex-1">
          {allFilteredItems.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={() => setSelectedItem(item)}
              className={`w-full p-3 rounded-xl border text-left transition-all flex gap-3 items-center ${
                selectedItem?.id === item.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-background hover:border-border/80"
              }`}
            >
              {(item as any).image_url || (item as any).avatar_url ? (
                <img
                  src={(item as any).image_url || (item as any).avatar_url}
                  alt={item.title}
                  className="size-12 rounded-lg object-cover shrink-0 bg-muted"
                />
              ) : (
                <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  {item.kind === "event" ? (
                    <Calendar className="size-5" />
                  ) : item.kind === "place" ? (
                    <Store className="size-5" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1 py-0 uppercase font-semibold h-4"
                  >
                    {item.kind === "moment"
                      ? "Momento"
                      : item.kind === "place"
                        ? "Local"
                        : "Evento"}
                  </Badge>
                  {item.kind === "moment" && item.created_at && (
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Interactive Map Canvas ────────────────────────────────── */}
      <main className="relative flex-1 h-full w-full bg-[#1e232a] overflow-hidden flex items-center justify-center">
        {/* Floating Mobile Top Filter Bar */}
        <div className="absolute top-4 left-4 right-4 lg:hidden z-30 space-y-2">
          <div className="relative shadow-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar momentos, locais, shows..."
              className="pl-9 h-11 rounded-2xl bg-card/95 backdrop-blur text-xs shadow-xs border-border"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORY_CHIPS.map((chip) => (
              <button
                key={chip.id}
                onClick={() => setActiveCategory(chip.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium shrink-0 shadow-xs transition-colors ${
                  activeCategory === chip.id
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-card/90 backdrop-blur text-foreground hover:bg-card border border-border/40"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Grid Pattern / Stylized Map Background */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] [background-size:24px_24px]" />

        {/* Interactive Custom Pins on the Map */}
        <div className="relative w-full h-full max-w-4xl max-h-[800px] p-8 flex flex-wrap items-center justify-around gap-12 z-10">
          {allFilteredItems.slice(0, 15).map((item, index) => {
            const isSelected = selectedItem?.id === item.id;
            return (
              <button
                key={`${item.kind}-${item.id}`}
                onClick={() => setSelectedItem(item)}
                className={`group relative flex flex-col items-center transition-all duration-300 focus:outline-none ${
                  isSelected ? "scale-125 z-40" : "hover:scale-110 z-20"
                }`}
              >
                {/* Pin Card Style */}
                {item.kind === "moment" && item.image_url ? (
                  <div className="relative p-1 rounded-2xl bg-card border-2 border-primary shadow-xs">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="size-12 rounded-xl object-cover"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-2 bg-primary rotate-45" />
                  </div>
                ) : item.kind === "place" ? (
                  <div className="relative size-12 rounded-2xl bg-foreground text-background flex items-center justify-center border-2 border-background shadow-xs">
                    {item.avatar_url ? (
                      <img
                        src={item.avatar_url}
                        alt={item.title}
                        className="size-full rounded-2xl object-cover"
                      />
                    ) : (
                      <Store className="size-6 text-primary" />
                    )}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-2 bg-foreground rotate-45" />
                  </div>
                ) : (
                  <div className="relative size-12 rounded-2xl bg-primary text-primary-foreground flex flex-col items-center justify-center border-2 border-white shadow-xs">
                    <Calendar className="size-5 mb-0.5" />
                    <span className="text-[8px] font-bold uppercase">Show</span>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 size-2 bg-primary rotate-45" />
                  </div>
                )}

                {/* Floating Pin Label */}
                <div className="mt-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur text-white text-[10px] font-semibold whitespace-nowrap shadow-xs max-w-[120px] truncate">
                  {item.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Contextual Detail Bottom Sheet / Card on Tap ────────── */}
        {selectedItem && (
          <div className="absolute bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 bg-card rounded-2xl border border-border shadow-xs p-4 animate-in slide-in-from-bottom-5">
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-3 right-3 size-7 rounded-full bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center"
              aria-label="Fechar detalhe"
            >
              <X className="size-4" />
            </button>

            {/* Imagem de Capa do Item */}
            {selectedItem.image_url && (
              <div className="aspect-video w-full rounded-xl overflow-hidden mb-3 bg-muted">
                <img
                  src={selectedItem.image_url}
                  alt={selectedItem.title}
                  className="size-full object-cover"
                />
              </div>
            )}

            <div className="space-y-1 mb-3">
              <Badge
                variant="secondary"
                className="text-[10px] uppercase font-bold px-1.5 py-0 h-4"
              >
                {selectedItem.kind === "moment"
                  ? "Momento ao Vivo"
                  : selectedItem.kind === "place"
                    ? "Negócio Local"
                    : "Evento Cultural"}
              </Badge>
              <h3 className="text-base font-bold text-foreground leading-tight">
                {selectedItem.title}
              </h3>
              <p className="text-xs text-muted-foreground">{selectedItem.subtitle}</p>
            </div>

            {/* Ações contextuais */}
            <div className="flex gap-2 pt-2 border-t border-border">
              {selectedItem.kind === "event" ? (
                <Button asChild size="sm" className="w-full rounded-xl font-semibold text-xs">
                  <Link to="/agenda">Garantir Ingressos</Link>
                </Button>
              ) : selectedItem.kind === "place" ? (
                <>
                  <Button asChild size="sm" className="flex-1 rounded-xl font-semibold text-xs">
                    <Link to="/diretorio">Ver Perfil</Link>
                  </Button>
                  {selectedItem.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl px-3"
                      onClick={() =>
                        window.open(
                          `https://wa.me/${selectedItem.phone.replace(/\D/g, "")}`,
                          "_blank",
                        )
                      }
                    >
                      <Phone className="size-3.5" />
                    </Button>
                  )}
                </>
              ) : (
                <Button asChild size="sm" className="w-full rounded-xl font-semibold text-xs">
                  <Link to="/">Ver Publicação no Mural</Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
