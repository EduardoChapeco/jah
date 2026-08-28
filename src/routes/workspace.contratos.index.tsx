import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, FileSignature, CheckCircle, XCircle } from "lucide-react";

import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listContracts } from "@/services/contracts.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/contratos/")({
  head: () => ({ meta: [{ title: "Meus Contratos" }] }),
  loader: async () => {
    const contracts = await listContracts().catch(() => []);
    return { contracts };
  },
  component: ContractsDashboard,
});

function ContractsDashboard() {
  const { contracts: initialContracts } = Route.useLoaderData();

  const { data: contracts } = useQuery({
    queryKey: ["contracts-list"],
    queryFn: () => listContracts(),
    initialData: initialContracts,
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Contratos e Assinaturas"
        actions={
          <Button asChild size="sm" className="font-bold rounded-xl">
            <Link to="/workspace/contratos/novo" className="flex items-center gap-2">
              <Plus className="size-4" />
              Novo Contrato
            </Link>
          </Button>
        }
      />
      <p className="text-muted-foreground text-sm max-w-2xl">
        Gerencie acordos formais, aditivos e termos de prestação de serviços. 
        Gere evidências criptográficas imutáveis na blockchain interna.
      </p>

      {contracts.length === 0 ? (
        <div className="py-20 text-center space-y-4 bg-muted/10 rounded-3xl p-8 border border-dashed">
          <FileSignature size={48} className="text-muted-foreground/30 mx-auto" />
          <h2 className="text-sm font-bold text-foreground">Nenhum contrato criado ainda</h2>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Comece criando o seu primeiro documento legal ou utilize um template inteligente.
          </p>
          <Button asChild size="sm" variant="outline" className="rounded-xl mt-4">
            <Link to="/workspace/contratos/novo">Criar Contrato</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract: any) => {
            const isSigned = contract.status === "signed";
            const isSigning = contract.status === "signing";
            
            return (
              <Link
                key={contract.id}
                to="/workspace/contratos/$id/editor"
                params={{ id: contract.id }}
                className="block p-5 bg-card hover:border-foreground/30 border border-transparent rounded-2xl transition-all space-y-4 group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText size={20} />
                  </div>
                  {isSigned ? (
                    <Badge variant="default" className="bg-emerald-600 text-[10px]">
                      <CheckCircle size={10} className="mr-1" /> Assinado
                    </Badge>
                  ) : isSigning ? (
                    <Badge variant="secondary" className="text-primary text-[10px]">
                      Aguardando Assinatura
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      Rascunho
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {contract.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(contract.created_at).toLocaleDateString()}
                  </p>
                </div>

                {contract.deal && (
                  <div className="pt-3 border-t text-xs font-mono text-muted-foreground flex justify-between">
                    <span>Deal Vinculado</span>
                    <span className="font-bold text-foreground">
                      {formatMoney(contract.deal.proposed_price_cents || 0)}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
