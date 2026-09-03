import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Search,
  X,
  Sparkles,
  Package,
  Tags,
  Boxes,
  ClipboardList,
  ShoppingBag,
  Store,
  Truck,
  Users,
  Sliders,
  Calendar,
  MessageSquare,
  Flame,
  Newspaper,
  DollarSign,
  Ticket,
  BarChart3,
  Building2,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  Settings,
  HelpCircle,
  FileSpreadsheet,
  Globe,
  Coins,
  Scale,
  Receipt,
  Eye,
  Megaphone,
  Plane,
  Bus,
  FileText,
  ChefHat,
  Armchair,
  UtensilsCrossed,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface WorkspaceAllToolsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeStore?: any;
}

// ── FERRAMENTAS USADAS COM FREQUÊNCIA (Padrão Topo Meta Suite) ──
const FREQUENT_TOOLS = [
  {
    title: "Cardápio & Produtos",
    path: "/workspace/catalogo/produtos",
    icon: Package,
    badge: "Catálogo",
  },
  {
    title: "Gestor de Pedidos (KDS)",
    path: "/workspace/pedidos/gestor",
    icon: ClipboardList,
    badge: "Cozinha / Vendas",
  },
  {
    title: "Frente de Caixa (PDV)",
    path: "/workspace/pdv",
    icon: Store,
    badge: "Balcão",
  },
  {
    title: "Clientes & CRM",
    path: "/workspace/clientes",
    icon: Users,
    badge: "Contatos",
  },
  {
    title: "Financeiro & DRE",
    path: "/workspace/financeiro",
    icon: DollarSign,
    badge: "Caixa",
  },
  {
    title: "Configurações da Loja",
    path: "/workspace/configuracoes",
    icon: Settings,
    badge: "Ajustes",
  },
];

// ── GRADE SETORIAL COMPLETA DE FERRAMENTAS ──
const SECTOR_TOOL_GROUPS = [
  {
    id: "commerce",
    title: "Comércio & Vendas",
    description: "Gestão do cardápio, estoque, PDV e despacho de pedidos",
    tools: [
      { title: "Produtos & Variações", path: "/workspace/catalogo/produtos", icon: Package },
      { title: "Categorias do Menu", path: "/workspace/catalogo/categorias", icon: Tags },
      { title: "Adicionais & Opcionais", path: "/workspace/catalogo/atributos", icon: Boxes },
      { title: "Coleções & Destaques", path: "/workspace/catalogo/colecoes", icon: Sliders },
      { title: "Gestor de Pedidos (KDS)", path: "/workspace/pedidos/gestor", icon: ClipboardList },
      { title: "Histórico de Vendas", path: "/workspace/pedidos", icon: ShoppingBag },
      { title: "Frente de Caixa (PDV)", path: "/workspace/pdv", icon: Store },
      { title: "KDS Cozinha & Estações", path: "/workspace/pdv/cozinha", icon: ChefHat, badge: "Novo" },
      { title: "Reservas & Mapa do Salão", path: "/workspace/reservas", icon: Armchair, badge: "Novo" },
      { title: "Entregadores & Frota", path: "/workspace/pedidos/frota", icon: Truck },
      { title: "Controle de Insumos & Estoque", path: "/workspace/estoque", icon: Boxes },
      { title: "Alertas de Reposição", path: "/workspace/estoque/alertas", icon: Flame },
      { title: "Trocas & Devoluções", path: "/workspace/pedidos/trocas", icon: Receipt },
      { title: "Tabelas de Frete & Raio", path: "/workspace/logistica/tabelas", icon: Truck },
    ],
  },
  {
    id: "engagement",
    title: "Engajamento & Clientes",
    description: "Atendimento multicanal, base de contatos e avaliações",
    tools: [
      { title: "Caixa de Entrada / Chat", path: "/workspace/atendimento", icon: MessageSquare, badge: "Novo" },
      { title: "Base de Clientes (CRM)", path: "/workspace/clientes", icon: Users },
      { title: "Avaliações & Reputação", path: "/workspace/avaliacoes", icon: Sparkles },
      { title: "Agenda de Atendimentos", path: "/workspace/agenda", icon: Calendar },
      { title: "Orçamentos & Propostas", path: "/workspace/orcamentos", icon: FileSpreadsheet },
    ],
  },
  {
    id: "marketing",
    title: "Publicidade & Divulgação",
    description: "Campanhas, biolinks, banners e ferramentas de conversão",
    tools: [
      { title: "Banners da Loja", path: "/workspace/marketing/banners", icon: Megaphone },
      { title: "Hotpages & Biolinks", path: "/workspace/marketing/hotpages", icon: Globe },
      { title: "Cupons & Descontos", path: "/workspace/marketing/cupons", icon: Ticket },
      { title: "Campanhas & Anúncios", path: "/workspace/marketing/campanhas", icon: Zap },
      { title: "Notícias & Publicações", path: "/workspace/marketing/noticias", icon: Newspaper },
    ],
  },
  {
    id: "tourism",
    title: "Turismo & Viagens",
    description: "Cotações, estúdio de lâminas, contratos com assinatura digital e excursões",
    tools: [
      { title: "Central de Cotações", path: "/workspace/turismo/cotacoes", icon: Plane },
      { title: "Lâminas & Propostas (Studio)", path: "/workspace/turismo/propostas", icon: Sparkles },
      { title: "Contratos & Assinatura Digital", path: "/workspace/turismo/contratos", icon: FileText },
      { title: "Grupos Terrestres & Ônibus (ANTT)", path: "/workspace/turismo/grupos", icon: Bus },
      { title: "Passeios & Ingressos", path: "/workspace/eventos", icon: Calendar },
    ],
  },
  {
    id: "analytics",
    title: "Análises & Relatórios",
    description: "Indicadores de faturamento, vendas e fluxo de caixa",
    tools: [
      { title: "Visão Geral de Desempenho", path: "/workspace", icon: BarChart3 },
      { title: "DRE & Fechamento Financeiro", path: "/workspace/financeiro", icon: DollarSign },
      { title: "Relatório de Produtos Mais Vendidos", path: "/workspace/relatorios/produtos", icon: Package },
      { title: "Relatórios de Gastronomia", path: "/workspace/relatorios/gastronomia", icon: UtensilsCrossed, badge: "Novo" },
      { title: "Comissões & Repasses", path: "/workspace/financeiro/repasses", icon: Coins },
    ],
  },
  {
    id: "management",
    title: "Gerenciamento & Configurações",
    description: "Operação da loja, horários, equipe e integrações",
    tools: [
      { title: "Dados Gerais & Identidade", path: "/workspace/configuracoes", icon: Settings },
      { title: "Horários de Funcionamento", path: "/workspace/configuracoes/horarios", icon: Calendar },
      { title: "Taxas & Raio de Entrega", path: "/workspace/configuracoes/entrega", icon: Truck },
      { title: "Equipe & Membros de Loja", path: "/workspace/equipe", icon: Users },
      { title: "Unidades & Filiais", path: "/workspace/lojas", icon: Building2 },
      { title: "Central de Ajuda & Suporte", path: "/ajuda", icon: HelpCircle },
    ],
  },
];

