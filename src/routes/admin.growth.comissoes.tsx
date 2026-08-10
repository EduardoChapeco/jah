import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Percent, Plus, Users, Package, Clock, ShieldCheck, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PageHeader } from "@/components/commerce/page-header";
import { listCommissionRules } from "@/services/growth.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { EmptyState } from "@/components/state/states";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/admin/growth/comissoes")({
  head: () => ({ meta: [{ title: "Regras de Comissão (Split)" }] }),
  component: AdminCommissionsPage,
});

function AdminCommissionsPage() {
  const { data: rules, isLoading } = useQuery({
    queryKey: ["admin-growth-commission-rules"],
    queryFn: () => listCommissionRules(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Faturamento & Split"
        title="Regras Dinâmicas de Comissão"
        description="Configure repasses específicos por afiliado, funcionário, produto ou categoria."
        actions={
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]">
            <Plus className="mr-2 size-4" />
            Nova Regra
          </Button>
        }
      />

      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground font-mono uppercase">Carregando regras de split...</p>
        </div>
      ) : !rules || rules.length === 0 ? (
        <EmptyState
          icon={<Percent className="size-10 text-muted-foreground" />}
          title="Nenhuma Regra Específica"
          description="Atualmente todos os vendedores usam a comissão padrão definida em seus perfis."
          action={
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider rounded-none border-2 border-black shadow-[4px_4px_0_0_#000]">
              Criar Regra de Exceção
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rules.map((rule: any) => (
            <Surface key={rule.id} variant="op" padding="md" className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-border group">
              {/* Left Side: Rule Definition */}
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-xl border border-emerald-200 shrink-0 flex flex-col items-center justify-center min-w-[80px]">
                  <span className="text-sm font-bold text-emerald-800 uppercase leading-none mb-1">Repasse</span>
                  <span className="text-2xl font-black text-emerald-600 leading-none">{rule.rate_percentage}%</span>
                </div>
                
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={rule.status === "active" ? "default" : "secondary"}>
                      {rule.status === "active" ? "Ativa" : "Inativa"}
                    </Badge>
                    {rule.valid_until && new Date(rule.valid_until) < new Date() && (
                      <Badge variant="destructive">Expirada</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-lg leading-tight flex items-center gap-2">
                    {rule.seller ? (
                      <span className="flex items-center gap-1"><Users className="size-4 text-blue-600" /> {rule.seller.name}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Users className="size-4 text-muted-foreground" /> Todos os Vendedores</span>
                    )}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                    {rule.product ? (
                      <span className="flex items-center gap-1 font-medium"><Package className="size-4 text-rose-500" /> Somente em: {rule.product.title}</span>
                    ) : (
                      <span className="flex items-center gap-1"><Package className="size-4" /> Em todo o catálogo</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right Side: Constraints & Actions */}
              <div className="flex flex-col md:items-end w-full md:w-auto gap-3">
                <div className="text-sm flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-md border border-border/50">
                  <Clock className="size-4 text-amber-600" />
                  {rule.valid_until ? (
                    <span className="font-mono text-xs">Válido até {format(new Date(rule.valid_until), "dd/MM/yy")}</span>
                  ) : (
                    <span className="font-mono text-xs text-muted-foreground">Sem validade (Vitalício)</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Editar Regra</Button>
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
