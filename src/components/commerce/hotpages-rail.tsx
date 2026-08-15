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

  const resolveTarget = (hp: HotpageDTO): { to: string; search?: Record<string, any> } => {
    if (basePath) {
      if (basePath === "/mercado") return { to: "/mercado", search: { niche: hp.slug } };
      return { to: basePath, search: { categoria: hp.slug } };
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
        return { to: "/mercado", search: { niche: hp.slug } };
    }
  };

  return (
    <section className={`w-full ${className}`} aria-label="Categorias Panorâmicas">
      {/* Grid Panorâmico de Cards Maiores com Proporção Squircle Clean */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {hotpages.map((hp) => {
          // No modo clean, oculta textos/tags sobrepostos a menos que configurado pelo admin
          const showTitle = !cleanMode || hp.show_title === true;
          const showBadge = !cleanMode && !!hp.badge_label;
          const showOverlay = hp.show_overlay !== false && (showTitle || showBadge);
          const isActive = activeSlug === hp.slug;
          const customIcon = hp.custom_icon_url || hp.icon_url;

          const cardContent = (
            <>
              {/* Cover Image com preenchimento completo */}
              {hp.cover_image_url ? (
                <img
                  src={hp.cover_image_url}
                  alt={hp.title}
                  className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="absolute inset-0 size-full bg-muted flex items-center justify-center">
                  <Tag size={28} className="text-muted-foreground/30" />
                </div>
              )}

              {/* Overlay Mask opcional */}
              {showOverlay && (
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent transition-opacity" />
              )}

              {/* Card Content & Badge quando ativo */}
              {(showTitle || showBadge) && (
                <div className="relative z-10 p-3 sm:p-3.5 space-y-1 text-left w-full">
                  {showBadge && hp.badge_label && (
                    <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase tracking-wider bg-white/25 backdrop-blur-md text-white border border-white/20 shadow-2xs">
                      {hp.badge_label.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim()}
                    </span>
                  )}
                  {showTitle && (
                    <div className="flex items-center gap-1.5">
                      {customIcon && (
                        <div className="size-5 rounded bg-white/20 backdrop-blur-md p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                          <img src={customIcon} alt="Icon" className="size-full object-contain" />
                        </div>
                      )}
                      <h3 className="text-xs sm:text-sm font-semibold text-white leading-tight drop-shadow-xs line-clamp-2">
                        {hp.title.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim()}
                      </h3>
                    </div>
                  )}
                </div>
              )}
            </>
          );

          const baseClass = `group relative flex flex-col justify-end aspect-16/10 sm:aspect-4/3 w-full rounded-2xl sm:rounded-3xl border bg-card overflow-hidden shadow-2xs hover-elevate transition-all duration-300 cursor-pointer ${
            isActive
              ? "border-foreground ring-2 ring-foreground/20 shadow-xs font-bold"
              : "border-border hover:border-foreground/40"
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
