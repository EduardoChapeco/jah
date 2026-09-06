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
import { cn } from "@/lib/utils";

interface ProposalCanvasRendererProps {
 proposal: TravelProposalDTO;
}

export function ProposalCanvasRenderer({ proposal }: ProposalCanvasRendererProps) {
 const isLandscape = proposal.canvas_format === "a4-landscape" || proposal.canvas_format === "presentation-169";
 const isStory = proposal.canvas_format === "story-916";
 const template = (proposal as any)?.template || "editorial-flat";
 const isDark = template === "dark-premium";
 const isCorporate = template === "executivo";

 const totalCents = proposal.pricing?.total_price_cents || 0;
 const installments = proposal.pricing?.installments_options || [];

 return (
 <div
 className={cn(
 "w-full font-sans p-6 sm:p-10 space-y-6 flex flex-col justify-between min-h-full transition-colors duration-200",
 isDark ? "bg-[#09090b] text-zinc-100" : "bg-white text-slate-900",
 isCorporate && "border-t-8 border-t-slate-900"
 )}
 >
 {/* ── 1. TOPO EDITORIAL / HEADER DA AGÊNCIA ── */}
 <div
 className={cn(
 "flex items-center justify-between pb-4 border-b",
 isDark ? "border-zinc-800" : "border-slate-200"
 )}
 >
 <div className="flex items-center gap-3">
 {proposal.agency_logo_url ? (
 <img
 src={proposal.agency_logo_url}
 alt={proposal.agency_name}
 className={cn(
 "h-10 w-auto object-contain rounded-lg max-w-[140px]",
 isDark && "brightness-0 invert"
 )}
 />
 ) : (
 <div
 className={cn(
 "size-10 rounded-xl font-black text-xs flex items-center justify-center shadow-xs",
 isDark ? "bg-amber-500 text-black font-bold" : "bg-slate-900 text-white"
 )}
 >
 {proposal.agency_name.slice(0, 2).toUpperCase()}
 </div>
 )}
 <div>
 <h4
 className={cn(
 "text-xs font-black tracking-tight uppercase",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 {proposal.agency_name}
 </h4>
 <span
 className={cn(
 "text-[10px] font-mono block",
 isDark ? "text-zinc-400" : "text-slate-500"
 )}
 >
 Proposta #{proposal.public_token}
 </span>
 </div>
 </div>

 <div className="text-right">
 <span
 className={cn(
 "text-[10px] font-mono uppercase tracking-wider block",
 isDark ? "text-zinc-500" : "text-slate-400"
 )}
 >
 Elaborado para
 </span>
 <span
 className={cn(
 "text-xs font-bold",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 {proposal.client_name}
 </span>
 </div>
 </div>

 {/* ── 2. CAPA PANORÂMICA & DESTINO ── */}
 <div className="relative rounded-2xl overflow-hidden bg-slate-900 text-white aspect-21/9 min-h-[180px] flex flex-col justify-end p-6 shadow-md">
 {proposal.cover_image_url ? (
 <img
 src={proposal.cover_image_url}
 alt={proposal.destination_city}
 className="absolute inset-0 size-full object-cover opacity-65"
 />
 ) : (
 <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-90" />
 )}

 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

 <div className="relative z-10 space-y-1">
 <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
 <MapPin size={12} weight="bold" />
 <span>{proposal.destination_city}</span>
 </div>
 <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-sm">
 {proposal.title}
 </h1>
 {proposal.subtitle && (
 <p className="text-xs text-white/90 font-medium max-w-xl drop-shadow-xs">
 {proposal.subtitle}
 </p>
 )}
 </div>
 </div>

 {/* ── 3. METADADOS DA VIAGEM: PASSAGEIROS & DATAS ── */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
 <div
 className={cn(
 "p-3 rounded-xl border space-y-0.5 transition-colors",
 isDark
 ? "bg-zinc-900/80 border-zinc-800"
 : "bg-slate-50 border-slate-200/80"
 )}
 >
 <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
 Quartos & Hóspedes
 </span>
 <div
 className={cn(
 "flex items-center gap-1.5 text-xs font-black",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 <Users size={14} className="text-primary shrink-0" />
 <span className="truncate">
 {proposal.rooms && proposal.rooms.length > 0
 ? `${proposal.rooms.length} ${proposal.rooms.length === 1 ? "Quarto" : "Quartos"} (${proposal.adults_count} adt${proposal.children_count > 0 ? `, ${proposal.children_count} chd` : ""})`
 : `${proposal.adults_count} Adultos${proposal.children_count > 0 ? ` + ${proposal.children_count} Crianças` : ""}`}
 </span>
 </div>
 </div>

 <div
 className={cn(
 "p-3 rounded-xl border space-y-0.5 transition-colors",
 isDark
 ? "bg-zinc-900/80 border-zinc-800"
 : "bg-slate-50 border-slate-200/80"
 )}
 >
 <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
 Período da Viagem
 </span>
 <div
 className={cn(
 "flex items-center gap-1.5 text-xs font-black",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 <CalendarDots size={14} className="text-primary shrink-0" />
 <span>
 {proposal.travel_start_date || "Data Flexível"}
 {proposal.travel_end_date ? ` até ${proposal.travel_end_date}` : ""}
 </span>
 </div>
 </div>

 <div
 className={cn(
 "p-3 rounded-xl border space-y-0.5 transition-colors",
 isDark
 ? "bg-zinc-900/80 border-zinc-800"
 : "bg-slate-50 border-slate-200/80"
 )}
 >
 <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
 Destino Principal
 </span>
 <div
 className={cn(
 "flex items-center gap-1.5 text-xs font-black truncate",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 <MapPin size={14} className="text-primary shrink-0" />
 <span className="truncate">{proposal.destination_city}</span>
 </div>
 </div>

 <div
 className={cn(
 "p-3 rounded-xl border space-y-0.5 transition-colors",
 isDark
 ? "bg-zinc-900/80 border-zinc-800"
 : "bg-slate-50 border-slate-200/80"
 )}
 >
 <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
 Validade da Cotação
 </span>
 <div className="flex items-center gap-1.5 text-xs font-black text-emerald-500">
 <Clock size={14} />
 <span>{proposal.valid_until || "Consulte agência"}</span>
 </div>
 </div>
 </div>

 {/* ── 4. MALHA AÉREA & VOOS (SE HOUVER) ── */}
 {proposal.flights && proposal.flights.length > 0 && (
 <div className="space-y-2.5">
 <div className="flex items-center gap-2">
 <AirplaneTilt size={16} weight="bold" className="text-primary" />
 <h3
 className={cn(
 "text-xs font-black uppercase tracking-wider",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 Voos & Conexões
 </h3>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {proposal.flights.map((f) => (
 <div
 key={f.id}
 className={cn(
 "p-3.5 rounded-xl border space-y-2",
 isDark
 ? "bg-zinc-900/90 border-zinc-800 text-zinc-100"
 : "border-slate-200 bg-slate-50/50 text-slate-900"
 )}
 >
 <div className="flex items-center justify-between text-xs font-bold">
 <span className="flex items-center gap-1.5">
 <span
 className={cn(
 "px-1.5 py-0.5 rounded text-[10px] font-mono",
 isDark ? "bg-zinc-800 text-amber-400" : "bg-slate-200 text-slate-800"
 )}
 >
 {f.type === "outbound" ? "IDA" : f.type === "return" ? "VOLTA" : "TRECHO"}
 </span>
 <span>{f.airline_name}</span>
 </span>
 <span className="text-[10px] font-mono text-muted-foreground">
 {f.flight_number || ""}
 </span>
 </div>

 <div className="flex items-center justify-between text-xs font-black">
 <div>
 <span className="text-sm font-mono">{f.origin_iata}</span>
 <span className="text-[10px] text-muted-foreground block font-normal">
 {f.departure_time}
 </span>
 </div>
 <div
 className={cn(
 "flex-1 mx-3 border-b-2 border-dashed relative text-center",
 isDark ? "border-zinc-700" : "border-slate-300"
 )}
 >
 <span
 className={cn(
 "text-[9px] font-mono px-1 relative -top-2",
 isDark ? "text-zinc-400 bg-zinc-900" : "text-slate-400 bg-white"
 )}
 >
 {f.stops_count === 0 ? "Voo Direto" : `${f.stops_count} escala(s)`}
 </span>
 </div>
 <div className="text-right">
 <span className="text-sm font-mono">{f.destination_iata}</span>
 <span className="text-[10px] text-muted-foreground block font-normal">
 {f.arrival_time}
 </span>
 </div>
 </div>

 {f.baggage_included && (
 <div
 className={cn(
 "text-[10px] font-medium flex items-center gap-1 pt-1 border-t",
 isDark ? "text-zinc-400 border-zinc-800" : "text-slate-600 border-slate-200/60"
 )}
 >
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
 <Buildings size={16} weight="bold" className="text-primary" />
 <h3
 className={cn(
 "text-xs font-black uppercase tracking-wider",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 Hospedagem & Acomodação
 </h3>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
 {proposal.hotels.map((h) => (
 <div
 key={h.id}
 className={cn(
 "p-3.5 rounded-xl border space-y-1.5",
 isDark
 ? "bg-zinc-900/90 border-zinc-800 text-zinc-100"
 : "border-slate-200 bg-slate-50/50 text-slate-900"
 )}
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-black">{h.hotel_name}</span>
 <span className="text-amber-500 text-xs font-bold">
 {"★".repeat(h.stars || 4)}
 </span>
 </div>
 <div className="text-xs text-muted-foreground font-medium">
 <span>Quarto: {h.room_type}</span> •{" "}
 <span className="font-bold text-foreground">
 {h.board_basis === "all_inclusive"
 ? "All Inclusive"
 : h.board_basis === "breakfast"
 ? "Café da Manhã Incluso"
 : h.board_basis === "half_board"
 ? "Meia Pensão"
 : "Sem Alimentação"}
 </span>
 </div>
 <div className="text-[10px] text-muted-foreground font-mono">
 {h.nights_count} noites ({h.checkin_date} a {h.checkout_date})
 </div>
 </div>
 ))}

 {/* Sub-bloco de Distribuição de Quartos (Rooming List) */}
 {proposal.rooms && proposal.rooms.length > 0 && (
 <div
 className={cn(
 "p-3 rounded-xl border space-y-2 col-span-full",
 isDark ? "bg-zinc-900/60 border-zinc-800" : "bg-white border-slate-200"
 )}
 >
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
 Distribuição de Acomodações ({proposal.rooms.length}{" "}
 {proposal.rooms.length === 1 ? "Quarto Selecionado" : "Quartos Selecionados"})
 </span>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
 {proposal.rooms.map((rm: any, idx: number) => (
 <div
 key={rm.id || idx}
 className={cn(
 "flex items-center justify-between p-2 rounded-lg border",
 isDark ? "bg-zinc-950 border-zinc-800 text-zinc-200" : "bg-slate-50 border-slate-200/70 text-slate-800"
 )}
 >
 <div className="flex items-center gap-1.5">
 <span className="size-2 rounded-full bg-emerald-500" />
 <span className="font-bold">Quarto {rm.roomNumber || idx + 1}</span>
 <span className="text-[10px] text-muted-foreground">
 ({rm.roomType || "Casal"})
 </span>
 </div>
 <span className="text-[11px] font-medium text-muted-foreground">
 {rm.adults} {rm.adults === 1 ? "Adulto" : "Adultos"}
 {rm.children > 0
 ? ` + ${rm.children} Chd${rm.childrenAges?.length > 0 ? ` (${rm.childrenAges.map((a: number) => `${a}a`).join(", ")})` : ""}`
 : ""}
 </span>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 {/* ── 6. ROTEIRO DIA A DIA (SE HOUVER) ── */}
 {proposal.itinerary && proposal.itinerary.length > 0 && (
 <div className="space-y-2.5">
 <div className="flex items-center gap-2">
 <CalendarDots size={16} weight="bold" className="text-primary" />
 <h3
 className={cn(
 "text-xs font-black uppercase tracking-wider",
 isDark ? "text-zinc-100" : "text-slate-900"
 )}
 >
 Programação Sugerida
 </h3>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
 {proposal.itinerary.map((it) => (
 <div
 key={it.id}
 className={cn(
 "p-3 rounded-xl border space-y-1",
 isDark
 ? "bg-zinc-900/80 border-zinc-800 text-zinc-100"
 : "border-slate-200 bg-slate-50/50 text-slate-900"
 )}
 >
 <span className="text-[10px] font-mono font-bold text-primary uppercase">
 Dia {it.day_number}
 </span>
 <p className="font-bold text-xs">{it.title}</p>
 <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
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
 <div
 className={cn(
 "p-3.5 rounded-xl border space-y-2",
 isDark
 ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-200"
 : "bg-emerald-50/60 border-emerald-200/80 text-slate-800"
 )}
 >
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
 <CheckCircle size={14} weight="bold" className="text-emerald-500" />
 O Que Está Incluso
 </span>
 <ul className="space-y-1 text-xs font-medium">
 {proposal.includes.map((inc, i) => (
 <li key={i} className="flex items-center gap-1.5">
 <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
 <span>{inc}</span>
 </li>
 ))}
 </ul>
 </div>
 )}

 {proposal.excludes && proposal.excludes.length > 0 && (
 <div
 className={cn(
 "p-3.5 rounded-xl border space-y-2",
 isDark
 ? "bg-rose-950/20 border-rose-800/40 text-rose-200"
 : "bg-rose-50/60 border-rose-200/80 text-slate-700"
 )}
 >
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
 <XCircle size={14} weight="bold" className="text-rose-500" />
 Não Incluso / Extras
 </span>
 <ul className="space-y-1 text-xs font-medium">
 {proposal.excludes.map((exc, i) => (
 <li key={i} className="flex items-center gap-1.5">
 <span className="size-1.5 rounded-full bg-rose-400 shrink-0" />
 <span>{exc}</span>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>

 {/* ── 8. QUADRO DE INVESTIMENTO & PARCELAMENTO ── */}
 <div
 className={cn(
 "p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md",
 isDark
 ? "bg-gradient-to-tr from-zinc-950 via-zinc-900 to-amber-950/30 border border-amber-500/40 text-white"
 : "bg-slate-900 text-white"
 )}
 >
 <div className="space-y-1">
 <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
 Investimento Total para o Grupo
 </span>
 <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-2">
 <span>{formatMoney(totalCents)}</span>
 {isDark && <ShieldCheck size={18} weight="fill" className="text-emerald-400" />}
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
 className={cn(
 "px-3 py-2 rounded-xl border text-center",
 isDark
 ? "bg-black/40 border-amber-500/30 text-amber-200"
 : "bg-white/10 border-white/10 text-white"
 )}
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
 <div
 className={cn(
 "pt-3 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px]",
 isDark ? "border-zinc-800 text-zinc-400" : "border-slate-200 text-slate-500"
 )}
 >
 <div className="flex items-center gap-1.5">
 <ShieldCheck size={16} className="text-primary shrink-0" />
 <span>Valores sujeitos à alteração e confirmação de assentos no ato da reserva.</span>
 </div>

 {proposal.agency_whatsapp && (
 <div className="flex items-center gap-1.5 font-bold text-foreground">
 <WhatsappLogo size={16} weight="bold" className="text-emerald-500" />
 <span>Dúvidas? Fale com a gente: {proposal.agency_whatsapp}</span>
 </div>
 )}
 </div>
 </div>
 );
}
