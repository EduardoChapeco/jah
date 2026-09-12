import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Plus, Trash2, Save, MapPin } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DeliveryZone {
  id: string;
  name: string;
  price: number;
  minTime: number;
  maxTime: number;
  isActive: boolean;
}

const DEFAULT_ZONES: DeliveryZone[] = [
  { id: "1", name: "0-5 km", price: 5.9, minTime: 30, maxTime: 45, isActive: true },
  { id: "2", name: "5-10 km", price: 9.9, minTime: 45, maxTime: 60, isActive: true },
];

export function DeliveryAreaSection() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [areaMode, setAreaMode] = useState<"radius" | "neighborhoods" | "polygon">("radius");
  const [radius, setRadius] = useState([10]);
  const [zones, setZones] = useState<DeliveryZone[]>(DEFAULT_ZONES);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [neighborhoodInput, setNeighborhoodInput] = useState("");

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    import("mapbox-gl").then((mapboxgl) => {
      if (cancelled || !mapContainer.current) return;

      const token = import.meta.env.VITE_MAPBOX_TOKEN;
      if (!token) return;

      (mapboxgl as any).accessToken = token;
      const map = new (mapboxgl as any).Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: [-43.1729, -22.9068] as [number, number],
        zoom: 12,
      });

      map.addControl(new (mapboxgl as any).NavigationControl(), "top-right");
      map.on("load", () => setMapLoaded(true));
      mapRef.current = map;
    }).catch(() => { /* mapbox not available */ });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const addNeighborhood = useCallback(() => {
    const trimmed = neighborhoodInput.trim();
    if (!trimmed || neighborhoods.includes(trimmed)) return;
    setNeighborhoods((prev) => [...prev, trimmed]);
    setNeighborhoodInput("");
  }, [neighborhoodInput, neighborhoods]);

  const removeNeighborhood = (n: string) =>
    setNeighborhoods((prev) => prev.filter((x) => x !== n));

  const addZone = () => {
    const id = Math.random().toString(36).substring(2, 8);
    setZones((prev) => [
      ...prev,
      { id, name: "", price: 0, minTime: 30, maxTime: 60, isActive: true },
    ]);
  };

  const removeZone = (id: string) =>
    setZones((prev) => prev.filter((z) => z.id !== id));

  const updateZone = (id: string, field: keyof DeliveryZone, value: any) =>
    setZones((prev) =>
      prev.map((z) => (z.id === id ? { ...z, [field]: value } : z))
    );

  const handleSave = () => {
    toast.success("Configuração de área de entrega salva!");
  };

  const hasMapboxToken = !!import.meta.env.VITE_MAPBOX_TOKEN;

  return (
    <div className="space-y-6">
      <h3 className="font-semibold">Área de Entrega</h3>

      <div className="grid lg:grid-cols-[400px_1fr] gap-6">
        {/* Left panel — config */}
        <div className="space-y-5">
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Como definir minha área?
            </Label>
            <RadioGroup value={areaMode} onValueChange={(v) => setAreaMode(v as any)} className="space-y-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="radius" id="mode-radius" />
                <Label htmlFor="mode-radius" className="text-sm">Por raio (km do centro)</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="neighborhoods" id="mode-neighborhoods" />
                <Label htmlFor="mode-neighborhoods" className="text-sm">Por bairros</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="polygon" id="mode-polygon" />
                <Label htmlFor="mode-polygon" className="text-sm">Por polígono (livre)</Label>
              </div>
            </RadioGroup>
          </div>

          {areaMode === "radius" && (
            <div className="space-y-2">
              <Label className="text-sm">Raio: {radius[0]} km</Label>
              <Slider
                value={radius}
                onValueChange={setRadius}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>
          )}

          {areaMode === "neighborhoods" && (
            <div className="space-y-2">
              <Label className="text-sm">Adicionar bairro</Label>
              <div className="flex gap-2">
                <Input
                  value={neighborhoodInput}
                  onChange={(e) => setNeighborhoodInput(e.target.value)}
                  placeholder="Nome do bairro"
                  onKeyDown={(e) => e.key === "Enter" && addNeighborhood()}
                  className="flex-1"
                />
                <Button size="sm" onClick={addNeighborhood}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-1 flex-wrap">
                {neighborhoods.map((n) => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={() => removeNeighborhood(n)}
                  >
                    {n} ×
                  </span>
                ))}
              </div>
            </div>
          )}

          {areaMode === "polygon" && (
            <p className="text-sm text-muted-foreground">
              Clique no mapa para desenhar a área de entrega.
            </p>
          )}

          {/* Zones table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Taxas e prazos por zona</Label>
              <Button size="sm" variant="outline" onClick={addZone}>
                <Plus className="h-3 w-3 mr-1" /> Zona
              </Button>
            </div>

            {zones.map((z) => (
              <Card key={z.id} className={cn(!z.isActive && "opacity-60")}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Input
                      value={z.name}
                      onChange={(e) => updateZone(z.id, "name", e.target.value)}
                      placeholder="Ex: 0-5 km"
                      className="h-8 text-sm w-32"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={z.isActive}
                        onCheckedChange={(v) => updateZone(z.id, "isActive", v)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeZone(z.id)}
                      >
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Preço (R$)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={z.price}
                        onChange={(e) => updateZone(z.id, "price", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Mín. (min)</Label>
                      <Input
                        type="number"
                        value={z.minTime}
                        onChange={(e) => updateZone(z.id, "minTime", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Máx. (min)</Label>
                      <Input
                        type="number"
                        value={z.maxTime}
                        onChange={(e) => updateZone(z.id, "maxTime", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button onClick={handleSave} className="w-full">
            <Save className="h-4 w-4 mr-1" /> Salvar Configuração
          </Button>
        </div>

        {/* Right panel — map */}
        <div className="min-h-[400px] lg:min-h-0 rounded-lg overflow-hidden border bg-muted relative">
          {hasMapboxToken ? (
            <div ref={mapContainer} className="absolute inset-0" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-2 p-6">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Mapa interativo</p>
                <p className="text-xs text-muted-foreground">
                  Configure o token do Mapbox para habilitar o mapa de área de entrega.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
