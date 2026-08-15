import { createFileRoute, Link } from "@tanstack/react-router";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Truck,
  Users,
  AlertTriangle,
  Sparkles,
  Plus,
  ArrowUpRight,
  Store,
  Megaphone,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/workspace/")({
  component: WorkspaceDashboardPage,
});

export default function WorkspaceDashboardPage() {
  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Painel de Operações
            </h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
              ● Sincronização em Tempo Real
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Governança integrada do ecossistema comercial, cultural e logístico da sua loja.
          </p>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-1.5 shadow-sm">
            <Link to="/workspace/pdv">
              <Store className="h-4 w-4" />
              Frente de Caixa (PDV)
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/workspace/catalogo/produtos/novo">
              <Plus className="h-4 w-4" />
              Novo Produto
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Bilateral KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-card border-border shadow-xs hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vendas Hoje
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              R$ 1.480,50
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-600 font-medium">↑ +14.2%</span> vs ontem
            </p>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border shadow-xs hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Pedidos Ativos
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              6 em preparo
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Link to="/workspace/pedidos/gestor" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">
                Ver Kanban de Cozinha <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border shadow-xs hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Frota & Entregas
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              3 despachados
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Link to="/workspace/pedidos/frota" className="text-amber-600 hover:underline inline-flex items-center gap-0.5">
                Rastreamento e PIN <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card border-border shadow-xs hover:border-foreground/20 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Estoque Crítico
            </span>
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-foreground">
              2 itens baixos
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <Link to="/workspace/estoque" className="text-rose-600 hover:underline inline-flex items-center gap-0.5">
                Repor inventário <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Bilateral Modules Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Vitrine & Marketing ao Vivo */}
        <Card className="p-5 border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
                <Megaphone className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">Vitrine & Marketing</h3>
            </div>
            <Badge variant="secondary" className="text-[10px]">Ao Vivo</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Banners, promoções e produtos editados aqui propagam instantaneamente na vitrine pública.
          </p>
          <div className="space-y-2 pt-2 border-t border-border">
            <Link
              to="/workspace/marketing/banners"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Gerenciar Top Banners</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/workspace/marketing/promocoes"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Promoções & Cupons</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/workspace/catalogo/produtos"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Catálogo & Variações</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </Card>

        {/* Module 2: Operação & Logística */}
        <Card className="p-5 border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <Store className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">Operação & Logística</h3>
            </div>
            <Badge variant="secondary" className="text-[10px]">Despacho</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Controle de fluxo de comandas, caixa físico e despacho em tempo real com links mágicos.
          </p>
          <div className="space-y-2 pt-2 border-t border-border">
            <Link
              to="/workspace/pedidos/gestor"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Gestor Kanban de Pedidos</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/workspace/pedidos/frota"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Frota de Entregadores</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/workspace/financeiro/caixa"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Frente de Caixa & Turnos</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </Card>

        {/* Module 3: Serviços, IA & Simulações */}
        <Card className="p-5 border-border bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-semibold text-sm">Serviços & IA</h3>
            </div>
            <Badge variant="secondary" className="text-[10px]">SimLab</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Enxame de simulação com IA, grade de agendamentos e moderação comunitária.
          </p>
          <div className="space-y-2 pt-2 border-t border-border">
            <Link
              to="/workspace/simulacao"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>SimLab (Simulação em Tempo Real)</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/workspace/agenda"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Grade de Agendamentos</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              to="/workspace/moderacao"
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/60 text-xs font-medium transition-colors"
            >
              <span>Painel de Moderação</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
