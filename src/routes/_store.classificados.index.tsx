import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  Search,
  MapPin,
  Clock,
  Phone,
  Plus,
  Car,
  Home,
  Laptop,
  Sofa,
  Wrench,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BannerHeroCarousel } from "@/components/commerce/banner-hero-carousel";
import { HotpagesRail } from "@/components/commerce/hotpages-rail";
import { formatMoney } from "@/lib/money";
import { listActiveBanners } from "@/services/banner.functions";
import { listActiveHotpages } from "@/services/hotpage.functions";
import { getPublicClassifieds } from "@/services/classifieds.functions";

export const Route = createFileRoute("/_store/classificados/")({
  head: () => ({
    meta: [
      { title: "Classificados & Desapegos — JAH" },
      {
        name: "description",
        content:
          "Compre e venda veículos, imóveis, eletrônicos, móveis e serviços direto com quem mora em Chapecó e região.",
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
    title: "Veículos & Autos",
    slug: "vehicle",
    cover_image_url: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&q=80",
    badge_label: "Carros & Motos",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-2",
    title: "Imóveis & Aluguel",
    slug: "real_estate",
    cover_image_url: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80",
    badge_label: "Casas & Apês",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-3",
    title: "Eletrônicos & Celulares",
    slug: "sale",
    cover_image_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    badge_label: "Tech & Apple",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-4",
    title: "Móveis & Decoração",
    slug: "sale",
    cover_image_url: "https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?w=800&q=80",
    badge_label: "Casa & Jardim",
    show_title: true,
    show_overlay: true,
  },
  {
    id: "hp-class-5",
    title: "Ferramentas & Negócios",
    slug: "sale",
    cover_image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&q=80",
    badge_label: "Indústria & Máquinas",
    show_title: true,
    show_overlay: true,
  },
];

const CLASSIFIED_CHIPS = [
  { id: "todos", label: "Todos os Anúncios" },
  { id: "vehicle", label: "Veículos" },
  { id: "real_estate", label: "Imóveis" },
  { id: "sale", label: "Desapegos & Tech" },
  { id: "service", label: "Serviços & Bicos" },
];

function ClassifiedsMasterPage() {
  const { banners, classifieds: initialClassifieds } = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [search, setSearch] = useState("");

  const { data: classifieds } = useQuery({
    queryKey: ["classifieds-master-list", selectedCategory, search],
    queryFn: () =>
      getPublicClassifieds({
        data: {
          category: selectedCategory !== "todos" ? selectedCategory : undefined,
        },
      }),
    initialData: initialClassifieds,
  });

  const filtered = (classifieds || []).filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      (item.location_name && item.location_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="w-full space-y-8 pb-24">
      {/* 1. Banners Contextuais de Classificados (Clean Media Mode) */}
      <section aria-label="Banners de Classificados">
        <BannerHeroCarousel banners={banners} />
      </section>

      {/* 2. Hotpages Contextuais de Classificados */}
      <section aria-label="Categorias de Classificados">
        <HotpagesRail
          hotpages={CLASSIFIEDS_HOTPAGES as any}
          activeSlug={selectedCategory}
          onSelect={(slug) => setSelectedCategory(slug)}
        />
      </section>

      {/* 3. Filtros em Chips & Barra de Busca & Botão de Anunciar */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto scrollbar-none pb-1">
          {CLASSIFIED_CHIPS.map((chip) => {
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

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar veículo, imóvel, produto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-2xl text-xs bg-card"
            />
          </div>

          <Button
            asChild
            className="h-10 px-4 rounded-2xl font-bold text-xs bg-primary text-primary-foreground shrink-0 gap-1.5"
          >
            <Link to="/conta/classificados/novo">
              <Plus className="size-4" />
              <span>Anunciar Grátis</span>
            </Link>
          </Button>
        </div>
      </section>

      {/* 4. Grid de Classificados */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((item) => {
          const img =
            item.images && item.images.length > 0
              ? item.images[0]
              : "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=800&q=80";

          return (
            <Link
              key={item.id}
              to="/classificados/$id"
              params={{ id: item.id }}
              className="group rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs hover-elevate transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                {/* Imagem */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted">
                  <img
                    src={img}
                    alt={item.title}
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <Badge variant="secondary" className="text-[9px] uppercase font-mono bg-black/60 text-white backdrop-blur-md border-none">
                      {item.category}
                    </Badge>
                  </div>
                </div>

                {/* Conteúdo */}
                <div className="p-4 pt-1 space-y-1.5">
                  <span className="text-base font-mono font-black text-foreground block">
                    {formatMoney(item.price_cents || 0)}
                  </span>

                  <h3 className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-[11px] text-muted-foreground line-clamp-1">
                    {item.content}
                  </p>
                </div>
              </div>

              {/* Localização & Rodapé */}
              <div className="p-4 pt-0 text-[10px] text-muted-foreground font-mono flex items-center justify-between border-t border-border/40 mt-2">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 text-primary shrink-0" />
                  <span className="truncate">{item.location_name || item.location_text || "Chapecó, SC"}</span>
                </span>
                <span className="text-primary font-bold shrink-0">Ver Detalhes ➔</span>
              </div>
            </Link>
          );
        })}
      </section>
    </div>
  );
}
