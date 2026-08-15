import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, NavigationControl, Marker, LngLatBounds } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Loader2, MapPinOff } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getPublicMapConfig } from "@/services/integrations.functions";

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface MapLibreCanvasProps {
  origin: MapPoint | null;
  destination: MapPoint | null;
  center?: { lat: number; lng: number };
  zoom?: number;
  pinMode?: "origin" | "destination" | null;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

const DEFAULT_CENTER = { lat: -27.1004, lng: -52.6152 }; // Chapecó - SC

export function MapLibreCanvas({
  origin,
  destination,
  center = DEFAULT_CENTER,
  zoom = 13.5,
  pinMode = null,
  onMapClick,
  className = "",
}: MapLibreCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  const destMarkerRef = useRef<Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Fetch active map integration config
  const { data: mapConfig, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["public-map-config"],
    queryFn: () => getPublicMapConfig(),
    staleTime: 5 * 60 * 1000,
  });

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || isLoadingConfig) return;
    if (mapConfig && !mapConfig.isActive) return;

    // Detect dark mode from html class
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    
    // Choose tile style based on provider configuration
    let mapStyle = isDark
      ? "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      : "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

    if (mapConfig?.customTileUrl) {
      mapStyle = mapConfig.customTileUrl;
    } else if (mapConfig?.provider === "mapbox" && mapConfig.apiKey) {
      mapStyle = `https://api.mapbox.com/styles/v1/mapbox/${isDark ? "dark-v11" : "light-v11"}?access_token=${mapConfig.apiKey}`;
    }

    try {
      const map = new MapLibreMap({
        container: mapContainer.current,
        style: mapStyle,
        center: [center.lng, center.lat],
        zoom: zoom,
        attributionControl: false,
      });

      map.addControl(
        new NavigationControl({ showCompass: false }),
        "bottom-right",
      );

      map.on("load", () => {
        setIsLoaded(true);
        mapRef.current = map;
      });

      map.on("click", (e) => {
        if (onMapClick) {
          onMapClick(e.lngLat.lat, e.lngLat.lng);
        }
      });

      map.on("error", (err) => {
        console.warn("[map] Erro no carregamento de tiles:", err);
      });
    } catch (err) {
      console.warn("[map] Falha ao instanciar MapLibreMap:", err);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapConfig, isLoadingConfig]);

  // Update Origin Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (origin) {
      if (!originMarkerRef.current) {
        const el = document.createElement("div");
        el.className =
          "size-7 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs shadow-md border-2 border-background cursor-pointer";
        el.innerHTML = `<span class="size-2 rounded-full bg-background"></span>`;
        originMarkerRef.current = new Marker({ element: el })
          .setLngLat([origin.lng, origin.lat])
          .addTo(map);
      } else {
        originMarkerRef.current.setLngLat([origin.lng, origin.lat]);
      }
    } else if (originMarkerRef.current) {
      originMarkerRef.current.remove();
      originMarkerRef.current = null;
    }
  }, [origin, isLoaded]);

  // Update Destination Marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    if (destination) {
      if (!destMarkerRef.current) {
        const el = document.createElement("div");
        el.className =
          "size-7 rounded-full bg-foreground text-background flex items-center justify-center font-bold text-xs shadow-md border-2 border-background cursor-pointer";
        el.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
        destMarkerRef.current = new Marker({ element: el })
          .setLngLat([destination.lng, destination.lat])
          .addTo(map);
      } else {
        destMarkerRef.current.setLngLat([destination.lng, destination.lat]);
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [destination, isLoaded]);

  // Fit bounds when both origin and destination are present
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded || !origin || !destination) return;

    const bounds = new LngLatBounds();
    bounds.extend([origin.lng, origin.lat]);
    bounds.extend([destination.lng, destination.lat]);

    map.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 450, right: 100 },
      maxZoom: 15,
      duration: 1000,
    });
  }, [origin, destination, isLoaded]);

  if (mapConfig && !mapConfig.isActive) {
    return (
      <div className={`relative w-full h-full flex flex-col items-center justify-center bg-muted/20 text-muted-foreground p-8 text-center border border-dashed border-border ${className}`}>
        <MapPinOff className="size-10 mb-2 opacity-40" />
        <h3 className="text-sm font-semibold text-foreground">Serviço de Mapas Não Configurado</h3>
        <p className="text-xs max-w-sm mt-1">
          {mapConfig.message || "A integração de mapas (OpenStreetMap, Mapbox ou Google Maps) está inativa nas configurações do sistema."}
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div
        ref={mapContainer}
        className={`w-full h-full ${pinMode ? "cursor-crosshair" : ""}`}
      />
      {(!isLoaded || isLoadingConfig) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
