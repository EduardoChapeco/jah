import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Search,
  Calendar,
  Store,
  Sparkles,
  Phone,
  ArrowRight,
  X,
  Plus,
  Navigation,
  Utensils,
  Radio,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMomentsMap } from "@/services/social.functions";
import { formatRelativeTime } from "@/lib/datetime";
import { MapLibreCanvas, type MapMarkerItem } from "@/components/mobility/maplibre-canvas";

export const Route = createFileRoute("/_store/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa Urbano & Moments — JAH" },
      {
        name: "description",
        content: "Explore locais, momentos, eventos e pontos gastronômicos da comunidade no mapa.",
      },
    ],
  }),
  loader: async () => {
    const data = await getMomentsMap({ data: {} }).catch(() => ({
      moments: [],
      places: [],
      events: [],
    }));
    return { mapData: data };
  },
  component: MapaPage,
});

const CATEGORY_CHIPS = [
  { id: "all", label: "Todos" },
  { id: "moments", label: "Moments" },
  { id: "places", label: "Locais & Lojas" },
  { id: "events", label: "Eventos & Shows" },
  { id: "food", label: "Gastronomia" },
  { id: "live", label: "Ao Vivo Agora" },
];

function MapaPage() {
  const { mapData: initialMapData } = Route.useLoaderData();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

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
    if (activeCategory === "places" || activeCategory === "events" || activeCategory === "food") return false;
    if (searchQuery && !m.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !m.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredPlaces = places.filter((p: any) => {
    if (activeCategory === "moments" || activeCategory === "events") return false;
    if (activeCategory === "food" && !p.category?.toLowerCase().includes("food") && !p.category?.toLowerCase().includes("restaurante") && !p.category?.toLowerCase().includes("bar")) return false;
    if (searchQuery && !p.title?.toLowerCase().includes(searchQuery.toLowerCase()) && !p.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const filteredEvents = events.filter((e: any) => {
    if (activeCategory === "moments" || activeCategory === "places" || activeCategory === "food") return false;
    if (searchQuery && !e.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const allFilteredItems = useMemo(
    () => [...filteredMoments, ...filteredPlaces, ...filteredEvents],
    [filteredMoments, filteredPlaces, filteredEvents],
  );

  // Mapeia itens para o formato do MapLibreCanvas
  const mapMarkers: MapMarkerItem[] = useMemo(() => {
    return allFilteredItems
      .filter((item) => item.lat && item.lng)
      .map((item) => ({
        id: item.id,
        lat: item.lat,
        lng: item.lng,
        title: item.title,
        kind: item.kind,
        avatar_url: (item as any).avatar_url,
        image_url: (item as any).image_url,
      }));
  }, [allFilteredItems]);

  const selectedItem = allFilteredItems.find((i) => i.id === selectedItemId) || null;

  const handleMarkerClick = (marker: MapMarkerItem) => {
    setSelectedItemId(marker.id);
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-background overflow-hidden flex flex-col md:flex-row">
      {/* ── 1. MAPA FULLSCREEN MAPLIBRE ─────────────────────────────── */}
      <div className="relative flex-1 w-full h-full">
        <MapLibreCanvas
          markers={mapMarkers}
          selectedMarkerId={selectedItemId}
          onMarkerClick={handleMarkerClick}
          className="w-full h-full"
        />

        {/* Floating Counter Badge */}
        <div className="absolute top-4 right-4 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-card border border-border text-foreground shadow-xs text-xs font-medium">
          <MapPin className="size-3.5 text-muted-foreground" />
          <span>{allFilteredItems.length} pontos no mapa</span>
        </div>
      </div>

      {/* ── 2. PAINEL FLUTUANTE DE EXPLORAÇÃO (PADRÃO MOBILIDADE ULTRA CLEAN) ── */}
      <div className="relative md:absolute md:top-4 md:left-4 z-30 w-full md:w-[400px] max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-none rounded-2xl border border-border bg-card/95 backdrop-blur-md p-5 text-foreground shadow-xs space-y-4">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h1 className="text-base font-semibold text-foreground tracking-tight">
              Mapa Urbano & Moments
            </h1>
            <p className="text-xs text-muted-foreground">
              Explore pontos de interesse e a cena local
            </p>
          </div>

          <Badge variant="secondary" className="text-xs font-mono">
            {allFilteredItems.length}
          </Badge>
        </div>

        {/* ── BUSCA DE LOCAIS & MOMENTOS ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar momentos, locais, shows..."
            className="pl-9 h-10 rounded-xl bg-background border-border text-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Limpar busca"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* ── CATEGORIAS COM SCROLL INVISÍVEL (SCROLLBAR-NONE — SQUIRCLE) ── */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_CHIPS.map((chip) => {
            const isSelected = activeCategory === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveCategory(chip.id)}
                className={`h-9.5 px-4 rounded-xl text-xs font-semibold shrink-0 transition-all border cursor-pointer flex items-center justify-center ${
                  isSelected
                    ? "bg-foreground text-background border-foreground font-semibold shadow-xs"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/70"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* ── DETALHE DO ITEM SELECIONADO (DRAWER/PREVIEW) ── */}
        {selectedItem && (
          <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-3 animate-in fade-in-50 duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {(selectedItem as any).image_url || (selectedItem as any).avatar_url ? (
                  <img
                    src={(selectedItem as any).image_url || (selectedItem as any).avatar_url}
                    alt={selectedItem.title}
                    className="size-11 rounded-lg object-cover bg-background border border-border"
                  />
                ) : (
                  <div className="size-11 rounded-lg bg-background border border-border flex items-center justify-center text-foreground">
                    {selectedItem.kind === "event" ? (
                      <Calendar className="size-5" />
                    ) : selectedItem.kind === "place" ? (
                      <Store className="size-5" />
                    ) : (
                      <Sparkles className="size-5" />
                    )}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0 h-4">
                      {selectedItem.kind === "moment"
                        ? "Momento"
                        : selectedItem.kind === "place"
                          ? "Local"
                          : "Evento"}
                    </Badge>
                    {(selectedItem as any).created_at && (
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime((selectedItem as any).created_at)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-foreground mt-0.5">{selectedItem.title}</h3>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedItemId(null)}
                className="size-6 rounded-md text-muted-foreground hover:text-foreground"
                aria-label="Fechar detalhes"
              >
                <X className="size-3.5" />
              </Button>
            </div>

            {selectedItem.subtitle && (
              <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                {selectedItem.subtitle}
              </p>
            )}

            {(selectedItem as any).phone && (
              <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3" />
                  {(selectedItem as any).phone}
                </span>
                <a
                  href={`https://wa.me/55${(selectedItem as any).phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-foreground hover:underline"
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>
        )}

        {/* ── LISTAGEM DE PONTOS FILTRADOS ── */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-medium text-muted-foreground block">
            Pontos de Interesse ({allFilteredItems.length})
          </span>

          {allFilteredItems.length === 0 ? (
            <div className="py-8 text-center space-y-1.5 bg-muted/20 rounded-xl border border-dashed border-border p-4">
              <MapPin className="size-6 text-muted-foreground/50 mx-auto" />
              <p className="text-xs font-medium text-foreground">Nenhum ponto encontrado</p>
              <p className="text-[11px] text-muted-foreground">
                Tente ajustar os filtros ou a busca.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[320px] overflow-y-auto scrollbar-none pr-0.5">
              {allFilteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={`${item.kind}-${item.id}`}
                    type="button"
                    onClick={() => setSelectedItemId(item.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-muted border-foreground/30 text-foreground"
                        : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted/40"
                    }`}
                  >
                    {(item as any).image_url || (item as any).avatar_url ? (
                      <img
                        src={(item as any).image_url || (item as any).avatar_url}
                        alt={item.title}
                        className="size-9 rounded-lg object-cover shrink-0 bg-muted"
                      />
                    ) : (
                      <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-foreground">
                        {item.kind === "event" ? (
                          <Calendar className="size-4" />
                        ) : item.kind === "place" ? (
                          <Store className="size-4" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] uppercase font-mono px-1 py-0 h-3.5">
                          {item.kind === "moment" ? "Momento" : item.kind === "place" ? "Local" : "Evento"}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate mt-0.5">{item.title}</p>
                      {item.subtitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{item.subtitle}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
