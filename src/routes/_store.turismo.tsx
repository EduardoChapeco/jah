import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Search,
  MapPin,
  Clock,
  Phone,
  Star,
  Sparkles,
  Plane,
  Camera,
  Utensils,
  Hotel,
  Mountain,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  { id: "todos", label: "Todas as Experiências" },
  { id: "passeios", label: "Passeios & Catamarã" },
  { id: "hospedagens", label: "Cabanas & Pousadas" },
  { id: "gastronomia_turistica", label: "Vinícolas & Sabores" },
  { id: "aventura", label: "Aventura & Trilhas" },
  { id: "agencias", label: "Agências de Viagens" },
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

      {/* 3. Filtros em Chips & Barra de Busca */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1">
          {CATEGORY_CHIPS.map((chip) => {
            const isActive = selectedCategory === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSelectedCategory(chip.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all select-none ${
                  isActive
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar destino, pousada, passeio..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-2xl text-xs bg-card"
          />
        </div>
      </section>

      {/* 4. Grid de Experiências & Roteiros Turísticos */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items &&
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs hover-elevate transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Imagem de Capa */}
                <div className="relative aspect-16/10 w-full overflow-hidden bg-muted">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/60 backdrop-blur-md text-white border-white/20 text-[10px] font-bold">
                      {item.duration || item.location}
                    </Badge>
                  </div>
                  {item.featured && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-black uppercase">
                        Destaque
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      <span className="truncate">{item.location}</span>
                    </span>
                    <span className="flex items-center gap-1 font-bold text-amber-500">
                      <Star className="size-3 fill-amber-500" />
                      <span>{item.rating.toFixed(1)}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Rodapé & Ação */}
              <div className="p-5 pt-0 border-t border-border/40 mt-3 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">
                    Investimento
                  </span>
                  <p className="font-mono font-black text-sm text-foreground">
                    {item.price_display}
                  </p>
                </div>

                <a
                  href={`https://wa.me/55${item.whatsapp}?text=Olá,%20vi%20o%20roteiro%20${encodeURIComponent(item.title)}%20no%20JAH%20e%20gostaria%20de%20mais%20informações.`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Phone className="size-3.5" />
                  <span>Reservar / Info</span>
                </a>
              </div>
            </div>
          ))}
      </section>
    </div>
  );
}
