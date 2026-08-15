import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  CheckCircle,
  MapPin,
  Clock,
  MagnifyingGlass,
  WhatsappLogo,
  Sparkle,
  Heartbeat,
  Wrench,
  CarProfile,
  Tag,
  Briefcase,
  CircleNotch,
  Star,
  ArrowRight,
  Buildings,
} from "@phosphor-icons/react";
import { getPublicDirectory, type DirectoryListingDTO } from "@/services/directory.functions";
import { listHotpages } from "@/services/hotpage.functions";
import { listActiveBanners } from "@/services/banner.functions";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";

const DIRECTORY_CATEGORIES = [
  { id: "todos", label: "Todos os Negócios", icon: Sparkle },
  { id: "saude", label: "Saúde & Bem-Estar", icon: Heartbeat },
  { id: "reformas", label: "Reformas & Obras", icon: Wrench },
  { id: "auto", label: "Auto & Mecânica", icon: CarProfile },
  { id: "pet", label: "Pet & Veterinária", icon: Tag },
  { id: "servicos", label: "Serviços & B2B", icon: Briefcase },
];

export const Route = createFileRoute("/_store/diretorio")({
  head: () => ({
    meta: [
      { title: "Guia & Diretório de Serviços — JAH" },
      {
        name: "description",
        content: "Encontre especialistas, clínicas, oficinas, prestadores de serviços e comércios locais na sua região.",
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
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: listings,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-directory", selectedCategory, searchQuery],
    queryFn: () =>
      getPublicDirectory({
        data: {
          limit: 50,
          category: selectedCategory === "todos" ? undefined : selectedCategory,
          search: searchQuery || undefined,
        },
      }),
    staleTime: 60_000,
  });

  const filteredListings = listings || [];

  return (
    <div className="w-full space-y-8 pb-20">
      {/* ── Banners Hero ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── Hotpages & Categorias ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Destaques">
          <HotpagesRail hotpages={hotpages} title="Especialistas em Destaque" />
        </section>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold px-2.5 py-0.5">
            Guia Comercial & Profissional
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Chapecó & Região Oeste</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Guia & Diretório de Especialistas
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Descubra prestadores de serviço, clínicas, mecânicas, arquitetos, advogados e comércios locais referenciados pela comunidade.
        </p>
      </div>

      {/* ── Filtros e Busca ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass size={16} weight="bold" className="text-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Categorias do Guia
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar clínica, oficina, advogado..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-card"
            />
          </div>
        </div>

        {/* Squircle Categories */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 w-full px-0.5">
          {DIRECTORY_CATEGORIES.map((cat) => {
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
      </section>

      {/* ── Grid de Negócios ── */}
      {isLoading && (
        <div className="flex justify-center py-24">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <Compass size={40} className="text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Erro ao carregar o diretório
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Não foi possível carregar os negócios no momento. Tente novamente mais tarde.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredListings.length === 0 && (
        <div className="py-24 text-center space-y-3 bg-muted/10 rounded-3xl border border-border p-8">
          <Compass size={40} className="text-muted-foreground/40 mx-auto" />
          <h2 className="text-base font-bold text-foreground">
            Nenhum negócio encontrado nesta categoria
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Tente selecionar outra categoria ou utilizar outro termo na busca.
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {filteredListings.map((listing: DirectoryListingDTO) => {
            const cleanPhone = listing.contact_whatsapp?.replace(/\D/g, "") || listing.contact_phone?.replace(/\D/g, "") || "";

            return (
              <div
                key={listing.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-2xs hover:border-foreground/30 transition-all space-y-5 group"
              >
                <div className="space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to="/diretorio/$id"
                      params={{ id: listing.id }}
                      className="flex items-center gap-3 group-hover:opacity-90 transition-opacity"
                    >
                      {listing.avatar_url ? (
                        <img
                          src={listing.avatar_url}
                          alt={listing.business_name}
                          className="size-12 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded-2xl bg-muted text-foreground flex items-center justify-center font-bold text-base border border-border shrink-0">
                          {listing.business_name?.charAt(0) || "J"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-foreground leading-tight line-clamp-1 group-hover:underline">
                          {listing.business_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0">
                            {listing.category}
                          </Badge>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-foreground font-mono">
                            <Star size={12} weight="fill" className="text-amber-500" />
                            {listing.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {listing.is_verified && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle size={14} weight="fill" /> Verificado
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {listing.description}
                    </p>
                  )}

                  {/* Specialties Preview */}
                  {listing.specialties && listing.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {listing.specialties.slice(0, 2).map((spec, i) => (
                        <span
                          key={i}
                          className="text-[10px] bg-muted/60 text-foreground font-semibold px-2 py-0.5 rounded-lg truncate max-w-[180px]"
                        >
                          {spec}
                        </span>
                      ))}
                      {listing.specialties.length > 2 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          +{listing.specialties.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Address & Hours */}
                  <div className="space-y-1.5 pt-2 border-t border-border/50 text-xs text-muted-foreground font-medium">
                    {listing.address && (
                      <p className="flex items-center gap-2">
                        <MapPin size={14} weight="bold" className="text-foreground shrink-0" />
                        <span className="truncate">{listing.address}</span>
                      </p>
                    )}
                    {listing.working_hours && (
                      <p className="flex items-center gap-2">
                        <Clock size={14} weight="bold" className="text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{listing.working_hours}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                  {cleanPhone && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs font-bold gap-1.5 h-10 px-3 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 shrink-0"
                    >
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=Ol%C3%A1!%20Vi%20seu%20perfil%20no%20Guia%20JAH%20e%20gostaria%20de%20informa%C3%A7%C3%B5es.`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <WhatsappLogo size={16} weight="fill" className="text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>
                    </Button>
                  )}

                  <Button
                    asChild
                    size="sm"
                    className="flex-1 rounded-xl text-xs font-bold gap-1.5 h-10 bg-foreground text-background"
                  >
                    <Link to="/diretorio/$id" params={{ id: listing.id }}>
                      <span>Ver Perfil & Orçamento</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
