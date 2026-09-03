import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Coins,
  Copy,
  Loader2,
  TrendingDown,
  Sparkles,
  CreditCard,
  Sliders,
  CheckCircle2,
  Shield,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getStoreTokenWallet,
  getStoreGrowthAndBounties,
  purchaseTokenPackage,
  getStoreEconomyComparison,
  updateStoreTokenBillingConfig,
  type TokenPackage,
} from "@/services/tokens.functions";

export const Route = createFileRoute("/workspace/tokens")({
  head: () => ({ meta: [{ title: "Tokens & Aceleração | Wider Workspace" }] }),
  loader: async () => {
    try {
      const [wallet, growth, economy] = await Promise.all([
        getStoreTokenWallet(),
        getStoreGrowthAndBounties().catch(() => null),
        getStoreEconomyComparison({ data: { monthly_sales_brl: 10000 } }).catch(() => null),
      ]);
      return { wallet, growth, economy };
    } catch (e) {
      console.error("[workspace.tokens] loader error:", e);
      return {
        wallet: {
          store_id: "",
          store_name: "Minha Loja",
          balance: 50_000,
          lifetime_purchased: 50_000,
          lifetime_consumed: 0,
          estimated_time_saved_hours: 24,
          packages: [],
          burn_rates: {} as any,
          transactions: [],
        },
        growth: null,
        economy: null,
      };
    }
  },
  component: WorkspaceTokensPage,
});

