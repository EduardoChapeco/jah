import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Sparkles,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Loader2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  getSeedPersonas,
  runPersonaSimulation,
  getSimLabStatus,
} from "@/services/simlab.functions";
import type { SimulationResult, SyntheticPersona } from "@/lib/simlab/simulator";
import { cn } from "@/lib/utils";

import { PageHeader } from "@/components/commerce/page-header";

export const Route = createFileRoute("/workspace/simulacao")({
  head: () => ({ meta: [{ title: "SimLab — Enxame de Validação Preditiva | Wider" }] }),
  loader: async () => {
    const [personas, status] = await Promise.all([
      getSeedPersonas(),
      getSimLabStatus().catch(() => ({ isEnabled: true, isAdmin: false, role: "customer" })),
    ]);
    return { personas, status };
  },
  component: SimulacaoPage,
});

const NICHES = [
  { id: "eventos", label: "Eventos & Festas" },
  { id: "gastronomia", label: "Gastronomia & Restaurante" },
  { id: "moda", label: "Moda & Acessórios" },
  { id: "musica", label: "Música & Shows" },
  { id: "servicos", label: "Serviços Culturais" },
  { id: "classificados", label: "Classificados & Desapego" },
] as const;

function SimulacaoPage() {
  const { personas, status } = Route.useLoaderData();

  const [title, setTitle] = useState("Lançamento Coleção Cápsula Outono");
  const [description, setDescription] = useState(
    "Peças exclusivas feitas à mão com algodão sustentável e tiragem limitada de 50 unidades. Acompanha zine editorial impresso.",
  );
  const [priceReais, setPriceReais] = useState("129.90");
  const [niche, setNiche] = useState<any>("moda");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [adminSimLabActive, setAdminSimLabActive] = useState(status?.isEnabled ?? true);

  const handleToggleAdminStatus = () => {
    setAdminSimLabActive(!adminSimLabActive);
    toast.success(
      !adminSimLabActive
        ? "SimLab IA ativado para todos os lojistas do workspace."
        : "SimLab IA restrito ao modo de governança Admin Master.",
    );
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Preencha título e descrição para simular.");
      return;
    }

    setIsRunning(true);
    try {
      const priceCents = Math.round(parseFloat(priceReais || "0") * 100);
      const res = await runPersonaSimulation({
        data: {
          title,
          description,
          priceCents,
          niche,
        },
      });

      setResult(res);
      toast.success("Simulação do Enxame concluída!");
    } catch (e: unknown) {
      toast.error((e instanceof Error ? e.message : String(e)) || "Erro ao rodar simulação.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header */}
      <PageHeader
        eyebrow="Inteligência Artificial"
        title="SimLab — Enxame de Validação"
        actions={
          <Button
            onClick={handleSimulate}
            disabled={isRunning}
            size="sm"
            className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground  shrink-0"
          >
            {isRunning ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1" />
                <span>Simulando Enxame...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                <span>Executar Simulação</span>
              </>
            )}
          </Button>
        }
      />

      {/* Admin Master Feature Flag Governance Card */}
      {status?.isAdmin && (
        <div className="squircle-soft border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                Controle de Governança — Admin Global
                <Badge variant="outline" className="text-[10px] rounded-full">
                  {adminSimLabActive ? "Ativo para Lojistas" : "Restrito a Administradores"}
                </Badge>
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Alterne a liberação do motor de simulação estocástica e enxame de personas para
                produtores e lojistas comuns.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleAdminStatus}
            className="rounded-xl text-xs font-semibold shrink-0 h-8"
          >
            {adminSimLabActive ? "Restringir ao Admin" : "Liberar para Lojistas"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel Esquerdo: Formulário da Proposta */}
        <div className="lg:col-span-5 space-y-5">
          <form
            onSubmit={handleSimulate}
            className="squircle-soft bg-card  p-5 space-y-4 "
          >
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Dados da Proposta para Teste
            </h2>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nicho / Categoria</Label>
              <div className="grid grid-cols-2 gap-2">
                {NICHES.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setNiche(n.id)}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all",
                      niche === n.id
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/60",
                    )}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-title" className="text-xs font-semibold">
                Título do Item / Evento
              </Label>
              <Input
                id="sim-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Show de Lançamento da Banda X"
                className="h-10 text-xs rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-price" className="text-xs font-semibold">
                Preço Pretendido (R$)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                  R$
                </span>
                <Input
                  id="sim-price"
                  type="number"
                  step="0.01"
                  value={priceReais}
                  onChange={(e) => setPriceReais(e.target.value)}
                  placeholder="0,00"
                  className="h-10 pl-9 text-xs rounded-xl font-mono font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sim-desc" className="text-xs font-semibold">
                Descrição / Pitch da Oferta
              </Label>
              <textarea
                id="sim-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Explique os diferenciais, materiais, horários e proposta..."
                className="w-full text-xs rounded-xl  bg-background p-3 focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={isRunning}
              className="w-full rounded-xl font-semibold gap-2 mt-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Executar Simulação
                </>
              )}
            </Button>
          </form>

          {/* Personas em Monitoramento */}
          <div className="squircle-soft bg-card  p-4 space-y-3">
            <h3 className="text-xs font-bold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Users className="size-3.5 text-primary" />
                Catálogo de Personas Disponíveis
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {personas.length} calibradas
              </span>
            </h3>
            <div className="space-y-2">
              {personas.map((p: SyntheticPersona) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl  bg-background text-xs"
                >
                  <div>
                    <p className="font-semibold text-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.demographic.age} anos • {p.demographic.city}/{p.demographic.state} •{" "}
                      {p.demographic.occupation}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] rounded-full">
                    R$ {p.demographic.income}/mês
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Painel Direito: Resultados da Simulação */}
        <div className="lg:col-span-7 space-y-5">
          {!result && !isRunning && (
            <div className="squircle-soft bg-card border-0 p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-[400px]">
              <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                <Sparkles className="size-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">Aguardando Execução do Enxame</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                Preencha os dados da sua oferta à esquerda e clique em{" "}
                <strong>"Simular Proposta"</strong> para obter previsão de conversão, elasticidade e
                objeções reais de clientes.
              </p>
            </div>
          )}

          {isRunning && (
            <div className="squircle-soft bg-card  p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[400px]">
              <Loader2 className="size-10 text-primary animate-spin" />
              <div className="space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  Processando Enxame Estocástico...
                </h3>
                <p className="text-xs text-muted-foreground">
                  Consultando vetores de decisão, elasticidade de renda e sensibilidade de preço nas
                  personas calibradas.
                </p>
              </div>
            </div>
          )}

          {result && !isRunning && (
            <div className="space-y-5">
              {/* Score Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="squircle-soft bg-card  p-4 space-y-1 ">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Atratividade Geral
                    </span>
                    <Sparkles className="size-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {result.overallScore}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </p>
                </div>

                <div className="squircle-soft bg-card  p-4 space-y-1 ">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Conversão Estimada
                    </span>
                    <TrendingUp className="size-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    {result.estimatedConversionRate}%
                  </p>
                </div>

                <div className="squircle-soft bg-card  p-4 space-y-1 ">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Percepção de Preço
                    </span>
                    <DollarSign className="size-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    {result.priceElasticityIndex}
                    <span className="text-xs font-normal text-muted-foreground">/100</span>
                  </p>
                </div>
              </div>

              {/* Recomendações e Objeções */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="squircle-soft bg-card  p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5 text-amber-500" />
                    Top Objeções Identificadas
                  </h4>
                  {result.topObjections.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhuma objeção crítica encontrada.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                      {result.topObjections.map((obj, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="squircle-soft bg-card  p-4 space-y-2">
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                    Recomendações do SimLab
                  </h4>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Feedbacks Individuais das Personas */}
              <div className="squircle-soft bg-card  p-5 space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center justify-between">
                  <span>Reações Detalhadas por Persona</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {result.favorableCount} favoráveis • {result.skepticalCount} céticos
                  </span>
                </h3>

                <div className="space-y-3">
                  {result.evaluations.map((ev) => (
                    <div
                      key={ev.persona.id}
                      className=" bg-background rounded-xl p-3.5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-foreground">{ev.persona.name}</p>
                          <span className="text-[10px] text-muted-foreground">
                            ({ev.persona.demographic.city}/{ev.persona.demographic.state})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={ev.willConvert ? "default" : "secondary"}
                            className="text-[10px] rounded-full"
                          >
                            {ev.willConvert ? "Compraria (Provável)" : "Rejeitaria"}
                          </Badge>
                          <span className="text-xs font-mono font-bold text-primary">
                            {ev.conversionProbability}%
                          </span>
                        </div>
                      </div>

                      <p className="text-xs italic text-foreground/90 bg-muted/30 p-2.5 rounded-lg ">
                        "{ev.quote}"
                      </p>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                        <span>
                          Gatilho:{" "}
                          <strong className="text-foreground">{ev.triggerActivated}</strong>
                        </span>
                        <span>
                          Preço percebido:{" "}
                          <strong className="text-foreground">{ev.pricePerception}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
