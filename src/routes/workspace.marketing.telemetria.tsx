import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Clock,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Percent,
  ShieldCheck,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSponsorMetricsDashboard,
  type SponsorMetricsDTO,
} from "@/services/telemetry.functions";

export const Route = createFileRoute("/workspace/marketing/telemetria")({
  head: () => ({ meta: [{ title: "Telemetria de Audiência & Patrocinadores | JAH Workspace" }] }),
  loader: async () => {
    const data = await getSponsorMetricsDashboard().catch(() => ({
      totalImpressions: 0,
      totalUniqueViews: 0,
      totalClicks: 0,
      avgCtr: 0,
      sponsorsMetrics: [],
    }));
    return data;
  },
  component: WorkspaceTelemetriaPage,
});

function WorkspaceTelemetriaPage() {
  const { totalImpressions, totalUniqueViews, totalClicks, avgCtr, sponsorsMetrics } =
    Route.useLoaderData();

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
              Telemetria & Analytics
            </span>
            <span className="text-xs text-muted-foreground font-mono">Dados Auditados Antifraude</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Métricas de Audiência & Anunciantes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitore o alcance real, tempo de tela e taxa de cliques gerada para os patrocinadores do seu portal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="rounded-2xl font-bold text-xs">
            <Link to="/workspace/marketing/patrocinadores">
              <Megaphone className="size-4 mr-1.5" />
              <span>Gerenciar Patrocinadores</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 1. Cards de Métricas Gerais ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl border border-border/80 bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Impressões Totais</span>
            <Eye className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalImpressions}</p>
          <p className="text-[11px] text-muted-foreground">Exibições renderizadas em tela</p>
        </div>

        <div className="p-5 rounded-3xl border border-border/80 bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Leitores Únicos</span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalUniqueViews}</p>
          <p className="text-[11px] text-muted-foreground">Contas e sessões únicas validadas</p>
        </div>

        <div className="p-5 rounded-3xl border border-border/80 bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Cliques nos Anúncios</span>
            <MousePointerClick className="size-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{totalClicks}</p>
          <p className="text-[11px] text-muted-foreground">Interações diretas para o anunciante</p>
        </div>

        <div className="p-5 rounded-3xl border border-border/80 bg-card space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">CTR Médio</span>
            <Percent className="size-4 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-foreground">{avgCtr}%</p>
          <p className="text-[11px] text-muted-foreground">Taxa de conversão por impressão</p>
        </div>
      </div>

      {/* ── 2. Tabela de Desempenho por Patrocinador ── */}
      <div className="p-5 sm:p-6 rounded-3xl border border-border/80 bg-card space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">Desempenho por Anunciante</h3>
            <p className="text-xs text-muted-foreground">
              Relatório de entrega com tempo de visualização e alcance de rolagem de página.
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
            <ShieldCheck className="size-4 text-emerald-500" />
            <span>Anti-duplicação ativo</span>
          </div>
        </div>

        {sponsorsMetrics.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground">
            Nenhum dado de telemetria registrado ainda. Cadastre patrocinadores e publique matérias para iniciar a mensuração.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Patrocinador
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Tier</th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Impressões
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Únicos
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Tempo Médio
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Scroll 50%
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">
                    Cliques
                  </th>
                  <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sponsorsMetrics.map((sp) => (
                  <tr key={sp.sponsor_id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-foreground">{sp.sponsor_name}</td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-primary/10 text-primary">
                        {sp.tier}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono">{sp.total_impressions}</td>
                    <td className="py-3.5 px-3 font-mono">{sp.unique_views}</td>
                    <td className="py-3.5 px-3 font-mono text-muted-foreground">
                      {sp.avg_duration_seconds}s
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted-foreground">
                      {sp.scroll_reach_50}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-foreground">
                      {sp.total_clicks}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-primary">
                      {sp.ctr_percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
