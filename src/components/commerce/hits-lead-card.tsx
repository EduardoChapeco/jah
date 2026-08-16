import React from "react";
import { Link } from "@tanstack/react-router";
import { Flame, ArrowRight, Sparkle } from "@phosphor-icons/react";

interface HitsLeadCardProps {
  badge?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionTo: string;
  gradient?: string;
}

export function HitsLeadCard({
  badge = "TOP 10",
  title = "Mais Pedidos",
  subtitle = "Os favoritos da cidade com os melhores preços",
  actionLabel = "Ver mais",
  actionTo,
  gradient = "from-amber-500 via-orange-500 to-red-600",
}: HitsLeadCardProps) {
  return (
    <Link
      to={actionTo as any}
      className={`group relative overflow-hidden rounded-2xl p-4 w-[160px] sm:w-[180px] h-[260px] sm:h-[280px] bg-gradient-to-b ${gradient} text-white shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between select-none active:scale-[0.98]`}
    >
      {/* Decorative Glow & Geometry */}
      <div className="absolute -right-10 -bottom-10 size-32 rounded-full bg-white/20 blur-xl pointer-events-none" />
      <div className="absolute top-0 right-0 p-3 opacity-10 font-black text-6xl select-none pointer-events-none">
        #1
      </div>

      <div className="relative z-10 space-y-2">
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/25 backdrop-blur-md text-[10px] font-black uppercase tracking-wider">
          <Flame size={12} weight="fill" className="text-yellow-300" />
          <span>{badge}</span>
        </div>

        <h4 className="text-lg sm:text-xl font-black leading-tight tracking-tight drop-shadow-xs">
          {title}
        </h4>

        {subtitle && (
          <p className="text-[11px] text-white/90 font-medium leading-snug line-clamp-3">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative z-10 pt-2 border-t border-white/20 flex items-center justify-between text-xs font-bold">
        <span className="group-hover:underline">{actionLabel}</span>
        <div className="size-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
          <ArrowRight size={12} weight="bold" />
        </div>
      </div>
    </Link>
  );
}
