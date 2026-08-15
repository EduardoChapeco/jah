import { useState, useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Play, Pause } from "lucide-react";
import type { BannerDTO } from "@/services/banner.functions";

export interface BannerHeroCarouselProps {
  banners: BannerDTO[];
  className?: string;
  autoPlayIntervalMs?: number;
}

export function BannerHeroCarousel({
  banners,
  className = "",
  autoPlayIntervalMs = 6000,
}: BannerHeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeBanners = banners && banners.length > 0 ? banners : [];

  useEffect(() => {
    if (!isPlaying || activeBanners.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, autoPlayIntervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, activeBanners.length, autoPlayIntervalMs]);

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const renderMedia = (banner: BannerDTO) => {
    if (banner.media_type === "video") {
      return (
        <video
          src={banner.media_url}
          autoPlay
          loop
          muted
          playsInline
          className="size-full object-cover"
        />
      );
    }
    return (
      <img
        src={banner.media_url}
        alt={banner.title}
        className="size-full object-cover"
        loading="eager"
      />
    );
  };

  const targetLink = bannerTargetLink(currentBanner) || "/mercado";

  return (
    <div
      className={`relative w-full overflow-hidden rounded-3xl border border-border bg-card group shadow-xs select-none ${className}`}
      onMouseEnter={() => setIsPlaying(false)}
      onMouseLeave={() => setIsPlaying(true)}
    >
      {/* ── Fixed Aspect Ratio Container: 21:9 on desktop, 16:9 on tablet, 16:9 on mobile ── */}
      <div className="relative w-full aspect-16/9 sm:aspect-21/9 max-h-[420px] overflow-hidden">
        {/* Clickable entire card link if no CTA or always */}
        <Link
          to={targetLink as any}
          className="absolute inset-0 z-0"
          aria-label={currentBanner.title}
        />

        {/* Gradient Overlay for Text Readability (Optional / Configurable) */}
        {currentBanner.show_overlay !== false &&
          (currentBanner.show_title !== false ||
            currentBanner.show_description !== false ||
            currentBanner.show_badge !== false ||
            currentBanner.show_cta !== false) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent sm:bg-gradient-to-r sm:from-black/90 sm:via-black/50 sm:to-transparent flex flex-col justify-end sm:justify-center p-6 sm:p-10 lg:p-12 text-white pointer-events-none">
              <div className="max-w-xl space-y-2 sm:space-y-3 z-10 pointer-events-auto">
                {currentBanner.show_badge !== false && currentBanner.badge_text && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] sm:text-xs font-bold uppercase tracking-wider text-white border border-white/30 shadow-xs">
                    <Sparkles className="size-3 text-amber-300" />
                    <span>{currentBanner.badge_text}</span>
                  </div>
                )}

                {currentBanner.show_title !== false && (
                  <h2 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight line-clamp-2 text-white drop-shadow-sm">
                    {currentBanner.title}
                  </h2>
                )}

                {currentBanner.show_description !== false && currentBanner.subtitle && (
                  <p className="text-xs sm:text-sm text-zinc-200 line-clamp-2 leading-relaxed max-w-lg">
                    {currentBanner.subtitle}
                  </p>
                )}

                {currentBanner.show_cta !== false && (
                  <div className="pt-2">
                    <Link
                      to={targetLink as any}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black font-bold text-xs sm:text-sm shadow-md hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all"
                    >
                      <span>{currentBanner.cta_label || "Conferir"}</span>
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* Navigation Arrows (Desktop) */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Banner anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Próximo banner"
              className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
            >
              <ChevronRight className="size-5" />
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 flex items-center gap-1.5 z-20 bg-black/30 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
            {activeBanners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ir para o banner ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? "w-5 h-1.5 bg-white"
                    : "size-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function bannerTargetLink(banner: BannerDTO): string {
  if (banner.target_url) return banner.target_url;
  if (banner.target_type === "category" && banner.target_id) {
    return `/mercado?categoria=${banner.target_id}`;
  }
  if (banner.target_type === "product" && banner.target_id) {
    return `/produto/${banner.target_id}`;
  }
  if (banner.target_type === "store" && banner.target_id) {
    return `/perfil-da-loja?store=${banner.target_id}`;
  }
  return "/mercado";
}
