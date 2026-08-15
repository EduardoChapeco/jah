import { Link } from "@tanstack/react-router";
import { Tag } from "lucide-react";
import type { HotpageDTO } from "@/services/hotpage.functions";

export interface HotpagesRailProps {
  hotpages: HotpageDTO[];
  activeSlug?: string;
  className?: string;
}

export function HotpagesRail({ hotpages, activeSlug, className = "" }: HotpagesRailProps) {
  if (!hotpages || hotpages.length === 0) return null;

  return (
    <section className={`w-full ${className}`} aria-label="Categorias">
      {/* Grid / Rail Panorâmico de Hotpages */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {hotpages.map((hp) => {
          const showTitle = hp.show_title !== false;
          const showOverlay = hp.show_overlay !== false && (showTitle || hp.badge_label);
          const isActive = activeSlug === hp.slug;

          return (
            <Link
              key={hp.id}
              to="/mercado"
              search={{ niche: hp.slug }}
              className={`group relative flex flex-col justify-end aspect-16/10 sm:aspect-4/3 w-full rounded-2xl sm:rounded-3xl border bg-card overflow-hidden shadow-xs hover-elevate transition-all duration-300 ${
                isActive
                  ? "border-primary ring-2 ring-primary/20 shadow-sm"
                  : "border-border/80 hover:border-primary/40"
              }`}
            >
              {/* Cover Image */}
              {hp.cover_image_url ? (
                <img
                  src={hp.cover_image_url}
                  alt={hp.title}
                  className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 size-full bg-linear-to-br from-primary/10 to-muted flex items-center justify-center">
                  <Tag className="size-6 text-muted-foreground/30" />
                </div>
              )}

              {/* Optional Overlay Mask */}
              {showOverlay && (
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent transition-opacity" />
              )}

              {/* Card Content & Badge (Sem Emojis) */}
              <div className="relative z-10 p-3 sm:p-3.5 space-y-1">
                {hp.badge_label && (
                  <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-primary text-primary-foreground shadow-2xs">
                    {hp.badge_label.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim()}
                  </span>
                )}
                {showTitle && (
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight drop-shadow-xs truncate">
                    {hp.title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim()}
                  </h3>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
