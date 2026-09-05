import React from "react";
import { Search, BarChart3, Settings2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface WorkspaceCanonicalAction {
  label: string;
  icon?: React.ElementType;
  onClick?: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export interface WorkspaceToolbarTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  iconColor?: string;
  count?: number;
}

export interface WorkspaceToolbarFilter {
  id: string;
  label: string;
  value: string;
  options: Array<{ label: string; value: string }>;
  onChange: (val: string) => void;
}

export interface WorkspaceCanonicalToolbarProps {
  /** Modos de visualização / Abas canônicas (suporta tabs ou viewModes) */
  tabs?: WorkspaceToolbarTab[];
  viewModes?: Array<{
    id: string;
    label: string;
    icon?: React.ElementType;
    iconColor?: string;
    count?: number;
  }>;
  activeTab?: string;
  activeViewMode?: string;
  onTabChange?: (tabId: string) => void;
  onViewModeChange?: (mode: string) => void;

  /** Busca rápida (suporta searchValue ou searchQuery) */
  searchPlaceholder?: string;
  searchValue?: string;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;

  /** Filtros rápidos estruturados (dropdowns padronizados) */
  filters?: WorkspaceToolbarFilter[];
  /** Slot livre para filtros contextuais adicionais */
  filterSlot?: React.ReactNode;

  /** Gatilho para abrir Dashboard de Métricas sob demanda */
  onOpenDashboard?: () => void;
  onMetricsClick?: () => void;
  dashboardLabel?: string;
  metricsBadge?: string;
  hasActiveMetrics?: boolean;

  /** Gatilho para customizar colunas do Kanban */
  onConfigureColumns?: () => void;
  onColumnsClick?: () => void;

  /** Ações secundária e primária */
  secondaryAction?: WorkspaceCanonicalAction;
  secondaryActions?: WorkspaceCanonicalAction[];
  primaryAction?: React.ReactNode | WorkspaceCanonicalAction;

  className?: string;
}

/**
 * Mapeamento semântico de cores para ícones das abas da toolbar.
 * Garante identidade visual limpa e elegante sem poluição.
 */
function getSemanticIconColor(id: string, customColor?: string): string {
  if (customColor) return customColor;
  const key = id.toLowerCase();
  if (key.includes("my-day") || key.includes("dia") || key.includes("foco")) return "text-amber-500";
  if (key.includes("list") || key.includes("lista")) return "text-blue-500";
  if (key.includes("kanban") || key.includes("board") || key.includes("quadro")) return "text-emerald-500";
  if (key.includes("cal") || key.includes("agenda")) return "text-purple-500";
  if (key.includes("urg") || key.includes("crit") || key.includes("atras")) return "text-rose-500";
  if (key.includes("pend") || key.includes("abert")) return "text-sky-500";
  if (key.includes("concl") || key.includes("final") || key.includes("won")) return "text-emerald-500";
  return "text-muted-foreground";
}

export function WorkspaceCanonicalToolbar({
  tabs,
  viewModes,
  activeTab,
  activeViewMode,
  onTabChange,
  onViewModeChange,
  searchPlaceholder = "Buscar...",
  searchValue,
  searchQuery,
  onSearchChange,
  filters,
  filterSlot,
  onOpenDashboard,
  onMetricsClick,
  dashboardLabel = "Métricas",
  metricsBadge,
  hasActiveMetrics = true,
  onConfigureColumns,
  onColumnsClick,
  secondaryAction,
  secondaryActions,
  primaryAction,
  className,
}: WorkspaceCanonicalToolbarProps) {
  const effectiveTabs = tabs || viewModes || [];
  const currentActive = activeTab || activeViewMode;
  const handleTabSelect = onTabChange || onViewModeChange;
  const effectiveSearch = searchValue !== undefined ? searchValue : searchQuery;

  const handleDashboard = onOpenDashboard || onMetricsClick;
  const handleColumns = onConfigureColumns || onColumnsClick;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-1 min-h-[44px] select-none",
        className
      )}
    >
      {/* ── LADO ESQUERDO: Abas Semiarredondadas, Busca & Filtros ── */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap flex-1 min-w-0">
        {/* 1. Menu de Abas / View Switcher Semiarredondado (Padrão Apple HIG & Tarefas) */}
        {effectiveTabs.length > 0 && (
          <div className="flex items-center p-1 rounded-2xl bg-muted/40 border border-border/60 shrink-0 gap-0.5 overflow-x-auto no-scrollbar max-w-full">
            {effectiveTabs.map((item) => {
              const Icon = item.icon;
              const isActive = currentActive === item.id;
              const iconColor = getSemanticIconColor(item.id, item.iconColor);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleTabSelect?.(item.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    isActive
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActive ? iconColor : "text-muted-foreground"
                      )}
                    />
                  )}
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "ml-1 text-[10px] px-1.5 py-0 h-4 font-mono leading-none border-border/40",
                        isActive ? "bg-muted text-foreground" : "bg-muted/60 text-muted-foreground"
                      )}
                    >
                      {item.count}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 2. Campo de Busca com Lupa Integrada */}
        {onSearchChange && (
          <div className="relative flex-1 max-w-xs min-w-[160px]">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              value={effectiveSearch || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-9 pl-8 pr-3 text-xs rounded-xl bg-card border-border/60 placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary w-full"
            />
          </div>
        )}

        {/* 3. Filtros Dropdown Estruturados */}
        {filters && filters.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            {filters.map((f) => (
              <Select key={f.id} value={f.value} onValueChange={f.onChange}>
                <SelectTrigger className="h-9 px-3 text-xs rounded-xl bg-card border-border/60 font-medium min-w-[130px]">
                  <SelectValue placeholder={f.label} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {f.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} className="text-xs rounded-lg">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}

        {/* 4. Slot Contextual Adicional */}
        {filterSlot && <div className="flex items-center gap-1.5 shrink-0">{filterSlot}</div>}
      </div>

      {/* ── LADO DIREITO: Métricas, Colunas, Secundárias & Primária ── */}
      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0 justify-start sm:justify-end w-full sm:w-auto">
        {/* Botão de Colunas do Kanban */}
        {handleColumns && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleColumns}
            className="h-9 px-2.5 rounded-xl text-xs font-semibold border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60 gap-1.5 cursor-pointer shadow-none"
            title="Personalizar Colunas do Kanban"
          >
            <Settings2 className="size-3.5 text-muted-foreground" />
            <span className="hidden md:inline">Colunas</span>
          </Button>
        )}

        {/* Botão de Métricas & Dashboard Sob Demanda */}
        {handleDashboard && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDashboard}
            className="h-9 px-3 rounded-xl text-xs font-semibold border-border/70 text-foreground hover:bg-muted/60 gap-1.5 cursor-pointer shadow-none relative"
          >
            <BarChart3 className="size-3.5 text-primary" />
            <span>{dashboardLabel}</span>
            {metricsBadge ? (
              <span className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded-md border border-border/50 text-foreground">
                {metricsBadge}
              </span>
            ) : hasActiveMetrics ? (
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            ) : null}
          </Button>
        )}

        {/* Ações Secundárias */}
        {secondaryAction && (
          <Button
            type="button"
            variant={secondaryAction.variant || "outline"}
            size="sm"
            onClick={secondaryAction.onClick}
            className="h-9 px-3 rounded-xl text-xs font-semibold border-border/70 text-foreground hover:bg-muted/60 gap-1.5 cursor-pointer shadow-none"
          >
            {secondaryAction.icon && <secondaryAction.icon className="size-3.5" />}
            <span>{secondaryAction.label}</span>
          </Button>
        )}

        {secondaryActions &&
          secondaryActions.map((act, i) => (
            <Button
              key={i}
              type="button"
              variant={act.variant || "outline"}
              size="sm"
              onClick={act.onClick}
              className="h-9 px-3 rounded-xl text-xs font-semibold border-border/70 text-foreground hover:bg-muted/60 gap-1.5 cursor-pointer shadow-none"
            >
              {act.icon && <act.icon className="size-3.5" />}
              <span>{act.label}</span>
            </Button>
          ))}

        {/* Ação Primária da Tela */}
        {React.isValidElement(primaryAction) ? (
          primaryAction
        ) : primaryAction && typeof primaryAction === "object" && "label" in primaryAction ? (
          <Button
            type="button"
            size="sm"
            onClick={(primaryAction as WorkspaceCanonicalAction).onClick}
            className="h-9 px-3.5 rounded-xl text-xs font-bold bg-foreground text-background hover:bg-foreground/90 gap-1.5 cursor-pointer shadow-none"
          >
            {(primaryAction as WorkspaceCanonicalAction).icon &&
              React.createElement((primaryAction as WorkspaceCanonicalAction).icon!, { className: "size-3.5" })}
            <span>{(primaryAction as WorkspaceCanonicalAction).label}</span>
          </Button>
        ) : null}
      </div>
    </div>
  );
}
