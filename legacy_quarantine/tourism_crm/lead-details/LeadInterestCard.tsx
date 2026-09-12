import React from "react";
import { MapPin } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const INTEREST_TYPES = [
  { v: "package_flight", label: "Pacote Aéreo Completo" },
  { v: "hotel", label: "Somente Hospedagem / Resort" },
  { v: "package_ground", label: "Excursão Rodoviária / Terrestre" },
  { v: "flights", label: "Passagens Aéreas" },
  { v: "cruise", label: "Cruzeiro Marítimo" },
  { v: "visa", label: "Visto & Passaporte" },
  { v: "corporate", label: "Corporativo / Negócios" },
  { v: "Lazer / Férias", label: "Lazer / Férias" },
  { v: "Lua de Mel", label: "Lua de Mel" },
  { v: "other", label: "Outros Serviços" },
];

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
      <span className="text-xs text-muted-foreground">{k}</span>
      <span className="text-xs font-semibold text-foreground text-right">{v}</span>
    </div>
  );
}

export function LeadInterestCard({ lead }: { lead: any }) {
  if (!lead) return null;

  const interestPeriod = (lead?.custom_fields as any)?.interest_period || lead?.interest_period;
  const datesStr = lead?.travel_start
    ? `${formatDate(lead.travel_start)} até ${lead.travel_end ? formatDate(lead.travel_end) : "Indefinido"}`
    : null;

  const travelPeriodDisplay = interestPeriod
    ? datesStr
      ? `${interestPeriod} (${datesStr})`
      : interestPeriod
    : datesStr || "Indefinido";

  const adults = lead?.pax_adults || 0;
  const children = lead?.pax_children || 0;
  const infants = lead?.pax_infants || 0;
  const totalPax = lead?.pax_count || (adults + children + infants > 0 ? adults + children + infants : 1);
  const parts = [];
  if (adults > 0) parts.push(`${adults} Adulto(s)`);
  if (children > 0) parts.push(`${children} Criança(s)`);
  if (infants > 0) parts.push(`${infants} Bebê(s)`);
  const paxBreakdown = parts.length > 0 ? parts.join(", ") : `${totalPax} Pax`;

  const estimatedValue = lead?.estimated_value_cents
    ? lead.estimated_value_cents / 100
    : lead?.estimated_value || 0;

  const interestTypeLabel =
    INTEREST_TYPES.find((t) => t.v === lead?.interest_type)?.label ||
    lead?.interest_type ||
    "Não informado";

  return (
    <div className="space-y-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border/40 pb-2 flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-primary" /> Viagem & Interesse
      </h4>
      <div className="space-y-1">
        <Row k="Destino" v={lead?.destination || "Não definido"} />
        <Row k="Tipo de Interesse" v={interestTypeLabel} />
        <Row k="Orçamento Estimado" v={formatCurrency(estimatedValue)} />
        <Row k="Período" v={travelPeriodDisplay} />
        <Row k="Passageiros" v={paxBreakdown} />
        {lead?.pax_ages && lead.pax_ages.length > 0 && (
          <Row k="Idades das Crianças" v={lead.pax_ages.join(", ") + " anos"} />
        )}
        <Row k="Canal / Origem" v={lead?.source || "Direto"} />
        {lead?.lead_source_detail && (
          <Row
            k="Detalhe do Canal"
            v={lead.lead_source_detail.replace("_", " ")}
          />
        )}
      </div>
    </div>
  );
}
