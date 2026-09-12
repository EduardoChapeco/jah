import { Link } from "react-router-dom";
import { Ad } from "@/types";
import { MapPin, Eye, Heart, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useCallback } from "react";

interface AdCardProps {
  ad: Ad;
  size?: "default" | "large";
  horizontal?: boolean;
}

function buildMetaLine(details: Record<string, string | number | boolean>): string[] {
  const items: string[] = [];
  if (details.metragem) items.push(`${details.metragem}m²`);
  if (details.quartos) items.push(`${details.quartos} quartos`);
  if (details.banheiros) items.push(`${details.banheiros} banheiros`);
  if (details.garagem || details.vagas) items.push(`${details.garagem || details.vagas} garagens`);
  if (details.km) items.push(`${Number(details.km).toLocaleString("pt-BR")} km`);
  if (details.ano) items.push(`${details.ano}`);
  if (details.marca && details.modelo) items.push(`${details.marca} ${details.modelo}`);
  else if (details.marca) items.push(`${details.marca}`);
  return items.filter(Boolean);
}

function shortId(id: string): string {
  const num = parseInt(id.replace(/[^0-9]/g, "").slice(-4) || "0", 10);
  return `#${num || id.slice(-4)}`;
}

export function AdCard({ ad, size = "default", horizontal = false }: AdCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const hasMultipleImages = ad.images.length > 1;
  const metaItems = buildMetaLine(ad.details || {});

  const goNext = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentImage((p) => (p + 1) % ad.images.length);
  }, [ad.images.length]);

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentImage((p) => (p - 1 + ad.images.length) % ad.images.length);
  }, [ad.images.length]);

  const handleFav = useCallback((e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
  const handleShare = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/anuncio/${ad.id}`);
  }, [ad.id]);

  /* Horizontal compact */
  if (horizontal) {
    return (
      <Link to={`/anuncio/${ad.id}`} className="group action-card" style={{ gap: 12 }}>
        <div className="relative shrink-0" style={{ width: 120, height: 80, borderRadius: "var(--r3)", overflow: "hidden", background: "hsl(var(--bg-3))" }}>
          <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          {ad.badges.length > 0 && (
            <span className="chip chip-orange sm absolute top-1.5 left-1.5" style={{ fontSize: 8, padding: "1px 5px" }}>{ad.badges[0].label}</span>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <p style={{ fontSize: 16, fontWeight: 800, color: "hsl(var(--orange-l))", letterSpacing: "-.03em" }}>
              {ad.price ? `R$ ${ad.price.toLocaleString("pt-BR")}` : (ad.priceLabel || "Consulte")}
            </p>
            <span style={{ fontSize: 10.5, fontFamily: "var(--mono)", color: "hsl(var(--text-quaternary))", flexShrink: 0 }}>{shortId(ad.id)}</span>
          </div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "hsl(var(--text-primary))", lineHeight: 1.4 }} className="line-clamp-2">{ad.title}</h3>
          <div className="flex items-center gap-1" style={{ fontSize: 11, color: "hsl(var(--text-tertiary))" }}>
            <MapPin size={10} className="shrink-0" /><span className="truncate">{ad.location}</span>
          </div>
        </div>
      </Link>
    );
  }

  /* Standard vertical card - DARK GLASS */
  return (
    <Link to={`/anuncio/${ad.id}`} className="ad-card group block">
      {/* Photo area */}
      <div className="ad-card-img relative">
        <img src={ad.images[currentImage]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />

        {/* Badges */}
        {ad.badges.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap z-10">
            {ad.badges.map((badge, i) => (
              <span key={i} className="chip chip-orange sm" style={{ fontSize: 9, padding: "2px 6px" }}>{badge.label}</span>
            ))}
          </div>
        )}

        {/* Fav + Share */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-10">
          <button onClick={handleFav} className="gl ico xs" style={{ backdropFilter: "blur(8px)" }}><Heart size={12} /></button>
          <button onClick={handleShare} className="gl ico xs" style={{ backdropFilter: "blur(8px)" }}><Share2 size={12} /></button>
        </div>

        {/* Arrows */}
        {hasMultipleImages && (
          <>
            <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 gl ico xs opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronLeft size={12} /></button>
            <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 gl ico xs opacity-0 group-hover:opacity-100 transition-opacity z-10"><ChevronRight size={12} /></button>
          </>
        )}

        {/* Dots */}
        {hasMultipleImages && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {ad.images.slice(0, 5).map((_, i) => (
              <span key={i} className="rounded-full transition-all" style={{ width: i === currentImage ? 6 : 4, height: i === currentImage ? 6 : 4, background: i === currentImage ? "#fff" : "rgba(255,255,255,0.5)" }} />
            ))}
          </div>
        )}

        {/* Views */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 z-10" style={{ fontSize: 10, color: "#fff", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", borderRadius: "var(--r1)", padding: "2px 6px" }}>
          <Eye size={10} />{ad.views}
        </div>
      </div>

      {/* Info */}
      <div className="ad-card-body">
        {/* Price + ID */}
        <div className="flex items-baseline justify-between gap-2" style={{ marginBottom: 4 }}>
          <div className="ad-card-price" style={{ marginBottom: 0 }}>
            {ad.price ? `R$ ${ad.price.toLocaleString("pt-BR")}` : (
              <span style={{ fontSize: 13, color: "hsl(var(--text-tertiary))" }}>{ad.priceLabel || "Consulte"}</span>
            )}
          </div>
          <span style={{ fontSize: 10.5, fontFamily: "var(--mono)", color: "hsl(var(--text-quaternary))", flexShrink: 0 }}>{shortId(ad.id)}</span>
        </div>

        <h3 className="ad-card-title">{ad.title}</h3>

        {ad.location && (
          <div className="ad-card-meta" style={{ marginBottom: metaItems.length > 0 ? 4 : 0 }}>
            <span><MapPin size={10} />{ad.location}</span>
          </div>
        )}

        {metaItems.length > 0 && (
          <p style={{ fontSize: 11, color: "hsl(var(--text-tertiary))", marginBottom: 4 }} className="truncate">{metaItems.join(" · ")}</p>
        )}

        {/* Category chips */}
        <div className="flex items-center gap-1.5 pt-0.5">
          {ad.subcategory && <span className="chip chip-orange sm" style={{ fontSize: 9, padding: "1px 6px" }}>{ad.subcategory}</span>}
          {ad.verified && <span className="chip chip-green sm" style={{ fontSize: 9, padding: "1px 6px" }}>✓ Verificado</span>}
        </div>
      </div>
    </Link>
  );
}
