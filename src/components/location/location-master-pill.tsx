import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Search, X, Check, Loader2, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useLocation } from "@tanstack/react-router";

export interface LocationState {
  city: string;
  state: string;
  lat?: number;
  lng?: number;
  address?: string;
  source: "gps" | "cep" | "manual" | "default";
}

const DEFAULT_LOCATION: LocationState = {
  city: "Chapecó",
  state: "SC",
  lat: -27.1004,
  lng: -52.6152,
  address: "Centro, Chapecó - SC",
  source: "default",
};

export function useMasterLocation() {
  const [location, setLocation] = useState<LocationState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("jah_master_location");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_LOCATION;
  });

  const updateLocation = (newLoc: LocationState) => {
    setLocation(newLoc);
    if (typeof window !== "undefined") {
      localStorage.setItem("jah_master_location", JSON.stringify(newLoc));
    }
  };

  return { location, updateLocation };
}

export function LocationMasterPill({ className = "" }: { className?: string }) {
  const { location, updateLocation } = useMasterLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);

  // Trigger GPS Geolocation
  const triggerGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    setIsLocating(true);
    toast.info("Obtendo sua localização via GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Reverse geocode via OpenStreetMap Nominatim
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "JahCommunityCommerce/1.0" } },
          );
          const data = await res.json();
          const city =
            data.address?.city ||
            data.address?.town ||
            data.address?.municipality ||
            data.address?.village ||
            "Sua Localização";
          const state = data.address?.state_code || data.address?.state || "";

          const newLoc: LocationState = {
            city: city,
            state: state,
            lat: latitude,
            lng: longitude,
            address: data.display_name || `${city}, ${state}`,
            source: "gps",
          };

          updateLocation(newLoc);
          toast.success(`Localização atualizada: ${city} - ${state}`);
        } catch (e) {
          updateLocation({
            city: "Minha Localização",
            state: "",
            lat: latitude,
            lng: longitude,
            source: "gps",
          });
          toast.success("GPS sincronizado com sucesso!");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        toast.error("Permissão de GPS negada ou indisponível. Selecione manualmente.");
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handlePointerDown = () => {
    isLongPressRef.current = false;
    setIsHolding(true);
    holdTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsHolding(false);
      triggerGeolocation();
    }, 600); // 600ms hold to activate GPS
  };

  const handlePointerUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setIsHolding(false);
    if (!isLongPressRef.current) {
      setModalOpen(true);
    }
  };

  const handlePointerCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
    setIsHolding(false);
  };

  return (
    <>
      <button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        title="Clique para escolher cidade/CEP ou segure para ativar GPS"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border select-none cursor-pointer ${
          isHolding
            ? "scale-95 bg-primary/20 border-primary text-primary"
            : "bg-muted/70 hover:bg-muted text-foreground border-border/80 hover:border-primary/40 shadow-2xs"
        } ${className}`}
      >
        {isLocating ? (
          <Loader2 className="size-3.5 animate-spin text-primary" />
        ) : (
          <MapPin className="size-3.5 text-primary shrink-0" />
        )}
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          {location.city} {location.state ? `· ${location.state}` : ""}
        </span>
      </button>

      <LocationPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        currentLocation={location}
        onSelectLocation={(loc) => {
          updateLocation(loc);
          setModalOpen(false);
          toast.success(`Localidade definida para ${loc.city}`);
        }}
        onTriggerGPS={triggerGeolocation}
      />
    </>
  );
}

export function LocationPickerModal({
  open,
  onOpenChange,
  currentLocation,
  onSelectLocation,
  onTriggerGPS,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLocation: LocationState;
  onSelectLocation: (loc: LocationState) => void;
  onTriggerGPS: () => void;
}) {
  const [cep, setCep] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [manualCity, setManualCity] = useState("");

  const POPULAR_CITIES = [
    { city: "Chapecó", state: "SC", lat: -27.1004, lng: -52.6152 },
    { city: "Florianópolis", state: "SC", lat: -27.5954, lng: -48.548 },
    { city: "Curitiba", state: "PR", lat: -25.4284, lng: -49.2733 },
    { city: "Porto Alegre", state: "RS", lat: -30.0346, lng: -51.2177 },
    { city: "São Paulo", state: "SP", lat: -23.5505, lng: -46.6333 },
  ];

  const handleSearchCep = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) {
      toast.error("Digite um CEP válido com 8 números.");
      return;
    }

    setIsSearchingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
        return;
      }

      onSelectLocation({
        city: data.localidade,
        state: data.uf,
        address: `${data.logradouro || "Centro"}, ${data.bairro || ""} - ${data.localidade}/${data.uf}`,
        source: "cep",
      });
    } catch {
      toast.error("Falha ao buscar CEP na base postal.");
    } finally {
      setIsSearchingCep(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 overflow-hidden rounded-3xl border border-border bg-background shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-border/80 bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-lg font-black tracking-tight">
            <MapPin className="size-5 text-primary" />
            <span>Onde você quer descobrir e comprar?</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Filtre produtos, comércios, eventos e classificados de acordo com a sua região.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Quick GPS button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onTriggerGPS();
              onOpenChange(false);
            }}
            className="w-full h-12 rounded-2xl border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs gap-2"
          >
            <Navigation className="size-4" />
            <span>Usar minha localização atual (GPS)</span>
          </Button>

          {/* Search by CEP */}
          <form onSubmit={handleSearchCep} className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Buscar por CEP
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: 89801-000"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={9}
                className="h-11 rounded-xl bg-card text-sm"
              />
              <Button
                type="submit"
                disabled={isSearchingCep}
                className="h-11 px-5 rounded-xl font-bold bg-primary text-primary-foreground text-xs"
              >
                {isSearchingCep ? <Loader2 className="size-4 animate-spin" /> : "Buscar"}
              </Button>
            </div>
          </form>

          {/* Popular Cities Quick Select */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Cidades em Destaque
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_CITIES.map((c) => {
                const isSelected = currentLocation.city.toLowerCase() === c.city.toLowerCase();

                return (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() =>
                      onSelectLocation({
                        city: c.city,
                        state: c.state,
                        lat: c.lat,
                        lng: c.lng,
                        address: `${c.city} - ${c.state}`,
                        source: "manual",
                      })
                    }
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold transition-all ${
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                        : "bg-card hover:bg-muted text-foreground border-border/80"
                    }`}
                  >
                    <span>
                      {c.city} - {c.state}
                    </span>
                    {isSelected && <Check className="size-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
