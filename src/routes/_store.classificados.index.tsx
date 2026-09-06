import {
  Tag,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Check,
  Home,
  Car as CarIcon,
  Laptop as LaptopIcon,
  Wrench as WrenchIcon,
} from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  MagnifyingGlass,
  MapPin,
  Clock,
  Plus,
  Bed,
  Car,
  Ruler,
  Users,
  Truck,
  CreditCard,
  ArrowsLeftRight,
  SquaresFour,
  ListDashes,
  Flame,
  ArrowRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
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
import { resolveClassifiedNiche } from "@/lib/classifieds/semantics";

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

export const Route = createFileRoute("/_store/classificados/")({
  head: () => ({
    meta: [
      { title: "Classificados, Imóveis & Desapegos | Wider" },
      {
        name: "description",
        content:
          "Compre, alugue imóveis, reserve hospedagens por temporada, veículos e serviços na sua região.",
      },
    ],
  }),
  loader: async () => {
    try {
      const [banners, hotpages, classifieds] = await Promise.all([
        listActiveBanners({ data: { placement: "classificados" } }).catch(() => []),
        listHotpages({ data: { module: "classificados" } }).catch(() => []),
        getPublicClassifieds({ data: {} }).catch(() => []),
      ]);

      return {
        banners: banners || [],
        hotpages: hotpages || [],
        classifieds: classifieds || [],
      };
    } catch (err) {
      console.warn("[classificados] Loader fallback acionado:", err);
      return { banners: [], hotpages: [], classifieds: [] };
    }
  },
  component: ClassifiedsMasterPage,
});

const CLASSIFIEDS_HOTPAGES = [
  {
    id: "hp-class-1",
    title: "Imóveis & Moradia",
    slug: "real_estate",
    cover_image_url: "",
    badge_label: "Venda & Aluguel",
    show_title: false,
    show_overlay: false,
  },
  {
    id: "hp-class-2",
    title: "Hospedagem por Temporada",
    slug: "real_estate_temporada",
    cover_image_url: "",
    badge_label: "Diária & Temporada",
    show_title: false,
    show_overlay: false,
  },
  {
    id: "hp-class-3",
    title: "Veículos & Autos",
    slug: "vehicle",
    cover_image_url: "",
    badge_label: "Carros & Motos",
    show_title: false,
    show_overlay: false,
  },
  {
    id: "hp-class-4",
    title: "Desapegos & Tech",
    slug: "sale",
    cover_image_url: "",
    badge_label: "Eletrônicos",
    show_title: false,
    show_overlay: false,
  },
];

const CLASSIFIED_CHIPS: FilterChipOption[] = [
  { id: "todos", label: "Todos", emoji: "🏷️", icon: Tag },
  { id: "real_estate", label: "Imóveis & Moradia", emoji: "🏠", icon: Home },
  { id: "vehicle", label: "Veículos & Autos", emoji: "🚗", icon: CarIcon },
  { id: "sale", label: "Desapegos & Tech", emoji: "💻", icon: LaptopIcon },
  { id: "digital", label: "Produtos Digitais", emoji: "📁", icon: FileText },
  { id: "service", label: "Serviços & B2B", emoji: "🛠️", icon: WrenchIcon },
];

const REAL_ESTATE_DEAL_TYPES = [
  { id: "todos", label: "Todos Imóveis" },
  { id: "aluguel", label: "Aluguel Mensal" },
  { id: "venda", label: "Comprar / Venda" },
  { id: "temporada", label: "Hospedagem & Temporada" },
];

const REAL_ESTATE_FACETS = [
  { id: "furnished", label: "Mobiliado" },
  { id: "garage", label: "Garagem / Vaga" },
  { id: "pool", label: "Piscina" },
  { id: "air_conditioning", label: "Ar Condicionado" },
];

const VEHICLE_GEARBOX_OPTIONS = [
  { id: "todos", label: "Todos Câmbios" },
  { id: "automatic", label: "Automático" },
  { id: "manual", label: "Manual" },
];

