import { Link } from "react-router-dom";
import { Ad } from "@/types";
import { MapPin, Calendar, Users } from "lucide-react";

interface EventCardProps {
  ad: Ad;
  featured?: boolean;
}

const categoryGradients: Record<string, string> = {
  "Tecnologia": "from-[#0f0c29] via-[#302b63] to-[#24243e]",
  "Arte & Cultura": "from-[#fd746c] to-[#ff9068]",
  "Música": "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
  "Gastronomia": "from-[#f7971e] to-[#ffd200]",
  "Esportes": "from-[#11998e] to-[#38ef7d]",
  "Negócios": "from-[#232526] to-[#414345]",
  "Educação": "from-[#2193b0] to-[#6dd5ed]",
};

function getGradient(category?: string) {
  if (!category) return "from-[#0f0c29] via-[#302b63] to-[#24243e]";
  return categoryGradients[category] || "from-[#232526] to-[#414345]";
}

function formatEventDate(dateStr?: string | number | boolean): string {
  if (!dateStr || typeof dateStr !== "string") return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });
  } catch { return String(dateStr); }
}

export function EventCard({ ad, featured = false }: EventCardProps) {
  const d = ad.details || {};
  const hasImage = ad.images.length > 0 && !ad.images[0].includes("unsplash.com/photo-1600596542815");
  const gradient = getGradient(String(d.categoria_evento || ""));
  const eventDate = formatEventDate(d.data);
  const eventTime = d.horario_inicio ? String(d.horario_inicio) : "";
  const eventLocal = d.local ? String(d.local) : ad.location;
  const isFree = ad.price === null || ad.price === 0 || d.tipo_acesso === "Gratuito";

  if (featured) {
    return (
      <Link to={`/anuncio/${ad.id}`} className="group flex bg-card border-[1.5px] border-border rounded-[var(--r4)] overflow-hidden hover:shadow-lg hover:-translate-y-[3px] transition-all duration-300 ease-ereemby">
        <div className="relative w-[240px] shrink-0">
          {hasImage ? (
            <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
          )}
          {d.categoria_evento && (
            <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase px-2 py-[3px] rounded-[var(--r1)] bg-white/20 backdrop-blur-sm text-white">
              {String(d.categoria_evento)}
            </span>
          )}
        </div>
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
              <Calendar className="w-3.5 h-3.5" />
              {eventDate} {eventTime && `· ${eventTime}`}
            </div>
            <h3 className="text-[18px] font-[800] text-foreground leading-tight mb-2 group-hover:text-primary transition-colors">{ad.title}</h3>
            {ad.description && <p className="text-[12px] text-muted-foreground line-clamp-2">{ad.description}</p>}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" />{eventLocal}
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-[var(--r1)] ${isFree ? "bg-[hsl(var(--badge-green))] text-white" : "bg-primary text-primary-foreground"}`}>
              {isFree ? "GRÁTIS" : `R$ ${ad.price?.toLocaleString("pt-BR")}`}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/anuncio/${ad.id}`} className="group block bg-card border-[1.5px] border-border rounded-[var(--r4)] overflow-hidden hover:shadow-lg hover:-translate-y-[3px] transition-all duration-300 ease-ereemby min-w-[260px]">
      {/* Cover */}
      <div className="relative h-[170px]">
        {hasImage ? (
          <img src={ad.images[0]} alt={ad.title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${gradient}`} />
        )}
        {/* Category badge */}
        {d.categoria_evento && (
          <span className="absolute top-2.5 left-2.5 text-[9px] font-bold uppercase px-2 py-[3px] rounded-[var(--r1)] bg-white/20 backdrop-blur-sm text-white">
            {String(d.categoria_evento)}
          </span>
        )}
        {/* Price badge */}
        <span className={`absolute top-2.5 right-2.5 text-[9px] font-bold uppercase px-2 py-[3px] rounded-[var(--r1)] ${isFree ? "bg-[hsl(var(--badge-green))] text-white" : "bg-white/90 backdrop-blur-sm text-foreground"}`}>
          {isFree ? "GRÁTIS" : `R$ ${ad.price?.toLocaleString("pt-BR")}`}
        </span>
        {/* Date overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-black/40 backdrop-blur-sm rounded-[var(--r2)] px-2 py-1">
          <span className="text-[11px] font-semibold text-white">{eventDate}</span>
          {eventTime && <span className="text-[10px] text-white/70 ml-1.5">{eventTime}</span>}
        </div>
      </div>
      {/* Info */}
      <div className="px-3 py-3 space-y-2">
        <h3 className="text-[13.5px] font-[700] text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">{ad.title}</h3>
        {eventLocal && (
          <div className="flex items-center gap-1 text-[11.5px] text-muted-foreground truncate">
            <MapPin className="w-3 h-3 shrink-0" />{eventLocal}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center -space-x-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-5 h-5 rounded-full bg-muted border-2 border-card" />
            ))}
            <span className="text-[10px] text-muted-foreground ml-2">
              {d.capacidade ? `${d.capacidade} vagas` : ""}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
