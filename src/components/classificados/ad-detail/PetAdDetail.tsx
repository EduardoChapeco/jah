import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Heart, Share2, ChevronLeft, ChevronRight, PawPrint, Calendar,
  Shield, Syringe, Check, Dog, Cat, MessageCircle,
  Ruler, Weight, Activity, User,
} from "lucide-react";
import { JsonLd, productSchema } from "@/components/seo/JsonLd";

interface Props {
  ad: any;
  profile: any;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

export default function PetAdDetail({ ad, profile, isFavorited, onFavorite, onShare }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const d = ad.features || {};
  const photos = ad.photos || [];
  const [activePhoto, setActivePhoto] = useState(0);
  const [adoptionOpen, setAdoptionOpen] = useState(false);
  const [adoptForm, setAdoptForm] = useState({ name: "", phone: "", message: "", has_space: false, has_experience: false });

  const AnimalIcon = d.tipo_animal === "gato" ? Cat : Dog;

  // Personality chips
  const personalidade = typeof d.personalidade === "string"
    ? d.personalidade.split(",").map((s: string) => s.trim())
    : Array.isArray(d.personalidade) ? d.personalidade : [];

  // Vaccines timeline
  const vacinas = typeof d.vacinas === "string"
    ? d.vacinas.split(",").map((s: string) => s.trim())
    : Array.isArray(d.vacinas) ? d.vacinas : [];

  // Adoption requirements
  const requisitosAdocao = typeof d.requisitos_adocao === "string"
    ? d.requisitos_adocao.split("\n").filter((s: string) => s.trim())
    : Array.isArray(d.requisitos_adocao) ? d.requisitos_adocao : [];

  const isAdoption = d.tipo_anuncio === "adocao" || d.tipo_anuncio === "adoção" || ad.price === 0 || ad.price === null;

  const handleAdopt = () => {
    if (!user) { navigate("/auth"); return; }
    toast.success(isAdoption ? "Solicitação de adoção enviada!" : "Interesse registrado!");
    setAdoptionOpen(false);
  };

  return (
    <div className="min-h-screen">
      <JsonLd data={productSchema(ad, window.location.origin)} />
      {/* Cute gallery */}
      <div className="relative w-full aspect-[4/3] max-h-[500px] overflow-hidden bg-muted">
        {photos.length > 0 ? (
          <img src={photos[activePhoto]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground"><PawPrint className="w-16 h-16" /></div>
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
            <button key={i} onClick={() => setActivePhoto(i)} className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 ${i === activePhoto ? "border-primary" : "border-transparent opacity-60"}`}>
              <img src={p} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Title + Info */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <AnimalIcon className="w-6 h-6 text-primary" />
            <Badge>{isAdoption ? "Para adoção" : "Disponível"}</Badge>
          </div>
          <h1 className="text-3xl font-[800]">{ad.title}</h1>
          {ad.price > 0 && <p className="text-2xl font-bold text-primary mt-2">R$ {ad.price.toLocaleString("pt-BR")}</p>}
        </div>

        {/* Animal info chips */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {d.raca && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border"><PawPrint className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{d.raca}</span></div>}
          {d.idade && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border"><Calendar className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{d.idade}</span></div>}
          {d.porte && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border"><Ruler className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{d.porte}</span></div>}
          {d.sexo && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border"><User className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{d.sexo}</span></div>}
          {d.peso && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-card border border-border"><Weight className="w-4 h-4 text-primary" /><span className="text-sm font-medium">{d.peso}</span></div>}
          {d.castrado && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 border border-primary/20"><Shield className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-primary">Castrado</span></div>}
          {d.vacinado && <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary/10 border border-primary/20"><Syringe className="w-4 h-4 text-primary" /><span className="text-sm font-medium text-primary">Vacinado</span></div>}
        </div>

        {/* Description */}
        {ad.description && (
          <div className="bg-card border border-border rounded-lg p-5">
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ad.description}</p>
          </div>
        )}

        {/* Personality */}
        {personalidade.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> Personalidade</h3>
            <div className="flex flex-wrap gap-2">
              {personalidade.map((p: string, i: number) => (
                <Badge key={i} variant="outline" className="px-3 py-1.5">{p}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Vaccines timeline */}
        {vacinas.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold mb-3 flex items-center gap-2"><Syringe className="w-4 h-4 text-primary" /> Saúde & Vacinas</h3>
            <div className="space-y-2 ml-3 border-l-2 border-primary/20 pl-4">
              {vacinas.map((v: string, i: number) => (
                <div key={i} className="flex items-center gap-2 relative">
                  <div className="absolute -left-[22px] w-3 h-3 rounded-full bg-primary border-2 border-background" />
                  <span className="text-sm">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adoption requirements */}
        {requisitosAdocao.length > 0 && isAdoption && (
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="text-sm font-bold mb-3">Requisitos para Adoção</h3>
            <ul className="space-y-2">
              {requisitosAdocao.map((r: string, i: number) => (
                <li key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0" /><span>{r}</span></li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center gap-3">
          <Button size="lg" className="font-bold gap-2 px-8" onClick={() => setAdoptionOpen(true)}>
            <Heart className="w-5 h-5" /> {isAdoption ? "Quero adotar" : "Tenho interesse"}
          </Button>
          <Button size="lg" variant="outline" className="gap-2"><MessageCircle className="w-5 h-5" /> Mensagem</Button>
        </div>

        {/* Adoption form dialog */}
        <Dialog open={adoptionOpen} onOpenChange={setAdoptionOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{isAdoption ? "Formulário de Adoção" : "Demonstrar Interesse"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><label className="text-sm font-medium">Nome completo</label><Input value={adoptForm.name} onChange={e => setAdoptForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Telefone / WhatsApp</label><Input value={adoptForm.phone} onChange={e => setAdoptForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Por que deseja {isAdoption ? "adotar" : "este pet"}?</label><Textarea value={adoptForm.message} onChange={e => setAdoptForm(f => ({ ...f, message: e.target.value }))} rows={3} className="mt-1" /></div>
              {isAdoption && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={adoptForm.has_space} onChange={e => setAdoptForm(f => ({ ...f, has_space: e.target.checked }))} /> Tenho espaço adequado</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={adoptForm.has_experience} onChange={e => setAdoptForm(f => ({ ...f, has_experience: e.target.checked }))} /> Tenho experiência com animais</label>
                </div>
              )}
              <Button className="w-full font-bold" onClick={handleAdopt}>Enviar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
