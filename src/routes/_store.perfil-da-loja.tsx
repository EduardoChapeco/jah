import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Clock,
  Mail,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Navigation,
  Share2,
  ArrowLeft,
  Store,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Briefcase,
  Building2,
  Calendar,
  MessageSquare,
  ChevronRight,
  Search,
  ExternalLink,
  Plus,
  Compass,
} from "lucide-react";
import { WhatsappLogo } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ErrorState, UnconfiguredState } from "@/components/state/states";
import { getPublicStoreProfile, getStorePublicCatalog } from "@/services/catalog.functions";
import { listPublicJobs } from "@/services/jobs.functions";
import { getPublicExperienceDocumentBySlug } from "@/services/builder.functions";
import { addToCart } from "@/services/cart.functions";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  normalizeWorkingHours,
  formatWeeklyScheduleSummary,
  WEEKDAYS_ORDER,
  type WeeklySchedule,
} from "@/lib/business-hours";
import { getOpenStatus, formatDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import { useCartContext } from "@/lib/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_store/perfil-da-loja")({
  validateSearch: (
    search: Record<string, unknown>
  ): { storeId?: string; slug?: string; aba?: string; origem?: string } => {
    return {
      storeId: typeof search.storeId === "string" ? search.storeId : undefined,
      slug: typeof search.slug === "string" ? search.slug : undefined,
      aba: typeof search.aba === "string" ? search.aba : undefined,
      origem: typeof search.origem === "string" ? search.origem : undefined,
    };
  },
  head: ({ loaderData }: any) => ({
    meta: [
      {
        title: loaderData?.profile?.name
          ? `${loaderData.profile.name} — Loja & Cardápio Oficial | Wider`
          : "Página Oficial da Loja | Wider",
      },
      {
        name: "description",
        content:
          loaderData?.profile?.description ||
          "Catálogo de produtos, cardápio, horários de funcionamento e canais oficiais de atendimento.",
      },
    ],
  }),

  loader: async ({ location }) => {
    const search = (location.search || {}) as any;
    const targetStore = search.storeId || search.slug;
    const [profile, docRes, catalogRes, jobsRes] = await Promise.all([
      getPublicStoreProfile({ data: targetStore ? { storeId: targetStore } : undefined }).catch(() => null),
      getPublicExperienceDocumentBySlug({
        data: { slug: "institucional", document_type: "storefront" },
      }).catch(() => null),
      getStorePublicCatalog({ data: targetStore ? { storeId: targetStore } : undefined }).catch(() => null),
      listPublicJobs({ data: {} }).catch(() => null),
    ]);

    const rawJobs = Array.isArray(jobsRes) ? jobsRes : (jobsRes as any)?.jobs || [];
    const storeJobs = rawJobs.filter((j: any) => {
      if (!profile?.id) return false;
      return j.store_id === profile.id || j.company_name?.toLowerCase() === profile.name?.toLowerCase();
    });

    return {
      profile,
      catalog: catalogRes?.products || [],
      categories: catalogRes?.categories || [],
      jobs: storeJobs,
      builderTree:
        docRes?.status === "ok" && (docRes.data as any).tree?.length > 0
          ? (docRes.data as any).tree
          : null,
    };
  },

  component: StorePerfil,
});