export default function WorkspaceTokensPage() {
  const loaderData = Route.useLoaderData();
  const [wallet, setWallet] = useState(loaderData.wallet);
  const [growth, setGrowth] = useState(loaderData.growth);
  const [activeTab, setActiveTab] = useState("visao_geral");

  // Estado da Calculadora de Economia
  const [simulatedSales, setSimulatedSales] = useState(10000);
  const [economyData, setEconomyData] = useState(loaderData.economy);

  // Estado de Faturamento Inteligente (Meta Ads Style)
  const [billingMode, setBillingMode] = useState<"prepaid" | "auto_threshold" | "monthly_invoice">(
    (wallet as any).billing_mode || "prepaid"
  );
  const [autoRechargeEnabled, setAutoRechargeEnabled] = useState(
    Boolean((wallet as any).auto_recharge_enabled)
  );
  const [thresholdTokens, setThresholdTokens] = useState(
    (wallet as any).auto_recharge_threshold_tokens || 20000
  );
  const [monthlyLimitBrl, setMonthlyLimitBrl] = useState(
    (wallet as any).spending_limit_monthly_brl || 500
  );
  const [isSavingBilling, setIsSavingBilling] = useState(false);

  // Modal de Compra
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [rechargeModalOpen, setRechargeModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "credit_card">("pix");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenRecharge = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setRechargeModalOpen(true);
  };

  const handleCopyReferral = () => {
    const url = growth?.referral_url || `https://wider.com.br/@${wallet.store_name?.toLowerCase().replace(/\s+/g, "")}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado.");
  };

  const handleRecalculateEconomy = async (value: number) => {
    setSimulatedSales(value);
    try {
      const updated = await getStoreEconomyComparison({ data: { monthly_sales_brl: value } });
      setEconomyData(updated);
    } catch {}
  };

  const handleSaveBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingBilling(true);
      const res = await updateStoreTokenBillingConfig({
        data: {
          billing_mode: billingMode,
          auto_recharge_enabled: autoRechargeEnabled,
          auto_recharge_threshold_tokens: thresholdTokens,
          auto_recharge_package_id: "pkg_growth",
          spending_limit_monthly_brl: monthlyLimitBrl,
        },
      });
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar preferências de faturamento.");
    } finally {
      setIsSavingBilling(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedPackage) return;

    try {
      setIsProcessing(true);
      const res = await purchaseTokenPackage({
        data: {
          package_id: selectedPackage.id,
          payment_method: paymentMethod,
        },
      });

      toast.success(res.message);
      setRechargeModalOpen(false);

      const updated = await getStoreTokenWallet();
      setWallet(updated);
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar recarga.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Cálculos do Dual-Pocket
  const promoTokens = (growth as any)?.total_tokens_earned || (growth as any)?.total_tokens_awarded || 0;
  const purchasedTokens = Math.max(0, (wallet.balance || 0) - promoTokens);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-background">
      {/* Header Silencioso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Tokens de Aceleração</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            0% de comissões sobre vendas. Pague apenas por utilidade e impulsos em micro-tokens.
          </p>
        </div>

        <Button
          onClick={() => handleOpenRecharge(wallet.packages[1] || wallet.packages[0])}
          className="gap-2 text-xs font-semibold h-9"
        >
          <Coins className="size-3.5" />
          Recarregar Tokens
        </Button>
      </div>

      {/* Grid de Métricas Dual-Pocket */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Saldo Total</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {(wallet.balance || 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">micro-tokens disponíveis</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Tokens de Mídia & Radar</span>
          <div className="text-2xl font-bold tracking-tight text-primary mt-1">
            {promoTokens.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">bounties e crescimento orgânico</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Tokens de Infra & APIs</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 mt-1">
            {purchasedTokens.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">lastreados para IA, NF-e e WhatsApp</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Clientes Trazidos</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {growth?.total_clients_brought || 0}
          </div>
          <span className="text-[11px] text-muted-foreground">+100k tokens por novo cliente</span>
        </div>
      </div>

      {/* Tabs de Governança de Tokens */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar scrollbar-none p-1 rounded-xl h-10">
          <TabsTrigger value="visao_geral" className="text-xs">Visão Geral & Pacotes</TabsTrigger>
          <TabsTrigger value="calculadora" className="text-xs">Comparativo de Economia</TabsTrigger>
          <TabsTrigger value="faturamento" className="text-xs">Faturamento & Limites</TabsTrigger>
        </TabsList>

        {/* Tab 1: Visão Geral */}
        <TabsContent value="visao_geral" className="space-y-6">
          {/* Barra de Crescimento & Link Próprio (Tráfego Próprio Gratuito) */}
          <div className="p-4 rounded-xl border border-border/60 bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Link Próprio da Loja</span>
                <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                  0 Tokens (Tráfego Gratuito)
                </Badge>
              </div>
              <p className="text-muted-foreground font-mono text-[11px] truncate max-w-md">
                {growth?.referral_url || `https://wider.com.br/@${wallet.store_name?.toLowerCase().replace(/\s+/g, "")}`}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyReferral}
              className="gap-1.5 text-xs h-8 shrink-0"
            >
              <Copy className="size-3" />
              Copiar Link
            </Button>
          </div>

          {/* Tabela de Consumo Atômico de Utilidade */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">Tabela de Utilidade (Micro-Tokens)</h2>
            <div className="rounded-xl border border-border/60 overflow-hidden bg-card text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-border/40">
                <div className="p-3 space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Visualização no Feed</span>
                  <strong className="text-foreground">10 Tokens</strong>
                  <span className="text-[10px] text-muted-foreground block">~R$ 0,0005 (Mídia)</span>
                </div>
                <div className="p-3 space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Alerta Push / In-App</span>
                  <strong className="text-foreground">25 Tokens</strong>
                  <span className="text-[10px] text-muted-foreground block">~R$ 0,0012 (Mídia)</span>
                </div>
                <div className="p-3 space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Turno IA de Vendas</span>
                  <strong className="text-foreground">100 Tokens</strong>
                  <span className="text-[10px] text-muted-foreground block">~R$ 0,0049 (Infra)</span>
                </div>
                <div className="p-3 space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Disparo WhatsApp</span>
                  <strong className="text-foreground">150 Tokens</strong>
                  <span className="text-[10px] text-muted-foreground block">~R$ 0,0073 (Infra)</span>
                </div>
                <div className="p-3 space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Diária Loja Curada</span>
                  <strong className="text-foreground">200 Tokens/dia</strong>
                  <span className="text-[10px] text-muted-foreground block">~R$ 0,0098 (Mídia)</span>
                </div>
                <div className="p-3 space-y-0.5">
                  <span className="text-muted-foreground block text-[11px]">Emissão NF-e / Fiscal</span>
                  <strong className="text-foreground">1.500 Tokens</strong>
                  <span className="text-[10px] text-muted-foreground block">~R$ 0,0735 (Infra API)</span>
                </div>
                <div className="p-3 space-y-0.5 col-span-2 bg-muted/20">
                  <span className="text-rose-600 dark:text-rose-400 font-semibold block text-[11px]">Lead Quente Qualificado</span>
                  <strong className="text-foreground">35.000 Tokens (~R$ 1,71)</strong>
                  <span className="text-[10px] text-muted-foreground block">Cliente local com intenção de compra imediata</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pacotes de Recarga */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-foreground">Pacotes de Recarga</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {wallet.packages.map((pkg: TokenPackage) => (
                <div
                  key={pkg.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all bg-card ${
                    pkg.popular
                      ? "border-primary/80 ring-1 ring-primary/30"
                      : "border-border/60"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{pkg.name}</span>
                      {pkg.badge && (
                        <Badge variant="secondary" className="text-[9px] font-bold">
                          {pkg.badge}
                        </Badge>
                      )}
                    </div>

                    <div>
                      <div className="text-2xl font-bold tracking-tight text-foreground">
                        {pkg.tokens_formatted}
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {pkg.price_formatted} ({pkg.cost_per_million_brl})
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenRecharge(pkg)}
                    className="w-full mt-4 text-xs h-8 font-medium"
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    Comprar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Extrato Forense */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-foreground">Extrato de Movimentações</h2>
            <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Data</TableHead>
                    <TableHead className="text-xs">Operação</TableHead>
                    <TableHead className="text-xs">Descrição</TableHead>
                    <TableHead className="text-xs text-right">Tokens</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallet.transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                        Nenhuma movimentação recente registrada.
                      </TableCell>
                    </TableRow>
                  ) : (
                    wallet.transactions.map((tx: any) => {
                      const isCredit = tx.amount > 0;
                      return (
                        <TableRow key={tx.id}>
                          <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                            {new Date(tx.created_at).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-xs capitalize py-2.5">
                            {tx.action_type?.replace(/_/g, " ")}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2.5">
                            {tx.description || tx.action}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-xs font-semibold py-2.5 ${isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
                            {isCredit ? `+${Number(tx.amount).toLocaleString()}` : Number(tx.amount).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Calculadora de Economia Real */}
        <TabsContent value="calculadora" className="space-y-4">
          <div className="p-5 rounded-2xl border border-border/60 bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-foreground">Calculadora de Economia Real</h2>
                <p className="text-xs text-muted-foreground">
                  Veja quanto sua empresa economiza vendendo na Wider em comparação com taxas de marketplaces e e-commerces.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-xs font-semibold shrink-0">Faturamento Mensal:</Label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground font-mono">R$</span>
                  <Input
                    type="number"
                    min="1000"
                    step="1000"
                    value={simulatedSales}
                    onChange={(e) => handleRecalculateEconomy(Number(e.target.value || "0"))}
                    className="w-28 text-xs font-mono font-bold h-8"
                  />
                </div>
              </div>
            </div>

            {economyData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {economyData.comparisons.map((c: any) => (
                  <div key={c.platform} className="p-4 rounded-xl border border-border/60 bg-muted/10 space-y-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-sm text-foreground block">{c.platform}</span>
                      <span className="text-[11px] text-muted-foreground block">{c.rate_desc}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground block">Custo nesta plataforma:</span>
                      <strong className="text-rose-600 dark:text-rose-400 font-mono text-base block">
                        {c.cost_brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </strong>
                    </div>

                    <div className="pt-2 border-t border-border/40 space-y-0.5">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                        Economia Líquida na Wider:
                      </span>
                      <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        +{c.savings_brl.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}{" "}
                        <span className="text-[11px] font-normal">(-{c.savings_percent}%)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Faturamento & Recarga Automática (Meta Ads Style) */}
        <TabsContent value="faturamento" className="space-y-4">
          <div className="p-5 rounded-2xl border border-border/60 bg-card space-y-4">
            <div>
              <h2 className="text-base font-bold text-foreground">Faturamento Inteligente & Limite de Gastos</h2>
              <p className="text-xs text-muted-foreground">
                Configure recargas automáticas por limite (estilo Meta Ads) para que suas IAs e campanhas no Radar nunca parem.
              </p>
            </div>

            <form onSubmit={handleSaveBilling} className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Modo de Cobrança</Label>
                  <Select value={billingMode} onValueChange={(v: any) => setBillingMode(v)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prepaid">Pré-Pago (Recarga manual sob demanda)</SelectItem>
                      <SelectItem value="auto_threshold">Automático por Limite (Meta Ads Style)</SelectItem>
                      <SelectItem value="monthly_invoice">Fatura Mensal Consolidada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Teto Máximo Mensal de Gastos (R$)</Label>
                  <Input
                    type="number"
                    min="50"
                    step="50"
                    value={monthlyLimitBrl}
                    onChange={(e) => setMonthlyLimitBrl(Number(e.target.value || "0"))}
                    className="h-9 font-mono"
                  />
                  <span className="text-[10px] text-muted-foreground block">
                    Trava de segurança: a plataforma nunca cobrará mais que este valor no mês.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                <div className="space-y-0.5">
                  <span className="font-semibold text-foreground block">Recarga Automática de Continuidade</span>
                  <p className="text-[11px] text-muted-foreground">
                    Quando seu saldo cair abaixo de {thresholdTokens.toLocaleString()} tokens, recarrega automaticamente o pacote padrão.
                  </p>
                </div>
                <Switch
                  checked={autoRechargeEnabled}
                  onCheckedChange={setAutoRechargeEnabled}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingBilling} className="text-xs h-9 font-semibold">
                  {isSavingBilling && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                  Salvar Preferências de Faturamento
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Adaptativo de Compra */}
      <Dialog open={rechargeModalOpen} onOpenChange={setRechargeModalOpen}>
        <DialogContent className="sm:max-w-sm sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Recarregar {selectedPackage?.tokens_formatted} Tokens
            </DialogTitle>
            <DialogDescription className="text-xs">
              Valor: {selectedPackage?.price_formatted}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <span className="text-muted-foreground font-medium block">Forma de Pagamento</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("pix")}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                  paymentMethod === "pix"
                    ? "border-primary bg-primary/5 text-foreground font-semibold"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                Pix Imediato
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("credit_card")}
                className={`p-2.5 rounded-lg border text-center font-medium transition-all ${
                  paymentMethod === "credit_card"
                    ? "border-primary bg-primary/5 text-foreground font-semibold"
                    : "border-border/60 text-muted-foreground"
                }`}
              >
                Cartão de Crédito
              </button>
            </div>
          </div>

          <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
            <Button type="button" variant="outline" onClick={() => setRechargeModalOpen(false)} className="w-full sm:w-auto text-xs h-9">
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmPurchase}
              disabled={isProcessing}
              className="w-full sm:w-auto text-xs h-9 font-semibold"
            >
              {isProcessing && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
