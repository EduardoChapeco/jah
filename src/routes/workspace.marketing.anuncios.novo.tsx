import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  ArrowLeft,
  Sparkles,
  MapPin,
  DollarSign,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyField } from "@/components/ui/currency-field";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createAdCampaign } from "@/services/ads.functions";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/marketing/anuncios/novo")({
  head: () => ({ meta: [{ title: "Criar Campanha de Anúncio | JAH" }] }),
  component: NovoAnuncioPage,
});

const AD_FORMATS = [
  {
    id: "post_patrocinado",
    title: "Post Patrocinado no Feed",
    desc: "Aparece intercalado no feed principal da comunidade com badge 'Patrocinado'.",
    reachMultiplier: 1.0,
  },
  {
    id: "banner_destaque",
    title: "Banner de Destaque no Mercado",
    desc: "Posição de topo com alta visibilidade para quem busca produtos e marcas.",
    reachMultiplier: 1.4,
  },
  {
    id: "story_patrocinado",
    title: "Story / Moment Patrocinado",
    desc: "Aparece na barra de stories com link direto para o produto ou evento.",
    reachMultiplier: 1.2,
  },
  {
    id: "stories_sponsor",
    title: "Stories Patrocinados",
    desc: "Story imersivo na barra superior com botão direto para WhatsApp ou Vitrine.",
    reachMultiplier: 1.8,
  },
  {
    id: "busca_topo",
    title: "Destaque no Topo da Busca",
    desc: "Exibido prioritariamente quando alguém pesquisa palavras-chave relacionadas.",
    reachMultiplier: 1.8,
  },
] as const;

function NovoAnuncioPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [format, setFormat] = useState<any>("post_patrocinado");
  const [location, setLocation] = useState("Chapecó / SC e Região");
  const [radiusKm, setRadiusKm] = useState(15);
  const [dailyBudgetCents, setDailyBudgetCents] = useState<number | undefined>(2000);
  const [totalBudgetCents, setTotalBudgetCents] = useState<number | undefined>(10000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estimativa de alcance baseada no orçamento diário
  const dailyNum = (dailyBudgetCents || 0) / 100;
  const selectedFormat = AD_FORMATS.find((f) => f.id === format);
  const multiplier = selectedFormat?.reachMultiplier || 1.0;
  const estimatedDailyReachMin = Math.round(dailyNum * 45 * multiplier);
  const estimatedDailyReachMax = Math.round(dailyNum * 95 * multiplier);
  const estimatedClicks = Math.round(dailyNum * 3.5 * multiplier);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Informe o título da campanha.");
      return;
    }

    const dailyCents = dailyBudgetCents || 0;
    const totalCents = totalBudgetCents || 0;

    if (dailyCents < 500) {
      toast.error("O orçamento diário mínimo é de R$ 5,00.");
      return;
    }
    if (totalCents < dailyCents) {
      toast.error("O orçamento total deve ser igual ou superior ao diário.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createAdCampaign({
        data: {
          title,
          format,
          target_location: location,
          target_radius_km: radiusKm,
          daily_budget_cents: dailyCents,
          total_budget_cents: totalCents,
        },
      });

      toast.success("Campanha criada e ativa para veiculação!");
      navigate({ to: "/workspace/marketing/anuncios" as any });
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao criar campanha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl size-9">
            <Link to="/workspace/marketing/anuncios">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Nova Campanha de Anúncio</h1>
            <p className="text-xs text-muted-foreground">
              Configure o formato, localização e orçamento do seu anúncio
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Formulário Principal */}
        <div className="md:col-span-7 space-y-5">
          <div className="squircle-soft bg-card border border-border p-5 space-y-4 shadow-xs">
            <div className="space-y-1.5">
              <Label htmlFor="ad-title" className="text-xs font-semibold">
                Título ou Chamada do Anúncio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ad-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: 20% OFF no Primeiro Lote / Almoço Especial"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            {/* Formato */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Formato do Anúncio</Label>
              <div className="space-y-2">
                {AD_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={cn(
                      "w-full p-3 rounded-xl border text-left flex items-start justify-between transition-all",
                      format === f.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                        : "border-border bg-background hover:bg-muted/40",
                    )}
                  >
                    <div>
                      <p className="text-xs font-bold text-foreground">{f.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
                    </div>
                    {format === f.id && (
                      <CheckCircle2 className="size-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Segmentação de Localização */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <Label
                htmlFor="ad-location"
                className="text-xs font-semibold flex items-center gap-1.5"
              >
                <MapPin className="size-3.5 text-primary" />
                Localização Alvo & Raio de Alcance
              </Label>
              <Input
                id="ad-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Bairro Centro, Chapecó / SC"
                className="h-10 text-xs rounded-xl"
                required
              />
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Raio de entrega / alcance:</span>
                <span className="font-bold text-foreground">{radiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
            </div>

            {/* Orçamentos */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
              <div className="space-y-1.5">
                <Label htmlFor="ad-daily" className="text-xs font-semibold">
                  Orçamento Diário (R$)
                </Label>
                <CurrencyField
                  id="ad-daily"
                  value={dailyBudgetCents}
                  onChange={setDailyBudgetCents}
                  placeholder="0,00"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ad-total" className="text-xs font-semibold">
                  Orçamento Limite Total (R$)
                </Label>
                <CurrencyField
                  id="ad-total"
                  value={totalBudgetCents}
                  onChange={setTotalBudgetCents}
                  placeholder="0,00"
                  className="h-10 text-xs rounded-xl"
                  required
                />
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="w-full rounded-xl font-semibold gap-2 shadow-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Criando e Ativando Campanha...
              </>
            ) : (
              <>
                <Megaphone className="size-4" />
                Lançar Campanha Agora
              </>
            )}
          </Button>
        </div>

        {/* Painel Lateral: Previsão de Resultados com IA */}
        <div className="md:col-span-5 space-y-4">
          <div className="squircle-soft bg-card border border-border p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Estimativa de Impacto (IA)
              </h3>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground">Alcance Diário Estimado</span>
                <p className="text-lg font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-4 text-primary" />
                  {estimatedDailyReachMin.toLocaleString()} -{" "}
                  {estimatedDailyReachMax.toLocaleString()} pessoas
                </p>
              </div>

              <div className="p-3 bg-muted/40 rounded-xl space-y-1">
                <span className="text-[11px] text-muted-foreground">
                  Cliques / Interações Estimadas
                </span>
                <p className="text-lg font-bold text-primary flex items-center gap-1.5">
                  <TrendingUp className="size-4" />~{estimatedClicks} cliques/dia
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl text-xs space-y-1">
              <p className="font-bold text-foreground">Como funciona a cobrança?</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Você só é cobrado pelas impressões e cliques reais entregues na sua região. O
                anúncio pausa automaticamente ao atingir o limite total.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
