import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MapPin, Fuel, Gauge, Calendar, Settings2, Car, ChevronLeft, ChevronRight,
  MessageCircle, Phone, CalendarDays, FileText, Share2, Heart, Star, TrendingDown,
  Check, X, Shield, ClipboardCheck, BarChart3,
} from "lucide-react";
import { JsonLd, productSchema } from "@/components/seo/JsonLd";

interface Props {
  ad: any;
  profile: any;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

export default function AutoAdDetail({ ad, profile, isFavorited, onFavorite, onShare }: Props) {
  const navigate = useNavigate();
  const d = ad.features || {};
  const loc = ad.location as any || {};
  const photos = ad.photos || [];
  const [activePhoto, setActivePhoto] = useState(0);

  const fipePrice = Number(d.fipe) || 0;
  const adPrice = ad.price || 0;
  const fipeDiff = fipePrice > 0 ? ((adPrice - fipePrice) / fipePrice * 100) : 0;

  const opcionais = typeof d.opcionais === "string"
    ? d.opcionais.split(",").map((s: string) => s.trim())
    : Array.isArray(d.opcionais) ? d.opcionais : [];

  const priceHistory = Array.isArray(ad.price_history) ? ad.price_history as any[] : [];

  return (
    <div className="min-h-screen">
      <JsonLd data={productSchema(ad, window.location.origin)} />
      {/* Gallery */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] overflow-hidden bg-muted">
        {photos.length > 0 ? (
          <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Car className="w-12 h-12" /></div>
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

      {photos.length > 1 && (
        <div className="max-w-5xl mx-auto px-4 mt-3 flex gap-2 overflow-x-auto">
          {photos.map((p: string, i: number) => (
            <button key={i} onClick={() => setActivePhoto(i)} className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 ${i === activePhoto ? "border-primary" : "border-transparent opacity-60"}`}>
              <img src={p} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-[800]">{ad.title}</h1>
            {/* Metadata line */}
            <div className="flex items-center gap-3 mt-3 flex-wrap text-sm text-muted-foreground">
              {d.marca && <Badge variant="outline">{d.marca}</Badge>}
              {d.modelo && <Badge variant="outline">{d.modelo}</Badge>}
              {d.ano && <Badge variant="outline"><Calendar className="w-3 h-3 mr-1" />{d.ano}</Badge>}
              {d.km && <Badge variant="outline"><Gauge className="w-3 h-3 mr-1" />{Number(d.km).toLocaleString("pt-BR")} km</Badge>}
              {d.cambio && <Badge variant="outline"><Settings2 className="w-3 h-3 mr-1" />{d.cambio}</Badge>}
              {d.combustivel && <Badge variant="outline"><Fuel className="w-3 h-3 mr-1" />{d.combustivel}</Badge>}
            </div>
          </div>

          {/* Price + FIPE */}
          <div className="flex items-center gap-4">
            <p className="text-3xl font-[900]">R$ {adPrice.toLocaleString("pt-BR")}</p>
          </div>

          {fipePrice > 0 && (
            <div className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Tabela FIPE</p>
                  <p className="text-sm font-bold">R$ {fipePrice.toLocaleString("pt-BR")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Anunciando por</p>
                <p className="text-sm font-bold">R$ {adPrice.toLocaleString("pt-BR")}</p>
              </div>
              <Badge variant={fipeDiff < 0 ? "default" : "secondary"} className={fipeDiff < 0 ? "bg-primary" : ""}>
                <TrendingDown className="w-3 h-3 mr-1" />
                {Math.abs(fipeDiff).toFixed(1)}% {fipeDiff < 0 ? "abaixo" : "acima"}
              </Badge>
            </div>
          )}

          {/* Price history */}
          {priceHistory.length > 0 && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Histórico de Preço</h3>
              <div className="space-y-1">
                {priceHistory.slice(-5).map((h: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs py-1 border-b border-border last:border-0">
                    <span className="text-muted-foreground">{h.date || `Alteração ${i + 1}`}</span>
                    <span className="font-medium">R$ {Number(h.price || 0).toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <Tabs defaultValue="sobre">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
              <TabsTrigger value="sobre" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Sobre</TabsTrigger>
              <TabsTrigger value="opcionais" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Opcionais</TabsTrigger>
              <TabsTrigger value="documentacao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Documentação</TabsTrigger>
              <TabsTrigger value="avaliacao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Avaliação</TabsTrigger>
            </TabsList>

            <TabsContent value="sobre" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ad.description || "Sem descrição."}</p>
              </div>
            </TabsContent>

            <TabsContent value="opcionais" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5">
                {opcionais.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {opcionais.map((o: string) => (
                      <div key={o} className="flex items-center gap-2 py-1"><Check className="w-4 h-4 text-primary" /><span className="text-sm">{o}</span></div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhum opcional informado.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="documentacao" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5 space-y-2">
                {d.placa_final && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Final da placa</span><span className="font-medium">{d.placa_final}</span></div>}
                {d.ipva && <div className="flex justify-between text-sm"><span className="text-muted-foreground">IPVA</span><span className="font-medium">{d.ipva}</span></div>}
                {d.licenciamento && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Licenciamento</span><span className="font-medium">{d.licenciamento}</span></div>}
                {d.unico_dono && <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" /><span>Único dono</span></div>}
                {d.manual_chave_reserva && <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" /><span>Manual e chave reserva</span></div>}
              </div>
            </TabsContent>

            <TabsContent value="avaliacao" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5">
                {d.laudo_cautelar ? (
                  <div className="flex items-center gap-2 text-sm text-primary"><ClipboardCheck className="w-5 h-5" /><span className="font-medium">Laudo cautelar disponível</span></div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem avaliação mecânica disponível.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{profile?.name?.charAt(0) || "U"}</span>}
              </div>
              <div>
                <p className="text-sm font-semibold">{profile?.name || "Anunciante"}</p>
                {profile?.is_verified && <span className="text-xs text-primary font-medium">✓ Verificado</span>}
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full gap-2"><MessageCircle className="w-4 h-4" /> Contatar</Button>
              <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary"><Phone className="w-4 h-4" /> WhatsApp</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><CalendarDays className="w-3.5 h-3.5" /> Test drive</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Contrato</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
