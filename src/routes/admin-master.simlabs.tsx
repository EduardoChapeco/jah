/**
 * admin-master.simlabs.tsx — SimLabs: Laboratório de Personas Sintéticas & IA
 * Simulação de Mercado, Intenção de Compra de Personas e Testes Cognitivos de Produtos.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { 
  Brain, 
  Users, 
  Play, 
  CheckCircle, 
  Sparkle, 
  Plus, 
  ChartBar, 
  Target, 
  Lightbulb
} from "@phosphor-icons/react";
import { listSimLabPersonas, listResearchSessions, createSimLabPersona, runSimLabResearch } from "@/services/simlab.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin-master/simlabs")({
  head: () => ({ meta: [{ title: "SimLabs & Personas Sintéticas | Admin Master" }] }),
  loader: async () => {
    try {
      const [personas, sessions] = await Promise.all([
        listSimLabPersonas().catch(() => []),
        listResearchSessions().catch(() => []),
      ]);
      return { personas, sessions };
    } catch {
      return { personas: [], sessions: [] };
    }
  },
  component: AdminSimLabsPage,
});

function AdminSimLabsPage() {
  const { personas, sessions } = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<"sessions" | "personas" | "new_sim">("sessions");
  const [isPending, startTransition] = useTransition();

  // Form Simulação
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [personasCount, setPersonasCount] = useState("5");

  // Form Persona
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState("");
  const [neighborhood, setNeighborhood] = useState("Centro");
  const [promptPersona, setPromptPersona] = useState("");

  const handleRunSimulation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !objective) return;

    startTransition(async () => {
      try {
        await runSimLabResearch({
          data: {
            title,
            objective,
            simulated_personas_count: parseInt(personasCount) || 5,
          },
        });
        toast.success("Simulação de mercado executada com sucesso!");
        setTitle("");
        setObjective("");
        setActiveTab("sessions");
      } catch (err: any) {
        toast.error(err.message || "Erro ao executar simulação");
      }
    });
  };

  const handleCreatePersona = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !archetype || !promptPersona) return;

    startTransition(async () => {
      try {
        await createSimLabPersona({
          data: {
            name,
            archetype,
            neighborhood,
            prompt_persona: promptPersona,
            habits: ["compras locais", "mobile", "pix"],
          },
        });
        toast.success("Persona sintética criada com sucesso!");
        setName("");
        setArchetype("");
        setPromptPersona("");
        setActiveTab("personas");
      } catch (err: any) {
        toast.error(err.message || "Erro ao criar persona");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                SimLabs: Inteligência Sintética
              </h1>
              <p className="text-xs text-muted-foreground">
                Simulações de mercado com esquadrões de personas consumidoras e testes preditivos de adesão.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("sessions")}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === "sessions"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChartBar className="mr-1.5 inline h-4 w-4" />
              Pesquisas Simuladas ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab("personas")}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === "personas"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="mr-1.5 inline h-4 w-4" />
              Personas Sintéticas ({personas.length})
            </button>
            <button
              onClick={() => setActiveTab("new_sim")}
              className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                activeTab === "new_sim"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Play className="mr-1.5 inline h-4 w-4" />
              Nova Simulação IA
            </button>
          </div>
        </div>

        {/* Tab 1: Pesquisas e Insights */}
        {activeTab === "sessions" && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-12 text-center">
                <Brain className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold text-foreground">Nenhuma pesquisa simulada executada</p>
                <p className="mt-1 text-xs text-muted-foreground">Inicie uma nova simulação para testar novos produtos com IA.</p>
              </div>
            ) : (
              sessions.map((session: any) => (
                <div key={session.id} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                        SimLab Research Session
                      </span>
                      <h2 className="mt-1 text-lg font-bold text-foreground">{session.title}</h2>
                      <p className="text-xs text-muted-foreground">{session.objective}</p>
                    </div>

                    <span className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-500">
                      Concluída
                    </span>
                  </div>

                  {/* Summary Box */}
                  <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-foreground">
                    <div className="flex items-center gap-2 font-bold text-primary">
                      <Lightbulb className="h-4 w-4" />
                      Insight Preditivo do Esquadrão
                    </div>
                    <p className="mt-1 leading-relaxed opacity-90">{session.summary_insight}</p>
                  </div>

                  {/* Personas Feedback */}
                  {session.execution_results && session.execution_results.length > 0 && (
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {session.execution_results.map((res: any, idx: number) => (
                        <div key={idx} className="rounded-xl border border-border bg-background p-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{res.persona_name}</span>
                            <span className="text-xs font-bold text-emerald-500">{res.purchase_intent}% intenção</span>
                          </div>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">{res.feedback}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Personas */}
        {activeTab === "personas" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {personas.map((persona: any) => (
              <div key={persona.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{persona.name}</h3>
                    <p className="text-xs text-muted-foreground">{persona.archetype}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
                  <div>Bairro: <span className="font-semibold text-foreground">{persona.neighborhood}</span></div>
                  <div>Faixa Etária: <span className="font-semibold text-foreground">{persona.age_range} anos</span></div>
                  <div>Classe Social: <span className="font-semibold text-foreground">Classe {persona.income_level}</span></div>
                </div>

                <p className="mt-3 line-clamp-3 rounded-lg bg-surface-paper p-2.5 text-[11px] italic text-muted-foreground">
                  "{persona.prompt_persona}"
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Nova Simulação */}
        {activeTab === "new_sim" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-base font-bold text-foreground">Executar Nova Simulação de Mercado com IA</h2>
            <p className="text-xs text-muted-foreground">
              O esquadrão de personas sintéticas simulará o comportamento de compra e gerará feedbacks qualitativos.
            </p>

            <form onSubmit={handleRunSimulation} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">Título do Experimento</label>
                <input
                  type="text"
                  placeholder="Ex: Lançamento de Combo Noturno de Sushi com Frete Grátis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Hipótese / Objetivo do Teste</label>
                <textarea
                  rows={3}
                  placeholder="Ex: Queremos validar se moradores dos bairros Centro e Efapi aceitariam pagar R$ 89,90 por um combo premium com entrega em 30 min..."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Quantidade de Personas Simuladas</label>
                <select
                  value={personasCount}
                  onChange={(e) => setPersonasCount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="3">3 Personas (Rápido)</option>
                  <option value="5">5 Personas (Padrão Recomendado)</option>
                  <option value="10">10 Personas (Aprofundado)</option>
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Play className="h-4 w-4" />
                  {isPending ? "Simulando..." : "Executar Experimento IA"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
