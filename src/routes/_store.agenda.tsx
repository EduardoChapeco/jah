import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDots,
  CalendarBlank,
  MapPin,
  MagnifyingGlass,
  Sparkle,
  X,
  CaretRight,
  Clock,
  Ticket,
  ForkKnife,
  Tag,
  GraduationCap,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getPublicEvents } from "@/services/events.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { formatDate } from "@/lib/datetime";

const EVENT_CATEGORIES = [
  { id: "todos", label: "Todas Categorias", icon: Sparkle },
  { id: "shows", label: "Shows & Festivais", icon: Ticket },
  { id: "gastronomico", label: "Gastronomia & Feiras", icon: ForkKnife },
  { id: "feiras", label: "Bazaares & Pets", icon: Tag },
  { id: "workshops", label: "Cursos & Workshops", icon: GraduationCap },
];

const PRESET_DATE_FILTERS = [
  { id: "all", label: "Todos os Dias" },
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "weekend", label: "Este Fim de Semana" },
  { id: "next7", label: "Próximos 7 Dias" },
  { id: "month", label: "Este Mês" },
];

const WEEKDAY_NAMES = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];
const MONTH_NAMES = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
];

export const Route = createFileRoute("/_store/agenda")({
  head: () => ({
    meta: [
      { title: "Agenda Cultural & Shows — JAH" },
      {
        name: "description",
        content: "Descubra os principais shows, festivais gastronômicos, feiras e workshops da cidade filtrados por dia.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages] = await Promise.all([
      listActiveBanners({ data: { placement: "agenda" } }).catch(() => []),
      listHotpages({ data: { module: "agenda" } }).catch(() => []),
    ]);
    return { banners, hotpages };
  },
  component: AgendaPage,
});

function AgendaPage() {
  const { banners, hotpages } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedDateFilter, setSelectedDateFilter] = useState("all"); // 'all' | 'today' | 'tomorrow' | 'weekend' | 'next7' | 'month' | 'YYYY-MM-DD'
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: events,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-events", selectedCategory],
    queryFn: () =>
      getPublicEvents({
        data: {
          limit: 50,
          category: selectedCategory === "todos" ? undefined : selectedCategory,
        },
      }),
    staleTime: 60_000,
  });

  // Gera a lista dos próximos 14 dias para o seletor de dias grande
  const nextDays = useMemo(() => {
    const days = [];
    const now = new Date();

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);

      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateKey = `${year}-${month}-${day}`;

      days.push({
        dateKey,
        dayNumber: d.getDate(),
        weekday: WEEKDAY_NAMES[d.getDay()],
        monthName: MONTH_NAMES[d.getMonth()],
        isToday: i === 0,
        isTomorrow: i === 1,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  }, []);

  // Filtra os eventos por Categoria, Dia/Período e Busca
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    const now = new Date();
    const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowIso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;

    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    return events.filter((e) => {
      const eventDate = new Date(e.event_date);
      const eventIso = e.event_date ? e.event_date.split("T")[0] : "";

      // 1. Filtro de Data
      if (selectedDateFilter === "today") {
        if (eventIso !== todayIso) return false;
      } else if (selectedDateFilter === "tomorrow") {
        if (eventIso !== tomorrowIso) return false;
      } else if (selectedDateFilter === "weekend") {
        const dayOfWeek = eventDate.getDay();
        const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (!((dayOfWeek === 0 || dayOfWeek === 6) && diffDays >= 0 && diffDays <= 7)) {
          return false;
        }
      } else if (selectedDateFilter === "next7") {
        if (eventDate < now || eventDate > next7Days) return false;
      } else if (selectedDateFilter === "month") {
        if (eventDate.getMonth() !== now.getMonth() || eventDate.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (selectedDateFilter !== "all") {
        // Data específica 'YYYY-MM-DD'
        if (eventIso !== selectedDateFilter) return false;
      }

      // 2. Filtro de Busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesDesc = e.description?.toLowerCase().includes(q);
        const matchesLoc = e.location?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesLoc) return false;
      }

      return true;
    });
  }, [events, selectedDateFilter, searchQuery]);

  // Contagem de eventos por dia para os badges
  const eventsCountByDateKey = useMemo(() => {
    const counts: Record<string, number> = {};
    if (!events) return counts;
    events.forEach((e) => {
      if (e.event_date) {
        const key = e.event_date.split("T")[0];
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [events]);

  const activeDateLabel = useMemo(() => {
    if (selectedDateFilter === "all") return "Todos os Dias";
    if (selectedDateFilter === "today") return "Hoje";
    if (selectedDateFilter === "tomorrow") return "Amanhã";
    if (selectedDateFilter === "weekend") return "Este Fim de Semana";
    if (selectedDateFilter === "next7") return "Próximos 7 Dias";
    if (selectedDateFilter === "month") return "Este Mês";
    const foundDay = nextDays.find((d) => d.dateKey === selectedDateFilter);
    if (foundDay) {
      return `${foundDay.weekday}, ${foundDay.dayNumber} de ${foundDay.monthName}`;
    }
    return selectedDateFilter;
  }, [selectedDateFilter, nextDays]);

  const isFilterActive = selectedDateFilter !== "all" || selectedCategory !== "todos" || searchQuery.trim() !== "";

  return (
    <div className="w-full space-y-7">
      {/* ── 1. Top Universal Banner Hero ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── 2. Hotpages & Categorias ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias">
          <HotpagesRail
            hotpages={hotpages}
            activeSlug={selectedCategory}
            onSelect={(slug) => setSelectedCategory(slug)}
          />
        </section>
      )}

      {/* ── 3. FILTRO DE DIAS PROEMINENTE & GRANDE (CANÔNICO) ── */}
      <section aria-label="Filtrar por Dias" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDots size={16} weight="bold" className="text-foreground" />
            <h2 className="text-sm font-bold text-foreground tracking-tight">
              Filtrar por Data & Programação
            </h2>
          </div>

          {/* Presets Rápidos */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto scrollbar-none">
            {PRESET_DATE_FILTERS.map((preset) => {
              const isSelected = selectedDateFilter === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedDateFilter(preset.id)}
                  className={`h-9 px-4 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-foreground text-background shadow-xs font-bold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Trilho Panorâmico de Cards de Dias Grandes (Squircle Inflado) ── */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none">
          {/* Card 'Todos os Dias' */}
          <button
            type="button"
            onClick={() => setSelectedDateFilter("all")}
            className={`min-w-[96px] sm:min-w-[104px] h-[100px] sm:h-[108px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all ${
              selectedDateFilter === "all"
                ? "bg-foreground text-background border-foreground shadow-md scale-102 font-bold"
                : "bg-card border-border text-foreground hover:bg-muted/60 hover:border-foreground/30"
            }`}
          >
            <span className="text-[11px] font-mono uppercase tracking-wider opacity-80">
              Geral
            </span>
            <CalendarDots size={20} weight="bold" className="my-0.5" />
            <span className="text-xs font-semibold">Todos</span>
          </button>

          {/* Cards dos Próximos 14 Dias */}
          {nextDays.map((day) => {
            const isSelected = selectedDateFilter === day.dateKey;
            const count = eventsCountByDateKey[day.dateKey] || 0;

            return (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelectedDateFilter(day.dateKey)}
                className={`min-w-[92px] sm:min-w-[100px] h-[100px] sm:h-[108px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all ${
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-md scale-102 font-bold"
                    : "bg-card border-border text-foreground hover:bg-muted/60 hover:border-foreground/30"
                }`}
              >
                {/* Header: Dia da Semana ou Badge 'Hoje' / 'Amanhã' */}
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase opacity-80">
                  {day.isToday ? "HOJE" : day.isTomorrow ? "AMANHÃ" : day.weekday}
                </span>

                {/* Número do Dia Bem Grande */}
                <span className="text-2xl sm:text-3xl font-black leading-none my-0.5">
                  {day.dayNumber}
                </span>

                {/* Footer: Mês e Indicador de Eventos */}
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-medium">
                  <span>{day.monthName}</span>
                  {count > 0 && (
                    <span
                      className={`size-2 rounded-full ${
                        isSelected ? "bg-background" : "bg-foreground"
                      }`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 4. BARRA DE CATEGORIAS & BUSCA ── */}
      <div className="space-y-4 pt-2 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tag size={16} weight="bold" className="text-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Categorias de Eventos
            </h3>
          </div>

          {/* Busca de Eventos */}
          <div className="relative w-full sm:w-72">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por show, local, artista..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl h-10 bg-background border-border text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Categorias Cards — Squircle Retangular Gordinho */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 w-full px-0.5">
          {EVENT_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-w-[104px] sm:min-w-[114px] h-[94px] sm:h-[100px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all group ${
                  isSelected
                    ? "bg-foreground text-background border-foreground shadow-xs font-bold scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/30 shadow-2xs"
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isSelected ? "bg-background/20 text-background" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon size={20} weight={isSelected ? "fill" : "bold"} />
                </div>
                <span className="text-xs font-bold text-center leading-tight line-clamp-1">
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── 5. Status do Filtro & Contador ── */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-2">
            <span>
              Exibindo <strong className="text-foreground">{filteredEvents.length}</strong> eventos para{" "}
              <strong className="text-foreground">{activeDateLabel}</strong>
            </span>
          </div>

          {isFilterActive && (
            <button
              type="button"
              onClick={() => {
                setSelectedDateFilter("all");
                setSelectedCategory("todos");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1 underline-offset-2 hover:underline cursor-pointer"
            >
              <X className="size-3" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 6. ESTADOS DE CARREGAMENTO, ERRO E VAZIO ── */}
      {isLoading && (
        <div className="flex justify-center py-24">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-2">
          <WarningCircle size={32} className="text-destructive mx-auto" />
          <p className="font-semibold text-foreground text-sm">Erro ao carregar a Agenda Cultural</p>
        </div>
      )}

      {!isLoading && !isError && filteredEvents.length === 0 && (
        <div className="py-20 text-center space-y-2.5 bg-muted/20 rounded-2xl border border-border p-8">
          <CalendarBlank size={36} className="text-muted-foreground/50 mx-auto" />
          <h2 className="text-sm font-semibold text-foreground">
            Nenhum evento agendado para {activeDateLabel}
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outro dia no calendário acima ou limpar os filtros de busca.
          </p>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedDateFilter("all");
                setSelectedCategory("todos");
                setSearchQuery("");
              }}
              className="rounded-xl text-xs"
            >
              Ver Todos os Eventos
            </Button>
          </div>
        </div>
      )}

      {/* ── 7. GRADE DE EVENTOS ── */}
      {!isLoading && !isError && filteredEvents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs hover:border-foreground/20 transition-colors group"
            >
              {/* Cover Image */}
              <div className="aspect-16/10 relative overflow-hidden bg-muted">
                {event.cover_image && (
                  <img
                    src={event.cover_image}
                    alt={event.title}
                    className="absolute inset-0 size-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20">
                    {formatDate(event.event_date)}
                  </span>
                </div>

                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-sm font-semibold text-white leading-tight drop-shadow-xs line-clamp-2">
                    {event.title}
                  </h3>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4 flex flex-col gap-3 flex-1 justify-between text-xs">
                <div className="space-y-1.5">
                  {event.location && (
                    <p className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin size={14} className="shrink-0 text-foreground" />
                      <span className="truncate">{event.location}</span>
                    </p>
                  )}

                  {event.description && (
                    <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border">
                  <Badge variant={(event as any).is_free ? "secondary" : "outline"} className="text-[10px]">
                    {(event as any).is_free ? "Gratuito" : "Ingresso Pago"}
                  </Badge>

                  <Button asChild size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                    <Link to="/evento/$id" params={{ id: event.id }}>
                      <span>Detalhes</span>
                      <CaretRight size={14} className="ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
