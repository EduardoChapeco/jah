import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AirplaneTilt,
  MapPin,
  CalendarDots,
  Users,
  WhatsappLogo,
  CheckCircle,
  Clock,
  CurrencyCircleDollar,
  Sparkle,
  SuitcaseSimple,
  ShieldCheck,
  Tag,
  ChatCircleDots,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  listAgencyTravelQuotes,
  type TravelQuoteRequestDTO,
} from "@/services/tourism.functions";
import { formatDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/turismo/cotacoes")({
  head: () => ({
    meta: [{ title: "Central de Cotações & Leads de Viagens | Workspace" }],
  }),
  loader: async () => {
    const quotes = await listAgencyTravelQuotes({ data: { status: "all" } }).catch(() => []);
    return { quotes };
  },
  component: AgencyQuotesPage,
});

const STATUS_FILTERS = [
  { id: "all", label: "Todas Cotações" },
  { id: "new", label: "Novas" },
  { id: "analyzing", label: "Em Análise" },
  { id: "quoted", label: "Orçamento Enviado" },
  { id: "won", label: "Fechadas" },
];

export default function AgencyQuotesPage() {
  const { quotes: initialQuotes } = Route.useLoaderData();
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["agency-travel-quotes", selectedStatus],
    queryFn: () => listAgencyTravelQuotes({ data: { status: selectedStatus as any } }),
    initialData: initialQuotes,
  });

  const quotesList = (quotes || []).filter((q) => {
    if (selectedStatus !== "all" && q.status !== selectedStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        q.contact_name.toLowerCase().includes(s) ||
        q.destination_city.toLowerCase().includes(s) ||
        q.origin_city.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl  bg-card ">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Módulo Agências & Turismo
            </span>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
              ✈️ Gestão de Leads CVC
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Central de Cotações de Viagem
          </h1>
          <p className="text-xs text-muted-foreground">
            Receba solicitações completas com origem, destino, quartos, adultos e idades das crianças para montar propostas ágeis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5">
            <Link to="/turismo">
              <SuitcaseSimple className="size-3.5" />
              <span>Meus Pacotes & Roteiros</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. Filtros e Busca ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedStatus(f.id)}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatus === f.id
                  ? "bg-foreground text-background "
                  : "bg-muted/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por cliente, destino ou origem..."
          className="h-10 max-w-xs rounded-xl text-xs bg-card border-border "
        />
      </div>

      {/* ── 3. Lista de Cotações Recebidas ── */}
      {quotesList.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-muted/10 rounded-3xl border-0 p-8">
          <AirplaneTilt size={40} className="mx-auto text-muted-foreground" />
          <h3 className="text-sm font-bold text-foreground">Nenhuma cotação encontrada</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Quando os clientes solicitarem orçamentos de pacotes, hotéis ou vistos pelo app, eles aparecerão detalhados aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quotesList.map((q) => {
            const cleanWhatsapp = (q.contact_whatsapp || "").replace(/\D/g, "");
            const tripTypeLabel =
              q.trip_type === "air_package"
                ? "✈️ Voo + Hotel"
                : q.trip_type === "hotel_only"
                  ? "🏨 Somente Hotel"
                  : q.trip_type === "cruise"
                    ? "🚢 Cruzeiro"
                    : q.trip_type === "bus"
                      ? "🚌 Rodoviário"
                      : "🛂 Visto Americano";

            const waMessage = encodeURIComponent(
              `Olá ${q.contact_name}! Sou da agência de viagens no Wider e recebi sua solicitação de cotação para ${q.destination_city} (${q.adults_count} adultos${q.children_count > 0 ? `, ${q.children_count} crianças` : ""}). Preparei algumas opções incríveis para você!`
            );

            return (
              <Card
                key={q.id}
                className="p-5 rounded-3xl border-border bg-card  space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Header do Card de Cotação */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                      {tripTypeLabel}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono uppercase font-bold">
                      {q.status === "new" ? "Nova" : q.status === "quoted" ? "Orçamento Enviado" : q.status}
                    </Badge>
                  </div>

                  {/* Rota da Viagem: Origem -> Destino */}
                  <div className="p-3 rounded-2xl bg-muted/40  space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-muted-foreground" />
                        <span>{q.origin_city} {q.origin_iata && `(${q.origin_iata})`}</span>
                      </span>
                      <span>→</span>
                      <span className="text-primary font-black">
                        {q.destination_city} {q.destination_iata && `(${q.destination_iata})`}
                      </span>
                    </div>

                    {(q.departure_date || q.return_date) && (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-1  font-mono">
                        <CalendarDots size={12} />
                        <span>
                          {q.departure_date ? formatDate(q.departure_date) : "Data a definir"} até{" "}
                          {q.return_date ? formatDate(q.return_date) : "Data a definir"}
                        </span>
                        {q.flexible_dates && (
                          <Badge variant="secondary" className="text-[9px] py-0 px-1.5">
                            +/- 3 dias
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Detalhes de Passageiros & Idades */}
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Users size={14} className="text-foreground shrink-0" />
                      <span className="font-bold text-foreground">
                        {q.adults_count} {q.adults_count === 1 ? "Adulto" : "Adultos"}
                      </span>
                      <span>•</span>
                      <span>
                        {q.children_count > 0
                          ? `${q.children_count} ${q.children_count === 1 ? "Criança" : "Crianças"}`
                          : "Sem crianças"}
                      </span>
                      <span>•</span>
                      <span>{q.rooms_count} {q.rooms_count === 1 ? "Quarto" : "Quartos"}</span>
                    </div>

                    {q.children_ages && q.children_ages.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1 pt-1">
                        <span className="text-[10px] font-bold text-muted-foreground">Idades:</span>
                        {q.children_ages.map((age, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                            {age === 0 ? "Bebê (<1a)" : `${age} anos`}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {q.special_notes && (
                      <p className="text-[11px] italic bg-muted/20 p-2 rounded-xl  text-muted-foreground line-clamp-2 mt-2">
                        "{q.special_notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas do Consultor de Viagem */}
                <div className="pt-3  flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-foreground block truncate">
                      {q.contact_name}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {q.contact_whatsapp}
                    </span>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="rounded-xl font-bold text-xs h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 "
                  >
                    <a
                      href={`https://wa.me/55${cleanWhatsapp}?text=${waMessage}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <WhatsappLogo size={16} weight="bold" />
                      <span>Enviar Orçamento</span>
                    </a>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
