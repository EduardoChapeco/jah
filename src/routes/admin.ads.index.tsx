import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { getStoreAdCampaigns, createAdCampaign } from "@/services/ads.functions";
import { listAdminProducts } from "@/services/admin-catalog.functions";
import { formatMoney } from "@/lib/money";
import { TrendingUp, Megaphone, Plus, Rocket, Eye, MousePointerClick } from "lucide-react";
import { Surface } from "@/components/ui/surface";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/ads/")({
  head: () => ({ meta: [{ title: "Impulsionamento e Ads" }] }),
  loader: async () => {
    const [campaigns, productsRes] = await Promise.all([
      getStoreAdCampaigns(),
      listAdminProducts(),
    ]);
    return { campaigns, products: productsRes || [] };
  },
  component: AdsPanelPage,
});

function AdsPanelPage() {
  const { campaigns, products } = Route.useLoaderData();
  const router = useRouter();

  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    type: "dynamic_boost" as const,
    budgetCents: 5000,
  });

  const handleSave = async () => {
    if (!formData.productId) {
      toast.error("Selecione um produto/anúncio para impulsionar.");
      return;
    }
    if (formData.budgetCents < 1000) {
      toast.error("O orçamento mínimo é de R$ 10,00.");
      return;
    }

    setLoading(true);
    try {
      await createAdCampaign({
        data: {
          productId: formData.productId,
          type: formData.type,
          budgetCents: formData.budgetCents,
        },
      });
      toast.success("Campanha criada! A fatura foi gerada para pagamento.");
      setModalOpen(false);
      router.invalidate();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impulsionamento e Destaques"
        description="Aumente as vendas destacando seus anúncios no Feed Principal da Jah."
        actions={
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <Plus className="size-4" /> Criar Campanha
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Surface variant="default" className="flex items-center gap-4">
          <div className="p-3 bg-warning/20 text-warning rounded-full">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium">Visibilidade Extra</p>
            <p className="text-2xl font-black">+400%</p>
          </div>
        </Surface>
      </div>

      <Surface variant="default" padding="none">
        {campaigns.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <Megaphone className="size-12 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-bold">Nenhuma campanha ativa</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-6">
              Impulsione seus ingressos, produtos ou serviços para que eles apareçam no topo do feed
              dos clientes.
            </p>
            <Button onClick={() => setModalOpen(true)} variant="secondary">
              Criar Primeira Campanha
            </Button>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Campanha</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Orçamento</th>
                <th className="px-6 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((camp: any) => (
                <tr key={camp.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold">{camp.products?.title || "Anúncio Deletado"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <Rocket className="size-3" />
                      {camp.type === "dynamic_boost" ? "Feed Principal" : "Banner Fixo"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={camp.status === "active" ? "default" : "secondary"}>
                      {camp.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 font-semibold">
                    {formatMoney(camp.budget_cents)}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {new Date(camp.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Surface>

      <Sheet open={modalOpen} onOpenChange={setModalOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Criar Nova Campanha</SheetTitle>
            <SheetDescription>
              Aumente o alcance do seu anúncio. O valor será cobrado via Fatura da Plataforma.
            </SheetDescription>
          </SheetHeader>
          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Anúncio a Impulsionar</label>
              <Select
                value={formData.productId}
                onValueChange={(val) => setFormData({ ...formData, productId: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Orçamento Total (R$)</label>
              <Input
                type="number"
                min="10"
                step="5"
                value={formData.budgetCents / 100}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budgetCents: parseFloat(e.target.value || "0") * 100,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Mínimo R$ 10,00.</p>
            </div>
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Gerando Fatura..." : "Impulsionar e Pagar"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
