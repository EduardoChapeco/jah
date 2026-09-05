import React, { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Bot,
  Briefcase,
  Play,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  Award,
  BookOpen,
  FileCheck,
  RefreshCw,
  Sliders,
  ExternalLink,
  X,
  AlertCircle,
} from "lucide-react";
import {
  listStoreSquads,
  triggerSquadRun,
  approveSquadRun,
  SquadWithDetails,
} from "@/services/squads-runtime.functions";

export const Route = createFileRoute("/workspace/squads/")({
  head: () => ({ meta: [{ title: "Squads Agênticos Especializados | JAH Master OS" }] }),
  component: SquadsWorkspacePage,
});

export function SquadsWorkspacePage() {
  const [storeId] = useState("c6ccd3b2-aa54-42a2-b0fe-251daa5b97f7");

  const [loading, setLoading] = useState(true);
  const [squads, setSquads] = useState<SquadWithDetails[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<SquadWithDetails["agents"][0] | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── CARREGAR SQUADS REAIS DO BANCO ───────────────────────────────────────
  async function loadData() {
    setLoading(true);
    try {
      const data = await listStoreSquads(storeId);
      setSquads(data);
    } catch (err) {
      console.error("Erro ao carregar squads:", err);
      setFeedback({
        type: "error",
        message: "Não foi possível carregar os squads no banco de dados.",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [storeId]);

  // ── DISPARAR CORRIDA DO SQUAD ───────────────────────────────────────────
  async function handleTriggerRun(squadId: string) {
    setActionLoading(`trigger-${squadId}`);
    try {
      await triggerSquadRun(storeId, squadId, {
        triggerSource: "manual",
        inputPayload: { goal: "Execução manual supervisionada de rotina do squad" },
      });
      setFeedback({
        type: "success",
        message: "Nova rotina iniciada! Entregáveis gerados e aguardando sua revisão executiva.",
      });
      await loadData();
    } catch (err) {
      console.error("Erro ao disparar squad:", err);
      setFeedback({
        type: "error",
        message: "Falha ao disparar a rotina do squad.",
      });
    } finally {
      setActionLoading(null);
    }
  }

  // ── APROVAR CORRIDA (HUMAN-IN-THE-LOOP) ──────────────────────────────────
  async function handleApproveRun(runId: string) {
    setActionLoading(`approve-${runId}`);
    try {
      await approveSquadRun(storeId, runId);
      setFeedback({
        type: "success",
        message: "Entrega aprovada com sucesso! As diretrizes foram consolidadas no sistema.",
      });
      await loadData();
    } catch (err) {
      console.error("Erro ao aprovar entrega:", err);
      setFeedback({
        type: "error",
        message: "Falha ao aprovar entrega do squad.",
      });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-28">
      {/* ── HEADER EXECUTIVO COM SELO SILENCIOSO APPLE HIG ── */}
      <div className="border-b border-border/40 bg-card/50 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                  Squads Agênticos
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  4 Departamentos · 15 Especialistas
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight mt-1 text-foreground">
                Squads Especializados
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Operação autônoma supervisionada com entregáveis estratégicos e táticos.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadData()}
                disabled={loading}
                className="h-11 px-4 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-medium border border-border/60 bg-background hover:bg-muted/40 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Atualizar Squads
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTA DE FEEDBACK ── */}
      {feedback && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div
            className={`p-4 rounded-xl flex items-center justify-between border ${
              feedback.type === "success"
                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{feedback.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs underline opacity-80 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ── GRADE DOS 4 ESCRITÓRIOS VIRTUAIS ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center text-muted-foreground">
            <RefreshCw className="w-8 h-8 animate-spin mb-3 text-primary" />
            <p className="text-sm font-medium">Conectando aos escritórios virtuais dos squads...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {squads.map((squad) => {
              const hasPendingApproval = squad.latest_run?.status === "needs_approval";

              return (
                <div
                  key={squad.id}
                  className="bg-card border border-border/50 rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-6"
                >
                  {/* Topo do Card do Squad */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 text-[11px]">
                            {squad.template.badge_label}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            Cadência {squad.cadence}
                          </span>
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-foreground mt-2">
                          {squad.custom_name}
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {squad.template.description}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Operacional
                      </span>
                    </div>

                    {/* Meta Operacional */}
                    {squad.operational_goal && (
                      <div className="mt-4 p-3 rounded-xl bg-muted/20 border border-border/30 text-xs text-foreground">
                        <strong className="text-muted-foreground block text-[10px] uppercase tracking-wider mb-0.5">
                          Objetivo Atual do Squad:
                        </strong>
                        {squad.operational_goal}
                      </div>
                    )}

                    {/* Lista dos Especialistas do Squad */}
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Membros do Time ({squad.agents.length} Especialistas)
                        </h3>
                        <span className="text-[11px] text-muted-foreground">Clique para ver currículo</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {squad.agents.map((agent) => (
                          <div
                            key={agent.agent_id}
                            onClick={() => setSelectedAgent(agent)}
                            className="p-3 rounded-xl bg-muted/10 border border-border/40 hover:bg-muted/30 hover:border-border transition-all cursor-pointer flex items-center justify-between group"
                          >
                            <div className="truncate pr-2">
                              <span className="text-xs font-semibold text-foreground block truncate group-hover:text-primary transition-colors">
                                {agent.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground block truncate">
                                {agent.role_label}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Status de Execução & Human-in-the-Loop */}
                  <div className="pt-5 border-t border-border/30 space-y-4">
                    {/* Alerta de Aprovação Pendente */}
                    {hasPendingApproval && squad.latest_run && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-bold text-foreground block">
                              Entrega Aguardando Sua Aprovação
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              Diagnóstico concluído ({squad.latest_run.output_artifacts?.pending_approval_items?.length || 1} item pendente).
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApproveRun(squad.latest_run!.id)}
                          disabled={actionLoading === `approve-${squad.latest_run.id}`}
                          className="h-11 px-4 inline-flex items-center gap-1.5 rounded-xl text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors shadow-xs shrink-0 min-h-[44px]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {actionLoading === `approve-${squad.latest_run.id}`
                            ? "Aprovando..."
                            : "Aprovar em 1 Clique"}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {squad.latest_run?.completed_at
                            ? `Última entrega: ${new Date(squad.latest_run.completed_at).toLocaleDateString("pt-BR")}`
                            : "Nenhuma entrega pendente"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleTriggerRun(squad.id)}
                        disabled={actionLoading === `trigger-${squad.id}`}
                        className="h-11 px-4 inline-flex items-center gap-2 rounded-xl text-xs font-medium bg-foreground text-background hover:opacity-90 transition-opacity min-h-[44px]"
                      >
                        <Play
                          className={`w-3.5 h-3.5 ${
                            actionLoading === `trigger-${squad.id}` ? "animate-spin" : ""
                          }`}
                        />
                        {actionLoading === `trigger-${squad.id}`
                          ? "Executando..."
                          : "Executar Rotina Agora"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GAVETA / SHEET DO CURRÍCULO DO ESPECIALISTA (APPLE HIG) ── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex sm:justify-end" onClick={() => setSelectedAgent(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-lg bg-background sm:bg-card border-t sm:border-t-0 sm:border-l border-border/60 h-[100dvh] p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-6">
              {/* Topo da Gaveta */}
              <div className="flex items-start justify-between border-b border-border/30 pb-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-primary block">
                    Perfil do Especialista
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5">
                    {selectedAgent.name}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {selectedAgent.role_label} • {selectedAgent.seniority}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedAgent(null)}
                  className="size-11 rounded-xl border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors min-h-[44px] min-w-[44px]" aria-label="Fechar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Resumo Profissional */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Resumo de Carreira & Expertise
                </h4>
                <p className="text-xs text-foreground leading-relaxed p-3.5 rounded-xl bg-muted/20 border border-border/30">
                  {selectedAgent.career_summary}
                </p>
              </div>

              {/* Formação Acadêmica & PhD */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Formação Acadêmica
                </h4>
                <ul className="space-y-1.5 text-xs text-foreground">
                  {selectedAgent.curriculum.academic_background.map((item, idx) => (
                    <li
                      key={idx}
                      className="p-2.5 rounded-lg bg-card border border-border/40 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Certificações Globais */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-primary" />
                  Certificações Executivas
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedAgent.curriculum.certifications.map((cert, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              {/* Entregáveis Canônicos */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-primary" />
                  Entregáveis Produzidos por Este Agente
                </h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  {selectedAgent.deliverables.map((deliv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-primary font-bold">•</span>
                      <span>{deliv}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Metadados Técnicos de IA */}
              <div className="p-3.5 rounded-xl bg-muted/10 border border-border/30 text-[11px] text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Modelo de IA Alocado:</span>
                  <strong className="text-foreground font-mono">{selectedAgent.default_model}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modo Operacional:</span>
                  <strong className="text-foreground">Human-in-the-Loop Supervisionado</strong>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <button
                type="button"
                onClick={() => setSelectedAgent(null)}
                className="w-full h-11 rounded-xl text-sm font-medium border border-border/60 bg-background hover:bg-muted/40 transition-colors"
              >
                Fechar Currículo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
