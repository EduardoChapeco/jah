import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Megaphone,
  Plus,
  TrendingUp,
  Eye,
  MousePointerClick,
  DollarSign,
  Play,
  Pause,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";
import { listAdCampaigns, toggleAdCampaignStatus, type AdCampaign } from "@/services/ads.functions";

export const Route = createFileRoute("/workspace/marketing/anuncios")({
  head: () => ({ meta: [{ title: "Campanhas de Anúncios | Workspace Wider" }] }),
  loader: async () => {
    const campaigns = await listAdCampaigns().catch(() => []);
    return { campaigns };
  },
  component: AnunciosWorkspacePage,
});

const FORMAT_LABELS: Record<string, string> = {
  post_patrocinado: "Post Patrocinado",
  banner_destaque: "Banner de Destaque",
  story_patrocinado: "Story Patrocinado",
  busca_topo: "Destaque na Busca",
};

function AnunciosWorkspacePage() {
  const { campaigns: initialCampaigns } = Route.useLoaderData();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(initialCampaigns);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const totalImpressions = campaigns.reduce((acc, c) => acc + (c.impressions_count || 0), 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + (c.clicks_count || 0), 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.spent_cents || 0), 0);
  const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0.0";

  const handleToggle = async (c: AdCampaign) => {
    const newStatus = c.status === "active" ? "paused" : "active";
    setUpdatingId(c.id);
    try {
      await toggleAdCampaignStatus({ data: { campaignId: c.id, status: newStatus } });
      setCampaigns((prev) =>
        prev.map((item) => (item.id === c.id ? { ...item, status: newStatus } : item)),
      );
      toast.success(newStatus === "active" ? "Campanha ativada!" : "Campanha pausada.");
    } catch {
      toast.error("Erro ao alterar status da campanha.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── PageHeader Canônico ── */}
      <PageHeader
        eyebrow="Marketing"
        title="Anúncios"
        actions={
          <Button asChild size="sm" className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground h-9 px-4">
            <Link to="/workspace/marketing/anuncios/novo">
              <Plus className="size-3.5" />
              <span>Novo Anúncio</span>
            </Link>
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="squircle-soft bg-card  p-4 space-y-1 ">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Impressões</span>
            <Eye className="size-4 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {totalImpressions.toLocaleString()}
          </p>
        </div>

        <div className="squircle-soft bg-card  p-4 space-y-1 ">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cliques Totais</span>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">
            {totalClicks.toLocaleString()}
          </p>
        </div>

        <div className="squircle-soft bg-card  p-4 space-y-1 ">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">CTR Médio</span>
            <Sparkles className="size-4 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{avgCtr}%</p>
        </div>

        <div className="squircle-soft bg-card  p-4 space-y-1 ">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Investimento</span>
            <DollarSign className="size-4 text-primary" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-foreground">{formatMoney(totalSpent)}</p>
        </div>
      </div>

      {/* Campaign List */}
      <div className="rounded-2xl  bg-card overflow-hidden ">
        <div className="p-4  bg-muted/20 flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Suas Campanhas</h2>
          <Badge variant="secondary" className="text-[10px] rounded-full">
            {campaigns.length} {campaigns.length === 1 ? "campanha" : "campanhas"}
          </Badge>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Megaphone className="size-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">Nenhuma campanha ativa</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Crie seu primeiro anúncio para alcançar milhares de pessoas no feed da comunidade e
              nos resultados de busca.
            </p>
            <Button asChild size="sm" className="rounded-xl mt-2">
              <Link to="/workspace/marketing/anuncios/novo">
                <Plus className="size-4 mr-1.5" />
                Criar Primeiro Anúncio
              </Link>
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {campaigns.map((c) => (
              <div
                key={c.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={c.status === "active" ? "default" : "secondary"}
                      className="text-[10px] rounded-full uppercase font-bold"
                    >
                      {c.status === "active" ? "Veiculando" : "Pausada"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] rounded-full">
                      {FORMAT_LABELS[c.format] || c.format}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="size-3 text-primary" />
                      {c.target_location} ({c.target_radius_km} km)
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-foreground truncate">{c.title}</h3>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span>
                      Diário:{" "}
                      <strong className="text-foreground">
                        {formatMoney(c.daily_budget_cents)}
                      </strong>
                    </span>
                    <span>
                      Gasto:{" "}
                      <strong className="text-foreground">{formatMoney(c.spent_cents)}</strong>
                    </span>
                    <span>
                      Cliques: <strong className="text-foreground">{c.clicks_count}</strong>
                    </span>
                    <span>
                      Impressões:{" "}
                      <strong className="text-primary font-bold">{c.impressions_count}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle(c)}
                    disabled={updatingId === c.id}
                    className="rounded-xl text-xs font-semibold gap-1.5 h-9"
                  >
                    {c.status === "active" ? (
                      <>
                        <Pause className="size-3.5" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5 text-primary" />
                        Retomar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
