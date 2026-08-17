import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  MagnifyingGlass,
  MapPin,
  Clock,
  Phone,
  Star,
  Sparkle,
  AirplaneTilt,
  Camera,
  ForkKnife,
  Buildings,
  Mountains,
  WhatsappLogo,
  ArrowRight,
} from "@phosphor-icons/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { listActiveBanners } from "@/services/banner.functions";
import { listActiveHotpages } from "@/services/hotpage.functions";
import { listPublicTourism } from "@/services/tourism.functions";

export const Route = createFileRoute("/_store/turismo")({
  head: () => ({
    meta: [
      { title: "Turismo, Viagens & Lazer Regional — JAH" },
      {
        name: "description",
        content:
          "Descubra os melhores passeios, pousadas de charme, ecoturismo, cachoeiras e pacotes de viagens em Chapecó e região.",
      },
    ],
  }),
  loader: async () => {
    const [banners, hotpages, tourismItems] = await Promise.all([
      listActiveBanners({ data: { placement: "home" } }).catch(() => []),
      listActiveHotpages({ data: { module: "home" } }).catch(() => []),
      listPublicTourism().catch(() => []),
    ]);

    return { banners, hotpages, tourismItems };
  },
  component: TourismMasterPage,
});

const TOURISM_HOTPAGES = [
  {
    id: "hp-tour-1",
    title: "Passeios & Trilhas",
    slug: "passeios",
    cover_image_url: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80",
    badge_label: "Ao Ar Livre",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-tour-2",
    title: "Hotéis & Pousadas",
    slug: "hospedagens",
    cover_image_url: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=800&q=80",
    badge_label: "Estadia",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-tour-3",
    title: "Agências & Pacotes",
    slug: "agencias",
    cover_image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
    badge_label: "Excursões",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-tour-4",
    title: "Gastronomia Turística",
    slug: "gastronomia_turistica",
    cover_image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80",
    badge_label: "Colonial",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-tour-5",
    title: "Aventura & Caiaque",
    slug: "aventura",
    cover_image_url: "https://images.unsplash.com/photo-1472745433479-4556f22e32c2?w=800&q=80",
    badge_label: "Ecoturismo",
    show_title: true,
    show_overlay: true,
  },
];

const CATEGORY_CHIPS = [
  { id: "todos", label: "Todas Experiências", icon: Sparkle },
  { id: "passeios", label: "Passeios & Barco", icon: AirplaneTilt },
  { id: "hospedagens", label: "Cabanas & Pousadas", icon: Buildings },
  { id: "gastronomia_turistica", label: "Vinícolas & Sabores", icon: ForkKnife },
  { id: "aventura", label: "Aventura & Trilhas", icon: Mountains },
  { id: "agencias", label: "Agências & Guias", icon: Compass },
];

function TourismMasterPage() {
  const { banners, tourismItems: initialItems } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [search, setSearch] = useState("");

  const { data: items } = useQuery({
    queryKey: ["tourism-list", selectedCategory, search],
    queryFn: () =>
      listPublicTourism({
        data: {
          category: selectedCategory !== "todos" ? selectedCategory : undefined,
          search: search || undefined,
        },
      }),
    initialData: initialItems,
  });

  return (
    <div className="w-full space-y-8 pb-24">
      {/* 1. Banners Contextuais de Turismo (Clean Media Mode) */}
      <section aria-label="Banners de Turismo">
        <BannerHeroCarousel banners={banners} />
      </section>

      {/* 2. Hotpages Contextuais de Turismo */}
      <section aria-label="Categorias de Turismo">
        <HotpagesRail
          hotpages={TOURISM_HOTPAGES as any}
          activeSlug={selectedCategory}
          onSelect={(slug) => setSelectedCategory(slug)}
        />
      </section>

      {/* 3. Filtros em Cards Gordinhos & Barra de Busca */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass size={16} weight="bold" className="text-foreground" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Categorias Turísticas
            </h3>
          </div>

          <div className="relative w-full md:w-72">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar destino, pousada, passeio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none pb-2 pt-1 w-full px-0.5">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            const Icon = chip.icon;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedCategory(chip.id)}
                className={`min-w-[104px] sm:min-w-[114px] h-[94px] sm:h-[100px] p-3 rounded-2xl flex flex-col items-center justify-between border cursor-pointer select-none shrink-0 transition-all group ${
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
      </section>

      {/* 4. Grid de Experiências & Roteiros Turísticos */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items &&
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-border bg-card overflow-hidden shadow-2xs hover:border-foreground/30 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                {/* Imagem de Capa */}
                <Link
                  to="/turismo/$id"
                  params={{ id: item.id }}
                  className="relative aspect-16/10 w-full overflow-hidden bg-muted block cursor-pointer"
                >
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/70 backdrop-blur-md text-white border-white/20 text-[10px] font-bold">
                      {item.duration || item.location}
                    </Badge>
                  </div>
                  {item.is_featured && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-foreground text-background text-[10px] font-black uppercase">
                        Destaque
                      </Badge>
                    </div>
                  )}
                </Link>

                {/* Conteúdo */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} weight="bold" className="text-foreground" />
                      <span className="truncate">{item.location}</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-foreground">
                      <Star size={12} weight="fill" className="text-amber-500" />
                      <span>{item.rating.toFixed(1)}</span>
                    </span>
                  </div>

                  <Link
                    to="/turismo/$id"
                    params={{ id: item.id }}
                    className="text-base font-bold text-foreground leading-snug line-clamp-2 hover:underline block"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Rodapé & Ação */}
              <div className="p-5 pt-0 border-t border-border mt-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-mono font-bold">
                    Tarifa
                  </span>
                  <p className="font-mono font-bold text-xs text-foreground">
                    {item.price_display}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {item.contact_whatsapp && (
                    <a
                      href={`https://wa.me/55${item.contact_whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá, vi a experiência ${item.title} no JAH e gostaria de informações.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="size-9 rounded-xl border border-border bg-card hover:bg-muted text-foreground flex items-center justify-center transition-all"
                      title="Conversar no WhatsApp"
                    >
                      <WhatsappLogo size={18} weight="bold" />
                    </a>
                  )}

                  <Button asChild size="sm" className="rounded-xl font-bold text-xs h-9 px-4 gap-1.5 bg-foreground text-background">
                    <Link to="/turismo/$id" params={{ id: item.id }}>
                      <span>Ver Roteiro</span>
                      <ArrowRight size={14} weight="bold" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
