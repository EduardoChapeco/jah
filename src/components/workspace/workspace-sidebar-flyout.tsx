import { useState, useRef, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavGroup, NavItem } from "@/lib/workspace-navigation";

interface WorkspaceSidebarFlyoutProps {
  group: NavGroup;
  currentPath: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isMobile?: boolean;
}

export function WorkspaceSidebarFlyout({
  group,
  currentPath,
  isExpanded,
  onToggleExpand,
  isMobile = false,
}: WorkspaceSidebarFlyoutProps) {
  const [isFlyoutOpen, setIsFlyoutOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isGroupActive = group.items.some((item) =>
    item.path === "/workspace"
      ? currentPath === "/workspace"
      : currentPath.startsWith(item.path)
  );

  const Icon = group.icon;

  // Fechamento com delay suave no mouseLeave
  const handleMouseEnter = () => {
    if (isMobile) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsFlyoutOpen(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    timeoutRef.current = setTimeout(() => {
      setIsFlyoutOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // No mobile, usamos o accordion nativo simples e direto
  if (isMobile) {
    return (
      <div className="space-y-0.5">
        <button
          type="button"
          onClick={onToggleExpand}
          className={cn(
            "flex w-full items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
            isGroupActive
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          )}
        >
          <div className="flex items-center gap-2.5">
            <Icon className="size-4 shrink-0" />
            <span>{group.label}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
        </button>

        {isExpanded && (
          <div className="ml-3 pl-3 space-y-0.5 pt-0.5 border-l border-border/40">
            {group.items.map((item) => {
              const isItemActive =
                item.path === "/workspace"
                  ? currentPath === "/workspace"
                  : currentPath.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors",
                    isItemActive
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // No Desktop: Accordion + Flyout Flutuante à Direita (Padrão Meta Studio)
  return (
    <div
      className="relative space-y-0.5"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={flyoutRef}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className={cn(
          "group flex w-full items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer relative",
          isGroupActive
            ? "text-primary bg-primary/8 shadow-2xs font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          isFlyoutOpen && "bg-muted/80 text-foreground"
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={cn(
              "size-4 shrink-0 transition-colors",
              isGroupActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span className="truncate">{group.label}</span>
        </div>
        <ChevronRight
          className={cn(
            "size-3 text-muted-foreground transition-transform duration-200",
            isFlyoutOpen && "translate-x-0.5 text-foreground",
            isExpanded && "rotate-90"
          )}
        />
      </button>

      {/* Accordion Expandido Inline (Quando o lojista prefere manter aberto fixo) */}
      {isExpanded && (
        <div className="ml-3 pl-2.5 space-y-0.5 pt-0.5 border-l border-border/40">
          {group.items.map((item) => {
            const isItemActive =
              item.path === "/workspace"
                ? currentPath === "/workspace"
                : currentPath.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  isItemActive
                    ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                )}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Flyout Flutuante à Direita (Hover / Meta Studio Padrão - Apenas quando recolhido) */}
      {isFlyoutOpen && !isExpanded && (
        <div
          className="absolute left-full top-0 ml-2 w-56 rounded-2xl border border-border/80 bg-background/98 backdrop-blur-xl shadow-xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150"
          style={{ minWidth: "220px" }}
        >
          <div className="px-2.5 py-1.5 pb-2 border-b border-border/40 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground block">
              {group.label}
            </span>
          </div>

          <div className="space-y-0.5">
            {group.items.map((item) => {
              const isItemActive =
                item.path === "/workspace"
                  ? currentPath === "/workspace"
                  : currentPath.startsWith(item.path);

              const ItemIcon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsFlyoutOpen(false)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer",
                    isItemActive
                      ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  {ItemIcon && <ItemIcon className="size-3.5 shrink-0 opacity-80" />}
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
