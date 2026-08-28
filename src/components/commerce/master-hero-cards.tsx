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
  Sparkle,
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

// Fallback de categorias padrão para cards grandes caso não haja nenhum no banco
const DEFAULT_HERO_MEDIA_CARDS = [
  {
    slug: "gastronomia",
    to: "/gastronomia",
    title: "Gastronomia & Delivery",
    defaultCover: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80",
  },
  {
    slug: "mercado",
    to: "/mercado",
    title: "Mercado & Hortifrúti",
    defaultCover: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&q=80",
  },
  {
    slug: "farmacia",
    to: "/farmacia",
    title: "Farmácia & Saúde",
    defaultCover: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1000&q=80",
  },
  {
    slug: "bebidas",
    to: "/bebidas",
    title: "Bebidas & Adega",
    defaultCover: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&q=80",
  },
  {
    slug: "acougue",
    to: "/acougue",
    title: "Açougues & Carnes Nobres",
    defaultCover: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&q=80",
  },
  {
    slug: "eletronicos",
    to: "/eletronicos",
    title: "Eletrônicos & Tech",
    defaultCover: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=1000&q=80",
  },
  {
    slug: "moda",
    to: "/moda",
    title: "Roupas & Moda",
    defaultCover: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1000&q=80",
  },
  {
    slug: "casa",
    to: "/casa",
    title: "Móveis & Decoração",
    defaultCover: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1000&q=80",
  },
];

// Fallback de botões padrão caso o banco de dados esteja zerado
const DEFAULT_CHIP_BUTTONS = [
  { slug: "ofertas", to: "/ofertas", label: "Ofertas", emoji: "⚡️", icon: Flame },
  { slug: "gastronomia", to: "/gastronomia", label: "Delivery", emoji: "🍕", icon: ForkKnife },
  { slug: "mercado", to: "/mercado", label: "Mercados", emoji: "🥦", icon: Storefront },
  { slug: "farmacia", to: "/farmacia", label: "Farmácia", emoji: "💊", icon: Heartbeat },
  { slug: "bebidas", to: "/bebidas", label: "Bebidas", emoji: "🍷", icon: Coffee },
  { slug: "acougue", to: "/acougue", label: "Açougue", emoji: "🥩", icon: Flame },
  { slug: "eletronicos", to: "/eletronicos", label: "Eletrônicos", emoji: "📱", icon: Storefront },
  { slug: "moda", to: "/moda", label: "Moda", emoji: "👗", icon: TShirt },
  { slug: "casa", to: "/casa", label: "Casa", emoji: "🛋️", icon: Storefront },
  { slug: "pet", to: "/pet", label: "Pet Shop", emoji: "🐾", icon: Heartbeat },
  { slug: "construcao", to: "/construcao", label: "Construção", emoji: "🧱", icon: Storefront },
  { slug: "servicos", to: "/servicos", label: "Serviços", emoji: "🛠️", icon: Briefcase },
  { slug: "imoveis", to: "/imoveis", label: "Imóveis", emoji: "🏡", icon: House },
  { slug: "beleza", to: "/beleza", label: "Beleza", emoji: "✂️", icon: Scissors },
  { slug: "agenda", to: "/agenda", label: "Eventos", emoji: "🎟️", icon: CalendarDots },
  { slug: "turismo", to: "/turismo", label: "Turismo", emoji: "✈️", icon: AirplaneTilt },
  { slug: "mobilidade", to: "/mobilidade", label: "Mobilidade", emoji: "🚗", icon: CarProfile },
  { slug: "classificados", to: "/classificados", label: "Classificados", emoji: "🏷️", icon: Tag },
  { slug: "empregos", to: "/empregos", label: "Vagas", emoji: "💼", icon: Briefcase },
];

