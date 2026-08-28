/**
 * _store.conta.processos.tsx — Meus Processos & Demandas Jurídicas (Módulo JUS)
 * Consulta de processos unificados por CPF e acompanhamento de demandas com advogados.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { 
  Scales, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  WarningCircle, 
  MagnifyingGlass, 
  Buildings,
  ShieldCheck,
  ArrowSquareOut
} from "@phosphor-icons/react";
import { listMyLawsuits, createJusDemand } from "@/services/jus.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_store/conta/processos")({
  loader: async () => {
    try {
      const lawsuits = await listMyLawsuits().catch(() => []);
      return { lawsuits };
    } catch {
      return { lawsuits: [] };
    }
  },
  component: MyLawsuitsPage,
});

function MyLawsuitsPage() {
  const { lawsuits } = Route.useLoaderData();
  const [activeTab, setActiveTab] = useState<"lawsuits" | "new_demand">("lawsuits");
  const [isPending, startTransition] = useTransition();

  // Form State para Nova Demanda
  const [title, setTitle] = useState("");
  const [legalArea, setLegalArea] = useState("Trabalhista");
  const [description, setDescription] = useState("");
  const [urgency, setUrgency] = useState<"low" | "normal" | "high" | "urgent">("normal");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      toast.error("Preencha o título e a descrição do seu caso");
      return;
    }

    startTransition(async () => {
      try {
        await createJusDemand({
          data: {
            title,
            legal_area: legalArea,
            description,
            urgency,
            is_anonymous: isAnonymous,
            city: "Chapecó",
            state: "SC",
            documents: [],
          },
        });
        toast.success("Demanda jurídica publicada com sucesso! Advogados da região poderão enviar propostas.");
        setTitle("");
        setDescription("");
        setActiveTab("lawsuits");
      } catch (err: any) {
        toast.error(err.message || "Erro ao publicar demanda");
      }
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-6">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header com Navegação */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Link to="/conta" className="hover:text-foreground">Minha Conta</Link>
              <span>/</span>
              <span className="text-primary">Módulo Jus</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Processos & Assistência Jurídica
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe suas intimações, processos vinculados ao seu CPF e solicite suporte de advogados verificados.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("lawsuits")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "lawsuits"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scales className="h-4 w-4" />
              Meus Processos ({lawsuits.length})
            </button>
            <button
              onClick={() => setActiveTab("new_demand")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                activeTab === "new_demand"
                  ? "bg-primary text-primary-foreground"
                  : "bg-surface-paper text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-4 w-4" />
              Solicitar Advogado
            </button>
          </div>
        </div>

        {/* Tab 1: Lista de Processos Sincronizados */}
        {activeTab === "lawsuits" && (
          <div className="space-y-4">
            {lawsuits.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Scales className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-base font-bold text-foreground">Nenhum processo em andamento</h3>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Seus processos judiciais vinculados ao CPF aparecerão aqui automaticamente com notificações de prazos e movimentações.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setActiveTab("new_demand")}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Publicar Demanda para Advogados
                  </button>
                  <Link
                    to="/diretorio"
                    search={{ categoria: "advocacia" }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                  >
                    <MagnifyingGlass className="h-4 w-4" />
                    Buscar Escritórios na Cidade
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {lawsuits.map((lawsuit: any) => (
                  <div
                    key={lawsuit.id}
                    className="rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
                            {lawsuit.court_code || "TJSC"}
                          </span>
                          <span className="font-mono text-sm font-bold text-foreground">
                            {lawsuit.process_number}
                          </span>
                        </div>
                        <h3 className="mt-2 text-base font-semibold text-foreground">
                          {lawsuit.class_name || lawsuit.subject_name || "Ação Judicial Cível"}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Última movimentação: {lawsuit.last_movement_text || "Aguardando manifestação judicial"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-500">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Ativo
                        </span>
                      </div>
                    </div>

                    {lawsuit.movements && lawsuit.movements.length > 0 && (
                      <div className="mt-4 border-t border-border/60 pt-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Histórico de Andamentos
                        </h4>
                        <div className="mt-2 space-y-2">
                          {lawsuit.movements.slice(0, 3).map((mov: any) => (
                            <div key={mov.id} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                              <div>
                                <span className="font-medium text-foreground">
                                  {new Date(mov.movement_date).toLocaleDateString("pt-BR")}:
                                </span>{" "}
                                {mov.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Formulário de Nova Demanda Jurídica */}
        {activeTab === "new_demand" && (
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Scales className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Solicitar Assessoria Jurídica</h2>
                <p className="text-xs text-muted-foreground">
                  Seu caso será apresentado para advogados com OAB verificada em Chapecó e região.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateDemand} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-foreground">Título Resumido da Demanda</label>
                <input
                  type="text"
                  placeholder="Ex: Ação de cobrança indevida, divórcio consensual, revisão de contrato..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Área do Direito</label>
                  <select
                    value={legalArea}
                    onChange={(e) => setLegalArea(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Trabalhista">Direito Trabalhista</option>
                    <option value="Cível">Direito Cível & Contratos</option>
                    <option value="Família">Direito de Família & Sucessões</option>
                    <option value="Consumidor">Direito do Consumidor</option>
                    <option value="Previdenciário">Direito Previdenciário (INSS)</option>
                    <option value="Tributário">Direito Tributário & Fiscal</option>
                    <option value="Empresarial">Direito Empresarial & B2B</option>
                    <option value="Imobiliário">Direito Imobiliário</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Nível de Urgência</label>
                  <select
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value as any)}
                    className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="normal">Normal (Até 5 dias úteis)</option>
                    <option value="high">Alta (Até 48 horas)</option>
                    <option value="urgent">Urgente (Prazo fatal / Liminar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Relato dos Fatos</label>
                <textarea
                  rows={4}
                  placeholder="Explique o que aconteceu, datas relevantes, valores envolvidos e o que você busca solucionar..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-input bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                />
                <label htmlFor="anonymous" className="text-xs text-muted-foreground cursor-pointer">
                  Publicar em modo anônimo (seus dados de contato só serão revelados ao aceitar uma proposta).
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("lawsuits")}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:bg-accent"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {isPending ? "Publicando..." : "Publicar Demanda"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
