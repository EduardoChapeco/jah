import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShoppingBag,
  Store,
  Truck,
  Utensils,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Link2,
  Unlink,
  Sliders,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/commerce/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  listMarketplaceConnectors,
  saveMarketplaceConnector,
  disconnectMarketplaceConnector,
  triggerSyncConnector,
  getMarketplaceFinancialSummary,
  type MarketplaceConnectorDTO,
  type MarketplacePlatform,
} from "@/services/marketplace-hub.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/workspace/integracoes/marketplaces")({
  head: () => ({
    meta: [{ title: "Hub de Marketplaces & Canais | Workspace Wider OS" }],
  }),
  loader: async () => {
    try {
      const [connectors, financialSummary] = await Promise.all([
        listMarketplaceConnectors(),
        getMarketplaceFinancialSummary(),
      ]);
      return { initialConnectors: connectors, initialSummary: financialSummary };
    } catch (err) {
      console.error("[loader:workspace.integracoes.marketplaces] error:", err);
      return { initialConnectors: [], initialSummary: [] };
    }
  },
  component: MarketplaceHubPage,
});

interface PlatformMeta {
  platform: MarketplacePlatform;
  name: string;
  category: "ecommerce" | "food" | "logistics";
  icon: typeof ShoppingBag;
  color: string;
  docUrl: string;
  badgeLabel: string;
}

const PLATFORMS_CATALOG: PlatformMeta[] = [
  {
    platform: "mercadolivre",
    name: "Mercado Livre",
    category: "ecommerce",
    icon: ShoppingBag,
    color: "from-amber-400 to-yellow-500",
    docUrl: "https://developers.mercadolivre.com.br/",
    badgeLabel: "MLB Sync",
  },
  {
    platform: "ifood",
    name: "iFood",
    category: "food",
    icon: Utensils,
    color: "from-red-500 to-rose-600",
    docUrl: "https://developer.ifood.com.br/",
    badgeLabel: "OpenDelivery v1",
  },
  {
    platform: "shopee",
    name: "Shopee Brasil",
    category: "ecommerce",
    icon: Store,
    color: "from-orange-500 to-amber-600",
    docUrl: "https://open.shopee.com.br/",
    badgeLabel: "Shopee Open API",
  },
  {
    platform: "magalu",
    name: "Magazine Luiza",
    category: "ecommerce",
    icon: Store,
    color: "from-blue-500 to-indigo-600",
    docUrl: "https://developers.magazineluiza.com.br/",
    badgeLabel: "IntegraCommerce",
  },
  {
    platform: "amazon",
    name: "Amazon Brasil",
    category: "ecommerce",
    icon: Package,
    color: "from-amber-600 to-neutral-800",
    docUrl: "https://developer-docs.amazon.com/sp-api/",
    badgeLabel: "SP-API Brasil",
  },
  {
    platform: "melhorenvio",
    name: "Melhor Envio",
    category: "logistics",
    icon: Truck,
    color: "from-emerald-500 to-teal-600",
    docUrl: "https://docs.melhorenvio.com.br/",
    badgeLabel: "Cotação & Etiquetas",
  },
  {
    platform: "correios",
    name: "Correios",
    category: "logistics",
    icon: Truck,
    color: "from-yellow-600 to-blue-600",
    docUrl: "https://cws.correios.com.br/",
    badgeLabel: "CWS Contrato",
  },
  {
    platform: "rappi",
    name: "Rappi",
    category: "food",
    icon: Utensils,
    color: "from-orange-400 to-red-500",
    docUrl: "https://developer.rappi.com/",
    badgeLabel: "REST / Webhooks",
  },
  {
    platform: "amodelivery",
    name: "Amo Delivery",
    category: "food",
    icon: Utensils,
    color: "from-purple-500 to-violet-600",
    docUrl: "https://amodelivery.com.br/developers",
    badgeLabel: "REST / Webhooks",
  },
  {
    platform: "google_business",
    name: "Google Meu Negócio",
    category: "ecommerce",
    icon: Store,
    color: "from-sky-400 to-blue-500",
    docUrl: "https://developers.google.com/my-business/",
    badgeLabel: "Business Profile API",
  },
  {
    platform: "99food",
    name: "99Food",
    category: "food",
    icon: Utensils,
    color: "from-amber-500 to-yellow-600",
    docUrl: "https://food.99app.com/",
    badgeLabel: "OpenDelivery v1",
  },
  {
    platform: "amoofertas",
    name: "Amo Ofertas",
    category: "ecommerce",
    icon: ShoppingBag,
    color: "from-pink-500 to-rose-600",
    docUrl: "https://amoofertas.com.br/",
    badgeLabel: "Feed XML / REST",
  },
  {
    platform: "kangu",
    name: "Kangu (Mercado Livre)",
    category: "logistics",
    icon: Truck,
    color: "from-orange-500 to-amber-600",
    docUrl: "https://www.kangu.com.br/desenvolvedores",
    badgeLabel: "Pontos & Etiquetas",
  },
  {
    platform: "frenet",
    name: "Frenet",
    category: "logistics",
    icon: Truck,
    color: "from-indigo-500 to-blue-600",
    docUrl: "https://ajuda.frenet.com.br/s/article/api-calculo-de-frete",
    badgeLabel: "Gateway de Frete",
  },
  {
    platform: "loggi",
    name: "Loggi",
    category: "logistics",
    icon: Truck,
    color: "from-blue-600 to-sky-500",
    docUrl: "https://docs.loggi.com/",
    badgeLabel: "Coleta & Entrega",
  },
  {
    platform: "jadlog",
    name: "Jadlog",
    category: "logistics",
    icon: Truck,
    color: "from-red-600 to-rose-700",
    docUrl: "https://www.jadlog.com.br/jadlog/servicos",
    badgeLabel: "Cargas Expressas",
  },
];

