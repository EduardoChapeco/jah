import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Loader2,
  ExternalLink,
  MapPin,
  Eye,
  Edit3,
  Image as ImageIcon,
  Play,
} from "lucide-react";

import { getClassifieds } from "@/services/classifieds.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/datetime";

function isVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
}

export const Route = createFileRoute("/_store/conta/classificados/")({
  head: () => ({ meta: [{ title: "Meus Anúncios — Wider" }] }),
  component: ClassificadosIndex,
});

const CATEGORY_LABELS: Record<string, string> = {
  sale: "Desapego",
  vehicle: "Veículo",
  real_estate: "Imóvel",
  service: "Serviço",
  job: "Vaga",
  trade: "Troca",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  published: { label: "Publicado", variant: "default" },
  active: { label: "Publicado", variant: "default" },
  draft: { label: "Rascunho", variant: "secondary" },
  paused: { label: "Pausado", variant: "outline" },
  reserved: { label: "Reservado", variant: "secondary" },
  negotiating: { label: "Negociando", variant: "secondary" },
  completed: { label: "Finalizado", variant: "outline" },
  archived: { label: "Arquivado", variant: "destructive" },
};

function ClassificadosIndex() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: classifieds, isLoading } = useQuery({
    queryKey: ["classifieds"],
    queryFn: () => getClassifieds(),
  });

  const filtered = (classifieds || []).filter((ad: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ad.title?.toLowerCase().includes(term) ||
      ad.description?.toLowerCase().includes(term) ||
      ad.category?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* ── Toolbar Operacional ─────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4  pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase font-bold px-2.5 py-0.5">
            Classificados
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">Meus Anúncios</span>
        </div>

        <Button asChild size="sm" className="rounded-xl h-9 px-4 text-xs font-bold gap-1.5  bg-primary text-primary-foreground">
          <Link to="/conta/classificados/novo">
            <Plus className="size-3.5" />
            <span>Novo Anúncio</span>
          </Link>
        </Button>
      </div>

      {/* ── Filtro de Busca ─────────────────────────────────────── */}
      {classifieds && classifieds.length > 0 && (
        <div className="max-w-md">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar nos meus anúncios..."
            className="h-9 rounded-xl text-xs bg-background"
          />
        </div>
      )}

      {/* ── Lista de Anúncios ────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="size-6 animate-spin text-primary" />
          <p className="text-xs">Carregando seus classificados...</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 w-full">
          {filtered.map((ad: any) => {
            const statusInfo = STATUS_CONFIG[ad.status] || { label: ad.status, variant: "outline" };
            const coverImage = ad.images && ad.images.length > 0 ? ad.images[0] : null;

            return (
              <div
                key={ad.id}
                className=" bg-card rounded-2xl overflow-hidden  hover: transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Foto ou Vídeo de Capa */}
                  <div className="relative aspect-video bg-black/95  overflow-hidden flex items-center justify-center">
                    {coverImage ? (
                      isVideoUrl(coverImage) ? (
                        <div className="relative size-full">
                          <video
                            src={coverImage}
                            className="size-full object-cover pointer-events-none"
                            preload="metadata"
                            muted
                          />
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="size-8 rounded-full bg-black/60 backdrop-blur-xs flex items-center justify-center text-white">
                              <Play className="size-3.5 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={coverImage}
                          alt={ad.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
                        <ImageIcon className="size-8 stroke-[1.5]" />
                        <span className="text-[10px]">Sem fotos</span>
                      </div>
                    )}

                    <Badge
                      variant={statusInfo.variant}
                      className="absolute top-2.5 right-2.5 z-10 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm"
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Detalhes */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {CATEGORY_LABELS[ad.category] || ad.category}
                      </Badge>
                      {ad.location_name && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1 truncate max-w-[150px]">
                          <MapPin className="size-3 text-primary shrink-0" />
                          {ad.location_name}
                        </span>
                      )}
                    </div>

                    <h2 className="text-sm font-bold text-foreground line-clamp-1">{ad.title}</h2>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {ad.description || ad.content}
                    </p>

                    <div className="pt-2 flex items-baseline justify-between ">
                      <span className="text-base font-black text-primary font-mono">
                        {ad.price_cents ? formatMoney(ad.price_cents) : "A Combinar"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(ad.created_at).split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="p-3 bg-muted/20  flex items-center justify-between gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs h-8 flex-1"
                  >
                    <Link to="/classificados/$id" params={{ id: ad.id }}>
                      <Eye className="size-3.5 mr-1.5" />
                      <span>Ver Anúncio</span>
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border-0 bg-card/60 rounded-2xl p-10 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Tag className="size-6" />
          </div>
          <h2 className="text-base font-bold text-foreground">
            {searchTerm
              ? "Nenhum anúncio corresponde à sua busca"
              : "Você ainda não publicou nenhum anúncio"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {searchTerm
              ? "Tente buscar por outras palavras-chave ou limpe o campo de busca."
              : "Desapegue de itens, anuncie imóveis, veículos, vagas ou ofereça seus serviços profissionais para a comunidade."}
          </p>
          {!searchTerm && (
            <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 mt-2">
              <Link to="/conta/classificados/novo">
                <Plus className="size-4" />
                <span>Criar Meu Primeiro Anúncio</span>
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
