import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link2, Save, Share2, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAffiliateLink, getMyCommissionProfile } from "@/services/affiliates.functions";
import { toast } from "sonner";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/configuracoes/parceiros")({
  head: () => ({ meta: [{ title: "Configurações de Parceiros — JAH Workspace" }] }),
  loader: async () => {
    const profile = await getMyCommissionProfile();
    return { initialProfile: profile };
  },
  component: ConfigParceirosPage,
});

function ConfigParceirosPage() {
  const { initialProfile } = Route.useLoaderData();
  const [baseUrl] = useState(() => window.location.origin);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-commission-profile"],
    queryFn: () => getMyCommissionProfile(),
    initialData: initialProfile,
    staleTime: 60_000,
  });

  const generateLink = useMutation({
    mutationFn: () => getAffiliateLink({ data: { baseUrl } }),
    onSuccess: async (data) => {
      await navigator.clipboard.writeText(data.link);
      toast.success("Link de indicação copiado para a área de transferência!");
    },
    onError: (e: any) => {
      toast.error(e?.message ?? "Erro ao gerar link de afiliação");
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Meu Perfil de Parceiro</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie seu link de divulgação e acompanhe seus ganhos diretos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-surface-paper shadow-sm border border-border rounded-xl p-5 flex flex-col items-start gap-4">
          <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Link2 className="size-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Link de Indicação</h2>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Compartilhe este link com seus clientes. Todas as compras realizadas através dele
              gerarão comissões automáticas para sua conta.
            </p>
            <div className="flex gap-2">
              <Button
                variant="default"
                onClick={() => generateLink.mutate()}
                disabled={generateLink.isPending}
              >
                {generateLink.isPending ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <Share2 className="size-4 mr-2" />
                )}
                Copiar Link Mágico
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-surface-paper shadow-sm border border-border rounded-xl p-5 flex flex-col items-start gap-4">
          <div className="size-10 rounded-full bg-success/10 flex items-center justify-center">
            <Users className="size-5 text-success" />
          </div>
          <div className="w-full">
            <h2 className="font-semibold text-foreground">Minhas Comissões</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa Base:</span>
                <span className="font-medium">{profile?.commissionRate}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pendente:</span>
                <span className="font-medium text-warning">
                  {formatMoney(profile?.pendingCents ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-foreground font-semibold">Total Recebido:</span>
                <span className="font-bold text-success">
                  {formatMoney(profile?.paidCents ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