const VEHICLE_FUEL_OPTIONS = [
  { id: "todos", label: "Todos Combustíveis" },
  { id: "flex", label: "Flex" },
  { id: "gasolina", label: "Gasolina" },
  { id: "eletrico", label: "Elétrico / Híbrido" },
  { id: "diesel", label: "Diesel" },
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

  // Facetas Especializadas de Imóveis
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // Facetas Especializadas de Veículos
  const [vehicleGearbox, setVehicleGearbox] = useState<string>("todos");
  const [vehicleFuel, setVehicleFuel] = useState<string>("todos");
  const [onlySingleOwner, setOnlySingleOwner] = useState(false);

  // Faceta de Produtos Digitais
  const [onlyInstantDigital, setOnlyInstantDigital] = useState(false);

  const toggleAmenity = (id: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const { data: classifieds } = useQuery({
    queryKey: ["classifieds-master-list", selectedCategory, selectedDealType, search],
    queryFn: () =>
      getPublicClassifieds({
        data: {
          category: selectedCategory !== "todos" && selectedCategory !== "digital" ? selectedCategory : undefined,
          dealType: selectedCategory === "real_estate" && selectedDealType !== "todos" ? selectedDealType : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialClassifieds,
  });

  const filtered = (classifieds || []).filter((item: any) => {
    // Tratamento de Categoria
    if (selectedCategory === "digital") {
      const isDigital = item.is_digital || item.category === "digital" || item.attributes?.is_digital;
      if (!isDigital) return false;
    } else if (selectedCategory !== "todos" && item.category !== selectedCategory) {
      return false;
    }

    if (selectedCategory === "real_estate" && selectedDealType !== "todos") {
      if (item.deal_type !== selectedDealType) return false;
    }

    // Filtro Facetado de Imóveis (Mobiliado, Garagem, Piscina, Ar Condicionado)
    if (selectedCategory === "real_estate" && selectedAmenities.length > 0) {
      const rawAmenities = item.amenities || item.attributes?.amenities || [];
      const itemAmenities = Array.isArray(rawAmenities)
        ? rawAmenities.map((a: any) => String(a).toLowerCase())
        : [String(rawAmenities).toLowerCase()];
      
      const contentLower = `${item.title || ""} ${item.content || ""}`.toLowerCase();

      const hasAll = selectedAmenities.every((amenity) => {
        if (amenity === "furnished") {
          return itemAmenities.includes("furnished") || itemAmenities.includes("mobiliado") || contentLower.includes("mobiliado");
        }
        if (amenity === "garage") {
          return itemAmenities.includes("garage") || itemAmenities.includes("garagem") || itemAmenities.includes("vaga") || contentLower.includes("garagem") || contentLower.includes("vaga");
        }
        if (amenity === "pool") {
          return itemAmenities.includes("pool") || itemAmenities.includes("piscina") || contentLower.includes("piscina");
        }
        if (amenity === "air_conditioning") {
          return itemAmenities.includes("air_conditioning") || itemAmenities.includes("ar condicionado") || contentLower.includes("ar condicionado") || contentLower.includes("ar-condicionado");
        }
        return true;
      });

      if (!hasAll) return false;
    }

    // Filtro Facetado de Veículos (Câmbio, Combustível, Único Dono)
    if (selectedCategory === "vehicle") {
      if (vehicleGearbox !== "todos") {
        const trans = String(item.attributes?.transmission || item.attributes?.gearbox || "").toLowerCase();
        if (!trans.includes(vehicleGearbox.toLowerCase())) return false;
      }
      if (vehicleFuel !== "todos") {
        const fuel = String(item.attributes?.fuel_type || item.attributes?.fuel || "").toLowerCase();
        if (!fuel.includes(vehicleFuel.toLowerCase())) return false;
      }
      if (onlySingleOwner) {
        const isSingle = !!(item.attributes?.single_owner || item.attributes?.unico_dono);
        if (!isSingle) return false;
      }
    }

    // Cidade
    if (selectedCity !== "todos") {
      const city = item.location_name || item.location_text || "";
      if (!city.toLowerCase().includes(selectedCity.toLowerCase())) return false;
    }

    // Entrega / Retirada
    if (selectedDelivery === "local") {
      const mode = item.attributes?.delivery_mode || item.delivery_mode;
      if (mode !== "local_delivery" && mode !== "both") return false;
    } else if (selectedDelivery === "shipping") {
      const mode = item.attributes?.delivery_mode || item.delivery_mode;
      if (mode !== "national_shipping" && mode !== "both") return false;
    }

    // Condições Comerciais
    if (onlyInstallments) {
      const acceptsCard = item.attributes?.accepts_card ?? item.accepts_card;
      const maxInst = item.attributes?.max_installments ?? item.max_installments;
      if (!acceptsCard || (maxInst && maxInst <= 1)) return false;
    }
    if (onlyTrade) {
      const acceptsTrade = item.attributes?.accepts_trade ?? item.accepts_trade;
      if (!acceptsTrade) return false;
    }
    if (onlyInstantDigital) {
      const isDig = item.is_digital || item.category === "digital" || item.attributes?.is_digital;
      if (!isDig) return false;
    }

    return true;
  });

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. Banners Contextuais no Topo */}
      {banners && banners.length > 0 && (
        <section aria-label="Banners de Classificados">
          <BannerHeroCarousel banners={banners} />
        </section>
      )}

      {/* 2. Hotpages Horizontal Rail */}
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

      {/* 3. Layout Desktop Two-Column (Sidebar à esquerda + Feed/Grid à direita) */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-8">
        {/* ── COLUNA ESQUERDA (DESKTOP STICKY SIDEBAR) ── */}
        <aside className="hidden lg:flex flex-col w-72 shrink-0 space-y-6 sticky top-20 self-start">
          {/* CTA Publicar Anúncio */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <Link
              to="/conta/classificados/novo"
              className="w-full h-11 rounded-xl bg-foreground text-background font-bold text-sm flex items-center justify-center gap-2 hover:bg-foreground/90 transition-all cursor-pointer shadow-sm"
            >
              <Plus size={18} weight="bold" />
              <span>Publicar Anúncio</span>
            </Link>

            <Link
              to="/conta/classificados"
              className="text-xs text-center text-muted-foreground hover:text-foreground font-mono block transition-colors"
            >
              Gerenciar Meus Anúncios →
            </Link>
          </div>

          {/* Categorias Principais */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
            <span className="text-[11px] font-bold font-mono uppercase text-muted-foreground tracking-wider block">
              Categorias
            </span>
            <div className="flex flex-col space-y-1">
              {CLASSIFIED_CHIPS.map((chip) => {
                const Icon = chip.icon;
                const isSelected = selectedCategory === chip.id;
                const count = chip.id === "todos" 
                  ? (classifieds || []).length 
                  : (classifieds || []).filter((c: any) => c.category === chip.id).length;

                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(chip.id);
                      if (chip.id !== "real_estate") setSelectedDealType("todos");
                    }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      isSelected
                        ? "bg-foreground text-background font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-4 shrink-0" />
                      <span>{chip.label}</span>
                    </div>
                    <span className="font-mono text-[10px] opacity-70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subfiltro de Imóveis & Facetas de Comodidades (quando ativo) */}
          {selectedCategory === "real_estate" && (
            <>
              <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
                <span className="text-[11px] font-bold font-mono uppercase text-muted-foreground tracking-wider block">
                  Finalidade
                </span>
                <div className="flex flex-col space-y-1">
                  {REAL_ESTATE_DEAL_TYPES.map((dt) => {
                    const isSelected = selectedDealType === dt.id;
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => setSelectedDealType(dt.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-mono text-left transition-all ${
                          isSelected
                            ? "bg-foreground text-background font-bold"
                            : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        }`}
                      >
                        {dt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Facetas de Imóveis */}
              <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2.5">
                <span className="text-[11px] font-bold font-mono uppercase text-muted-foreground tracking-wider block">
                  Facilidades do Imóvel
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {REAL_ESTATE_FACETS.map((facet) => {
                    const isChecked = selectedAmenities.includes(facet.id);
                    return (
                      <button
                        key={facet.id}
                        type="button"
                        onClick={() => toggleAmenity(facet.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-all text-left ${
                          isChecked
                            ? "bg-primary/10 text-primary font-bold border border-primary/30"
                            : "bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent"
                        }`}
                      >
                        <span>{facet.label}</span>
                        {isChecked && <Check className="size-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Facetas de Veículos & Autos (quando ativo) */}
          {selectedCategory === "vehicle" && (
            <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
              <span className="text-[11px] font-bold font-mono uppercase text-muted-foreground tracking-wider block">
                Especificações do Veículo
              </span>

              {/* Câmbio */}
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-mono">Câmbio</span>
                <div className="grid grid-cols-3 gap-1">
                  {VEHICLE_GEARBOX_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVehicleGearbox(opt.id)}
                      className={`py-1.5 px-1 rounded-lg text-[11px] font-mono text-center transition-all ${
                        vehicleGearbox === opt.id
                          ? "bg-foreground text-background font-bold"
                          : "bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label.replace("Todos Câmbios", "Todos")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Combustível */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] text-muted-foreground uppercase font-mono">Combustível</span>
                <div className="flex flex-wrap gap-1">
                  {VEHICLE_FUEL_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVehicleFuel(opt.id)}
                      className={`py-1 px-2 rounded-lg text-[11px] font-mono transition-all ${
                        vehicleFuel === opt.id
                          ? "bg-foreground text-background font-bold"
                          : "bg-muted/30 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label.replace("Todos Combustíveis", "Todos")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Único Dono */}
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="single-owner" className="text-xs text-foreground cursor-pointer">
                  Apenas Único Dono
                </Label>
                <Switch
                  id="single-owner"
                  checked={onlySingleOwner}
                  onCheckedChange={setOnlySingleOwner}
                />
              </div>
            </div>
          )}

          {/* Facetas de Produtos Digitais (quando ativo) */}
          {selectedCategory === "digital" && (
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
              <span className="text-[11px] font-bold font-mono uppercase text-indigo-600 dark:text-indigo-400 tracking-wider block">
                Entrega Instantânea
              </span>
              <p className="text-xs text-foreground/80 leading-relaxed">
                Arquivos, templates, planilhas e e-books com link assinado e liberação imediata.
              </p>
              <div className="flex items-center justify-between pt-1">
                <Label htmlFor="instant-digital" className="text-xs text-foreground cursor-pointer font-medium">
                  Somente Download Imediato
                </Label>
                <Switch
                  id="instant-digital"
                  checked={onlyInstantDigital}
                  onCheckedChange={setOnlyInstantDigital}
                />
              </div>
            </div>
          )}

          {/* Filtro de Cidades */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-2">
            <span className="text-[11px] font-bold font-mono uppercase text-muted-foreground tracking-wider block">
              Cidade / Região
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCity("todos")}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                  selectedCity === "todos"
                    ? "bg-foreground text-background font-bold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                Todas
              </button>
              {CANONICAL_CITIES.slice(0, 5).map((city) => {
                const isSelected = selectedCity === city.name;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => setSelectedCity(isSelected ? "todos" : city.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all ${
                      isSelected
                        ? "bg-foreground text-background font-bold"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferências de Negócio */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3">
            <span className="text-[11px] font-bold font-mono uppercase text-muted-foreground tracking-wider block">
              Condições
            </span>
            <div className="flex items-center justify-between">
              <Label htmlFor="trade-switch" className="text-xs text-foreground cursor-pointer">
                Aceita Troca
              </Label>
              <Switch
                id="trade-switch"
                checked={onlyTrade}
                onCheckedChange={setOnlyTrade}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="card-switch" className="text-xs text-foreground cursor-pointer">
                Parcela no Cartão
              </Label>
              <Switch
                id="card-switch"
                checked={onlyInstallments}
                onCheckedChange={setOnlyInstallments}
              />
            </div>
          </div>

          {/* Aviso Proeminente de Segurança Antifraude (Diretriz Inviolável de BigTech) */}
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="size-4 shrink-0" />
              <span>Negocie com Segurança</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              <strong>Não pague antecipadamente:</strong> Para bens físicos, veículos e imóveis, inspecione pessoalmente antes de efetuar transferências. Em produtos digitais, o download com link assinado é liberado de forma segura na confirmação.
            </p>
          </div>
        </aside>

        {/* ── COLUNA DIREITA (CONTEÚDO PRINCIPAL) ── */}
        <main className="flex-1 min-w-0 w-full space-y-5">
          {/* Barra de Busca e Controle de Visualização */}
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

          {/* Filtros Mobile (Apenas em telas menores que lg) */}
          <div className="lg:hidden space-y-3">
            {selectedCategory === "real_estate" && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
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
                          ? "bg-foreground text-background"
                          : "bg-muted/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {dt.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedCity("todos")}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-all shrink-0 ${
                  selectedCity === "todos"
                    ? "bg-foreground text-background font-bold"
                    : "bg-muted/40 text-muted-foreground hover:text-foreground"
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
                        ? "bg-foreground text-background font-bold"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Lista / Grade / Feed de Anúncios */}
          {filtered.length === 0 ? (
            <div className="py-20 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
              <Home className="size-10 text-muted-foreground/40 mx-auto" />
              <h2 className="text-sm font-bold text-foreground">
                Nenhum anúncio encontrado com estes filtros
              </h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Tente alterar os termos da busca ou selecionar outra categoria.
              </p>
            </div>
          ) : viewMode === "list" ? (
            /* ── MODO LISTA ── */
            <section className="flex flex-col space-y-3 w-full">
              {filtered.map((item: any) => {
                const img = item.images?.[0];
                const isTemporada = item.deal_type === "temporada";
                const isAluguel = item.deal_type === "aluguel";
                const itemNiche = resolveClassifiedNiche(item);

                return (
                  <Link
                    key={item.id}
                    to="/classificados/$id"
                    params={{ id: item.id }}
                    className="group flex flex-col sm:flex-row items-stretch justify-between rounded-2xl border border-border/60 bg-card hover:border-foreground/30 transition-all overflow-hidden p-0 cursor-pointer w-full"
                  >
                    <div className="relative w-full sm:w-56 md:w-64 h-44 sm:h-auto min-h-[140px] overflow-hidden bg-muted/40 shrink-0 flex items-center justify-center">
                      {img ? (
                        <img
                          src={img}
                          alt={item.title}
                          className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="size-full bg-gradient-to-br from-primary/10 via-muted/40 to-muted flex items-center justify-center">
                          <Tag size={28} className="text-primary/30" />
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap z-10">
                        <Badge className="bg-background/95 backdrop-blur-md text-foreground font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-md">
                          {itemNiche.shortLabel}
                        </Badge>
                        {(item.is_boosted || item.attributes?.is_boosted) && (
                          <Badge className="bg-amber-500 text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            Destaque
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {(item.attributes?.accepts_trade || item.accepts_trade) && (
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

                      <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-2">
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
            /* ── MODO FEED (Trilhos Horizontais de Categorias) ── */
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
                      const img = item.images?.[0];
                      const isTemporada = item.deal_type === "temporada";
                      const isAluguel = item.deal_type === "aluguel";

                      return (
                        <div key={item.id} className="w-56 sm:w-64 shrink-0">
                          <Link
                            to="/classificados/$id"
                            params={{ id: item.id }}
                            className="group rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all flex flex-col justify-between cursor-pointer h-full"
                          >
                            <div>
                              <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                                {img ? (
                                  <img
                                    src={img}
                                    alt={item.title}
                                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="size-full bg-gradient-to-br from-primary/10 via-muted/40 to-muted flex items-center justify-center">
                                    <Tag size={24} className="text-primary/30" />
                                  </div>
                                )}
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
                        </div>
                      );
                    })}
                  </HorizontalRail>
                );
              })}
            </section>
          ) : (
            /* ── MODO GRADE (Cards Compactos e Limpos) ── */
            <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.map((item: any) => {
                const img = item.images?.[0];
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
                      <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                        {img ? (
                          <img
                            src={img}
                            alt={item.title}
                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="size-full bg-gradient-to-br from-primary/10 via-muted/40 to-muted flex items-center justify-center">
                            <Tag size={24} className="text-primary/30" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1">
                          {item.deal_type && (
                            <Badge
                              variant="secondary"
                              className="text-[9px] uppercase font-mono font-bold px-1.5 py-0 bg-black/60 text-white backdrop-blur-md border-none"
                            >
                              {isTemporada ? "Temporada" : isAluguel ? "Aluguel" : "Venda"}
                            </Badge>
                          )}
                          {(item.is_boosted || item.attributes?.is_boosted) && (
                            <Badge className="bg-amber-500 text-black font-mono text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                              Destaque
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
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
