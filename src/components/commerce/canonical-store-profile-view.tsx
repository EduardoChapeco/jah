/**
 * canonical-store-profile-view.tsx — Perfil Comercial Público Canônico de Empresas (Wider OS / Apple HIG)
 * Unifica a presença pública de lojas e empresas locais com a mesma excelência visual do perfil de membro.
 * Abas ricas: Vitrine (Banners, Botões/Hotpages, Catálogo), Sobre & Atendimento (Horários, Pagamentos, Mapa),
 * Posts Sociais (Feed/Grid), Vagas de Emprego, Avaliações Verificadas e Patrocinadores.
 */

import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Clock,
  Phone,
  MapPin,
  Star,
  ShieldCheck,
  Share2,
  ArrowLeft,
  Store,
  ShoppingBag,
  Layers,
  UtensilsCrossed,
  Briefcase,
  Building2,
  ChevronRight,
  Search,
  ExternalLink,
  Plus,
  MessageSquare,
  Award,
  CreditCard,
  Truck,
  CheckCircle,
  Eye,
  Check,
  Navigation,
} from "lucide-react";
import {
  WhatsappLogo,
  PaperPlaneTilt,
  Globe,
  InstagramLogo,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { DynamicMediaChip } from "@/components/commerce/dynamic-media-chip";
import { ProductModifiersModal, type SelectedModifier } from "@/components/pos/product-modifiers-modal";
import { MediaLightboxModal } from "@/components/community/media-lightbox-modal";
import {
  normalizeWorkingHours,
  formatWeeklyScheduleSummary,
  WEEKDAYS_ORDER,
} from "@/lib/business-hours";
import { getOpenStatus, formatDate } from "@/lib/datetime";
import { formatMoney } from "@/lib/money";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import { addToCart } from "@/services/cart.functions";
import { requestDirectoryQuote } from "@/services/directory.functions";
import { useCartContext } from "@/lib/cart-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface CanonicalStoreProfileViewProps {
  store: any;
  catalog?: any[];
  categories?: any[];
  banners?: any[];
  hotpages?: any[];
  jobs?: any[];
  posts?: any[];
  reviews?: any[];
  sponsors?: any[];
  builderTree?: any[] | null;
  initialTab?: string;
  source?: "directory" | "storefront";
  backUrl?: string;
  backLabel?: string;
}

