import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  MapPin, Bed, Bath, Car, Maximize, Building2, DollarSign, Calculator,
  MessageCircle, Phone, CalendarDays, FileText, Share2, Heart, Star, Eye,
  Check, Home, Fence, Waves, Wind, Shield as ShieldIcon, Flame, Droplets,
} from "lucide-react";
import { JsonLd, realEstateSchema } from "@/components/seo/JsonLd";

const AMENITY_ICONS: Record<string, any> = {
  piscina: Waves, churrasqueira: Flame, ar_condicionado: Wind,
  portaria: ShieldIcon, jardim: Fence, academia: Building2,
  lavanderia: Droplets,
};

interface Props {
  ad: any;
  profile: any;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

export default function PropertyAdDetail({ ad, profile, isFavorited, onFavorite, onShare }: Props) {
  const navigate = useNavigate();
  const d = ad.features || {};
  const loc = ad.location as any || {};

  // Financing calculator
  const [finAmount, setFinAmount] = useState(ad.price ? ad.price * 0.8 : 0);
  const [finRate, setFinRate] = useState(0.9);
  const [finYears, setFinYears] = useState(30);

  const monthlyPayment = useMemo(() => {
    if (!finAmount || !finRate) return 0;
    const r = finRate / 100;
    const n = finYears * 12;
    return (finAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }, [finAmount, finRate, finYears]);

  const photos = ad.photos || [];
  const [activePhoto, setActivePhoto] = useState(0);

  // Cost breakdown
  const rentOrPrice = ad.price || 0;
  const condominio = Number(d.condominio) || 0;
  const iptu = Number(d.iptu) || 0;
  const totalMensal = rentOrPrice + condominio + iptu;

  const isAluguel = d.operacao === "Aluguel";

  // Amenities from features
  const amenities = typeof d.comodidades === "string"
    ? d.comodidades.split(",").map((s: string) => s.trim())
    : Array.isArray(d.comodidades) ? d.comodidades : [];

  return (
    <div className="min-h-screen">
      <JsonLd data={realEstateSchema(ad, window.location.origin)} />
      {/* Fullscreen gallery */}
      <div className="relative w-full aspect-[16/9] max-h-[500px] overflow-hidden bg-muted">
        {photos.length > 0 ? (
          <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Home className="w-12 h-12" /></div>
        )}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={onFavorite} className={`w-9 h-9 rounded-full backdrop-blur-sm flex items-center justify-center shadow ${isFavorited ? "bg-destructive/90 text-white" : "bg-background/80 text-foreground"}`}>
            <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
          </button>
          <button onClick={onShare} className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
        {photos.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_: any, i: number) => (
              <button key={i} onClick={() => setActivePhoto(i)} className={`w-2.5 h-2.5 rounded-full transition-all ${i === activePhoto ? "bg-primary w-5" : "bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails */}
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
        {/* Left */}
        <div className="space-y-6">
          {/* Price & type */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="capitalize">{d.tipo_imovel || d.operacao || "Imóvel"}</Badge>
              {d.operacao && <Badge variant="outline" className="capitalize">{d.operacao}</Badge>}
            </div>
            <h1 className="text-2xl font-[800] text-foreground">{ad.title}</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {loc.neighborhood ? `${loc.neighborhood}, ` : ""}{loc.city || ""}
            </p>
            <p className="text-3xl font-[900] text-foreground mt-3">
              R$ {rentOrPrice.toLocaleString("pt-BR")}
              {isAluguel && <span className="text-base font-normal text-muted-foreground">/mês</span>}
            </p>
          </div>

          {/* Metrics row */}
          <div className="flex items-center gap-6 py-4 border-y border-border">
            {d.metragem && (
              <div className="flex items-center gap-2 text-foreground">
                <Maximize className="w-5 h-5 text-primary" />
                <div><p className="text-lg font-bold">{d.metragem}</p><p className="text-[10px] text-muted-foreground">m²</p></div>
              </div>
            )}
            {d.quartos && (
              <div className="flex items-center gap-2 text-foreground">
                <Bed className="w-5 h-5 text-primary" />
                <div><p className="text-lg font-bold">{d.quartos}</p><p className="text-[10px] text-muted-foreground">quartos</p></div>
              </div>
            )}
            {d.banheiros && (
              <div className="flex items-center gap-2 text-foreground">
                <Bath className="w-5 h-5 text-primary" />
                <div><p className="text-lg font-bold">{d.banheiros}</p><p className="text-[10px] text-muted-foreground">banheiros</p></div>
              </div>
            )}
            {(d.garagem || d.vagas) && (
              <div className="flex items-center gap-2 text-foreground">
                <Car className="w-5 h-5 text-primary" />
                <div><p className="text-lg font-bold">{d.garagem || d.vagas}</p><p className="text-[10px] text-muted-foreground">vagas</p></div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="sobre">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 gap-0">
              <TabsTrigger value="sobre" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Sobre</TabsTrigger>
              <TabsTrigger value="caracteristicas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Características</TabsTrigger>
              <TabsTrigger value="ficha" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Ficha Técnica</TabsTrigger>
              <TabsTrigger value="localizacao" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-[13px] font-medium">Localização</TabsTrigger>
            </TabsList>

            <TabsContent value="sobre" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5">
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ad.description || "Sem descrição."}</p>
              </div>
            </TabsContent>

            <TabsContent value="caracteristicas" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5">
                {amenities.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {amenities.map((a: string) => {
                      const Icon = AMENITY_ICONS[a.toLowerCase().replace(/\s/g, "_")] || Check;
                      return (
                        <div key={a} className="flex items-center gap-2 py-1.5">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm">{a}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(d).filter(([, v]) => v !== "" && v !== null && v !== undefined).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        <span className="text-xs text-muted-foreground">{key}:</span>
                        <span className="text-xs font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="ficha" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5">
                <div className="divide-y divide-border">
                  {Object.entries(d).filter(([, v]) => v !== "" && v !== null && v !== undefined).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2.5 text-sm">
                      <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                      <span className="font-semibold">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="localizacao" className="mt-4">
              <div className="bg-card border border-border rounded-lg p-5 space-y-3">
                <p className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-primary" />{loc.neighborhood ? `${loc.neighborhood}, ` : ""}{loc.city || "Localização aproximada"}</p>
                <div className="h-48 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm">Mapa em breve</div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Financing calculator (for sale) */}
          {!isAluguel && ad.price > 0 && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Calculator className="w-4 h-4 text-primary" /> Calculadora de Financiamento</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Valor financiado: R$ {finAmount.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</label>
                  <Slider value={[finAmount]} min={ad.price * 0.1} max={ad.price} step={1000} onValueChange={([v]) => setFinAmount(v)} className="mt-2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Taxa (% a.m.)</label>
                    <Input type="number" step="0.01" value={finRate} onChange={e => setFinRate(Number(e.target.value))} className="mt-1 h-9" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Prazo (anos)</label>
                    <Input type="number" value={finYears} onChange={e => setFinYears(Number(e.target.value))} className="mt-1 h-9" />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-xs text-muted-foreground">Parcela estimada</p>
                  <p className="text-2xl font-[800] text-primary">R$ {monthlyPayment.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</p>
                  <p className="text-[10px] text-muted-foreground">em {finYears * 12} parcelas</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4 lg:sticky lg:top-4 self-start">
          {/* Cost breakdown */}
          {(condominio > 0 || iptu > 0) && isAluguel && (
            <div className="bg-card border border-border rounded-lg p-5 space-y-3">
              <h3 className="text-sm font-bold flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Custo Mensal Total</h3>
              <div className="divide-y divide-border text-sm">
                <div className="flex justify-between py-2"><span className="text-muted-foreground">Aluguel</span><span className="font-semibold">R$ {rentOrPrice.toLocaleString("pt-BR")}</span></div>
                {condominio > 0 && <div className="flex justify-between py-2"><span className="text-muted-foreground">Condomínio</span><span className="font-semibold">R$ {condominio.toLocaleString("pt-BR")}</span></div>}
                {iptu > 0 && <div className="flex justify-between py-2"><span className="text-muted-foreground">IPTU</span><span className="font-semibold">R$ {(iptu / 12).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}</span></div>}
                <div className="flex justify-between py-2 text-primary font-bold"><span>Total</span><span>R$ {totalMensal.toLocaleString("pt-BR")}</span></div>
              </div>
            </div>
          )}

          {/* Seller card */}
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{profile?.name?.charAt(0) || "U"}</span>}
              </div>
              <div>
                <p className="text-sm font-semibold">{profile?.name || "Anunciante"}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {profile?.is_verified && <span className="text-primary font-medium">✓ Verificado</span>}
                  {profile?.rating > 0 && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-primary text-primary" />{Number(profile.rating).toFixed(1)}</span>}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button className="w-full gap-2"><MessageCircle className="w-4 h-4" /> Contatar</Button>
              <Button variant="outline" className="w-full gap-2 border-primary/30 text-primary"><Phone className="w-4 h-4" /> WhatsApp</Button>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><CalendarDays className="w-3.5 h-3.5" /> Agendar visita</Button>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs"><FileText className="w-3.5 h-3.5" /> Contrato</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
