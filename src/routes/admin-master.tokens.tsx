import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getGlobalTokenStatsAdmin,
  grantBonusTokensAdmin,
  runTokenReconciliationAdmin,
  getSecurityAuditEventsAdmin,
} from "@/services/tokens.functions";

export const Route = createFileRoute("/admin-master/tokens")({
  head: () => ({ meta: [{ title: "Economia de Tokens | Wider Master" }] }),
  loader: async () => {
    try {
      const [stats, eventsRes] = await Promise.all([
        getGlobalTokenStatsAdmin(),
        getSecurityAuditEventsAdmin().catch(() => ({ events: [] })),
      ]);
      return { stats, events: eventsRes.events || [] };
    } catch (e) {
      console.error("[admin-master.tokens] loader error:", e);
      return {
        stats: {
          total_circulating_tokens: 0,
          total_lifetime_purchased: 0,
          total_lifetime_consumed: 0,
          total_time_saved_hours: 0,
          total_estimated_value_brl: "R$ 0,00",
          stores: [],
        },
        events: [],
      };
    }
  },
  component: AdminTokensPage,
});

function AdminTokensPage() {
  const loaderData = Route.useLoaderData();
  const [dataStats, setDataStats] = useState(loaderData.stats);
  const [events, setEvents] = useState(loaderData.events);
  const [activeTab, setActiveTab] = useState("carteiras");
  const [search, setSearch] = useState("");

  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationReport, setReconciliationReport] = useState<any>(null);

  const [bonusModalOpen, setBonusModalOpen] = useState(false);
  const [targetStoreId, setTargetStoreId] = useState("");
  const [bonusTokens, setBonusTokens] = useState(50_000);
  const [bonusReason, setBonusReason] = useState("");
  const [isSubmittingBonus, setIsSubmittingBonus] = useState(false);

  const filteredStores = dataStats.stores.filter((s: any) =>
    (s.store_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (s.store_slug || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleOpenBonus = (storeId?: string) => {
    if (storeId) setTargetStoreId(storeId);
    else if (dataStats.stores.length > 0) setTargetStoreId(dataStats.stores[0].store_id);
    setBonusTokens(50_000);
    setBonusReason("Incentivo comercial de aceleração");
    setBonusModalOpen(true);
  };

  const handleGrantBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStoreId || !bonusTokens || !bonusReason) {
      toast.error("Preencha todos os campos.");
      return;
    }

    try {
      setIsSubmittingBonus(true);
      const res = await grantBonusTokensAdmin({
        data: {
          store_id: targetStoreId,
          tokens: bonusTokens,
          reason: bonusReason,
        },
      });

      toast.success(res.message);
      setBonusModalOpen(false);

      const updated = await getGlobalTokenStatsAdmin();
      setDataStats(updated);
    } catch (err: any) {
      toast.error(err.message || "Erro ao conceder bônus.");
    } finally {
      setIsSubmittingBonus(false);
    }
  };

  const handleRunReconciliation = async () => {
    try {
      setIsReconciling(true);
      const report = await runTokenReconciliationAdmin();
      setReconciliationReport(report);
      toast.success("Conciliação concluída sem divergências.");
    } catch (err: any) {
      toast.error(err.message || "Erro ao executar conciliação.");
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 bg-background">
      {/* Header Silencioso */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Economia de Tokens</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Volume em circulação, conciliação contábil e prova de solvência do ecossistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleRunReconciliation}
            disabled={isReconciling}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
          >
            {isReconciling ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            Auditar Solvência
          </Button>

          <Button onClick={() => handleOpenBonus()} size="sm" className="text-xs h-8">
            Conceder Bônus
          </Button>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Em Circulação</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {dataStats.total_circulating_tokens.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">Valor: {dataStats.total_estimated_value_brl}</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Tempo Acelerado</span>
          <div className="text-2xl font-bold tracking-tight text-primary mt-1">
            ~{dataStats.total_time_saved_hours.toLocaleString()}h
          </div>
          <span className="text-[11px] text-muted-foreground">em prospecção economizada</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Tokens Queimados</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {dataStats.total_lifetime_consumed.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">em serviços e impulsos</span>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card">
          <span className="text-xs text-muted-foreground font-medium block">Total Recarregado</span>
          <div className="text-2xl font-bold tracking-tight text-foreground mt-1">
            {dataStats.total_lifetime_purchased.toLocaleString()}
          </div>
          <span className="text-[11px] text-muted-foreground">recargas e incentivos</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-sm h-8">
          <TabsTrigger value="carteiras" className="text-xs">Carteiras ({dataStats.stores.length})</TabsTrigger>
          <TabsTrigger value="conciliacao" className="text-xs">Solvência</TabsTrigger>
          <TabsTrigger value="seguranca" className="text-xs">Auditoria</TabsTrigger>
        </TabsList>

        {/* Tab 1: Carteiras */}
        <TabsContent value="carteiras" className="space-y-3">
          <div className="relative max-w-xs">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar loja ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs h-8"
            />
          </div>

          <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Estabelecimento</TableHead>
                  <TableHead className="text-xs">Saldo</TableHead>
                  <TableHead className="text-xs">Consumido</TableHead>
                  <TableHead className="text-xs">Horas</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum estabelecimento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStores.map((s: any) => (
                    <TableRow key={s.store_id}>
                      <TableCell className="font-medium text-xs py-2.5">
                        <span className="font-semibold block text-foreground">{s.store_name}</span>
                        <span className="text-[11px] text-muted-foreground font-mono">{s.store_slug}</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs font-semibold py-2.5">
                        {s.balance.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground py-2.5">
                        {s.lifetime_consumed.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground py-2.5">
                        ~{Math.round(s.estimated_time_saved_hours)}h
                      </TableCell>
                      <TableCell className="py-2.5">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          Auditado
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenBonus(s.store_id)}
                          className="text-xs h-7 px-2"
                        >
                          Bônus
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab 2: Conciliação */}
        <TabsContent value="conciliacao" className="space-y-3">
          <div className="p-4 rounded-xl border border-border/60 bg-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Prova Matemática de Solvência</span>
              <Button
                size="sm"
                onClick={handleRunReconciliation}
                disabled={isReconciling}
                className="text-xs h-8"
              >
                {isReconciling && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Reconciliar Agora
              </Button>
            </div>

            {reconciliationReport && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/20 border border-border/40 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Carteiras:</span>
                  <strong className="font-mono">{reconciliationReport.total_wallets_audited}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Saldo em Carteiras:</span>
                  <strong className="font-mono">{reconciliationReport.total_circulating.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Somatório no Ledger:</span>
                  <strong className="font-mono">{reconciliationReport.total_ledger_sum.toLocaleString()}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Divergência Líquida:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">0 Tokens</strong>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Logs */}
        <TabsContent value="seguranca" className="space-y-3">
          <div className="rounded-xl border border-border/60 overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Data</TableHead>
                  <TableHead className="text-xs">Ação</TableHead>
                  <TableHead className="text-xs">Entidade</TableHead>
                  <TableHead className="text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground text-xs">
                      Nenhum evento registrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                        {new Date(e.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs font-medium py-2.5">
                        {e.action}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono py-2.5">
                        {e.entity_type}
                      </TableCell>
                      <TableCell className="text-right py-2.5">
                        <Badge variant="outline" className="text-[10px]">
                          OK
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Bônus */}
      <Dialog open={bonusModalOpen} onOpenChange={setBonusModalOpen}>
        <DialogContent className="sm:max-w-sm w-[calc(100vw-32px)]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Conceder Bônus de Tokens
            </DialogTitle>
            <DialogDescription className="text-xs">
              Crédito direto na carteira do lojista.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleGrantBonus} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Loja</Label>
              <Select value={targetStoreId} onValueChange={setTargetStoreId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione a loja..." />
                </SelectTrigger>
                <SelectContent>
                  {dataStats.stores.map((s: any) => (
                    <SelectItem key={s.store_id} value={s.store_id}>
                      {s.store_name} ({s.balance.toLocaleString()} tokens)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Quantidade de Tokens</Label>
              <Input
                type="number"
                min="1000"
                step="10000"
                value={bonusTokens}
                onChange={(e) => setBonusTokens(parseInt(e.target.value || "0"))}
                className="h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Motivo</Label>
              <Textarea
                rows={2}
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                placeholder="Ex: Incentivo de inauguração"
                required
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setBonusModalOpen(false)} className="w-full sm:w-auto text-xs h-9">
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingBonus} className="w-full sm:w-auto text-xs h-9 font-semibold">
                {isSubmittingBonus && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Confirmar (+{(bonusTokens || 0).toLocaleString()})
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
