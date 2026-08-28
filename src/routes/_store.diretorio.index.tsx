import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  CheckCircle,
  MapPin,
  Clock,
  WhatsappLogo,
  Sparkle,
  Heartbeat,
  Wrench,
  CarProfile,
  Tag,
  Briefcase,
  Star,
  ArrowRight,
  Storefront,
  ShieldCheck,
  Phone,
  ShareNetwork,
  Image as ImageIcon,
} from "@phosphor-icons/react";
import { getPublicDirectory, type DirectoryListingDTO } from "@/services/directory.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { trackAndOpenWhatsApp } from "@/lib/whatsapp";
import {
  DiscoveryControlBar,
  type ViewModeType,
  type FilterChipOption,
} from "@/components/commerce/discovery-control-bar";
import { HorizontalRail } from "@/components/commerce/horizontal-rail";
import { EmptyState } from "@/components/state/states";
import { resolveNicheDepartments } from "@/lib/niche-helpers";

const DIRECTORY_CATEGORIES: FilterChipOption[] = [
  { id: "todos", label: "Tudo", emoji: "🏢", icon: Sparkle },
  { id: "saude", label: "Saúde & Bem-Estar", emoji: "🩺", icon: Heartbeat },
  { id: "reformas", label: "Reformas & Obras", emoji: "🔨", icon: Wrench },
  { id: "auto", label: "Auto & Mecânica", emoji: "🚗", icon: CarProfile },
  { id: "pet", label: "Pet & Veterinária", emoji: "🐾", icon: Tag },
  { id: "servicos", label: "Serviços & B2B", emoji: "💼", icon: Briefcase },
];

// Capas temáticas de alta resolução por categoria quando o negócio não tiver imagem customizada
const CATEGORY_DEFAULT_COVERS: Record<string, string> = {
  saude: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80",
  reformas: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
  auto: "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80",
  pet: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80",
  servicos: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
  default: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
};

