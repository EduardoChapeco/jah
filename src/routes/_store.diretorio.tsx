import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Compass,
  Phone,
  CheckCircle,
  Storefront,
  MapPin,
  Clock,
  MagnifyingGlass,
  ArrowSquareOut,
  WhatsappLogo,
  Sparkle,
  Heartbeat,
  Wrench,
  CarProfile,
  Tag,
  Briefcase,
  CircleNotch,
  WarningCircle,
} from "@phosphor-icons/react";
import { getPublicDirectory } from "@/services/directory.functions";
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
    queryKey: ["public-directory", selectedCategory],
    queryFn: () =>
      getPublicDirectory({
        data: {
          limit: 50,
          category: selectedCategory === "todos" ? undefined : selectedCategory,
        },
      }),
    staleTime: 60_000,
  });

  const filteredListings = (listings || []).filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const storeName = (item.stores as any)?.name?.toLowerCase() || "";
    const description = (item.stores as any)?.description?.toLowerCase() || "";
    const address = item.address?.toLowerCase() || "";
    return storeName.includes(q) || description.includes(q) || address.includes(q);
  });

  return (
    <div className="w-full space-y-8">
      {/* ── Banners Hero ── */}
      {banners && banners.length > 0 && (
        <BannerHeroCarousel banners={banners} className="w-full" />
      )}

      {/* ── Hotpages & Categorias ── */}
      {hotpages && hotpages.length > 0 && (
        <section aria-label="Categorias">
          <HotpagesRail
            hotpages={hotpages}
            activeSlug={selectedCategory}
            onSelect={(slug) => setSelectedCategory(slug)}
          />
        </section>
      )}

      {/* ── Barra Superior de Filtros & Busca ── */}
      {/* ── 2. Barra Superior & Busca ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-foreground text-background">
            Diretório
          </span>
          <span className="text-xs text-muted-foreground font-mono">Guia Local Verificado</span>
        </div>

        {/* Busca no Guia */}
        <div className="flex gap-2 w-full sm:w-72">
          <Input
            placeholder="Buscar por especialista, serviço..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl h-10 bg-card text-xs border-border"
          />
          <Button size="icon" className="h-10 w-10 rounded-xl shrink-0 font-bold">
            <MagnifyingGlass size={16} weight="bold" />
          </Button>
        </div>
      </div>

      {/* ── Cards Gordinhos de Categorias de Serviços ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Compass size={16} weight="bold" className="text-foreground" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
            Categorias de Especialistas
          </h3>
        </div>

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

      {isLoading && (
        <div className="flex justify-center py-24">
          <CircleNotch size={32} className="animate-spin text-muted-foreground" />
        </div>
      )}

      {isError && (
        <div className="py-12 px-6 rounded-2xl border border-destructive/20 bg-destructive/5 text-center space-y-3">
          <WarningCircle size={32} className="text-destructive mx-auto" />
          <p className="font-bold text-foreground text-sm">Erro ao carregar o Diretório</p>
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
          {filteredListings.map((listing) => {
            const storeData = listing.stores as any;
            const phoneDigits = listing.contact_phone ? listing.contact_phone.replace(/\D/g, "") : "";

            return (
              <div
                key={listing.id}
                className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-2xs hover-elevate transition-all space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {storeData?.avatar_url ? (
                        <img
                          src={storeData.avatar_url}
                          alt={storeData.name}
                          className="size-12 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded-2xl bg-muted text-foreground flex items-center justify-center font-bold text-base border border-border shrink-0">
                          {storeData?.name?.charAt(0) || "J"}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-black text-foreground leading-tight line-clamp-1">
                          {storeData?.name || "Negócio Comunitário"}
                        </h3>
                        <Badge variant="outline" className="text-[10px] uppercase font-mono mt-1">
                          {listing.category || "Serviços"}
                        </Badge>
                      </div>
                    </div>

                    {listing.is_verified && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle size={14} weight="fill" /> Verificado
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {storeData?.description && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {storeData.description}
                    </p>
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
                  {listing.contact_phone && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl text-xs font-bold gap-1.5 h-10 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    >
                      <a
                        href={`https://wa.me/55${phoneDigits}`}
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
                    <Link to="/mercado">
                      <Storefront size={16} weight="bold" />
                      <span>Ver Vitrine</span>
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
