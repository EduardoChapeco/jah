import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Megaphone, Plus, ExternalLink, Activity, ArrowUpRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/commerce/page-header";
import { listCampaigns } from "@/services/growth.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/growth/campanhas")({
  head: () => ({ meta: [{ title: "Campanhas e Ads" }] }),
  component: AdminCampaignsPage,
});

function AdminCampaignsPage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["admin-growth-campaigns"],
    queryFn: () => listCampaigns(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Ativa</Badge>;
      case "paused": return <Badge variant="secondary">Pausada</Badge>;
      case "completed": return <Badge variant="outline" className="border-emerald-500 text-emerald-500">Concluída</Badge>;
      case "draft": return <Badge variant="outline">Rascunho</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Growth & Marketing"
        title="Campanhas de Ads"
        description="Impulsione seus produtos no Feed da Comunidade e aumente suas vendas."
        actions={
          <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-wider rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]">
            <Plus className="mr-2 size-4" />
            Nova Campanha
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-mono uppercase">Carregando métricas...</p>
        </div>
      ) : !campaigns || campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="size-10 text-muted-foreground" />}
          title="Nenhuma Campanha Ativa"
          description="Você ainda não criou nenhum anúncio para impulsionar seus produtos."
          action={
            <Button className="bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase tracking-wider rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]">
              Criar Primeira Campanha
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {campaigns.map((camp: any) => (
            <Surface key={camp.id} variant="op" padding="none" className="flex flex-col h-full overflow-hidden border-4 border-black">
              {/* Card Header */}
              <div className="p-4 bg-stone-900 text-white flex justify-between items-start border-b-4 border-black">
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-tighter text-rose-500 mb-1">{camp.title}</h3>
                  <div className="flex gap-2 text-xs font-mono opacity-80">
                    <span>Criada em {format(new Date(camp.start_date || camp.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                </div>
                {getStatusBadge(camp.status)}
              </div>

              {/* Metrics */}
              <div className="p-4 grid grid-cols-3 gap-4 bg-stone-100">
                <div className="flex flex-col items-center p-3 bg-white border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-xs font-bold uppercase text-stone-500 mb-1">Impressões</span>
                  <span className="text-xl font-black">{camp.metrics?.impressions || 0}</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-white border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-xs font-bold uppercase text-stone-500 mb-1">Cliques</span>
                  <span className="text-xl font-black text-blue-600 flex items-center gap-1">
                    {camp.metrics?.clicks || 0}
                    <ArrowUpRight className="size-3" />
                  </span>
                </div>
                <div className="flex flex-col items-center p-3 bg-rose-100 border-2 border-black shadow-[2px_2px_0_0_#000]">
                  <span className="text-xs font-bold uppercase text-rose-700 mb-1">Gasto</span>
                  <span className="text-lg font-black text-rose-700">{formatMoney(camp.metrics?.spend_cents || 0)}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 mt-auto border-t-2 border-black/10 bg-white flex justify-between items-center">
                <div className="text-sm font-semibold">
                  Orçamento: <span className="font-black">{formatMoney(camp.budget_cents)}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-2 border-black font-bold uppercase text-xs">
                    Pausar
                  </Button>
                  <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white border-2 border-black font-bold uppercase text-xs">
                    <Activity className="size-3 mr-1" /> Editar
                  </Button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
