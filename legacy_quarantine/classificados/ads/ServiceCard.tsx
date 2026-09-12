import { Link } from "react-router-dom";
import { Ad } from "@/types";
import { MapPin, Star, MessageCircle } from "lucide-react";

interface ServiceCardProps {
  ad: Ad;
}

export function ServiceCard({ ad }: ServiceCardProps) {
  const d = ad.details || {};
  const hasImage = ad.images.length > 0 && !ad.images[0].includes("unsplash.com/photo-1600596542815");
  const rating = d.rating ? Number(d.rating) : null;

  const priceLabel = d.modelo_cobranca
    ? d.modelo_cobranca === "Por hora" ? "/hora"
      : d.modelo_cobranca === "Por m²" ? "/m²"
      : d.modelo_cobranca === "Por diária" ? "/diária"
      : ""
    : "";

  const tags: string[] = [];
  if (d.tipo_servico) tags.push(String(d.tipo_servico));
  if (d.especializacao) String(d.especializacao).split(",").slice(0, 2).forEach(t => tags.push(t.trim()));

  return (
    <Link
      to={`/anuncio/${ad.id}`}
      className="group block bg-card border-[1.5px] border-border rounded-[var(--r4)] overflow-hidden hover:shadow-lg hover:-translate-y-[3px] transition-all duration-300 ease-ereemby min-w-[260px]"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3]">
        <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-ereemby" />
        {/* Rating badge */}
        {rating && rating >= 4.5 && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-[hsl(45,93%,47%)]/90 backdrop-blur-sm text-[hsl(240,12%,4%)] text-[10px] font-bold px-2 py-1 rounded-[var(--r1)]">
            <Star className="w-3 h-3 fill-current" />
            {rating}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 py-2.5 space-y-1.5">
        {/* Provider info */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground">
            {ad.userName?.charAt(0) || "P"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground truncate">{ad.userName || "Prestador"}</p>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-[700] text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {ad.title}
        </h3>

        {/* Location */}
        {ad.location && (
          <div className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />{ad.location}
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1">
          {ad.price ? (
            <p className="text-[14px] font-[800] text-foreground tracking-[-0.03em]">
              {d.modelo_cobranca === "Orçamento" ? "A partir de " : ""}R$ {ad.price.toLocaleString("pt-BR")}
              <span className="text-[11px] font-normal text-muted-foreground">{priceLabel}</span>
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground">Solicitar orçamento</p>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-[var(--r1)] bg-[hsl(var(--badge-purple))]/10 text-[hsl(var(--badge-purple))] border border-[hsl(var(--badge-purple))]/20">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
