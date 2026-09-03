import * as React from "react";
import { Plus, LayoutTemplate, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";
import { BuilderFloatingActionBar } from "./builder-floating-action-bar";

export type ViewportMode = "desktop" | "mobile" | "story";

export interface BuilderCanvasProps {
  viewport: ViewportMode | string;
  nodesCount: number;
  treeNodes: any[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  onAddSection: () => void;
  onEditContent?: () => void;
  onChangeLayout?: () => void;
  onDuplicateNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onMoveNode?: (nodeId: string, dir: -1 | 1) => void;
  pageSlug?: string;
}

export function BuilderCanvas({
  viewport,
  nodesCount,
  treeNodes,
  selectedNodeId,
  setSelectedNodeId,
  onAddSection,
  onEditContent,
  onChangeLayout,
  onDuplicateNode,
  onDeleteNode,
  onMoveNode,
  pageSlug = "vitrine",
}: BuilderCanvasProps) {
  // Encontra o nó selecionado para alimentar a Floating Action Bar
  const findNodeById = (id: string, list: any[]): any | null => {
    for (const item of list) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findNodeById(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedNode = selectedNodeId ? findNodeById(selectedNodeId, treeNodes) : null;

  return (
    <main
      className="flex-1 overflow-y-auto bg-muted/30 flex flex-col items-center select-none relative px-3 sm:px-6 py-4 scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      onClick={() => setSelectedNodeId(null)}
    >
      {/* ── Barra de Ações Flutuante (Floating Action Bar - Editor X Standard) ── */}
      {selectedNode && (
        <div className="sticky top-2 z-30 flex justify-center w-full pointer-events-auto mb-3">
          <BuilderFloatingActionBar
            selectedNode={selectedNode}
            onEditContent={() => onEditContent?.()}
            onChangeLayout={() => onChangeLayout?.()}
            onDuplicate={() => onDuplicateNode?.(selectedNode.id)}
            onDelete={() => onDeleteNode?.(selectedNode.id)}
            onMoveUp={() => onMoveNode?.(selectedNode.id, -1)}
            onMoveDown={() => onMoveNode?.(selectedNode.id, 1)}
          />
        </div>
      )}

      {/* ── 1. FRAME DE VISUALIZAÇÃO REAL: DESKTOP (JANELA DE NAVEGADOR PROFISSIONAL) ── */}
      {viewport === "desktop" && (
        <div
          className="w-full max-w-[1360px] min-h-[calc(100vh-130px)] bg-card border border-border/80 rounded-xl shadow-2xl overflow-hidden flex flex-col mb-10 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Chrome / Top Bar da Janela do Navegador */}
          <div className="h-10 px-4 bg-muted/60 dark:bg-muted/30 border-b border-border/70 flex items-center justify-between select-none shrink-0">
            {/* Semáforo de Controle de Janela (Mac / Browser Style) */}
            <div className="flex items-center gap-2 w-24">
              <span className="size-3 rounded-full bg-[#ff5f56] border border-black/10 inline-block shadow-2xs" />
              <span className="size-3 rounded-full bg-[#ffbd2e] border border-black/10 inline-block shadow-2xs" />
              <span className="size-3 rounded-full bg-[#27c93f] border border-black/10 inline-block shadow-2xs" />
            </div>

            {/* Barra de Endereços / URL da Loja */}
            <div className="flex-1 max-w-sm mx-auto flex items-center justify-center">
              <div className="w-full bg-background/90 border border-border/70 rounded-lg px-3 py-1 text-[11px] font-mono text-muted-foreground flex items-center justify-center gap-1.5 shadow-2xs">
                <Lock className="size-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate font-sans font-medium text-foreground/80">
                  wider.app/{pageSlug || "vitrine"}
                </span>
              </div>
            </div>

            {/* Resolução do Viewport */}
            <div className="flex items-center justify-end gap-1.5 w-24">
              <span className="px-2 py-0.5 rounded-md bg-background/80 border border-border/60 text-[10px] font-mono text-muted-foreground">
                1440 × 900
              </span>
            </div>
          </div>

          {/* Viewport Retangular Reto Real (Zero Bordas Curvas no Conteúdo da Página) */}
          <div className="@container flex-1 overflow-y-auto overflow-x-hidden w-full h-full flex flex-col bg-background scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {nodesCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[440px] text-muted-foreground gap-4 p-8 text-center">
                <div className="size-16 rounded-2xl bg-muted/60 flex items-center justify-center border border-border/60">
                  <LayoutTemplate className="size-8 text-primary" />
                </div>
                <div className="max-w-xs space-y-1">
                  <p className="font-bold text-foreground text-sm">Sua vitrine está pronta para ser montada</p>
                  <p className="text-xs text-muted-foreground">
                    Escolha uma seção pré-configurada ou monte seus blocos visualmente.
                  </p>
                </div>
                <Button
                  onClick={onAddSection}
                  size="lg"
                  className="rounded-xl font-bold text-xs gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                >
                  <Plus className="size-4" />
                  <span>Adicionar Primeira Seção</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col min-h-full">
                <ExperienceRenderer
                  nodes={treeNodes}
                  isEditing
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id: string) => setSelectedNodeId(id)}
                />

                {/* Botão de Adicionar Seção no Final da Página */}
                <div className="py-12 flex justify-center w-full mt-auto bg-muted/10 border-t border-dashed border-border/80">
                  <Button
                    onClick={onAddSection}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-2 bg-background hover:bg-muted border-border/80 cursor-pointer shadow-2xs"
                  >
                    <Plus className="size-3.5 text-primary" />
                    <span>Adicionar Nova Seção</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. FRAME DE VISUALIZAÇÃO REAL: MOBILE (SMARTPHONE MOCKUP) ── */}
      {viewport === "mobile" && (
        <div
          className="w-[390px] h-[820px] rounded-[48px] border-[10px] border-neutral-900 dark:border-neutral-800 shadow-2xl bg-background overflow-hidden flex flex-col my-4 relative shrink-0 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Dynamic Island / Alto-Falante */}
          <div className="h-7 bg-neutral-900 dark:bg-neutral-800 flex items-center justify-center pt-1 shrink-0 z-20 select-none">
            <div className="w-24 h-4 bg-black rounded-full flex items-center justify-end px-2">
              <div className="size-2 rounded-full bg-neutral-800" />
            </div>
          </div>

          {/* Viewport Interno Mobile */}
          <div className="@container flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col bg-background scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {nodesCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[380px] text-muted-foreground gap-3 p-6 text-center">
                <LayoutTemplate className="size-8 text-primary" />
                <p className="font-bold text-foreground text-xs">Página sem seções</p>
                <Button
                  onClick={onAddSection}
                  size="sm"
                  className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Plus className="size-3.5" />
                  <span>Adicionar Seção</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col min-h-full">
                <ExperienceRenderer
                  nodes={treeNodes}
                  isEditing
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id: string) => setSelectedNodeId(id)}
                />

                <div className="py-8 flex justify-center w-full mt-auto bg-muted/10 border-t border-dashed border-border/80">
                  <Button
                    onClick={onAddSection}
                    variant="outline"
                    size="sm"
                    className="rounded-xl text-xs font-bold gap-1.5 bg-background"
                  >
                    <Plus className="size-3.5 text-primary" />
                    <span>Adicionar Seção</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Home Indicator Bar */}
          <div className="h-5 bg-background flex items-center justify-center pb-1 shrink-0 z-20 select-none">
            <div className="w-28 h-1 bg-foreground/30 rounded-full" />
          </div>
        </div>
      )}

      {/* ── 3. FRAME DE VISUALIZAÇÃO REAL: STORY / ZINE (9:16) ── */}
      {viewport === "story" && (
        <div
          className="w-[360px] h-[640px] rounded-[36px] border-[8px] border-neutral-900 dark:border-neutral-800 shadow-2xl bg-background overflow-hidden flex flex-col my-4 relative shrink-0 transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Story Progress Bars */}
          <div className="h-6 bg-neutral-900 flex items-center px-4 gap-1.5 pt-1.5 shrink-0 z-20 select-none">
            <div className="h-1 flex-1 bg-white/40 rounded-full overflow-hidden">
              <div className="h-full bg-white w-2/3" />
            </div>
            <div className="h-1 flex-1 bg-white/20 rounded-full" />
            <div className="h-1 flex-1 bg-white/20 rounded-full" />
          </div>

          {/* Viewport Interno Story */}
          <div className="@container flex-1 overflow-y-auto overflow-x-hidden w-full flex flex-col bg-background scrollbar-none no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {nodesCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-muted-foreground gap-3 p-6 text-center">
                <LayoutTemplate className="size-8 text-primary" />
                <p className="font-bold text-foreground text-xs">Story sem blocos</p>
                <Button
                  onClick={onAddSection}
                  size="sm"
                  className="rounded-xl font-bold text-xs gap-1.5 bg-primary text-primary-foreground"
                >
                  <Plus className="size-3.5" />
                  <span>Adicionar Bloco</span>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col min-h-full">
                <ExperienceRenderer
                  nodes={treeNodes}
                  isEditing
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id: string) => setSelectedNodeId(id)}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
