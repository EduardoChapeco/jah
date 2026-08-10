import * as React from "react";
import { Plus, LayoutTemplate } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ExperienceRenderer } from "@/components/commerce/experience-renderer";

export type ViewportMode = "desktop" | "mobile";

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
  return (
    <main className="flex-1 overflow-y-auto bg-[#0d0d0d] flex flex-col items-center">
      {/* Viewport indicator */}
      <div className="sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#0d0d0d] w-full">
        <Badge
          variant="outline"
          className="text-white/40 border-white/10 text-[10px] bg-transparent"
        >
          {viewport === "desktop" ? "Desktop — 1440px" : "Mobile — 390px"}
        </Badge>
      </div>

      {/* Canvas frame */}
      <div
        className={cn(
          "bg-white relative transition-all duration-300 mb-8 flex flex-col shadow-2xl",
          viewport === "desktop"
            ? "w-full max-w-[1280px] min-h-[calc(100vh-140px)] rounded-xl overflow-hidden"
            : "w-[390px] h-[780px] rounded-[3rem] border-[12px] border-[#222] overflow-hidden",
        )}
        onClick={() => setSelectedNodeId(null)}
      >
        {/* Scrollable content wrapper */}
        <div className="@container flex-1 overflow-y-auto overflow-x-hidden w-full h-full flex flex-col bg-white">
          {nodesCount === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-gray-400 gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                <LayoutTemplate className="h-8 w-8 text-gray-300" />
              </div>
              <div className="max-w-xs mb-4">
                <p className="font-semibold text-gray-600 text-sm">Sua página está vazia</p>
                <p className="text-xs text-gray-400 mt-1">
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
              <div className="py-12 flex justify-center w-full mt-auto bg-gray-50/50 border-t border-dashed border-gray-200">
                <Button
                  onClick={onAddSection}
                  variant="outline"
                  size="lg"
                  className="rounded-full bg-white shadow-sm hover:shadow-md transition-shadow border-gray-300"
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
