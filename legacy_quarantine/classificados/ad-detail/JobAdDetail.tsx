import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getCompanyDetails } from "@/services/jobs.functions";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  MapPin, Building2, DollarSign, Clock, Briefcase, GraduationCap, Users,
  Share2, Heart, Check, ChevronRight, Award, Star, Send, Upload,
} from "lucide-react";
import { JsonLd, jobPostingSchema } from "@/components/seo/JsonLd";

interface Props {
  ad: any;
  profile: any;
  isFavorited: boolean;
  onFavorite: () => void;
  onShare: () => void;
}

export default function JobAdDetail({ ad, profile, isFavorited, onFavorite, onShare }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const d = ad.features || {};
  const loc = ad.location as any || {};
  const [applyOpen, setApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: "", email: "", phone: "", message: "", cv_url: "" });

  // Fetch company if company_id exists
  const company = useQuery({
    queryKey: ["job-company", ad.company_id],
    enabled: !!ad.company_id,
    queryFn: async () => {
      return await getCompanyDetails({ data: { companyId: ad.company_id } });
    },
  });

  // Simulated application count (from views/contacts)
  const applicationCount = ad.contacts_count || 0;

  // Process seletivo steps
  const processSteps = typeof d.processo_seletivo === "string"
    ? d.processo_seletivo.split(",").map((s: string) => s.trim())
    : Array.isArray(d.processo_seletivo) ? d.processo_seletivo : [];

  const requisitos = typeof d.requisitos === "string"
    ? d.requisitos.split("\n").filter((s: string) => s.trim())
    : Array.isArray(d.requisitos) ? d.requisitos : [];

  const beneficios = typeof d.beneficios === "string"
    ? d.beneficios.split("\n").filter((s: string) => s.trim())
    : Array.isArray(d.beneficios) ? d.beneficios : [];

  const salaryStr = d.salario || d.faixa_salarial;
  const contractType = d.tipo_contrato || d.contrato;
  const regime = d.regime || d.modalidade;
  const nivel = d.nivel || d.senioridade;

  const handleApply = () => {
    if (!user) { navigate("/auth"); return; }
    toast.success("Candidatura enviada com sucesso!");
    setApplyOpen(false);
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <JsonLd data={jobPostingSchema(ad, window.location.origin)} />
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-4">
          {/* Company logo */}
          <div className="w-16 h-16 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
            {company.data?.logo_url ? (
              <img src={company.data.logo_url} alt="" className="w-full h-full object-cover" />
            ) : profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">{company.data?.name || profile?.name || "Empresa"}</p>
            <h1 className="text-xl font-[800] text-foreground mt-0.5">{ad.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {contractType && <Badge variant="outline"><Briefcase className="w-3 h-3 mr-1" />{contractType}</Badge>}
              {regime && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{regime}</Badge>}
              {nivel && <Badge variant="outline"><GraduationCap className="w-3 h-3 mr-1" />{nivel}</Badge>}
              {loc.city && <Badge variant="outline"><MapPin className="w-3 h-3 mr-1" />{loc.city}</Badge>}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={onFavorite} className={`w-9 h-9 rounded-full border flex items-center justify-center ${isFavorited ? "bg-destructive/10 text-destructive border-destructive/30" : "border-border"}`}>
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`} />
            </button>
            <button onClick={onShare} className="w-9 h-9 rounded-full border border-border flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Salary */}
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Faixa salarial</p>
            <p className="text-lg font-[800] text-foreground">{salaryStr || "A combinar"}</p>
          </div>
        </div>

        {/* Apply CTA + stats */}
        <div className="flex items-center gap-4 mt-4">
          <Sheet open={applyOpen} onOpenChange={setApplyOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="flex-1 font-bold gap-2"><Send className="w-4 h-4" /> Me candidatar</Button>
            </SheetTrigger>
            <SheetContent side="right" size="wide" className="w-full sm:max-w-3xl md:max-w-4xl lg:max-w-[70vw] xl:max-w-[70vw]">
              <SheetHeader><SheetTitle>Candidatura</SheetTitle></SheetHeader>
              <div className="space-y-4 mt-4">
                <div><label className="text-sm font-medium">Nome completo</label><Input value={applyForm.name} onChange={e => setApplyForm(f => ({ ...f, name: e.target.value }))} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Email</label><Input type="email" value={applyForm.email} onChange={e => setApplyForm(f => ({ ...f, email: e.target.value }))} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Telefone</label><Input value={applyForm.phone} onChange={e => setApplyForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Por que você é ideal?</label><Textarea value={applyForm.message} onChange={e => setApplyForm(f => ({ ...f, message: e.target.value }))} rows={3} className="mt-1" /></div>
                <Button className="w-full font-bold" onClick={handleApply}>Enviar candidatura</Button>
              </div>
            </SheetContent>
          </Sheet>
          {applicationCount > 0 && (
            <div className="text-center px-4">
              <p className="text-lg font-bold text-foreground">{applicationCount}</p>
              <p className="text-[10px] text-muted-foreground">candidatos</p>
            </div>
          )}
        </div>
      </div>

      {/* Process seletivo progress */}
      {processSteps.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5 space-y-3">
          <h3 className="text-sm font-bold flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Processo Seletivo</h3>
          <div className="flex items-center gap-1">
            {processSteps.map((step: string, i: number) => (
              <div key={i} className="flex items-center gap-1 flex-1">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: i === 0 ? "100%" : "0%" }} />
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {ad.description && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold mb-3">Descrição da vaga</h3>
          <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">{ad.description}</p>
        </div>
      )}

      {/* Requisitos */}
      {requisitos.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold mb-3">Requisitos</h3>
          <ul className="space-y-2">
            {requisitos.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm"><ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" /><span className="text-muted-foreground">{r}</span></li>
            ))}
          </ul>
        </div>
      )}

      {/* Benefícios */}
      {beneficios.length > 0 && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold mb-3">Benefícios</h3>
          <div className="grid grid-cols-2 gap-2">
            {beneficios.map((b: string, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary" /><span>{b}</span></div>
            ))}
          </div>
        </div>
      )}

      {/* Company */}
      {(company.data || profile) && (
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-bold mb-3">Sobre a empresa</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
              {(company.data?.logo_url || profile?.avatar_url) ? (
                <img src={company.data?.logo_url || profile?.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{company.data?.name || profile?.name}</p>
              {company.data?.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{company.data.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
