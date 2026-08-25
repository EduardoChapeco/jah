import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ForkKnife,
  Storefront,
  Flame,
  Heartbeat,
  TShirt,
  Coffee,
  Scissors,
  Tag,
  CalendarDots,
  AirplaneTilt,
  Briefcase,
  CarProfile,
  House,
} from "@phosphor-icons/react";
import type { HotpageDTO } from "@/services/hotpage.functions";
import { DynamicMediaChip } from "@/components/commerce/dynamic-media-chip";

interface MasterHeroCardsProps {
  customCategories?: Array<{
    slug?: string;
    label: string;
    to: string;
    icon_url?: string;
  }>;
  hotpages?: HotpageDTO[];
}

// ── Cards Grandes de Mídia 100% Limpos (Para Imagens/Vídeos do Admin — Sem Texto/Tag) ──
const HERO_MEDIA_CARDS = [
  {
    slug: "gastronomia",
    to: "/gastronomia",
    search: {},
    title: "Gastronomia & Delivery",
    defaultCover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80",
  },
  {
    slug: "mercado",
    to: "/mercado",
    search: {},
    title: "Mercado & Hortifrúti",
    defaultCover: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&q=80",
  },
  {
    slug: "farmacia",
    to: "/farmacia",
    search: {},
    title: "Farmácia & Saúde",
    defaultCover: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&q=80",
  },
  {
    slug: "bebidas",
    to: "/bebidas",
    search: {},
    title: "Bebidas & Adega",
    defaultCover: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&q=80",
  },
  {
    slug: "acougue",
    to: "/acougue",
    search: {},
    title: "Açougues & Carnes Nobres",
    defaultCover: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&q=80",
  },
  {
    slug: "eletronicos",
    to: "/eletronicos",
    search: {},
    title: "Eletrônicos & Informática",
    defaultCover: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1000&q=80",
  },
  {
    slug: "moda",
    to: "/moda",
    search: {},
    title: "Roupas & Moda",
    defaultCover: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1000&q=80",
  },
  {
    slug: "casa",
    to: "/casa",
    search: {},
    title: "Móveis & Decoração",
    defaultCover: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&q=80",
  },
  {
    slug: "pet",
    to: "/pet",
    search: {},
    title: "Pet Shop & Veterinária",
    defaultCover: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1000&q=80",
  },
  {
    slug: "construcao",
    to: "/construcao",
    search: {},
    title: "Construção & Tintas",
    defaultCover: "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=1000&q=80",
  },
  {
    slug: "limpeza",
    to: "/limpeza",
    search: {},
    title: "Limpeza & Descartáveis",
    defaultCover: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1000&q=80",
  },
  {
    slug: "livros",
    to: "/livros",
    search: {},
    title: "Livraria & Papelaria",
    defaultCover: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1000&q=80",
  },
  {
    slug: "servicos",
    to: "/servicos",
    search: {},
    title: "Serviços Especializados",
    defaultCover: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1000&q=80",
  },
  {
    slug: "beleza",
    to: "/beleza",
    search: {},
    title: "Beleza, Cosméticos & Agendamentos",
    defaultCover: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1000&q=80",
  },
  {
    slug: "imoveis",
    to: "/imoveis",
    search: {},
    title: "Imóveis & Moradia",
    defaultCover: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1000&q=80",
  },
  {
    slug: "doacoes",
    to: "/doacoes",
    search: {},
    title: "Doações & Solidariedade",
    defaultCover: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?w=1000&q=80",
  },
];

