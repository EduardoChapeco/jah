import React from "react";
import type { TravelProposalDTO } from "@/services/travel-proposal.functions";
import { formatMoney } from "@/lib/money";
import {
  AirplaneTilt,
  Buildings,
  CalendarDots,
  Users,
  CheckCircle,
  XCircle,
  ShieldCheck,
  WhatsappLogo,
  MapPin,
  Clock,
  SuitcaseSimple,
  CreditCard,
  QrCode,
} from "@phosphor-icons/react";

interface ProposalCanvasRendererProps {
  proposal: TravelProposalDTO;
}

export function ProposalCanvasRenderer({ proposal }: ProposalCanvasRendererProps) {
  const isLandscape = proposal.canvas_format === "a4-landscape" || proposal.canvas_format === "presentation-169";
  const isStory = proposal.canvas_format === "story-916";

  const totalCents = proposal.pricing?.total_price_cents || 0;
  const installments = proposal.pricing?.installments_options || [];

  return (
    <div className="w-full bg-white text-slate-900 font-sans p-6 sm:p-10 space-y-6 flex flex-col justify-between min-h-full">
      {/* ── 1. TOPO EDITORIAL / HEADER DA AGÊNCIA ── */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          {proposal.agency_logo_url ? (
            <img
              src={proposal.agency_logo_url}
              alt={proposal.agency_name}
              className="h-10 w-auto object-contain rounded-lg max-w-[140px]"
            />
          ) : (
            <div className="size-10 rounded-xl bg-slate-900 text-white font-black text-xs flex items-center justify-center">
              {proposal.agency_name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h4 className="text-xs font-black tracking-tight text-slate-900 uppercase">
              {proposal.agency_name}
            </h4>
            <span className="text-[10px] font-mono text-slate-500 block">
              Proposta #{proposal.public_token}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
            Elaborado para
          </span>
          <span className="text-xs font-bold text-slate-900">{proposal.client_name}</span>
        </div>
      </div>

      {/* ── 2. CAPA PANORÂMICA & DESTINO ── */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white aspect-21/9 min-h-[180px] flex flex-col justify-end p-6">
        {proposal.cover_image_url ? (
          <img
            src={proposal.cover_image_url}
            alt={proposal.destination_city}
            className="absolute inset-0 size-full object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-90" />
        )}

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
            <MapPin size={12} weight="bold" />
            <span>{proposal.destination_city}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {proposal.title}
          </h1>
          {proposal.subtitle && (
            <p className="text-xs text-white/80 font-medium">{proposal.subtitle}</p>
          )}
        </div>
      </div>

      {/* ── 3. METADADOS DA VIAGEM: PASSAGEIROS & DATAS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Passageiros
          </span>
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <Users size={14} className="text-slate-600" />
            <span>
              {proposal.adults_count} Adultos
              {proposal.children_count > 0 && ` + ${proposal.children_count} Crianças`}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Período da Viagem
          </span>
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <CalendarDots size={14} className="text-slate-600" />
            <span>
              {proposal.travel_start_date || "Data Flexível"}
              {proposal.travel_end_date ? ` até ${proposal.travel_end_date}` : ""}
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Destino Principal
          </span>
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 truncate">
            <MapPin size={14} className="text-slate-600 shrink-0" />
            <span className="truncate">{proposal.destination_city}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
            Validade da Cotação
          </span>
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700">
            <Clock size={14} />
            <span>{proposal.valid_until || "Consulte agência"}</span>
          </div>
        </div>
      </div>

      {/* ── 4. MALHA AÉREA & VOOS (SE HOUVER) ── */}
      {proposal.flights && proposal.flights.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <AirplaneTilt size={16} weight="bold" className="text-slate-800" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Voos & Conexões
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {proposal.flights.map((f) => (
              <div
                key={f.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] font-mono">
                      {f.type === "outbound" ? "IDA" : f.type === "return" ? "VOLTA" : "TRECHO"}
                    </span>
                    <span>{f.airline_name}</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {f.flight_number || ""}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <div>
                    <span className="text-sm font-mono">{f.origin_iata}</span>
                    <span className="text-[10px] text-slate-500 block font-normal">{f.departure_time}</span>
                  </div>
                  <div className="flex-1 mx-3 border-b-2 border-dashed border-slate-300 relative text-center">
                    <span className="text-[9px] font-mono text-slate-400 bg-white px-1 relative -top-2">
                      {f.stops_count === 0 ? "Voo Direto" : `${f.stops_count} escala(s)`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono">{f.destination_iata}</span>
                    <span className="text-[10px] text-slate-500 block font-normal">{f.arrival_time}</span>
                  </div>
                </div>

                {f.baggage_included && (
                  <div className="text-[10px] font-medium text-slate-600 flex items-center gap-1 pt-1 border-t border-slate-200/60">
                    <SuitcaseSimple size={12} />
                    <span>Bagagem: {f.baggage_included}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. HOSPEDAGEM & HOTELARIA (SE HOUVER) ── */}
      {proposal.hotels && proposal.hotels.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Buildings size={16} weight="bold" className="text-slate-800" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Hospedagem & Acomodação
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {proposal.hotels.map((h) => (
              <div
                key={h.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">{h.hotel_name}</span>
                  <span className="text-amber-500 text-xs">{"★".repeat(h.stars || 4)}</span>
                </div>
                <div className="text-xs text-slate-600 font-medium">
                  <span>Quarto: {h.room_type}</span> •{" "}
                  <span className="font-bold text-slate-900">
                    {h.board_basis === "all_inclusive"
                      ? "All Inclusive"
                      : h.board_basis === "breakfast"
                      ? "Café da Manhã Incluso"
                      : h.board_basis === "half_board"
                      ? "Meia Pensão"
                      : "Sem Alimentação"}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {h.nights_count} noites ({h.checkin_date} a {h.checkout_date})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. ROTEIRO DIA A DIA (SE HOUVER) ── */}
      {proposal.itinerary && proposal.itinerary.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <CalendarDots size={16} weight="bold" className="text-slate-800" />
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Programação Sugerida
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {proposal.itinerary.map((it) => (
              <div
                key={it.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1"
              >
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                  Dia {it.day_number}
                </span>
                <p className="font-bold text-slate-900 text-xs">{it.title}</p>
                <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">
                  {it.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. INCLUSÕES & EXCLUSÕES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {proposal.includes && proposal.includes.length > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
              <CheckCircle size={14} weight="bold" className="text-emerald-600" />
              O Que Está Incluso
            </span>
            <ul className="space-y-1 text-xs font-medium text-slate-800">
              {proposal.includes.map((inc, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-emerald-600 shrink-0" />
                  <span>{inc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {proposal.excludes && proposal.excludes.length > 0 && (
          <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1">
              <XCircle size={14} weight="bold" className="text-rose-600" />
              Não Incluso / Extras
            </span>
            <ul className="space-y-1 text-xs font-medium text-slate-700">
              {proposal.excludes.map((exc, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-rose-400 shrink-0" />
                  <span>{exc}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── 8. QUADRO DE INVESTIMENTO & PARCELAMENTO ── */}
      <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Investimento Total para o Grupo
          </span>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
            {formatMoney(totalCents)}
          </div>
          <span className="text-[11px] text-slate-300 block">
            Taxas de embarque inclusas • Sem juros no cartão
          </span>
        </div>

        {installments.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs">
            {installments.map((inst, i) => (
              <div
                key={i}
                className="px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-center"
              >
                <span className="text-[10px] text-slate-300 block uppercase font-mono">
                  {inst.installments_count}x de
                </span>
                <span className="font-bold font-mono text-white">
                  {formatMoney(
                    inst.installment_value_cents || Math.round(totalCents / inst.installments_count)
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 9. RODAPÉ DE TRANSPARÊNCIA & CONTATO ── */}
      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={16} className="text-slate-700 shrink-0" />
          <span>Valores sujeitos à alteração e confirmação de assentos no ato da reserva.</span>
        </div>

        {proposal.agency_whatsapp && (
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <WhatsappLogo size={16} weight="bold" className="text-emerald-600" />
            <span>Dúvidas? Fale com a gente: {proposal.agency_whatsapp}</span>
          </div>
        )}
      </div>
    </div>
  );
}
