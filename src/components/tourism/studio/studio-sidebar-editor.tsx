import React from "react";
import type { TravelProposalDTO, FlightSegmentDTO, HotelOptionDTO, ItineraryDayDTO } from "@/services/travel-proposal.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash,
  Plane,
  Building2,
  Calendar,
  DollarSign,
  Info,
  CheckCircle,
} from "lucide-react";

interface StudioSidebarEditorProps {
  proposal: TravelProposalDTO;
  onChange: (patch: Partial<TravelProposalDTO>) => void;
}

export function StudioSidebarEditor({ proposal, onChange }: StudioSidebarEditorProps) {
  // Helpers para manipulação de listas
  const handleAddFlight = () => {
    const newFlight: FlightSegmentDTO = {
      id: "fl_" + Math.random().toString(36).substring(2, 7),
      type: proposal.flights.length === 0 ? "outbound" : "return",
      airline_name: "LATAM Airlines",
      origin_iata: "XAP",
      origin_city: "Chapecó",
      destination_iata: "GRU",
      destination_city: "São Paulo",
      departure_time: "08:30",
      arrival_time: "10:00",
      baggage_included: "Mochila + Mala 10kg",
      stops_count: 0,
    };
    onChange({ flights: [...proposal.flights, newFlight] });
  };

  const handleRemoveFlight = (id: string) => {
    onChange({ flights: proposal.flights.filter((f) => f.id !== id) });
  };

  const handleFlightChange = (id: string, field: keyof FlightSegmentDTO, val: any) => {
    onChange({
      flights: proposal.flights.map((f) => (f.id === id ? { ...f, [field]: val } : f)),
    });
  };

  const handleAddHotel = () => {
    const newHotel: HotelOptionDTO = {
      id: "ht_" + Math.random().toString(36).substring(2, 7),
      hotel_name: "Resort & Spa",
      stars: 4,
      room_type: "Apartamento Luxo",
      board_basis: "breakfast",
      checkin_date: proposal.travel_start_date || "2026-10-10",
      checkout_date: proposal.travel_end_date || "2026-10-15",
      nights_count: 5,
      amenities: ["Piscina", "Wi-Fi Grátis", "Ar Condicionado"],
    };
    onChange({ hotels: [...proposal.hotels, newHotel] });
  };

  const handleRemoveHotel = (id: string) => {
    onChange({ hotels: proposal.hotels.filter((h) => h.id !== id) });
  };

  const handleHotelChange = (id: string, field: keyof HotelOptionDTO, val: any) => {
    onChange({
      hotels: proposal.hotels.map((h) => (h.id === id ? { ...h, [field]: val } : h)),
    });
  };

  const handleAddItineraryDay = () => {
    const nextDay = proposal.itinerary.length + 1;
    const newDay: ItineraryDayDTO = {
      id: "day_" + Math.random().toString(36).substring(2, 7),
      day_number: nextDay,
      title: `Dia ${nextDay} • Atividade Sugerida`,
      description: "Descrição detalhada do passeio com guia e tempo livre para fotos.",
    };
    onChange({ itinerary: [...proposal.itinerary, newDay] });
  };

  const handleRemoveItineraryDay = (id: string) => {
    onChange({ itinerary: proposal.itinerary.filter((it) => it.id !== id) });
  };

  const handleItineraryChange = (id: string, field: keyof ItineraryDayDTO, val: any) => {
    onChange({
      itinerary: proposal.itinerary.map((it) => (it.id === id ? { ...it, [field]: val } : it)),
    });
  };

  return (
    <div className="w-full lg:w-96 p-4 rounded-2xl bg-card border border-border/80 space-y-4 overflow-y-auto max-h-[85vh]">
      <div className="pb-2 border-b border-border/40">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Editor da Proposta
        </h3>
        <p className="text-[11px] text-muted-foreground">
          As alterações são refletidas na lâmina em tempo real.
        </p>
      </div>

      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="grid grid-cols-4 h-9 p-1 rounded-xl bg-muted/50">
          <TabsTrigger value="dados" className="text-[11px] rounded-lg">Geral</TabsTrigger>
          <TabsTrigger value="voos" className="text-[11px] rounded-lg">Voos</TabsTrigger>
          <TabsTrigger value="hotel" className="text-[11px] rounded-lg">Hotel</TabsTrigger>
          <TabsTrigger value="preco" className="text-[11px] rounded-lg">Preço</TabsTrigger>
        </TabsList>

        {/* ── ABA 1: DADOS GERAIS & CLIENTE ── */}
        <TabsContent value="dados" className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-bold">Título da Proposta *</Label>
            <Input
              value={proposal.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Ex: Férias em Porto de Galinhas"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold">Destino Principal *</Label>
            <Input
              value={proposal.destination_city}
              onChange={(e) => onChange({ destination_city: e.target.value })}
              placeholder="Ex: Porto de Galinhas, PE"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold">Nome do Cliente *</Label>
              <Input
                value={proposal.client_name}
                onChange={(e) => onChange({ client_name: e.target.value })}
                placeholder="Nome do cliente"
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold">WhatsApp *</Label>
              <Input
                value={proposal.client_whatsapp}
                onChange={(e) => onChange({ client_whatsapp: e.target.value })}
                placeholder="(49) 99999-9999"
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[11px] font-bold">Data Ida</Label>
              <Input
                type="date"
                value={proposal.travel_start_date || ""}
                onChange={(e) => onChange({ travel_start_date: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-bold">Data Volta</Label>
              <Input
                type="date"
                value={proposal.travel_end_date || ""}
                onChange={(e) => onChange({ travel_end_date: e.target.value })}
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold">URL da Foto de Capa (Unsplash / Imagem)</Label>
            <Input
              value={proposal.cover_image_url || ""}
              onChange={(e) => onChange({ cover_image_url: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold">Validade da Proposta</Label>
            <Input
              value={proposal.valid_until || ""}
              onChange={(e) => onChange({ valid_until: e.target.value })}
              placeholder="Ex: Até 24h ou 15/10/2026"
              className="h-9 text-xs rounded-xl"
            />
          </div>
        </TabsContent>

        {/* ── ABA 2: VOOS & MALHA AÉREA ── */}
        <TabsContent value="voos" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground">Trechos de Voo</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddFlight}
              className="h-8 text-xs rounded-xl gap-1"
            >
              <Plus className="size-3.5" /> Adicionar Trecho
            </Button>
          </div>

          {proposal.flights.map((f, idx) => (
            <div key={f.id} className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>Trecho #{idx + 1} ({f.type === "outbound" ? "Ida" : "Volta"})</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveFlight(f.id)}
                  className="h-7 size-7 p-0 text-destructive"
                >
                  <Trash className="size-3.5" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Cia (Ex: GOL, LATAM)"
                  value={f.airline_name}
                  onChange={(e) => handleFlightChange(f.id, "airline_name", e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
                <Input
                  placeholder="Nº Voo (Ex: LA3241)"
                  value={f.flight_number || ""}
                  onChange={(e) => handleFlightChange(f.id, "flight_number", e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono uppercase text-muted-foreground">Origem (IATA / Hora)</label>
                  <div className="flex gap-1 mt-0.5">
                    <Input
                      placeholder="XAP"
                      value={f.origin_iata}
                      onChange={(e) => handleFlightChange(f.id, "origin_iata", e.target.value.toUpperCase())}
                      className="h-8 text-xs rounded-lg uppercase font-mono w-16"
                    />
                    <Input
                      placeholder="08:30"
                      value={f.departure_time}
                      onChange={(e) => handleFlightChange(f.id, "departure_time", e.target.value)}
                      className="h-8 text-xs rounded-lg flex-1"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-mono uppercase text-muted-foreground">Destino (IATA / Hora)</label>
                  <div className="flex gap-1 mt-0.5">
                    <Input
                      placeholder="GRU"
                      value={f.destination_iata}
                      onChange={(e) => handleFlightChange(f.id, "destination_iata", e.target.value.toUpperCase())}
                      className="h-8 text-xs rounded-lg uppercase font-mono w-16"
                    />
                    <Input
                      placeholder="10:00"
                      value={f.arrival_time}
                      onChange={(e) => handleFlightChange(f.id, "arrival_time", e.target.value)}
                      className="h-8 text-xs rounded-lg flex-1"
                    />
                  </div>
                </div>
              </div>

              <Input
                placeholder="Bagagem (Ex: 1x 10kg + Mochila)"
                value={f.baggage_included || ""}
                onChange={(e) => handleFlightChange(f.id, "baggage_included", e.target.value)}
                className="h-8 text-xs rounded-lg"
              />
            </div>
          ))}
        </TabsContent>

        {/* ── ABA 3: HOTELARIA & ACOMODAÇÃO ── */}
        <TabsContent value="hotel" className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-foreground">Hotéis & Pousadas</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddHotel}
              className="h-8 text-xs rounded-xl gap-1"
            >
              <Plus className="size-3.5" /> Adicionar Hotel
            </Button>
          </div>

          {proposal.hotels.map((h) => (
            <div key={h.id} className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span>{h.hotel_name || "Novo Hotel"}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveHotel(h.id)}
                  className="h-7 size-7 p-0 text-destructive"
                >
                  <Trash className="size-3.5" />
                </Button>
              </div>

              <Input
                placeholder="Nome do Hotel / Resort"
                value={h.hotel_name}
                onChange={(e) => handleHotelChange(h.id, "hotel_name", e.target.value)}
                className="h-8 text-xs rounded-lg"
              />

              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Quarto (Ex: Vista Mar)"
                  value={h.room_type}
                  onChange={(e) => handleHotelChange(h.id, "room_type", e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
                <select
                  value={h.board_basis}
                  onChange={(e) => handleHotelChange(h.id, "board_basis", e.target.value)}
                  className="h-8 text-xs rounded-lg bg-background border border-border px-2"
                >
                  <option value="breakfast">Café da Manhã</option>
                  <option value="half_board">Meia Pensão</option>
                  <option value="full_board">Pensão Completa</option>
                  <option value="all_inclusive">All Inclusive</option>
                  <option value="none">Sem Alimentação</option>
                </select>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* ── ABA 4: PREÇOS & PARCELAMENTO ── */}
        <TabsContent value="preco" className="space-y-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-bold">Valor Total (em Centavos BRL) *</Label>
            <Input
              type="number"
              value={proposal.pricing?.total_price_cents || 0}
              onChange={(e) =>
                onChange({
                  pricing: {
                    ...proposal.pricing,
                    total_price_cents: Number(e.target.value),
                  },
                })
              }
              placeholder="Ex: 589000 para R$ 5.890,00"
              className="h-9 text-xs rounded-xl font-mono"
            />
            <span className="text-[10px] text-muted-foreground">
              Dica: R$ 1.500,00 = 150000 centavos
            </span>
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 space-y-2">
            <span className="text-xs font-bold text-foreground block">Opções de Parcelamento</span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  onChange({
                    pricing: {
                      ...proposal.pricing,
                      installments_options: [
                        { installments_count: 1, installment_value_cents: proposal.pricing.total_price_cents, method: "pix", has_interest: false },
                        { installments_count: 10, installment_value_cents: Math.round(proposal.pricing.total_price_cents / 10), method: "credit_card", has_interest: false },
                        { installments_count: 12, installment_value_cents: Math.round(proposal.pricing.total_price_cents / 12), method: "credit_card", has_interest: false },
                      ],
                    },
                  })
                }
                className="h-8 text-xs rounded-lg"
              >
                Gerar 10x e 12x Sem Juros
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