export const Route = createFileRoute("/_store/diretorio/")({
  head: () => ({
    meta: [
      { title: "Guia & Diretório de Empresas e Serviços — Wider" },
      {
        name: "description",
        content:
          "Encontre empresas, clínicas, oficinas, prestadores de serviços e comércios locais na região com fotos, avaliações, horários e contato direto via WhatsApp.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages] = await Promise.all([
      listActiveBanners({ data: { placement: "diretorio" } }).catch(() => []),
      listHotpages({ data: { module: "diretorio" } }).catch(() => []),
    ]);
    return { banners, hotpages };
  },
  component: DirectoryPage,
});

function DirectoryPage() {
  const { banners, hotpages } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [viewMode, setViewMode] = useState<ViewModeType>("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const { data: listings, isLoading } = useQuery({
    queryKey: ["public-directory", selectedCategory, searchQuery],
    queryFn: () =>
      getPublicDirectory({
        data: {
          limit: 60,
          category: selectedCategory === "todos" ? undefined : selectedCategory,
          search: searchQuery || undefined,
        },
      }),
    staleTime: 60_000,
  });

  const filteredListings = listings || [];

  // Agrupamento por Categoria para o Modo Feed
  const listingsByCategory = useMemo(() => {
    const map = new Map<string, DirectoryListingDTO[]>();
    filteredListings.forEach((item) => {
      const cat = item.category || "servicos";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries()).map(([catKey, catItems]) => {
      const chip = DIRECTORY_CATEGORIES.find((c) => c.id === catKey);
      return {
        categoryKey: catKey,
        categoryName: chip?.label || "Comércios & Serviços",
        items: catItems,
      };
    });
  }, [filteredListings]);

  // Empresas mais bem avaliadas para o carrossel de destaques no Feed
  const topRatedListings = useMemo(() => {
    return [...filteredListings]
      .filter((item) => item.rating >= 4.5)
      .slice(0, 6);
  }, [filteredListings]);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* ── 1. Banners Hero de Topo ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── 2. Hotpages & Coleções Locais ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias em Destaque">
          <HotpagesRail
            hotpages={hotpages}
            activeSlug={selectedCategory}
            onSelect={(slug) => setSelectedCategory(slug)}
          />
        </section>
      )}

      <DiscoveryControlBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Buscar empresas, médicos, mecânicos, pet shops, lojas..."
        categories={DIRECTORY_CATEGORIES}
        activeCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        allowedViewModes={["feed", "grid", "list"]}
        resultsCount={filteredListings.length}
      />

      {/* ── 4. Renderização Conforme o Modo de Visualização ── */}

      {/* MODE 1: FEED / TIMELINE DE EMPRESAS E TRILHOS TEMÁTICOS */}
      {viewMode === "feed" && (
        <div className="space-y-10">
          {/* Trilho de Empresas em Destaque / Mais Bem Avaliadas */}
          {topRatedListings.length > 0 && (
            <HorizontalRail
              title="Destaques & Mais Bem Avaliados"
              hideHeader={true}
              badge="Top Escolhas"
              actionLabel="Ver grade completa"
              onAction={() => setViewMode("grid")}
            >
              {topRatedListings.map((item) => (
                <div key={item.id} className="min-w-[290px] sm:min-w-[320px] max-w-[340px] shrink-0">
                  <DirectoryBusinessCard item={item} />
                </div>
              ))}
            </HorizontalRail>
          )}

          {/* Trilhos por Categoria de Serviços com Carrossel Padronizado */}
          {listingsByCategory.map(({ categoryKey, categoryName, items }) => (
            <HorizontalRail
              key={categoryKey}
              title={categoryName}
              hideHeader={true}
              badge={`${items.length} ${items.length === 1 ? "empresa" : "empresas"}`}
              actionLabel="Ver todas"
              onAction={() => {
                setSelectedCategory(categoryKey);
                setViewMode("grid");
              }}
            >
              {items.map((item) => (
                <div key={item.id} className="min-w-[290px] sm:min-w-[320px] max-w-[340px] shrink-0">
                  <DirectoryBusinessCard item={item} />
                </div>
              ))}
            </HorizontalRail>
          ))}

          {/* Feed Geral de Empresas no Fim da Página */}
          <div className="space-y-4 pt-6 ">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Storefront size={18} weight="bold" className="text-primary" />
                <span>Todas as Empresas e Serviços da Região</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono font-bold">
                {filteredListings.length} cadastros ativos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((item) => (
                <DirectoryBusinessCard key={item.id} item={item} />
              ))}
            </div>
          </div>

          {filteredListings.length === 0 && !isLoading && (
            <div className="py-16 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
              <EmptyState title="Nenhuma empresa ou serviço encontrado nesta categoria." />
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory("todos");
                    setSearchQuery("");
                  }}
                  className="rounded-xl font-bold text-xs"
                >
                  Ver todo o diretório
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: GRADE EXPANDIDA PADRONIZADA COM FOTOS DE CAPA E LOGO */}
      {viewMode === "grid" && (
        <div>
          {filteredListings.length === 0 && !isLoading ? (
            <div className="py-24 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
              <EmptyState title="Nenhuma empresa encontrada com estes filtros." />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredListings.map((item) => (
                <DirectoryBusinessCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: LISTA ESTILO GUIA COMERCIAL COMPACTO (LARGURA MÁXIMA) */}
      {viewMode === "list" && (
        <div className="space-y-3 w-full">
          {filteredListings.length === 0 && !isLoading ? (
            <div className="py-24 text-center space-y-3 bg-card rounded-2xl border border-border/60 p-8">
              <EmptyState title="Nenhuma empresa encontrada com estes filtros." />
            </div>
          ) : (
            <div className="flex flex-col space-y-3 w-full">
              {filteredListings.map((item) => (
                <DirectoryListItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── COMPONENTE PADRONIZADO: CARD DE EMPRESA COM CAPA FULL & LOGO ──────────────
function DirectoryBusinessCard({
  item,
  compactMode = false,
}: {
  item: DirectoryListingDTO;
  compactMode?: boolean;
}) {
  const coverUrl =
    item.banner_url ||
    CATEGORY_DEFAULT_COVERS[item.category] ||
    CATEGORY_DEFAULT_COVERS.default;

  const categoryLabel =
    DIRECTORY_CATEGORIES.find((c) => c.id === item.category)?.label || item.category;

  const whatsappNumber = (item.contact_whatsapp || item.contact_phone || "").replace(/\D/g, "");

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-3.5 sm:p-4 hover:border-foreground/25 transition-all duration-300">
      <Link
        to="/diretorio/$id"
        params={{ id: item.id }}
        className="space-y-3 focus-visible:outline-none block"
      >
        {/* ── Imagem Full de Capa do Negócio com Overlay ── */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-muted ">
          <img
            src={coverUrl}
            alt={item.business_name}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Badge de Categoria no Topo Esquerdo */}
          <div className="absolute top-2.5 left-2.5">
            <Badge className="bg-background/90 text-foreground backdrop-blur-md text-[10px] font-bold px-2 py-0.5 rounded-lg  ">
              {categoryLabel}
            </Badge>
          </div>

          {/* Badge de Verificado no Topo Direito */}
          {item.is_verified && (
            <div className="absolute top-2.5 right-2.5">
              <Badge className="bg-emerald-500/90 text-white backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-lg  flex items-center gap-1">
                <ShieldCheck size={12} weight="bold" />
                <span>Verificado</span>
              </Badge>
            </div>
          )}
        </div>

        {/* ── Header da Empresa: Logo Avatar + Nome + Avaliação ── */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            {/* Logo Avatar Flutuante */}
            <div className="size-12 rounded-2xl bg-card border-2 border-background  overflow-hidden shrink-0 flex items-center justify-center -mt-6 relative z-10">
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  alt={item.business_name}
                  className="size-full object-cover"
                />
              ) : (
                <div className="size-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {item.business_name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="text-sm sm:text-base font-bold text-foreground line-clamp-1 leading-tight group-hover:text-primary transition-colors">
                {item.business_name}
              </h3>

              {/* Avaliação em Estrelas */}
              {item.rating && (
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                  <div className="flex items-center text-amber-500">
                    <Star size={13} weight="fill" />
                    <span className="font-bold font-mono ml-1 text-foreground">
                      {Number(item.rating).toFixed(1)}
                    </span>
                  </div>
                  {item.reviews_count > 0 && (
                    <span className="text-[11px] font-medium text-muted-foreground">
                      ({item.reviews_count} avaliações)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Endereço / Localização */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium pt-1">
            <MapPin size={14} weight="bold" className="text-primary shrink-0" />
            <span className="truncate">{item.address || "Regional"}</span>
          </div>

          {/* Especialidades / Tags */}
          {item.specialties && item.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {item.specialties.slice(0, 3).map((spec, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-md truncate max-w-[120px]"
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* Descrição resumida */}
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
              {item.description}
            </p>
          )}
        </div>
      </Link>

      {/* ── Barra de Ações Rápidas (WhatsApp + Perfil Completo) ── */}
      <div className="pt-3 mt-3  flex items-center justify-between gap-2">
        {whatsappNumber ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              trackAndOpenWhatsApp({
                phone: whatsappNumber,
                storeId: (item as any).store_id || null,
                entityType: "directory",
                entityId: item.id,
                entityTitle: item.business_name,
                niche: item.category,
              });
            }}
            className="size-9 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-all shrink-0 cursor-pointer"
            title="Conversar no WhatsApp"
          >
            <WhatsappLogo size={18} weight="bold" />
          </button>
        ) : (
          <div />
        )}

        <Button
          asChild
          size="sm"
          className="rounded-xl font-bold text-xs h-9 px-4 flex-1 bg-foreground text-background hover:bg-foreground/90 transition-all gap-1.5 "
        >
          <Link to="/diretorio/$id" params={{ id: item.id }}>
            <span>Ver Perfil</span>
            <ArrowRight size={14} weight="bold" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

// ─── COMPONENTE: ITEM EM MODO LISTA COMPACTA ──────────────────────────────────
function DirectoryListItem({ item }: { item: DirectoryListingDTO }) {
  const coverUrl =
    item.banner_url ||
    CATEGORY_DEFAULT_COVERS[item.category] ||
    CATEGORY_DEFAULT_COVERS.default;

  const categoryLabel =
    DIRECTORY_CATEGORIES.find((c) => c.id === item.category)?.label || item.category;

  const whatsappNumber = (item.contact_whatsapp || item.contact_phone || "").replace(/\D/g, "");

  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-2xl border border-border/60 bg-card hover:border-foreground/30 transition-all gap-3.5 group">
      <Link
        to="/diretorio/$id"
        params={{ id: item.id }}
        className="flex items-center gap-3.5 min-w-0 flex-1 focus-visible:outline-none"
      >
        {/* Thumbnail de Capa */}
        <div className="relative size-16 sm:size-20 rounded-xl overflow-hidden bg-muted  shrink-0">
          <img
            src={coverUrl}
            alt={item.business_name}
            loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {item.avatar_url && (
            <img
              src={item.avatar_url}
              alt=""
              className="absolute bottom-1 right-1 size-6 rounded-md border border-background object-cover bg-card "
            />
          )}
        </div>

        {/* Informações da Empresa */}
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] font-mono font-bold uppercase px-1.5 py-0 h-4">
              {categoryLabel}
            </Badge>
            {item.is_verified && (
              <span className="text-emerald-600 flex items-center text-[10px] font-bold gap-0.5">
                <CheckCircle size={12} weight="fill" />
                <span>Verificado</span>
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {item.business_name}
          </h3>

          {item.rating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center text-amber-500 font-bold font-mono">
                <Star size={12} weight="fill" className="mr-0.5" />
                <span>{Number(item.rating).toFixed(1)}</span>
              </div>
              <span>•</span>
              <span className="truncate">{item.address || "Regional"}</span>
            </div>
          )}
        </div>
      </Link>

      {/* Botões de Ação na Lista */}
      <div className="flex items-center gap-2 shrink-0">
        {whatsappNumber && (
          <button
            type="button"
            onClick={() =>
              trackAndOpenWhatsApp({
                phone: whatsappNumber,
                storeId: (item as any).store_id || null,
                entityType: "directory",
                entityId: item.id,
                entityTitle: item.business_name,
                niche: item.category,
              })
            }
            className="size-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 flex items-center justify-center transition-all cursor-pointer"
            title="WhatsApp"
          >
            <WhatsappLogo size={16} weight="bold" />
          </button>
        )}

        <Button
          asChild
          size="sm"
          className="h-8 px-3 rounded-xl font-bold text-xs bg-foreground text-background hover:bg-foreground/90 "
        >
          <Link to="/diretorio/$id" params={{ id: item.id }}>
            Ver Perfil
          </Link>
        </Button>
      </div>
    </div>
  );
}
