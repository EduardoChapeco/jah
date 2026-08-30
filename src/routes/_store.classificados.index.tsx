import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  MagnifyingGlass,
  MapPin,
  Clock,
  Plus,
  CarProfile,
  House,
  Laptop,
  Wrench,
  Sparkle,
  Bed,
  Car,
  Ruler,
  Users,
  Truck,
  CreditCard,
  ArrowsLeftRight,
  Play,
  SquaresFour,
  ListDashes,
  Flame,
  ArrowRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { ContextualStoriesRail } from "@/components/stories/contextual-stories-rail";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";
import { formatMoney } from "@/lib/money";
import { listActiveBanners } from "@/services/banner.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { getPublicClassifieds } from "@/services/classifieds.functions";
import { CANONICAL_CITIES } from "@/lib/constants/cities";
import { resolveNicheDepartments } from "@/lib/niche-helpers";

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

export const Route = createFileRoute("/_store/classificados/")({
  head: () => ({
    meta: [
      { title: "Classificados, Imóveis & Hospedagem — Wider" },
      {
        name: "description",
        content:
          "Compre, alugue imóveis, reserve hospedagens por temporada, veículos e serviços na sua região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, classifieds] = await Promise.all([
      listActiveBanners({ data: { placement: "classificados" } }).catch(() => []),
      listHotpages({ data: { module: "classificados" } }).catch(() => []),
      getPublicClassifieds().catch(() => []),
    ]);

    return { banners, hotpages, classifieds };
  },
  component: ClassifiedsMasterPage,
});

const CLASSIFIEDS_HOTPAGES = [
  {
    id: "hp-class-1",
    title: "Imóveis & Moradia",
    slug: "real_estate",
    cover_image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    badge_label: "Venda & Aluguel",
    show_title: false,
    show_overlay: false,
  },
  {
    id: "hp-class-2",
    title: "Hospedagem por Temporada",
    slug: "real_estate_temporada",
    cover_image_url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
    badge_label: "Diária & Temporada",
    show_title: false,
    show_overlay: false,
  },
  {
    id: "hp-class-3",
    title: "Veículos & Autos",
    slug: "vehicle",
    cover_image_url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80",
    badge_label: "Carros & Motos",
    show_title: false,
    show_overlay: false,
  },
  {
    id: "hp-class-4",
    title: "Desapegos & Tech",
    slug: "sale",
    cover_image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    badge_label: "Eletrônicos",
    show_title: false,
    show_overlay: false,
  },
];

const CLASSIFIED_CHIPS: FilterChipOption[] = [
  { id: "todos", label: "Todos", emoji: "🏷️", icon: Sparkle },
  { id: "real_estate", label: "Imóveis & Moradia", emoji: "🏠", icon: House },
  { id: "vehicle", label: "Veículos & Autos", emoji: "🚗", icon: CarProfile },
  { id: "sale", label: "Desapegos & Tech", emoji: "💻", icon: Laptop },
  { id: "service", label: "Serviços & B2B", emoji: "🛠️", icon: Wrench },
];

const REAL_ESTATE_DEAL_TYPES = [
  { id: "todos", label: "Todos Imóveis" },
  { id: "aluguel", label: "Aluguel Mensal" },
  { id: "venda", label: "Comprar / Venda" },
  { id: "temporada", label: "Hospedagem & Temporada" },
];

function ClassifiedsMasterPage() {
  const { banners, hotpages, classifieds: initialClassifieds } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedDealType, setSelectedDealType] = useState("todos");
  const [selectedCity, setSelectedCity] = useState("todos");
  const [selectedDelivery, setSelectedDelivery] = useState<"todos" | "local" | "shipping">("todos");
  const [onlyInstallments, setOnlyInstallments] = useState(false);
  const [onlyTrade, setOnlyTrade] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewModeType>("feed");

  const { data: classifieds } = useQuery({
    queryKey: ["classifieds-master-list", selectedCategory, selectedDealType, search],
    queryFn: () =>
      getPublicClassifieds({
        data: {
          category: selectedCategory !== "todos" ? selectedCategory : undefined,
          dealType: selectedCategory === "real_estate" && selectedDealType !== "todos" ? selectedDealType : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialClassifieds,
  });

  const filtered = (classifieds || []).filter((item: any) => {
    if (selectedCategory !== "todos" && item.category !== selectedCategory) {
      return false;
    }
    if (selectedCategory === "real_estate" && selectedDealType !== "todos") {
      if (item.deal_type !== selectedDealType) return false;
    }
    if (selectedCity !== "todos") {
      const city = item.location_name || item.location_text || "";
      if (!city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    }
    if (selectedDelivery === "local") {
      const mode = item.attributes?.delivery_mode;
      if (mode !== "local_delivery" && mode !== "both") return false;
    } else if (selectedDelivery === "shipping") {
      const mode = item.attributes?.delivery_mode;
      if (mode !== "national_shipping" && mode !== "both") return false;
    }
    if (onlyInstallments) {
      const acceptsCard = item.attributes?.accepts_card;
      const maxInst = item.attributes?.max_installments;
      if (!acceptsCard || (maxInst && maxInst <= 1)) return false;
    }
    if (onlyTrade) {
      if (!item.attributes?.accepts_trade) return false;
    }
    return true;
  });

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. Banners Contextuais */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners de Classificados">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* 1.5. Stories de Desapegos & Oportunidades P2P */}
      <ContextualStoriesRail niche="classificados" className="py-1" />

      {/* 2. Hotpages */}
      {(hotpages?.length > 0 || CLASSIFIEDS_HOTPAGES.length > 0) && (
        <section aria-label="Destaques de Classificados">
          <HotpagesRail
            hotpages={(hotpages && hotpages.length > 0 ? hotpages : CLASSIFIEDS_HOTPAGES) as any}
            activeSlug={selectedCategory}
            onSelect={(slug) => {
              if (slug === "real_estate_temporada") {
                setSelectedCategory("real_estate");
                setSelectedDealType("temporada");
              } else {
                setSelectedCategory(slug);
                setSelectedDealType("todos");
              }
            }}
          />
        </section>
      )}

      <DiscoveryControlBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar casa, apê, carro, chalé, desapego..."
        categories={CLASSIFIED_CHIPS}
        activeCategory={selectedCategory}
        onSelectCategory={(id) => {
          setSelectedCategory(id);
          if (id !== "real_estate") setSelectedDealType("todos");
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allowedViewModes={["grid", "list", "feed"]}
        resultsCount={filtered.length}
      />

        {/* Subfiltros de Imóveis */}
        {selectedCategory === "real_estate" && (
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1 pb-1">
            <span className="text-xs font-bold text-muted-foreground font-mono uppercase mr-1">
              Finalidade:
            </span>
            {REAL_ESTATE_DEAL_TYPES.map((dt) => {
              const isSelected = selectedDealType === dt.id;
              return (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => setSelectedDealType(dt.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition-all shrink-0 ${
                    isSelected
                      ? "bg-foreground text-background "
                      : "bg-muted/60 text-muted-foreground hover:text-foreground "
                  }`}
                >
                  {dt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Filtros Rápidos (Cidades) */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1  pt-2">
          <button
            type="button"
            onClick={() => setSelectedCity("todos")}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
              selectedCity === "todos"
                ? "bg-foreground text-background  font-bold"
                : "bg-muted/40 text-muted-foreground hover:text-foreground "
            }`}
          >
            Todas Cidades
          </button>
          {CANONICAL_CITIES.slice(0, 6).map((city) => {
            const isSelected = selectedCity === city.name;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(isSelected ? "todos" : city.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                  isSelected
                    ? "bg-foreground text-background  font-bold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground "
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

      {/* 4. Lista / Grade / Feed de Anúncios */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
          <House size={40} className="text-muted-foreground/40 mx-auto" />
          <h2 className="text-sm font-bold text-foreground">
            Nenhum anúncio encontrado com estes filtros
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente alterar os termos da busca ou selecionar outra categoria.
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* ── MODO LISTA (100% Largura: Título, Preço, Tags à esquerda; Foto Squircle Generosa à direita) ── */
        <section className="flex flex-col space-y-3 w-full">
          {filtered.map((item: any) => {
            const img = item.images?.[0] || "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80";
            const isTemporada = item.deal_type === "temporada";
            const isAluguel = item.deal_type === "aluguel";

            return (
              <Link
                key={item.id}
                to="/classificados/$id"
                params={{ id: item.id }}
                className="group flex flex-col sm:flex-row items-stretch justify-between rounded-2xl border border-border/60 bg-card hover:border-foreground/30 transition-all overflow-hidden p-0 cursor-pointer w-full"
              >
                {/* Lado Esquerdo: Foto 100% FULL BLEED */}
                <div className="relative w-full sm:w-56 md:w-64 h-44 sm:h-auto min-h-[140px] overflow-hidden bg-muted shrink-0">
                  <img
                    src={img}
                    alt={item.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
                    {item.deal_type && (
                      <Badge className="bg-background/95 backdrop-blur-md text-foreground font-mono text-[9px] uppercase font-bold  px-1.5 py-0.5 rounded-md ">
                        {isTemporada ? "Temporada" : isAluguel ? "Aluguel" : "Venda"}
                      </Badge>
                    )}
                    {item.attributes?.delivery_mode && (
                      <Badge className="bg-emerald-600 text-white text-[9px] font-mono px-1.5 py-0.5 rounded-md ">
                        Entrega Wider
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Lado Direito: Informações Objetivas (Título, Preço, Localização, Tags) com Padding Interno */}
                <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.attributes?.accepts_trade && (
                        <Badge variant="secondary" className="text-[9px] font-mono px-1.5 py-0 rounded-md">
                          Aceita Troca
                        </Badge>
                      )}
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>

                    <div className="flex items-baseline gap-2 pt-0.5">
                      <span className="text-base sm:text-lg font-black text-foreground font-mono">
                        {formatMoney(item.price_cents || 0)}
                        {isAluguel && <span className="text-[10px] font-normal text-muted-foreground">/mês</span>}
                        {isTemporada && <span className="text-[10px] font-normal text-muted-foreground">/dia</span>}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2 ">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin size={12} weight="bold" className="shrink-0 text-primary" />
                      <span className="truncate">{item.location_name || item.location_text || "Regional"}</span>
                    </span>
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors hidden sm:inline">
                      Ver Anúncio →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>
      ) : viewMode === "feed" ? (
        /* ── MODO FEED (Carrosséis Padronizados com HorizontalRail) ── */
        <section className="space-y-10">
          {["real_estate", "vehicle", "sale", "service"].map((catKey) => {
            const catItems = filtered.filter((i: any) => i.category === catKey);
            if (catItems.length === 0) return null;

            const catTitle =
              catKey === "real_estate"
                ? "Imóveis & Moradia"
                : catKey === "vehicle"
                  ? "Veículos & Autos"
                  : catKey === "sale"
                    ? "Desapegos & Tech"
                    : "Serviços & B2B";

            return (
              <HorizontalRail
                key={catKey}
                title={catTitle}
                hideHeader={true}
                badge={`${catItems.length} ${catItems.length === 1 ? "anúncio" : "anúncios"}`}
                actionLabel="Ver todos"
                onAction={() => {
                  setSelectedCategory(catKey);
                  setViewMode("grid");
                }}
              >
                {catItems.map((item: any) => {
                  const img = item.images?.[0] || "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80";
                  const isTemporada = item.deal_type === "temporada";
                  const isAluguel = item.deal_type === "aluguel";

                  return (
                    <div
                      key={item.id}
                      className="min-w-[290px] sm:min-w-[320px] max-w-[340px] rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between shrink-0 group"
                    >
                      <Link
                        to="/classificados/$id"
                        params={{ id: item.id }}
                        className="space-y-3 block focus-visible:outline-none"
                      >
                        {/* Imagem de Capa do Anúncio */}
                        <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                          <img
                            src={img}
                            alt={item.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            {item.deal_type && (
                              <Badge className="bg-background/90 text-foreground backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase font-mono">
                                {isTemporada ? "Temporada" : isAluguel ? "Aluguel" : "Venda"}
                              </Badge>
                            )}
                            {item.attributes?.delivery_mode && (
                              <Badge className="bg-emerald-600/90 text-white text-[9px] font-mono px-2 py-0.5 rounded-lg">
                                Entrega Wider
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Dados do Anúncio */}
                        <div className="px-4 space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-base sm:text-lg font-black text-foreground font-mono">
                              {formatMoney(item.price_cents || 0)}
                              {isAluguel && <span className="text-xs font-normal text-muted-foreground">/mês</span>}
                              {isTemporada && <span className="text-xs font-normal text-muted-foreground">/dia</span>}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {item.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono pt-0.5">
                            <MapPin size={13} weight="bold" className="shrink-0 text-foreground" />
                            <span className="truncate">{item.location_name || item.location_text || "Regional"}</span>
                          </div>
                        </div>
                      </Link>

                      {/* Botão de Ação Rápida */}
                      <div className="p-4 pt-3 mt-2 flex items-center justify-between gap-2">
                        <Button
                          asChild
                          size="sm"
                          className="w-full h-9 rounded-xl font-bold text-xs bg-foreground text-background hover:bg-foreground/90 transition-all"
                        >
                          <Link to="/classificados/$id" params={{ id: item.id }}>
                            <span>Ver Detalhes</span>
                            <ArrowRight size={14} weight="bold" className="ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </HorizontalRail>
            );
          })}

          {/* Gôndola Geral de Classificados no Final */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Tag size={18} weight="bold" className="text-primary" />
                <span>Todos os Anúncios e Desapegos</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono font-bold">
                {filtered.length} anúncios ativos
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((item: any) => {
                const img = item.images?.[0] || "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80";
                const isTemporada = item.deal_type === "temporada";
                const isAluguel = item.deal_type === "aluguel";

                return (
                  <Link
                    key={item.id}
                    to="/classificados/$id"
                    params={{ id: item.id }}
                    className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                        <img
                          src={img}
                          alt={item.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {item.deal_type && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] uppercase font-mono font-bold px-1.5 py-0 bg-black/60 text-white backdrop-blur-md border-none"
                            >
                              {isTemporada ? "Temporada" : isAluguel ? "Aluguel" : "Venda"}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-3 space-y-1">
                        <span className="text-base font-black text-foreground font-mono block">
                          {formatMoney(item.price_cents || 0)}
                          {isAluguel && <span className="text-[10px] font-normal text-muted-foreground">/mês</span>}
                          {isTemporada && <span className="text-[10px] font-normal text-muted-foreground">/dia</span>}
                        </span>

                        <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-tight group-hover:underline">
                          {item.title}
                        </h3>
                      </div>
                    </div>

                    <div className="px-3 pb-2.5 text-[10px] text-muted-foreground font-mono flex items-center justify-between pt-1.5 mt-1">
                      <span className="flex items-center gap-1 truncate">
                        <MapPin size={10} weight="bold" className="shrink-0 text-foreground" />
                        <span className="truncate">{item.location_name || item.location_text || "Regional"}</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* ── MODO GRADE (Cards Compactos e Limpos — Imagem + Título + Preço + Tags, SEM textos de blog) ── */
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {filtered.map((item: any) => {
            const img = item.images?.[0] || "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80";
            const isTemporada = item.deal_type === "temporada";
            const isAluguel = item.deal_type === "aluguel";

            return (
              <Link
                key={item.id}
                to="/classificados/$id"
                params={{ id: item.id }}
                className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between cursor-pointer"
              >
                <div>
                  {/* Imagem Squircle Compacta */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt={item.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {item.deal_type && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] uppercase font-mono font-bold px-1.5 py-0 bg-black/60 text-white backdrop-blur-md border-none"
                        >
                          {isTemporada ? "Temporada" : isAluguel ? "Aluguel" : "Venda"}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo Objetivo: Preço + Título + Tags */}
                  <div className="p-3 space-y-1">
                    <span className="text-base font-black text-foreground font-mono block">
                      {formatMoney(item.price_cents || 0)}
                      {isAluguel && <span className="text-[10px] font-normal text-muted-foreground">/mês</span>}
                      {isTemporada && <span className="text-[10px] font-normal text-muted-foreground">/dia</span>}
                    </span>

                    <h3 className="text-xs font-bold text-foreground line-clamp-2 leading-tight group-hover:underline">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Rodapé Compacto com Localização */}
                <div className="px-3 pb-2.5 text-[10px] text-muted-foreground font-mono flex items-center justify-between  pt-1.5 mt-1">
                  <span className="flex items-center gap-1 truncate">
                    <MapPin size={10} weight="bold" className="shrink-0 text-foreground" />
                    <span className="truncate">{item.location_name || item.location_text || "Chapecó"}</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
