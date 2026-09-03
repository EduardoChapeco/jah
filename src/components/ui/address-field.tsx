import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { MapPin, Search, Loader2 } from "lucide-react";
import type { Map, Marker } from "maplibre-gl";
import { getCanonicalMapStyle, setupMapResizeObserver } from "@/lib/map-styles";

export interface AddressData {
  text: string;
  lat?: number;
  lng?: number;
}

export interface AddressFieldProps {
  value?: AddressData;
  onChange?: (val: AddressData) => void;
}

export const AddressField: React.FC<AddressFieldProps> = ({ value, onChange }) => {
  const [query, setQuery] = useState(value?.text || "");
  const [loading, setLoading] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Marker | null>(null);

  // Inicializa o mapa dinamicamente uma única vez se houver container no browser
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    let isMounted = true;
    let cleanupResize: (() => void) | undefined;

    import("maplibre-gl").then((maplibreglModule) => {
      if (!isMounted || !mapContainer.current || map.current) return;
      const maplibregl = maplibreglModule.default || maplibreglModule;

      const initialLat = value?.lat || -23.5505; // São Paulo default
      const initialLng = value?.lng || -46.6333;

      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: getCanonicalMapStyle(),
        center: [initialLng, initialLat],
        zoom: value?.lat ? 15 : 4,
        attributionControl: false,
      });

      cleanupResize = setupMapResizeObserver(map.current, mapContainer.current);

      map.current.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      marker.current = new maplibregl.Marker({ draggable: true, color: "#18181b" })
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);

      // Se a localização mudar via arraste do pino
      marker.current.on("dragend", async () => {
        const lngLat = marker.current?.getLngLat();
        if (lngLat) {
          // Reverse geocoding (Nominatim)
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lngLat.lat}&lon=${lngLat.lng}`,
            );
            const data = await res.json();
            const newText = data.display_name || query;
            setQuery(newText);
            onChange?.({ text: newText, lat: lngLat.lat, lng: lngLat.lng });
          } catch {
            onChange?.({ text: query, lat: lngLat.lat, lng: lngLat.lng });
          }
        }
      });
    });

    return () => {
      isMounted = false;
      cleanupResize?.();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    try {
      // Forward geocoding (Nominatim)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const text = data[0].display_name;

        setQuery(text);
        onChange?.({ text, lat, lng });

        if (map.current && marker.current) {
          map.current.flyTo({ center: [lng, lat], zoom: 15 });
          marker.current.setLngLat([lng, lat]);
        }
      }
    } catch (e) {
      console.error("Geocoding failed", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Mantém lat/lng anterior mas atualiza o texto, forçando o usuário a confirmar (Search)
              onChange?.({ text: e.target.value, lat: value?.lat, lng: value?.lng });
            }}
            placeholder="Ex: Avenida Paulista, São Paulo"
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          />
        </div>
        <Button type="button" variant="secondary" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          <span className="sr-only">Buscar endereço</span>
        </Button>
      </div>

      <div className=" rounded-xl overflow-hidden relative">
        <div ref={mapContainer} className="w-full h-[200px]" />
        {!value?.lat && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px] flex items-center justify-center p-4 text-center z-10 pointer-events-none">
            <p className="text-sm font-medium text-muted-foreground bg-background p-2 rounded ">
              Digite um endereço e clique em buscar para fixar no mapa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
