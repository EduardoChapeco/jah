import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalRailProps {
  title: string;
  subtitle?: string;
  badge?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function HorizontalRail({
  title,
  subtitle,
  badge,
  actionLabel,
  onAction,
  children,
  className = "",
}: HorizontalRailProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <section className={`w-full space-y-3.5 ${className}`}>
      {/* ── Rail Header ────────────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4 px-1">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 shrink-0">
                {badge}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
        </div>

        {/* Action Button & Desktop Arrows */}
        <div className="flex items-center gap-2 shrink-0">
          {actionLabel && onAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAction}
              className="text-xs font-semibold text-primary hover:text-primary/80 h-8 px-2.5 rounded-lg"
            >
              {actionLabel}
            </Button>
          )}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll("left")}
              aria-label="Rolar para a esquerda"
              className="size-7 rounded-lg border border-border bg-card/60 hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Rolar para a direita"
              className="size-7 rounded-lg border border-border bg-card/60 hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Horizontal Scroll Container with Snap & Peek ────────── */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory focus:outline-none"
        tabIndex={0}
        aria-label={`Carrossel de ${title}`}
      >
        {children}
      </div>
    </section>
  );
}
