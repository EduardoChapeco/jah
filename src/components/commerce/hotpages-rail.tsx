import { Link } from "@tanstack/react-router";
import { Tag } from "@phosphor-icons/react";
import type { HotpageDTO } from "@/services/hotpage.functions";

export interface HotpagesRailProps {
  hotpages: HotpageDTO[];
  activeSlug?: string;
  className?: string;
  onSelect?: (slug: string) => void;
  basePath?: string;
  cleanMode?: boolean;
}

export function HotpagesRail({
  hotpages,
  activeSlug,
  className = "",
  onSelect,
  basePath,
  cleanMode = true,
}: HotpagesRailProps) {
  if (!hotpages || hotpages.length === 0) return null;

  const resolveTarget = (hp: HotpageDTO): { to: string; params?: Record<string, any>; search?: Record<string, any> } => {
    if (basePath) {
      if (basePath === "/mercado") return { to: "/destaques/$slug", params: { slug: hp.slug } };
      return { to: "/destaques/$slug", params: { slug: hp.slug } };
    }

    switch (hp.module) {
      case "agenda":
      case "events":
        return { to: "/agenda", search: { categoria: hp.slug } };
      case "turismo":
        return { to: "/turismo", search: { categoria: hp.slug } };
      case "empregos":
        return { to: "/empregos", search: { categoria: hp.slug } };
      case "classificados":
        return { to: "/classificados", search: { categoria: hp.slug } };
      case "noticias":
        return { to: "/noticias", search: { categoria: hp.slug } };
      case "diretorio":
        return { to: "/diretorio", search: { categoria: hp.slug } };
      case "mercado":
      case "home":
      case "marketplace":
      default:
        return { to: "/destaques/$slug", params: { slug: hp.slug } };
    }
  };

  return (
    <section className={`w-full overflow-hidden ${className}`} aria-label="Categorias Panorâmicas">
      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {hotpages.map((hp) => {
          const showTitle = hp.show_title === true;
          const showBadge = (hp.show_badge === true || (!cleanMode && hp.show_badge !== false)) && !!hp.badge_label;
          const showOverlay = hp.show_overlay === true && (showTitle || showBadge);
          const isActive = activeSlug === hp.slug;
          const customIcon = hp.custom_icon_url || hp.icon_url;

          const cardContent = (
            <>
              {hp.cover_image_url ? (
                <img
                  src={hp.cover_image_url}
                  alt={hp.title}
                  className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="absolute inset-0 size-full bg-muted flex items-center justify-center">
                  <Tag size={28} className="text-muted-foreground/30" />
                </div>
              )}

              {showOverlay && (
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent transition-opacity" />
              )}

              {(showTitle || showBadge || customIcon) && (
                <div className="relative z-10 p-3 space-y-1 text-left w-full">
                  {showBadge && hp.badge_label && (
                    <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-white/25 backdrop-blur-md text-white border border-white/20 ">
                      {hp.badge_label.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim()}
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {/* Ícone sem máscara — espaço delimitado, PNG transparente suportado */}
                    {customIcon && (
                      <div className="size-7 shrink-0 flex items-center justify-center">
                        <img
                          src={customIcon}
                          alt="Icon"
                          className="size-full object-contain drop-"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    )}
                    {showTitle && (
                      <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight drop- line-clamp-2">
                        {hp.title}
                      </h3>
                    )}
                  </div>
                </div>
              )}
            </>
          );

          const baseClass = `group relative flex flex-col justify-end aspect-16/10 sm:aspect-4/3 w-[240px] sm:w-[280px] shrink-0 rounded-2xl sm:rounded-3xl border bg-card overflow-hidden transition-all duration-300 cursor-pointer ${
            isActive
              ? "border-foreground ring-2 ring-foreground/20 font-bold"
              : "border-border/80 hover:border-foreground/30"
          }`;

          if (onSelect) {
            return (
              <button
                key={hp.id}
                type="button"
                onClick={() => onSelect(hp.slug)}
                className={baseClass}
              >
                {cardContent}
              </button>
            );
          }

          const target = resolveTarget(hp);

          return (
            <Link
              key={hp.id}
              to={target.to as any}
              params={target.params as any}
              search={target.search as any}
              className={baseClass}
            >
              {cardContent}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
