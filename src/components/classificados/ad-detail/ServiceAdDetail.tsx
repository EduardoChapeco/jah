import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  MapPin, Star, Check, X, ChevronLeft, ChevronRight,
  MessageCircle, Phone, CalendarDays, Share2, Heart, Clock,
  Package, Shield, Zap,
} from "lucide-react";
import { JsonLd, serviceSchema } from "@/components/seo/JsonLd";

interface Props {
  ad: any;
  profile: any;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

export default function ServiceAdDetail({ ad, profile, isFavorited, onFavorite, onShare }: Props) {
  const navigate = useNavigate();
  const d = ad.features || {};
  const loc = ad.location as any || {};
  const photos = ad.photos || [];
  const [activePhoto, setActivePhoto] = useState(0);

  const inclui = typeof d.inclui === "string" ? d.inclui.split("\n").filter((s: string) => s.trim()) : Array.isArray(d.inclui) ? d.inclui : [];
  const naoInclui = typeof d.nao_inclui === "string" ? d.nao_inclui.split("\n").filter((s: string) => s.trim()) : Array.isArray(d.nao_inclui) ? d.nao_inclui : [];
  const areas = typeof d.area_atendimento === "string" ? d.area_atendimento.split(",").map((s: string) => s.trim()) : [];

  // Packages
  const pacotes = Array.isArray(d.pacotes) ? d.pacotes : [];
  const rating = Number(profile?.rating) || 0;
  const totalReviews = Number(profile?.total_reviews) || 0;

  return (
    <div className="min-h-screen">
      <JsonLd data={serviceSchema(ad, window.location.origin)} />
      {/* Portfolio photo */}
      <div className="relative w-full aspect-[16/9] max-h-[450px] overflow-hidden bg-muted">
        {photos.length > 0 ? (
          <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Zap className="w-12 h-12" /></div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={onFavorite} className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center shadow ${isFavorited ? "bg-destructive/90 text-white" : "bg-background/80"}`}>
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
          </button>
          <button onClick={onShare} className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow"><Share2 className="w-4 h-4" /></button>
        </div>
        {photos.length > 1 && (
          <>
            <button onClick={() => setActivePhoto(i => Math.max(0, i - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setActivePhoto(i => Math.min(photos.length - 1, i + 1))} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
          </>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6">
          {/* Title + rating */}
          <div>
            <h1 className="text-2xl font-[800]">{ad.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {rating > 0 && (
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm font-bold text-primary">{rating.toFixed(1)}</span>
                  {totalReviews > 0 && <span className="text-xs text-muted-foreground">({totalReviews} avaliações)</span>}
                </div>
              )}
              {loc.city && <span className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{loc.city}</span>}
            </div>
          </div>

          {/* Price */}
          {ad.price > 0 && (
            <p className="text-3xl font-[900]">
              R$ {ad.price.toLocaleString("pt-BR")}
              {d.unidade_preco && <span className="text-base font-normal text-muted-foreground ml-1">/{d.unidade_preco}</span>}
            </p>
          )}

          {/* Description */}
          {ad.description && (
            <div className="bg-card border border-border rounded-lg p-5">
              <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ad.description}</p>
            </div>
          )}

          {/* Includes / Excludes */}
          {(inclui.length > 0 || naoInclui.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {inclui.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-primary"><Check className="w-4 h-4" /> O que inclui</h3>
                  <ul className="space-y-2">
                    {inclui.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-3.5 h-3.5 text-primary shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {naoInclui.length > 0 && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2 text-destructive"><X className="w-4 h-4" /> Não inclui</h3>
                  <ul className="space-y-2">
                    {naoInclui.map((item: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><X className="w-3.5 h-3.5 text-destructive shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Service areas */}
          {areas.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Área de Atendimento</h3>
              <div className="flex flex-wrap gap-2">
                {areas.map((a: string, i: number) => <Badge key={i} variant="outline">{a}</Badge>)}
              </div>
            </div>
          )}

          {/* Packages */}
          {pacotes.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Package className="w-4 h-4 text-primary" /> Pacotes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {pacotes.map((p: any, i: number) => (
                  <Card key={i} className={i === 1 ? "border-primary ring-1 ring-primary" : ""}>
                    <CardContent className="p-4 text-center space-y-2">
                      {i === 1 && <Badge className="mb-1">Mais popular</Badge>}
                      <h4 className="font-bold">{p.name || `Pacote ${i + 1}`}</h4>
                      <p className="text-2xl font-[800] text-primary">R$ {Number(p.price || 0).toLocaleString("pt-BR")}</p>
                      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                      <Button className="w-full" size="sm" variant={i === 1 ? "default" : "outline"}>Selecionar</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{profile?.name?.charAt(0) || "U"}</span>}
              </div>
              <div>
                <p className="text-sm font-semibold">{profile?.name || "Prestador"}</p>
                {profile?.is_verified && <span className="text-xs text-primary font-medium">✓ Verificado</span>}
              </div>
            </div>
            <div className="space-y-2">
              {d.aceita_agendamento !== false ? (
                <Button className="w-full gap-2 font-bold"><CalendarDays className="w-4 h-4" /> Agendar agora</Button>
              ) : (
                <Button className="w-full gap-2 font-bold"><MessageCircle className="w-4 h-4" /> Solicitar orçamento</Button>
              )}
              <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary"><Phone className="w-4 h-4" /> WhatsApp</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