// ── Botões / Chips de Subcategorias Ampliados (Canônico / Rota Corrigida / Suporte a Mídia) ──
const MASTER_CHIP_BUTTONS = [
  {
    slug: "ofertas",
    to: "/ofertas",
    label: "Ofertas",
    emoji: "⚡️",
    icon: Flame,
  },
  {
    slug: "gastronomia",
    to: "/gastronomia",
    label: "Delivery",
    emoji: "🍕",
    icon: ForkKnife,
  },
  {
    slug: "mercado",
    to: "/mercado",
    label: "Mercados",
    emoji: "🥦",
    icon: Storefront,
  },
  {
    slug: "farmacia",
    to: "/farmacia",
    label: "Farmácia",
    emoji: "💊",
    icon: Heartbeat,
  },
  {
    slug: "bebidas",
    to: "/bebidas",
    label: "Bebidas",
    emoji: "🍻",
    icon: Coffee,
  },
  {
    slug: "acougue",
    to: "/acougue",
    label: "Açougue",
    emoji: "🥩",
    icon: Flame,
  },
  {
    slug: "eletronicos",
    to: "/eletronicos",
    label: "Eletrônicos",
    emoji: "📱",
    icon: Storefront,
  },
  {
    slug: "moda",
    to: "/moda",
    label: "Moda & Estilo",
    emoji: "👗",
    icon: TShirt,
  },
  {
    slug: "casa",
    to: "/casa",
    label: "Casa & Móveis",
    emoji: "🛋️",
    icon: House,
  },
  {
    slug: "pet",
    to: "/pet",
    label: "Pet Shop",
    emoji: "🐾",
    icon: Heartbeat,
  },
  {
    slug: "construcao",
    to: "/construcao",
    label: "Construção",
    emoji: "🛠️",
    icon: Storefront,
  },
  {
    slug: "limpeza",
    to: "/limpeza",
    label: "Limpeza",
    emoji: "🧹",
    icon: Storefront,
  },
  {
    slug: "livros",
    to: "/livros",
    label: "Papelaria",
    emoji: "📚",
    icon: Storefront,
  },
  {
    slug: "servicos",
    to: "/servicos",
    label: "Serviços",
    emoji: "💼",
    icon: Briefcase,
  },
  {
    slug: "imoveis",
    to: "/imoveis",
    label: "Imóveis",
    emoji: "🏡",
    icon: House,
  },
  {
    slug: "beleza",
    to: "/beleza",
    label: "Beleza",
    emoji: "✂️",
    icon: Scissors,
  },
  {
    slug: "doacoes",
    to: "/doacoes",
    label: "Doações",
    emoji: "❤️",
    icon: Heartbeat,
  },
  {
    slug: "empregos",
    to: "/empregos",
    label: "Vagas",
    emoji: "💼",
    icon: Briefcase,
  },
  {
    slug: "agenda",
    to: "/agenda",
    label: "Eventos",
    emoji: "🎟️",
    icon: CalendarDots,
  },
  {
    slug: "classificados",
    to: "/classificados",
    label: "Classificados",
    emoji: "🏷️",
    icon: Tag,
  },
  {
    slug: "turismo",
    to: "/turismo",
    label: "Turismo",
    emoji: "✈️",
    icon: AirplaneTilt,
  },
  {
    slug: "mobilidade",
    to: "/mobilidade",
    label: "Mobilidade",
    emoji: "🚗",
    icon: CarProfile,
  },
];

export function MasterHeroCards({ customCategories, hotpages }: MasterHeroCardsProps) {
  return (
    <div className="w-full space-y-4">
      {/* ── 1. Carrossel Horizontal de Cards Grandes MAIORES e 100% LIMPOS (Sem texto/tags, Sem sombras) ── */}
      <div
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory focus:outline-none"
        tabIndex={0}
        aria-label="Categorias Principais"
      >
        {HERO_MEDIA_CARDS.map((card) => {
          const hotpageMatch = hotpages?.find((hp) => hp.slug === card.slug);
          const customMatch = customCategories?.find((c) => c.slug === card.slug);

          const isVideo = hotpageMatch?.bg_media_type === "video" && Boolean(hotpageMatch?.bg_media_url);
          const coverUrl =
            hotpageMatch?.cover_image_url ||
            hotpageMatch?.bg_media_url ||
            customMatch?.icon_url ||
            card.defaultCover;

          const targetTo = hotpageMatch?.target_route || card.to;

          return (
            <Link
              key={card.slug}
              to={targetTo as any}
              search={card.search as any}
              className="group relative overflow-hidden rounded-3xl  bg-card shrink-0 snap-start w-[78vw] max-w-[300px] sm:w-[340px] md:w-[380px] h-[155px] sm:h-[200px] md:h-[220px] transition-transform duration-200 active:scale-[0.98] select-none block"
            >
              {isVideo ? (
                <video
                  src={hotpageMatch!.bg_media_url!}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="size-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
              ) : (
                <img
                  src={coverUrl}
                  alt={card.title}
                  className="size-full object-cover group-hover:scale-103 transition-transform duration-500"
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = card.defaultCover;
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* ── 2. Botões / Chips de Subcategorias com Suporte a Vídeo, GIF, Imagem, Textura & Rota Corrigida ── */}
      <div
        className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none w-full px-0.5 focus:outline-none"
        tabIndex={0}
        aria-label="Categorias Rápidas"
      >
        {MASTER_CHIP_BUTTONS.map((item) => {
          const hotpageMatch = hotpages?.find((hp) => hp.slug === item.slug);
          const customMatch = customCategories?.find((c) => c.slug === item.slug);

          const iconUrl =
            hotpageMatch?.custom_icon_url ||
            hotpageMatch?.icon_url ||
            customMatch?.icon_url;

          const destinationTo = hotpageMatch?.target_route || item.to;

          return (
            <DynamicMediaChip
              key={item.label}
              slug={item.slug}
              label={hotpageMatch?.title || item.label}
              to={destinationTo}
              icon={item.icon}
              icon_url={iconUrl}
              emoji={item.emoji}
              badge={hotpageMatch?.badge_label}
              bg_media_type={hotpageMatch?.bg_media_type || "none"}
              bg_media_url={hotpageMatch?.bg_media_url}
              bg_color={hotpageMatch?.bg_color}
              bg_overlay_opacity={hotpageMatch?.bg_overlay_opacity}
              bg_texture={hotpageMatch?.bg_texture}
              size="md"
            />
          );
        })}
      </div>
    </div>
  );
}