function MarketplaceHubPage() {
  const { initialConnectors, initialSummary } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "ecommerce" | "food" | "logistics">("all");
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformMeta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [accountId, setAccountId] = useState("");
  const [accountNickname, setAccountNickname] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [autoAccept, setAutoAccept] = useState(false);
  const [syncStock, setSyncStock] = useState(true);

  const { data: connectors = initialConnectors, refetch: refetchConnectors } = useQuery({
    queryKey: ["marketplace-connectors"],
    queryFn: () => listMarketplaceConnectors(),
    initialData: initialConnectors,
  });

  const { data: summary = initialSummary } = useQuery({
    queryKey: ["marketplace-financial-summary"],
    queryFn: () => getMarketplaceFinancialSummary(),
    initialData: initialSummary,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: any) => saveMarketplaceConnector({ data: payload }),
    onSuccess: () => {
      toast.success("Canal conectado com sucesso!");
      setModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["marketplace-connectors"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar conexão.");
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (platform: MarketplacePlatform) =>
      disconnectMarketplaceConnector({ data: { platform } }),
    onSuccess: () => {
      toast.success("Integração desconectada.");
      queryClient.invalidateQueries({ queryKey: ["marketplace-connectors"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao desconectar.");
    },
  });

  const syncMutation = useMutation({
    mutationFn: (platform: MarketplacePlatform) =>
      triggerSyncConnector({ data: { platform, syncType: "full" } }),
    onSuccess: (res) => {
      // O BFF usa Outbox Pattern: sync é despachada para a fila, não executada sincronamente
      toast.success(res.message || "Sincronização despachada. O status será atualizado em instantes.");
      queryClient.invalidateQueries({ queryKey: ["marketplace-connectors"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao sincronizar.");
    },
  });

  const handleOpenConfig = (p: PlatformMeta) => {
    setSelectedPlatform(p);
    const existing = connectors.find((c: MarketplaceConnectorDTO) => c.platform === p.platform);
    if (existing) {
      setAccountId(existing.external_account_id || "");
      setAccountNickname(existing.account_nickname || "");
      setAutoAccept(existing.settings?.auto_accept_orders ?? false);
      setSyncStock(existing.settings?.sync_stock ?? true);
    } else {
      setAccountId("");
      setAccountNickname("");
      setAutoAccept(false);
      setSyncStock(true);
    }
    setApiToken("");
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!selectedPlatform) return;
    saveMutation.mutate({
      platform: selectedPlatform.platform,
      name: selectedPlatform.name,
      external_account_id: accountId.trim() || undefined,
      account_nickname: accountNickname.trim() || undefined,
      access_token: apiToken.trim() || undefined,
      status: "connected",
      settings: {
        auto_accept_orders: autoAccept,
        sync_stock: syncStock,
        sync_products: true,
        sync_orders: true,
      },
    });
  };

  const filteredCatalog = PLATFORMS_CATALOG.filter((p) => {
    if (activeTab === "all") return true;
    return p.category === activeTab;
  });

  const totalConnected = connectors.filter((c: MarketplaceConnectorDTO) => c.status === "connected").length;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          eyebrow="Canais de Venda & Logística"
          title="Central de Integrações"
          description="Conectores oficiais com marketplaces, apps de entrega e transportadoras do Brasil."
        />
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="h-10 rounded-xl text-xs font-medium">
            <Link to="/workspace/fiscal/nfe">
              Módulo Fiscal (NF-e)
            </Link>
          </Button>
          <Button asChild className="h-10 rounded-xl text-xs font-semibold bg-foreground text-background">
            <Link to="/workspace/pedidos/expedicao">
              Expedição de Pedidos
            </Link>
          </Button>
        </div>
      </div>

      {/* Metric Cards Sóbrios */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium">Canais Ativos</p>
          <p className="text-2xl font-bold tracking-tight mt-1 text-foreground">
            {totalConnected} <span className="text-xs text-muted-foreground font-normal">/ {PLATFORMS_CATALOG.length}</span>
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium">Padrão de Conexão</p>
          <p className="text-sm font-semibold mt-1 text-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            OpenDelivery & REST APIs
          </p>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-5">
          <p className="text-xs text-muted-foreground font-medium">Política de Fallback</p>
          <p className="text-sm font-semibold mt-1 text-foreground flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-blue-500" />
            Zero-Fake (Sem mocks)
          </p>
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "all" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Todos ({PLATFORMS_CATALOG.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ecommerce")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "ecommerce" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Marketplaces E-Commerce
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("food")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "food" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Delivery & Refeições
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logistics")}
          className={cn(
            "px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            activeTab === "logistics" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Frete & Logística
        </button>
      </div>

      {/* Grid de Conectores (Apple HIG) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalog.map((item) => {
          const conn = connectors.find((c: MarketplaceConnectorDTO) => c.platform === item.platform);
          const isConnected = conn?.status === "connected";
          const Icon = item.icon;

          return (
            <div
              key={item.platform}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between transition-all bg-card",
                isConnected ? "border-emerald-500/40 bg-emerald-500/[0.02]" : "border-border/70"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("size-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-xs", item.color)}>
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground tracking-tight">{item.name}</h3>
                      <p className="text-[11px] text-muted-foreground">{item.badgeLabel}</p>
                    </div>
                  </div>
                  {isConnected ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-600 bg-emerald-500/10 text-[10px] font-medium h-5">
                      Conectado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-border text-muted-foreground text-[10px] h-5">
                      Desconectado
                    </Badge>
                  )}
                </div>

                {isConnected && conn?.account_nickname && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">
                    Conta: <span className="font-medium text-foreground">{conn.account_nickname}</span>
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2">
                <a
                  href={item.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  Documentação <ExternalLink className="size-3" />
                </a>

                <div className="flex items-center gap-1.5">
                  {isConnected ? (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => disconnectMutation.mutate(item.platform)}
                        disabled={disconnectMutation.isPending}
                        title="Desconectar"
                      >
                        <Unlink className="size-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs font-medium"
                        onClick={() => syncMutation.mutate(item.platform)}
                        disabled={syncMutation.isPending}
                      >
                        <RefreshCw className={cn("size-3 mr-1", syncMutation.isPending && "animate-spin")} />
                        Sincronizar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs font-medium"
                        onClick={() => handleOpenConfig(item)}
                      >
                        Ajustes
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold bg-foreground text-background hover:bg-foreground/90"
                      onClick={() => handleOpenConfig(item)}
                    >
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Conexão Rápida */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Configurar {selectedPlatform?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Insira as credenciais oficiais fornecidas no portal do desenvolvedor da plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Nome / Apelido da Loja</Label>
              <Input
                placeholder="Ex: Minha Loja Oficial"
                value={accountNickname}
                onChange={(e) => setAccountNickname(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">ID do Vendedor / Conta Externa</Label>
              <Input
                placeholder="Ex: MLB9823412 ou ifood_store_12"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Token de Acesso / API Key</Label>
              <Input
                type="password"
                placeholder="Cole o token de autenticação..."
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="pt-2 border-t border-border/60 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium">Sincronizar Estoque em Tempo Real</p>
                  <p className="text-[11px] text-muted-foreground">Baixa automática em vendas locais e remotas</p>
                </div>
                <Switch checked={syncStock} onCheckedChange={setSyncStock} />
              </div>

              {selectedPlatform?.category === "food" && (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium">Aceite Automático de Pedidos</p>
                    <p className="text-[11px] text-muted-foreground">Dispara comanda direta para impressão da cozinha</p>
                  </div>
                  <Switch checked={autoAccept} onCheckedChange={setAutoAccept} />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <Button
              variant="outline"
              className="h-10 rounded-xl text-xs"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="h-10 rounded-xl text-xs font-semibold bg-foreground text-background"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Salvando..." : "Salvar Conexão"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default MarketplaceHubPage;
