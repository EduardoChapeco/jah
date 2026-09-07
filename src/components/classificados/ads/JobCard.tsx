import { Link } from "react-router-dom";
import { Ad } from "@/types";
import { MapPin, Clock, Building2 } from "lucide-react";

interface JobCardProps {
  ad: Ad;
}

function timeAgo(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    if (days < 30) return `${days}d atrás`;
    return `${Math.floor(days / 30)}m atrás`;
  } catch { return ""; }
}

export function JobCard({ ad }: JobCardProps) {
  const d = ad.details || {};
  const isNew = (() => {
    try { return Date.now() - new Date(ad.createdAt).getTime() < 86400000 * 3; } catch { return false; }
  })();
  const isUrgent = d.urgente === "Sim" || d.urgente === true;

  const metaItems: string[] = [];
  if (d.regime) metaItems.push(String(d.regime));
  if (d.modalidade) metaItems.push(String(d.modalidade));
  if (ad.price) metaItems.push(`R$ ${ad.price.toLocaleString("pt-BR")}`);

  const tags: string[] = [];
  if (d.habilidades) String(d.habilidades).split(",").slice(0, 4).forEach(t => tags.push(t.trim()));

  return (
    <Link
      to={`/anuncio/${ad.id}`}
      className={`group block bg-card border-[1.5px] border-border rounded-[var(--r3)] overflow-hidden hover:shadow-md hover:-translate-y-[3px] transition-all duration-300 ease-ereemby ${isNew ? "border-l-[3px] border-l-primary" : ""}`}
    >
      <div className="p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-[var(--r2)] bg-muted flex items-center justify-center shrink-0">
              <Building2 className="w-4.5 h-4.5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate">{d.empresa_nome ? String(d.empresa_nome) : "Empresa"}</p>
              {d.empresa_setor && <p className="text-[10px] text-muted-foreground">{String(d.empresa_setor)}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">{timeAgo(ad.createdAt)}</span>
            {isUrgent && (
              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-[var(--r1)] bg-[hsl(var(--badge-red))] text-white">URGENTE</span>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[14px] font-[700] text-foreground leading-tight group-hover:text-primary transition-colors">
          {d.cargo ? String(d.cargo) : ad.title}
        </h3>

        {/* Meta */}
        {metaItems.length > 0 && (
          <p className="text-[12px] text-muted-foreground">
            {metaItems.join(" · ")}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag, i) => (
              <span key={i} className="text-[9px] font-semibold px-2 py-0.5 rounded-[var(--r1)] bg-[hsl(var(--badge-blue))]/10 text-[hsl(var(--badge-blue))] border border-[hsl(var(--badge-blue))]/20">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          {ad.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="w-3 h-3" />{ad.location}
            </div>
          )}
          <span className="text-[11px] font-semibold text-primary">Candidatar-se →</span>
        </div>
      </div>
    </Link>
  );
}
