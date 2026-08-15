import { Link } from "@tanstack/react-router";
import { Star, MapPin, Clock, Store } from "lucide-react";
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
      className="group relative flex flex-col justify-between w-64 sm:w-72 shrink-0 snap-start rounded-2xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-200 overflow-hidden shadow-2xs"
    >
      {/* ── Banner & Logo Header ───────────────────────────── */}
      <div className="relative h-24 w-full bg-linear-to-r from-zinc-800 to-zinc-900 overflow-hidden">
        {banner_url && (
          <img
            src={banner_url}
            alt={`Capa da loja ${name}`}
            className="size-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
          />
        )}
        <div className="absolute top-2.5 right-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/90 text-white shadow-xs">
            Aberto
          </span>
        </div>
      </div>

      {/* ── Store Info ─────────────────────────────────────── */}
      <div className="p-4 pt-0 relative space-y-2">
        {/* Floating Avatar */}
        <div className="size-12 rounded-xl border-2 border-card bg-background overflow-hidden -mt-6 shadow-xs relative z-10 flex items-center justify-center">
          {avatar_url ? (
            <img src={avatar_url} alt={name} className="size-full object-cover" />
          ) : (
            <Store className="size-6 text-primary" />
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">{category}</p>
        </div>

        {/* Badges de Distância e Avaliação */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t border-border/40">
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