export function WorkspaceAllToolsDialog({
  open,
  onOpenChange,
  activeStore,
}: WorkspaceAllToolsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtro dinâmico por palavra-chave
  const filteredSectors = useMemo(() => {
    if (!searchQuery.trim()) return SECTOR_TOOL_GROUPS;
    const q = searchQuery.toLowerCase();

    return SECTOR_TOOL_GROUPS.map((sector) => ({
      ...sector,
      tools: sector.tools.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          sector.title.toLowerCase().includes(q) ||
          sector.description.toLowerCase().includes(q)
      ),
    })).filter((sector) => sector.tools.length > 0);
  }, [searchQuery]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] p-0 rounded-3xl border border-border/80 bg-background/98 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* ── 1. Top Header com Busca Ampla (Padrão Meta Studio) ── */}
        <div className="p-4 sm:p-6 pb-4 border-b border-border/60 bg-muted/15 shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <Sliders className="size-4" />
              </div>
              <DialogTitle className="text-base sm:text-lg font-black tracking-tight text-foreground">
                Todas as Ferramentas
              </DialogTitle>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider hidden sm:inline">
              Workspace • {activeStore?.name || "Jah"}
            </span>
          </div>

          <div className="relative">
            <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar palavras-chave em todas as ferramentas..."
              className="h-10 pl-10 pr-4 text-xs sm:text-sm rounded-xl bg-card border-border/60 focus-visible:ring-1 focus-visible:ring-primary shadow-xs"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Conteúdo Scrollável com Gôndola e Grid Setorial ── */}
        <ScrollArea className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6 max-w-5xl mx-auto pb-4">
            {/* Seção: Usadas com frequência (Exibida quando não há busca ativa) */}
            {!searchQuery && (
              <div className="space-y-2.5 pb-5 border-b border-border/60">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
                  Usadas com frequência
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {FREQUENT_TOOLS.map((tool) => {
                    const Icon = tool.icon;
                    return (
                      <Link
                        key={tool.path}
                        to={tool.path}
                        onClick={() => onOpenChange(false)}
                        className="group flex flex-col items-center justify-center p-3 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-all text-center gap-2 shadow-2xs cursor-pointer active:scale-98"
                      >
                        <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Icon className="size-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                            {tool.title}
                          </p>
                          <span className="text-[9px] font-mono text-muted-foreground block truncate">
                            {tool.badge}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grade de Setores Multicolunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSectors.map((sector) => (
                <div
                  key={sector.id}
                  className="rounded-2xl border border-border/60 bg-card/60 p-4 space-y-3 shadow-2xs"
                >
                  <div className="border-b border-border/40 pb-2">
                    <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span>{sector.title}</span>
                    </h3>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {sector.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {sector.tools.map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <Link
                          key={tool.path}
                          to={tool.path}
                          onClick={() => onOpenChange(false)}
                          className="flex items-center justify-between p-2 rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                            <span className="truncate">{tool.title}</span>
                          </div>
                          {tool.badge && (
                            <Badge
                              variant="outline"
                              className="text-[8px] font-mono font-bold uppercase px-1 py-0 h-3.5 bg-primary/10 text-primary border-primary/20 shrink-0 ml-1"
                            >
                              {tool.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {filteredSectors.length === 0 && (
              <div className="py-12 text-center text-muted-foreground space-y-2">
                <p className="text-sm font-bold text-foreground">
                  Nenhuma ferramenta encontrada para &quot;{searchQuery}&quot;
                </p>
                <p className="text-xs text-muted-foreground">
                  Tente pesquisar por termos como &quot;pedidos&quot;, &quot;cardápio&quot;, &quot;estoque&quot; ou &quot;financeiro&quot;.
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── 3. Rodapé com Atalho de Ajuda e Fechamento ── */}
        <div className="p-3 px-6 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono">Dica: Use as setas e Enter para navegar rápido</span>
          </div>
          <Link
            to="/workspace/configuracoes"
            onClick={() => onOpenChange(false)}
            className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>Configurações do Espaço</span>
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