function StorePerfil() {
  const { profile: data, catalog, categories, jobs, builderTree } = Route.useLoaderData();
  const search = Route.useSearch();
  const { setCartData, setIsCartOpen } = useCartContext();

  // Determinação da aba inicial com base na intenção de entrada (origem / aba)
  const initialTab = useMemo(() => {
    if (search.aba) {
      if (search.aba === "cardapio" || search.aba === "catalogo" || search.aba === "produtos" || search.aba === "servicos" || search.aba === "imoveis") return "catalogo";
      if (search.aba === "sobre" || search.aba === "informacoes") return "sobre";
      if (search.aba === "mural" || search.aba === "social") return "mural";
      if (search.aba === "vagas" || search.aba === "empregos") return "vagas";
    }

    if (search.origem === "explorar" || search.origem === "busca") return "sobre";
    if (search.origem === "social" || search.origem === "feed") return "mural";
    if (search.origem === "vagas" || search.origem === "recrutamento") return "vagas";

    return "catalogo";
  }, [search.aba, search.origem]);

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");

  if (!data || ("status" in data && data.status === "unconfigured")) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6">
        <UnconfiguredState title="Loja não encontrada ou em configuração" />
      </div>
    );
  }

  // Builder Tree Custom Page
  if (builderTree) {
    return (
      <main className="w-full flex flex-col gap-0 min-h-screen">
        <ExperienceRenderer nodes={builderTree} />
      </main>
    );
  }

  const store = data as any;
  const settings = store.settings || {};
  const coverUrl =
    settings.cover_url ||
    settings.bannerUrl ||
    "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=85";
  const logoUrl = store.logo_url || settings.logoUrl || settings.logo_url;
  const rawHours = settings.working_hours || settings.business_hours_extended || store.business_hours || null;
  const holidayExceptions = settings.holiday_exceptions || [];
  const openStatus = rawHours ? getOpenStatus(rawHours, holidayExceptions) : null;
  const weeklySchedule = normalizeWorkingHours(rawHours);
  const scheduleSummary = rawHours ? formatWeeklyScheduleSummary(weeklySchedule) : "Horários sob consulta";

  // Semântica por Nicho
  const segment = (store.type || settings.segment || "loja").toLowerCase();
  const isGastronomy = segment.includes("gastro") || segment.includes("restauran") || segment.includes("lanchon") || segment.includes("bar") || segment.includes("caf") || segment.includes("pizza") || segment.includes("hamburg");
  const isServices = segment.includes("servi") || segment.includes("belez") || segment.includes("estet") || segment.includes("saud") || segment.includes("consult");
  
  const catalogTabTitle = isGastronomy ? "Cardápio" : isServices ? "Serviços" : "Produtos & Catálogo";
  const catalogTabIcon = isGastronomy ? UtensilsCrossed : isServices ? Sparkles : ShoppingBag;
  const CatalogIcon = catalogTabIcon;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link da loja copiado para a área de transferência!");
    }
  };

  // Filtragem de Produtos
  const filteredProducts = (catalog as any[]).filter((p) => {
    const matchesSearch = productSearch.trim() === "" || p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.description?.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === "todas" || p.category_id === selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full -mx-3 sm:-mx-6 -mt-4 sm:-mt-6 pb-12 animate-in fade-in duration-200">
      {/* ── 1. CAPA 100% LARGURA COM CONTROLES FLUTUANTES ── */}
      <div className="relative h-52 sm:h-72 md:h-80 w-full overflow-hidden bg-muted">
        <img src={coverUrl} alt={store.name} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-black/25 to-black/45" />

        {/* Botões Flutuantes no Topo */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Início</span>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="h-8 px-3.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-bold border border-white/20 gap-1.5 cursor-pointer"
          >
            <Share2 className="size-3.5" />
            <span>Compartilhar</span>
          </Button>
        </div>

        {/* Badges no Canto Inferior da Foto */}
        <div className="absolute bottom-4 left-4 sm:left-8 flex items-center gap-2 z-10">
          <Badge className="bg-background/90 text-foreground backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl uppercase font-mono">
            {store.type || (isGastronomy ? "Gastronomia" : "Loja Oficial")}
          </Badge>
          <Badge className="bg-emerald-500 text-white backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1">
            <ShieldCheck className="size-3.5" />
            <span>Loja Verificada Wider</span>
          </Badge>
        </div>
      </div>

      {/* ── 2. CORPO INSTITUCIONAL PADRONIZADO (MAX 6XL CANÔNICO) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pt-2">
        {/* Identidade Visual & Cabeçalho */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 relative z-10">
            <div className="size-24 sm:size-32 rounded-3xl bg-card overflow-hidden shrink-0 flex items-center justify-center ring-4 ring-card">
              {logoUrl ? (
                <img src={logoUrl} alt={store.name} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-primary/10 text-primary flex items-center justify-center font-black text-3xl">
                  {store.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Ações Rápidas de Contato */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {store.phone && (
                <Button
                  onClick={() =>
                    trackAndOpenWhatsApp({
                      phone: store.phone,
                      entityType: "store",
                      storeId: store.id,
                      entityTitle: store.name,
                      customMessage: `Olá, vi o catálogo de ${store.name} no Wider e gostaria de mais informações!`,
                    })
                  }
                  className="h-10 px-5 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <WhatsappLogo className="size-4" weight="bold" />
                  <span>WhatsApp Oficial</span>
                </Button>
              )}

              {/* Botão Como Chegar (Apenas se endereço for público e físico) */}
              {store.address && settings.is_address_public !== false && settings.business_model !== "home_office" && settings.business_model !== "digital_only" && (
                <Button
                  asChild
                  variant="outline"
                  className="h-10 px-4 rounded-2xl font-semibold text-xs gap-1.5"
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address + (store.city ? " " + store.city : ""))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="size-3.5 text-primary" />
                    <span>Como Chegar</span>
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Nome, Avaliações e Status de Atendimento */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground tracking-tight leading-tight">
                {store.name}
              </h1>
              {settings.business_model && (
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-muted/30">
                  {settings.business_model === "physical_and_delivery" && "Loja Física"}
                  {settings.business_model === "delivery_only" && "Apenas Delivery"}
                  {settings.business_model === "home_office" && "Home Office"}
                  {settings.business_model === "service_at_client" && "Em Domicílio"}
                  {settings.business_model === "digital_only" && "100% Digital"}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center text-amber-500 font-bold font-mono">
                <Star className="size-3.5 fill-amber-500 mr-1" />
                <span>5.0</span>
              </div>
              <span>•</span>
              <span>Avaliações Verificadas</span>
              <span>•</span>
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 font-bold cursor-pointer hover:underline text-left text-xs"
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        openStatus?.isOpenNow ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      )}
                    />
                    <span
                      className={
                        openStatus?.isOpenNow
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }
                    >
                      {openStatus ? openStatus.text : "Horários sob consulta"}
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md sm:rounded-3xl sm:p-6 p-5">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <span>Horários de Funcionamento</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Grade semanal de atendimento e pedidos de {store.name}.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2 py-2">
                    {WEEKDAYS_ORDER.map(({ key, label }) => {
                      const day = weeklySchedule[key];
                      const isOpen = day?.open && day.intervals && day.intervals.length > 0;
                      return (
                        <div
                          key={key}
                          className={cn(
                            "flex items-center justify-between p-2.5 rounded-xl text-xs",
                            isOpen ? "bg-muted/30" : "bg-muted/10 opacity-60"
                          )}
                        >
                          <span className="font-semibold text-foreground">{label}</span>
                          <span className="font-mono text-muted-foreground">
                            {isOpen
                              ? day.intervals.map((inv) => `${inv.from} às ${inv.to}`).join(" • ")
                              : "Fechado"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground pt-2">
              {store.address && (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span>
                    {store.address} {store.city ? `— ${store.city}, ${store.state || "SC"}` : ""}
                  </span>
                </span>
              )}

              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Clock className="size-4 text-primary shrink-0" />
                <span>{scheduleSummary}</span>
              </span>
            </div>
          </div>
        </div>

        {/* ── 3. ABAS CONTEXTUAIS INTELIGENTES (Apple HIG / Wider Platform) ── */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 text-xs font-semibold overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("catalogo")}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === "catalogo"
                  ? "bg-background text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CatalogIcon className="size-4 text-primary" />
              <span>{catalogTabTitle}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold">
                {catalog.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("sobre")}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === "sobre"
                  ? "bg-background text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="size-4 text-info" />
              <span>Sobre & Informações</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("vagas")}
              className={cn(
                "px-4 py-2 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap",
                activeTab === "vagas"
                  ? "bg-background text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="size-4 text-emerald-500" />
              <span>Vagas de Emprego</span>
              {jobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 font-bold">
                  {jobs.length}
                </span>
              )}
            </button>
          </div>

          {/* ── CONTEÚDO DA ABA 1: CATÁLOGO / CARDÁPIO ── */}
          {activeTab === "catalogo" && (
            <div className="space-y-6">
              {/* Barra de Busca de Produtos */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={`Buscar no ${catalogTabTitle.toLowerCase()}...`}
                    className="h-11 pl-10 rounded-2xl bg-card text-xs sm:text-sm"
                  />
                </div>

                {categories.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("todas")}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
                        selectedCategory === "todas"
                          ? "bg-primary text-primary-foreground font-bold"
                          : "bg-card text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Todos
                    </button>
                    {categories.map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.id)}
                        className={cn(
                          "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
                          selectedCategory === c.id
                            ? "bg-primary text-primary-foreground font-bold"
                            : "bg-card text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid de Itens */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 rounded-3xl bg-card text-center space-y-3">
                  <ShoppingBag className="size-10 mx-auto text-muted-foreground/40" />
                  <h3 className="text-base font-bold text-foreground">Nenhum item encontrado</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {productSearch ? "Tente buscar por outro termo ou categoria." : "Esta loja ainda não possui itens disponíveis para compra online."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p: any) => (
                    <div
                      key={p.id}
                      className="rounded-3xl bg-card p-4 space-y-3 flex flex-col justify-between group hover:bg-muted/20 transition-colors"
                    >
                      <div className="space-y-3">
                        <div className="aspect-[4/3] rounded-2xl bg-muted/40 overflow-hidden relative">
                          {p.coverUrl || p.images?.[0] ? (
                            <img
                              src={p.coverUrl || p.images[0]}
                              alt={p.title}
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="size-full flex items-center justify-center text-muted-foreground/40">
                              <CatalogIcon className="size-8" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                            {p.title}
                          </h3>
                          {p.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {p.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="font-extrabold text-sm sm:text-base text-foreground font-mono">
                          {formatMoney(p.priceCents ? p.priceCents / 100 : p.price || 0)}
                        </div>

                        <Button
                          size="sm"
                          className="h-8 px-3.5 rounded-xl font-bold text-xs bg-primary text-primary-foreground gap-1.5"
                          onClick={async () => {
                            try {
                              const res = await addToCart({
                                data: {
                                  productId: p.id,
                                  quantity: 1,
                                },
                              });
                              if (res?.cart) {
                                setCartData(res.cart as any, (res as any).globalCarts as any);
                              }
                              toast.success(`${p.title} adicionado à sacola!`);
                              setIsCartOpen(true);
                            } catch (err: any) {
                              toast.error(err?.message || "Erro ao adicionar produto.");
                            }
                          }}
                        >
                          <Plus className="size-3.5" />
                          <span>Adicionar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 2: SOBRE & INFORMAÇÕES (Google Meu Negócio) ── */}
          {activeTab === "sobre" && (
            <div className="space-y-6">
              {/* História da Loja */}
              <div className="p-6 sm:p-8 rounded-3xl bg-card space-y-3">
                <h3 className="text-base font-bold text-foreground">Sobre a Empresa</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {store.description || "Empresa credenciada e verificada da rede comunitária JAH."}
                </p>
              </div>

              {/* Informações de Localização & Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 rounded-3xl bg-card space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Localização & Atendimento</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {settings.is_address_public === false || settings.business_model === "home_office" || settings.business_model === "digital_only" ? (
                      <div>
                        <p className="font-medium text-foreground">
                          {settings.neighborhood ? `${settings.neighborhood}, ` : ""}{store.city} — {store.state || "SC"}
                        </p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium pt-1">
                          🔒 Endereço protegido por privacidade. Atendimento remoto / delivery em um raio de até {settings.service_radius_km || 15} km.
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-foreground">{store.address || "Endereço não informado"}</p>
                        <p>{store.city} — {store.state || "SC"}</p>
                      </div>
                    )}
                  </div>
                  {store.address && settings.is_address_public !== false && settings.business_model !== "home_office" && settings.business_model !== "digital_only" && (
                    <Button asChild size="sm" variant="outline" className="w-full rounded-2xl text-xs font-semibold gap-1.5">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.address + (store.city ? " " + store.city : ""))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Navigation className="size-3.5 text-primary" />
                        <span>Abrir no Google Maps</span>
                      </a>
                    </Button>
                  )}
                </div>

                <div className="p-6 rounded-3xl bg-card space-y-4">
                  <h3 className="text-sm font-bold text-foreground">Canais Oficiais de Atendimento</h3>
                  <div className="space-y-3 text-xs">
                    {store.phone && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">WhatsApp / Fone:</span>
                        <span className="font-bold text-foreground font-mono">{store.phone}</span>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">E-mail Comercial:</span>
                        <span className="font-bold text-foreground">{store.email}</span>
                      </div>
                    )}
                    {settings.instagramHandle && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Instagram Oficial:</span>
                        <span className="font-bold text-primary">@{settings.instagramHandle.replace("@", "")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 3: VAGAS DE EMPREGO ── */}
          {activeTab === "vagas" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-foreground">Trabalhe Conosco</h3>
                  <p className="text-xs text-muted-foreground">Vagas de emprego abertas em {store.name}</p>
                </div>
              </div>

              {jobs.length === 0 ? (
                <div className="p-12 rounded-3xl bg-card text-center space-y-3">
                  <Briefcase className="size-10 mx-auto text-muted-foreground/40" />
                  <h4 className="text-base font-bold text-foreground">Nenhuma vaga aberta no momento</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Acompanhe nosso perfil profissional para ser notificado quando novas vagas forem abertas.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {jobs.map((job: any) => (
                    <div
                      key={job.id}
                      className="p-5 rounded-3xl bg-card space-y-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <h4 className="text-base font-bold text-foreground">{job.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px] px-2 py-0.5 rounded-lg">
                            {job.contract_type || "CLT"}
                          </Badge>
                          <span>•</span>
                          <span>{job.workplace_type || "Presencial"}</span>
                          <span>•</span>
                          <span>{job.location || store.city || "Local"}</span>
                        </div>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="rounded-2xl font-bold text-xs bg-primary text-primary-foreground gap-1.5"
                      >
                        <Link to="/empregos/$id" params={{ id: job.id }}>
                          <span>Ver Detalhes da Vaga</span>
                          <ChevronRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
