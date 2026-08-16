import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ForkKnife,
  Storefront,
  ArrowRight,
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

interface MasterHeroCardsProps {
  customCategories?: Array<{
    slug?: string;
    label: string;
    to: string;
    icon_url?: string;
    badge?: string;
  }>;
}

export function MasterHeroCards({ customCategories }: MasterHeroCardsProps) {
  return (
    <div className="w-full space-y-4">
      {/* ── 1. Top Dual Big Master Cards (iFood Reference Style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Card 1: Restaurantes & Gastronomia */}
        <Link
          to="/mercado"
          search={{ niche: "gastronomia" }}
          className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between min-h-[140px] sm:min-h-[160px]"
        >
          {/* Background Decorative Shapes */}
          <div className="absolute -right-6 -bottom-6 size-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute top-2 right-12 text-white/5 font-black text-7xl select-none pointer-events-none">
            JAH
          </div>

          <div className="relative z-10 space-y-2 max-w-[62%]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase">
              <ForkKnife size={13} weight="fill" />
              <span>Mais Pedidos</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Restaurantes & Lanches
            </h3>
            <p className="text-xs text-white/80 font-medium line-clamp-1">
              Pratos, combos, pizzas e delivery rápido
            </p>
            <div className="pt-1 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Ver opções</span>
              <ArrowRight size={14} weight="bold" />
            </div>
          </div>

          {/* 3D Visual Icon / Graphic */}
          <div className="relative z-10 shrink-0 size-24 sm:size-28 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-inner group-hover:rotate-3 transition-transform">
            <span className="text-4xl sm:text-5xl drop-shadow-md">🍔</span>
            <span className="text-[10px] font-bold mt-1 text-white/90">Entrega Grátis</span>
          </div>
        </Link>

        {/* Card 2: Mercados & Hortifrúti */}
        <Link
          to="/mercado"
          search={{ niche: "mercado" }}
          className="group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] flex items-center justify-between min-h-[140px] sm:min-h-[160px]"
        >
          {/* Background Decorative Shapes */}
          <div className="absolute -right-6 -bottom-6 size-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute top-2 right-12 text-white/5 font-black text-7xl select-none pointer-events-none">
            ECO
          </div>

          <div className="relative z-10 space-y-2 max-w-[62%]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase">
              <Storefront size={13} weight="fill" />
              <span>Essencial</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Mercado & Produtores
            </h3>
            <p className="text-xs text-white/80 font-medium line-clamp-1">
              Hortifrúti fresco, carnes, adega e despensa
            </p>
            <div className="pt-1 inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              <span>Buscar lojas</span>
              <ArrowRight size={14} weight="bold" />
            </div>
          </div>

          {/* 3D Visual Icon / Graphic */}
          <div className="relative z-10 shrink-0 size-24 sm:size-28 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex flex-col items-center justify-center shadow-inner group-hover:-rotate-3 transition-transform">
            <span className="text-4xl sm:text-5xl drop-shadow-md">🛒</span>
            <span className="text-[10px] font-bold mt-1 text-white/90">Do Produtor</span>
          </div>
        </Link>
      </div>

      {/* ── 2. Squircle Master Subcategories Rail (Chips & 3D Icons) ── */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <Sparkle size={14} weight="fill" className="text-primary" />
            <span>Navegar por Nichos Principais</span>
          </div>
          <Link
            to="/mercado"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Ver todos
          </Link>
        </div>

        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-none w-full px-0.5">
          {MASTER_SQUIRCLE_ITEMS.map((item) => {
            const Icon = item.icon;
            const customMatch = customCategories?.find((c) => c.slug === item.slug);
            const iconUrl = customMatch?.icon_url || item.custom_icon_url;

            return (
              <Link
                key={item.label}
                to={item.to as any}
                className="min-w-[88px] sm:min-w-[96px] h-[92px] sm:h-[98px] p-2.5 rounded-2xl border border-border/80 bg-card hover:bg-muted/60 hover:border-primary/40 flex flex-col items-center justify-between transition-all select-none group cursor-pointer shrink-0 shadow-2xs active:scale-[0.97]"
              >
                <div
                  className={`relative size-10 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-foreground group-hover:scale-110 transition-transform overflow-hidden shadow-xs`}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt={item.label}
                      className="size-6 object-contain"
                      loading="lazy"
                    />
                  ) : item.emoji ? (
                    <span className="text-lg leading-none">{item.emoji}</span>
                  ) : (
                    <Icon size={20} weight="bold" />
                  )}

                  {item.badge && (
                    <span className="absolute -top-1 -right-1 px-1 py-0.2 text-[8px] font-mono font-bold uppercase rounded-sm bg-red-600 text-white shadow-2xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-bold text-center text-foreground line-clamp-1 leading-tight w-full">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MASTER_SQUIRCLE_ITEMS = [
  {
    slug: "ofertas",
    to: "/mercado?niche=ofertas",
    label: "Ofertas",
    emoji: "⚡️",
    icon: Flame,
    badge: "60% OFF",
    gradient: "from-red-500/20 to-orange-500/20 text-red-600",
  },
  {
    slug: "gastronomia",
    to: "/mercado?niche=gastronomia",
    label: "Delivery",
    emoji: "🍕",
    icon: ForkKnife,
    gradient: "from-orange-500/20 to-amber-500/20 text-orange-600",
  },
  {
    slug: "mercado",
    to: "/mercado?niche=mercado",
    label: "Mercados",
    emoji: "🥦",
    icon: Storefront,
    gradient: "from-emerald-500/20 to-green-500/20 text-emerald-600",
  },
  {
    slug: "farmacia",
    to: "/mercado?niche=farmacia",
    label: "Farmácia",
    emoji: "💊",
    icon: Heartbeat,
    gradient: "from-blue-500/20 to-cyan-500/20 text-blue-600",
  },
  {
    slug: "conveniencia",
    to: "/mercado?niche=conveniencia",
    label: "Bebidas",
    emoji: "🍻",
    icon: Coffee,
    gradient: "from-amber-500/20 to-yellow-500/20 text-amber-600",
  },
  {
    slug: "imoveis",
    to: "/classificados?deal_type=aluguel",
    label: "Imóveis",
    emoji: "🏡",
    icon: House,
    badge: "Aluguel",
    gradient: "from-indigo-500/20 to-violet-500/20 text-indigo-600",
  },
  {
    slug: "agendar",
    to: "/agendar",
    label: "Beleza",
    emoji: "✂️",
    icon: Scissors,
    gradient: "from-purple-500/20 to-pink-500/20 text-purple-600",
  },
  {
    slug: "moda",
    to: "/mercado?niche=moda",
    label: "Moda & Estilo",
    emoji: "👗",
    icon: TShirt,
    gradient: "from-fuchsia-500/20 to-pink-500/20 text-fuchsia-600",
  },
  {
    slug: "empregos",
    to: "/empregos",
    label: "Vagas",
    emoji: "💼",
    icon: Briefcase,
    gradient: "from-sky-500/20 to-indigo-500/20 text-sky-600",
  },
  {
    slug: "agenda",
    to: "/agenda",
    label: "Eventos",
    emoji: "🎟️",
    icon: CalendarDots,
    gradient: "from-violet-500/20 to-purple-500/20 text-violet-600",
  },
  {
    slug: "classificados",
    to: "/classificados",
    label: "Classificados",
    emoji: "🏷️",
    icon: Tag,
    gradient: "from-rose-500/20 to-red-500/20 text-rose-600",
  },
  {
    slug: "turismo",
    to: "/turismo",
    label: "Turismo",
    emoji: "✈️",
    icon: AirplaneTilt,
    gradient: "from-teal-500/20 to-emerald-500/20 text-teal-600",
  },
  {
    slug: "mobilidade",
    to: "/mobilidade",
    label: "Mobilidade",
    emoji: "🚗",
    icon: CarProfile,
    gradient: "from-slate-500/20 to-zinc-500/20 text-foreground",
  },
];