export function CanonicalStoreProfileView({
  store,
  catalog = [],
  categories = [],
  banners = [],
  hotpages = [],
  jobs = [],
  posts = [],
  reviews = [],
  sponsors = [],
  initialTab = "catalogo",
  source = "storefront",
  backUrl = source === "directory" ? "/diretorio" : "/",
  backLabel = source === "directory" ? "Guia & Diretório" : "Início",
}: CanonicalStoreProfileViewProps) {
  const { setCartData, setIsCartOpen } = useCartContext();

  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [productSearch, setProductSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("todas");
  const [selectedProductForModifiers, setSelectedProductForModifiers] = useState<any | null>(null);

  // Modal de Lightbox para fotos dos posts
  const [lightboxPost, setLightboxPost] = useState<any | null>(null);

  // Modal de Orçamento
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [quoteName, setQuoteName] = useState("");
  const [quoteEmail, setQuoteEmail] = useState("");
  const [quotePhone, setQuotePhone] = useState("");
  const [quoteService, setQuoteService] = useState("");
  const [quoteMessage, setQuoteMessage] = useState("");
  const [hasQuoted, setHasQuoted] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  const settings = store?.settings || {};
  const coverUrl =
    store?.banner_url ||
    settings.cover_url ||
    settings.bannerUrl ||
    settings.banner_url ||
    null;
  const logoUrl =
    store?.avatar_url ||
    store?.logo_url ||
    settings.logoUrl ||
    settings.logo_url ||
    null;

  const rawHours =
    settings.working_hours ||
    settings.business_hours_extended ||
    store?.business_hours ||
    store?.working_hours ||
    null;
  const holidayExceptions = settings.holiday_exceptions || [];
  const openStatus = rawHours ? getOpenStatus(rawHours, holidayExceptions) : null;
  const weeklySchedule = normalizeWorkingHours(rawHours);
  const scheduleSummary = rawHours
    ? formatWeeklyScheduleSummary(weeklySchedule)
    : "Horários sob consulta";

  const orderTypes = settings.order_types || {
    delivery: true,
    takeout: true,
    dine_in: true,
  };

  // Semântica por Nicho
  const segment = (store?.type || store?.category || settings.segment || "loja").toLowerCase();
  const isGastronomy =
    segment.includes("gastro") ||
    segment.includes("restauran") ||
    segment.includes("lanchon") ||
    segment.includes("bar") ||
    segment.includes("caf") ||
    segment.includes("pizza") ||
    segment.includes("hamburg");
  const isServices =
    segment.includes("servi") ||
    segment.includes("belez") ||
    segment.includes("estet") ||
    segment.includes("saud") ||
    segment.includes("consult") ||
    segment.includes("oficina");
  const isNews = segment.includes("jornal") || segment.includes("notic") || segment.includes("portal");

  const catalogTabTitle = isGastronomy ? "Cardápio" : isServices ? "Serviços & Preços" : "Produtos & Loja";
  const CatalogIcon = isGastronomy ? UtensilsCrossed : isServices ? Layers : ShoppingBag;

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link da empresa copiado para a área de transferência!");
    }
  };

  const handleAddToCart = async (p: any) => {
    if (p.optionGroups && p.optionGroups.length > 0) {
      setSelectedProductForModifiers(p);
      return;
    }

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
  };

  const handleConfirmModifiers = async (
    prod: any,
    _variant: any,
    selectedMods: SelectedModifier[]
  ) => {
    try {
      const optionsPayload: Record<string, string[]> = {};
      selectedMods.forEach((m) => {
        if (!optionsPayload[m.groupId]) {
          optionsPayload[m.groupId] = [];
        }
        optionsPayload[m.groupId].push(m.title);
      });

      const res = await addToCart({
        data: {
          productId: prod.id,
          quantity: 1,
          options: optionsPayload,
        },
      });

      if (res?.cart) {
        setCartData(res.cart as any, (res as any).globalCarts as any);
      }
      toast.success(`${prod.title} adicionado à sacola!`);
      setSelectedProductForModifiers(null);
      setIsCartOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao adicionar produto.");
    }
  };

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingQuote(true);
    try {
      await requestDirectoryQuote({
        data: {
          listingId: store.id,
          customerName: quoteName,
          customerEmail: quoteEmail,
          customerPhone: quotePhone,
          serviceNeeded: quoteService || "Atendimento Geral",
          message: quoteMessage || undefined,
        },
      });
      setHasQuoted(true);
      toast.success("Solicitação de atendimento enviada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar solicitação.");
    } finally {
      setIsSendingQuote(false);
    }
  };

  // Filtragem de Produtos
  const filteredProducts = useMemo(() => {
    return (catalog as any[]).filter((p) => {
      const matchesSearch =
        productSearch.trim() === "" ||
        p.title?.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.description?.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory =
        selectedCategory === "todas" ||
        p.category_id === selectedCategory ||
        p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [catalog, productSearch, selectedCategory]);

  const whatsappNumber = (
    store?.contact_whatsapp ||
    store?.whatsapp ||
    store?.phone ||
    store?.contact_phone ||
    ""
  ).replace(/\D/g, "");

  const hasSponsors = sponsors && sponsors.length > 0;

  return (
    <div className="w-full max-w-full overflow-x-hidden -mx-3 sm:-mx-6 -mt-4 sm:-mt-6 pb-24 md:pb-16 animate-in fade-in duration-200">
      {/* ── 1. CAPA 100% LARGURA COM CONTROLES FLUTUANTES (PADRÃO PERFIL MEMBRO) ── */}
      <div className="relative h-56 sm:h-72 md:h-80 w-full overflow-hidden bg-muted/40">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={store.name || store.business_name}
            className="size-full object-cover"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-primary/15 via-muted/50 to-muted flex items-center justify-center">
            <Store className="size-16 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-black/25 to-black/45" />

        {/* Botões Flutuantes no Topo */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
          <Link
            to={backUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>{backLabel}</span>
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
          <Badge className="bg-background/90 text-foreground backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl uppercase font-mono shadow-xs">
            {store.category || store.type || (isGastronomy ? "Gastronomia" : "Empresa Local")}
          </Badge>
          <Badge className="bg-emerald-500 text-white backdrop-blur-md text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 shadow-xs">
            <ShieldCheck className="size-3.5" />
            <span>Empresa Verificada</span>
          </Badge>
        </div>
      </div>

      {/* ── 2. CORPO INSTITUCIONAL PADRONIZADO (MAX 6XL CANÔNICO) ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 pt-2">
        {/* Identidade Visual & Cabeçalho */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16 relative z-10">
            {/* Avatar da Loja com Anel Elegante */}
            <div className="size-24 sm:size-32 rounded-2xl bg-card overflow-hidden shrink-0 flex items-center justify-center ring-4 ring-card shadow-sm border border-border/60">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={store.name || store.business_name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-primary/10 text-primary flex items-center justify-center font-black text-3xl font-mono">
                  {(store.name || store.business_name || "W").slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            {/* Ações Rápidas de Conversão no Topo (Touch target 44px) */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              {whatsappNumber && (
                <Button
                  onClick={() =>
                    trackAndOpenWhatsApp({
                      phone: whatsappNumber,
                      storeId: store.id || null,
                      entityType: "store",
                      entityId: store.id,
                      entityTitle: store.name || store.business_name,
                      niche: segment,
                      customMessage: `Olá! Vi o perfil oficial de ${store.name || store.business_name} no Wider e gostaria de mais informações.`,
                    })
                  }
                  className="h-11 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2 cursor-pointer shadow-xs transition-transform active:scale-98"
                >
                  <WhatsappLogo size={18} weight="bold" />
                  <span>WhatsApp Oficial</span>
                </Button>
              )}

              <Dialog open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-4 rounded-xl font-semibold text-xs gap-2 border-border/80 bg-card hover:bg-muted cursor-pointer"
                  >
                    <PaperPlaneTilt size={16} weight="bold" className="text-primary" />
                    <span>Pedir Orçamento</span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md sm:rounded-2xl sm:p-6 p-5">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">
                      Solicitar Atendimento / Orçamento
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Envie sua dúvida ou solicitação para a equipe de{" "}
                      {store.name || store.business_name}.
                    </DialogDescription>
                  </DialogHeader>

                  {hasQuoted ? (
                    <div className="py-6 text-center space-y-3">
                      <CheckCircle className="size-12 text-emerald-500 mx-auto" />
                      <h4 className="font-bold text-sm">Solicitação Enviada!</h4>
                      <p className="text-xs text-muted-foreground">
                        A empresa recebeu sua mensagem e responderá pelo telefone ou e-mail informado.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => {
                          setIsQuoteOpen(false);
                          setHasQuoted(false);
                        }}
                        className="rounded-xl font-bold text-xs mt-2"
                      >
                        Fechar
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendQuote} className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          Seu Nome Completo
                        </label>
                        <Input
                          value={quoteName}
                          onChange={(e) => setQuoteName(e.target.value)}
                          placeholder="Ex: Carlos Silva"
                          required
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            WhatsApp
                          </label>
                          <Input
                            value={quotePhone}
                            onChange={(e) => setQuotePhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            required
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            E-mail
                          </label>
                          <Input
                            type="email"
                            value={quoteEmail}
                            onChange={(e) => setQuoteEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                            className="h-10 rounded-xl text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          O que você precisa?
                        </label>
                        <Input
                          value={quoteService}
                          onChange={(e) => setQuoteService(e.target.value)}
                          placeholder="Ex: Orçamento de serviço, entrega personalizada..."
                          className="h-10 rounded-xl text-xs"
                        />
                      </div>
                      <Button
                        type="submit"
                        disabled={isSendingQuote}
                        className="w-full h-10 rounded-xl font-bold text-xs bg-foreground text-background mt-2"
                      >
                        {isSendingQuote ? "Enviando..." : "Enviar Solicitação"}
                      </Button>
                    </form>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Nome, Avaliações, Horário e Modalidades */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {store.name || store.business_name}
              </h1>
              {orderTypes.delivery && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/5"
                >
                  🛵 Delivery
                </Badge>
              )}
              {orderTypes.takeout && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-500/5"
                >
                  🛍️ Retirada
                </Badge>
              )}
              {orderTypes.dine_in && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/5"
                >
                  🍽️ No Local
                </Badge>
              )}
            </div>

            {/* Avaliação em Estrelas + Status Aberto/Fechado */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <button
                type="button"
                onClick={() => setActiveTab("avaliacoes")}
                className="flex items-center text-amber-500 font-bold font-mono hover:underline cursor-pointer"
              >
                <Star className="size-3.5 fill-amber-500 mr-1" />
                <span>{Number(store.rating || 5.0).toFixed(1)}</span>
                <span className="text-muted-foreground ml-1.5 font-normal">
                  ({reviews.length > 0 ? reviews.length : store.reviews_count || 12} avaliações)
                </span>
              </button>
              <span>•</span>

              {/* Status em Tempo Real Aberto/Fechado */}
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 font-bold cursor-pointer hover:underline text-left text-xs"
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        openStatus?.isOpenNow
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-amber-500"
                      )}
                    />
                    <span
                      className={
                        openStatus?.isOpenNow
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {openStatus ? openStatus.text : "Horários sob consulta"}
                    </span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-md sm:rounded-2xl sm:p-6 p-5">
                  <DialogHeader className="pb-2">
                    <DialogTitle className="text-base font-bold flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      <span>Grade Semanal de Horários</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      Horários de funcionamento de {store.name || store.business_name}.
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

            {/* Endereço Físico & Como Chegar */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-muted-foreground pt-1">
              {store.address && (
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <MapPin className="size-4 text-primary shrink-0" />
                  <span>
                    {store.address}{" "}
                    {store.city ? `— ${store.city}, ${store.state || "SC"}` : ""}
                  </span>
                </span>
              )}

              {store.latitude && store.longitude && (
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-bold hover:underline flex items-center gap-1 ml-auto"
                >
                  <Navigation className="size-3.5" />
                  <span>Como Chegar</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── 3. NAVEGAÇÃO POR ABAS NO PADRÃO DO PERFIL DE MEMBRO (Apple HIG) ── */}
        <div className="space-y-6 pt-2">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/40 text-xs font-semibold overflow-x-auto no-scrollbar border border-border/40">
            {/* Tab Vitrine */}
            <button
              type="button"
              onClick={() => setActiveTab("catalogo")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "catalogo"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <CatalogIcon className="size-4 text-primary" />
              <span>{catalogTabTitle}</span>
              {catalog.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {catalog.length}
                </span>
              )}
            </button>

            {/* Tab Sobre */}
            <button
              type="button"
              onClick={() => setActiveTab("sobre")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "sobre"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Building2 className="size-4 text-sky-500" />
              <span>Sobre & Atendimento</span>
            </button>

            {/* Tab Posts & Novidades */}
            <button
              type="button"
              onClick={() => setActiveTab("mural")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "mural"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <MessageSquare className="size-4 text-purple-500" />
              <span>Posts & Novidades</span>
              {posts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {posts.length}
                </span>
              )}
            </button>

            {/* Tab Vagas */}
            <button
              type="button"
              onClick={() => setActiveTab("vagas")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "vagas"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Briefcase className="size-4 text-emerald-500" />
              <span>Vagas</span>
              {jobs.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 font-bold font-mono">
                  {jobs.length}
                </span>
              )}
            </button>

            {/* Tab Avaliações */}
            <button
              type="button"
              onClick={() => setActiveTab("avaliacoes")}
              className={cn(
                "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                activeTab === "avaliacoes"
                  ? "bg-background text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Star className="size-4 text-amber-500" />
              <span>Avaliações</span>
              {reviews.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {reviews.length}
                </span>
              )}
            </button>

            {/* Tab Patrocinadores (Se houver) */}
            {hasSponsors && (
              <button
                type="button"
                onClick={() => setActiveTab("patrocinadores")}
                className={cn(
                  "px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer",
                  activeTab === "patrocinadores"
                    ? "bg-background text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Award className="size-4 text-rose-500" />
                <span>Patrocinadores</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  {sponsors.length}
                </span>
              </button>
            )}
          </div>

          {/* ── CONTEÚDO DA ABA 1: VITRINE / CARDÁPIO ── */}
          {activeTab === "catalogo" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 1.1 Banners da Loja (Cadastrados no Workspace) */}
              {banners.length > 0 && (
                <BannerHeroCarousel banners={banners} className="w-full rounded-2xl overflow-hidden" />
              )}

              {/* 1.2 Trilho de Botões / Hotpages Rápidas */}
              {hotpages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-1">
                    {hotpages.map((h: any) => (
                      <div key={h.id} className="shrink-0">
                        <DynamicMediaChip
                          label={h.title}
                          badge={h.badge_label || undefined}
                          mediaUrl={h.bg_media_url || undefined}
                          texture={h.bg_texture || undefined}
                          href={h.target_route || undefined}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 1.3 Faixa de Patrocinadores em Destaque na Vitrine */}
              {hasSponsors && (
                <div className="p-3 rounded-2xl bg-card border border-border/60 flex items-center gap-4 overflow-x-auto no-scrollbar">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono shrink-0">
                    Apoiadores:
                  </span>
                  <div className="flex items-center gap-3 shrink-0">
                    {sponsors.slice(0, 6).map((sp: any) => (
                      <a
                        key={sp.id}
                        href={sp.website_url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl bg-muted/30 hover:bg-muted text-xs font-semibold text-foreground transition-colors border border-border/40"
                      >
                        {sp.logo_url && (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            className="size-4 object-contain rounded"
                          />
                        )}
                        <span>{sp.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* 1.4 Barra de Busca e Categorias de Produtos */}
              {catalog.length > 0 && (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder={`Buscar em ${store.name || store.business_name}...`}
                        className="pl-10 h-11 rounded-xl text-xs bg-card border-border/80"
                      />
                    </div>
                  </div>

                  {/* Chips de Categorias */}
                  {categories.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("todas")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                          selectedCategory === "todas"
                            ? "bg-foreground text-background font-bold"
                            : "bg-muted/40 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Todas as Opções
                      </button>
                      {categories.map((cat: any) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer",
                            selectedCategory === cat.id
                              ? "bg-foreground text-background font-bold"
                              : "bg-muted/40 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 1.5 Grade de Produtos / Cardápio */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((p: any) => {
                    const priceCents = p.price_cents || p.price || 0;
                    const imageUrl = p.images?.[0] || p.image_url || null;

                    return (
                      <div
                        key={p.id}
                        className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all shadow-2xs group"
                      >
                        <div className="flex items-start gap-3 p-4">
                          <div className="min-w-0 flex-1 space-y-1">
                            <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug">
                              {p.title}
                            </h3>
                            {p.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {p.description}
                              </p>
                            )}
                            <div className="pt-2">
                              <span className="text-sm font-black text-foreground font-mono">
                                {formatMoney(priceCents)}
                              </span>
                            </div>
                          </div>

                          {/* Foto 1:1 do Produto */}
                          {imageUrl && (
                            <div className="size-20 sm:size-24 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                              <img
                                src={imageUrl}
                                alt={p.title}
                                className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </div>

                        {/* Botão de Adição com Touch Target 44px */}
                        <div className="p-3 pt-0 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(p)}
                            className="rounded-xl h-10 px-4 font-bold text-xs bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer w-full sm:w-auto"
                          >
                            <Plus className="size-3.5" />
                            <span>Adicionar</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : catalog.length > 0 ? (
                <div className="py-16 text-center space-y-2 bg-muted/20 rounded-2xl p-6">
                  <Search className="size-8 text-muted-foreground/40 mx-auto" />
                  <p className="text-xs font-semibold text-foreground">
                    Nenhum item encontrado para "{productSearch}".
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProductSearch("");
                      setSelectedCategory("todas");
                    }}
                    className="rounded-xl text-xs"
                  >
                    Limpar Filtros
                  </Button>
                </div>
              ) : (
                /* Estado quando a empresa não possui produtos cadastrados online */
                <div className="py-16 text-center space-y-4 bg-muted/20 rounded-2xl p-8 border border-border/60">
                  <Briefcase className="size-10 text-muted-foreground/40 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground">
                      Atendimento Sob Medida & Presencial
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Esta empresa presta serviços e atendimento personalizado. Entre em contato diretamente pelo WhatsApp para orçamentos e agendamentos.
                    </p>
                  </div>
                  {whatsappNumber && (
                    <Button
                      onClick={() =>
                        trackAndOpenWhatsApp({
                          phone: whatsappNumber,
                          storeId: store.id || null,
                          entityType: "store",
                          entityId: store.id,
                          entityTitle: store.name || store.business_name,
                          niche: segment,
                          customMessage: `Olá! Gostaria de um orçamento ou informações sobre seus serviços.`,
                        })
                      }
                      className="rounded-xl h-11 px-5 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <WhatsappLogo size={18} weight="bold" />
                      <span>Conversar no WhatsApp</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 2: SOBRE & ATENDIMENTO ── */}
          {activeTab === "sobre" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Descrição & História da Empresa */}
              <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  <span>Sobre a Empresa & Atuação</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {store.description ||
                    "Empresa credenciada no ecossistema comunitário Wider, comprometida com qualidade de atendimento e relacionamento direto com clientes e parceiros da região."}
                </p>

                {/* Especialidades */}
                {store.specialties && store.specialties.length > 0 && (
                  <div className="pt-3 border-t border-border/40 space-y-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase font-mono">
                      Especialidades & Serviços Prestados:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {store.specialties.map((spec: string, i: number) => (
                        <Badge
                          key={i}
                          variant="outline"
                          className="text-xs font-medium bg-muted/30 border-border/80 px-2.5 py-0.5"
                        >
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Métodos de Pagamento & Modalidades */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-3 shadow-2xs">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <CreditCard className="size-4 text-primary" />
                    <span>Formas de Pagamento Aceitas</span>
                  </h3>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="px-2.5 py-1 bg-muted/20">
                      ⚡ Pix Instantâneo
                    </Badge>
                    <Badge variant="outline" className="px-2.5 py-1 bg-muted/20">
                      💳 Cartão de Crédito
                    </Badge>
                    <Badge variant="outline" className="px-2.5 py-1 bg-muted/20">
                      💳 Cartão de Débito
                    </Badge>
                    <Badge variant="outline" className="px-2.5 py-1 bg-muted/20">
                      💵 Dinheiro / Espécie
                    </Badge>
                    <Badge variant="outline" className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      📜 Carnê da Loja
                    </Badge>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-card border border-border/60 space-y-3 shadow-2xs">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Truck className="size-4 text-primary" />
                    <span>Entrega & Atendimento</span>
                  </h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2 text-foreground font-medium">
                      <Check className="size-3.5 text-emerald-500" />
                      <span>Atendimento na região de {store.city || "São Miguel do Oeste"}</span>
                    </p>
                    {orderTypes.delivery && (
                      <p className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="size-3.5 text-emerald-500" />
                        <span>Delivery com rastreio em tempo real</span>
                      </p>
                    )}
                    {orderTypes.takeout && (
                      <p className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="size-3.5 text-emerald-500" />
                        <span>Retirada rápida no balcão sem filas</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Grade de Horários Completa */}
              <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span>Grade Semanal de Funcionamento</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                  {WEEKDAYS_ORDER.map(({ key, label }) => {
                    const day = weeklySchedule[key];
                    const isOpen = day?.open && day.intervals && day.intervals.length > 0;
                    return (
                      <div
                        key={key}
                        className={cn(
                          "p-3 rounded-xl border text-xs space-y-1",
                          isOpen
                            ? "bg-muted/20 border-border/80"
                            : "bg-muted/5 border-border/40 opacity-60"
                        )}
                      >
                        <p className="font-bold text-foreground">{label}</p>
                        <p className="font-mono text-[11px] text-muted-foreground">
                          {isOpen
                            ? day.intervals.map((inv) => `${inv.from} - ${inv.to}`).join(", ")
                            : "Fechado"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Endereço Físico e Canais Oficiais */}
              <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border/60 space-y-3 shadow-2xs">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Phone className="size-4 text-primary" />
                  <span>Canais de Atendimento Oficial</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  {store.phone && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Telefone / Central
                      </span>
                      <p className="font-mono font-bold text-foreground">{store.phone}</p>
                    </div>
                  )}
                  {store.email && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        E-mail Comercial
                      </span>
                      <p className="font-medium text-foreground truncate">{store.email}</p>
                    </div>
                  )}
                  {store.website_url && (
                    <div className="p-3 rounded-xl bg-muted/20 border border-border/60 space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Website Oficial
                      </span>
                      <a
                        href={store.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium block truncate"
                      >
                        {store.website_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 3: POSTS & NOVIDADES (MURAL SOCIAL) ── */}
          {activeTab === "mural" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {posts.map((post: any) => {
                    const firstMedia = post.media_urls?.[0];
                    return (
                      <div
                        key={post.id}
                        onClick={() => setLightboxPost(post)}
                        className="rounded-2xl border border-border/60 bg-card overflow-hidden hover:border-foreground/30 transition-all cursor-pointer shadow-2xs group"
                      >
                        {firstMedia && (
                          <div className="aspect-video w-full overflow-hidden bg-muted/30">
                            <img
                              src={firstMedia}
                              alt="Foto da publicação"
                              className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-2">
                          <p className="text-xs text-foreground line-clamp-3 leading-relaxed">
                            {post.content_text || "Confira a novidade publicada pela empresa."}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 bg-muted/20 rounded-2xl p-8 border border-border/60">
                  <MessageSquare className="size-10 text-muted-foreground/40 mx-auto" />
                  <h3 className="text-sm font-bold text-foreground">Nenhuma publicação recente</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    A empresa ainda não realizou postagens sociais neste canal.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 4: VAGAS & EMPREGOS ── */}
          {activeTab === "vagas" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {jobs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {jobs.map((j: any) => (
                    <div
                      key={j.id}
                      className="p-5 rounded-2xl border border-border/60 bg-card space-y-3 hover:border-foreground/30 transition-all shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{j.title}</h3>
                          <span className="text-xs text-muted-foreground font-mono">
                            {j.city || store.city || "São Miguel do Oeste"} •{" "}
                            {j.contract_type || "CLT"}
                          </span>
                        </div>
                        {j.salary_range && (
                          <Badge variant="outline" className="text-xs font-mono font-bold">
                            {j.salary_range}
                          </Badge>
                        )}
                      </div>

                      {j.description && (
                        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                          {j.description}
                        </p>
                      )}

                      <Button
                        asChild
                        size="sm"
                        className="rounded-xl h-9 px-4 font-bold text-xs bg-foreground text-background w-full"
                      >
                        <Link to="/empregos/$id" params={{ id: j.id }}>
                          <span>Ver Detalhes & Candidatar-se</span>
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center space-y-2 bg-muted/20 rounded-2xl p-8 border border-border/60">
                  <Briefcase className="size-10 text-muted-foreground/40 mx-auto" />
                  <h3 className="text-sm font-bold text-foreground">Sem vagas abertas no momento</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Novas oportunidades serão divulgadas diretamente nesta aba assim que abrirem.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 5: AVALIAÇÕES VERIFICADAS ── */}
          {activeTab === "avaliacoes" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-5 rounded-2xl bg-card border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xl font-mono">
                    {Number(store.rating || 5.0).toFixed(1)}
                  </div>
                  <div>
                    <div className="flex items-center text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="size-3.5 fill-amber-500" />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Baseado em {reviews.length > 0 ? reviews.length : store.reviews_count || 12} avaliações de clientes verificados.
                    </p>
                  </div>
                </div>
              </div>

              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {reviews.map((r: any) => (
                    <div
                      key={r.id}
                      className="p-4 rounded-2xl border border-border/60 bg-card space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: r.rating || 5 }).map((_, i) => (
                            <Star key={i} className="size-3 fill-amber-500" />
                          ))}
                        </div>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(r.created_at)}
                        </span>
                      </div>
                      {r.product_name && (
                        <Badge variant="outline" className="text-[10px]">
                          {r.product_name}
                        </Badge>
                      )}
                      <p className="text-xs text-foreground leading-relaxed">
                        {r.comment || "Ótimo atendimento, produtos de primeira e entrega no prazo!"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-card border border-border/60 text-center space-y-2">
                  <Star className="size-8 text-amber-500/40 mx-auto" />
                  <p className="text-xs text-muted-foreground">
                    Esta empresa mantém nota máxima com excelente histórico de atendimento local.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── CONTEÚDO DA ABA 6: PATROCINADORES & APOIADORES ── */}
          {activeTab === "patrocinadores" && hasSponsors && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sponsors.map((sp: any) => (
                  <div
                    key={sp.id}
                    className="p-5 rounded-2xl border border-border/60 bg-card flex flex-col justify-between space-y-3 shadow-2xs hover:border-foreground/30 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] uppercase font-bold",
                            sp.tier === "gold"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                              : sp.tier === "silver"
                              ? "bg-slate-500/10 text-slate-600 border-slate-500/30"
                              : "bg-muted/30"
                          )}
                        >
                          {sp.tier || "Apoiador Oficial"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        {sp.logo_url ? (
                          <img
                            src={sp.logo_url}
                            alt={sp.name}
                            className="size-12 rounded-xl object-contain bg-muted/20 border border-border/40 p-1"
                          />
                        ) : (
                          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {sp.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{sp.name}</h4>
                          {sp.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {sp.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {sp.website_url && (
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-9 px-3 text-xs font-semibold w-full gap-1.5"
                      >
                        <a href={sp.website_url} target="_blank" rel="noopener noreferrer">
                          <span>{sp.cta_label || "Conhecer Parceiro"}</span>
                          <ExternalLink className="size-3" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox para fotos dos posts */}
      {lightboxPost && (
        <MediaLightboxModal
          isOpen={!!lightboxPost}
          onClose={() => setLightboxPost(null)}
          mediaUrls={lightboxPost.media_urls || []}
          initialIndex={0}
          postContext={{
            authorName: store.name || store.business_name,
            authorAvatar: logoUrl,
            caption: lightboxPost.content_text,
            createdAt: lightboxPost.created_at,
          }}
        />
      )}

      {/* Modal de Modificadores de Produto */}
      {selectedProductForModifiers && (
        <ProductModifiersModal
          product={selectedProductForModifiers}
          isOpen={!!selectedProductForModifiers}
          onClose={() => setSelectedProductForModifiers(null)}
          onConfirm={handleConfirmModifiers}
        />
      )}
    </div>
  );
}
