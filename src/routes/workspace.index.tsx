import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  Truck,
  Users,
  AlertTriangle,
  ArrowUpRight,
  Store,
  Megaphone,
  Calendar,
  Layers,
  ChevronRight,
  DollarSign,
  Ticket,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserSession } from "@/services/auth.functions";
import { getDashboardData, type DashboardMetrics } from "@/services/dashboard.functions";
import { formatMoney } from "@/lib/money";

export const Route = createFileRoute("/workspace/")({
  head: () => ({ meta: [{ title: "Painel de Controle & Visão Geral | Workspace Wider" }] }),
  loader: async () => {
    let session: any = null;
    try {
      session = await getUserSession();
    } catch {
      session = null;
    }

    const memberships = session?.memberships || [];
    const activeStoreId = session?.store_id || memberships[0]?.store_id || null;
    const activeStore = memberships.find((m: any) => m.store_id === activeStoreId) || memberships[0] || null;

    const dashboardMetrics = await getDashboardData().catch(() => ({
      salesTodayCents: 0,
      salesMonthCents: 0,
      salesLastMonthCents: 0,
      growthPercentage: null,
      ordersTodayCount: 0,
      ordersMonthCount: 0,
      ordersBreakdown: {
        awaitingPayment: 0,
        needsSeparation: 0,
        shippedOrReady: 0,
        completed: 0,
        cancelled: 0,
        pendingBackorders: 0,
      },
      lowStockItems: [],
      criticalStockCount: 0,
      newCustomers30d: 0,
      abandonedCartsCount: 0,
      recentActivities: [],
      activeCashRegister: null,
      setupChecklist: [],
      setupProgressPercentage: 100,
    } as DashboardMetrics));

    return {
      session,
      activeStore,
      memberships,
      dashboardMetrics,
    };
  },
  component: WorkspaceDashboardPage,
});

export default function WorkspaceDashboardPage() {
  const { activeStore, dashboardMetrics } = Route.useLoaderData() as any;

  const criticalStockCount = dashboardMetrics?.criticalStockCount || 0;
  const recentActivities = dashboardMetrics?.recentActivities || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. Top Header com Identificação do Negócio ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl  bg-card ">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary">
              Espaço Ativo
            </span>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              ● {activeStore?.name || "Espaço Sem Nome"}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Painel de Operações
          </h1>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-bold gap-1.5 ">
            <Link to="/workspace/lojas">
              <Store className="size-3.5" />
              <span>Trocar Espaço</span>
            </Link>
          </Button>

          <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 bg-primary text-primary-foreground ">
            <Link to="/workspace/pdv">
              <ShoppingBag className="size-3.5" />
              <span>Frente de Caixa (PDV)</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* ── 2. Destaque de Faturamento Mensal Real ── */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground  flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider opacity-80">
            Faturamento do Mês
          </span>
          <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight">
            {formatMoney(dashboardMetrics?.salesMonthCents || 0)}
          </div>
          <div className="flex items-center gap-2 pt-1 text-xs opacity-90">
            {dashboardMetrics?.growthPercentage != null ? (
              <span className={`inline-flex items-center gap-1 font-bold ${
                dashboardMetrics.growthPercentage >= 0 ? "text-emerald-300" : "text-rose-300"
              }`}>
                {dashboardMetrics.growthPercentage >= 0 ? (
                  <TrendingUp className="size-3.5" />
                ) : (
                  <TrendingDown className="size-3.5" />
                )}
                {dashboardMetrics.growthPercentage >= 0 ? `+${dashboardMetrics.growthPercentage}%` : `${dashboardMetrics.growthPercentage}%`} em relação ao mês anterior
              </span>
            ) : (
              <span className="text-xs opacity-80">
                Faturamento consolidado em tempo real
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/workspace/financeiro/caixa"
            className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-white/90 transition-all "
          >
            Ver Fluxo de Caixa
          </Link>
          <Link
            to="/workspace/agenda"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all"
          >
            Abrir Agenda
          </Link>
        </div>
      </div>

      {/* ── 3. Grid Tático de 4 Métricas Reais ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Link
          to="/workspace/agenda"
          className="p-4 rounded-2xl bg-card  hover:border-primary/50 transition-all  group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <Calendar className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-muted-foreground">Agenda</p>
            <p className="text-sm font-black text-foreground mt-0.5">
              {dashboardMetrics?.ordersTodayCount || 0} compromisso(s) hoje
            </p>
          </div>
        </Link>

        <Link
          to="/workspace/clientes"
          className="p-4 rounded-2xl bg-card  hover:border-primary/50 transition-all  group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-muted-foreground">Clientes</p>
            <p className="text-sm font-black text-foreground mt-0.5">
              {dashboardMetrics?.newCustomers30d ?? 0} novos no mês
            </p>
          </div>
        </Link>

        <Link
          to="/workspace/financeiro/caixa"
          className="p-4 rounded-2xl bg-card  hover:border-primary/50 transition-all  group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <DollarSign className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-muted-foreground">Vendas Hoje</p>
            <p className="text-sm font-black text-foreground mt-0.5 font-mono">
              {formatMoney(dashboardMetrics?.salesTodayCents || 0)}
            </p>
          </div>
        </Link>

        <Link
          to="/workspace/catalogo/produtos"
          className="p-4 rounded-2xl bg-card  hover:border-primary/50 transition-all  group flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Package className="size-5" />
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-muted-foreground">Catálogo & Estoque</p>
            <p className="text-sm font-black text-foreground mt-0.5">
              {criticalStockCount === 0 ? "Estoque Regular" : `${criticalStockCount} item(ns) com baixo estoque`}
            </p>
          </div>
        </Link>
      </div>

      {/* ── 4. Matriz Bilateral: Atividades Reais & Vitrine ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Atividades Recentes do Banco de Dados */}
        <Card className="lg:col-span-2 p-5 border-border bg-card rounded-3xl  space-y-4">
          <div className="flex items-center justify-between pb-3 ">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Atividades Recentes</h3>
            </div>
            <Link to="/workspace/pedidos" className="text-xs text-primary font-bold hover:underline">
              Ver todos os pedidos
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <div className="py-8 text-center space-y-2 border-0 rounded-2xl bg-muted/20">
              <Clock className="size-8 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-foreground">Nenhuma atividade recente nesta loja</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                Assim que novas vendas, pedidos ou agendamentos forem realizados, eles aparecerão aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-muted/30  text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{act.title}</p>
                      <p className="text-muted-foreground text-[11px]">{act.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-mono text-muted-foreground block">{act.timeDisplay}</span>
                    {act.totalCents != null && (
                      <span className="text-xs font-bold font-mono text-foreground">{formatMoney(act.totalCents)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Vitrine & Marketing da Loja */}
        <Card className="p-5 border-border bg-card rounded-3xl  space-y-4">
          <div className="flex items-center justify-between pb-3 ">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" />
              <h3 className="font-bold text-sm text-foreground">Vitrine & Canais</h3>
            </div>
            <Badge variant="secondary" className="text-[10px]">Ativo</Badge>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              to="/workspace/marketing/banners"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 text-xs font-medium  transition-colors"
            >
              <span>Banners da Loja</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              to="/workspace/marketing/promocoes"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 text-xs font-medium  transition-colors"
            >
              <span>Promoções & Cupons</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>

            <Link
              to="/workspace/agenda/servicos"
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 text-xs font-medium  transition-colors"
            >
              <span>Serviços & Agendamento</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