export function MasterHeroCards({ customCategories, hotpages = [] }: MasterHeroCardsProps) {
  // ── 1. Resolução Dinâmica dos Cards Grandes do Topo (Hero Cards) ──
  // Se houver hotpages com cover_image_url ou cadastradas no admin, usa-as diretamente;
  // Caso contrário, mescla com os defaults.
  const activeHeroCards = React.useMemo(() => {
    // Se temos hotpages cadastradas no banco
    if (hotpages.length > 0) {
      // Pega todas as hotpages que têm cover_image_url ou bg_media_url ou que pertencem ao módulo
      const configuredCards = hotpages.map((hp) => {
        const defaultMatch = DEFAULT_HERO_MEDIA_CARDS.find(
          (d) => d.slug === hp.slug || hp.slug.includes(d.slug),
        );
        return {
          id: hp.id,
          slug: hp.slug,
          to: hp.target_route || `/${hp.slug.replace(/^home-/, "")}`,
          title: hp.title,
          coverUrl: hp.cover_image_url || hp.bg_media_url || defaultMatch?.defaultCover || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80",
          isVideo: hp.bg_media_type === "video" && Boolean(hp.bg_media_url),
          videoUrl: hp.bg_media_url,
          sort_order: hp.sort_order ?? 0,
        };
      });

      return configuredCards.sort((a, b) => a.sort_order - b.sort_order);
    }

    // Fallback padrão se banco estiver vazio
    return DEFAULT_HERO_MEDIA_CARDS.map((card, idx) => ({
      id: `default-${card.slug}`,
      slug: card.slug,
      to: card.to,
      title: card.title,
      coverUrl: card.defaultCover,
      isVideo: false,
      videoUrl: undefined,
      sort_order: idx,
    }));
  }, [hotpages]);

  // ── 2. Resolução Dinâmica dos Botões / Chips de Subcategorias ──
  // Renderiza EXATAMENTE os botões cadastrados e gerenciados no Admin Master
  const activeChipButtons = React.useMemo(() => {
    if (hotpages.length > 0) {
      return hotpages.map((hp) => {
        const defaultMatch = DEFAULT_CHIP_BUTTONS.find(
          (d) => d.slug === hp.slug || hp.slug.includes(d.slug),
        );

        return {
          id: hp.id,
          slug: hp.slug,
          label: hp.title,
          to: hp.target_route || `/${hp.slug.replace(/^home-/, "")}`,
          icon: defaultMatch?.icon || Sparkle,
          icon_url: hp.custom_icon_url || hp.icon_url || undefined,
          emoji: (hp as any).emoji || defaultMatch?.emoji || undefined,
          badge: hp.badge_label || undefined,
          bg_media_type: hp.bg_media_type || "none",
          bg_media_url: hp.bg_media_url || undefined,
          bg_color: hp.bg_color || undefined,
          bg_overlay_opacity: hp.bg_overlay_opacity ?? 35,
          bg_texture: hp.bg_texture || "none",
          sort_order: hp.sort_order ?? 0,
        };
      }).sort((a, b) => a.sort_order - b.sort_order);
    }

    // Fallback caso não haja botões no banco
    return DEFAULT_CHIP_BUTTONS.map((item, idx) => {
      const customMatch = customCategories?.find((c) => c.slug === item.slug);
      return {
        id: `default-chip-${item.slug}`,
        slug: item.slug,
        label: item.label,
        to: item.to,
        icon: item.icon,
        icon_url: customMatch?.icon_url,
        emoji: item.emoji,
        badge: undefined,
        bg_media_type: "none" as const,
        bg_media_url: undefined,
        bg_color: undefined,
        bg_overlay_opacity: 35,
        bg_texture: "none" as const,
        sort_order: idx,
      };
    });
  }, [hotpages, customCategories]);

  return (
    <div className="w-full space-y-4">
      {/* ── 1. Carrossel Horizontal de Cards Grandes MAIORES e 100% LIMPOS (16:9 / 21:9) ── */}
      <div
        className="flex gap-4 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory focus:outline-none"
        tabIndex={0}
        aria-label="Categorias Principais"
      >
        {activeHeroCards.map((card) => (
          <Link
            key={card.id || card.slug}
            to={card.to as any}
            className="group relative overflow-hidden rounded-3xl bg-card shrink-0 snap-start w-[78vw] max-w-[320px] sm:w-[340px] md:w-[380px] h-[155px] sm:h-[200px] md:h-[220px] transition-transform duration-200 active:scale-[0.98] select-none block border border-border/40 hover:border-primary/50"
          >
            {card.isVideo && card.videoUrl ? (
              <video
                src={card.videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="size-full object-cover group-hover:scale-103 transition-transform duration-500"
              />
            ) : (
              <img
                src={card.coverUrl}
                alt={card.title}
                className="size-full object-cover group-hover:scale-103 transition-transform duration-500"
                loading="eager"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&q=80";
                }}
              />
            )}
          </Link>
        ))}
      </div>

      {/* ── 2. Botões / Chips de Subcategorias com Suporte a Ícone PNG Transparente, Vídeo, Textura & Rota Real ── */}
      <div
        className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-none w-full px-0.5 focus:outline-none"
        tabIndex={0}
        aria-label="Categorias Rápidas"
      >
        {activeChipButtons.map((item) => (
          <DynamicMediaChip
            key={item.id || item.slug}
            slug={item.slug}
            label={item.label}
            to={item.to}
            icon={item.icon}
            icon_url={item.icon_url}
            emoji={item.emoji}
            badge={item.badge}
            bg_media_type={item.bg_media_type}
            bg_media_url={item.bg_media_url}
            bg_color={item.bg_color}
            bg_overlay_opacity={item.bg_overlay_opacity}
            bg_texture={item.bg_texture}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
