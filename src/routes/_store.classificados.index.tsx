import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  MagnifyingGlass,
  MapPin,
  Clock,
  Phone,
  Plus,
  CarProfile,
  House,
  Laptop,
  Armchair,
  Wrench,
  Sparkle,
  Bed,
  Car,
  Ruler,
  Users,
  Buildings,
  Tree,
  CalendarCheck,
  Truck,
  CreditCard,
  ArrowsLeftRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { formatMoney } from "@/lib/money";
import { listActiveBanners } from "@/services/banner.functions";
import { listActiveHotpages } from "@/services/hotpage.functions";
import { getPublicClassifieds } from "@/services/classifieds.functions";
import { CANONICAL_CITIES } from "@/lib/constants/cities";

export const Route = createFileRoute("/_store/classificados/")({
  head: () => ({
    meta: [
      { title: "Classificados, Imóveis & Hospedagem — JAH" },
      {
        name: "description",
        content:
          "Compre, alugue imóveis, reserve hospedagens por temporada estilo Airbnb, compre veículos e desapegos direto em Chapecó e região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, classifieds] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listActiveHotpages({ data: { module: "home" } }).catch(() => []),
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
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-2",
    title: "Hospedagem por Temporada",
    slug: "real_estate_temporada",
    cover_image_url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
    badge_label: "Estilo Airbnb",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-3",
    title: "Veículos & Autos",
    slug: "vehicle",
    cover_image_url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80",
    badge_label: "Carros & Motos",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-4",
    title: "Desapegos & Tech",
    slug: "sale",
    cover_image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    badge_label: "Eletrônicos",
    show_title: true,
    show_overlay: true,
  },
];

const CLASSIFIED_CHIPS = [
  { id: "todos", label: "Todos Anúncios", icon: Sparkle },
  { id: "real_estate", label: "Imóveis & Moradia", icon: House },
  { id: "vehicle", label: "Veículos & Autos", icon: CarProfile },
  { id: "sale", label: "Desapegos & Tech", icon: Laptop },
  { id: "service", label: "Serviços & B2B", icon: Wrench },
];

const REAL_ESTATE_DEAL_TYPES = [
  { id: "todos", label: "Todos Imóveis" },
  { id: "aluguel", label: "Aluguel Mensal" },
  { id: "venda", label: "Comprar / Venda" },
  { id: "temporada", label: "Hospedagem & Temporada" },
];

function ClassifiedsMasterPage() {
  const { banners, classifieds: initialClassifieds } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [selectedDealType, setSelectedDealType] = useState("todos");
  const [selectedCity, setSelectedCity] = useState("todos");
  const [selectedDelivery, setSelectedDelivery] = useState<"todos" | "local" | "shipping">("todos");
  const [onlyInstallments, setOnlyInstallments] = useState(false);
  const [onlyTrade, setOnlyTrade] = useState(false);
  const [search, setSearch] = useState("");

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
    // Filtro por busca de texto
    if (search) {
      const q = search.toLowerCase();
      const matchText =
        item.title?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        (item.location_name && item.location_name.toLowerCase().includes(q));
      if (!matchText) return false;
    }

    // Filtro por cidade canônica
    if (selectedCity !== "todos") {
      const itemCity = item.attributes?.city || item.location_name || "";
      if (!itemCity.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
    }

    // Filtro por modalidade de entrega
    if (selectedDelivery === "local") {
      const mode = item.attributes?.delivery_mode;
      if (mode !== "local_delivery" && mode !== "both" && mode !== undefined) {
        return false;
      }
    } else if (selectedDelivery === "shipping") {
      const mode = item.attributes?.delivery_mode;
      if (mode !== "shipping" && mode !== "both") {
        return false;
      }
    }

    // Filtro por parcelamento
    if (onlyInstallments) {
      const acceptsCard = item.attributes?.accepts_card;
      const maxInst = item.attributes?.max_installments;
      if (!acceptsCard || (maxInst && maxInst <= 1)) {
        return false;
      }
    }

    // Filtro por aceita troca
    if (onlyTrade) {
      if (!item.attributes?.accepts_trade) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="w-full space-y-8 pb-24">
      {/* 1. Banners Contextuais */}
      <section aria-label="Banners de Classificados">
        <BannerHeroCarousel banners={banners} />
      </section>

      {/* 2. Hotpages */}
      <section aria-label="Destaques de Classificados">
        <HotpagesRail
          hotpages={CLASSIFIEDS_HOTPAGES as any}
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

      {/* 3. Filtros Principais Squircle */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tag size={16} weight="bold" className="text-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Categorias Principais
            </h3>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar casa, apê, carro, chalé..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs bg-card"
              />
            </div>

            <Button asChild size="sm" className="rounded-xl font-bold gap-2 text-xs shrink-0 h-10 px-4 bg-foreground text-background">
              <Link to="/conta/classificados/novo">
                <Plus size={16} weight="bold" />
                <span>Anunciar Imóvel / Item</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Squircle Categories */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 w-full px-0.5">
          {CLASSIFIED_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(chip.id);
                  if (chip.id !== "real_estate") setSelectedDealType("todos");
                }}
                className={`min-w-[104px] sm:min-w-[124px] h-[94px] sm:h-[100px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all group ${
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-xs font-bold scale-102"
                    : "bg-card text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground hover:border-foreground/30 shadow-2xs"
                }`}
              >
                <div
                  className={`size-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                    isActive ? "bg-background/20 text-background" : "bg-muted text-foreground"
                  }`}
                >
                  <Icon size={20} weight={isActive ? "fill" : "bold"} />
                </div>
                <span className="text-xs font-bold text-center leading-tight line-clamp-1">
                  {chip.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Subfiltros de Imóveis (Aluguel, Venda, Temporada/Airbnb) ── */}
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
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono transition-all shrink-0 ${
                    isSelected
                      ? "bg-foreground text-background shadow-xs"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted border border-border"
                  }`}
                >
                  {dt.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Filtro por Cidades Principais ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1 pb-1">
          <span className="text-xs font-bold text-muted-foreground font-mono uppercase mr-1 flex items-center gap-1">
            <MapPin size={14} weight="bold" />
            <span>Cidade:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedCity("todos")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 ${
              selectedCity === "todos"
                ? "bg-foreground text-background shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            Todas Cidades
          </button>
          {CANONICAL_CITIES.slice(0, 8).map((city) => {
            const isSelected = selectedCity === city.name;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => setSelectedCity(isSelected ? "todos" : city.name)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 ${
                  isSelected
                    ? "bg-foreground text-background shadow-2xs font-bold"
                    : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                {city.name}
              </button>
            );
          })}
        </div>

        {/* ── Filtros Rápidos de Logística & Pagamento ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1 pb-1">
          <span className="text-xs font-bold text-muted-foreground font-mono uppercase mr-1 flex items-center gap-1">
            <Truck size={14} weight="bold" />
            <span>Condições:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedDelivery(selectedDelivery === "local" ? "todos" : "local")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 flex items-center gap-1.5 ${
              selectedDelivery === "local"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <Truck size={13} weight="bold" />
            <span>Entrega JAH Express</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedDelivery(selectedDelivery === "shipping" ? "todos" : "shipping")}
            className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 flex items-center gap-1.5 ${
              selectedDelivery === "shipping"
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <span>Envio Nacional</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyInstallments(!onlyInstallments)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 flex items-center gap-1.5 ${
              onlyInstallments
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <CreditCard size={13} weight="bold" />
            <span>Aceita Parcelamento</span>
          </button>

          <button
            type="button"
            onClick={() => setOnlyTrade(!onlyTrade)}
            className={`px-3 py-1 rounded-xl text-xs font-semibold font-mono transition-all shrink-0 flex items-center gap-1.5 ${
              onlyTrade
                ? "bg-primary text-primary-foreground shadow-2xs font-bold"
                : "bg-muted/60 text-muted-foreground hover:text-foreground border border-border"
            }`}
          >
            <ArrowsLeftRight size={13} weight="bold" />
            <span>Aceita Troca</span>
          </button>
        </div>
      </section>

      {/* 4. Grid de Anúncios */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <House size={40} className="text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Nenhum anúncio encontrado com estes filtros
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outra finalidade ou categoria no menu acima.
          </p>
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item: any) => {
            const img =
              item.images && item.images.length > 0
                ? item.images[0]
                : "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80";

            const isRealEstate = item.category === "real_estate";
            const isTemporada = item.deal_type === "temporada";
            const isAluguel = item.deal_type === "aluguel";

            return (
              <Link
                key={item.id}
                to="/classificados/$id"
                params={{ id: item.id }}
                className="group rounded-3xl border border-border bg-card overflow-hidden shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Imagem */}
                  <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                    <img
                      src={img}
                      alt={item.title}
                      className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {isRealEstate && (
                        <Badge
                          variant="secondary"
                          className={`text-[9px] uppercase font-mono font-bold px-2 py-0.5 backdrop-blur-md border-none ${
                            isTemporada
                              ? "bg-amber-500/90 text-white"
                              : isAluguel
                                ? "bg-blue-600/90 text-white"
                                : "bg-emerald-600/90 text-white"
                          }`}
                        >
                          {isTemporada
                            ? "Temporada (Airbnb)"
                            : isAluguel
                              ? "Aluguel Mensal"
                              : "Venda"}
                        </Badge>
                      )}
                      {!isRealEstate && (
                        <Badge variant="secondary" className="text-[9px] uppercase font-mono bg-black/60 text-white backdrop-blur-md border-none">
                          {item.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5 pt-1 space-y-2">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xl font-black text-foreground font-mono">
                        {formatMoney(item.price_cents || 0)}
                        {isAluguel && <span className="text-xs font-normal text-muted-foreground">/mês</span>}
                        {isTemporada && <span className="text-xs font-normal text-muted-foreground">/diária</span>}
                      </span>
                      {item.price_cents && item.attributes?.accepts_card && (item.attributes?.max_installments || 12) > 1 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ou {item.attributes?.max_installments || 12}x de {formatMoney(Math.round(item.price_cents / (item.attributes?.max_installments || 12)))}
                        </span>
                      )}
                    </div>

                    {/* Badges de Condições do Anúncio */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {(item.attributes?.delivery_mode === "local_delivery" || item.attributes?.delivery_mode === "both") && (
                        <Badge variant="outline" className="text-[9px] font-mono font-medium px-1.5 py-0 bg-muted/30">
                          <Truck size={10} weight="bold" className="mr-0.5" />
                          <span>Entrega JAH</span>
                        </Badge>
                      )}
                      {item.attributes?.accepts_trade && (
                        <Badge variant="secondary" className="text-[9px] font-mono font-medium px-1.5 py-0">
                          <ArrowsLeftRight size={10} weight="bold" className="mr-0.5" />
                          <span>Troca</span>
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:underline">
                      {item.title}
                    </h3>

                    {/* Especificações Imobiliárias Estruturadas */}
                    {isRealEstate && (
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono pt-1">
                        {isTemporada && item.max_guests > 0 && (
                          <span className="flex items-center gap-1">
                            <Users size={14} weight="bold" />
                            <span>Até {item.max_guests} hóspedes</span>
                          </span>
                        )}
                        {!isTemporada && item.bedrooms > 0 && (
                          <span className="flex items-center gap-1">
                            <Bed size={14} weight="bold" />
                            <span>{item.bedrooms} {item.bedrooms === 1 ? "quarto" : "quartos"}</span>
                          </span>
                        )}
                        {item.parking_spots > 0 && (
                          <span className="flex items-center gap-1">
                            <Car size={14} weight="bold" />
                            <span>{item.parking_spots} {item.parking_spots === 1 ? "vaga" : "vagas"}</span>
                          </span>
                        )}
                        {item.area_sqm > 0 && (
                          <span className="flex items-center gap-1">
                            <Ruler size={14} weight="bold" />
                            <span>{item.area_sqm} m²</span>
                          </span>
                        )}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>

                {/* Localização & Rodapé */}
                <div className="p-5 pt-3 text-xs text-muted-foreground font-mono flex items-center justify-between border-t border-border mt-2">
                  <span className="flex items-center gap-1.5 truncate">
                    <MapPin size={13} weight="bold" className="text-foreground shrink-0" />
                    <span className="truncate">{item.location_name || item.location_text || "Chapecó, SC"}</span>
                  </span>
                  <span className="text-foreground font-bold shrink-0 text-xs">Ver Detalhes ➔</span>
                </div>
              </Link>
            );
          })}
        </section>
      )}
    </div>
  );
}
