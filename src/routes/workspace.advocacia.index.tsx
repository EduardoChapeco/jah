/**
 * workspace.advocacia.index.tsx — Workspace do Advogado & Escritório Jurídico (Módulo JUS)
 * Mural de Oportunidades, Envio de Propostas de Honorários e Gestão de Prazos Fatais.
 */

import { createFileRoute } from "@tanstack/react-router";
import { useState, useTransition } from "react";
import { 
  Scales, 
  PaperPlaneTilt, 
  Clock, 
  MapPin, 
  CurrencyDollar, 
  CheckCircle, 
  Users, 
  ShieldCheck,
  Funnel,
  Briefcase
} from "@phosphor-icons/react";
import { listMarketplaceDemands, sendJusProposal } from "@/services/jus.functions";
import { toast } from "sonner";

import { PageHeader } from "@/components/commerce/page-header";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/workspace/advocacia/")({
  head: () => ({ meta: [{ title: "Painel Jurídico & Demandas | Workspace Wider" }] }),
  loader: async () => {
    try {
      const demands = await listMarketplaceDemands().catch(() => []);
      return { demands };
    } catch {
      return { demands: [] };
    }
  },
  component: WorkspaceAdvocaciaPage,
});

function WorkspaceAdvocaciaPage() {
  const { demands } = Route.useLoaderData();
  const [selectedArea, setSelectedArea] = useState("all");
  const [selectedDemand, setSelectedDemand] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form de Proposta
  const [feeType, setFeeType] = useState<"fixed" | "success_percentage" | "hybrid">("fixed");
  const [fixedValue, setFixedValue] = useState("");
  const [successPercent, setSuccessPercent] = useState("20");
  const [details, setDetails] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("30");

  const filteredDemands = demands.filter((d: any) => {
    if (selectedArea === "all") return true;
    return d.legal_area === selectedArea;
  });

  const handleSendProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDemand || !details) {
      toast.error("Preencha os detalhes da sua proposta de honorários.");
      return;
    }

    startTransition(async () => {
      try {
        await sendJusProposal({
          data: {
            demand_id: selectedDemand.id,
            fee_type: feeType,
            fixed_value_cents: fixedValue ? Math.round(parseFloat(fixedValue) * 100) : 0,
            success_percentage: successPercent ? parseFloat(successPercent) : 0,
            proposal_details: details,
            estimated_deadline_days: parseInt(deadlineDays) || 30,
          },
        });
        toast.success("Proposta de honorários enviada ao cliente com sucesso!");
        setSelectedDemand(null);
        setDetails("");
        setFixedValue("");
      } catch (err: any) {
        toast.error(err.message || "Erro ao enviar proposta");
      }
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Advocacia & Contratos"
        title="Demandas Jurídicas"
        actions={
          <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 gap-1.5 rounded-xl">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>OAB Verificada</span>
          </Badge>
        }
      />

      {/* Layout em 2 Colunas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Coluna Esquerda: Mural de Demandas */}
          <div className="space-y-4 lg:col-span-7">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
              <Funnel className="ml-1 h-4 w-4 text-muted-foreground" />
              {[
                { id: "all", label: "Todas as Áreas" },
                { id: "Trabalhista", label: "Trabalhista" },
                { id: "Cível", label: "Cível" },
                { id: "Família", label: "Família" },
                { id: "Consumidor", label: "Consumidor" },
                { id: "Previdenciário", label: "Previdenciário" },
                { id: "Tributário", label: "Tributário" },
              ].map((area) => (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area.id)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedArea === area.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-paper text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>

            {/* Lista de Cards */}
            <div className="space-y-3">
              {filteredDemands.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center">
                  <Briefcase className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold text-foreground">Nenhuma demanda nesta área</p>
                  <p className="mt-1 text-xs text-muted-foreground">Novas solicitações de clientes aparecerão aqui em tempo real.</p>
                </div>
              ) : (
                filteredDemands.map((demand: any) => {
                  const isSelected = selectedDemand?.id === demand.id;
                  return (
                    <div
                      key={demand.id}
                      onClick={() => setSelectedDemand(demand)}
                      className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border bg-card hover:border-primary/40 hover:"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                              {demand.legal_area}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {demand.city}/{demand.state}
                            </span>
                          </div>
                          <h3 className="mt-2 text-base font-bold text-foreground">{demand.title}</h3>
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{demand.description}</p>
                        </div>

                        <span className={`rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${
                          demand.urgency === "urgent"
                            ? "bg-destructive/10 text-destructive"
                            : demand.urgency === "high"
                            ? "bg-amber-500/10 text-amber-500"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {demand.urgency}
                        </span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          Publicado {new Date(demand.created_at).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="font-semibold text-primary">
                          Clique para Enviar Proposta →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Coluna Direita: Painel de Proposta de Honorários */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-border bg-card p-6">
              {selectedDemand ? (
                <div>
                  <div className="mb-4 border-b border-border pb-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Proposta de Honorários para:
                    </span>
                    <h2 className="mt-1 text-lg font-bold text-foreground">{selectedDemand.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">{selectedDemand.description}</p>
                  </div>

                  <form onSubmit={handleSendProposal} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-foreground">Modalidade de Honorários</label>
                      <div className="mt-1.5 grid grid-cols-3 gap-2">
                        {[
                          { id: "fixed", label: "Fixo" },
                          { id: "success_percentage", label: "Êxito (%)" },
                          { id: "hybrid", label: "Misto" },
                        ].map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFeeType(m.id as any)}
                            className={`rounded-xl py-2 text-xs font-semibold transition-all ${
                              feeType === m.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-surface-paper text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(feeType === "fixed" || feeType === "hybrid") && (
                      <div>
                        <label className="text-xs font-bold text-foreground">Valor Fixo Inicial (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 1500.00"
                          value={fixedValue}
                          onChange={(e) => setFixedValue(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          required={feeType === "fixed"}
                        />
                      </div>
                    )}

                    {(feeType === "success_percentage" || feeType === "hybrid") && (
                      <div>
                        <label className="text-xs font-bold text-foreground">Percentual de Êxito (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          placeholder="Ex: 20"
                          value={successPercent}
                          onChange={(e) => setSuccessPercent(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          required={feeType === "success_percentage"}
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-foreground">Plano de Ação Jurídica & Detalhes</label>
                      <textarea
                        rows={3}
                        placeholder="Descreva a estratégia processual, providências iniciais e suporte que seu escritório oferecerá..."
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        className="mt-1.5 w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                        required
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDemand(null)}
                        className="w-1/3 rounded-xl border border-border bg-background py-2.5 text-xs font-semibold text-foreground hover:bg-accent"
                      >
                        Fechar
                      </button>
                      <button
                        type="submit"
                        disabled={isPending}
                        className="inline-flex w-2/3 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        <PaperPlaneTilt className="h-4 w-4" />
                        {isPending ? "Enviando..." : "Enviar Proposta"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Scales className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h3 className="mt-3 text-sm font-bold text-foreground">Selecione uma Demanda</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Clique em um card ao lado para visualizar os fatos e formular sua proposta de honorários.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
