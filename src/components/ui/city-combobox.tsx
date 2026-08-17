import React, { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Check,
  ChevronsUpDown,
  Search,
  Crosshair,
  Building,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CANONICAL_CITIES,
  searchCanonicalCities,
  type CityRecord,
  findCityByLabel,
} from "@/lib/constants/cities";
import { useMasterLocation } from "@/components/location/location-master-pill";

export interface StructuredLocationValue {
  city: string;
  state: string;
  neighborhood: string;
  formatted: string;
}

interface CityComboboxProps {
  value?: string; // Ex: "Centro, Chapecó - SC" ou "Chapecó - SC"
  onChange: (formatted: string, structured?: StructuredLocationValue) => void;
  className?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
}

export function CityCombobox({
  value = "",
  onChange,
  className = "",
  label = "Localização do Anúncio",
  helperText = "Para sua privacidade, o endereço exato ou número não é divulgado.",
  required = false,
}: CityComboboxProps) {
  const { location: masterLoc } = useMasterLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<CityRecord | null>(() => {
    // Tenta derivar a cidade a partir do value inicial ou da master location
    if (value) {
      const parts = value.split("—").map((p) => p.trim());
      const lastPart = parts[parts.length - 1] || "";
      const matched = findCityByLabel(lastPart) || findCityByLabel(value);
      if (matched) return matched;
    }
    const defaultMatched = findCityByLabel(masterLoc.city) || CANONICAL_CITIES[0];
    return defaultMatched;
  });

  const [neighborhood, setNeighborhood] = useState(() => {
    if (value && value.includes("—")) {
      return value.split("—")[0].trim();
    }
    if (value && value.includes(",")) {
      return value.split(",")[0].trim();
    }
    return "";
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Inicializa o valor se vier vazio
  useEffect(() => {
    if (!value && selectedCity) {
      const formatted = neighborhood
        ? `${neighborhood} — ${selectedCity.label}`
        : selectedCity.label;
      onChange(formatted, {
        city: selectedCity.name,
        state: selectedCity.state,
        neighborhood,
        formatted,
      });
    }
  }, []);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCities = searchCanonicalCities(searchQuery, 8);

  const handleSelectCity = (city: CityRecord) => {
    setSelectedCity(city);
    setIsOpen(false);
    setSearchQuery("");
    const formatted = neighborhood ? `${neighborhood} — ${city.label}` : city.label;
    onChange(formatted, {
      city: city.name,
      state: city.state,
      neighborhood,
      formatted,
    });
  };

  const handleNeighborhoodChange = (newNeigh: string) => {
    setNeighborhood(newNeigh);
    const cityLabel = selectedCity ? selectedCity.label : "Chapecó - SC";
    const cityName = selectedCity ? selectedCity.name : "Chapecó";
    const cityState = selectedCity ? selectedCity.state : "SC";
    const formatted = newNeigh.trim() ? `${newNeigh.trim()} — ${cityLabel}` : cityLabel;
    onChange(formatted, {
      city: cityName,
      state: cityState,
      neighborhood: newNeigh.trim(),
      formatted,
    });
  };

  const handleAutoFillCurrent = () => {
    const matched =
      findCityByLabel(masterLoc.city) ||
      CANONICAL_CITIES.find((c) => c.name.toLowerCase() === masterLoc.city.toLowerCase()) ||
      CANONICAL_CITIES[0];
    setSelectedCity(matched);
    const neigh = masterLoc.address?.split(",")[0]?.trim() || "";
    setNeighborhood(neigh);
    const formatted = neigh ? `${neigh} — ${matched.label}` : matched.label;
    onChange(formatted, {
      city: matched.name,
      state: matched.state,
      neighborhood: neigh,
      formatted,
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-foreground font-medium flex items-center gap-1.5">
          <MapPin className="size-3.5 text-primary" />
          <span>{label}</span>
          {required && <span className="text-destructive">*</span>}
        </Label>

        {/* Botão de Autopreenchimento Rápido */}
        <button
          type="button"
          onClick={handleAutoFillCurrent}
          className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Crosshair className="size-3" />
          <span>Usar {masterLoc.city}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
        {/* Input de Bairro / Região */}
        <div className="sm:col-span-6 space-y-1">
          <Input
            value={neighborhood}
            onChange={(e) => handleNeighborhoodChange(e.target.value)}
            placeholder="Bairro (ex: Centro, Efapi, Seminário)"
            className="h-10 rounded-xl text-xs bg-background font-medium"
          />
        </div>

        {/* Select de Cidade Padronizada (Banco Canônico) */}
        <div className="sm:col-span-6 relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full h-10 px-3 rounded-xl border border-border/80 bg-background hover:bg-muted/40 flex items-center justify-between gap-2 text-xs font-semibold text-foreground transition-all cursor-pointer shadow-2xs text-left"
          >
            <div className="flex items-center gap-2 truncate">
              <Building className="size-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">
                {selectedCity ? selectedCity.label : "Selecione a Cidade"}
              </span>
            </div>
            <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0" />
          </button>

          {/* Dropdown com Busca Inteligente */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-popover text-popover-foreground border border-border rounded-2xl shadow-xl p-2 space-y-1.5 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95">
              <div className="relative px-1 pt-1 pb-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar cidade ou estado..."
                  className="h-8 pl-8 text-xs rounded-lg bg-muted/50 border-none font-medium"
                  autoFocus
                />
              </div>

              {/* Chips de Destaque Regional */}
              <div className="px-1 py-1 flex items-center gap-1.5 overflow-x-auto scrollbar-none border-b border-border/60 pb-2">
                {CANONICAL_CITIES.slice(0, 4).map((topCity) => (
                  <button
                    key={topCity.id}
                    type="button"
                    onClick={() => handleSelectCity(topCity)}
                    className={`text-[10px] px-2 py-0.5 rounded-md font-medium border shrink-0 transition-colors ${
                      selectedCity?.id === topCity.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80 text-foreground border-border"
                    }`}
                  >
                    {topCity.name}
                  </button>
                ))}
              </div>

              {/* Lista de Resultados */}
              <div className="space-y-0.5 pt-1">
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => {
                    const isSelected = selectedCity?.id === city.id;
                    return (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                          isSelected
                            ? "bg-primary/10 text-primary font-bold"
                            : "hover:bg-muted/60 text-foreground font-medium"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="leading-tight">{city.name}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {city.state} • {city.region}
                          </span>
                        </div>
                        {isSelected && <Check className="size-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    Nenhuma cidade encontrada para &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {helperText && (
        <p className="text-[10px] text-muted-foreground leading-relaxed">{helperText}</p>
      )}
    </div>
  );
}
