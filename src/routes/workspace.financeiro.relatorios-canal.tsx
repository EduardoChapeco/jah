import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingDown,
  TrendingUp,
  Download,
  BarChart3,
  ShoppingCart,
  Package,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChannelDRE, exportChannelDRECsv } from "@/services/channel-reports.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/workspace/financeiro/relatorios-canal")({
  head: () => ({
    meta: [{ title: "DRE por Canal | Workspace Wider OS" }],
  }),
  loader: async () => {
    try {
      const dre = await getChannelDRE();
      return { initialDre: dre };
    } catch {
      return { initialDre: [] };
    }
  },
  component: ChannelDREPage,
});

const CHANNEL_COLORS: Record<string, string> = {
  mercadolivre: "bg-amber-400/15 text-amber-700 border-amber-400/30",
  amazon: "bg-orange-400/15 text-orange-700 border-orange-400/30",
  magalu: "bg-blue-400/15 text-blue-700 border-blue-400/30",
  shopee: "bg-orange-500/15 text-orange-800 border-orange-500/30",
  ifood: "bg-red-400/15 text-red-700 border-red-400/30",
  rappi: "bg-emerald-400/15 text-emerald-700 border-emerald-400/30",
  amodelivery: "bg-purple-400/15 text-purple-700 border-purple-400/30",
  correios: "bg-yellow-400/15 text-yellow-700 border-yellow-400/30",
  balcao_pos: "bg-slate-400/15 text-slate-700 border-slate-400/30",
  vitrine_online: "bg-sky-400/15 text-sky-700 border-sky-400/30",
  outros: "bg-zinc-400/15 text-zinc-600 border-zinc-400/30",
};

function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function MarginBadge({ value }: { value: number }) {
  const isGood = value >= 70;
  const isWarn = value >= 50 && value < 70;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-semibold",
        isGood ? "text-emerald-600" : isWarn ? "text-amber-600" : "text-red-600"
      )}
    >
      {isGood ? (
        <TrendingUp className="w-3.5 h-3.5" />
      ) : (
        <TrendingDown className="w-3.5 h-3.5" />
      )}
      {value.toFixed(1)}%
    </span>
  );
}

function ChannelDREPage() {
  const { initialDre } = Route.useLoaderData();
  const [period, setPeriod] = useState<string>("30d");
  const [exporting, setExporting] = useState(false);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    if (period === "7d") start.setDate(end.getDate() - 7);
    else if (period === "30d") start.setDate(end.getDate() - 30);
    else if (period === "90d") start.setDate(end.getDate() - 90);
    else if (period === "1y") start.setFullYear(end.getFullYear() - 1);
    return {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
    };
  };

  const { data: dreRows = initialDre, isLoading } = useQuery({
    queryKey: ["channel-dre", period],
    queryFn: () => getChannelDRE({ data: getDateRange() }),
    initialData: initialDre,
    staleTime: 1000 * 60 * 5,
  });

  const totalGross = dreRows.reduce((s, r) => s + r.gross_revenue_cents, 0);
  const totalNet = dreRows.reduce((s, r) => s + r.net_revenue_cents, 0);
  const totalFees = dreRows.reduce((s, r) => s + r.platform_fees_cents, 0);
  const totalOrders = dreRows.reduce((s, r) => s + r.order_count, 0);

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportChannelDRECsv({ data: getDateRange() });
      const blob = new Blob(["\uFEFF" + result.csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = result.filename;
      link.click();
    } catch {
      toast.error("Falha ao exportar relatório.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            DRE por Canal
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Receita, taxas e margem consolidados por plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-36 text-sm">
              <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
            className="h-9"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {exporting ? "Exportando..." : "CSV"}
          </Button>
        </div>
      </div>

      {/* KPIs resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Pedidos", value: totalOrders.toString(), icon: ShoppingCart },
          { label: "Receita Bruta", value: formatBRL(totalGross), icon: BarChart3 },
          { label: "Taxas Plataformas", value: formatBRL(totalFees), icon: TrendingDown },
          { label: "Receita Líquida", value: formatBRL(totalNet), icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-card border border-border/80 rounded-xl px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            <p className="text-lg font-semibold tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabela de DRE */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          Carregando dados...
        </div>
      ) : dreRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <Package className="w-8 h-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Nenhuma transação encontrada no período.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Conecte um marketplace em{" "}
            <Link to="/workspace/integracoes/marketplaces" className="underline">
              Integrações
            </Link>{" "}
            para ver dados aqui.
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="text-left font-medium text-muted-foreground px-4 py-3">
                    Canal
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    Pedidos
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    Bruto
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    Taxas
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    Frete
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    Líquido
                  </th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-3">
                    Margem
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {dreRows.map((row) => (
                  <tr
                    key={row.channel}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs font-medium rounded-lg px-2.5 py-0.5",
                          CHANNEL_COLORS[row.channel] || CHANNEL_COLORS.outros
                        )}
                      >
                        {row.channel_label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {row.order_count}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium">
                      {formatBRL(row.gross_revenue_cents)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-red-600/80">
                      {row.platform_fees_cents > 0
                        ? `− ${formatBRL(row.platform_fees_cents)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {row.shipping_costs_cents > 0
                        ? formatBRL(row.shipping_costs_cents)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">
                      {formatBRL(row.net_revenue_cents)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MarginBadge value={row.gross_margin_percent} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground/60">
        Dados de pedidos externos e vitrine própria. Taxas baseadas em{" "}
        <code className="font-mono">marketplace_fee_cents</code> reportadas pelos webhooks das plataformas.
      </p>
    </div>
  );
}
