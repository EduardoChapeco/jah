import { useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Plane,
  Building2,
  Calendar,
  DollarSign,
  Send,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Plus,
  Trash2,
  Layers,
  Copy,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createTravelProposal } from "@/services/travel-proposal.functions";

interface LeadVisualProposalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lead: {
    id: string;
    fullName?: string;
    email?: string | null;
    phone?: string | null;
    destination?: string | null;
    estimated_value_cents?: number;
    passenger_count?: number;
  } | null;
  storeId?: string;
  onSuccess?: () => void;
}

export function LeadVisualProposalSheet({
  isOpen,
  onClose,
  lead,
  storeId,
  onSuccess,
}: LeadVisualProposalSheetProps) {
  const [destinationCity, setDestinationCity] = useState(lead?.destination || "Cancún");
  const [destinationCountry, setDestinationCountry] = useState("México");
  const [startDate, setStartDate] = useState(new Date(Date.now() + 86400000 * 30).toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 86400000 * 37).toISOString().split("T")[0]);
  const [passengerCount, setPassengerCount] = useState(lead?.passenger_count || 2);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(
    "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=1200&auto=format&fit=crop"
  );

  // Voo
  const [hasFlight, setHasFlight] = useState(true);
  const [airline, setAirline] = useState("LATAM Airlines");
  const [flightOrigin, setFlightOrigin] = useState("GRU (São Paulo)");
  const [flightDest, setFlightDest] = useState("CUN (Cancún)");

  // Hotel
  const [hasHotel, setHasHotel] = useState(true);
  const [hotelName, setHotelName] = useState("Grand Palladium Costa Mujeres Resort & Spa");
  const [roomType, setRoomType] = useState("Junior Suite All Inclusive");

  // Preço & Pagamento
  const initialBaseCents = lead?.estimated_value_cents || 850000;
  const [basePriceCents, setBasePriceCents] = useState(initialBaseCents);
  const [boardingTaxCents, setBoardingTaxCents] = useState(48000);
  const [paymentTerms, setPaymentTerms] = useState("Entrada de 20% + saldo em até 10x sem juros no cartão.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdProposalToken, setCreatedProposalToken] = useState<string | null>(null);

  const handleGenerateProposal = async () => {
    setIsSubmitting(true);
    try {
      const totalPrice = basePriceCents + boardingTaxCents;
      const res = await createTravelProposal({
        data: {
          title: `Proposta: ${destinationCity || "Viagem Exclusiva"} (${lead?.fullName || "Cliente Especial"})`,
          clientName: lead?.fullName || "Cliente Especial",
          clientEmail: lead?.email || undefined,
          clientWhatsapp: lead?.phone || "49998887777",
          clientPhone: lead?.phone || "49998887777",
          destinationCity,
          destinationCountry,
          startDate,
          endDate,
          travelStartDate: startDate,
          travelEndDate: endDate,
          paxCount: passengerCount,
          adultsCount: passengerCount,
          coverPhotoUrl,
          leadId: lead?.id,
          pricing: {
            currency: "BRL",
            base_price_cents: basePriceCents,
            boarding_tax_cents: boardingTaxCents,
            total_price_cents: totalPrice,
            total_cents: totalPrice,
            payment_terms: paymentTerms,
          },
          itinerary: [
            {
              day_number: 1,
              title: "Chegada e Check-in no Resort",
              description: "Recepção VIP no aeroporto e transfer privativo para o hotel.",
            },
            {
              day_number: 2,
              title: "Dia Livre All-Inclusive & Praia",
              description: "Aproveite a gastronomia internacional e piscinas do resort.",
            },
          ],
          flights: hasFlight
            ? [
                {
                  type: "round_trip",
                  airline,
                  origin: flightOrigin,
                  destination: flightDest,
                  cabin_class: "economy",
                },
              ]
            : [],
          hotels: hasHotel
            ? [
                {
                  hotel_name: hotelName,
                  room_type: roomType,
                  board_basis: "all_inclusive",
                },
              ]
            : [],
        },
      });

      setCreatedProposalToken(res.publicToken);
      toast.success("Proposta visual gerada com sucesso!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg =
        typeof err?.message === "string" && err.message.startsWith("[{")
          ? "Verifique os dados da proposta."
          : (err?.message || "Erro ao emitir proposta comercial.");
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyProposalLink = () => {
    if (!createdProposalToken) return;
    const url = `${window.location.origin}/proposta/${createdProposalToken}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl bg-card border-l border-border p-6 overflow-y-auto space-y-6 select-none">
        <SheetHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <SheetTitle className="text-base font-bold text-foreground">
              Estúdio de Propostas Comerciais Visuais
            </SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            {lead?.fullName ? `Oportunidade: ${lead.fullName}` : "Emissão de lâmina interativa para o cliente"}
          </SheetDescription>
        </SheetHeader>

        {createdProposalToken ? (
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/20 text-center space-y-4">
            <CheckCircle2 className="size-12 text-primary mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">Proposta Gerada com Sucesso!</h3>
              <p className="text-xs text-muted-foreground">
                Envie o link interativo diretamente ao cliente pelo WhatsApp para aprovação instantânea.
              </p>
            </div>

            <div className="p-3 bg-card border border-border rounded-xl font-mono text-xs text-primary break-all">
              {window.location.origin}/proposta/{createdProposalToken}
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button onClick={copyProposalLink} className="rounded-xl min-h-[44px] gap-2">
                <Copy className="size-4" /> Copiar Link do Cliente
              </Button>
              <Button
                variant="outline"
                onClick={() => setCreatedProposalToken(null)}
                className="rounded-xl min-h-[44px]"
              >
                Criar Outra
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── 1. Destino & Foto de Capa ── */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                1. Destino & Apresentação
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Cidade / Destino</Label>
                  <Input
                    value={destinationCity}
                    onChange={(e) => setDestinationCity(e.target.value)}
                    className="h-10 rounded-xl min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">País</Label>
                  <Input
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    className="h-10 rounded-xl min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 rounded-xl min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 rounded-xl min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Passageiros (Pax)</Label>
                  <Input
                    type="number"
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(parseInt(e.target.value, 10) || 1)}
                    className="h-10 rounded-xl min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* ── 2. Malha Aérea & Hospedagem ── */}
            <div className="space-y-3 pt-2 border-t border-border/80">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                2. Voo & Hospedagem
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                    <Plane className="size-4" /> Voo Comercial
                  </div>
                  <Input
                    placeholder="Companhia Aérea"
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                  <Input
                    placeholder="Trecho Origem ➔ Destino"
                    value={`${flightOrigin} ➔ ${flightDest}`}
                    onChange={(e) => {
                      const parts = e.target.value.split("➔");
                      setFlightOrigin(parts[0]?.trim() || "");
                      setFlightDest(parts[1]?.trim() || "");
                    }}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>

                <div className="p-3.5 rounded-xl border border-border bg-card space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <Building2 className="size-4" /> Hotel & Resort
                  </div>
                  <Input
                    placeholder="Nome do Hotel / Pousada"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                  <Input
                    placeholder="Tipo de Acomodação"
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="h-9 text-xs rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* ── 3. Preço & Condições Comerciais ── */}
            <div className="space-y-3 pt-2 border-t border-border/80">
              <Label className="text-xs font-bold text-foreground uppercase tracking-wider">
                3. Valores & Condições de Pagamento
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Valor Base dos Pacotes (R$)</Label>
                  <Input
                    type="number"
                    value={(basePriceCents / 100).toFixed(2)}
                    onChange={(e) => setBasePriceCents(Math.round(parseFloat(e.target.value) * 100 || 0))}
                    className="h-10 font-mono font-bold rounded-xl min-h-[44px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Taxas de Embarque (R$)</Label>
                  <Input
                    type="number"
                    value={(boardingTaxCents / 100).toFixed(2)}
                    onChange={(e) => setBoardingTaxCents(Math.round(parseFloat(e.target.value) * 100 || 0))}
                    className="h-10 font-mono rounded-xl min-h-[44px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Condições de Pagamento</Label>
                <Input
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="h-10 text-xs rounded-xl min-h-[44px]"
                />
              </div>

              <div className="p-3.5 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Total da Proposta:</span>
                <span className="text-base font-black font-mono text-primary">
                  R$ {((basePriceCents + boardingTaxCents) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        <SheetFooter className="gap-2 sm:gap-0 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} className="rounded-xl min-h-[44px]">
            Fechar
          </Button>
          {!createdProposalToken && (
            <Button
              onClick={handleGenerateProposal}
              disabled={isSubmitting}
              className="rounded-xl min-h-[44px] gap-2 bg-primary text-primary-foreground font-bold"
            >
              <Send className="size-4" />
              {isSubmitting ? "Emitindo..." : "Emitir Proposta Oficial"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
