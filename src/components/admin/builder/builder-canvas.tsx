import * as React from "react";
import { Plus, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export type ViewportMode = "desktop" | "mobile" | "story";

export interface BuilderCanvasProps {
  viewport: ViewportMode | string;
  nodesCount: number;
  treeNodes: any[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  onAddSection: () => void;
}

export function BuilderCanvas({
  viewport,
  nodesCount,
  treeNodes,
  selectedNodeId,
  setSelectedNodeId,
  onAddSection,
}: BuilderCanvasProps) {
  const getViewportLabel = () => {
    if (viewport === "desktop") return "Desktop — 1440px";
    if (viewport === "story") return "Story / Zine — 9:16 (360x640px)";
    return "Mobile — 390px";
  };

  return (
    <main className="flex-1 overflow-y-auto bg-muted flex flex-col items-center">
      {/* Viewport indicator */}
      <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-muted w-full">
        <Badge
          variant="outline"
          className="text-muted-foreground border-border text-[10px] bg-background/50 backdrop-blur"
        >
          {getViewportLabel()}
        </Badge>
      </div>

      {/* Canvas frame */}
      <div
        className={cn(
          "bg-background relative transition-all duration-300 mb-8 flex flex-col shadow-xl",
          viewport === "desktop" && "w-full max-w-[1280px] min-h-[calc(100vh-140px)] rounded-xl overflow-hidden",
          viewport === "mobile" && "w-[390px] h-[780px] rounded-[3rem] border-[8px] border-foreground/20 overflow-hidden",
          viewport === "story" && "w-[360px] h-[640px] rounded-3xl border-[6px] border-primary/40 overflow-hidden",
        )}
        onClick={() => setSelectedNodeId(null)}
      >
        {/* Scrollable content wrapper */}
        <div className="@container flex-1 overflow-y-auto overflow-x-hidden w-full h-full flex flex-col bg-background">
          {nodesCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <LayoutTemplate className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div className="max-w-xs mb-4">
                <p className="font-medium text-foreground text-sm">Sua página está vazia</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Comece adicionando uma seção pré-montada.
                </p>
              </div>
              <Button onClick={onAddSection} size="lg" className="rounded-full">
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Primeira Seção
              </Button>
            </div>
          ) : (
            <div className="flex flex-col min-h-full">
              <ExperienceRenderer
                nodes={treeNodes}
                isEditing
                selectedNodeId={selectedNodeId}
                onSelectNode={(id: string) => {
                  // Prevent bubbling to outer container which would clear selection
                  setSelectedNodeId(id);
                }}
              />

              {/* Add Section Button at the bottom of the canvas */}
              <div className="py-12 flex justify-center w-full mt-auto bg-muted/30 border-t border-dashed border-border">
                <Button
                  onClick={onAddSection}
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-background hover:bg-muted transition-colors border-border"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Adicionar Nova Seção
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
