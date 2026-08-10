import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, MousePointerClick, Percent, BarChart3, ArrowLeft, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { getBuilderAnalyticsSummary } from "@/services/telemetry.functions";

export const Route = createFileRoute("/admin/builder/analytics")({
  head: () => ({ meta: [{ title: "Métricas do Builder" }] }),
  loader: async () => {
    const res = await getBuilderAnalyticsSummary();
    return {
      summary: res.data || { totalViews: 0, totalClicks: 0, blockStats: [] },
    };
  },
  component: BuilderAnalyticsPage,
});

function BuilderAnalyticsPage() {
  const { summary } = Route.useLoaderData();
  const { totalViews, totalClicks, blockStats = [] } = summary;

  const averageCtr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(2) : "0.00";

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/builder" search={{} as any}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Builder
          </Link>
        </Button>
      </div>

      <PageHeader
        eyebrow="Desempenho Comercial"
        title="Métricas do Builder Platform"
        description="Acompanhe o engajamento, visualizações e cliques das seções criadas no editor da Jah."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Surface
          variant="zine"
          padding="none"
          className="relative overflow-hidden border-border from-card to-card/60 shadow-xs"
        >
          <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Visualizações Totais
            </h3>
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Eye className="size-4" />
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalViews.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Impressões de blocos nos últimos 30 dias
            </p>
          </div>
        </Surface>

        <Surface
          variant="zine"
          padding="none"
          className="relative overflow-hidden border-border from-card to-card/60 shadow-xs"
        >
          <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cliques Totais
            </h3>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <MousePointerClick className="size-4" />
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {totalClicks.toLocaleString("pt-BR")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cliques em CTAs e links nos últimos 30 dias
            </p>
          </div>
        </Surface>

        <Surface
          variant="zine"
          padding="none"
          className="relative overflow-hidden border-border from-card to-card/60 shadow-xs"
        >
          <div className="flex flex-row items-center justify-between p-6 pb-2 space-y-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              CTR Médio Geral
            </h3>
            <div className="flex size-8 items-center justify-center rounded-full bg-warning/10 text-warning">
              <Percent className="size-4" />
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold tracking-tight text-foreground">{averageCtr}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Taxa de cliques em relação às visualizações
            </p>
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <Surface variant="default" padding="none" className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="size-5 text-primary" />
              Engajamento por Tipo de Bloco
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Comparativo de visualizações vs. cliques por bloco dinâmico nos últimos 30 dias.
            </p>
          </div>
          <div className="p-6 pt-0 h-[300px]">
            {blockStats.length === 0 ? (
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                Sem dados de eventos para exibir gráficos.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={blockStats} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="block_type" className="fill-muted-foreground text-xs" />
                  <YAxis className="fill-muted-foreground text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="views"
                    name="Visualizações"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="clicks"
                    name="Cliques"
                    fill="hsl(var(--chart-2, 210 100% 50%))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Surface>

        {/* Detailed Table Card */}
        <Surface variant="default" padding="none" className="lg:col-span-1">
          <div className="p-6">
            <h3 className="text-base font-semibold flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Ranking de CTR
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ordenado pelos tipos de blocos com mais exibições.
            </p>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Bloco</th>
                    <th className="px-4 py-3 font-semibold text-right">Views</th>
                    <th className="px-4 py-3 font-semibold text-right">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {blockStats.map(
                    (
                      stat: { block_type: string; views: number; clicks: number; ctr: number },
                      idx: number,
                    ) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                          {stat.block_type}
                        </td>
                        <td className="px-4 py-3.5 text-right font-medium text-muted-foreground">
                          {stat.views.toLocaleString("pt-BR")}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${stat.ctr > 5 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : stat.ctr > 2 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {stat.ctr}%
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                  {blockStats.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                        Nenhum bloco registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
