import { Link } from "@tanstack/react-router";
import { Star, MapPin, Clock, Store, ShieldCheck, ChevronRight } from "lucide-react";
import type { StoreCardDTO } from "@/services/marketplace.functions";

export function StoreCard({
  id,
  name,
  slug,
  avatar_url,
  banner_url,
  category,
  rating,
  review_count,
  distance_km,
  is_open,
  delivery_time_min,
}: StoreCardDTO) {
  return (
    <Link
      to="/perfil-da-loja"
      className="group relative flex flex-col justify-between w-80 sm:w-96 shrink-0 snap-start rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden shadow-xs hover-elevate"
    >
      {/* ── Banner de Destaque Ampliado ─────────────────────── */}
      <div className="relative h-36 sm:h-44 w-full bg-linear-to-r from-zinc-800 to-zinc-900 overflow-hidden">
        {banner_url ? (
          <img
            src={banner_url}
            alt={`Capa da loja ${name}`}
            className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="size-full bg-linear-to-br from-primary/20 via-primary/5 to-muted flex items-center justify-center">
            <Store className="size-12 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        {/* Status Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-xs ${
              is_open
                ? "bg-emerald-500/90 text-white"
                : "bg-zinc-800/80 text-zinc-300 border border-zinc-700"
            }`}
          >
            {is_open ? "● Aberto Agora" : "Fechado"}
          </span>
        </div>
      </div>

      {/* ── Store Info & Large Avatar ───────────────────────── */}
      <div className="p-5 pt-0 relative space-y-3">
        {/* Floating Avatar 64px - 72px */}
        <div className="size-16 sm:size-18 rounded-2xl border-4 border-card bg-background overflow-hidden -mt-8 sm:-mt-9 shadow-md relative z-10 flex items-center justify-center">
          {avatar_url ? (
            <img src={avatar_url} alt={name} className="size-full object-cover" />
          ) : (
            <Store className="size-8 text-primary" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {name}
            </h3>
            <ShieldCheck className="size-4 text-primary shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{category}</p>
        </div>

        {/* Badges de Distância, Avaliação e Tempo */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-border/40">
          <div className="flex items-center gap-1 font-bold text-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span>{rating.toFixed(1)}</span>
            <span className="text-muted-foreground font-normal">({review_count})</span>
          </div>

          <div className="flex items-center gap-1">
            <MapPin className="size-3 text-muted-foreground" />
            <span>{distance_km.toFixed(1)} km</span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="size-3 text-muted-foreground" />
            <span>{delivery_time_min}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
