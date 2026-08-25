import * as React from "react";
import { useState } from "react";
import {
  Plus,
  ImageIcon,
  ShoppingBag,
  AlignLeft,
  Star,
  Zap,
  Store,
  Grid,
  Columns2,
  Megaphone,
  MessageSquare,
  Timer,
  Shield,
  LayoutTemplate,
  ListOrdered,
  Map,
  Video,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Trash2,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { builderRegistry } from "@/lib/builder-registry";

// ─── Block Category Definitions ────────────────────────────────────────────────

export const BLOCK_CATEGORIES = [
  {
    id: "hero",
    label: "Hero & Banners",
    icon: ImageIcon,
    blocks: ["hero_carousel", "split_banner", "announcement_bar", "mosaic_banners"],
  },
  {
    id: "products",
    label: "Produtos",
    icon: ShoppingBag,
    blocks: ["product_carousel", "product_grid", "product_rail"],
  },
  {
    id: "content",
    label: "Conteúdo",
    icon: AlignLeft,
    blocks: [
      "rich_text",
      "info_cards",
      "bento_grid",
      "gallery_grid",
      "video_section",
      "timeline_history",
    ],
  },
  {
    id: "social",
    label: "Social & Comunidade",
    icon: Star,
    blocks: ["testimonial_carousel", "stories_ring", "social_grid"],
  },
  {
    id: "conversion",
    label: "Conversão",
    icon: Zap,
    blocks: ["countdown_timer", "trust_badges", "faq_accordion", "contact_form"],
  },
  {
    id: "store_profile",
    label: "Perfil da Loja",
    icon: Store,
    blocks: ["store_profile_hero", "store_hours", "store_contact"],
  },
  {
    id: "media",
    label: "Mídia Interativa",
    icon: SlidersHorizontal,
    blocks: ["before_after_slider", "image_hotspots", "routine_steps", "ingredient_spotlight"],
  },
];

// Pre-built sections that insert a full (section + container + block) group
export const SECTION_PRESETS = [
  {
    id: "hero",
    label: "Hero Principal",
    description: "Banner de destaque com imagem e CTA",
    icon: ImageIcon,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container", "hero_carousel"],
  },
  {
    id: "product_carousel",
    label: "Carrossel de Produtos",
    description: "Produtos reais em carrossel deslizante",
    icon: ShoppingBag,
    color: "bg-muted/40 border-border",
    iconColor: "text-primary",
    blocks: ["section", "container", "product_carousel"],
  },
  {
    id: "product_grid",
    label: "Grid de Produtos",
    description: "Grade de produtos 2, 3 ou 4 colunas",
    icon: Grid,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container", "product_grid"],
  },
  {
    id: "split_banner",
    label: "Banner Dividido 50/50",
    description: "Imagem de um lado, texto do outro",
    icon: Columns2,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container_full", "split_banner"],
  },
  {
    id: "announcement_bar",
    label: "Barra de Anúncio",
    description: "Faixa de aviso/promoção no topo",
    icon: Megaphone,
    color: "bg-muted/40 border-border",
    iconColor: "text-warning",
    blocks: ["section", "container", "announcement_bar"],
  },
  {
    id: "testimonials",
    label: "Depoimentos",
    description: "Carrossel de avaliações de clientes",
    icon: MessageSquare,
    color: "bg-muted/40 border-border",
    iconColor: "text-accent",
    blocks: ["section", "container", "testimonial_carousel"],
  },
  {
    id: "countdown",
    label: "Cronômetro Regressivo",
    description: "Timer para ofertas com prazo",
    icon: Timer,
    color: "bg-muted/40 border-border",
    iconColor: "text-destructive",
    blocks: ["section", "container", "countdown_timer"],
  },
  {
    id: "trust_badges",
    label: "Selos de Confiança",
    description: "Badges de garantia, frete, segurança",
    icon: Shield,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container", "trust_badges"],
  },
  {
    id: "bento",
    label: "Bento Grid",
    description: "Mosaico assimétrico de cards",
    icon: LayoutTemplate,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container", "bento_grid"],
  },
  {
    id: "gallery",
    label: "Galeria de Imagens",
    description: "Grade editorial de fotos",
    icon: ImageIcon,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container", "gallery_grid"],
  },
  {
    id: "faq",
    label: "FAQ",
    description: "Perguntas e respostas em accordion",
    icon: ListOrdered,
    color: "bg-muted/40 border-border",
    iconColor: "text-muted-foreground",
    blocks: ["section", "container", "faq_accordion"],
  },
  {
    id: "timeline",
    label: "Timeline / História",
    description: "Linha do tempo da marca",
    icon: Map,
    color: "bg-muted/40 border-border",
    iconColor: "text-foreground",
    blocks: ["section", "container", "timeline_history"],
  },
  {
    id: "video",
    label: "Vídeo Embed",
    description: "YouTube ou Vimeo incorporado",
    icon: Video,
    color: "bg-muted/40 border-border",
    iconColor: "text-destructive",
    blocks: ["section", "container", "video_section"],
  },
  {
    id: "rich_text",
    label: "Texto Rico",
    description: "Bloco de conteúdo editorial HTML",
    icon: AlignLeft,
    color: "bg-muted/40 border-border",
    iconColor: "text-muted-foreground",
    blocks: ["section", "container", "rich_text"],
  },
];

export type LeftPanelTab = "blocks" | "layers";

export interface BuilderLeftPanelProps {
  activePanel: LeftPanelTab | string;
  setActivePanel: (tab: any) => void;
  blockCategory: string;
  setBlockCategory: (cat: string) => void;
  insertBlock: (type: string) => void;
  nodes: any[];
  treeNodes: any[];
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;
  moveNode: (id: string, direction: any, e: any) => void;
  deleteNode: (id: string, e: any) => void;
  reorderNodeAbsolute: (sourceId: string, targetId: string) => void;
  onAddSection: () => void;
}

export function BuilderLeftPanel({
  activePanel,
  setActivePanel,
  blockCategory,
  setBlockCategory,
  insertBlock,
  nodes,
  treeNodes,
  selectedNodeId,
  setSelectedNodeId,
  moveNode,
  deleteNode,
  reorderNodeAbsolute,
  onAddSection,
}: BuilderLeftPanelProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  const renderLayer = (
    node: { id: string; block_type: string; children?: any[] },
    depth = 0,
  ): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const isDragged = draggedNodeId === node.id;
    const isDragOver = dragOverNodeId === node.id;
    const reg = builderRegistry[node.block_type];

    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedNodeId(node.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", node.id);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (draggedNodeId && draggedNodeId !== node.id) {
              setDragOverNodeId(node.id);
            }
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dragOverNodeId === node.id) setDragOverNodeId(null);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOverNodeId(null);
            if (draggedNodeId && draggedNodeId !== node.id) {
              reorderNodeAbsolute(draggedNodeId, node.id);
            }
            setDraggedNodeId(null);
          }}
          onDragEnd={() => {
            setDraggedNodeId(null);
            setDragOverNodeId(null);
          }}
          className={cn(
            "flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-sm cursor-grab active:cursor-grabbing transition-colors group select-none relative",
            isSelected
              ? "bg-primary/10 text-primary font-medium"
              : "hover:bg-muted text-muted-foreground hover:text-foreground",
            isDragged && "opacity-50",
            isDragOver && "border-t-2 border-t-primary", // Feedback visual simples de drop
          )}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          <GripVertical className="h-3 w-3 opacity-30 shrink-0" />
          <span className="truncate flex-1 text-xs">{reg?.name ?? node.block_type}</span>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={(e) => moveNode(node.id, -1, e)}
            >
              <ChevronUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
              onClick={(e) => moveNode(node.id, 1, e)}
            >
              <ChevronDown className="h-3 w-3" />
            </button>
            <button
              type="button"
              className="p-0.5 rounded hover:bg-destructive/20 text-destructive"
              onClick={(e) => deleteNode(node.id, e)}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
        {node.children && node.children.length > 0 && (
          <div>{node.children.map((c) => renderLayer(c, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-72 surface-paper  flex flex-col flex-none overflow-hidden rounded-none border-t-0 border-l-0 border-b-0">
      {/* Panel Tabs */}
      <div className="flex  bg-muted/30">
        {(["layers", "blocks"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            onClick={() => setActivePanel(tab)}
            className={cn(
              "flex-1 py-2.5 text-[11px] font-medium uppercase tracking-wide transition-colors",
              activePanel === tab
                ? "text-foreground border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "layers" ? "Camadas" : "Blocos (Studio)"}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        {/* BLOCKS: Categorized block picker */}
        {activePanel === "blocks" && (
          <div className="flex flex-col">
            <div className="p-4 ">
              <button
                type="button"
                onClick={onAddSection}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium py-2.5 px-4 transition-all"
              >
                <LayoutTemplate className="h-4 w-4" />
                Catálogo de Seções
              </button>
              <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
                Recomendado: Use o catálogo para adicionar seções completas prontas para edição
                (Modo Guiado).
              </p>
            </div>

            <div className="px-4 py-3 bg-muted/50 ">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Montagem Granular (Avançado)
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-col gap-0.5 p-2 ">
              {BLOCK_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setBlockCategory(cat.id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors text-left",
                      blockCategory === cat.id
                        ? "bg-muted text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
            {/* Block items */}
            <div className="p-3 grid grid-cols-2 gap-2">
              {(BLOCK_CATEGORIES.find((c) => c.id === blockCategory)?.blocks ?? []).map(
                (blockType) => {
                  const reg = builderRegistry[blockType];
                  if (!reg) return null;
                  return (
                    <button
                      type="button"
                      key={blockType}
                      onClick={() => insertBlock(blockType)}
                      className="flex flex-col items-center gap-2 p-3 bg-muted/30 hover:bg-muted border border-transparent hover:border-border rounded-lg transition-colors text-center"
                    >
                      <div className="w-10 h-10 bg-background  rounded-md flex items-center justify-center">
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-muted-foreground text-[10px] font-medium leading-tight group-hover:text-foreground">
                        {reg.name}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* LAYERS: DOM tree */}
        {activePanel === "layers" && (
          <div className="p-3">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider px-1 mb-3">
              Árvore do Documento
            </p>
            {nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground/60 text-xs space-y-2">
                <Layers className="h-8 w-8 mx-auto opacity-30" />
                <p>O documento está vazio.</p>
                <p>Use o botão "Adicionar Seção" no painel principal.</p>
              </div>
            ) : (
              <div className="space-y-0.5">{treeNodes.map((node) => renderLayer(node, 0))}</div>
            )}
          </div>
        )}
      </ScrollArea>
    </aside>
  );
}
